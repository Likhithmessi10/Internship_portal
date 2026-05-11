const prisma = require('../lib/prisma');
const { getResumeMatchScore } = require('../services/doclingService');
const SLEEP_MS = 3000; // Poll every 3 seconds

const executeJob = async (job) => {
    switch (job.type) {
        case 'RESUME_MATCH_SCORE': {
            const payload = job.payload || {};
            const applicationId = payload.applicationId;
            if (!applicationId) throw new Error('Missing applicationId in RESUME_MATCH_SCORE payload');

            const application = await prisma.application.findUnique({
                where: { id: applicationId },
                include: { internship: true }
            });

            if (!application) throw new Error(`Application not found for job payload: ${applicationId}`);

            const resumeFile = {
                path: payload.resumePath,
                originalname: payload.resumeOriginalname,
                mimetype: payload.resumeMimetype
            };

            const score = await getResumeMatchScore({
                internship: application.internship,
                resumeFile
            });

            await prisma.application.update({
                where: { id: applicationId },
                data: { 
                    resumeMatchScore: score,
                    isResumeProcessed: true
                }
            });
            break;
        }
        default:
            console.warn(`[Worker] Unknown job type: ${job.type}`);
    }
};

const workerLoop = async () => {
    console.log('👷 High-Availability Background Worker started...');
    
    // 2. MAINTENANCE TASK: Sync missing resume jobs and reset failed ones
    setInterval(async () => {
        try {
            // A. Reset FAILED jobs
            const resetResult = await prisma.job.updateMany({
                where: {
                    type: 'RESUME_MATCH_SCORE',
                    status: 'FAILED'
                },
                data: {
                    status: 'PENDING',
                    attempts: 0,
                    error: 'Auto-reset for retry after service outage'
                }
            });
            if (resetResult.count > 0) {
                console.log(`[Worker] Auto-reset ${resetResult.count} FAILED resume matching jobs.`);
            }

            // B. Find Applications with resumes but NO processed flag and NO active job
            // We order by createdAt ASC to process oldest first as requested
            const unprocessedApps = await prisma.application.findMany({
                where: {
                    isResumeProcessed: false,
                    NOT: {
                        documents: {
                            none: { type: 'RESUME' }
                        }
                    }
                },
                include: {
                    documents: {
                        where: { type: 'RESUME' }
                    }
                },
                orderBy: { createdAt: 'asc' },
                take: 50 // Process in batches
            });

            for (const app of unprocessedApps) {
                const resume = app.documents[0];
                if (!resume) continue;

                const fingerprint = `RESUME_MATCH_SCORE:${app.id}`;
                
                // Check if a job already exists for this app
                const existingJob = await prisma.job.findFirst({
                    where: { fingerprint, status: { in: ['PENDING', 'CLAIMED', 'RUNNING'] } }
                });

                if (!existingJob) {
                    await prisma.job.create({
                        data: {
                            type: 'RESUME_MATCH_SCORE',
                            status: 'PENDING',
                            fingerprint,
                            payload: {
                                applicationId: app.id,
                                resumePath: resume.fileUrl || resume.url,
                                resumeOriginalname: resume.label || 'resume.pdf',
                                resumeMimetype: 'application/pdf'
                            }
                        }
                    });
                    console.log(`[Worker] Auto-enqueued missing job for App ${app.trackingId}`);
                }
            }
        } catch (err) {
            console.error('[Worker Maintenance Error]', err.message);
        }
    }, 1000 * 60 * 2); // Run every 2 minutes for faster sync

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
