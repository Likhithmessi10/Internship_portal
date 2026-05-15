const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifySpecificApps() {
    try {
        const internshipId = '5575f78d-9dd3-4e73-9f82-027b59af9029';
        const applications = await prisma.application.groupBy({
            by: ['preferredLocation', 'fieldId'],
            where: { internshipId },
            _count: { _all: true }
        });

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
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

verifySpecificApps();
