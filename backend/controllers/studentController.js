const prisma = require('../lib/prisma');

/**
 * @desc    Create or Update Student Profile
 * @route   POST /api/v1/students/profile
 * @access  Private (Student)
 */
const upsertProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Ensure user is a student
        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ success: false, message: 'Only students can manage student profiles' });
        }

        let {
            fullName, collegeRollNumber, phone, dob, address, aadhar, aadhaarNumber,
            collegeName, university, degree, branch,
            yearOfStudy, cgpa, collegeCategory, nirfRanking,
            hasExperience, hasProjects, hasCertifications,
            experienceDesc, projectsDesc, certificationsDesc, skills, photoUrl,
            linkedinUrl, githubUrl
        } = req.body;

        // Standardize: Prefer aadhaarNumber if present, fallback to aadhar
        const finalAadhaar = aadhaarNumber || aadhar;

        // Validation for Aadhaar Number (12 digits)
        if (finalAadhaar && !/^\d{12}$/.test(finalAadhaar.replace(/[-\s]/g, ''))) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid Aadhaar Number format. It must be exactly 12 digits.' 
            });
        }

        // MVP Profile Validation
        if (!fullName || !collegeName || !branch || !yearOfStudy || !finalAadhaar || !dob || !phone || !university || !degree) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mandatory fields missing: fullName, collegeName, branch, yearOfStudy, aadhaarNumber, dob, phone, university, or degree' 
            });
        }

        // Requirement 6: Validate college against trusted dataset
        const { findCollege, mapCategory } = require('../services/collegeService');
        const trustedMatch = findCollege(collegeName);
        
        let validatedCategory = 'OTHER';
        let validatedNirf = (nirfRanking && !isNaN(parseInt(nirfRanking))) ? parseInt(nirfRanking) : null;
        let finalCollegeName = collegeName;

        if (trustedMatch) {
            // Use canonical data if matched
            finalCollegeName = trustedMatch.institute_name;
            validatedCategory = mapCategory(trustedMatch.institution_type || trustedMatch.college_type);
            // Only overwrite if the dataset has it; otherwise, keep user input if we trust it, or keep null
            if (trustedMatch.nirf_rank) validatedNirf = parseInt(trustedMatch.nirf_rank);
        } else {
            // Manual Entry Fallback (Requirement: manual entry implemented)
            const allowedCategories = ['IIT', 'NIT', 'IIIT', 'CENTRAL', 'STATE', 'PRIVATE', 'OTHER'];
            validatedCategory = allowedCategories.includes(collegeCategory) ? collegeCategory : 'OTHER';
        }

        let finalPhotoUrl = photoUrl;
        if (req.file) {
            finalPhotoUrl = `uploads/${req.file.filename}`;
        }

        const parsedCgpa = (cgpa && !isNaN(parseFloat(cgpa))) ? parseFloat(cgpa) : 0;

        const profileData = {
            fullName: fullName || "",
            collegeRollNumber: collegeRollNumber || null,
            phone: phone || "",
            dob: new Date(dob),
            address: address || "",
            aadhaarNumber: finalAadhaar || "",
            collegeName: finalCollegeName || "",
            university: university || "",
            degree: degree || "",
            branch: branch || "",
            yearOfStudy: parseInt(yearOfStudy) || 1,
            cgpa: parsedCgpa,
            collegeCategory: validatedCategory,
            nirfRanking: validatedNirf,
            hasExperience: hasExperience === true || hasExperience === 'true',
            hasProjects: hasProjects === true || hasProjects === 'true',
            hasCertifications: hasCertifications === true || hasCertifications === 'true',
            experienceDesc: experienceDesc || null,
            projectsDesc: projectsDesc || null,
            certificationsDesc: certificationsDesc || null,
            skills: skills || null,
            photoUrl: finalPhotoUrl || null,
            linkedinUrl: linkedinUrl || null,
            githubUrl: githubUrl || null
        };


        const profile = await prisma.studentProfile.upsert({
            where: { userId },
            update: profileData,
            create: {
                ...profileData,
                userId
            }
        });

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        // Don't log sensitive data
        console.error('Profile upsert error:', error.message);

        // Handle unique constraint violations with specifics
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Aadhar or Roll Number';
            return res.status(400).json({
                success: false,
                message: `Setup failed: A student with this ${field} already exists in the system.`
            });
        }

        res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get current student's profile
 * @route   GET /api/v1/students/profile
 * @access  Private (Student)
 */
const getProfile = async (req, res) => {
    try {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id },
            include: {
                applications: {
                    include: {
                        internship: true,
                        stipend: true,
                        mentor: { select: { name: true, email: true, phone: true } },
                        attendance: true,
                        documents: true
                    }
                }
            }
        });

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        // Ensure each hired/active application has an attendance object (even if empty)
        // to prevent frontend "missing property" issues
        for (const app of profile.applications) {
            if (['SELECTED', 'REPORTED', 'HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'].includes(app.status) && !app.attendance) {
                app.attendance = {
                    daysAttended: 0,
                    totalDays: 0,
                    attendanceLog: [],
                    meetsMinimum: false,
                    minimumDays: 20
                };
            }
        }

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Upsert Stipend Details for an application
 * @route   POST /api/v1/students/applications/:id/stipend
 * @access  Private (Student)
 */
const upsertStipend = async (req, res) => {
    try {
        const { panNumber, bankAccount, ifscCode, bankName, bankBranch } = req.body;
        const applicationId = req.params.id;

        // Verify application belongs to student
        const application = await prisma.application.findFirst({
            where: { id: applicationId, student: { userId: req.user.id } }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const stipend = await prisma.stipend.upsert({
            where: { applicationId },
            update: { panNumber, bankAccount, ifscCode, bankName, bankBranch },
            create: { applicationId, panNumber, bankAccount, ifscCode, bankName, bankBranch }
        });

        res.status(200).json({ success: true, data: stipend });
    } catch (error) {
        console.error('Stipend upsert error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Upload joining documents (NOC, BOND, UNDERTAKING) after reporting
 * @route   POST /api/v1/students/applications/:id/joining-documents
 * @access  Private (Student)
 *
 * These documents are unlocked only after the student's status is REPORTED or HIRED.
 */
const uploadJoiningDocuments = async (req, res) => {
    try {
        const applicationId = req.params.id;

        const application = await prisma.application.findFirst({
            where: { id: applicationId, student: { userId: req.user.id } }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Full application needed to check internship type
        const appFull = await prisma.application.findFirst({
            where: { id: applicationId },
            include: { internship: { select: { internshipType: true } } }
        });
        const isLearning = appFull?.internship?.internshipType === 'NON_STIPEND';

        // MONETARY: unlock at REPORTED/HIRED; NON_STIPEND: unlock at DOCUMENTS_PENDING
        const unlockStatuses = isLearning
            ? ['DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED', 'HIRED']
            : ['SELECTED', 'REPORTED', 'HIRED'];

        if (!unlockStatuses.includes(application.status)) {
            return res.status(403).json({
                success: false,
                message: isLearning
                    ? 'Documents can be uploaded once PRTI has triggered document collection.'
                    : 'Joining documents can only be uploaded after your reporting has been confirmed by PRTI'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        // NON_STIPEND adds INSURANCE to the required set
        const MONETARY_DOC_TYPES  = new Set(['NOC', 'BOND', 'UNDERTAKING']);
        const LEARNING_DOC_TYPES  = new Set(['NOC', 'BOND', 'UNDERTAKING', 'INSURANCE']);
        const JOINING_DOC_TYPES   = isLearning ? LEARNING_DOC_TYPES : MONETARY_DOC_TYPES;

        const invalidDocs = req.files.filter(f => !JOINING_DOC_TYPES.has(f.fieldname));
        if (invalidDocs.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid document type(s): ${invalidDocs.map(f => f.fieldname).join(', ')}. Allowed: ${[...JOINING_DOC_TYPES].join(', ')}`
            });
        }

        // Save joining dates if provided by student
        const { joiningDate, endDate } = req.body;
        if (joiningDate || endDate) {
            await prisma.application.update({
                where: { id: applicationId },
                data: {
                    ...(joiningDate ? { joiningDate: new Date(joiningDate) } : {}),
                    ...(endDate     ? { endDate:     new Date(endDate)     } : {})
                }
            });
        }

        // Upsert each document (replace if already uploaded)
        for (const file of req.files) {
            const existing = await prisma.document.findFirst({
                where: { applicationId, type: file.fieldname }
            });

            if (existing) {
                await prisma.document.update({
                    where: { id: existing.id },
                    data: { url: file.path, uploadedAt: new Date() }
                });
            } else {
                await prisma.document.create({
                    data: {
                        applicationId,
                        type: file.fieldname,
                        url: file.path,
                        label: { NOC: 'No Objection Certificate', BOND: 'Bond / Service Agreement', UNDERTAKING: 'Undertaking Form' }[file.fieldname] || file.fieldname
                    }
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Joining documents uploaded successfully',
            uploadedTypes: req.files.map(f => f.fieldname)
        });
    } catch (error) {
        console.error('Upload joining docs error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Student reapplies for a different location on the same rejected field
 * PUT /students/applications/:id/reapply-location
 */
const reapplyLocation = async (req, res) => {
    const prisma = require('../lib/prisma');
    try {
        const { id } = req.params;
        const { preferredLocation } = req.body;
        if (!preferredLocation) return res.status(400).json({ success: false, message: 'preferredLocation is required' });

        const app = await prisma.application.findUnique({
            where: { id },
            include: {
                internship: { select: { internshipType: true } },
                field: { select: { locations: true } },
                student: { select: { userId: true } }
            }
        });

        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        if (app.student.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
        if (app.status !== 'REJECTED') return res.status(400).json({ success: false, message: 'Only rejected applications can request a location change' });
        if (app.internship.internshipType !== 'NON_STIPEND') return res.status(400).json({ success: false, message: 'Only Learning Internship applications support location reapply' });

        const fieldLocs = Array.isArray(app.field?.locations) ? app.field.locations : [];
        if (fieldLocs.length > 0 && !fieldLocs.includes(preferredLocation)) {
            return res.status(400).json({ success: false, message: `Location must be one of: ${fieldLocs.join(', ')}` });
        }
        if (preferredLocation === app.preferredLocation) {
            return res.status(400).json({ success: false, message: 'Choose a different location from your previous choice' });
        }

        const updated = await prisma.application.update({
            where: { id },
            data: { status: 'SUBMITTED', preferredLocation }
        });

        res.json({ success: true, data: updated, message: 'Application resubmitted for the new location.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Student confirms willingness to join and sets their joining/end dates
 * PUT /students/applications/:id/confirm-joining
 */
const confirmJoining = async (req, res) => {
    try {
        const { id } = req.params;
        const { joiningDate, endDate } = req.body;

        if (!joiningDate || !endDate) {
            return res.status(400).json({ success: false, message: 'joiningDate and endDate are required' });
        }

        const app = await prisma.application.findUnique({
            where: { id },
            include: { student: { select: { userId: true } } }
        });
        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        if (app.student.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        if (app.status !== 'HIRED') {
            return res.status(400).json({ success: false, message: 'Only HIRED applications can confirm joining' });
        }

        const updated = await prisma.application.update({
            where: { id },
            data: {
                joiningDate: new Date(joiningDate),
                endDate: new Date(endDate),
            }
        });

        res.json({ success: true, data: updated, message: 'Joining confirmed successfully.' });
    } catch (err) {
        console.error('Confirm joining error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    upsertProfile,
    getProfile,
    upsertStipend,
    uploadJoiningDocuments,
    reapplyLocation,
    confirmJoining,
};
