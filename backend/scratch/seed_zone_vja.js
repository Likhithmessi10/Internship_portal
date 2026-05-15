const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function seedSpecificApplications() {
    const internshipId = '5575f78d-9dd3-4e73-9f82-027b59af9029';
    const countPerLocation = 2;

    try {
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
            include: {
                departmentGroups: {
                    include: {
                        fields: true
                    }
                }
            }
        });

        if (!internship) {
            console.log("❌ Internship not found.");
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
                        const uniqueId = `zone_vja_${field.fieldName.slice(0,3).toLowerCase()}_${locationName.replace(/\s+/g, '_').toLowerCase()}_${i}_${timestamp}`;
                        const email = `student_${uniqueId}@example.com`;
                        const name = `Student ${field.fieldName} ${locationName} ${i}`;
                        const aadhaarNumber = `6${String(Math.floor(Math.random() * 100000000000)).padStart(11, '0')}`;
                        const phone = `8${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`;

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
                                    dob: new Date('2002-08-10'),
                                    address: `${i}, Near Power House, ${locationName}`,
                                    aadhaarNumber: aadhaarNumber,
                                    collegeName: 'VR Siddhartha Engineering College',
                                    university: 'JNTU Kakinada',
                                    degree: 'B.Tech',
                                    branch: 'EEE',
                                    yearOfStudy: 4,
                                    cgpa: 8.0 + (Math.random() * 1.5),
                                    collegeCategory: 'STATE'
                                }
                            });

                            // Create Application
                            const trackingId = `ZONE-VJA-${field.fieldName.slice(0, 3).toUpperCase()}-${locationName.slice(0, 3).toUpperCase()}-${timestamp}-${i}`;

                            await prisma.application.create({
                                data: {
                                    trackingId,
                                    studentId: profile.id,
                                    internshipId: internship.id,
                                    departmentGroupId: group.id,
                                    fieldId: field.id,
                                    status: 'SUBMITTED',
                                    preferredLocation: locationName,
                                    sop: `I want to learn about ${field.fieldName} at the ${locationName} site. I am highly motivated for this role.`
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

        console.log('\n✨ Successfully seeded specific applications.');
    } catch (error) {
        console.error('❌ Critical Error during seeding:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedSpecificApplications();
