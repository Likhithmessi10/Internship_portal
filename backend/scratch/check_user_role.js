const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'likhithprti@gmail.com' }
    });
    console.log('User role:', user.role);
    await prisma.$disconnect();
}
main();
