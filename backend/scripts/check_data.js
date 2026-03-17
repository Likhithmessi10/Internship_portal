const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const internship = await prisma.internship.findUnique({
        where: { id: '5712daf9-8f9f-4905-a612-84a26e72d55c' }
    });
    console.log(JSON.stringify(internship, null, 2));
    
    const appCount = await prisma.application.count({
        where: { internshipId: '5712daf9-8f9f-4905-a612-84a26e72d55c' }
    });
    console.log(`Application count: ${appCount}`);
    
    // Check one application's student's college
    const oneApp = await prisma.application.findFirst({
        where: { internshipId: '5712daf9-8f9f-4905-a612-84a26e72d55c' },
        include: { student: true }
    });
    console.log(`First student college: ${oneApp?.student?.collegeName}`);
}

check().finally(() => prisma.$disconnect());
