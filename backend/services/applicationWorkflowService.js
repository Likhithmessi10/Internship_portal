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

// Statuses that consume a seat allocation slot
// DOCUMENTS_PENDING/VERIFIED must be included so moving to docs stage doesn't free the seat
const SEAT_CONSUMING = [
    STATUS.SELECTED, STATUS.APPROVED, STATUS.REPORTED,
    STATUS.DOCUMENTS_PENDING, STATUS.DOCUMENTS_VERIFIED,
    STATUS.HIRED, STATUS.ONGOING
];

/**
 * Atomic application status transition with seat enforcement and audit trail.
 * Roll number is generated when transitioning TO REPORTED (physical reporting).
 */
const transitionApplicationStatus = async (applicationId, toStatus, user, auditDetails = '', existingTx = null) => {
    const logic = async (tx) => {
        const application = await tx.application.findUnique({
            where: { id: applicationId },
            include: {
                internship: {
                    include: { evaluationCriteria: true }
                },
                departmentGroup: true,
                problemStatement: true,
                student: {
                    select: { collegeName: true, collegeCategory: true }
                }
            }
        });

        if (!application) throw new Error('Application not found');

        if (!canTransition(application.status, toStatus, user.role, application.internship?.internshipType)) {
            throw new Error(
                `Invalid status transition from ${application.status} to ${toStatus} for role ${user.role}`
            );
        }

        // ── Seat Limit Enforcement ────────────────────────────────────────────
        if (SEAT_CONSUMING.includes(toStatus) && !SEAT_CONSUMING.includes(application.status)) {

            if (application.problemStatementId && application.problemStatement) {
                // Problem-statement-level seat check (GROUP internships)
                const psVacancies = application.problemStatement.vacancies || 0;
                const psCount = await tx.application.count({
                    where: {
                        problemStatementId: application.problemStatementId,
                        status: { in: SEAT_CONSUMING }
                    }
                });
                if (psCount >= psVacancies) {
                    throw new Error(
                        `Allocation Failed: All ${psVacancies} seats for "${application.problemStatement.title}" are filled.`
                    );
                }
            } else {
                // Department-group or internship-level seat check
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
                    throw new Error(
                        `Allocation Failed: No seats remaining. All ${targetOpenings} slots are filled for this role/department.`
                    );
                }

                // ── Per-location seat enforcement for NON_STIPEND ────────────
                const isNonStipend = application.internship?.internshipType === 'NON_STIPEND';
                if (isNonStipend && application.fieldId && application.preferredLocation) {
                    const field = await tx.internshipField.findUnique({ where: { id: application.fieldId } });
                    const locations = Array.isArray(field?.locations) ? field.locations : [];
                    const locObj = locations.find(l =>
                        (typeof l === 'string' ? l : l?.name) === application.preferredLocation
                    );
                    const locVacancies = typeof locObj === 'object' ? (locObj?.vacancies ?? null) : null;

                    if (locVacancies !== null && locVacancies > 0) {
                        const locCount = await tx.application.count({
                            where: {
                                fieldId:           application.fieldId,
                                preferredLocation: application.preferredLocation,
                                status:            { in: SEAT_CONSUMING }
                            }
                        });
                        if (locCount >= locVacancies) {
                            throw new Error(
                                `Allocation Failed: All ${locVacancies} seats for location "${application.preferredLocation}" are filled.`
                            );
                        }
                    }
                }

                // Category quota enforcement — skip for NON_STIPEND (first-come-first-served, no tiers)
                if (!isNonStipend) {
                    const caps = getSeatCaps(targetOpenings, targetEntity.quotaPercentages || {});
                    const targetBucket = getApplicationBucket(application, targetEntity);
                    const targetCap = caps[targetBucket] ?? 0;

                    if (targetCap <= 0) {
                        throw new Error(
                            `Allocation Failed: No seats allocated for ${targetBucket} category as per configured distribution.`
                        );
                    }

                    const activeApps = await tx.application.findMany({
                        where: {
                            ...(application.departmentGroup
                                ? { departmentGroupId: application.departmentGroupId }
                                : { internshipId: application.internshipId, departmentGroupId: null }),
                            status: { in: SEAT_CONSUMING }
                        },
                        include: {
                            student: { select: { collegeName: true, collegeCategory: true } }
                        }
                    });

                    const usedInBucket = activeApps.filter(
                        a => getApplicationBucket(a, targetEntity) === targetBucket
                    ).length;

                    if (usedInBucket >= targetCap) {
                        throw new Error(
                            `Allocation Failed: ${targetBucket} quota is full (${usedInBucket}/${targetCap}).`
                        );
                    }
                }
            }
        }

        // ── Committee Scoring Completion Check ───────────────────────────────
        if (
            [STATUS.SELECTED, STATUS.APPROVED, STATUS.REJECTED, STATUS.WAITLISTED].includes(toStatus) &&
            application.status === STATUS.UNDER_COMMITTEE_REVIEW
        ) {
            const criteriaCount = application.internship.evaluationCriteria?.length || 0;
            if (criteriaCount > 0) {
                const scores = await tx.evaluationScore.findMany({ where: { applicationId } });
                const roles = new Set(scores.map(s => s.role));
                const hasPrti = roles.has('CE_PRTI') || roles.has('COMMITTEE_MEMBER');
                const hasHod = roles.has('HOD');
                const hasMentor = roles.has('MENTOR');

                if (!hasPrti || !hasHod || !hasMentor) {
                    throw new Error(
                        `Incomplete Evaluation: Requires scores from HOD, Mentor, and PRTI. Missing: ${[!hasHod && 'HOD', !hasMentor && 'Mentor', !hasPrti && 'PRTI'].filter(Boolean).join(', ')}`
                    );
                }
            }
        }

        // ── Perform Update ───────────────────────────────────────────────────
        const updated = await tx.application.update({
            where: { id: applicationId },
            data: {
                status: toStatus,
                ...(SEAT_CONSUMING.includes(toStatus) && !SEAT_CONSUMING.includes(application.status)
                    ? { shortlistCategory: getApplicationBucket(application, application.internship) }
                    : {})
            }
        });

        // ── Roll Number Generation ────────────────────────────────────────────
        // Policy: roll numbers are allocated only at HIRED — i.e., after joining
        // documents have been evaluated and the student is officially hired.
        // This applies uniformly to MONETARY and NON_STIPEND flows.
        if (toStatus === STATUS.HIRED) {
            const isLearning = application.internship?.internshipType === 'NON_STIPEND';
            const student = await tx.studentProfile.findUnique({ where: { id: application.studentId } });
            if (student && !student.rollNumber) {
                const { generatePortalRollNumber, generateLearningRollNumber } = require('./rollNumberService');
                const rn = isLearning
                    ? await generateLearningRollNumber(applicationId, tx)
                    : await generatePortalRollNumber(applicationId, tx);
                await tx.studentProfile.update({ where: { id: application.studentId }, data: { rollNumber: rn } });
                auditDetails += ` ${isLearning ? 'Learning ' : ''}Roll Number Generated: ${rn}.`;
            }
        }

        // ── Audit Log ────────────────────────────────────────────────────────
        await tx.auditLog.create({
            data: {
                action: 'STATUS_TRANSITION',
                userEmail: user?.email || user?.id || 'system@aptransco.portal',
                details: `Transitioned ${application.trackingId} from ${application.status} to ${toStatus}. ${auditDetails}`,
                target: applicationId
            }
        });

        return updated;
    };

    return existingTx ? logic(existingTx) : prisma.$transaction(logic);
};

module.exports = { transitionApplicationStatus, STATUS, SEAT_CONSUMING };
