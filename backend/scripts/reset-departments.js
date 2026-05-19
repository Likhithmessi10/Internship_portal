// Resets PortalConfiguration.departments to the canonical list from seed-dept-fields.
// Usage: node backend/scripts/reset-departments.js

const { PrismaClient } = require('@prisma/client');
const { DEPARTMENTS } = require('./seed-dept-fields');
const prisma = new PrismaClient();

async function resetDepartments() {
    const deptNames = DEPARTMENTS.map(d => d.name);
    await prisma.portalConfiguration.upsert({
        where:  { id: 'singleton' },
        update: { departments: deptNames },
        create: { id: 'singleton', authorizedTotal: 100, departments: deptNames },
    });
    console.log('✅ Departments reset:', deptNames);
    await prisma.$disconnect();
}

resetDepartments().catch(err => { console.error(err); process.exit(1); });
