const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all applications for PRTI Committee evaluation
 * GET /api/v1/prti/committees/applications
 */
const getCommitteeApplications = async (req, res) => {
    try {
        const { status, internshipId } = req.query;

        const whereClause = {
            status: status || 'COMMITTEE_EVALUATION'
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
                        email: true,
                        phone: true,
                        collegeName: true,
                        cgpa: true,
                        branch: true,
                        yearOfStudy: true,
                        photoUrl: true
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

        if (application.status !== 'COMMITTEE_EVALUATION') {
            return res.status(400).json({ 
                success: false, 
                message: 'Application is not in committee evaluation stage' 
            });
        }

        // Create or update shortlist record with evaluation
        const shortlistData = {
            score,
            evaluatedAt: new Date()
        };

        // Store evaluator-specific data based on role
        if (evaluatorRole === 'CE_PRTI' || evaluatorRole === 'COMMITTEE_MEMBER') {
            shortlistData.member1Id = evaluatorId;
            shortlistData.member1Score = score;
        } else if (evaluatorRole === 'HOD') {
            shortlistData.member2Id = evaluatorId;
            shortlistData.member2Score = score;
        } else if (evaluatorRole === 'MENTOR') {
            shortlistData.member3Id = evaluatorId;
            shortlistData.member3Score = score;
        }

        await prisma.shortlist.upsert({
            where: { applicationId },
            update: shortlistData,
            create: {
                applicationId,
                committeeId: application.internship.id,
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

        if (application.status !== 'COMMITTEE_EVALUATION' && application.status !== 'CA_APPROVED') {
            return res.status(400).json({ 
                success: false, 
                message: 'Application is not ready for final approval' 
            });
        }

        // Check if all 3 committee members have submitted scores
        const shortlist = application.shortlist;
        if (!shortlist || !shortlist.member1Score || !shortlist.member2Score || !shortlist.member3Score) {
            return res.status(400).json({ 
                success: false, 
                message: 'All 3 committee members must submit scores before final approval' 
            });
        }

        // Calculate average score
        const avgScore = (shortlist.member1Score + shortlist.member2Score + shortlist.member3Score) / 3;

        if (approved) {
            // Check openings
            const totalHiredCount = await prisma.application.count({
                where: {
                    internshipId: application.internshipId,
                    status: { in: ['HIRED', 'CA_APPROVED', 'ONGOING', 'COMPLETED'] }
                }
            });

            if (totalHiredCount >= application.internship.openingsCount) {
                return res.status(400).json({
                    success: false,
                    message: `Internship Full: All ${application.internship.openingsCount} openings have been filled.`
                });
            }

            if (!assignedRole) {
                return res.status(400).json({
                    success: false,
                    message: 'Assigned role is mandatory for approval'
                });
            }

            // Update application to HIRED
            const updatedApplication = await prisma.application.update({
                where: { id: applicationId },
                data: {
                    status: 'HIRED',
                    assignedRole,
                    score: Math.round(avgScore)
                },
                include: {
                    student: true,
                    internship: true,
                    mentor: true
                }
            });

            res.status(200).json({
                success: true,
                message: 'Application approved successfully',
                data: updatedApplication
            });
        } else {
            // Reject application
            const updatedApplication = await prisma.application.update({
                where: { id: applicationId },
                data: {
                    status: 'REJECTED'
                }
            });

            res.status(200).json({
                success: true,
                message: 'Application rejected',
                data: updatedApplication
            });
        }
    } catch (error) {
        console.error('Final approval error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
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
                status: 'COMMITTEE_EVALUATION'
            },
            include: {
                student: {
                    select: {
                        fullName: true,
                        email: true
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
                    member1: shortlist?.member1Score ?? null,
                    member2: shortlist?.member2Score ?? null,
                    member3: shortlist?.member3Score ?? null,
                    average: shortlist 
                        ? Math.round((shortlist.member1Score + shortlist.member2Score + shortlist.member3Score) / 3)
                        : null
                },
                allScoresSubmitted: !!(shortlist?.member1Score && shortlist?.member2Score && shortlist?.member3Score),
                readyForApproval: !!(shortlist?.member1Score && shortlist?.member2Score && shortlist?.member3Score)
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
