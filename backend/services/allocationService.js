const { categorizeApplicant, sortApplicants } = require('./rankingService');

/**
 * Allocate applicants for a specific role following strict quota and cascade rules
 */
const allocateRole = (applicants, config, internship) => {
    const { capacity, pPct, tPct } = config;
    
    // 1. Unified sorting for deterministic fairness
    const sortedApplicants = sortApplicants(applicants);

    // 2. Mutually Exclusive Buckets using unified categorization
    const preferredBucket = sortedApplicants.filter(a => categorizeApplicant(a.student, internship) === 'PREFERRED');
    const topBucket = sortedApplicants.filter(a => categorizeApplicant(a.student, internship) === 'TOP');
    const otherBucket = sortedApplicants.filter(a => categorizeApplicant(a.student, internship) === 'OTHER');

    const selectedIds = new Set();
    const allocationResult = [];

    // 3. Fill Preferred Quota
    const targetPreferred = Math.floor(capacity * (pPct / 100));
    const preferredSelected = preferredBucket.slice(0, targetPreferred);
    
    preferredSelected.forEach(app => {
        selectedIds.add(app.id);
        allocationResult.push({ 
            applicationId: app.id, 
            category: 'PREFERRED',
            studentName: app.student.fullName,
            cgpa: app.student.cgpa,
            college: app.student.collegeName 
        });
    });

    // 4. Fill Top Univ Quota (including transfers from Preferred)
    const targetTop = Math.floor(capacity * (tPct / 100));
    const totalTopCapacity = targetTop + (targetPreferred - preferredSelected.length); // Cascade
    const topSelected = topBucket.slice(0, totalTopCapacity);
    
    topSelected.forEach(app => {
        selectedIds.add(app.id);
        allocationResult.push({ 
            applicationId: app.id, 
            category: 'TOP',
            studentName: app.student.fullName,
            cgpa: app.student.cgpa,
            college: app.student.collegeName 
        });
    });

    // 5. Fill Remaining Seats from General Pool (Everyone else sorted by merit)
    const remainingCapacity = capacity - allocationResult.length;
    const remainingPool = sortedApplicants.filter(a => !selectedIds.has(a.id));
    const finalSelected = remainingPool.slice(0, remainingCapacity);
    
    finalSelected.forEach(app => {
        allocationResult.push({ 
            applicationId: app.id, 
            category: 'OTHER',
            studentName: app.student.fullName,
            cgpa: app.student.cgpa,
            college: app.student.collegeName 
        });
    });

    return allocationResult;
};

/**
 * Main Allocation Engine
 */
const allocateApplicants = (applicants, internship) => {
    const rolesData = internship.rolesData || [{ name: 'GENERAL', openings: internship.openingsCount }];
    
    // Default Quotas from internship level
    const globalPPct = internship.priorityCollegeQuota || 0;
    const globalTPct = internship.quotaPercentages?.topUniversity || 0;

    let totalAllocation = [];
    const globalAllocatedIds = new Set();

    rolesData.forEach(role => {
        const roleApplicants = applicants.filter(app => {
            if (globalAllocatedIds.has(app.id)) return false;

            const appRole = (app.assignedRole || app.domain || '').toUpperCase();
            const targetRole = role.name.toUpperCase();

            if (rolesData.length === 1) return true;
            return appRole.includes(targetRole) || targetRole.includes(appRole);
        });

        // FIXED: Quota wiring (Use specific role quotas if available, else global)
        const allocation = allocateRole(roleApplicants, {
            capacity: role.openings,
            pPct: role.priorityQuota !== undefined ? role.priorityQuota : globalPPct, 
            tPct: role.topUnivQuota !== undefined ? role.topUnivQuota : globalTPct
        }, internship);

        allocation.forEach(item => {
            globalAllocatedIds.add(item.applicationId);
            totalAllocation.push({ ...item, role: role.name });
        });
    });

    return totalAllocation;
};

module.exports = { allocateApplicants };

