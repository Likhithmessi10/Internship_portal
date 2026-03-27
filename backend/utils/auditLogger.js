const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create an audit log entry
 * @param {string} action - The action performed (e.g., 'CREATE_INTERNSHIP')
 * @param {string} userEmail - Email of the user who performed the action
 * @param {string} details - Additional details
 * @param {string} target - Target ID or reference
 */
const createAuditLog = async (action, userEmail, details = null, target = null) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                userEmail,
                details,
                target
            }
        });
    } catch (error) {
        console.error('Audit Log Error:', error);
    }
};

module.exports = { createAuditLog };
