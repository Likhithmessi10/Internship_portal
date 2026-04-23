const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearDatabase() {
    console.log('⚠️  Starting Database Purge...');
    
    try {
        // High-level order to handle foreign keys
        // 1. Dependent Student data
        await prisma.taskSubmission.deleteMany({});
        await prisma.workAssignment.deleteMany({});
        await prisma.stipend.deleteMany({});
        await prisma.attendance.deleteMany({});
        await prisma.document.deleteMany({});
        await prisma.shortlist.deleteMany({});
        
        // 2. Main operational data
        await prisma.application.deleteMany({});
        await prisma.committee.deleteMany({});
        await prisma.internship.deleteMany({});
        
        // 3. Profiles and Otp
        await prisma.studentProfile.deleteMany({});
        await prisma.otpVerification.deleteMany({});
        await prisma.auditLog.deleteMany({});
        
        // 4. Users (Keep only system users or delete all?)
        // The user said "CLEAN ALL", so we will remove all students and non-system accounts.
        // For a TRULY fresh test, we'll remove all and they can re-seed.
        // However, let's keep the core ADMIN if it exists to prevent lockout, or just wipe all.
        // Let's wipe ALL users and expect them to re-run seed.
        await prisma.user.deleteMany({});

        console.log('✅ Database cleaned successfully!');
        console.log('👉 Next step: Run "node scripts/seed-accounts.js" to restore admin logins.');
    } catch (error) {
        console.error('❌ Error during purge:', error);
    } finally {
        await prisma.$disconnect();
    }
}

clearDatabase();
