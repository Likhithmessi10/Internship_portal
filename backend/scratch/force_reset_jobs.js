const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function forceReset() {
    try {
        const result = await prisma.job.updateMany({
            where: {
                type: 'RESUME_MATCH_SCORE',
                status: 'FAILED'
            },
            data: {
                status: 'PENDING',
                attempts: 0,
                error: 'Force reset by admin'
            }
        });
        console.log(`Force reset ${result.count} FAILED jobs to PENDING.`);
    } catch (error) {
        console.error('Reset failed:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

forceReset();
