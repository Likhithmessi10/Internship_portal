const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const student = await prisma.studentProfile.findFirst({
            where: {
                fullName: {
                    contains: 'Mukkamala',
                    mode: 'insensitive'
                }
            }
        });

        if (student) {
            console.log(`Student: ${student.fullName}`);
            console.log(`Roll Number: ${student.rollNumber || 'NULL'}`);
        } else {
            console.log('Student "Mukkamala" not found.');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
