const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const internships = await prisma.internship.findMany({
        select: { id: true, title: true },
        take: 5
    });
    console.log(JSON.stringify(internships, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
