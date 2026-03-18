const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const uCount = await prisma.user.count();
        const sCount = await prisma.studentProfile.count();
        console.log(`Users: ${uCount}, Students: ${sCount}`);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
check();
