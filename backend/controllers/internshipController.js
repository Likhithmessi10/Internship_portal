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

        // 4. Create Application
        const identifier = profile.rollNumber || profile.aadhar || 'UNKNOWN';
        const trackingId = `APT-${Date.now()}-${identifier.slice(-4)}`.toUpperCase();
        
        const { sop, preferredLocation, assignedRole } = req.body;

        const application = await prisma.application.create({
            data: {
                trackingId,
                studentId: profile.id, // Linking to StudentProfile ID
                internshipId: internship.id,
                status: 'SUBMITTED',
                sop: sop || null,
                preferredLocation: preferredLocation || null,
                assignedRole: assignedRole || null
            }
        });

        // 5. Handle File Uploads (Expect files from multer via any())
        if (req.files && req.files.length > 0) {
            const documents = req.files.map(file => {
                // Try to find the document label from internship config
                const docMeta = (internship.requiredDocuments || []).find(d => d.id === file.fieldname);
                
                return {
                    applicationId: application.id,
                    type: file.fieldname, 
                    url: file.path
                };
            });

            if (documents.length > 0) {
                await prisma.document.createMany({
                    data: documents
                });
            }

            // Sync Passport Photo URL if provided
            const passportFile = req.files.find(f => {
                const meta = (internship.requiredDocuments || []).find(d => d.id === f.fieldname);
                return meta?.id === 'PASSPORT_PHOTO' || meta?.label?.toLowerCase().includes('passport');
            });

            if (passportFile) {
                await prisma.studentProfile.update({
                    where: { id: profile.id },
                    data: { photoUrl: passportFile.path }
                });
            }
        }

        res.status(201).json({
            success: true,
            data: application,
            message: 'Application submitted successfully applied!'
        });

    } catch (error) {
        console.error('>>> APPLY ERROR:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'You have already applied to this internship' });
        }
        res.status(500).json({ success: false, message: 'Server error during submission' });
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
