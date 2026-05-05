const prisma = require('../lib/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { transitionApplicationStatus } = require('./applicationWorkflowService');
const { createAuditLog } = require('../utils/auditLogger');
const { notifyMentorAssignment } = require('./mailService');
const emailService = require('./email/emailService');

/**
 * Get applications for an internship with pagination
 */
const getApplications = async (internshipId, options, user) => {
    const { page = 1, limit = 20 } = options;
    const skip = (page - 1) * limit;

    const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
    if (!internship) throw new NotFoundError('Internship not found');

    const whereClause = { internshipId };
    if (user.role === 'MENTOR') {
        whereClause.mentorId = user.id;
    }

    const [applications, total] = await Promise.all([
        prisma.application.findMany({
            where: whereClause,
            skip,
            take: limit,
            orderBy: { score: 'desc' },
            include: {
                student: {
                    include: { user: { select: { email: true, name: true } } }
                },
                documents: true,
                mentor: { select: { name: true, email: true } },
                shortlist: true,
                attendance: true,
                stipend: true
            }
        }),
        prisma.application.count({ where: whereClause })
    ]);

    return {
        data: applications,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
};

/**
 * Manually update application status and metadata
 */
const updateApplication = async (applicationId, updateData, user) => {
    const { status, assignedRole, rollNumber, joiningDate, endDate, mentorId } = updateData;

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { student: { include: { user: true } }, internship: true }
    });

    if (!application) throw new NotFoundError('Application not found');

    const internship = application.internship;

    // Mentor Verification
    let mentorUser = null;
    if (mentorId) {
        mentorUser = await prisma.user.findFirst({
            where: {
                id: mentorId,
                role: 'MENTOR',
                department: internship.department
            }
        });
        if (!mentorUser) {
            throw new ValidationError('Invalid Mentor. Mentor must be from the same department.');
        }
    }

    return await prisma.$transaction(async (tx) => {
        // Status transition
        const updatedApp = await transitionApplicationStatus(
            applicationId, 
            status, 
            user, 
            `Manual update. Role: ${assignedRole || 'None'}`,
            tx
        );

        // Update student roll number
        if (rollNumber) {
            await tx.studentProfile.update({
                where: { id: application.studentId },
                data: { rollNumber }
            });
        }

        // Update application metadata
        const metadataUpdates = {};
        if (assignedRole) metadataUpdates.assignedRole = assignedRole;
        if (joiningDate) metadataUpdates.joiningDate = new Date(joiningDate);
        if (endDate) metadataUpdates.endDate = new Date(endDate);
        if (mentorId) metadataUpdates.mentorId = mentorId;

        if (Object.keys(metadataUpdates).length > 0) {
            await tx.application.update({
                where: { id: applicationId },
                data: metadataUpdates
            });
        }

        // Committee Auto-Sync
        if (mentorUser) {
            const hodUser = await tx.user.findFirst({
                where: { role: 'HOD', department: internship.department }
            });

            await tx.committee.upsert({
                where: { internshipId: internship.id },
                update: { mentorId: mentorUser.id, hodId: hodUser?.id || null },
                create: {
                    internshipId: internship.id,
                    mentorId: mentorUser.id,
                    hodId: hodUser?.id || null
                }
            });

            // Trigger notification
            notifyMentorAssignment(mentorUser, application.student, internship).catch(e => console.error('Notify fail', e));
        }

        // Student Notifications
        const studentEmail = application.student.user?.email;
        if (studentEmail && !studentEmail.endsWith('@aptransco.portal')) {
            if (status === 'REJECTED') {
                emailService.sendStatusUpdate(studentEmail, application.student.fullName, 'Rejected', 'Your application was not selected.');
            } else if (status === 'APPROVED' || status === 'HIRED') {
                emailService.sendInterviewPass(studentEmail, application.student.fullName);
            }
        }

        return updatedApp;
    });
};

module.exports = {
    getApplications,
    updateApplication
};
