const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');
const { transitionApplicationStatus } = require('./applicationWorkflowService');
const { categorizeApplicant, sortApplicants } = require('./rankingService');

// High Performance Synonym Mapping
const SYNONYM_MAP = {
    'js': 'javascript',
    'javascript': 'javascript',
    'ml': 'machine learning',
    'machine learning': 'machine learning',
    'ai': 'artificial intelligence',
    'db': 'sql',
    'database': 'sql',
    'sql': 'sql',
    'postgres': 'sql',
    'mysql': 'sql',
    'reactjs': 'react',
    'react': 'react',
    'nodejs': 'node',
    'node': 'node',
    'py': 'python',
    'python': 'python',
    'cpp': 'c++',
    'c++': 'c++',
};

/**
 * Normalizes text for better matching
 */
const normalize = (text) => {
    return (text || '').toLowerCase().replace(/[^a-z0-9+#]/g, ' ').trim();
};

/**
 * Extracts text from a resume (Optimized for robustness and fallbacks)
 */
async function parseResume(filePath) {
    try {
        if (!fs.existsSync(filePath)) return "";
        
        const extension = path.extname(filePath).toLowerCase();
        const dataBuffer = await fs.promises.readFile(filePath);
        if (!dataBuffer || dataBuffer.length === 0) return "";

        // FALLBACK 1: Handle Plain Text files directly
        if (extension === '.txt') {
            return normalize(dataBuffer.toString());
        }

        // DEFAULT: PDF Parsing
        try {
            const data = await pdf(dataBuffer);
            return normalize(data.text);
        } catch (pdfError) {
            console.warn(`[ParseResume] PDF Parse failed for ${filePath}, attempting raw string fallback`);
            // FALLBACK 2: Basic string extraction from binary (very rough)
            return normalize(dataBuffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' '));
        }
    } catch (error) {
        console.error(`[ParseResume] Critical Error: ${error.message}`);
        return ""; 
    }
}

/**
 * Extracts skills and projects from resume text and profile
 * Uses unique keyword matching to prevent spam boosting
 */
async function extractData(profile, resumeText, requirements = '') {
    const skills = new Set();
    const normalizedText = (resumeText || '').toLowerCase();
    
    const reqTokens = (requirements || '').toLowerCase()
        .split(/[\s,;]+/)
        .filter(t => t.length > 1);
    
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // 1. Keyword Match against Requirements
    reqTokens.forEach(token => {
        const escaped = escapeRegex(token);
        const regex = new RegExp(`(?<=^|[^a-z0-9])${escaped}(?=[^a-z0-9]|$)`, 'i');
        if (regex.test(normalizedText)) {
            skills.add(token);
        }
    });

    // 2. Keyword Match using Synonym Map
    Object.entries(SYNONYM_MAP).forEach(([keyword, canonical]) => {
        const escaped = escapeRegex(keyword);
        const regex = new RegExp(`(?<=^|[^a-z0-9])${escaped}(?=[^a-z0-9]|$)`, 'i');
        if (regex.test(normalizedText)) {
            skills.add(canonical);
        }
    });

    // 3. Project Intensity Heuristic (FIXED: Unique keyword matching to avoid spam boosting)
    const projectKeywords = ['project', 'github', 'built', 'developed', 'implemented', 'designed'];
    let uniqueProjectMatches = 0;
    projectKeywords.forEach(word => {
        const regex = new RegExp(`(?<=^|[^a-z0-9])${word}(?=[^a-z0-9]|$)`, 'i');
        if (regex.test(normalizedText)) {
            uniqueProjectMatches++;
        }
    });

    return {
        skills: Array.from(skills),
        projectWeight: uniqueProjectMatches // Now 0-6 instead of unbounded raw count
    };
}

/**
 * Calculates a score for an application based on deterministic merit
 * Removed year-based experience bias as per requirement
 */
function calculateScore(application, internship) {
    const { student, extractedSkills, extractedProjects, questionAnswers } = application;
    const cgpa = student.cgpa || 0;
    
    // 1. Skills Score (40%) - Max 4.0
    const reqSkills = (internship.requirements || '').toLowerCase().split(/[\s,]+/);
    const matched = (extractedSkills || []).filter(s => reqSkills.includes(s));
    const skillsScore = reqSkills.length > 0 ? (matched.length / reqSkills.length) : 0.5;
    
    // 2. Projects Score (40%) - Max 4.0 (Heuristic based on 6 unique keywords)
    const pWeight = Math.min(1.0, (extractedProjects?.weight || 0) / 6);

    // 3. CGPA Score (10%) - Max 1.0
    let cgpaWeight = 0.5;
    if (cgpa >= 9) cgpaWeight = 1.0;
    else if (cgpa >= 8) cgpaWeight = 0.8;
    else if (cgpa >= 7) cgpaWeight = 0.6;
    else cgpaWeight = 0.3;
    
    // 4. Custom Question Metrics (10%) - Max 1.0
    let questionScore = 0;
    const qAnswers = questionAnswers || {};
    const customQs = internship.customQuestions || [];
    if (customQs.length > 0) {
        let yesCount = 0;
        customQs.forEach((q, idx) => {
            if (qAnswers[idx] === 'Yes') yesCount++;
        });
        questionScore = yesCount / customQs.length;
    } else {
        questionScore = 1.0; // neutral
    }
    
    // Total Score = 40% Skills + 40% Projects + 10% CGPA + 10% Questions
    const total = (skillsScore * 4) + (pWeight * 4) + (cgpaWeight * 1) + (questionScore * 1);
    
    return {
        score: parseFloat(total.toFixed(2)),
        breakdown: {
            skillsMatch: parseFloat((skillsScore * 4).toFixed(2)),
            projectScore: parseFloat((pWeight * 4).toFixed(2)),
            cgpaScore: parseFloat((cgpaWeight * 1).toFixed(2)),
            questionScore: parseFloat((questionScore * 1).toFixed(2))
        }
    };
}

/**
 * Processes a single application
 */
async function processApplication(applicationId) {
    try {
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { student: true, internship: true, documents: true }
        });
        if (!application) return;

        const resumeDoc = application.documents.find(d => d.type === 'RESUME' || d.label?.toUpperCase().includes('RESUME'));
        let resumeText = '';
        if (resumeDoc?.url) {
            const uploadsDir = path.resolve(__dirname, '../../uploads');
            const cleanPath = resumeDoc.url.replace(/^uploads[\\\/]/, '');
            const filePath = path.join(uploadsDir, cleanPath);
            
            if (path.normalize(filePath).startsWith(uploadsDir) && fs.existsSync(filePath)) {
                resumeText = await parseResume(filePath) || '';
            }
        }

        const extracted = await extractData(application.student, resumeText, application.internship.requirements);
        const scoring = calculateScore({ ...application, extractedSkills: extracted.skills, extractedProjects: { weight: extracted.projectWeight } }, application.internship);

        await prisma.application.update({
            where: { id: applicationId },
            data: {
                parsedResumeText: resumeText.slice(0, 7000),
                extractedSkills: extracted.skills,
                extractedProjects: { weight: extracted.projectWeight },
                score: scoring.score,
                scoreBreakdown: scoring.breakdown
            }
        });
    } catch (error) {
        console.error(`[Process Error] App ${applicationId}:`, error.message);
    }
}

async function processBatch(appIds) {
    return Promise.all(appIds.map(id => processApplication(id)));
}

/**
 * Integrated Shortlisting: Applies category-based grouping and ratios
 */
async function runShortlistingForInternship(internshipId, user) {
    if (!user) throw new Error('User context required for workflow transitions');

    const internship = await prisma.internship.findUnique({
        where: { id: internshipId },
        include: { 
            applications: { 
                where: { status: 'SUBMITTED' } 
            } 
        }
    });

    if (!internship) throw new Error('Internship not found');

    // 1. Process scoring for all submitted apps
    const appIds = internship.applications.map(a => a.id);
    const CHUNK_SIZE = 15;
    for (let i = 0; i < appIds.length; i += CHUNK_SIZE) {
        await processBatch(appIds.slice(i, i + CHUNK_SIZE));
    }

    // 2. Fetch updated apps with student info
    const updatedApps = await prisma.application.findMany({
        where: { internshipId, status: 'SUBMITTED' },
        include: { student: true }
    });

    // 3. Category-based Grouping
    const buckets = { PREFERRED: [], TOP: [], OTHER: [] };
    updatedApps.forEach(app => {
        const cat = categorizeApplicant(app.student, internship);
        buckets[cat].push(app);
    });

    // 4. Calculate Targets per Category (Apply ratio)
    const ratio = internship.shortlistingRatio || 2;
    const capacity = internship.openingsCount;
    const pQuota = internship.priorityCollegeQuota || 0;
    const tQuota = internship.quotaPercentages?.topUniversity || 0;

    const targets = {
        PREFERRED: Math.ceil(capacity * (pQuota / 100) * ratio),
        TOP: Math.ceil(capacity * (tQuota / 100) * ratio),
        OTHER: 0 // Will handle remaining later
    };
    targets.OTHER = Math.ceil((capacity * ratio) - targets.PREFERRED - targets.TOP);

    let finalShortlist = [];

    // Fill Buckets deterministically
    ['PREFERRED', 'TOP', 'OTHER'].forEach(cat => {
        const sorted = sortApplicants(buckets[cat]);
        const selected = sorted.slice(0, targets[cat]);
        finalShortlist = finalShortlist.concat(selected);
    });

    // 5. Enforce final seat limits (Total shortlisting shouldn't exceed ratio * total capacity)
    const absoluteLimit = capacity * ratio;
    if (finalShortlist.length > absoluteLimit) {
        finalShortlist = sortApplicants(finalShortlist).slice(0, absoluteLimit);
    }

    // 6. Execute Workflow Transitions (All status updates must go through workflow service)
    let shortlistedCount = 0;
    for (const app of finalShortlist) {
        try {
            await transitionApplicationStatus(app.id, 'SHORTLISTED', user, 'Automated Category-based Shortlisting');
            shortlistedCount++;
        } catch (err) {
            console.error(`[Shortlist Fail] App ${app.id}:`, err.message);
        }
    }

    return { processed: updatedApps.length, shortlisted: shortlistedCount };
}

module.exports = {
    parseResume,
    extractData,
    calculateScore,
    processApplication,
    runShortlistingForInternship
};

