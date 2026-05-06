const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const int = await prisma.internship.findFirst({
        where: { title: 'Test #2' }
    });
    console.log('Internship Test #2:', JSON.stringify(int, null, 2));
    await prisma.$disconnect();
}
main();
