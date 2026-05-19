const prisma = require('../lib/prisma');

/**
 * GET /api/v1/admin/audit-logs
 * Supports: ?limit=50&offset=0&search=&action=&from=ISO&to=ISO
 */
const getAuditLogs = async (req, res) => {
    try {
        const limit  = Math.min(200, Math.max(1, parseInt(req.query.limit  || '50', 10)));
        const offset = Math.max(0,              parseInt(req.query.offset || '0',  10));
        const search = (req.query.search || '').trim();
        const action = (req.query.action || '').trim().toUpperCase();
        const from   = req.query.from ? new Date(req.query.from) : null;
        const to     = req.query.to   ? new Date(req.query.to)   : null;

        const where = {};

        if (action) {
            where.action = { contains: action, mode: 'insensitive' };
        }

        if (search) {
            where.OR = [
                { action:    { contains: search, mode: 'insensitive' } },
                { userEmail: { contains: search, mode: 'insensitive' } },
                { details:   { contains: search, mode: 'insensitive' } },
                { target:    { contains: search, mode: 'insensitive' } },
            ];
        }

        if (from || to) {
            where.createdAt = {
                ...(from ? { gte: from } : {}),
                ...(to   ? { lte: to   } : {}),
            };
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take:   limit,
                skip:   offset,
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.status(200).json({
            success: true,
            data:    logs,
            meta:    { total, limit, offset },
        });
    } catch (error) {
        console.error('[AuditLog Error]', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { getAuditLogs };
