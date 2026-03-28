const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function main() {
    const defaultEmail = 'admin@aptransco.gov.in';
    // Use environment variable or generate random password
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 
                           crypto.randomBytes(12).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

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

    console.log(`\n✅ SUCCESS! Admin account seeded.`);
    console.log(`Email    : ${admin.email}`);
    console.log(`Password : ${process.env.DEFAULT_ADMIN_PASSWORD ? defaultPassword : '[GENERATED - SEE BELOW]'}`);
    console.log('');
    console.log('⚠️  IMPORTANT: Save this password securely!');
    console.log('⚠️  It is NOT stored in the database and cannot be recovered.');
    console.log('⚠️  Change it immediately after first login.\n');
    console.log('┌' + '─'.repeat(50) + '┐');
    console.log('│ ' + `Admin Password: ${defaultPassword}`.padEnd(50) + ' │');
    console.log('└' + '─'.repeat(50) + '┘');
    console.log('');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
