const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateScore } = require('../utils/shortlistingEngine');

/**
 * @desc    Apply to an internship
 * @route   POST /api/v1/internships/:id/apply
 * @access  Private (Student)
 */
const applyForInternship = async (req, res) => {
    try {
        const internshipId = req.params.id;
        const studentId = req.user.id; // User ID

        // 1. Check if user is a student
        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ success: false, message: 'Only students can apply' });
        }

        // 2. Verify Internship exists & is active
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId }
        });

        if (!internship || !internship.isActive) {
            return res.status(404).json({ success: false, message: 'Internship not found or inactive' });
        }

        // 3. Get student profile & ensure it exists
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: studentId }
        });

        if (!profile) {
            return res.status(400).json({ success: false, message: 'Please complete your student profile before applying' });
        }

        // 4. Ensure documents are uploaded
        if (!req.files || Object.keys(req.files).length < 3) {
            return res.status(400).json({ success: false, message: 'Please upload Resume, Principal Letter, and HOD Letter' });
        }

        // Map uploaded files to variables
        const resumeFile = req.files['resume'] ? req.files['resume'][0] : null;
        const principalLetterFile = req.files['principalLetter'] ? req.files['principalLetter'][0] : null;
        const hodLetterFile = req.files['hodLetter'] ? req.files['hodLetter'][0] : null;

        if (!resumeFile || !principalLetterFile || !hodLetterFile) {
            return res.status(400).json({ success: false, message: 'Missing one or more required documents' });
        }

        // 5. Fetch Automation Weights
        // Assuming there's only one global rule record, we grab the first one
        let weights = await prisma.automationRule.findFirst();
        if (!weights) {
            // Provide default fallback if admin hasn't configured it
            weights = { collegeWeight: 40, cgpaWeight: 30, experienceWeight: 20, nirfWeight: 10 };
        }

        // 6. Calculate initial score from engine
        const score = calculateScore(profile, weights);

        // 7. Create Application
        const application = await prisma.application.create({
            data: {
                studentId: profile.id, // Linking to StudentProfile ID, not User ID
                internshipId: internship.id,
                score: score,
                status: 'PENDING'
            }
        });

        // 8. Create Document records
        await prisma.document.createMany({
            data: [
                { applicationId: application.id, type: 'RESUME', url: resumeFile.path },
                { applicationId: application.id, type: 'PRINCIPAL_LETTER', url: principalLetterFile.path },
                { applicationId: application.id, type: 'HOD_LETTER', url: hodLetterFile.path }
            ]
        });

        res.status(201).json({
            success: true,
            data: application,
            message: 'Application submitted successfully'
        });

    } catch (error) {
        console.error(error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'You have already applied to this internship' });
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get all internships (Public or Student)
 * @route   GET /api/v1/internships
 * @access  Public
 */
const getInternships = async (req, res) => {
    try {
        const internships = await prisma.internship.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, count: internships.length, data: internships });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get specific internship details
 * @route   GET /api/v1/internships/:id
 * @access  Public
 */
const getInternshipDetails = async (req, res) => {
    try {
        const internship = await prisma.internship.findUnique({
            where: { id: req.params.id }
        });
        if (!internship) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, data: internship });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    applyForInternship,
    getInternships,
    getInternshipDetails
};
