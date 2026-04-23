const prisma = require('../lib/prisma');

/**
 * Enqueue a new background job with optional fingerprint for deduplication
 */
const enqueueJob = async (type, payload, fingerprint = null) => {
    try {
        return await prisma.job.create({
            data: {
                type,
                payload,
                status: 'PENDING',
                fingerprint
            }
        });
    } catch (error) {
        // If unique constraint fails, return existing job or null
        if (error.code === 'P2002') {
            console.log(`[JobService] Duplicate ignored for fingerprint: ${fingerprint}`);
            return await prisma.job.findUnique({ where: { fingerprint } });
        }
        throw error;
    }
};

/**
 * Get job status
 */
const getJobStatus = async (jobId) => {
    return await prisma.job.findUnique({
        where: { id: jobId }
    });
};

module.exports = {
    enqueueJob,
    getJobStatus
};
