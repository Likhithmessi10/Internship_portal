const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clean() {
    await prisma.taskSubmission.deleteMany({});
    await prisma.workAssignment.deleteMany({});
    await prisma.attendance.deleteMany({});
    await prisma.stipend.deleteMany({});
    await prisma.document.deleteMany({});
    await prisma.shortlist.deleteMany({});
    await prisma.application.deleteMany({});
    console.log('Deleted existing applications');
}

clean()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
