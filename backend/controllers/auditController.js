const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    Get all audit logs
 * @route   GET /api/v1/admin/audit-logs
 * @access  Private (Admin, PRTI)
 */
const getAuditLogs = async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 100 // Last 100 actions
        });
        res.status(200).json({ success: true, data: logs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { getAuditLogs };
