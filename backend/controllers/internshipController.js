const prisma = require('../lib/prisma');
const { getResumeFileFromUploads } = require('../services/doclingService');
const { enqueueJob } = require('../services/jobService');

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

        const { sop, preferredLocation, assignedRole, questionAnswers, departmentGroupId, fieldId } = req.body;

        // 4. Check if student already applied in this internship
        const duplicateWhere = {
            studentId: profile.id,
            internshipId: internshipId
        };

        // For GROUP mode: check duplicate per department group, not per internship
        if (internship.internshipMode === 'GROUP') {
            if (!departmentGroupId) {
                return res.status(400).json({ success: false, message: 'Department group is required for group internships' });
            }
            // Verify group belongs to this internship
            const group = await prisma.internshipDepartmentGroup.findUnique({ where: { id: departmentGroupId } });
            if (!group || group.internshipId !== internshipId) {
                return res.status(400).json({ success: false, message: 'Invalid department group' });
            }
            duplicateWhere.departmentGroupId = departmentGroupId;
        }

        // For NON_STIPEND mode: check duplicate per field, and validate location
        if (internship.internshipType === 'NON_STIPEND') {
            if (!fieldId) {
                return res.status(400).json({ success: false, message: 'Field selection is required for non-stipend internships' });
            }
            if (!preferredLocation) {
                return res.status(400).json({ success: false, message: 'Preferred location is required for non-stipend internships' });
            }

            const field = await prisma.internshipField.findUnique({ where: { id: fieldId } });
            if (!field) {
                return res.status(400).json({ success: false, message: 'Invalid technical field selected' });
            }

            const fieldLocations = Array.isArray(field.locations) ? field.locations : [];
            if (!fieldLocations.includes(preferredLocation)) {
                return res.status(400).json({ success: false, message: `Invalid location: ${preferredLocation} is not available for ${field.fieldName}` });
            }

            duplicateWhere.fieldId = fieldId;
        }

        const existingApplication = await prisma.application.findFirst({
            where: duplicateWhere
        });

        if (existingApplication) {
            return res.status(400).json({
                success: false,
                message: `You have already applied for this internship. You can only submit one application per internship.`
            });
        }

        // 5. Prepare Tracking ID
        const identifier = profile.rollNumber || profile.aadhar || 'UNKNOWN';
        const trackingId = `APT-${Date.now()}-${identifier.slice(-4)}`.toUpperCase();

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
            const missingLabels = missingDocs.map(d => d.label).join(', ');
            return res.status(400).json({
                success: false,
                message: `Missing required documents: ${missingLabels}. Please upload all required documents before submitting.`
            });
        }

        // 6. Ensure resume exists for async matching
        const resumeFile = getResumeFileFromUploads(req.files);
        if (!resumeFile) {
            return res.status(400).json({
                success: false,
                message: 'Resume document is required for internship matching.'
            });
        }

        // 7. Create Application
        const application = await prisma.application.create({
            data: {
                trackingId,
                studentId: profile.id, // Linking to StudentProfile ID
                internshipId: internship.id,
                departmentGroupId: internship.internshipMode === 'GROUP' ? departmentGroupId : null,
                fieldId: internship.internshipType === 'NON_STIPEND' ? fieldId : null,
                status: 'SUBMITTED',
                sop: sop || null,
                preferredLocation: preferredLocation || null,
                assignedRole: assignedRole || null,
                questionAnswers: questionAnswers ? JSON.parse(questionAnswers) : null,
                resumeMatchScore: 0
            }
        });

        // 8. Handle File Uploads (Expect files from multer via any())
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

        // 9. Enqueue background resume matching job (non-blocking for student)
        await enqueueJob(
            'RESUME_MATCH_SCORE',
            {
                applicationId: application.id,
                resumePath: resumeFile.path,
                resumeOriginalname: resumeFile.originalname,
                resumeMimetype: resumeFile.mimetype
            },
            `RESUME_MATCH_SCORE:${application.id}`
        );

        res.status(201).json({
            success: true,
            data: application,
            message: 'Application submitted successfully. Resume validation is being processed in the background.'
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
                internshipMode: true,
                requiredDocuments: true,
                location: true,
                duration: true,
                openingsCount: true,
                isActive: true,
                rolesData: true,
                description: true,
                stipendType: true,
                internshipType: true,
                fields: true,
                departmentGroups: {
                    select: {
                        id: true,
                        department: true,
                        title: true,
                        description: true,
                        openings: true,
                        rolesData: true,
                        skillsRequired: true,
                        expectations: true,
                        customQuestions: true,
                        internshipType: true,
                        fields: true,
                        _count: { select: { applications: true } }
                    },
                    orderBy: { department: 'asc' }
                }
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
            where: { id: req.params.id },
            include: {
                evaluationCriteria: {
                    orderBy: { createdAt: 'asc' }
                },
                departmentGroups: {
                    include: { fields: true },
                    orderBy: { department: 'asc' }
                },
                fields: true
            }
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
