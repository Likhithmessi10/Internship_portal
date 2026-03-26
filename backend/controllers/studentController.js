const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const crypto = require('crypto');

/**
 * @desc    Create or Update Student Profile
 * @route   POST /api/v1/students/profile
 * @access  Private (Student)
 */
const upsertProfile = async (req, res) => {
    try {
        console.log('>>> UPSERT PROFILE REQUEST:', req.body);
        let {
            fullName, collegeRollNumber, phone, dob, address, aadhar,
            collegeName, university, degree, branch,
            yearOfStudy, cgpa, collegeCategory, nirfRanking,
            hasExperience, hasProjects, hasCertifications,
            experienceDesc, projectsDesc, skills, photoUrl
        } = req.body;

        const userId = req.user.id;

        // Ensure user is a student
        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ success: false, message: 'Only students can manage student profiles' });
        }

        const allowedCategories = ['IIT', 'NIT', 'IIIT', 'CENTRAL', 'STATE_UNIV', 'DEEMED', 'AUTONOMOUS', 'COLLEGE', 'INSTITUTE', 'OTHER'];
        const validatedCategory = allowedCategories.includes(collegeCategory) ? collegeCategory : 'OTHER';

        const parsedCgpa = parseFloat(cgpa) || 0.0;
        if (parsedCgpa > 10) {
            return res.status(400).json({ success: false, message: 'CGPA cannot be greater than 10.0' });
        }

        const profileData = {
            fullName,
            collegeRollNumber,
            phone,
            dob: new Date(dob),
            address,
            aadhar,
            collegeName,
            university,
            degree,
            branch,
            yearOfStudy: parseInt(yearOfStudy) || 1,
            cgpa: parsedCgpa,
            collegeCategory: validatedCategory,
            nirfRanking: (nirfRanking && !isNaN(parseInt(nirfRanking))) ? parseInt(nirfRanking) : null,
            hasExperience: hasExperience === true || hasExperience === 'true',
            hasProjects: hasProjects === true || hasProjects === 'true',
            hasCertifications: hasCertifications === true || hasCertifications === 'true',
            experienceDesc: experienceDesc || null,
            projectsDesc: projectsDesc || null,
            skills: skills || null,
            photoUrl: photoUrl || null
        };

        const profile = await prisma.studentProfile.upsert({
            where: { userId },
            update: profileData,
            create: {
                ...profileData,
                userId
            }
        });

        console.log('>>> UPSERT SUCCESS! Profile Roll Number:', profile.rollNumber);
        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error('>>> UPSERT ERROR:', error);

        // Handle unique constraint violations with specifics
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Aadhar or Roll Number';
            return res.status(400).json({ 
                success: false, 
                message: `Setup failed: A student with this ${field} already exists in the system.`
            });
        }

        res.status(500).json({ success: false, message: 'Server Error' });
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
                        stipend: true
                    }
                } 
            }
        });

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
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
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    upsertProfile,
    getProfile,
    upsertStipend
};
