const prisma = require('../lib/prisma');
const { transitionApplicationStatus } = require('../services/applicationWorkflowService');

/**
 * Get applications for committee evaluation
 * GET /api/v1/prti/committees/applications
 */
const getCommitteeApplications = async (req, res) => {
    try {
        const { status, internshipId } = req.query;

        const whereClause = {};

        if (!status || status === 'PENDING' || status === 'SUBMITTED') {
            whereClause.status = { in: ['SHORTLISTED', 'UNDER_COMMITTEE_REVIEW'] };
        } else if (status === 'ALL') {
            // no filter
        } else {
            whereClause.status = status;
        }

        if (internshipId) whereClause.internshipId = internshipId;

        const isGlobalRole = ['ADMIN', 'CE_PRTI', 'COMMITTEE_MEMBER'].includes(req.user.role);

        if (!isGlobalRole) {
            whereClause.OR = [
                {
                    internship: {
                        OR: [
                            { department: req.user.department },
                            {
                                committee: {
                                    OR: [
                                        { hodId: req.user.id },
                                        { mentorId: req.user.id },
                                        { prtiMemberId: req.user.id }
                                    ]
                                }
                            }
                        ]
                    }
                },
                { mentorId: req.user.id }
            ];
        }

        const applications = await prisma.application.findMany({
            where: whereClause,
            include: {
                student: {
                    select: {
                        fullName: true, phone: true, collegeName: true,
                        cgpa: true, branch: true, yearOfStudy: true,
                        photoUrl: true,
                        user: { select: { email: true } }
                    }
                },
                internship: {
                    select: {
                        title: true, department: true, duration: true,
                        evaluationCriteria: true, committee: true
                    }
                },
                departmentGroup: { select: { id: true, department: true, title: true } },
                problemStatement: { select: { id: true, title: true, vacancies: true } },
                mentor: { select: { name: true, email: true, department: true } },
                evaluationScores: true,
                documents: true
            },
            orderBy: { committeeFinalScore: 'desc' }
        });

        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error('Get committee applications error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Submit committee evaluation score per question
 * POST /api/v1/prti/committees/evaluate
 */
const submitEvaluation = async (req, res) => {
    try {
        const { applicationId, scores } = req.body;
        const evaluatorId = req.user.id;
        const evaluatorRole = req.user.role;

        if (!Array.isArray(scores) || scores.length === 0) {
            return res.status(400).json({ success: false, message: 'Scores array is required' });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                internship: {
                    include: { committee: true, evaluationCriteria: true }
                }
            }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const committee = application.internship.committee;
        if (!committee) {
            return res.status(400).json({ success: false, message: 'Committee not formed for this internship' });
        }

        const isHod = committee.hodId === evaluatorId;
        const isMentor = committee.mentorId === evaluatorId || application.mentorId === evaluatorId;
        const isAssignedPrtiRep = committee.prtiMemberId === evaluatorId;
        const isAdmin = evaluatorRole === 'ADMIN';
        const isGlobalCommitteeRole = evaluatorRole === 'CE_PRTI' || evaluatorRole === 'COMMITTEE_MEMBER';

        if (!isHod && !isMentor && !isAssignedPrtiRep && !isAdmin && !isGlobalCommitteeRole) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You are not a member of the committee for this internship'
            });
        }

        let storageRole = evaluatorRole;
        if (isAdmin) {
            if (isHod) storageRole = 'HOD';
            else if (isMentor) storageRole = 'MENTOR';
            else storageRole = 'CE_PRTI';
        }

        await prisma.$transaction(async (tx) => {
            if (application.status === 'SHORTLISTED') {
                await tx.application.update({
                    where: { id: applicationId },
                    data: { status: 'UNDER_COMMITTEE_REVIEW' }
                });
            }

            for (const s of scores) {
                if (s.score === undefined || s.score < 0 || s.score > 50) {
                    throw new Error(`Score must be between 0 and 50 for question ${s.questionId}`);
                }
                await tx.evaluationScore.upsert({
                    where: {
                        applicationId_memberId_questionId: {
                            applicationId,
                            memberId: evaluatorId,
                            questionId: s.questionId
                        }
                    },
                    update: {
                        score: parseFloat(s.score),
                        comments: s.comments || null,
                        role: storageRole,
                        updatedAt: new Date()
                    },
                    create: {
                        applicationId,
                        memberId: evaluatorId,
                        questionId: s.questionId,
                        role: storageRole,
                        score: parseFloat(s.score),
                        comments: s.comments || null
                    }
                });
            }

            // Recalculate final score
            const allScores = await tx.evaluationScore.findMany({ where: { applicationId } });
            const criteria = application.internship.evaluationCriteria;
            let totalFinalScore = 0;
            const breakdown = {};

            for (const q of criteria) {
                const questionScores = allScores.filter(s => s.questionId === q.id);
                if (questionScores.length > 0) {
                    const avg = questionScores.reduce((acc, s) => acc + s.score, 0) / questionScores.length;
                    totalFinalScore += avg;
                    breakdown[q.id] = parseFloat(avg.toFixed(2));
                }
            }

            await tx.application.update({
                where: { id: applicationId },
                data: {
                    committeeFinalScore: parseFloat(totalFinalScore.toFixed(2)),
                    scoreBreakdown: breakdown
                }
            });
        });

        const allEvaluations = await prisma.evaluationScore.findMany({ where: { applicationId } });
        res.status(200).json({
            success: true,
            message: 'Evaluation scores submitted successfully',
            data: { applicationId, evaluatorId, evaluations: allEvaluations }
        });
    } catch (error) {
        console.error('[Evaluation] Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
};

/**
 * HOD gives final candidate selection after committee evaluation
 * Sets status to SELECTED (not HIRED — reporting comes later).
 * POST /api/v1/prti/committees/approve
 */
const giveFinalApproval = async (req, res) => {
    try {
        const { applicationId, approved, assignedRole, rejectionReason } = req.body;
        const evaluatorRole = req.user.role;

        if (evaluatorRole !== 'HOD' && evaluatorRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Only HOD can make the final selection'
            });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                internship: { include: { evaluationCriteria: true } },
                student: { select: { collegeCategory: true, fullName: true } }
            }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (!['UNDER_COMMITTEE_REVIEW', 'SHORTLISTED'].includes(application.status)) {
            return res.status(400).json({
                success: false,
                message: 'Application is not ready for final selection'
            });
        }

        // Verify all 3 committee members have scored all criteria
        const criteriaCount = application.internship.evaluationCriteria?.length || 0;
        const allScores = await prisma.evaluationScore.findMany({ where: { applicationId } });

        const prtiScores  = allScores.filter(s => s.role === 'CE_PRTI' || s.role === 'COMMITTEE_MEMBER');
        const hodScores   = allScores.filter(s => s.role === 'HOD');
        const mentorScores = allScores.filter(s => s.role === 'MENTOR');

        if (
            criteriaCount > 0 &&
            (prtiScores.length < criteriaCount || hodScores.length < criteriaCount || mentorScores.length < criteriaCount)
        ) {
            return res.status(400).json({
                success: false,
                message: 'All 3 committee members must complete evaluation before final selection'
            });
        }

        const avgScore = application.committeeFinalScore || 0;

        const result = await prisma.$transaction(async (tx) => {
            if (approved) {
                if (!assignedRole) throw new Error('Assigned role is mandatory for selection');

                // Resolve per-category stipend amount and lock it on the application
                const stipendAmounts = application.internship.stipendAmounts || {};
                const collegeCategory = application.student?.collegeCategory || 'OTHER';
                const resolvedStipend = stipendAmounts[collegeCategory]
                    ?? stipendAmounts['OTHER']
                    ?? null;

                await tx.application.update({
                    where: { id: applicationId },
                    data: {
                        status: 'SELECTED',
                        assignedRole,
                        score: Math.round(avgScore),
                        stipendAmount: resolvedStipend ? parseFloat(resolvedStipend) : null
                    }
                });

                await tx.auditLog.create({
                    data: {
                        action: 'CANDIDATE_SELECTED',
                        userEmail: req.user.email,
                        details: `Selected ${application.trackingId} for role: ${assignedRole}`,
                        target: applicationId
                    }
                });

                // Notify student of selection
                const studentUser = await tx.studentProfile.findUnique({
                    where: { id: application.studentId },
                    include: { user: { select: { email: true } } }
                });
                if (studentUser?.user?.email) {
                    const { sendEmail } = require('../services/mailService');
                    sendEmail(
                        studentUser.user.email,
                        'Congratulations — You have been selected for APTRANSCO Internship',
                        `<h3>Dear ${studentUser.fullName},</h3>
                        <p>Congratulations! You have been <strong>selected</strong> for the APTRANSCO internship program.</p>
                        <p>Please report physically to PRTI at the earliest. You will receive further instructions once your reporting is confirmed.</p>
                        <p>Best Regards,<br>APTRANSCO Internship Cell</p>`
                    ).catch(() => {});
                }

                return { success: true, message: 'Candidate selected successfully' };
            } else {
                await tx.application.update({
                    where: { id: applicationId },
                    data: { status: 'REJECTED' }
                });
                return { success: true, message: 'Application rejected' };
            }
        });

        res.status(200).json(result);
    } catch (error) {
        console.error('Final approval error:', error.message);
        res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
};

/**
 * PRTI marks a candidate as physically reported.
 * Generates roll number and transitions SELECTED → REPORTED.
 * POST /api/v1/prti/committees/mark-reported
 */
const markReported = async (req, res) => {
    try {
        const { applicationId } = req.body;

        if (!['CE_PRTI', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Only CE_PRTI can mark reporting' });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                student: { include: { user: { select: { email: true } } } }
            }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.status !== 'SELECTED' && application.status !== 'APPROVED') {
            return res.status(400).json({
                success: false,
                message: `Cannot mark reported: application status is ${application.status}. Expected SELECTED.`
            });
        }

        // transitionApplicationStatus handles roll number generation at REPORTED
        const updated = await transitionApplicationStatus(
            applicationId,
            'REPORTED',
            req.user,
            'Physical reporting confirmed by PRTI.'
        );

        // Fetch updated roll number
        const student = await prisma.studentProfile.findUnique({
            where: { id: application.studentId },
            select: { rollNumber: true, fullName: true }
        });

        // Notify student to upload joining documents
        const studentEmail = application.student?.user?.email;
        if (studentEmail) {
            const { sendEmail } = require('../services/mailService');
            sendEmail(
                studentEmail,
                'Reporting Confirmed — Upload Your Joining Documents',
                `<h3>Dear ${student?.fullName || 'Student'},</h3>
                <p>Your physical reporting to APTRANSCO has been confirmed.</p>
                <p><strong>Your Roll Number: ${student?.rollNumber || 'Will be communicated separately'}</strong></p>
                <p>Please log in to the portal and upload the following joining documents:</p>
                <ul>
                    <li>No Objection Certificate (NOC) from your college</li>
                    <li>Bond / Service Agreement</li>
                    <li>Undertaking Form</li>
                </ul>
                <p>Best Regards,<br>APTRANSCO Internship Cell</p>`
            ).catch(() => {});
        }

        res.status(200).json({
            success: true,
            message: 'Candidate marked as reported. Roll number generated.',
            data: {
                applicationId,
                status: updated.status,
                rollNumber: student?.rollNumber
            }
        });
    } catch (error) {
        console.error('Mark reported error:', error.message);
        res.status(400).json({ success: false, message: error.message || 'Server Error' });
    }
};

/**
 * Get committee evaluation status for an internship
 * GET /api/v1/prti/committees/:internshipId/status
 */
const getCommitteeStatus = async (req, res) => {
    try {
        const { internshipId } = req.params;

        const applications = await prisma.application.findMany({
            where: {
                internshipId,
                status: { in: ['SHORTLISTED', 'UNDER_COMMITTEE_REVIEW'] }
            },
            include: {
                internship: { select: { evaluationCriteria: true } },
                student: {
                    select: { fullName: true, user: { select: { email: true } } }
                },
                mentor: { select: { name: true, department: true } },
                evaluationScores: true
            }
        });

        const evaluationStatus = applications.map(app => {
            const allScores = app.evaluationScores || [];
            const criteriaCount = app.internship?.evaluationCriteria?.length || 0;

            const prtiScores  = allScores.filter(s => s.role === 'CE_PRTI' || s.role === 'COMMITTEE_MEMBER');
            const hodScores   = allScores.filter(s => s.role === 'HOD');
            const mentorScores = allScores.filter(s => s.role === 'MENTOR');

            const hasPrti   = criteriaCount > 0 && prtiScores.length >= criteriaCount;
            const hasHod    = criteriaCount > 0 && hodScores.length >= criteriaCount;
            const hasMentor = criteriaCount > 0 && mentorScores.length >= criteriaCount;
            const allDone   = hasPrti && hasHod && hasMentor;

            return {
                applicationId: app.id,
                studentName: app.student.fullName,
                mentorName: app.mentor?.name || 'Not Assigned',
                scores: {
                    prtiComplete:   hasPrti,
                    hodComplete:    hasHod,
                    mentorComplete: hasMentor,
                    average:        app.committeeFinalScore
                },
                allScoresSubmitted: allDone,
                readyForApproval:   allDone
            };
        });

        res.status(200).json({
            success: true,
            data: {
                internshipId,
                totalApplications: applications.length,
                readyForApproval: evaluationStatus.filter(e => e.readyForApproval).length,
                pendingScores: evaluationStatus.filter(e => !e.readyForApproval).length,
                evaluations: evaluationStatus
            }
        });
    } catch (error) {
        console.error('Get committee status error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getCommitteeApplications,
    submitEvaluation,
    giveFinalApproval,
    markReported,
    getCommitteeStatus
};
