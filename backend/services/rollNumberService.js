const prisma = require('../lib/prisma');

const DEPT_MAP = {
    'SLDC': '01',
    'TRANSMISSION': '02',
    'PLANNING AND POWER SYSTEMS': '03',
    'PROJECTS': '04',
    'APPCC AND LEGAL': '05',
    'COMMERCIAL AND COORDINATION LMC': '06',
    'HRD': '07',
    'ZONE VIJAYAWADA': '08',
    'ZONE VISHAKAPATNAM': '09',
    'APPCC': '10',
    'ZONE KADAPA': '11',
    'CIVIL': '12',
    'TELECOM AND IT': '13',
    'ADDITIONAL SECRETARY': '14',
    'CGM AND FINANCE': '15',
};

/**
 * Generate a roll number in format YYDDGGNNN
 * YY - Year (2 digits)
 * DD - Department Code (2 digits)
 * GG - Batch/Group Code (2 digits)
 * NNN - Sequence Number (3 digits)
 */
const generatePortalRollNumber = async (applicationId, tx = null) => {
    const db = tx || prisma;

    // 1. Fetch application details
    const application = await db.application.findUnique({
        where: { id: applicationId },
        include: {
            internship: {
                include: { batch: true }
            },
            departmentGroup: true
        }
    });

    if (!application) throw new Error('Application not found');

    // 2. Extract Year (YY)
    // Use the internship creation year or batch year if available
    const year = new Date(application.internship.createdAt).getFullYear();
    const YY = String(year).slice(-2);

    // 3. Get Department Code (DD)
    const deptName = application.departmentGroup?.department || application.internship.department;
    const DD = DEPT_MAP[deptName.toUpperCase()] || '00';

    // 4. Get Batch/Group Code (GG)
    // We'll use a simple deterministic mapping for batches based on their creation order in that year
    const batchId = application.internship.batchId;
    let GG = '01';
    
    if (batchId) {
        const yearStart = new Date(year, 0, 1);
        const yearEnd = new Date(year, 11, 31);
        
        const batches = await db.internshipBatch.findMany({
            where: {
                createdAt: {
                    gte: yearStart,
                    lte: yearEnd
                }
            },
            orderBy: { createdAt: 'asc' },
            select: { id: true }
        });
        
        const index = batches.findIndex(b => b.id === batchId);
        GG = String(index !== -1 ? index + 1 : 1).padStart(2, '0');
    }

    // 5. Calculate Sequence Number (NNN)
    const prefix = `${YY}${DD}${GG}`;
    
    // Count how many students in this profile table already have a roll number with this prefix
    const count = await db.studentProfile.count({
        where: {
            rollNumber: {
                startsWith: prefix
            }
        }
    });

    const NNN = String(count + 1).padStart(3, '0');

    return `${prefix}${NNN}`;
};

module.exports = {
    generatePortalRollNumber,
    DEPT_MAP
};
