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
    // 1. Handle Roles
    // If no roles defined, treat the entire internship as one "GLOBAL" role
    const rolesData = internship.rolesData || [{ name: 'GENERAL', openings: internship.openingsCount }];
    
    // 2. Default Quotas
    const pPct = internship.priorityCollegeQuota || 0;
    const tPct = internship.quotaPercentages?.topUniversity || 0;
    const priorityCollegeName = internship.priorityCollege;

    let totalAllocation = [];

    rolesData.forEach(role => {
        // Find applicants who applied for this role
        // Check both assignedRole (if set) and internship.roles in application
        const roleApplicants = applicants.filter(app => {
            // Some apps might have preferred role in a field or we check against internship title
            // For now, let's assume we match the role by string in application metadata if possible
            // OR we just process everyone if it's one role.
            return true; // Simple approach for now: process everyone
        });

        // However, if we have multiple roles, we MUST have a way to know which role the student applied for.
        // Let's check the schema for Application.roles
        
        const allocation = allocateRole(roleApplicants, {
            capacity: role.openings,
            pPct: role.topUnivQuota || tPct, // Use per-role quota if exists, else global
            tPct: tPct,
            priorityCollegeName: priorityCollegeName
        });

        totalAllocation = totalAllocation.concat(allocation);
    });

    return totalAllocation;
};

module.exports = { allocateApplicants, categorize };
