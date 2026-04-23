const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.aishe_colleges.count();
    console.log(`Colleges count: ${count}`);
    if (count > 0) {
        const sample = await prisma.aishe_colleges.findFirst();
        console.log('Sample:', JSON.stringify(sample, null, 2));
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
