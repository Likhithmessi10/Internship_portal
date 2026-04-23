const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../lib/prisma');

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
 * Extracts text from a PDF resume (Asynchronous)
 */
async function parseResume(filePath) {
    try {
        const stats = await fs.promises.stat(filePath).catch(() => null);
        if (!stats) return null;
        
        const dataBuffer = await fs.promises.readFile(filePath);
        const data = await pdf(dataBuffer);
        return normalize(data.text);
    } catch (error) {
        console.error('Error parsing resume:', error);
        return null;
    }
}

/**
 * Extracts skills and projects from resume text and profile
 */
async function extractData(profile, resumeText, requirements = '') {
    const skills = new Set();
    const normalizedText = (resumeText || '').toLowerCase();
    
    // 1. Skill Extraction from Dynamic Requirements
    const reqList = requirements.toLowerCase().split(/[\s,]+/).filter(s => s.length > 1);
    
    // Help escape special chars for regex
    const escapeRegex = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    reqList.forEach(s => {
        const escaped = escapeRegex(s);
        const regex = new RegExp(`(^|\\s|[,./()])${escaped}($|\\s|[,./()])`, 'i');
        if (regex.test(normalizedText)) {
            skills.add(s);
        }
    });

    // 2. Skill Extraction with Synonym Mapping
    Object.entries(SYNONYM_MAP).forEach(([s, canonical]) => {
        const escaped = escapeRegex(s);
        const regex = new RegExp(`(^|\\s|[,./()])${escaped}($|\\s|[,./()])`, 'i');
        if (regex.test(normalizedText)) {
            skills.add(canonical);
        }
    });

    // 3. Project Count (heuristic looking for project indicators)
    const projectIndicators = ['project', 'github', 'contribution', 'developed', 'built'];
    let projectWeight = 0;
    projectIndicators.forEach(ind => {
        const matches = normalizedText.match(new RegExp(ind, 'gi')) || [];
        projectWeight += matches.length;
    });

    return {
        skills: Array.from(skills),
        projectWeight: projectWeight
    };
}

/**
 * Calculates a score for an application based on deterministic rules
 */
function calculateScore(application, internship) {
    const { student, extractedSkills, extractedProjects, questionAnswers } = application;
    const cgpa = student.cgpa || 0;
    
    // 1. Skills Score (40%)
    const reqSkills = (internship.requirements || '').toLowerCase().split(/[\s,]+/);
    const matched = (extractedSkills || []).filter(s => reqSkills.includes(s));
    const skillsScore = reqSkills.length > 0 ? (matched.length / reqSkills.length) : 0.5;
    
    // 2. CGPA Score (10%)
    let cgpaWeight = 0.5;
    if (cgpa >= 9) cgpaWeight = 1.0;
    else if (cgpa >= 8) cgpaWeight = 0.8;
    else if (cgpa >= 7) cgpaWeight = 0.6;
    else cgpaWeight = 0.3;
    
    // 3. Experience Score (20%)
    const year = parseInt(student.yearOfStudy) || 1;
    let expWeight = 0.3; // Beginner
    if (year >= 4) expWeight = 1.0; // Expert/Final
    else if (year >= 3) expWeight = 0.6; // Intermediate
    
    // 4. Custom Question Metrics (10%)
    // If student answered Yes to custom questions
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
        questionScore = 1.0; // neutral if no questions
    }
    
    // 5. Projects (20%)
    const pWeight = Math.min(1.0, (extractedProjects?.weight || 0) / 20);

    // TOTAL SCORE (10 Point Scale)
    // Skills (4) + Exp (3) + Projects (2) + CGPA (1) = 10
    // Note: Exp includes the 10% baseline from questions to simplify for UI display
    const total = (skillsScore * 4) + (expWeight * 2) + (questionScore * 1) + (pWeight * 2) + (cgpaWeight * 1);
    
    return {
        score: parseFloat(total.toFixed(2)),
        breakdown: {
            skillsMatch: parseFloat((skillsScore * 4).toFixed(2)),
            experienceScore: parseFloat(((expWeight * 2) + (questionScore * 1)).toFixed(2)),
            projectScore: parseFloat((pWeight * 2).toFixed(2)),
            cgpaScore: parseFloat((cgpaWeight * 1).toFixed(2))
        }
    };
}

/**
 * Classifies application into PREFERRED, TOP, OTHER
 */
function classifyCategory(collegeName, internship) {
    const clean = s => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const collegeClean = clean(collegeName);
    
    if ((internship.preferredColleges || []).some(p => collegeClean.includes(clean(p)))) return 'PREFERRED';
    if ((internship.topColleges || []).some(t => collegeClean.includes(clean(t)))) return 'TOP';
    
    return 'OTHER';
}

/**
 * Process application (Background Job)
 */
async function processApplication(applicationId) {
    try {
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { student: true, internship: true, documents: true }
        });
        if (!application) return;

        const resumeDoc = application.documents.find(d => d.type === 'RESUME' || d.label === 'Resume / CV');
        let resumeText = '';
        if (resumeDoc?.url) {
            resumeText = await parseResume(path.resolve(__dirname, '../../', resumeDoc.url)) || '';
        }

        const extracted = await extractData(application.student, resumeText, application.internship.requirements);
        const category = classifyCategory(application.student.collegeName, application.internship);
        const scoring = calculateScore({ ...application, extractedSkills: extracted.skills, extractedProjects: { weight: extracted.projectWeight } }, application.internship);

        await prisma.application.update({
            where: { id: applicationId },
            data: {
                parsedResumeText: resumeText.slice(0, 10000),
                extractedSkills: extracted.skills,
                extractedProjects: { weight: extracted.projectWeight },
                shortlistCategory: category,
                score: scoring.score,
                scoreBreakdown: scoring.breakdown
            }
        });
    } catch (error) { console.error('Processing error:', error); }
}

// Industrial-Strength Skill Ontology
const SKILL_ONTOLOGY = {
    'javascript': ['js', 'javascript', 'es6', 'typescript', 'node'],
    'python': ['python', 'py', 'django', 'flask', 'fastapi'],
    'java': ['java', 'spring', 'springboot', 'hibernate'],
    'sql': ['sql', 'postgres', 'mysql', 'database', 'db'],
    'machine_learning': ['ml', 'machine learning', 'scikit', 'tensorflow', 'pytorch'],
    'web_dev': ['html', 'css', 'react', 'reactjs', 'vue', 'angular'],
    'cloud': ['aws', 'azure', 'gcp', 'cloud', 'container', 'docker', 'kubernetes'],
};

/**
 * Deterministic shortlisting with explainability
 */
async function runShortlistingForInternship(internshipId) {
    console.log(`[Shortlisting] Deterministic run for ${internshipId}`);
    
    const internship = await prisma.internship.findUnique({
        where: { id: internshipId },
        include: { applications: { include: { student: true } } }
    });

    if (!internship) throw new Error('Internship not found');

    const totalOpenings = internship.openingsCount;
    const ratio = internship.shortlistingRatio || 2;
    const targetCount = totalOpenings * ratio;

    // 1. Refresh all scores deterministically
    const evaluatableApps = internship.applications.filter(app => app.status !== 'REJECTED');
    
    for (const app of evaluatableApps) {
        await processApplication(app.id);
    }

    // 2. Fetch updated applications
    const updatedApps = await prisma.application.findMany({
        where: { internshipId, status: { not: 'REJECTED' } },
        include: { student: true }
    });

    // 3. Deterministic Sorting with Tie-breakers
    const sortedApps = updatedApps.sort((a, b) => {
        if ((b.score || 0) !== (a.score || 0)) return (b.score || 0) - (a.score || 0);
        
        // Tie-breaker 1: Required Skill Coverage
        const aSkillsCount = (a.extractedSkills || []).length;
        const bSkillsCount = (b.extractedSkills || []).length;
        if (bSkillsCount !== aSkillsCount) return bSkillsCount - aSkillsCount;

        // Tie-breaker 2: CGPA
        if ((b.student?.cgpa || 0) !== (a.student?.cgpa || 0)) return (b.student?.cgpa || 0) - (a.student?.cgpa || 0);
        
        // Tie-breaker 3: Recency
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        if (timeA !== timeB) return timeA - timeB;

        // Final Lexicographical
        return a.id.localeCompare(b.id);
    });

    // 4. Batch Updates with explainability
    const toShortlist = sortedApps.slice(0, targetCount);
    const toPending = sortedApps.slice(targetCount);

    await prisma.$transaction([
        ...toShortlist.map((app, index) => prisma.application.update({
            where: { id: app.id },
            data: { 
                status: 'SHORTLISTED',
                scoreBreakdown: {
                    ...app.scoreBreakdown,
                    rank: index + 1,
                    isTieBroken: index > 0 && app.score === sortedApps[index-1].score,
                    explain: `Ranked #${index+1} deterministically based on score and tie-breaker policy.`
                }
            }
        })),
        ...toPending.map(app => prisma.application.update({
            where: { id: app.id },
            data: { status: 'SUBMITTED' }
        }))
    ]);

    return { total: sortedApps.length, shortlisted: toShortlist.length };
}

module.exports = {
    parseResume,
    extractData,
    calculateScore,
    processApplication,
    runShortlistingForInternship
};
