const prisma = require('../lib/prisma');
const { NotFoundError, ValidationError } = require('../utils/errors');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * Create a new internship with evaluation criteria
 */
const createInternship = async (internshipData, user) => {
    const { evaluationQuestions, ...data } = internshipData;

    // Validate department
    let targetDepartment = data.department;
    if ((user.role === 'HOD' || user.role === 'MENTOR') && user.department) {
        targetDepartment = user.department;
    }

    if (!targetDepartment) {
        throw new ValidationError('Department is required');
    }

    const internship = await prisma.internship.create({
        data: {
            ...data,
            department: targetDepartment,
            openingsCount: parseInt(data.openingsCount),
            applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline) : null,
            priorityCollegeQuota: parseInt(data.priorityCollegeQuota) || 0,
            stipendAmount: data.stipendAmount ? parseFloat(data.stipendAmount) : null,
            shortlistingRatio: parseInt(data.shortlistingRatio) || 2,
        }
    });

    // Insert evaluation questions
    if (evaluationQuestions && Array.isArray(evaluationQuestions) && evaluationQuestions.length > 0) {
        const criteriaData = evaluationQuestions.map(q => ({
            internshipId: internship.id,
            question: q,
            maxScore: 50
        }));
        await prisma.internshipEvaluationCriteria.createMany({
            data: criteriaData
        });
    }

    await createAuditLog('CREATE_INTERNSHIP', user.email, `Created: ${internship.title}`, internship.id);
    return internship;
};

/**
 * Get all internships with pagination and stats
 */
const getAllInternships = async (options, user) => {
    const { page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    const whereClause = {};
    if (user.role !== 'ADMIN' && user.role !== 'CE_PRTI' && user.department) {
        whereClause.department = user.department;
    }

    const [internships, total] = await Promise.all([
        prisma.internship.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
            include: {
                _count: { select: { applications: true } },
                applications: { 
                    select: { status: true },
                    where: { status: { in: ['APPROVED', 'HIRED', 'ONGOING', 'COMPLETED'] } }
                }
            }
        }),
        prisma.internship.count({ where: whereClause })
    ]);

    const result = internships.map(i => ({
        ...i,
        applicationsCount: i._count.applications,
        hiredCount: i.applications.length,
        remainingOpenings: Math.max(0, i.openingsCount - i.applications.length),
        applications: undefined,
        _count: undefined
    }));

    return {
        data: result,
        pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    };
};

/**
 * Delete an internship
 */
const deleteInternship = async (id, user) => {
    const internship = await prisma.internship.findUnique({ where: { id } });
    if (!internship) throw new NotFoundError('Internship not found');

    await prisma.internship.delete({ where: { id } });
    await createAuditLog('DELETE_INTERNSHIP', user.email, `Deleted: ${internship.title}`, id);
    return true;
};

/**
 * Toggle internship status
 */
const toggleInternship = async (id, user) => {
    const internship = await prisma.internship.findUnique({ where: { id } });
    if (!internship) throw new NotFoundError('Internship not found');

    const updated = await prisma.internship.update({
        where: { id },
        data: { isActive: !internship.isActive }
    });

    await createAuditLog('TOGGLE_INTERNSHIP', user.email, `Toggled status for: ${internship.title}`, id);
    return updated;
};

module.exports = {
    createInternship,
    getAllInternships,
    deleteInternship,
    toggleInternship
};
