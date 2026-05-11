const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateData() {
    try {
        // 1. Create a default batch
        const batch = await prisma.internshipBatch.create({
            data: {
                title: 'General Internship Program 2026',
                description: 'Default category for existing internships.',
                createdBy: 'system@aptransco.portal'
            }
        });
        console.log(`Created default batch: ${batch.title} (${batch.id})`);

        // 2. Link all existing internships to this batch
        const result = await prisma.internship.updateMany({
            data: {
                batchId: batch.id
            }
        });
        console.log(`Migrated ${result.count} internships to the new batch structure.`);

    } catch (err) {
        console.error('Migration error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

migrateData();
