const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const defaultEmail = 'admin@aptransco.gov.in';
    const defaultPassword = 'admin@aptransco@123';

    console.log('--- Seeding Default Admin Account ---');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const admin = await prisma.user.upsert({
        where: { email: defaultEmail },
        update: {
            password: hashedPassword,
            role: 'ADMIN'
        },
        create: {
            email: defaultEmail,
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log(`\nSUCCESS! Admin account seeded.`);
    console.log(`Email    : ${admin.email}`);
    console.log(`Password : ${defaultPassword}`); // Cleartext for quick reference
    console.log('-------------------------------------\n');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
