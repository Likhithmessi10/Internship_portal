// Fix: Assign mentor to CA_APPROVED applications
// Run: node backend/scripts/fix-mentor-assignment.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixMentorAssignment() {
    try {
        console.log('🔍 Finding CA_APPROVED applications without mentor...\n');
        
        // Find all CA_APPROVED applications without mentor
        const applications = await prisma.application.findMany({
            where: {
                status: 'CA_APPROVED',
                mentorId: null
            },
            include: {
                internship: true,
                student: true
            }
        });

        console.log(`Found ${applications.length} applications without mentor\n`);

        if (applications.length === 0) {
            console.log('✅ All applications already have mentors assigned!');
            return;
        }

        // For each application, find a mentor from the same department
        for (const app of applications) {
            console.log(`Processing: ${app.student.fullName} - ${app.internship.title}`);
            console.log(`  Department: ${app.internship.department}`);
            
            // Find mentor from same department
            const mentor = await prisma.user.findFirst({
                where: {
                    role: 'MENTOR',
                    department: app.internship.department
                }
            });

            if (mentor) {
                // Assign mentor to application
                await prisma.application.update({
                    where: { id: app.id },
                    data: { mentorId: mentor.id }
                });
                console.log(`  ✅ Assigned mentor: ${mentor.email}\n`);
            } else {
                console.log(`  ⚠️  No mentor found for department: ${app.internship.department}\n`);
            }
        }

        console.log('✅ Mentor assignment complete!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixMentorAssignment();
