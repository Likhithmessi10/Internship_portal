const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

        if (internship.applicationDeadline && new Date(internship.applicationDeadline) < new Date()) {
            return res.status(400).json({ success: false, message: 'Application deadline has passed for this internship.' });
        }

        // 3. Get student profile & ensure it exists
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: studentId }
        });

        if (!profile) {
            return res.status(400).json({ success: false, message: 'Please complete your student profile before applying' });
        }

        // 4. Ensure documents are uploaded (Optional for testing)
        // Map uploaded files to variables if they exist
        const resumeFile = req.files && req.files['resume'] ? req.files['resume'][0] : null;
        const principalLetterFile = req.files && req.files['principalLetter'] ? req.files['principalLetter'][0] : null;
        const nocLetterFile = req.files && req.files['nocLetter'] ? req.files['nocLetter'][0] : null;
        const hodLetterFile = req.files && req.files['hodLetter'] ? req.files['hodLetter'][0] : null;
        const marksheetFile = req.files && req.files['marksheet'] ? req.files['marksheet'][0] : null;
        const passportPhotoFile = req.files && req.files['passportPhoto'] ? req.files['passportPhoto'][0] : null;

        // 5. Create Application
        const identifier = profile.rollNumber || profile.aadhar || 'UNKNOWN';
        const trackingId = `APT-${Date.now()}-${identifier.slice(-4)}`.toUpperCase();
        const application = await prisma.application.create({
            data: {
                trackingId,
                studentId: profile.id, // Linking to StudentProfile ID, not User ID
                internshipId: internship.id,
                status: 'PENDING'
            }
        });

        // 8. Create Document records ONLY if provided
        const docPromises = [];
        if (resumeFile) docPromises.push(prisma.document.create({ data: { applicationId: application.id, type: 'RESUME', url: resumeFile.path } }));
        if (principalLetterFile) docPromises.push(prisma.document.create({ data: { applicationId: application.id, type: 'PRINCIPAL_LETTER', url: principalLetterFile.path } }));
        if (nocLetterFile) docPromises.push(prisma.document.create({ data: { applicationId: application.id, type: 'NOC_LETTER', url: nocLetterFile.path } }));
        if (hodLetterFile) docPromises.push(prisma.document.create({ data: { applicationId: application.id, type: 'HOD_LETTER', url: hodLetterFile.path } }));

        // Passport Photo
        if (req.files && req.files.passportPhoto) {
            const path = req.files.passportPhoto[0].path;
            docPromises.push(prisma.document.create({
                data: { type: 'PASSPORT_PHOTO', url: path, applicationId: application.id }
            }));
            // Also update student profile photoUrl if not set
            await prisma.studentProfile.update({
                where: { id: profile.id },
                data: { photoUrl: path }
            });
        }

        // Marksheet
        if (req.files && req.files.marksheet) {
            docPromises.push(prisma.document.create({
                data: { type: 'MARKSHEET', url: req.files.marksheet[0].path, applicationId: application.id }
            }));
        }

        await Promise.all(docPromises);

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
            where: {
                isActive: true,
                OR: [
                    { applicationDeadline: null },
                    { applicationDeadline: { gte: new Date() } }
                ]
            },
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
