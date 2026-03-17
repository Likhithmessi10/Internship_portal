const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const internshipId = '5712daf9-8f9f-4905-a612-84a26e72d55c';
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId }
        });
        
        console.log('--- Internship Details ---');
        console.log('Title:', internship.title);
        console.log('Priority College Name:', "'" + internship.priorityCollege + "'");
        console.log('Priority Quota:', internship.priorityCollegeQuota);
        console.log('Openings Count:', internship.openingsCount);
        
        const applications = await prisma.application.findMany({
            where: { internshipId: internshipId },
            include: { student: true }
        });
        
        console.log('\n--- Application Sample ---');
        console.log('Total Applications:', applications.length);
        
        const collegeCounts = {};
        applications.forEach(app => {
            const name = app.student?.collegeName || 'N/A';
            collegeCounts[name] = (collegeCounts[name] || 0) + 1;
        });
        
        console.log('Colleges in applications (First 20):');
        Object.entries(collegeCounts).slice(0, 20).forEach(([name, count]) => {
            console.log(`- ${name}: ${count}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

check();
