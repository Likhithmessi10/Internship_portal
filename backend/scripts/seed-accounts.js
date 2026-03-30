const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

const defaultDepartments = [
    'TRANSMISSION',
    'PLANNING AND POWER SYSTEMS',
    'SLDC',
    'PROJECTS',
    'APPCC AND LEGAL',
    'COMMERCIAL AND COORDINATION LMC',
    'HRD',
    'ZONE VIJAYAWADA',
    'ZONE VISHAKAPATNAM',
    'APPCC',
    'ZONE KADAPA',
    'CIVIL',
    'TELECOM AND IT',
    'ADDITIONAL SECRETARY',
    'CGM AND FINANCE'
];

async function seedAccounts() {
    console.log('==========================================');
    console.log('   PRTI Internship - Seed Accounts Logic');
    console.log('==========================================\n');

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);
        
        // 1. Get Portal Config (or use defaults)
        let departments = defaultDepartments;
        const config = await prisma.portalConfiguration.findUnique({ where: { id: 'singleton' } });
        if (config && config.departments && Array.isArray(config.departments)) {
            departments = config.departments;
        }

        console.log(`Processing ${departments.length} departments...\n`);
        console.log('--- Account Credentials ---');
        console.log('Format: ROLE | DEPARTMENT | EMAIL | PASSWORD');
        console.log('------------------------------------------');

        for (const dept of departments) {
            const deptSlug = dept.toLowerCase().replace(/[^a-z0-9]/g, '.');
            
            // Seed HOD
            const hodEmail = `hod.${deptSlug}@transco.com`;
            await prisma.user.upsert({
                where: { email: hodEmail },
                update: {}, // Don't change if exists
                create: {
                    email: hodEmail,
                    password: passwordHash,
                    role: 'HOD',
                    department: dept,
                    name: `${dept} HOD`
                }
            });
            console.log(`HOD    | ${dept.padEnd(30)} | ${hodEmail.padEnd(35)} | password123`);

            // Seed Mentor
            const mentorEmail = `mentor.${deptSlug}@transco.com`;
            await prisma.user.upsert({
                where: { email: mentorEmail },
                update: {},
                create: {
                    email: mentorEmail,
                    password: passwordHash,
                    role: 'MENTOR',
                    department: dept,
                    name: `${dept} Mentor`
                }
            });
            console.log(`MENTOR | ${dept.padEnd(30)} | ${mentorEmail.padEnd(35)} | password123`);
        }

        // 2. Seed CE_PRTI (PRTI Central) account
        const prtiEmail = 'prti@transco.com';
        await prisma.user.upsert({
            where: { email: prtiEmail },
            update: {},
            create: {
                email: prtiEmail,
                password: passwordHash,
                role: 'CE_PRTI',
                name: 'PRTI Central'
            }
        });
        console.log(`PRTI   | ALL                            | ${prtiEmail.padEnd(35)} | password123`);

        // 3. Seed a default PRTI Admin for good measure if doesn't exist
        const adminEmail = 'admin@transco.com';
        await prisma.user.upsert({
            where: { email: adminEmail },
            update: {},
            create: {
                email: adminEmail,
                password: passwordHash,
                role: 'ADMIN',
                name: 'System Administrator'
            }
        });
        console.log(`ADMIN  | ALL                            | ${adminEmail.padEnd(35)} | password123`);

        console.log('\n------------------------------------------');
        console.log('✅ Seeding complete!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedAccounts();
