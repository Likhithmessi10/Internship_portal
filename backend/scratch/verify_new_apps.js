const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyApplications() {
    try {
        const internshipId = 'ab80d6e8-9f4e-4006-af02-aaff4e9d39ee';
        const applications = await prisma.application.groupBy({
            by: ['preferredLocation', 'fieldId'],
            where: { internshipId },
            _count: {
                _all: true
            }
        });

        console.log('Application Counts for Internship:', internshipId);
        
        // Fetch field names for better display
        const fields = await prisma.internshipField.findMany({
            where: { id: { in: applications.map(a => a.fieldId) } }
        });
        const fieldMap = Object.fromEntries(fields.map(f => [f.id, f.fieldName]));

        const results = applications.map(a => ({
            field: fieldMap[a.fieldId],
            location: a.preferredLocation,
            count: a._count._all
        }));

        console.table(results);

        const totalCount = await prisma.application.count({
            where: { internshipId }
        });
        console.log('Total Applications:', totalCount);

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyApplications();
