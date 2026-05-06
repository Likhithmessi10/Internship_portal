const prisma = require('../lib/prisma');

async function main() {
    const users = await prisma.user.findMany({
        where: { role: 'CE_PRTI' },
        select: { id: true, name: true, email: true, createdAt: true }
    });
    console.log('CE_PRTI accounts in database:');
    console.log(JSON.stringify(users, null, 2));
    console.log(`Total: ${users.length}`);
    await prisma.$disconnect();
}

main();
