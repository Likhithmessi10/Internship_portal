const prisma = require('../lib/prisma');
const { processApplication, runShortlistingForInternship } = require('../services/shortlistingService');

const SLEEP_MS = 3000; // Poll every 3 seconds

const executeJob = async (job) => {
    switch (job.type) {
        case 'RESUME_SCORING':
            if (job.payload.applicationId) {
                await processApplication(job.payload.applicationId);
            }
            break;
        case 'BATCH_SHORTLIST':
            if (job.payload.internshipId) {
                await runShortlistingForInternship(job.payload.internshipId);
            }
            break;
        default:
            console.warn(`[Worker] Unknown job type: ${job.type}`);
    }
};

const workerLoop = async () => {
    console.log('👷 High-Availability Background Worker started...');
    
    while (true) {
        try {
            // Atomic Claim using PG SKIP LOCKED
            // Note: We use queryRaw for atomicity that findFirst+update lacks
            const claimedJobs = await prisma.$queryRaw`
                UPDATE "Job"
                SET status = 'CLAIMED', "startedAt" = NOW(), "updatedAt" = NOW()
                WHERE id = (
                    SELECT id FROM "Job"
                    WHERE status = 'PENDING'
                    ORDER BY "createdAt" ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1
                )
                RETURNING *
            `;

            const job = claimedJobs[0];

            if (job) {
                console.log(`[Worker] Claimed job ${job.id} (${job.type})`);
                
                try {
                    // Implicit transition to RUNNING in logic (or just keep as CLAIMED)
                    await executeJob(job);
                    
                    await prisma.job.update({
                        where: { id: job.id },
                        data: { 
                            status: 'COMPLETED', 
                            completedAt: new Date(),
                            attempts: job.attempts + 1
                        }
                    });
                } catch (err) {
                    console.error(`[Worker] Job ${job.id} failed:`, err.message);
                    const isLastAttempt = job.attempts + 1 >= job.maxAttempts;
                    await prisma.job.update({
                        where: { id: job.id },
                        data: { 
                            status: isLastAttempt ? 'FAILED' : 'PENDING',
                            attempts: job.attempts + 1,
                            error: err.message
                        }
                    });
                }
            } else {
                await new Promise(resolve => setTimeout(resolve, SLEEP_MS));
            }
        } catch (error) {
            console.error('[Worker Loop Error]', error.message);
            await new Promise(resolve => setTimeout(resolve, SLEEP_MS));
        }
    }
};

module.exports = { workerLoop };
