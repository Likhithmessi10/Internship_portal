const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const internships = await prisma.internship.findMany({
            select: { id: true, title: true }
        });
        console.log(JSON.stringify(internships, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
