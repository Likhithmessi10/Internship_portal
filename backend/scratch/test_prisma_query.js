const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    const role = 'CE_PRTI';
    const status = 'SHORTLISTED';

    const whereClause = {};
    if (status && status !== 'ALL') {
        whereClause.status = status;
    } else if (!status) {
        whereClause.status = 'SHORTLISTED';
    }

    // Role check simulation
    const isGlobalRole = role === 'ADMIN' || role === 'CE_PRTI' || role === 'COMMITTEE_MEMBER';
    if (!isGlobalRole) {
        // ...
    }

    console.log('Testing with whereClause:', JSON.stringify(whereClause, null, 2));

    const apps = await prisma.application.findMany({
        where: whereClause
    });
    console.log('Applications found:', apps.length);
    if (apps.length > 0) {
        console.log('First app:', apps[0].id, apps[0].status);
    }
    await prisma.$disconnect();
}
test();
