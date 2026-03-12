const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * @desc    Create or Update Student Profile
 * @route   POST /api/v1/students/profile
 * @access  Private (Student)
 */
const upsertProfile = async (req, res) => {
    try {
        const {
            fullName, phone, dob, address, aadhar,
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

        const profileData = {
            fullName,
            phone,
            dob: new Date(dob),
            address,
            aadhar,
            collegeName,
            university,
            degree,
            branch,
            yearOfStudy: parseInt(yearOfStudy),
            cgpa: parseFloat(cgpa),
            collegeCategory,
            nirfRanking: nirfRanking ? parseInt(nirfRanking) : null,
            hasExperience: hasExperience || false,
            hasProjects: hasProjects || false,
            hasCertifications: hasCertifications || false,
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
                userId,
                rollNumber: `APT-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`
            }
        });

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error(error);

        // Handle unique constraint violations
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'Profile with this Aadhar already exists or duplicate constraint violated.' });
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
                        internship: true
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

module.exports = {
    upsertProfile,
    getProfile
};
