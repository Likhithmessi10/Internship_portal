/**
 * ALGORITHM: DETERMINISTIC QUOTA-BASED ALLOCATION
 * 
 * Logic flow: 
 * 1. For each role, categorize applicants into three mutually exclusive buckets:
 *    - PRIORITY: Perfect match with preferred college name
 *    - TOP_UNIV: High-tier institutes (IIT, NIT, IIIT, Central Univs, NIRF <= 100)
 *    - NORMAL: All other applicants
 * 
 * 2. All buckets are sorted by CGPA (descending).
 * 
 * 3. Fill role capacities following the cascade rule:
 *    a) Priority Quota Selection (fill up to P%)
 *    b) Unfilled Priority seats are transferred to Top University Quota
 *    c) Top University Quota Selection (fill up to T% + transferred)
 *    d) Unfilled Top Univ seats are transferred to Open/Normal Merit
 *    e) Final selection from remaining pool based purely on top-down merit (CGPA)
 */

const categorize = (student, priorityCollegeName) => {
    const clean = (str) => (str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const priorityClean = clean(priorityCollegeName);
    const collegeClean = clean(student.collegeName);

    // 1. Check Preferred College (Direct Match)
    if (priorityClean && collegeClean.includes(priorityClean)) {
        return 'PREFERRED';
    }

    // 2. Check Top University (Ranking or Category)
    const nirf = parseInt(student.nirfRanking);
    const topCategories = ['IIT', 'NIT', 'IIIT', 'CENTRAL'];
    if ((nirf > 0 && nirf <= 100) || topCategories.includes(student.collegeCategory || '')) {
        return 'TOP';
    }

    // 3. Fallback to Other
    return 'OTHER';
};

/**
 * Allocate applicants for a specific role following strict quota and cascade rules
 */
const allocateRole = (applicants, config) => {
    const { capacity, pPct, tPct, priorityCollegeName } = config;
    
    // 1. Sort by merit (CGPA) for deterministic fairness
    const sortedApplicants = [...applicants].sort((a, b) => {
        if ((b.student.cgpa || 0) !== (a.student.cgpa || 0)) return (b.student.cgpa || 0) - (a.student.cgpa || 0);
        return a.id.localeCompare(b.id); // Tie-breaker
    });

    // 2. Mutually Exclusive Buckets
    const preferredBucket = sortedApplicants.filter(a => categorize(a.student, priorityCollegeName) === 'PREFERRED');
    const topBucket = sortedApplicants.filter(a => categorize(a.student, priorityCollegeName) === 'TOP');
    const otherBucket = sortedApplicants.filter(a => categorize(a.student, priorityCollegeName) === 'OTHER');

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

    // 4. Fill Top Univ Quota (including transfers)
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
    
    // Default Quotas
    const pPct = internship.priorityCollegeQuota || 0;
    const tPct = internship.quotaPercentages?.topUniversity || 0;
    const priorityCollegeName = internship.priorityCollege;

    let totalAllocation = [];
    const globalAllocatedIds = new Set(); // Step 4: Prevent duplicates across roles

    rolesData.forEach(role => {
        // Step 4: Proper filtering - match applicant to role
        const roleApplicants = applicants.filter(app => {
            // Check if already allocated to another role
            if (globalAllocatedIds.has(app.id)) return false;

            // Strict role matching: Check application domain or assignedRole
            // We favor explicit assignment if it exists, else use domain/preference
            const appRole = (app.assignedRole || app.domain || '').toUpperCase();
            const targetRole = role.name.toUpperCase();

            // If it's a GENERAL role and only one role exists, take all
            if (rolesData.length === 1) return true;

            return appRole.includes(targetRole) || targetRole.includes(appRole);
        });

        const allocation = allocateRole(roleApplicants, {
            capacity: role.openings,
            pPct: role.topUnivQuota || tPct, 
            tPct: tPct,
            priorityCollegeName: priorityCollegeName
        });

        // Add to global set and results
        allocation.forEach(item => {
            globalAllocatedIds.add(item.applicationId);
            totalAllocation.push({ ...item, role: role.name });
        });
    });

    return totalAllocation;
};

module.exports = { allocateApplicants, categorize };
