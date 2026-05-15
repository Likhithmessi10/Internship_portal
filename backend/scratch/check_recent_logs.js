const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecentLogs() {
    try {
        const logs = await prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        console.log('Recent Audit Logs:', JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkRecentLogs();
