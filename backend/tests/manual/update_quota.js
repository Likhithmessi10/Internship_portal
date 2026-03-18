const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INTERNSHIP_ID = "82408692-ed57-4ca7-b393-1b2faf5b8e0b";

async function update() {
    await prisma.internship.update({
        where: { id: INTERNSHIP_ID },
        data: {
            quotaPercentages: { topUniversity: 40 }
        }
    });
    console.log("Updated internship with 40% Top University Quota");
}

update()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
