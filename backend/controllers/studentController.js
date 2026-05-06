const prisma = require('../lib/prisma');

const crypto = require('crypto');

/**
 * @desc    Create or Update Student Profile
 * @route   POST /api/v1/students/profile
 * @access  Private (Student)
 */
const upsertProfile = async (req, res) => {
    try {
        console.log('>>> Profile update payload:', JSON.stringify(req.body, null, 2));
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
            experienceDesc, projectsDesc, skills, photoUrl,
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
                        mentor: { select: { name: true, email: true } },
                        attendance: true
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
            if (['HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'].includes(app.status) && !app.attendance) {
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
 * @desc    Apply for a Non-Monetary Fallback Internship
 * @route   POST /api/v1/students/applications/:id/fallback
 * @access  Private (Student)
 */
const applyFallback = async (req, res) => {
    try {
        const applicationId = req.params.id;

        // Verify the original application exists, belongs to the student, is rejected, and was collaborative
        const originalApp = await prisma.application.findFirst({
            where: { 
                id: applicationId, 
                student: { userId: req.user.id },
                status: 'REJECTED',
                internship: { stipendType: 'COLLABORATIVE' }
            },
            include: { internship: true }
        });

        if (!originalApp) {
            return res.status(400).json({ success: false, message: 'Invalid or ineligible application for fallback' });
        }

        // Find an active non-collaborative internship in the same department
        const fallbackInternship = await prisma.internship.findFirst({
            where: {
                department: originalApp.internship.department,
                stipendType: 'NON_COLLABORATIVE',
                isActive: true
            },
            orderBy: { createdAt: 'desc' }
        });

        if (!fallbackInternship) {
            return res.status(404).json({ success: false, message: 'No active non-monetary internships available in this department.' });
        }

        // Check if student already applied for this fallback internship
        const existingFallback = await prisma.application.findFirst({
            where: {
                studentId: originalApp.studentId,
                internshipId: fallbackInternship.id
            }
        });

        if (existingFallback) {
            return res.status(400).json({ success: false, message: 'You have already applied for the non-monetary internship.' });
        }

        // Mark the original app to indicate fallback was applied (optional, using category or similar if schema doesn't have a flag)
        // Since we don't have a fallbackApplied flag, we can store it in questionAnswers or just rely on the existence of the new application.
        
        // Create the new application
        const crypto = require('crypto');
        const trackingId = 'FLB-' + crypto.randomBytes(4).toString('hex').toUpperCase();

        const newApp = await prisma.application.create({
            data: {
                trackingId,
                studentId: originalApp.studentId,
                internshipId: fallbackInternship.id,
                status: 'SUBMITTED',
                category: 'OTHER', // Flag it if needed
                shortlistCategory: 'FALLBACK'
            }
        });

        res.status(201).json({ success: true, data: newApp, message: 'Fallback application submitted successfully.' });

    } catch (error) {
        console.error('Fallback application error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    upsertProfile,
    getProfile,
    upsertStipend,
    applyFallback
};
