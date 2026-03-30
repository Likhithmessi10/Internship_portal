const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

/**
 * Submit work for an assignment
 * POST /api/v1/student/work/submit/:assignmentId
 */
const submitWork = async (req, res) => {
    try {
        const { assignmentId } = req.params;
        const { submissionText } = req.body;
        const userId = req.user.id;

        // Get the assignment
        const assignment = await prisma.workAssignment.findUnique({
            where: { id: assignmentId },
            include: {
                application: {
                    include: {
                        student: true
                    }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({
                success: false,
                message: 'Assignment not found'
            });
        }

        // Verify this is the student's assignment
        if (assignment.application.student.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to submit for this assignment'
            });
        }

        // Handle file upload if present
        let attachmentUrl = null;
        let attachmentType = null;

        if (req.file) {
            // Multer diskStorage already saved the file to uploads/
            attachmentUrl = `/uploads/${req.file.filename}`;
            attachmentType = req.file.mimetype;
        }

        // Create or update submission
        const submission = await prisma.taskSubmission.upsert({
            where: {
                workAssignmentId: assignmentId
            },
            create: {
                workAssignmentId: assignmentId,
                studentId: assignment.application.student.userId,
                submissionText,
                attachmentUrl,
                attachmentType,
                status: 'SUBMITTED'
            },
            update: {
                submissionText,
                attachmentUrl: attachmentUrl || undefined, // Only update if new file provided
                attachmentType: attachmentType || undefined,
                status: 'SUBMITTED',
                submissionDate: new Date()
            }
        });

        // Update assignment status
        await prisma.workAssignment.update({
            where: { id: assignmentId },
            data: { status: 'COMPLETED' }
        });

        res.status(200).json({
            success: true,
            data: submission,
            message: 'Work submitted successfully'
        });
    } catch (error) {
        console.error('Submit work error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get student's work assignments with submissions
 * GET /api/v1/student/work
 */
const getStudentWork = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get student profile
        const studentProfile = await prisma.studentProfile.findUnique({
            where: { userId },
            include: {
                applications: {
                    where: {
                        status: { in: ['HIRED', 'CA_APPROVED', 'ONGOING', 'COMPLETED'] }
                    }
                }
            }
        });

        if (!studentProfile) {
            return res.status(404).json({
                success: false,
                message: 'Student profile not found'
            });
        }

        const applicationIds = studentProfile.applications.map(app => app.id);

        // Get work assignments for this student
        const assignments = await prisma.workAssignment.findMany({
            where: {
                applicationId: { in: applicationIds }
            },
            include: {
                submissions: {
                    orderBy: { submissionDate: 'desc' }
                },
                application: {
                    include: {
                        internship: {
                            select: { title: true }
                        }
                    }
                },
                mentor: {
                    select: { name: true, email: true, department: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Merge latest submission into each assignment
        const assignmentsWithSubmission = assignments.map(assignment => ({
            ...assignment,
            submission: assignment.submissions[0] || null
        }));

        res.status(200).json({
            success: true,
            data: assignmentsWithSubmission
        });
    } catch (error) {
        console.error('Get student work error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Mentor reviews a submission
 * PUT /api/v1/mentor/work/review/:submissionId
 */
const reviewSubmission = async (req, res) => {
    try {
        const { submissionId } = req.params;
        const { mentorFeedback, mentorRating, status } = req.body;
        const mentorId = req.user.id;
        const userRole = req.user.role;

        // Get submission
        const submission = await prisma.taskSubmission.findUnique({
            where: { id: submissionId },
            include: {
                workAssignment: {
                    include: {
                        application: true
                    }
                }
            }
        });

        if (!submission) {
            return res.status(404).json({
                success: false,
                message: 'Submission not found'
            });
        }

        // Verify mentor owns this application
        if (submission.workAssignment.application.mentorId !== mentorId && userRole !== 'ADMIN') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to review this submission'
            });
        }

        // Update submission
        const updatedSubmission = await prisma.taskSubmission.update({
            where: { id: submissionId },
            data: {
                mentorFeedback,
                mentorRating: mentorRating ? parseInt(mentorRating) : null,
                status: status || 'REVIEWED',
                reviewedAt: new Date(),
                reviewedBy: mentorId
            }
        });

        // If revision requested, set assignment back to PENDING
        if (status === 'REVISION_REQUESTED') {
            await prisma.workAssignment.update({
                where: { id: submission.workAssignmentId },
                data: { status: 'PENDING' }
            });
        }

        res.status(200).json({
            success: true,
            data: updatedSubmission,
            message: 'Submission reviewed successfully'
        });
    } catch (error) {
        console.error('Review submission error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get submissions for a mentor's assignments
 * GET /api/v1/mentor/work/submissions
 */
const getMentorSubmissions = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const userRole = req.user.role;
        const { assignmentId } = req.query;

        let whereClause = {};

        if (assignmentId) {
            whereClause = { workAssignmentId: assignmentId };
        } else {
            // Get all submissions for mentor's assignments
            const mentorAssignments = await prisma.workAssignment.findMany({
                where: { mentorId },
                select: { id: true }
            });

            const assignmentIds = mentorAssignments.map(a => a.id);
            whereClause = { workAssignmentId: { in: assignmentIds } };
        }

        const submissions = await prisma.taskSubmission.findMany({
            where: whereClause,
            include: {
                workAssignment: {
                    include: {
                        application: {
                            include: {
                                student: {
                                    select: {
                                        fullName: true,
                                        rollNumber: true,
                                        photoUrl: true
                                    }
                                },
                                internship: {
                                    select: { title: true }
                                }
                            }
                        }
                    }
                }
            },
            orderBy: { submissionDate: 'desc' }
        });

        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error('Get mentor submissions error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    submitWork,
    getStudentWork,
    reviewSubmission,
    getMentorSubmissions
};
