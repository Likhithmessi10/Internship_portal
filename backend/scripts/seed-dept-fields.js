/**
 * seed-dept-fields.js
 *
 * Single source of truth for all departments and their fields.
 * Wipes DepartmentMaster + FieldMaster and rebuilds from scratch every run.
 *
 * Usage (standalone):
 *   node backend/scripts/seed-dept-fields.js
 *
 * Also called automatically by seed-accounts.js.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE OF TRUTH — edit only this array
// ─────────────────────────────────────────────────────────────────────────────
const DEPARTMENTS = [
    {
        name: 'Vijayawada Zone',
        code: 'VJAZ',
        fields: [
            { name: 'O&M of EHT Substations',            qualification: 'Electrical Engineering' },
            { name: 'O&M of EHT Lines',                  qualification: 'Electrical Engineering' },
            { name: 'MRT(Electrical Protection)',         qualification: 'Electrical Engineering' },
            { name: 'TRE(Transformer Protection)',        qualification: 'Electrical Engineering' },
            { name: 'OTL(Oil Testing Lab)',               qualification: 'Electrical Engineering' },
            { name: 'Construction of EHT Substations&Lines', qualification: 'Electrical Engineering' },
            { name: 'Civil',                              qualification: 'Civil Engineering' },
            { name: 'Telecom',                            qualification: 'Electronics & Communication' },
        ],
    },
    {
        name: 'Visakhapatnam Zone',
        code: 'VSKZ',
        fields: [
            { name: 'O&M of EHT Substations',            qualification: 'Electrical Engineering' },
            { name: 'O&M of EHT Lines',                  qualification: 'Electrical Engineering' },
            { name: 'MRT(Electrical Protection)',         qualification: 'Electrical Engineering' },
            { name: 'TRE(Transformer Protection)',        qualification: 'Electrical Engineering' },
            { name: 'OTL(Oil Testing Lab)',               qualification: 'Electrical Engineering' },
            { name: 'Construction of EHT Substations&Lines', qualification: 'Electrical Engineering' },
            { name: 'Civil',                              qualification: 'Civil Engineering' },
            { name: 'Telecom',                            qualification: 'Electronics & Communication' },
        ],
    },
    {
        name: 'Kadapa Zone',
        code: 'KDPZ',
        fields: [
            { name: 'O&M of EHT Substations',            qualification: 'Electrical Engineering' },
            { name: 'O&M of EHT Lines',                  qualification: 'Electrical Engineering' },
            { name: 'MRT(Electrical Protection)',         qualification: 'Electrical Engineering' },
            { name: 'TRE(Transformer Protection)',        qualification: 'Electrical Engineering' },
            { name: 'OTL(Oil Testing Lab)',               qualification: 'Electrical Engineering' },
            { name: 'Construction of EHT Substations&Lines', qualification: 'Electrical Engineering' },
            { name: 'Civil',                              qualification: 'Civil Engineering' },
            { name: 'Telecom',                            qualification: 'Electronics & Communication' },
        ],
    },
    {
        name: 'SLDC',
        code: 'SLDC',
        fields: [
            { name: 'Grid',                               qualification: 'Electrical Engineering' },
            { name: 'Energy Settlement',                  qualification: 'Electrical Engineering' },
        ],
    },
    {
        name: 'Transmission',
        code: 'TRSM',
        fields: [
            { name: 'Transmission',                       qualification: 'Electrical Engineering' },
            { name: 'Procurements',                       qualification: 'Electrical Engineering' },
        ],
    },
    {
        name: 'Planning & Power Systems',
        code: 'PLPS',
        fields: [
            { name: 'Power Systems',                      qualification: 'Electrical Engineering' },
        ],
    },
    {
        name: 'Projects',
        code: 'PROJ',
        fields: [
            { name: 'Projects',                           qualification: 'Electrical Engineering' },
        ],
    },
    {
        name: 'Civil',
        code: 'CIVL',
        fields: [
            { name: 'Civil Construction',                 qualification: 'Civil Engineering' },
        ],
    },
    {
        name: 'PRTI',
        code: 'PRTI',
        fields: [
            { name: 'Training & Research',                qualification: 'Electrical Engineering' },
        ],
    },
    {
        name: 'Commercial & Coordination',
        code: 'COMC',
        fields: [
            { name: 'Commercial',                         qualification: 'Electrical Engineering' },
            { name: 'Coordination',                       qualification: 'Electrical Engineering' },
        ],
    },
    {
        name: 'HRD',
        code: 'HRD',
        fields: [
            { name: 'Human Resources',                    qualification: 'BBA / MBA (HR)' },
        ],
    },
    {
        name: 'APPCC & Legal',
        code: 'APCC',
        fields: [
            { name: 'Power Purchases',                    qualification: 'BBA / MBA (Marketing/Finance)' },
            { name: 'Legal',                              qualification: 'LLB / BL' },
        ],
    },
    {
        name: 'CGM (Coordination)',
        code: 'CGMC',
        fields: [
            { name: 'Finance',                            qualification: 'B.Com / ICWA / CA' },
        ],
    },
    {
        name: 'Additional Secretary',
        code: 'ADDS',
        fields: [
            { name: 'Industrial Relations',               qualification: 'BBA / MBA (HR)' },
            { name: 'Regulations',                        qualification: 'BBA / MBA (HR)' },
            { name: 'Pensions',                           qualification: 'BBA / MBA (HR)' },
        ],
    },
    {
        name: 'CGM (Revenue & Expenditure)',
        code: 'CGMR',
        fields: [
            { name: 'Revenue & Expenditure',              qualification: 'B.Com / ICWA / CA' },
        ],
    },
];

// ─────────────────────────────────────────────────────────────────────────────

async function seedDeptFields() {
    console.log('=== Seeding Departments & Fields ===\n');

    // 1. Clear linked records so foreign-key constraints don't block the wipe
    await prisma.internshipField.deleteMany({});
    await prisma.application.updateMany({ data: { fieldId: null } });
    await prisma.fieldMaster.deleteMany({});
    await prisma.departmentMaster.deleteMany({});
    console.log('Cleared existing DepartmentMaster and FieldMaster records.\n');

    // 2. Recreate from DEPARTMENTS array
    for (let deptIdx = 0; deptIdx < DEPARTMENTS.length; deptIdx++) {
        const deptDef = DEPARTMENTS[deptIdx];
        const deptNumber = deptIdx + 1;

        const dept = await prisma.departmentMaster.create({
            data: {
                name:       deptDef.name,
                code:       deptDef.code,
                deptNumber,
                isActive:   true,
            },
        });

        for (let fieldIdx = 0; fieldIdx < deptDef.fields.length; fieldIdx++) {
            const f = deptDef.fields[fieldIdx];
            const fieldNumber = fieldIdx + 1;
            const short = f.name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5) || 'FLD';
            const fieldCode = `${dept.code}-${short}-${String(fieldNumber).padStart(3, '0')}`;

            await prisma.fieldMaster.create({
                data: {
                    departmentId:    dept.id,
                    fieldCode,
                    fieldName:       f.name,
                    fieldNumber,
                    specializations: f.qualification ? [f.qualification] : [],
                    locations:       [],
                    isActive:        true,
                },
            });
        }

        console.log(`  ${String(deptNumber).padStart(2, '0')}. ${deptDef.name} — ${deptDef.fields.length} field(s)`);
    }

    // 3. Sync PortalConfiguration.departments list
    const deptNames = DEPARTMENTS.map(d => d.name);
    await prisma.portalConfiguration.upsert({
        where:  { id: 'singleton' },
        update: { departments: deptNames },
        create: { id: 'singleton', authorizedTotal: 100, departments: deptNames },
    });

    console.log(`\nPortalConfiguration.departments updated (${deptNames.length} departments).`);
    console.log('\n=== Done ===');
}

module.exports = { seedDeptFields, DEPARTMENTS };

if (require.main === module) {
    seedDeptFields()
        .catch(err => { console.error('Seed failed:', err); process.exit(1); })
        .finally(() => prisma.$disconnect());
}
