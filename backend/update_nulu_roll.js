const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { generatePortalRollNumber } = require('./services/rollNumberService');

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
            const anyStudent = await prisma.studentProfile.findFirst();
            if (anyStudent) {
                console.log(`Available student: ${anyStudent.fullName}`);
            }
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
