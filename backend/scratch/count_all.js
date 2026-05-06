const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.application.count();
    const byStatus = await prisma.application.groupBy({
        by: ['status'],
        _count: true
    });
    console.log('Total applications:', total);
    console.log('By status:', JSON.stringify(byStatus, null, 2));
    await prisma.$disconnect();
}
main();
