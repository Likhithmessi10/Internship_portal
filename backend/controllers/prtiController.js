const { PrismaClient } = require('@prisma/client');
const prisma = require('../lib/prisma');

/**
 * Get all applications for PRTI Committee evaluation
 * GET /api/v1/prti/committees/applications
 */
const getCommitteeApplications = async (req, res) => {
    try {
        const { status, internshipId } = req.query;
        const targetStatus = status;

        const whereClause = {};

        // If no status or generic pending, show both Shortlisted and Under Review
        if (!targetStatus || targetStatus === 'PENDING' || targetStatus === 'SUBMITTED') {
            whereClause.status = { in: ['SHORTLISTED', 'UNDER_COMMITTEE_REVIEW'] };
        } else if (targetStatus !== 'ALL') {
            whereClause.status = targetStatus;
        }

        if (internshipId) {
            whereClause.internshipId = internshipId;
        }

        // Global roles (ADMIN, CE_PRTI, COMMITTEE_MEMBER) see all relevant applications (filtered by status)
        // Others (HOD, MENTOR) see only those they are assigned to in the committee
        const isGlobalRole = req.user.role === 'ADMIN' || req.user.role === 'CE_PRTI' || req.user.role === 'COMMITTEE_MEMBER';

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

        console.log(
            `[getCommitteeApplications] Role: ${req.user.role}, Dept: ${req.user.department}, Status: ${targetStatus}, Filter:`,
            JSON.stringify(whereClause)
        );

        const applications = await prisma.application.findMany({
            where: whereClause,
            include: {
                student: {
                    select: {
                        fullName: true,
                        phone: true,
                        collegeName: true,
                        cgpa: true,
                        branch: true,
                        yearOfStudy: true,
                        photoUrl: true,
                        user: { select: { email: true } }
                    }
                },
                internship: {
                    select: {
                        title: true,
                        department: true,
                        duration: true,
                        evaluationCriteria: true,
                        committee: true
                    }
                },
                mentor: {
                    select: {
                        name: true,
                        email: true,
                        department: true
                    }
                },
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
        const { applicationId, scores } = req.body; // scores is an array of { questionId, score, comments }
        const evaluatorId = req.user.id;
        const evaluatorRole = req.user.role;

        if (!Array.isArray(scores) || scores.length === 0) {
            return res.status(400).json({ success: false, message: 'Scores array is required' });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { 
                internship: {
                    include: {
                        committee: true,
                        evaluationCriteria: true
                    }
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
        // Mentor can be assigned either at committee level or per-application (HOD shortlisting flow).
        const isMentor = committee.mentorId === evaluatorId || application.mentorId === evaluatorId;
        const isAssignedPrtiRep = committee.prtiMemberId === evaluatorId;
        const isAdmin = evaluatorRole === 'ADMIN';
        const isGlobalCommitteeRole = evaluatorRole === 'CE_PRTI' || evaluatorRole === 'COMMITTEE_MEMBER';

        // CE_PRTI/COMMITTEE_MEMBER are treated as global committee roles (same as listing endpoint),
        // so they can score even if not explicitly set as committee.prtiMemberId.
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

        // Validate and Upsert all scores in a transaction
        await prisma.$transaction(async (tx) => {
            // Update status if it's currently SHORTLISTED
            if (application.status === 'SHORTLISTED') {
                console.log(`[Evaluation] Transitioning Application ${applicationId} to UNDER_COMMITTEE_REVIEW`);
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

            // Recalculate Final Score
            const allScores = await tx.evaluationScore.findMany({
                where: { applicationId }
            });

            const criteria = application.internship.evaluationCriteria;
            let totalFinalScore = 0;
            let breakdown = {};

            for (const q of criteria) {
                const questionScores = allScores.filter(s => s.questionId === q.id);
                if (questionScores.length > 0) {
                    const avg = questionScores.reduce((acc, s) => acc + s.score, 0) / questionScores.length;
                    totalFinalScore += avg;
                    breakdown[q.id] = parseFloat(avg.toFixed(2));
                }
            }

            console.log(`[Evaluation] Application ${applicationId} Final Score Recalculated: ${totalFinalScore}`);

            await tx.application.update({
                where: { id: applicationId },
                data: {
                    committeeFinalScore: parseFloat(totalFinalScore.toFixed(2)),
                    scoreBreakdown: breakdown
                }
            });
        });

        // Get all evaluations to return updated state
        const allEvaluations = await prisma.evaluationScore.findMany({
            where: { applicationId }
        });

        res.status(200).json({ 
            success: true, 
            message: 'Evaluation scores submitted successfully',
            data: { 
                applicationId, 
                evaluatorId,
                evaluations: allEvaluations
            }
        });
    } catch (error) {
        console.error('[Evaluation] DB Write Failure:', error);
        res.status(500).json({ success: false, message: error.message || 'Server Error during evaluation submission' });
    }
};

/**
 * PRTI Member gives final approval (Committee Head)
 * POST /api/v1/prti/committees/approve
 */
const giveFinalApproval = async (req, res) => {
    try {
        const { applicationId, approved, assignedRole, rejectionReason } = req.body;
        const evaluatorId = req.user.id;
        const evaluatorRole = req.user.role;

        // HOD makes final approval
        if (evaluatorRole !== 'HOD') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only HOD can give final approval and select the candidate' 
            });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { 
                internship: true
            }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.status !== 'SHORTLISTED' && application.status !== 'APPROVED') {
            return res.status(400).json({ 
                success: false, 
                message: 'Application is not ready for final approval' 
            });
        }

        // Check if all 3 committee members have submitted scores
        const criteriaCount = application.internship.evaluationCriteria?.length || 0;
        const allScores = await prisma.evaluationScore.findMany({ where: { applicationId } });
        
        const prtiScores = allScores.filter(s => s.role === 'CE_PRTI' || s.role === 'COMMITTEE_MEMBER');
        const hodScores = allScores.filter(s => s.role === 'HOD');
        const mentorScores = allScores.filter(s => s.role === 'MENTOR');

        const hasPrti = criteriaCount > 0 && prtiScores.length >= criteriaCount;
        const hasHod = criteriaCount > 0 && hodScores.length >= criteriaCount;
        const hasMentor = criteriaCount > 0 && mentorScores.length >= criteriaCount;

        if (!hasPrti || !hasHod || !hasMentor) {
            return res.status(400).json({ 
                success: false, 
                message: 'All 3 committee members must complete evaluation before final approval' 
            });
        }

        // Use pre-calculated committeeFinalScore
        const avgScore = application.committeeFinalScore || 0;

        const { transitionApplicationStatus } = require('../services/applicationWorkflowService');

        const result = await prisma.$transaction(async (tx) => {
            const application = await tx.application.findUnique({
                where: { id: applicationId },
                include: { internship: true }
            });

            if (!application) throw new Error('Application not found');
            
            if (approved) {
                // Atomic seat check
                const totalHiredCount = await tx.application.count({
                    where: {
                        internshipId: application.internshipId,
                        status: { in: ['HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'] }
                    }
                });

                if (totalHiredCount >= application.internship.openingsCount) {
                    throw new Error(`Internship Full: All ${application.internship.openingsCount} openings have been filled.`);
                }

                if (!assignedRole) throw new Error('Assigned role is mandatory for approval');

                // Update application using workflow service logic (but inside this tx)
                // Since our service uses its own tx, we'll implement it inline or refactor service to accept tx
                await tx.application.update({
                    where: { id: applicationId },
                    data: {
                        status: 'HIRED',
                        assignedRole,
                        score: Math.round(avgScore)
                    }
                });
                
                await tx.auditLog.create({
                    data: {
                        action: 'FINAL_APPROVAL',
                        userEmail: req.user.email,
                        details: `Approved application ${application.trackingId} for role ${assignedRole}`,
                        target: applicationId
                    }
                });

                return { success: true, message: 'Application approved successfully' };
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
 * Get committee evaluation status for an internship
 * GET /api/v1/prti/committees/:internshipId/status
 */
const getCommitteeStatus = async (req, res) => {
    try {
        const { internshipId } = req.params;

        const applications = await prisma.application.findMany({
            where: {
                internshipId,
                status: 'SHORTLISTED'
            },
            include: {
                internship: {
                    select: {
                        evaluationCriteria: true
                    }
                },
                student: {
                    select: {
                        fullName: true,
                        user: { select: { email: true } }
                    }
                },
                mentor: {
                    select: {
                        name: true,
                        department: true
                    }
                },
                evaluationScores: true
            }
        });

        const evaluationStatus = applications.map(app => {
            const allScores = app.evaluationScores || [];
            const criteriaCount = app.internship?.evaluationCriteria?.length || 0;
            
            const prtiScores = allScores.filter(s => s.role === 'CE_PRTI' || s.role === 'COMMITTEE_MEMBER');
            const hodScores = allScores.filter(s => s.role === 'HOD');
            const mentorScores = allScores.filter(s => s.role === 'MENTOR');

            const hasPrti = criteriaCount > 0 && prtiScores.length >= criteriaCount;
            const hasHod = criteriaCount > 0 && hodScores.length >= criteriaCount;
            const hasMentor = criteriaCount > 0 && mentorScores.length >= criteriaCount;

            const submittedCount = [hasPrti, hasHod, hasMentor].filter(Boolean).length;

            return {
                applicationId: app.id,
                studentName: app.student.fullName,
                mentorName: app.mentor?.name || 'Not Assigned',
                scores: {
                    prtiComplete: hasPrti,
                    hodComplete: hasHod,
                    mentorComplete: hasMentor,
                    average: app.committeeFinalScore
                },
                allScoresSubmitted: submittedCount === 3,
                readyForApproval: submittedCount === 3
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
    getCommitteeStatus
};
