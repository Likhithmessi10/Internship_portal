const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const rollNumber = '260101002';
        const student = await prisma.studentProfile.findFirst({
            where: {
                rollNumber: {
                    equals: rollNumber,
                    mode: 'insensitive'
                }
            },
            include: {
                user: {
                    select: {
                        email: true,
                        lastLogin: true
                    }
                },
                applications: {
                    include: {
                        internship: true,
                        departmentGroup: true,
                        mentor: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        },
                        attendance: true,
                        stipend: true,
                        workAssignments: {
                            orderBy: { createdAt: 'desc' }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        console.log('Success:', student ? student.fullName : 'Not found');
    } catch (error) {
        console.error('FAILED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
