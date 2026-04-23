const prisma = require('../lib/prisma');

/**
 * @desc    Get system health status & Job SLO metrics
 * @route   GET /api/v1/admin/system/health
 * @access  Private (Admin, PRTI)
 */
const getSystemHealth = async (req, res) => {
    try {
        const [jobStats, appStats] = await Promise.all([
            prisma.job.groupBy({
                by: ['status'],
                _count: { _all: true }
            }),
            prisma.application.groupBy({
                by: ['status'],
                _count: { _all: true }
            })
        ]);

        const jobs = jobStats.reduce((acc, curr) => {
            acc[curr.status.toLowerCase()] = curr._count._all;
            return acc;
        }, {});

        const apps = appStats.reduce((acc, curr) => {
            acc[curr.status.toLowerCase()] = curr._count._all;
            return acc;
        }, {});
        
        res.status(200).json({
            success: true,
            data: {
                status: (jobs.failed || 0) > 10 ? 'DEGRADED' : 'HEALTHY',
                uptime: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
                slo: {
                    jobThroughput: jobs.completed || 0,
                    jobFailureRate: jobs.failed ? ((jobs.failed / (jobs.completed + jobs.failed)) * 100).toFixed(2) + '%' : '0%',
                    activeWorkers: jobs.claimed || 0
                },
                distribution: {
                    applications: apps,
                    jobs: jobs
                }
            }
        });
    } catch (error) {
        console.error('[Health Check Error]', error.message);
        res.status(500).json({ success: false, message: 'Health check failed' });
    }
};

module.exports = { getSystemHealth };
