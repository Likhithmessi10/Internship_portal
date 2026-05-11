const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generatePortalRollNumber } = require('./services/rollNumberService');

async function main() {
    try {
        const student = await prisma.studentProfile.findFirst({
            where: { fullName: { contains: 'Mukkamala', mode: 'insensitive' } },
            include: { applications: { where: { status: { in: ['APPROVED', 'HIRED', 'ONGOING'] } } } }
        });

        if (!student) return console.log('Student not found');
        const app = student.applications[0];
        if (!app) return console.log('No active app');

        const newRollNumber = await generatePortalRollNumber(app.id);
        const updated = await prisma.studentProfile.update({
            where: { id: student.id },
            data: { rollNumber: newRollNumber }
        });

        console.log(`Updated ${updated.fullName} to ${updated.rollNumber}`);
    } catch (error) { console.error(error); } finally { await prisma.$disconnect(); }
}

main();
