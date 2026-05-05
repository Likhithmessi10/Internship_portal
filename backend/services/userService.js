const prisma = require('../lib/prisma');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { createAuditLog } = require('../utils/auditLogger');

const getUsersByRole = async (query, user) => {
    const { role, department } = query;
    const whereClause = {};
    if (role) whereClause.role = role;

    // If HOD, force their department
    if (user.role === 'HOD' && user.department) {
        whereClause.department = user.department;
    } else if (department) {
        whereClause.department = department;
    }

    return await prisma.user.findMany({
        where: whereClause,
        select: { id: true, name: true, email: true, department: true },
        orderBy: { name: 'asc' }
    });
};

const updateUserRole = async (targetId, role, user) => {
    const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
    if (!targetUser) throw new NotFoundError('User not found');

    if (role === 'ADMIN' && user.role !== 'ADMIN') {
        throw new ForbiddenError('Only admins can assign admin roles');
    }

    const updated = await prisma.user.update({
        where: { id: targetId },
        data: { role }
    });

    await createAuditLog('UPDATE_USER_ROLE', user.email, `Changed ${targetUser.email} role to ${role}`, targetId);
    return updated;
};

module.exports = {
    getUsersByRole,
    updateUserRole
};
