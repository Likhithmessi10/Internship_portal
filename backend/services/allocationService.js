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

    // 1. Check Priority College
    if (priorityClean && collegeClean.includes(priorityClean)) {
        return 'PRIORITY';
    }

    // 2. Check Top University
    const nirf = parseInt(student.nirfRanking);
    const topCats = ['IIT', 'NIT', 'IIIT', 'CENTRAL'];
    if ((nirf > 0 && nirf <= 100) || topCats.includes(student.collegeCategory)) {
        return 'TOP_UNIV';
    }

    // 3. Else Normal
    return 'NORMAL';
};

/**
 * Allocate applicants for a specific role
 */
const allocateRole = (applicants, config) => {
    const { capacity, pPct, tPct, priorityCollegeName } = config;
    
    // Sort all applicants by CGPA descending once
    const sortedApplicants = [...applicants].sort((a, b) => (b.student.cgpa || 0) - (a.student.cgpa || 0));

    // Exclusive buckets
    const priorityBucket = sortedApplicants.filter(a => categorize(a.student, priorityCollegeName) === 'PRIORITY');
    const topUnivBucket = sortedApplicants.filter(a => categorize(a.student, priorityCollegeName) === 'TOP_UNIV');
    const normalBucket = sortedApplicants.filter(a => categorize(a.student, priorityCollegeName) === 'NORMAL');

    const selectedIds = new Set();
    const allocationResult = [];

    // Calculated Seat Targets
    let targetPriority = Math.floor(capacity * (pPct / 100));
    let targetTopUniv = Math.floor(capacity * (tPct / 100));
    
    // --- STAGE 1: PRIORITY SEATS ---
    const prioritySelected = priorityBucket.slice(0, targetPriority);
    prioritySelected.forEach(app => {
        selectedIds.add(app.id);
        allocationResult.push({ 
            applicationId: app.id, 
            category: 'PRIORITY',
            studentName: app.student.fullName,
            cgpa: app.student.cgpa,
            college: app.student.collegeName 
        });
    });

    // Transfer leftovers to Top Univ
    const unfilledPriority = targetPriority - prioritySelected.length;
    targetTopUniv += Math.max(0, unfilledPriority);

    // --- STAGE 2: TOP UNIVERSITY SEATS ---
    const topUnivSelected = topUnivBucket.slice(0, targetTopUniv);
    topUnivSelected.forEach(app => {
        selectedIds.add(app.id);
        allocationResult.push({ 
            applicationId: app.id, 
            category: 'TOP_UNIV',
            studentName: app.student.fullName,
            cgpa: app.student.cgpa,
            college: app.student.collegeName 
        });
    });

    // Transfer leftovers to Normal/Global Merit
    const unfilledTopUniv = targetTopUniv - topUnivSelected.length;
    const remainingCapacity = capacity - (prioritySelected.length + topUnivSelected.length);

    // --- STAGE 3: GLOBAL MERIT (Remaining Pool) ---
    // The pool is everyone NOT selected yet, sorted by CGPA
    const remainingPool = sortedApplicants.filter(a => !selectedIds.has(a.id));
    const normalSelected = remainingPool.slice(0, remainingCapacity);
    
    normalSelected.forEach(app => {
        allocationResult.push({ 
            applicationId: app.id, 
            category: 'NORMAL', // Effectively selected in the Global Merit stage
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
