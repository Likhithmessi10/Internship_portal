const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedApplications() {
    const countPerLocation = 20;

    try {
        // Find the most recent non-monetary internship
        const internship = await prisma.internship.findFirst({
            where: { internshipType: 'NON_STIPEND' },
            orderBy: { createdAt: 'desc' },
            include: {
                departmentGroups: {
                    include: {
                        fields: true
                    }
                }
            }
        });

        if (!internship) {
            console.log("❌ No NON_STIPEND internship found.");
            return;
        }

        console.log(`🚀 Seeding applications for internship: ${internship.title} (${internship.id})`);

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash('password123', salt);

        for (const group of internship.departmentGroups) {
            console.log(`\n📂 Processing Department Group: ${group.department}`);
            
            for (const field of group.fields) {
                console.log(`   🔹 Field: ${field.fieldName}`);
                
                let locations = [];
                if (field.locations && Array.isArray(field.locations)) {
                    locations = field.locations.map(loc => typeof loc === 'string' ? loc : (loc.name || 'Default Location'));
                } else {
                    locations = ['Default Location'];
                }

                for (const locationName of locations) {
                    console.log(`      📍 Seeding ${countPerLocation} applications for location: ${locationName}`);
                    
                    for (let i = 1; i <= countPerLocation; i++) {
                        const timestamp = Date.now();
                        const uniqueId = `${field.fieldName.toLowerCase()}_${locationName.replace(/\s+/g, '_').toLowerCase()}_${i}_${timestamp}`;
                        const email = `student_${uniqueId}@example.com`;
                        const name = `Student ${field.fieldName} ${locationName} ${i}`;
                        const aadhaarNumber = `5${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`;
                        const phone = `9${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`;

                        try {
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
                                    address: `${i}, Main Street, ${locationName}`,
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
                            const trackingId = `NON-${field.fieldName.slice(0, 3).toUpperCase()}-${locationName.slice(0, 3).toUpperCase()}-${timestamp}-${i}`;

                            await prisma.application.create({
                                data: {
                                    trackingId,
                                    studentId: profile.id,
                                    internshipId: internship.id,
                                    departmentGroupId: group.id,
                                    fieldId: field.id,
                                    status: 'SUBMITTED',
                                    preferredLocation: locationName,
                                    sop: `I am interested in ${field.fieldName} at ${locationName}. I want to gain practical experience.`
                                }
                            });
                        } catch (err) {
                            console.error(`      ⚠️ Failed to create application ${i} for ${locationName}:`, err.message);
                        }
                    }
                    console.log(`      ✅ Created ${countPerLocation} applications for ${locationName}`);
                }
            }
        }

        console.log('\n✨ Successfully seeded all applications for all locations and fields.');
    } catch (error) {
        console.error('❌ Critical Error during seeding:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedApplications();
