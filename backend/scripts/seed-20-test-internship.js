const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedApplications() {
    const internshipId = "d9a57319-d49a-4bdb-b4d2-b1596b333f03";
    const countPerField = 10;

    console.log(`Seeding ${countPerField} applications for each field of internship ${internshipId}...`);

    try {
        const groups = await prisma.internshipDepartmentGroup.findMany({
            where: { internshipId },
            include: { fields: true }
        });

        if (groups.length === 0) {
            console.log("No department groups found for this internship.");
            return;
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        for (const group of groups) {
            console.log(`Processing group: ${group.department}`);
            for (const field of group.fields) {
                console.log(`Seeding ${countPerField} applications for field: ${field.fieldName}`);
                
                for (let i = 1; i <= countPerField; i++) {
                    const timestamp = Date.now();
                    const email = `test_student_${field.fieldName.toLowerCase()}_${i}_${timestamp}@example.com`;
                    const name = `Test Student ${field.fieldName} ${i}`;
                    const aadhaarNumber = `6${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`;
                    const phone = `8${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`;

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
                            dob: new Date('2002-01-01'),
                            address: `${i}, Test Street, ${field.fieldName} City`,
                            aadhaarNumber: aadhaarNumber,
                            collegeName: 'Test Engineering College',
                            university: 'Test Technological University',
                            degree: 'B.Tech',
                            branch: 'Computer Science',
                            yearOfStudy: 3,
                            cgpa: 8.0 + (Math.random() * 1.5),
                            collegeCategory: 'PRIVATE'
                        }
                    });

                    // Create Application
                    const trackingId = `TEST-${field.fieldName.slice(0, 3).toUpperCase()}-${timestamp}-${i}`;
                    
                    // Randomly pick a location if available
                    let preferredLocation = null;
                    if (field.locations && Array.isArray(field.locations) && field.locations.length > 0) {
                        const locIndex = Math.floor(Math.random() * field.locations.length);
                        preferredLocation = field.locations[locIndex].name;
                    }

                    await prisma.application.create({
                        data: {
                            trackingId,
                            studentId: profile.id,
                            internshipId: internshipId,
                            departmentGroupId: group.id,
                            fieldId: field.id,
                            status: 'SUBMITTED',
                            preferredLocation: preferredLocation || 'Default Location',
                            sop: `This is a test application for the ${field.fieldName} department.`
                        }
                    });

                    if (i % 5 === 0) {
                        console.log(`  - Created ${i}/${countPerField} applications for ${field.fieldName}`);
                    }
                }
            }
        }

        console.log('✅ Successfully seeded test applications.');
    } catch (error) {
        console.error('❌ Error seeding applications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedApplications();
