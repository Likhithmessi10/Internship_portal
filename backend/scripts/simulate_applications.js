const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting Simulation: 100 Applications...');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('student1', salt);

    // 1. Create Internship
    const internship = await prisma.internship.create({
        data: {
            title: "Simulation Championship 2026",
            department: "Engineering",
            description: "Massive scale simulation for quota testing.",
            location: "Remote / Hybrid",
            duration: "3 Months",
            openingsCount: 10,
            isActive: true,
            priorityCollege: "Likhith University of Technology",
            priorityCollegeQuota: 3,
            quotaPercentages: { topUniversity: 60 },
            rolesData: [
                { name: "Software Engineer", openings: 6, hired: 0 },
                { name: "Data Analyst", openings: 4, hired: 0 }
            ],
            requiredDocuments: ["RESUME", "MARKSHEET"]
        }
    });

    console.log(`Created Internship: ${internship.title} (ID: ${internship.id})`);

    // 2. Generate Students and Applications
    const categories = [
        { count: 15, name: "Priority", college: "Likhith University of Technology", cat: "STATE_UNIV", nirf: 150 },
        { count: 35, name: "Top Univ", college: "IIT Bombay", cat: "IIT", nirf: 1 },
        { count: 50, name: "Regular", college: "Generic College", cat: "COLLEGE", nirf: 500 }
    ];

    let total = 0;
    for (const group of categories) {
        console.log(`Generating ${group.count} ${group.name} applications...`);
        for (let i = 0; i < group.count; i++) {
            const uid = `sim_${group.name.replace(' ', '').toLowerCase()}_${i}_${Math.random().toString(36).substring(7)}`;
            const user = await prisma.user.create({
                data: {
                    email: `${uid}@example.com`,
                    password: password,
                    role: 'STUDENT',
                    studentProfile: {
                        create: {
                            rollNumber: uid.toUpperCase(),
                            fullName: `${group.name} Student ${i}`,
                            phone: `9${total.toString().padStart(9, '0')}`,
                            dob: new Date('2002-01-01'),
                            address: "Simulation Street",
                            aadhar: `SIM_AA_${total.toString().padStart(8, '0')}`,
                            collegeName: group.college,
                            university: "Simulation University",
                            degree: "B.Tech",
                            branch: "CSE",
                            yearOfStudy: 3,
                            cgpa: 8.5,
                            collegeCategory: group.cat,
                            nirfRanking: group.nirf
                        }
                    }
                },
                include: { studentProfile: true }
            });

            await prisma.application.create({
                data: {
                    trackingId: `TRK_${uid.toUpperCase()}`,
                    studentId: user.studentProfile.id,
                    internshipId: internship.id,
                    status: 'PENDING',
                    score: 85.0
                }
            });
            total++;
        }
    }

    console.log(`Simulation complete! 100 applications created for Internship ID: ${internship.id}`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
