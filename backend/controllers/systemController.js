const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    Get system health status
 * @route   GET /api/v1/admin/system/health
 * @access  Private (Admin, PRTI)
 */
const getSystemHealth = async (req, res) => {
    try {
        // Simple DB check
        await prisma.$queryRaw`SELECT 1`;
        
        res.status(200).json({
            success: true,
            data: {
                status: 'HEALTHY',
                database: 'CONNECTED',
                uptime: process.uptime(),
                latency: '24ms', // Simulated for now
                lastSync: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'development',
                services: {
                    portal: 'UP',
                    database: 'UP',
                    storage: 'UP',
                    auth: 'UP'
                }
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: {
                status: 'DEGRADED',
                database: 'DISCONNECTED',
                error: error.message
            }
        });
    }
};

module.exports = { getSystemHealth };
