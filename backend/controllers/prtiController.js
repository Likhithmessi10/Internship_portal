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
        const { applicationId, score, memberType, comments } = req.body;
        const evaluatorId = req.user.id;
        const evaluatorRole = req.user.role;

        // Validate score
        if (!score || score < 0 || score > 100) {
            return res.status(400).json({ 
                success: false, 
                message: 'Score must be between 0 and 100' 
            });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { 
                internship: true,
                mentor: true,
                shortlist: true
            }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.status !== 'SHORTLISTED') {
            return res.status(400).json({ 
                success: false, 
                message: 'Application is not in shortlisting evaluation stage' 
            });
        }

        // Create or update shortlist record with evaluation
        const shortlistData = {
            score,
            evaluatedAt: new Date()
        };

        // Store evaluator-specific data based on role
        if (evaluatorRole === 'CE_PRTI' || evaluatorRole === 'COMMITTEE_MEMBER' || evaluatorRole === 'ADMIN') {
            shortlistData.prtiMemberId = evaluatorId;
            shortlistData.prtiScore = score;
        } else if (evaluatorRole === 'HOD') {
            shortlistData.hodId = evaluatorId;
            shortlistData.hodScore = score;
        } else if (evaluatorRole === 'MENTOR') {
            shortlistData.mentorId = evaluatorId;
            shortlistData.mentorScore = score;
        }

        await prisma.shortlist.upsert({
            where: { applicationId },
            update: shortlistData,
            create: {
                applicationId,
                ...shortlistData
            }
        });

        res.status(200).json({ 
            success: true, 
            message: 'Evaluation score submitted successfully',
            data: { applicationId, score, evaluatorId }
        });
    } catch (error) {
        console.error('Submit evaluation error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
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
                shortlist: true
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
        const shortlist = application.shortlist;
        if (!shortlist || !shortlist.prtiScore || !shortlist.hodScore || !shortlist.mentorScore) {
            return res.status(400).json({ 
                success: false, 
                message: 'All 3 committee members must submit scores before final approval' 
            });
        }

        // Calculate average score
        const avgScore = (shortlist.prtiScore + shortlist.hodScore + shortlist.mentorScore) / 3;

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
                shortlist: true
            }
        });

        const evaluationStatus = applications.map(app => {
            const shortlist = app.shortlist;
            return {
                applicationId: app.id,
                studentName: app.student.fullName,
                mentorName: app.mentor?.name || 'Not Assigned',
                scores: {
                    prti: shortlist?.prtiScore ?? null,
                    hod: shortlist?.hodScore ?? null,
                    mentor: shortlist?.mentorScore ?? null,
                    average: shortlist 
                        ? Math.round((shortlist.prtiScore + shortlist.hodScore + shortlist.mentorScore) / 3)
                        : null
                },
                allScoresSubmitted: !!(shortlist?.prtiScore && shortlist?.hodScore && shortlist?.mentorScore),
                readyForApproval: !!(shortlist?.prtiScore && shortlist?.hodScore && shortlist?.mentorScore)
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
