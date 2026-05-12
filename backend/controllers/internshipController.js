const prisma = require('../lib/prisma');
const { getResumeFileFromUploads } = require('../services/doclingService');

/**
 * @desc    Apply to an internship
 * @route   POST /api/v1/internships/:id/apply
 * @access  Private (Student)
 */
const applyForInternship = async (req, res) => {
    try {
        const internshipId = req.params.id;
        const studentId = req.user.id;

        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ success: false, message: 'Only students can apply' });
        }

        // Verify internship exists, is active, and is live for students
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId }
        });

        if (!internship || !internship.isActive) {
            return res.status(404).json({ success: false, message: 'Internship not found or inactive' });
        }

        if (internship.publishStatus !== 'LIVE') {
            return res.status(400).json({ success: false, message: 'This internship is not yet open for applications' });
        }

        if (internship.applicationDeadline && new Date(internship.applicationDeadline) < new Date()) {
            return res.status(400).json({ success: false, message: 'Application deadline has passed' });
        }

        const profile = await prisma.studentProfile.findUnique({ where: { userId: studentId } });
        if (!profile) {
            return res.status(400).json({ success: false, message: 'Please complete your student profile before applying' });
        }

        const { sop, preferredLocation, assignedRole, questionAnswers, departmentGroupId, fieldId, problemStatementId } = req.body;

        // Duplicate check
        const duplicateWhere = { studentId: profile.id, internshipId };

        if (internship.internshipMode === 'GROUP') {
            if (!departmentGroupId) {
                return res.status(400).json({ success: false, message: 'Department group is required for group internships' });
            }
            const group = await prisma.internshipDepartmentGroup.findUnique({ where: { id: departmentGroupId } });
            if (!group || group.internshipId !== internshipId) {
                return res.status(400).json({ success: false, message: 'Invalid department group' });
            }
            duplicateWhere.departmentGroupId = departmentGroupId;

            // Validate problem statement if provided
            if (problemStatementId) {
                const ps = await prisma.internshipDepartmentProblemStatement.findUnique({
                    where: { id: problemStatementId }
                });
                if (!ps || ps.departmentGroupId !== departmentGroupId) {
                    return res.status(400).json({ success: false, message: 'Invalid problem statement for selected department' });
                }
                duplicateWhere.problemStatementId = problemStatementId;
            }
        }

        if (internship.internshipType === 'NON_STIPEND') {
            if (internship.internshipMode === 'GROUP') {
                // GROUP NON_STIPEND: locations come from the problem statement, no fieldId needed
                if (!preferredLocation) {
                    return res.status(400).json({ success: false, message: 'Preferred location is required for non-stipend internships' });
                }
                // Validate location against the selected problem statement's locations
                if (problemStatementId) {
                    const ps = await prisma.internshipDepartmentProblemStatement.findUnique({ where: { id: problemStatementId } });
                    if (ps) {
                        const psLocations = Array.isArray(ps.locations) ? ps.locations : [];
                        if (psLocations.length > 0 && !psLocations.includes(preferredLocation)) {
                            return res.status(400).json({
                                success: false,
                                message: `Location "${preferredLocation}" is not available for "${ps.title}"`
                            });
                        }
                    }
                }
            } else {
                // SINGLE NON_STIPEND: fieldId is required; location validated against field
                if (!fieldId) {
                    return res.status(400).json({ success: false, message: 'Field selection is required for non-stipend internships' });
                }
                if (!preferredLocation) {
                    return res.status(400).json({ success: false, message: 'Preferred location is required for non-stipend internships' });
                }
                const field = await prisma.internshipField.findUnique({ where: { id: fieldId } });
                if (!field) {
                    return res.status(400).json({ success: false, message: 'Invalid field selected' });
                }
                const fieldLocations = Array.isArray(field.locations) ? field.locations : [];
                if (!fieldLocations.includes(preferredLocation)) {
                    return res.status(400).json({ success: false, message: `Location ${preferredLocation} is not available for ${field.fieldName}` });
                }
                duplicateWhere.fieldId = fieldId;
            }
        }

        const existingApplication = await prisma.application.findFirst({ where: duplicateWhere });
        if (existingApplication) {
            return res.status(400).json({ success: false, message: 'You have already applied for this opportunity' });
        }

        // Validate required documents (PRTI-defined, dynamic — no forced NOC/BOND at apply time)
        const requiredDocs = Array.isArray(internship.requiredDocuments) ? internship.requiredDocuments : [];
        const uploadedDocTypes = new Set(req.files?.map(f => f.fieldname) || []);
        const missingDocs = requiredDocs.filter(doc => !uploadedDocTypes.has(doc.id));

        if (missingDocs.length > 0) {
            const missingLabels = missingDocs.map(d => d.label || d.id).join(', ');
            return res.status(400).json({
                success: false,
                message: `Missing required documents: ${missingLabels}`
            });
        }

        // Resume is always required
        const resumeFile = getResumeFileFromUploads(req.files || []);
        if (!resumeFile) {
            return res.status(400).json({ success: false, message: 'Resume is required' });
        }

        const identifier = profile.rollNumber || profile.aadhaarNumber || 'UNKNOWN';
        const trackingId = `APT-${Date.now()}-${identifier.slice(-4)}`.toUpperCase();

        const application = await prisma.application.create({
            data: {
                trackingId,
                studentId: profile.id,
                internshipId: internship.id,
                departmentGroupId: internship.internshipMode === 'GROUP' ? (departmentGroupId || null) : null,
                problemStatementId: (internship.internshipMode === 'GROUP' && problemStatementId) ? problemStatementId : null,
                fieldId: internship.internshipType === 'NON_STIPEND' ? (fieldId || null) : null,
                status: 'SUBMITTED',
                sop: sop || null,
                preferredLocation: preferredLocation || null,
                assignedRole: assignedRole || null,
                questionAnswers: questionAnswers ? JSON.parse(questionAnswers) : null
            }
        });

        // Store uploaded documents
        if (req.files && req.files.length > 0) {
            await prisma.document.createMany({
                data: req.files.map(file => ({
                    applicationId: application.id,
                    type: file.fieldname,
                    url: file.path
                }))
            });

            // Sync passport photo to student profile if uploaded
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
            message: 'Application submitted successfully'
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
 * @desc    Get all internships visible to students
 * @route   GET /api/v1/internships
 * @access  Public
 */
const getInternships = async (req, res) => {
    try {
        const { batchId } = req.query;
        const whereClause = {
            isActive: true,
            publishStatus: 'LIVE',
            OR: [
                { applicationDeadline: null },
                { applicationDeadline: { gte: new Date() } }
            ]
        };

        if (batchId) whereClause.batchId = batchId;

        const internships = await prisma.internship.findMany({
            where: whereClause,
            select: {
                id: true,
                batchId: true,
                title: true,
                department: true,
                requiredDocuments: true,
                location: true,
                duration: true,
                openingsCount: true,
                isActive: true,
                rolesData: true,
                description: true,
                stipendType: true,
                stipendAmounts: true,
                internshipType: true,
                internshipMode: true,
                publishStatus: true,
                departmentGroups: {
                    include: {
                        fields: true,
                        problemStatements: {
                            orderBy: { problemStatementNumber: 'asc' }
                        }
                    }
                },
                fields: true,
                batch: { select: { title: true } }
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
            where: { id: req.params.id },
            include: {
                evaluationCriteria: { orderBy: { createdAt: 'asc' } },
                departmentGroups: {
                    include: {
                        fields: true,
                        problemStatements: {
                            orderBy: { problemStatementNumber: 'asc' }
                        }
                    },
                    orderBy: { department: 'asc' }
                },
                fields: true,
                batch: { select: { id: true, title: true } }
            }
        });
        if (!internship) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, data: internship });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = { applyForInternship, getInternships, getInternshipDetails };
