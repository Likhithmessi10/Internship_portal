const prisma = require('../lib/prisma');
const { STATUS, canTransition } = require('../domain/workflow/applicationStateMachine');

const normalize = (s = '') => String(s).toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const tokenize = (s = '') => normalize(s).split(' ').filter(Boolean);
const tokenSimilarity = (a = '', b = '') => {
    const aSet = new Set(tokenize(a));
    const bSet = new Set(tokenize(b));
    if (aSet.size === 0 || bSet.size === 0) return 0;
    let inter = 0;
    aSet.forEach(t => { if (bSet.has(t)) inter += 1; });
    const union = new Set([...aSet, ...bSet]).size;
    return union > 0 ? inter / union : 0;
};

const isPreferredCollege = (collegeName = '', preferredColleges = []) => {
    if (!collegeName || !Array.isArray(preferredColleges) || preferredColleges.length === 0) return false;
    const target = normalize(collegeName).replace(/\s/g, '');
    return preferredColleges.some(pref => {
        const p = normalize(pref).replace(/\s/g, '');
        if (!p) return false;
        if (target.includes(p) || p.includes(target)) return true;
        if (tokenSimilarity(collegeName, pref) >= 0.5) return true;
        return false;
    });
};

const getApplicationBucket = (application, internship) => {
    const preferredColleges = internship?.preferredColleges || [];
    const collegeName = application?.student?.collegeName || '';
    const category = (application?.student?.collegeCategory || '').toUpperCase();
    if (isPreferredCollege(collegeName, preferredColleges)) return 'PREFERRED';
    if (category === 'IIT' || category === 'NIT') return 'PREMIER';
    return 'REGULAR';
};

const getSeatCaps = (openingsCount = 0, quotaPercentages = {}) => {
    const openings = Math.max(0, Number(openingsCount || 0));
    const preferredPct = Math.max(0, Number(quotaPercentages?.preferred || 0));
    const premierPct = Math.max(0, Number(quotaPercentages?.premier || 0));
    const preferredCap = Math.floor((openings * preferredPct) / 100);
    const premierCap = Math.floor((openings * premierPct) / 100);
    const regularCap = Math.max(0, openings - preferredCap - premierCap);
    return { PREFERRED: preferredCap, PREMIER: premierCap, REGULAR: regularCap };
};

/**
 * atomic application status transition with validation and audit trail
 */
const transitionApplicationStatus = async (applicationId, toStatus, user, auditDetails = '', existingTx = null) => {
    const logic = async (tx) => {
        // 1. Fetch current application and its internship boundaries
        const application = await tx.application.findUnique({
            where: { id: applicationId },
            include: {
                internship: true,
                departmentGroup: true,
                student: {
                    select: {
                        collegeName: true,
                        collegeCategory: true
                    }
                }
            }
        });

        if (!application) {
            throw new Error('Application not found');
        }

        // 2. Validate transition against state machine
        if (!canTransition(application.status, toStatus, user.role)) {
            throw new Error(`Invalid status transition from ${application.status} to ${toStatus} for role ${user.role}`);
        }

        // 3. Seat Limit Enforcement (Requirement 3: Fix approval race condition)
        const SEAT_CONSUMING = [STATUS.APPROVED, STATUS.HIRED, STATUS.ONGOING];
        
        // If moving TO a seat-consuming status FROM a non-consuming one
        if (SEAT_CONSUMING.includes(toStatus) && !SEAT_CONSUMING.includes(application.status)) {
            // Determine active entity (group vs parent)
            const targetEntity = application.departmentGroup || application.internship;
            const targetOpenings = targetEntity.openings ?? targetEntity.openingsCount;

            const activeCount = await tx.application.count({
                where: {
                    ...(application.departmentGroup 
                        ? { departmentGroupId: application.departmentGroupId } 
                        : { internshipId: application.internshipId, departmentGroupId: null }),
                    status: { in: SEAT_CONSUMING }
                }
            });

            if (activeCount >= targetOpenings) {
                throw new Error(`Allocation Failed: No seats remaining. All ${targetOpenings} slots are filled for this role/department.`);
            }

            // Enforce category quotas from internship creation (preferred/premier/regular)
            const caps = getSeatCaps(targetOpenings, targetEntity.quotaPercentages || {});
            const targetBucket = getApplicationBucket(application, targetEntity);
            const targetCap = caps[targetBucket] ?? 0;

            if (targetCap <= 0) {
                throw new Error(`Allocation Failed: No seats allocated for ${targetBucket} category as per configured distribution.`);
            }

            const activeApps = await tx.application.findMany({
                where: {
                    ...(application.departmentGroup 
                        ? { departmentGroupId: application.departmentGroupId } 
                        : { internshipId: application.internshipId, departmentGroupId: null }),
                    status: { in: SEAT_CONSUMING }
                },
                include: {
                    student: {
                        select: {
                            collegeName: true,
                            collegeCategory: true
                        }
                    }
                }
            });

            const usedInBucket = activeApps.filter(a => getApplicationBucket(a, targetEntity) === targetBucket).length;
            if (usedInBucket >= targetCap) {
                throw new Error(
                    `Allocation Failed: ${targetBucket} quota is full (${usedInBucket}/${targetCap}). Approvals must follow configured seat distribution.`
                );
            }
        }

        // 4. Committee Scoring Completion Enforcement
        if ([STATUS.APPROVED, STATUS.REJECTED, STATUS.WAITLISTED].includes(toStatus) && application.status === STATUS.UNDER_COMMITTEE_REVIEW) {
            const criteriaCount = application.internship.evaluationCriteria?.length || 0;
            if (criteriaCount > 0) {
                const scores = await tx.evaluationScore.findMany({ where: { applicationId } });
                const roles = new Set(scores.map(s => s.role));
                
                // Must have HOD, Mentor, and some form of PRTI/Committee Member
                const hasPrti = roles.has('CE_PRTI') || roles.has('COMMITTEE_MEMBER');
                const hasHod = roles.has('HOD');
                const hasMentor = roles.has('MENTOR');

                if (!hasPrti || !hasHod || !hasMentor) {
                    throw new Error(`Incomplete Evaluation: Approval/Rejection requires scores from HOD, Mentor, and PRTI Representative. Missing roles: ${[!hasHod && 'HOD', !hasMentor && 'Mentor', !hasPrti && 'PRTI'].filter(Boolean).join(', ')}`);
                }
            }
        }

        // 5. Perform update
        const updated = await tx.application.update({
            where: { id: applicationId },
            data: {
                status: toStatus,
                ...(SEAT_CONSUMING.includes(toStatus) && !SEAT_CONSUMING.includes(application.status)
                    ? { shortlistCategory: getApplicationBucket(application, application.internship) }
                    : {})
            }
        });

        // 6. Create Audit Log
        await tx.auditLog.create({
            data: {
                action: 'STATUS_TRANSITION',
                userEmail: user.email,
                details: `Transitioned ${application.trackingId} from ${application.status} to ${toStatus}. ${auditDetails}`,
                target: applicationId
            }
        });

        return updated;
    };

    if (existingTx) {
        return await logic(existingTx);
    } else {
        return await prisma.$transaction(logic);
    }
};


module.exports = {
    transitionApplicationStatus,
    STATUS
};
