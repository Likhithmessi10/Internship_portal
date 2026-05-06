const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const apps = await prisma.application.findMany({
        where: { status: 'SHORTLISTED' },
        include: { internship: true, student: true }
    });
    console.log('Shortlisted applications:');
    console.log(JSON.stringify(apps.map(a => ({
        id: a.id,
        student: a.student.fullName,
        internship: a.internship.title,
        status: a.status
    })), null, 2));
    await prisma.$disconnect();
}
main();
