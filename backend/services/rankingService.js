/**
 * RANKING SERVICE
 * Unified service for categorizing and ranking internship applications.
 * Ensures deterministic selection across shortlisting and allocation.
 */

/**
 * Normalizes strings for robust matching
 */
const normalizeString = (str) => (str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Categorizes an applicant based on college and ranking data
 */
const categorizeApplicant = (student, internship) => {
    const priorityCollegeName = internship.priorityCollege;
    const preferredClean = normalizeString(priorityCollegeName);
    const collegeClean = normalizeString(student.collegeName);

    // 1. PREFERRED: Exact or strong match with internship's priority college
    if (preferredClean && collegeClean.includes(preferredClean)) {
        return 'PREFERRED';
    }

    // 2. TOP: High-tier rankings or specific categories
    const nirf = parseInt(student.nirfRanking);
    const topCategories = ['IIT', 'NIT', 'IIIT', 'CENTRAL'];
    if ((nirf > 0 && nirf <= 100) || topCategories.includes(student.collegeCategory || '')) {
        return 'TOP';
    }

    // 3. OTHER: Default category
    return 'OTHER';
};

/**
 * Unified sorting logic for applicants
 * Priority: Score (desc) -> Skills Count (desc) -> CGPA (desc) -> ID (asc - tie breaker)
 */
const sortApplicants = (applicants) => {
    return [...applicants].sort((a, b) => {
        // Primary: Total Score
        if ((b.score || 0) !== (a.score || 0)) {
            return (b.score || 0) - (a.score || 0);
        }

        // Secondary: Skills Coverage (Uniqueness check)
        const aSkills = (a.extractedSkills || []).length;
        const bSkills = (b.extractedSkills || []).length;
        if (bSkills !== aSkills) {
            return bSkills - aSkills;
        }

        // Tertiary: Academic Merit (CGPA)
        const aCgpa = a.student?.cgpa || 0;
        const bCgpa = b.student?.cgpa || 0;
        if (bCgpa !== aCgpa) {
            return bCgpa - aCgpa;
        }

        // Final Deterministic Tie-breaker: ID
        return a.id.localeCompare(b.id);
    });
};

module.exports = {
    categorizeApplicant,
    sortApplicants,
    normalizeString
};
