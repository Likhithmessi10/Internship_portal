const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function findUser() {
    try {
        const student = await prisma.studentProfile.findFirst({
            where: {
                fullName: {
                    contains: 'Mukkamala',
                    mode: 'insensitive'
                }
            },
            include: {
                user: true,
                applications: {
                    include: {
                        internship: true
                    }
                }
            }
        });

        console.log('Student found:', JSON.stringify(student, null, 2));

        if (!student) {
            // Try searching in User table
            const user = await prisma.user.findFirst({
                where: {
                    name: {
                        contains: 'Mukkamala',
                        mode: 'insensitive'
                    }
                },
                include: {
                    studentProfile: true
                }
            });
            console.log('User found:', JSON.stringify(user, null, 2));
        }

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

findUser();
