const prisma = require('../lib/prisma');

const TEMPLATE_FILLING_URL = (process.env.TEMPLATE_FILLING_URL || 'http://localhost:3100').replace(/\/+$/, '');

async function pingDb() {
    const start = Date.now();
    try {
        await prisma.$queryRaw`SELECT 1`;
        return { status: 'UP', latencyMs: Date.now() - start };
    } catch {
        return { status: 'DOWN', latencyMs: null };
    }
}

async function pingTemplateFilling() {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const res = await fetch(`${TEMPLATE_FILLING_URL}/`, { signal: controller.signal });
        clearTimeout(timeout);
        return { status: res.ok || res.status < 500 ? 'UP' : 'DEGRADED', latencyMs: Date.now() - start };
    } catch {
        return { status: 'DOWN', latencyMs: null };
    }
}

/**
 * GET /api/v1/admin/system/health
 * Comprehensive system health: uptime, memory, DB, services, job+app stats.
 */
const getSystemHealth = async (req, res) => {
    try {
        const [jobStats, appStats, dbPing, templatePing] = await Promise.all([
            prisma.job.groupBy({ by: ['status'], _count: { _all: true } }).catch(() => []),
            prisma.application.groupBy({ by: ['status'], _count: { _all: true } }).catch(() => []),
            pingDb(),
            pingTemplateFilling(),
        ]);

        const jobs = jobStats.reduce((acc, curr) => {
            acc[curr.status.toLowerCase()] = curr._count._all;
            return acc;
        }, {});

        const apps = appStats.reduce((acc, curr) => {
            acc[curr.status.toLowerCase()] = curr._count._all;
            return acc;
        }, {});

        const mem = process.memoryUsage();
        const failed = jobs.failed || 0;
        const completed = jobs.completed || 0;
        const overallStatus = dbPing.status !== 'UP' ? 'CRITICAL'
            : failed > 10 ? 'DEGRADED'
            : 'HEALTHY';

        res.status(200).json({
            success: true,
            data: {
                status: overallStatus,
                uptime: Math.floor(process.uptime()),
                timestamp: new Date().toISOString(),
                environment: process.env.NODE_ENV || 'production',
                nodeVersion: process.version,
                memory: {
                    heapUsedMb:  Math.round(mem.heapUsed  / 1024 / 1024),
                    heapTotalMb: Math.round(mem.heapTotal / 1024 / 1024),
                    rssMb:       Math.round(mem.rss       / 1024 / 1024),
                    heapPct:     Math.round((mem.heapUsed / mem.heapTotal) * 100),
                },
                services: {
                    database:        { ...dbPing,       name: 'PostgreSQL Database' },
                    templateFilling: { ...templatePing, name: 'Template Filling Sidecar' },
                    api:             { status: 'UP', latencyMs: 0, name: 'Main API Server' },
                },
                slo: {
                    jobThroughput:  completed,
                    jobFailureRate: (completed + failed) > 0
                        ? ((failed / (completed + failed)) * 100).toFixed(2) + '%'
                        : '0%',
                    activeWorkers: jobs.claimed || 0,
                },
                distribution: {
                    applications: apps,
                    jobs,
                },
            },
        });
    } catch (error) {
        console.error('[Health Check Error]', error.message);
        res.status(500).json({ success: false, message: 'Health check failed' });
    }
};

module.exports = { getSystemHealth };
