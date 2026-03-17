const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seed starting...');

    // 1. Create Internship
    const internship = await prisma.internship.create({
        data: {
            title: "Hierarchy Verification Internship",
            department: "TECHNICAL",
            description: "Test internship for 3-tier hierarchy sorting.",
            roles: "Software Engineer",
            rolesData: [{ name: "Software Engineer", openings: 10, topUnivQuota: 60 }],
            location: "ANY",
            duration: "8 Weeks",
            openingsCount: 10,
            priorityCollege: "Antigravity Institute of Technology",
            priorityCollegeQuota: 20, // 20% of 10 = 2 openings
            quotaPercentages: { topUniversity: 60 }, // 60% of 10 = 6 openings
            isActive: true,
            requiredDocuments: ["RESUME", "NOC_LETTER"]
        }
    });

    console.log(`Created Internship: ${internship.id}`);

    const apps = [];
    const collegeCategories = ['IIT', 'NIT', 'OTHER'];
    
    // 2. Generate 200 Applications
    // - 20 Priority College (Antigravity Institute of Technology)
    // - 80 Top University (IIT/NIT)
    // - 100 Normal (OTHER)
    
    for (let i = 1; i <= 200; i++) {
        let collegeName, category, nirf;
        
        if (i <= 20) {
            collegeName = "Antigravity Institute of Technology";
            category = "OTHER"; 
            nirf = 0;
        } else if (i <= 100) {
            collegeName = i % 2 === 0 ? "IIT Madras" : "NIT Trichy";
            category = i % 2 === 0 ? "IIT" : "NIT";
            nirf = i % 2 === 0 ? 1 : 10;
        } else {
            collegeName = `Normal College ${i}`;
            category = "OTHER";
            nirf = 0;
        }

        const email = `test_student_${i}_${Date.now()}_${Math.floor(Math.random() * 1000)}@example.com`;
        const aadhar = `${Math.floor(100000000000 + Math.random() * 900000000000)}`;
        const roll = `ROLL-${i}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const student = await prisma.user.create({
            data: {
                email,
                password: 'password123',
                role: 'STUDENT',
                studentProfile: {
                    create: {
                        rollNumber: roll,
                        fullName: `Tester Student ${i}`,
                        phone: `9999999${i.toString().padStart(3, '0')}`,
                        dob: new Date('2002-01-01'),
                        address: 'Test Address',
                        aadhar,
                        collegeName,
                        university: 'Test University',
                        degree: 'B.Tech',
                        branch: 'CSE',
                        yearOfStudy: 3,
                        cgpa: parseFloat((7 + Math.random() * 3).toFixed(2)),
                        collegeCategory: category,
                        nirfRanking: nirf
                    }
                }
            },
            include: { studentProfile: true }
        });

        apps.push({
            trackingId: `TRK-${i}-${Date.now()}`,
            studentId: student.studentProfile.id,
            internshipId: internship.id,
            status: 'PENDING',
            score: student.studentProfile.cgpa * 10
        });
    }

    await prisma.application.createMany({ data: apps });
    console.log('Seeded 200 applications successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
