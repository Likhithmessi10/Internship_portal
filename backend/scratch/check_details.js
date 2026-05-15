const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const internshipId = "26458496-cda5-49e4-87ac-bc4785a7b060";
    try {
        const fields = await prisma.internshipField.findMany({
            where: { OR: [{ internshipId }, { departmentGroup: { internshipId } }] }
        });
        console.log("Fields:", JSON.stringify(fields, null, 2));
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
