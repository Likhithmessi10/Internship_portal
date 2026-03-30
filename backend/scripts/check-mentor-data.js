// Check and fix mentor assignment
// Run: node backend/scripts/check-mentor-data.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMentorData() {
    try {
        const MENTOR_ID = 'fa8f7d3b-beab-4268-9a24-613611baef06';
        
        console.log('=== CHECKING MENTOR DATA ===\n');
        
        // 1. Check mentor user
        const mentor = await prisma.user.findUnique({
            where: { id: MENTOR_ID }
        });
        
        console.log('1. Mentor User:');
        console.log('   ID:', mentor?.id);
        console.log('   Email:', mentor?.email);
        console.log('   Role:', mentor?.role);
        console.log('   Department:', mentor?.department);
        console.log('');
        
        // 2. Check CA_APPROVED applications
        const caApprovedApps = await prisma.application.findMany({
            where: { status: 'CA_APPROVED' },
            include: {
                internship: true,
                student: true
            }
        });
        
        console.log('2. CA_APPROVED Applications:', caApprovedApps.length);
        caApprovedApps.forEach(app => {
            console.log(`   - ${app.student.fullName}`);
            console.log(`     Internship: ${app.internship.title}`);
            console.log(`     Department: ${app.internship.department}`);
            console.log(`     Mentor ID: ${app.mentorId}`);
            console.log(`     Matches: ${app.mentorId === MENTOR_ID ? '✅ YES' : '❌ NO'}`);
            console.log('');
        });
        
        // 3. Check if any applications have this mentor
        const mentorApps = await prisma.application.findMany({
            where: { mentorId: MENTOR_ID },
            include: {
                internship: true,
                student: true
            }
        });
        
        console.log('3. Applications with THIS mentor:', mentorApps.length);
        mentorApps.forEach(app => {
            console.log(`   - ${app.student.fullName} (${app.status})`);
            console.log('');
        });
        
        // 4. Fix: Assign mentor to SLDC CA_APPROVED applications
        if (caApprovedApps.length > 0 && mentorApps.length === 0) {
            console.log('4. FIXING: Assigning mentor to SLDC CA_APPROVED applications...\n');
            
            for (const app of caApprovedApps) {
                if (app.internship.department === 'SLDC' && !app.mentorId) {
                    await prisma.application.update({
                        where: { id: app.id },
                        data: { mentorId: MENTOR_ID }
                    });
                    console.log(`   ✅ Assigned mentor to: ${app.student.fullName}`);
                }
            }
            
            console.log('\n✅ Fix complete! Refresh mentor dashboard.');
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkMentorData();
