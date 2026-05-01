const { PrismaClient } = require('@prisma/client');
const prisma = require('../lib/prisma');

/**
 * Get all applications for PRTI Committee evaluation
 * GET /api/v1/prti/committees/applications
 */
const getCommitteeApplications = async (req, res) => {
    try {
        const { status, internshipId } = req.query;

        let targetStatus = status || 'SHORTLISTED';
        
        // Map 'PENDING' to 'SHORTLISTED' for the dashboard default
        if (targetStatus === 'PENDING' || targetStatus === 'SUBMITTED') {
            targetStatus = 'SHORTLISTED';
        }

        const whereClause = {
            status: targetStatus
        };

        if (internshipId) {
            whereClause.internshipId = internshipId;
        }

        // If not ADMIN, filter by committee membership
        if (req.user.role !== 'ADMIN') {
            whereClause.internship = {
                committee: {
                    OR: [
                        { hodId: req.user.id },
                        { mentorId: req.user.id },
                        { prtiMemberId: req.user.id }
                    ]
                }
            };
        }

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
                        duration: true
                    }
                },
                mentor: {
                    select: {
                        name: true,
                        email: true,
                        department: true
                    }
                },
                shortlist: true,
                committeeEvaluations: true,
                documents: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error('Get committee applications error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Submit committee evaluation score
 * POST /api/v1/prti/committees/evaluate
 */
const submitEvaluation = async (req, res) => {
    try {
        const { applicationId, score, comments } = req.body;
        const evaluatorId = req.user.id;
        const evaluatorRole = req.user.role;

        console.log(`[Evaluation] Received payload:`, { applicationId, score, comments, evaluatorId, evaluatorRole });

        // Validate score
        if (score === undefined || score < 1 || score > 100) {
            return res.status(400).json({ 
                success: false, 
                message: 'Score must be between 1 and 100' 
            });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { 
                internship: {
                    include: {
                        committee: true
                    }
                }
            }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Validate committee membership
        const committee = application.internship.committee;
        if (!committee) {
            return res.status(400).json({ success: false, message: 'Committee not formed for this internship' });
        }

        const isHod = committee.hodId === evaluatorId;
        const isMentor = committee.mentorId === evaluatorId;
        const isPrti = committee.prtiMemberId === evaluatorId;
        const isAdmin = evaluatorRole === 'ADMIN';

        if (!isHod && !isMentor && !isPrti && !isAdmin) {
            return res.status(403).json({ 
                success: false, 
                message: 'Unauthorized: You are not a member of the committee for this internship' 
            });
        }

        // Determine role for storage if not admin (admin acts as whatever role they are, but here we should probably be specific)
        let storageRole = evaluatorRole;
        if (isAdmin) {
            if (isHod) storageRole = 'HOD';
            else if (isMentor) storageRole = 'MENTOR';
            else storageRole = 'CE_PRTI';
        }

        // Upsert committee evaluation
        const evaluation = await prisma.committeeEvaluation.upsert({
            where: {
                applicationId_memberId: {
                    applicationId,
                    memberId: evaluatorId
                }
            },
            update: {
                score: parseFloat(score),
                comments,
                role: storageRole,
                updatedAt: new Date()
            },
            create: {
                applicationId,
                memberId: evaluatorId,
                role: storageRole,
                score: parseFloat(score),
                comments
            }
        });

        console.log(`[Evaluation] DB Write Success for ${applicationId} by ${evaluatorId}`);

        // Update legacy shortlist table for compatibility and aggregate view
        const shortlistData = {
            evaluatedAt: new Date()
        };

        if (storageRole === 'HOD') {
            shortlistData.hodId = evaluatorId;
            shortlistData.hodScore = parseFloat(score);
        } else if (storageRole === 'MENTOR') {
            shortlistData.mentorId = evaluatorId;
            shortlistData.mentorScore = parseFloat(score);
        } else {
            shortlistData.prtiMemberId = evaluatorId;
            shortlistData.prtiScore = parseFloat(score);
        }

        await prisma.shortlist.upsert({
            where: { applicationId },
            update: shortlistData,
            create: {
                applicationId,
                ...shortlistData
            }
        });

        // Get all evaluations to return updated state
        const allEvaluations = await prisma.committeeEvaluation.findMany({
            where: { applicationId }
        });

        res.status(200).json({ 
            success: true, 
            message: 'Evaluation score submitted successfully',
            data: { 
                applicationId, 
                score, 
                evaluatorId,
                evaluations: allEvaluations
            }
        });
    } catch (error) {
        console.error('[Evaluation] DB Write Failure:', error);
        res.status(500).json({ success: false, message: 'Server Error during evaluation submission' });
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

        // Only PRTI Member (Committee Head) can give final approval
        if (evaluatorRole !== 'CE_PRTI' && evaluatorRole !== 'COMMITTEE_MEMBER') {
            return res.status(403).json({ 
                success: false, 
                message: 'Only PRTI Member (Committee Head) can give final approval' 
            });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { 
                internship: true,
                shortlist: true,
                committeeEvaluations: true
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
        const evals = application.committeeEvaluations || [];
        const hasPrti = evals.some(e => e.role === 'CE_PRTI' || e.role === 'COMMITTEE_MEMBER');
        const hasHod = evals.some(e => e.role === 'HOD');
        const hasMentor = evals.some(e => e.role === 'MENTOR');

        if (!hasPrti || !hasHod || !hasMentor) {
            return res.status(400).json({ 
                success: false, 
                message: 'All 3 committee members must submit scores before final approval' 
            });
        }

        // Calculate average score
        const avgScore = evals.reduce((sum, e) => sum + e.score, 0) / evals.length;

        const { transitionApplicationStatus } = require('../services/applicationWorkflowService');

        const result = await prisma.$transaction(async (tx) => {
            const application = await tx.application.findUnique({
                where: { id: applicationId },
                include: { internship: true, shortlist: true }
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
                shortlist: true,
                committeeEvaluations: true
            }
        });

        const evaluationStatus = applications.map(app => {
            const evals = app.committeeEvaluations || [];
            const prtiEval = evals.find(e => e.role === 'CE_PRTI' || e.role === 'COMMITTEE_MEMBER');
            const hodEval = evals.find(e => e.role === 'HOD');
            const mentorEval = evals.find(e => e.role === 'MENTOR');

            const scores = {
                prti: prtiEval?.score ?? null,
                hod: hodEval?.score ?? null,
                mentor: mentorEval?.score ?? null
            };

            const submittedCount = [scores.prti, scores.hod, scores.mentor].filter(s => s !== null).length;

            return {
                applicationId: app.id,
                studentName: app.student.fullName,
                mentorName: app.mentor?.name || 'Not Assigned',
                scores: {
                    ...scores,
                    average: submittedCount > 0 
                        ? Math.round(( (scores.prti || 0) + (scores.hod || 0) + (scores.mentor || 0) ) / submittedCount)
                        : null
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
