const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');
const { generateOTP, sendOTP } = require('../utils/otp');
const emailService = require('../services/email/emailService');

/**
 * @desc    Submit Internship Application (Public)
 * @route   POST /api/v1/public/apply
 * @access  Public
 */
const submitApplication = async (req, res, next) => {
    try {
        const {
            rollNumber, collegeRollNumber, fullName, phone, dob, address, aadhar,
            collegeName, collegeCode, university, degree, branch,
            yearOfStudy, cgpa, collegeCategory, nirfRanking,
            internshipId, preferredCircle, preferredLocation, sop, assignedRole, duration, startDate,
            hasExperience, hasProjects, hasCertifications,
            experienceDesc, projectsDesc, skills
        } = req.body;

        if (!rollNumber || !fullName || !aadhar || !internshipId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Find or Create Student Profile based on Aadhar (Unique ID)
        // We also need a User record for the 1:1 relation to work
        let student = await prisma.studentProfile.findUnique({
            where: { aadhar },
            include: { user: true }
        });

        const profileData = {
            fullName,
            rollNumber,
            collegeRollNumber,
            phone,
            dob: new Date(dob),
            address,
            aadhar,
            collegeName,
            collegeCode: collegeCode || null,
            university: university || 'Other',
            degree,
            branch,
            yearOfStudy: (yearOfStudy === 'PG1') ? 6 : (yearOfStudy === 'PG2' ? 7 : parseInt(yearOfStudy)),
            cgpa: parseFloat(cgpa),
            collegeCategory: collegeCategory ? collegeCategory.toUpperCase() : 'OTHER',
            nirfRanking: nirfRanking ? parseInt(nirfRanking) : null,
            hasExperience: hasExperience === 'true' || hasExperience === true,
            hasProjects: hasProjects === 'true' || hasProjects === true,
            hasCertifications: hasCertifications === 'true' || hasCertifications === true,
            experienceDesc: experienceDesc || null,
            projectsDesc: projectsDesc || null,
            skills: skills || null
        };

        if (!student) {
            // Check if a User already exists with this email (if provided) or create a dummy one
            // In a passwordless/OTP system, we might use phone/aadhar as identifier
            const email = req.body.email || `${aadhar}@aptransco.portal`; // Fallback email
            
            let user = await prisma.user.findUnique({ where: { email } });
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        email,
                        password: 'PASSWORDLESS_STUDENT', // Placeholder for OTP users
                        role: 'STUDENT'
                    }
                });
            }

            // Create new profile
            student = await prisma.studentProfile.create({
                data: {
                    ...profileData,
                    userId: user.id
                }
            });
        } else {
            // Update existing profile
            student = await prisma.studentProfile.update({
                where: { aadhar },
                data: profileData
            });
        }

        // 1.b Check if Internship is Active
        const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
        if (!internship || !internship.isActive) {
            return res.status(400).json({ success: false, message: 'This internship is no longer active and not accepting new applications.' });
        }

        // 2. Check if already applied for this specific internship
        const existingApp = await prisma.application.findUnique({
            where: {
                studentId_internshipId: {
                    studentId: student.id,
                    internshipId
                }
            }
        });

        if (existingApp) {
            return res.status(400).json({
                success: false,
                message: 'You have already applied for this internship.',
                trackingId: existingApp.trackingId
            });
        }

        // 3. Create Application with Unique Tracking ID
        const identifier = rollNumber || aadhar || 'GUEST';
        const trackingId = `APT-${Date.now()}-${identifier.slice(-4)}`.toUpperCase();

        const application = await prisma.application.create({
            data: {
                trackingId,
                studentId: student.id,
                internshipId,
                status: 'PENDING',
                preferredCircle: preferredCircle || null,
                preferredLocation: preferredLocation || null,
                sop: sop || null,
                assignedRole: assignedRole || null,
                duration: duration || null,
                startDate: startDate || null
            }
        });

        // 4. Handle File Uploads (Expect files from multer)
        if (req.files && req.files.length > 0) {
            const documents = req.files.map(file => {
                // Try to find the document label/metadata in the internship configuration
                const docMeta = (internship.requiredDocuments || []).find(d => d.id === file.fieldname);
                
                return {
                    applicationId: application.id,
                    type: docMeta ? docMeta.label : file.fieldname.toUpperCase(), // Store label or fieldname
                    url: file.path
                };
            });

            if (documents.length > 0) {
                await prisma.document.createMany({
                    data: documents
                });
            }
        }

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully!',
            trackingId: application.trackingId
        });

        // 5. Send Confirmation Email (Async)
        const recipientEmail = req.body.email || (student.user ? student.user.email : null);
        if (recipientEmail && !recipientEmail.endsWith('@aptransco.portal')) {
            emailService.sendApplicationReceived(recipientEmail, fullName).catch(err => {
                console.error(`Failed to send application confirmation email to ${recipientEmail}:`, err.message);
            });
        }

    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Track Application Status
 * @route   GET /api/v1/public/track/:trackingId
 * @access  Public
 */
const trackStatus = async (req, res, next) => {
    try {
        const { trackingId } = req.params;

        const application = await prisma.application.findUnique({
            where: { trackingId },
            include: {
                student: true,
                internship: {
                    select: { title: true, department: true }
                }
            }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found. Please check your tracking ID.' });
        }

        res.status(200).json({ success: true, data: application });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Active Internships (Public)
 * @route   GET /api/v1/public/internships
 * @access  Public
 */
const getPublicInternships = async (req, res, next) => {
    try {
        const internships = await prisma.internship.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: internships });
    } catch (error) {
        next(error);
    }
};

const generateOtp = async (req, res, next) => {
    try {
        const { rollNumber, email, phone } = req.body;
        if (!rollNumber) {
            return res.status(400).json({ success: false, message: 'Roll Number is required.' });
        }

        const destination = email || phone || 'User';
        const otp = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await prisma.otpVerification.upsert({
            where: { rollNumber },
            update: { otp, expiresAt },
            create: { rollNumber, otp, expiresAt }
        });

        await sendOTP(destination, otp);
        res.status(200).json({ success: true, message: 'OTP sent successfully.' });
    } catch (error) {
        next(error);
    }
};

const verifyOtp = async (req, res, next) => {
    try {
        const { rollNumber, otp } = req.body;
        if (!rollNumber || !otp) {
            return res.status(400).json({ success: false, message: 'Roll Number and OTP are required.' });
        }

        const record = await prisma.otpVerification.findUnique({
            where: { rollNumber }
        });

        if (!record || record.otp !== otp || record.expiresAt < new Date()) {
            return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
        }

        await prisma.otpVerification.delete({ where: { rollNumber } });
        res.status(200).json({ success: true, message: 'OTP verified successfully.' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    submitApplication,
    trackStatus,
    getPublicInternships,
    generateOtp,
    verifyOtp
};
