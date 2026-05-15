const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyApplications() {
    try {
        const internshipId = 'acc59de4-170d-4f62-848c-104e935c5c1e';
        const applications = await prisma.application.groupBy({
            by: ['preferredLocation', 'fieldId'],
            where: { internshipId },
            _count: {
                _all: true
            }
        });

        console.log('Application Counts for Internship:', internshipId);
        console.log(JSON.stringify(applications, null, 2));

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
