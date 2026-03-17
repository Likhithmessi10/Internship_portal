const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const INTERNSHIP_ID = "82408692-ed57-4ca7-b393-1b2faf5b8e0b";

async function forceQuota() {
    console.log("Setting internship to 10 openings and 50% Top University Quota...");
    await prisma.internship.update({
        where: { id: INTERNSHIP_ID },
        data: {
            openingsCount: 10,
            quotaPercentages: { topUniversity: 50 }
        }
    });
    
    // Reset all status to PENDING for a clean test
    console.log("Resetting all applications for this internship to PENDING...");
    await prisma.application.updateMany({
        where: { internshipId: INTERNSHIP_ID },
        data: { status: 'PENDING' }
    });
    
    console.log("Ready for Quota Enforcement Test (Limit: 5 Top Univ Hires)");
}

forceQuota()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
