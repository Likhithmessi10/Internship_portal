const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seed() {
    try {
        console.log('Connecting to database...');
        
        // 1. Create a PRTI Member
        const prtiEmail = 'prti_member@aptransco.gov.in';
        let prtiUser = await prisma.user.findUnique({ where: { email: prtiEmail }});
        if (!prtiUser) {
            const hashedPassword = await bcrypt.hash('password123', 10);
            prtiUser = await prisma.user.create({
                data: {
                    name: 'Sarah (PRTI Officer)',
                    email: prtiEmail,
                    password: hashedPassword,
                    role: 'CE_PRTI',
                    department: 'PRTI'
                }
            });
            console.log('Created PRTI Member:', prtiUser.email);
        } else {
            console.log('PRTI Member already exists:', prtiUser.email);
        }

        // 2. Find the SCADA Internship
        const internship = await prisma.internship.findFirst({
            where: {
                title: { contains: 'SCADA', mode: 'insensitive' },
                department: 'SLDC'
            }
        });

        if (!internship) {
            console.log('Error: Could not find an internship with "SCADA" in the title under department "SLDC". Check if you created it.');
            process.exit(1);
        }
        console.log('Found Internship:', internship.title);

        // 3. Create 20 mock applications
        const mockColleges = ['JNTUH', 'OU', 'VIT', 'SRM', 'CBIT', 'VNR', 'Gokaraju Rangaraju'];
        let createdApps = 0;

        for (let i = 1; i <= 20; i++) {
            const studentEmail = `student${i}_scada@student.com`;
            let studentUser = await prisma.user.findUnique({ where: { email: studentEmail } });
            
            if (!studentUser) {
                studentUser = await prisma.user.create({
                    data: {
                        name: `Mock Student ${i}`,
                        email: studentEmail,
                        password: await bcrypt.hash('password123', 10),
                        role: 'STUDENT'
                    }
                });
            }

            let profile = await prisma.studentProfile.findUnique({ where: { userId: studentUser.id }});
            if (!profile) {
                profile = await prisma.studentProfile.create({
                    data: {
                        userId: studentUser.id,
                        fullName: `Mock Student ${i}`,
                        phone: `98765432${i.toString().padStart(2, '0')}`,
                        dob: new Date('2002-05-15'),
                        address: 'Hyderabad, India',
                        aadhar: `1234123412${i.toString().padStart(2, '0')}`,
                        collegeName: mockColleges[i % mockColleges.length],
                        university: 'JNTU',
                        degree: 'B.Tech',
                        branch: 'Electrical Engineering',
                        yearOfStudy: [2, 3, 4][i % 3],
                        cgpa: 7 + (i % 3),
                        collegeCategory: ['CENTRAL', 'STATE', 'PRIVATE'][i % 3],
                        photoUrl: ''
                    }
                });
            }

            // Check if application exists
            const existingApp = await prisma.application.findFirst({
                where: { studentId: profile.id, internshipId: internship.id }
            });

            if (!existingApp) {
                await prisma.application.create({
                    data: {
                        trackingId: `TRK-SCA-${Date.now()}-${i}`,
                        studentId: profile.id,
                        internshipId: internship.id,
                        status: 'SUBMITTED' // Can be pending or submitted
                    }
                });
                createdApps++;
            }
        }

        console.log(`Successfully created ${createdApps} new applications for the ${internship.title} internship!`);
        console.log('\nYou can now log in as the HOD of SLDC department to verify these applications, and then log in as PRTI Admin to set up the committee member (Sarah PRTI Officer).');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

seed();
