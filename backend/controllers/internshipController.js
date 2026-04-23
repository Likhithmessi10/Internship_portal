const prisma = require('../lib/prisma');
const { processApplication } = require('../services/shortlistingService');

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

        const { sop, preferredLocation, assignedRole, questionAnswers } = req.body;

        // 4. Check if student already applied in this internship
        const existingApplication = await prisma.application.findFirst({
            where: {
                studentId: profile.id,
                internshipId: internshipId
            }
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: `You have already applied for this internship. You can only submit one application per internship.`
            });
        }

        // 5. Create Application
        const identifier = profile.rollNumber || profile.aadhar || 'UNKNOWN';
        const trackingId = `APT-${Date.now()}-${identifier.slice(-4)}`.toUpperCase();

        const application = await prisma.application.create({
            data: {
                trackingId,
                studentId: profile.id, // Linking to StudentProfile ID
                internshipId: internship.id,
                status: 'SUBMITTED',
                sop: sop || null,
                preferredLocation: preferredLocation || null,
                assignedRole: assignedRole || null,
                questionAnswers: questionAnswers ? JSON.parse(questionAnswers) : null
            }
        });

        // 5. Validate Required Documents
        const originalRequiredDocs = internship.requiredDocuments || [];
        const requiredDocs = [...originalRequiredDocs];

        // Ensure NOC and Undertaking are always mandatory
        if (!requiredDocs.some(d => d.id === 'NOC')) {
            requiredDocs.push({ id: 'NOC', label: 'No Objection Certificate (NOC)' });
        }
        if (!requiredDocs.some(d => d.id === 'UNDERTAKING')) {
            requiredDocs.push({ id: 'UNDERTAKING', label: 'Undertaking Form' });
        }

        const uploadedDocTypes = new Set(req.files?.map(f => f.fieldname) || []);
        const missingDocs = requiredDocs.filter(doc => !uploadedDocTypes.has(doc.id));

        if (missingDocs.length > 0) {
            // Delete the application since we're returning an error
            await prisma.application.delete({ where: { id: application.id } });

            const missingLabels = missingDocs.map(d => d.label).join(', ');
            return res.status(400).json({
                success: false,
                message: `Missing required documents: ${missingLabels}. Please upload all required documents before submitting.`
            });
        }

        // 6. Handle File Uploads (Expect files from multer via any())
        if (req.files && req.files.length > 0) {
            const documents = req.files.map(file => {
                // Try to find the document label from internship config or mandatory defaults
                const docMeta = requiredDocs.find(d => d.id === file.fieldname);

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
                const meta = requiredDocs.find(d => d.id === f.fieldname);
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

        // 7. Background Shortlisting Processing (Trigger asynchronously)
        process.nextTick(() => {
            processApplication(application.id)
                .catch(err => console.error(`Background processing failed for application ${application.id}:`, err));
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const internships = await prisma.internship.findMany({
            where: {
                isActive: true,
                OR: [
                    { applicationDeadline: null },
                    { applicationDeadline: { gte: new Date() } }
                ]
            },
            select: {
                id: true,
                title: true,
                department: true,
                requiredDocuments: true,
                location: true,
                duration: true,
                openingsCount: true,
                isActive: true,
                rolesData: true,
                description: true,
                stipendType: true
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit
        });

        const total = await prisma.internship.count({
            where: {
                isActive: true,
                OR: [
                    { applicationDeadline: null },
                    { applicationDeadline: { gte: new Date() } }
                ]
            }
        });

        res.status(200).json({
            success: true,
            count: internships.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
            data: internships
        });
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
