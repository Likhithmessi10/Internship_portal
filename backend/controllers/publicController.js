const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Submit Internship Application (Public)
 * @route   POST /api/v1/public/apply
 * @access  Public
 */
const submitApplication = async (req, res) => {
    try {
        const {
            rollNumber, fullName, phone, dob, address, aadhar,
            collegeName, collegeCode, university, degree, branch,
            yearOfStudy, cgpa, collegeCategory, nirfRanking,
            internshipId, preferredCircle, duration, startDate,
            hasExperience, hasProjects, hasCertifications,
            experienceDesc, projectsDesc, skills
        } = req.body;

        if (!rollNumber || !fullName || !aadhar || !internshipId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Find or Create Student Profile based on Roll Number
        let student = await prisma.studentProfile.findUnique({
            where: { rollNumber }
        });

        const profileData = {
            fullName,
            phone,
            dob: new Date(dob),
            address,
            aadhar,
            collegeName,
            collegeCode: collegeCode || null,
            university: university || 'Other',
            degree,
            branch,
            yearOfStudy: parseInt(yearOfStudy),
            cgpa: parseFloat(cgpa),
            collegeCategory,
            nirfRanking: nirfRanking ? parseInt(nirfRanking) : null,
            hasExperience: hasExperience === 'true' || hasExperience === true,
            hasProjects: hasProjects === 'true' || hasProjects === true,
            hasCertifications: hasCertifications === 'true' || hasCertifications === true,
            experienceDesc: experienceDesc || null,
            projectsDesc: projectsDesc || null,
            skills: skills || null
        };

        if (student) {
            // Update existing profile
            student = await prisma.studentProfile.update({
                where: { rollNumber },
                data: profileData
            });
        } else {
            // Create new profile
            student = await prisma.studentProfile.create({
                data: {
                    ...profileData,
                    rollNumber
                }
            });
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
        const trackingId = `APT-${Date.now()}-${rollNumber.slice(-4)}`.toUpperCase();

        const application = await prisma.application.create({
            data: {
                trackingId,
                studentId: student.id,
                internshipId,
                status: 'PENDING',
                preferredCircle: preferredCircle || null,
                duration: duration || null,
                startDate: startDate || null
            }
        });

        // 4. Handle File Uploads (Expect files from multer)
        if (req.files && req.files.length > 0) {
            const documents = req.files.map(file => {
                let type = 'RESUME';
                if (file.fieldname === 'principalLetter') type = 'PRINCIPAL_LETTER';
                if (file.fieldname === 'hodLetter') type = 'HOD_LETTER';
                if (file.fieldname === 'nocLetter') type = 'NOC_LETTER';
                if (file.fieldname === 'marksheet') type = 'MARKSHEET';

                return {
                    applicationId: application.id,
                    type,
                    url: file.path
                };
            });

            await prisma.document.createMany({
                data: documents
            });
        }

        res.status(201).json({
            success: true,
            message: 'Application submitted successfully!',
            trackingId: application.trackingId
        });

    } catch (error) {
        console.error('Submit Error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Duplicate entry detected (Roll Number or Aadhaar).' });
        }
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

/**
 * @desc    Track Application Status
 * @route   GET /api/v1/public/track/:trackingId
 * @access  Public
 */
const trackStatus = async (req, res) => {
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
        console.error('Track Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Active Internships (Public)
 * @route   GET /api/v1/public/internships
 * @access  Public
 */
const getPublicInternships = async (req, res) => {
    try {
        const internships = await prisma.internship.findMany({
            where: { isActive: true },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: internships });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    submitApplication,
    trackStatus,
    getPublicInternships
};
