const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findUnique({
        where: { id: '8085d446-58b7-42b0-8162-d5edfaaa74d0' }
    });
    console.log('HOD User:', JSON.stringify(user, null, 2));
    await prisma.$disconnect();
}
main();
