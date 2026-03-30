// Run this script to reset departments in database
// Usage: node backend/scripts/reset-departments.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultDepartments = [
    'TRANSMISSION',
    'PLANNING AND POWER SYSTEMS',
    'SLDC',
    'PROJECTS',
    'APPCC AND LEGAL',
    'COMMERCIAL AND COORDINATION LMC',
    'HRD',
    'ZONE VIJAYAWADA',
    'ZONE VISHAKAPATNAM',
    'APPCC',
    'ZONE KADAPA',
    'CIVIL',
    'TELECOM AND IT',
    'ADDITIONAL SECRETARY',
    'CGM AND FINANCE'
];

async function resetDepartments() {
    try {
        await prisma.portalConfiguration.upsert({
            where: { id: 'singleton' },
            update: { departments: defaultDepartments },
            create: { 
                id: 'singleton', 
                authorizedTotal: 100,
                departments: defaultDepartments 
            }
        });
        console.log('✅ Departments reset successfully!');
        console.log('Departments:', defaultDepartments);
    } catch (error) {
        console.error('❌ Error resetting departments:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetDepartments();
