const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAuditLogs() {
    try {
        const logs = await prisma.auditLog.findMany({
            where: {
                details: {
                    contains: 'Mukkamala',
                    mode: 'insensitive'
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        console.log('Audit Logs:', JSON.stringify(logs, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAuditLogs();
