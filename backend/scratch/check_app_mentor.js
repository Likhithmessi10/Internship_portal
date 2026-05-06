const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const app = await prisma.application.findFirst({
        where: { status: 'SHORTLISTED' }
    });
    console.log('Shortlisted application mentorId:', app.mentorId);
    await prisma.$disconnect();
}
main();
