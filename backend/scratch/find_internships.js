const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const internships = await prisma.internship.findMany({
            where: {
                internshipType: 'NON_STIPEND'
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });
        console.log(JSON.stringify(internships, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
