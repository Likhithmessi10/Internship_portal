const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const int = await prisma.internship.findFirst({
        where: { title: 'Test #2' },
        include: { committee: true }
    });
    console.log('Internship Test #2 Committee:', JSON.stringify(int.committee, null, 2));
    await prisma.$disconnect();
}
main();
