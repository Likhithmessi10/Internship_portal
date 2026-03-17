const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const internship = await prisma.internship.findFirst({
            where: { title: 'Electrical Power Systems Intern - Summer 2026' }
        });
        if (internship) {
            console.log('INTERNSHIP_FOUND');
            console.log(JSON.stringify(internship, null, 2));
        } else {
            console.log('INTERNSHIP_NOT_FOUND');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
