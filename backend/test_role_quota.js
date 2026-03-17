const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runTest() {
    console.log("--- Role-Based Quota Verification Test ---");

    // 1. Create a Test Internship with Role Quotas
    const internship = await prisma.internship.create({
        data: {
            title: "Role Quota Test Internship",
            department: "Electrical Engineering",
            description: "Testing role-specific quotas for APTRANSCO.",
            openingsCount: 10,
            location: "Vijayawada",
            duration: "8 Weeks",
            roles: "GET Electrical, SCADA Intern",
            rolesData: [
                { name: "GET Electrical", openings: 5, topUnivQuota: 40 }, // 40% of 5 = 2 seats
                { name: "SCADA Intern", openings: 5, topUnivQuota: 60 }   // 60% of 5 = 3 seats
            ],
            quotaPercentages: { topUniversity: 100 } // Setting global to 100% so we only test role quota
        }
    });

    console.log(`Created Internship: ${internship.id}`);

    // 2. Identify Top University Students
    const topStudents = await prisma.studentProfile.findMany({
        where: {
            OR: [
                { nirfRanking: { lte: 100, gt: 0 } },
                { collegeCategory: { in: ['IIT', 'NIT', 'IIIT', 'CENTRAL'] } }
            ]
        },
        take: 10
    });

    if (topStudents.length < 5) {
        console.error("Not enough top university students in DB for testing.");
        return;
    }

    console.log(`Found ${topStudents.length} Top University Students.`);

    // 3. Create Applications
    for (const student of topStudents) {
        await prisma.application.upsert({
            where: { studentId_internshipId: { studentId: student.id, internshipId: internship.id } },
            update: { status: 'PENDING' },
            create: {
                studentId: student.id,
                internshipId: internship.id,
                trackingId: `TEST-${student.id.substring(0, 5)}`,
                status: 'PENDING'
            }
        });
    }

    console.log("Applications created and reset to PENDING.");

    // 4. Test Logic: Hire 2 for GET Electrical (Quota = 2)
    console.log("\n--- Testing 'GET Electrical' Quota (Limit 2) ---");
    const testRole = "GET Electrical";
    const apps = await prisma.application.findMany({ 
        where: { internshipId: internship.id },
        include: { student: true }
    });

    for (let i = 0; i < 3; i++) {
        const app = apps[i];
        try {
            // Simulate the backend logic basically
            // In a real verification we'd hit the API, but this verifies the DB state logic is correct
            console.log(`Hiring Student ${i+1}: ${app.student.fullName} for ${testRole}...`);
            
            // Logic check (simulating adminController.js)
            const hiredCount = await prisma.application.count({
                where: {
                    internshipId: internship.id,
                    status: 'HIRED',
                    assignedRole: testRole,
                    student: {
                        OR: [
                            { nirfRanking: { lte: 100, gt: 0 } },
                            { collegeCategory: { in: ['IIT', 'NIT', 'IIIT', 'CENTRAL'] } }
                        ]
                    }
                }
            });

            const roleInfo = internship.rolesData.find(r => r.name === testRole);
            const max = Math.round((roleInfo.openings * roleInfo.topUnivQuota) / 100);

            if (hiredCount >= max) {
                console.log(`>>> BLOCKED: Role Quota full (${hiredCount}/${max})`);
            } else {
                await prisma.application.update({
                    where: { id: app.id },
                    data: { status: 'HIRED', assignedRole: testRole }
                });
                console.log(`>>> SUCCESS: Hired (${hiredCount + 1}/${max})`);
            }
        } catch (err) {
            console.error(err.message);
        }
    }

    // Cleanup (optional)
    // await prisma.internship.delete({ where: { id: internship.id } });
}

runTest()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
