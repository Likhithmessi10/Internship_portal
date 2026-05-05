const prisma = require('../lib/prisma');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { notifyWorkAssignment } = require('./mailService');

const assignWork = async (workData, user) => {
    const { applicationId, title, description, dueDate } = workData;
    const mentorId = user.id;

    const application = await prisma.application.findUnique({
        where: { id: applicationId },
        include: { student: { include: { user: true } } }
    });

    if (!application) throw new NotFoundError('Application not found');
    if (application.mentorId !== mentorId && user.role !== 'ADMIN') {
        throw new ForbiddenError('Unauthorized to assign work to this intern');
    }

    const work = await prisma.workAssignment.create({
        data: {
            applicationId,
            mentorId,
            studentId: application.studentId,
            title,
            description,
            dueDate: dueDate ? new Date(dueDate) : null
        }
    });

    // Notify Intern
    const student = application.student;
    await notifyWorkAssignment(
        student.user.email,
        student.fullName,
        user.name || 'Your Mentor',
        title,
        description
    ).catch(e => console.error('Work notify fail', e));

    return work;
};

const getWorkAssignments = async (query, user) => {
    const { applicationId } = query;
    let whereClause = {};

    if (applicationId) {
        whereClause.applicationId = applicationId;
    } else if (user.role === 'MENTOR') {
        whereClause.mentorId = user.id;
    } else if (user.role === 'STUDENT') {
        // This part depends on how studentProfileId is stored in the user object
        // For now, we'll assume it's passed or derived
        const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
        if (profile) whereClause.studentId = profile.id;
    }

    return await prisma.workAssignment.findMany({
        where: whereClause,
        include: {
            student: { select: { fullName: true } },
            mentor: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
};

module.exports = {
    assignWork,
    getWorkAssignments
};
