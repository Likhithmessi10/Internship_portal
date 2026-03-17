const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Default Admin Account...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@aptransco.gov.in' },
        update: {
            password: hashedPassword,
            role: 'ADMIN'
        },
        create: {
            email: 'admin@aptransco.gov.in',
            password: hashedPassword,
            role: 'ADMIN',
        },
    });

    console.log(`Admin account created with email: ${admin.email}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
