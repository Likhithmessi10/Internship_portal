const prisma = require('../lib/prisma');

// Dept code map for MONETARY roll number generation (format: YYDDGGNNN).
// Codes are immutable — existing roll numbers depend on them.
const DEPT_MAP = {
    'SLDC':                         '01',
    'Transmission':                 '02',
    'Planning & Power Systems':     '03',
    'Projects':                     '04',
    'APPCC & Legal':                '05',
    'Commercial & Coordination':    '06',
    'HRD':                          '07',
    'Vijayawada Zone':              '08',
    'Visakhapatnam Zone':           '09',
    'Kadapa Zone':                  '10',
    'Civil':                        '11',
    'Additional Secretary':         '13',
    'CGM (Coordination)':           '14',
    'CGM (Revenue & Expenditure)':  '15',
    'PRTI':                         '16',
};

/**
 * MONETARY roll number — format: YYDDGGNNN
 * YY  = year (2 digits)
 * DD  = department code (2 digits, from DEPT_MAP)
 * GG  = batch index within year (2 digits)
 * NNN = sequential count (3 digits)
 */
const generatePortalRollNumber = async (applicationId, tx = null) => {
    const db = tx || prisma;

    const application = await db.application.findUnique({
        where: { id: applicationId },
        include: { internship: { include: { batch: true } }, departmentGroup: true }
    });

    if (!application) throw new Error('Application not found');

    const year = new Date(application.internship.createdAt).getFullYear();
    const YY = String(year).slice(-2);

    const deptName = application.departmentGroup?.department || application.internship.department;
    const DD = DEPT_MAP[deptName?.toUpperCase()] || '00';

    const batchId = application.internship.batchId;
    let GG = '01';
    if (batchId) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd   = new Date(year, 11, 31);
        const batches   = await db.internshipBatch.findMany({
            where: { createdAt: { gte: yearStart, lte: yearEnd } },
            orderBy: { createdAt: 'asc' },
            select: { id: true }
        });
        const index = batches.findIndex(b => b.id === batchId);
        GG = String(index !== -1 ? index + 1 : 1).padStart(2, '0');
    }

    const prefix = `${YY}${DD}${GG}`;
    const count = await db.studentProfile.count({ where: { rollNumber: { startsWith: prefix } } });
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
};

/**
 * NON_STIPEND (Learning) roll number — format: YYDDFFNNN
 * YY  = 2-digit year
 * DD  = DepartmentMaster.deptNumber (2 digits, stable)
 * FF  = FieldMaster.fieldNumber within dept (2 digits, stable)
 * NNN = sequential count of hired interns for this year+dept+field (3 digits)
 *
 * Example: SLDC (01) + SCADA (01) + 3rd hire in 2026 → 260101003
 */
const generateLearningRollNumber = async (applicationId, tx = null) => {
    const db = tx || prisma;

    const application = await db.application.findUnique({
        where: { id: applicationId },
        include: {
            internship: true,
            field: { include: { fieldMaster: { include: { department: true } } } },
            departmentGroup: true
        }
    });

    if (!application) throw new Error('Application not found');

    const YY = String(new Date(application.internship.createdAt).getFullYear()).slice(-2);

    // Resolve FieldMaster from the application's field
    const fieldMaster = application.field?.fieldMaster;
    if (!fieldMaster) {
        // Fallback: use plain dept name lookup if no FieldMaster linked
        const deptName = application.departmentGroup?.department || application.internship.department || 'XX';
        const DD = DEPT_MAP[deptName.toUpperCase()] || '99';
        const prefix = `${YY}${DD}00`;
        const count = await db.studentProfile.count({ where: { rollNumber: { startsWith: prefix } } });
        return `${prefix}${String(count + 1).padStart(3, '0')}`;
    }

    const DD = String(fieldMaster.department.deptNumber).padStart(2, '0');
    const FF = String(fieldMaster.fieldNumber).padStart(2, '0');

    const prefix = `${YY}${DD}${FF}`;
    const count = await db.studentProfile.count({ where: { rollNumber: { startsWith: prefix } } });
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
};

module.exports = {
    generatePortalRollNumber,
    generateLearningRollNumber,
    DEPT_MAP
};
