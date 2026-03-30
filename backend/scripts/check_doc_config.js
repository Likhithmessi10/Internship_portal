const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConfig() {
    try {
        const config = await prisma.documentConfiguration.findUnique({
            where: { id: 'singleton' }
        });
        console.log('Current Document Configuration:');
        console.log(JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error fetching config:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkConfig();
