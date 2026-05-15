const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedApplications() {
    const internshipId = "26458496-cda5-49e4-87ac-bc4785a7b060";
    const departmentGroupId = "bdace40d-cc2f-4a7d-8c41-5ad708e1b82b";
    const fieldId = "cfb00f02-e05c-4e78-8ace-cca0de3184e4";
    const count = 11;

    console.log(`Seeding ${count} applications for internship ${internshipId}...`);

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        for (let i = 1; i <= count; i++) {
            const email = `student${i}_${Date.now()}@example.com`;
            const name = `Student ${i}`;
            const aadhaarNumber = `1234567890${String(i).padStart(2, '0')}`;
            const phone = `98765432${String(i).padStart(2, '0')}`;

            // Create User
            const user = await prisma.user.create({
                data: {
                    email,
                    password: passwordHash,
                    role: 'STUDENT',
                    name
                }
            });

            // Create Student Profile
            const profile = await prisma.studentProfile.create({
                data: {
                    userId: user.id,
                    fullName: name,
                    phone: phone,
                    dob: new Date('2000-01-01'),
                    address: `Address ${i}, City, State`,
                    aadhaarNumber: aadhaarNumber,
                    collegeName: 'Test Engineering College',
                    university: 'Test University',
                    degree: 'B.Tech',
                    branch: 'Computer Science',
                    yearOfStudy: 3,
                    cgpa: 8.5,
                    collegeCategory: 'STATE'
                }
            });

            // Create Application
            const trackingId = `APT-${Date.now()}-${aadhaarNumber.slice(-4)}-${i}`;
            await prisma.application.create({
                data: {
                    trackingId,
                    studentId: profile.id,
                    internshipId: internshipId,
                    departmentGroupId: departmentGroupId,
                    fieldId: fieldId,
                    status: 'SUBMITTED',
                    preferredLocation: 'Vijayawada HQ',
                    sop: 'I am interested in this non-monetary internship to gain experience.'
                }
            });

            console.log(`Created application for ${email} (Tracking ID: ${trackingId})`);
        }

        console.log('✅ Successfully seeded 11 applications.');
    } catch (error) {
        console.error('❌ Error seeding applications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedApplications();
