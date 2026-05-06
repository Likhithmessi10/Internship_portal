const prisma = require('../lib/prisma');

async function main() {
    // Delete the duplicate accounts
    const duplicateIds = [
        '8ba335c1-f370-49b0-9398-1676d5d418c5', // Likhith (LikhithPRTI@gmail.com) - duplicate of likhithprti@gmail.com
        'c4ac8079-12a8-400c-a1dc-959d96707d20',  // PRTI Central (prti@transco.com) - duplicate of prti@aptransco.com
    ];

    for (const id of duplicateIds) {
        try {
            await prisma.user.delete({ where: { id } });
            console.log(`Deleted duplicate user: ${id}`);
        } catch (err) {
            console.log(`Could not delete ${id}: ${err.message}`);
        }
    }

    // Also normalize existing emails to lowercase
    const allUsers = await prisma.user.findMany({ select: { id: true, email: true } });
    for (const u of allUsers) {
        const lower = u.email.trim().toLowerCase();
        if (lower !== u.email) {
            await prisma.user.update({ where: { id: u.id }, data: { email: lower } });
            console.log(`Normalized email: ${u.email} -> ${lower}`);
        }
    }

    // Verify
    const remaining = await prisma.user.findMany({
        where: { role: 'CE_PRTI' },
        select: { id: true, name: true, email: true }
    });
    console.log('\nRemaining CE_PRTI accounts:');
    console.log(JSON.stringify(remaining, null, 2));

    await prisma.$disconnect();
}

main();
