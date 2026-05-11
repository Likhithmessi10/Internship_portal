const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSyncStatus() {
    try {
        const unprocessed = await prisma.application.findMany({
            where: { isResumeProcessed: false },
            include: {
                documents: { where: { type: 'RESUME' } }
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`Found ${unprocessed.length} unprocessed applications.`);

        for (const app of unprocessed) {
            const fingerprint = `RESUME_MATCH_SCORE:${app.id}`;
            const job = await prisma.job.findFirst({
                where: { fingerprint }
            });

            console.log(`- App: ${app.trackingId} | Created: ${app.createdAt} | Resume: ${app.documents.length > 0 ? 'YES' : 'NO'}`);
            if (job) {
                console.log(`  Job: ${job.id} | Status: ${job.status} | Attempts: ${job.attempts} | Error: ${job.error}`);
            } else {
                console.log(`  Job: NO JOB FOUND`);
            }
        }
    } catch (error) {
        console.error('Check failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkSyncStatus();
