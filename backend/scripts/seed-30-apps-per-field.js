const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedApplications() {
    const internshipId = "30b8cf91-2130-4af7-96b4-39287bf676e5";
    const countPerField = 30;

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
                    const email = `student_${field.fieldName.toLowerCase()}_${i}_${timestamp}@example.com`;
                    const name = `Student ${field.fieldName} ${i}`;
                    const aadhaarNumber = `5${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`;
                    const phone = `9${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`;

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
                            dob: new Date('2001-05-14'),
                            address: `${i}, Main Street, ${field.fieldName} City`,
                            aadhaarNumber: aadhaarNumber,
                            collegeName: 'Global Engineering College',
                            university: 'State Technological University',
                            degree: 'B.Tech',
                            branch: 'Engineering',
                            yearOfStudy: 3,
                            cgpa: 7.5 + (Math.random() * 2),
                            collegeCategory: 'STATE'
                        }
                    });

                    // Create Application
                    const trackingId = `NON-${field.fieldName.slice(0, 3).toUpperCase()}-${timestamp}-${i}`;
                    
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
                            sop: `I am highly motivated to join the ${field.fieldName} department for this non-monetary internship. I want to learn more about the industry standards.`
                        }
                    });

                    if (i % 10 === 0) {
                        console.log(`  - Created ${i}/${countPerField} applications for ${field.fieldName}`);
                    }
                }
            }
        }

        console.log('✅ Successfully seeded all applications.');
    } catch (error) {
        console.error('❌ Error seeding applications:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedApplications();
