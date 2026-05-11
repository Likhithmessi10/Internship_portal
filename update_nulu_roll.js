const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generatePortalRollNumber } = require('./backend/services/rollNumberService');

async function main() {
    try {
        // Find student Nulu
        const student = await prisma.studentProfile.findFirst({
            where: {
                fullName: {
                    contains: 'Nulu',
                    mode: 'insensitive'
                }
            },
            include: {
                applications: {
                    where: {
                        status: { in: ['APPROVED', 'HIRED', 'ONGOING'] }
                    }
                }
            }
        });

        if (!student) {
            console.log('Student "Nulu" not found.');
            return;
        }

        console.log(`Found student: ${student.fullName} (ID: ${student.id})`);

        const app = student.applications[0];
        if (!app) {
            console.log('No active application found for this student.');
            return;
        }

        console.log(`Using application: ${app.id}`);

        // Generate new roll number
        // We need to pass the transaction or just the db if we want to simulate
        // But the service takes (applicationId, tx)
        const newRollNumber = await generatePortalRollNumber(app.id);
        console.log(`Generated new Roll Number: ${newRollNumber}`);

        // Update student
        const updated = await prisma.studentProfile.update({
            where: { id: student.id },
            data: { rollNumber: newRollNumber }
        });

        console.log(`SUCCESS: Updated ${updated.fullName} with roll number ${updated.rollNumber}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
