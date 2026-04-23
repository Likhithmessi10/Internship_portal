const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Normalizes a college name for deterministic string matching
 * Lowercases and removes all spaces, commas, and special characters
 * @param {string} str 
 * @returns {string}
 */
const normalizeString = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
};

/**
 * Ranks a list of applications deterministically based on Priority & CGPA.
 * Priority 1: Preferred Colleges (defined in internship.priorityCollege)
 * Priority 2: NIRF/AISHE Recognized Colleges (collegeCategory != OTHER or nirfRanking != null or exists in aishe db)
 * Priority 3: Other
 * 
 * Within sub-groups, sorts by CGPA descending.
 * 
 * @param {Array} applications - Applications to rank (mus include student relation)
 * @param {Object} internship - Internship object details
 * @returns {Array} - Sorted array of applications
 */
const rankApplications = async (applications, internship) => {
    if (!applications || !Array.isArray(applications) || applications.length === 0) {
        return [];
    }

    // 1. Process Preferred Colleges
    const preferredRaw = internship.preferredColleges || internship.priorityCollege || '';
    let preferredList = [];
    try {
        if (typeof preferredRaw === 'string') {
            if (preferredRaw.startsWith('[')) {
                preferredList = JSON.parse(preferredRaw);
            } else {
                preferredList = preferredRaw.split(',').map(s => s.trim());
            }
        } else if (Array.isArray(preferredRaw)) {
            preferredList = preferredRaw;
        }
    } catch (e) {
        console.error('Error parsing preferredColleges for ranking', e);
    }
    
    // Normalize and filter out empties
    const normalizedPreferred = preferredList.map(p => normalizeString(p)).filter(p => p.length > 0);

    // 2. Map dataset existence efficiently
    const uniqueCollegeNames = [...new Set(applications.map(a => a.student?.collegeName).filter(Boolean))];
    
    // Fallback: accurately query aishe_colleges exactly for remaining names
    let aisheQuerySet = new Set();
    if (uniqueCollegeNames.length > 0) {
        try {
            // Because aishe_colleges has un-normalized names, we can only safely exact-match them 
            // from the raw input unless we fetch all. But actually we only do this for colleges
            // where frontend didn't set nirfRanking or didn't set category.
            const aisheMatches = await prisma.aishe_colleges.findMany({
                where: { college_name: { in: uniqueCollegeNames } },
                select: { college_name: true }
            });
            aisheQuerySet = new Set(aisheMatches.map(c => c.college_name));
        } catch (dbErr) {
            console.error('Failed to query aishe_colleges during ranking', dbErr);
        }
    }

    // 3. Assign Priority and Attach temporary map
    applications.forEach(app => {
        const student = app.student || {};
        const colName = student.collegeName || '';
        const normColName = normalizeString(colName);
        
        // Default
        let priority = 3; 

        // IF automated category exists, use it
        if (app.shortlistCategory === 'PREFERRED') priority = 1;
        else if (app.shortlistCategory === 'TOP') priority = 2;
        else if (app.shortlistCategory === 'OTHER') priority = 3;
        else {
            // Fallback to legacy logic
            // Check Priority 1: Preferred College
            if (normalizedPreferred.length > 0) {
                const isPreferred = normalizedPreferred.some(p => normColName.includes(p) || p.includes(normColName));
                if (isPreferred) priority = 1;
            }
            
            // Check Priority 2: NIRF rank handling
            if (priority === 3) {
                const isAishe = aisheQuerySet.has(colName) || student.collegeCategory !== 'OTHER' || student.nirfRanking != null;
                if (isAishe) priority = 2;
            }
        }
        
        app._priority = priority;
    });

    // 4. Sort deterministically
    applications.sort((a, b) => {
        // First by priority (1 is highest)
        if (a._priority !== b._priority) {
            return a._priority - b._priority; 
        }
        
        // Second by automated Score if available
        if (a.score !== null && b.score !== null && a.score !== undefined && b.score !== undefined) {
             if (a.score !== b.score) return b.score - a.score;
        }

        // Third by CGPA descending
        const cgpaA = a.student?.cgpa || 0;
        const cgpaB = b.student?.cgpa || 0;
        
        if (cgpaA !== cgpaB) {
            return cgpaB - cgpaA;
        }
        
        // Fourth by ID for stability
        return (a.id || '').localeCompare(b.id || '');
    });
    
    // Clean up temporary property
    applications.forEach(a => delete a._priority);
    return applications;
};

module.exports = { rankApplications, normalizeString };
