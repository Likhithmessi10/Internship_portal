/**
 * Automation Shortlisting Engine for APTRANSCO Internship Applications
 */

/**
 * calculateScore
 * Calculates the total score for a candidate based on Admin Configured Weights
 * @param {Object} applicationData - Student's academic and application data
 * @param {Object} weights - Admin defined priority weights
 * @returns {number} Score
 */
const calculateScore = (applicationData, weights) => {
    let score = 0;

    // 1. College Category Score
    // IIT = 100, NIT = 80, IIIT = 60, Other = 40
    let collegeBaseScore = 40;
    if (applicationData.collegeCategory === 'IIT') collegeBaseScore = 100;
    else if (applicationData.collegeCategory === 'NIT') collegeBaseScore = 80;
    else if (applicationData.collegeCategory === 'IIIT') collegeBaseScore = 60;

    score += (collegeBaseScore * (weights.collegeWeight / 100));

    // 2. NIRF Ranking Bonus
    // Rank 1-50 = 40, 51-100 = 30, 101-200 = 20, >200 = 10
    let nirfBaseScore = 0;
    const rank = applicationData.nirfRanking || 999;
    if (rank <= 50) nirfBaseScore = 40;
    else if (rank <= 100) nirfBaseScore = 30;
    else if (rank <= 200) nirfBaseScore = 20;
    else nirfBaseScore = 10;

    score += (nirfBaseScore * (weights.nirfWeight / 100));

    // 3. CGPA Score
    // >= 9 = 40, 8-9 = 30, 7-8 = 20, <7 = 10
    let cgpaBaseScore = 0;
    const cgpa = applicationData.cgpa || 0;
    if (cgpa >= 9) cgpaBaseScore = 40;
    else if (cgpa >= 8) cgpaBaseScore = 30;
    else if (cgpa >= 7) cgpaBaseScore = 20;
    else cgpaBaseScore = 10;

    score += (cgpaBaseScore * (weights.cgpaWeight / 100));

    // 4. Experience & Projects Bonus
    // Example: Experience=20, Projects=15, Certifications=10
    let expBaseScore = 0;
    if (applicationData.hasExperience) expBaseScore += 20;
    if (applicationData.hasProjects) expBaseScore += 15;
    if (applicationData.hasCertifications) expBaseScore += 10;

    // We max it at some threshold if needed, but simple addition fits the prompt
    score += (expBaseScore * (weights.experienceWeight / 100));

    return Math.round(score * 100) / 100; // Return float to 2 dec places
};

/**
 * rankApplications
 * Ranks all applications array based on calculated score descending
 * @param {Array} applications - Array of applications with calculated .score
 * @returns {Array} Sorted Applications
 */
const rankApplications = (applications) => {
    return applications.sort((a, b) => b.score - a.score);
};

/**
 * autoShortlist
 * Given a set of applications and total openings, it automatically flags
 * the bottom logic mathematically based on the 70% automated shortlisting goal.
 * Wait: if there are 300 openings, and 500 apps, automation keeps 400 (which is 100 + 300).
 * Let's calculate: We need to filter down to a number X where X >= openings.
 * If 70% metric is strict: meaning we auto-reject the bottom 30% of candidates maybe?
 * Or we keep `(openings / total percentage mapping)`...
 * I will simplify: We keep a configurable number of top candidates (e.g. 400 for 300 openings)
 * Default formula: keep `openings * 1.33` (approx 75%, closest to scenario where 300 openings keeps 400 apps)
 * 
 * @param {Array} rankedApplications - Pre-sorted applications
 * @param {number} openingsCount - Number of positions available
 * @returns {Object} { shortlisted: [...], rejected: [...] }
 */
const autoShortlist = (rankedApplications, openingsCount) => {
    // Determine the ceiling for candidates to pass to Manual Review
    // Example logic: if 300 openings, we keep up to 400 for manual review.
    // If fewer applicants than manual quota, keep all.
    const retentionCount = Math.min(rankedApplications.length, Math.ceil(openingsCount * 1.334));

    const candidatesToReview = rankedApplications.slice(0, retentionCount);
    const automaticallyRejected = rankedApplications.slice(retentionCount);

    return {
        candidatesToReview,    // these will have status "PENDING_REVIEW"
        automaticallyRejected  // these will have status "REJECTED"
    };
};

module.exports = {
    calculateScore,
    rankApplications,
    autoShortlist
};
