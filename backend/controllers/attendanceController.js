const prisma = require('../lib/prisma');

/**
 * Mark/Upload simplified attendance for an intern
 * POST /api/v1/mentor/attendance
 */
const markAttendance = async (req, res) => {
    try {
        const { applicationId, daysAttended: daysAttendedStr, totalDays: totalDaysStr } = req.body;
        const mentorId = req.user.id;

        if (!applicationId || daysAttendedStr === undefined || totalDaysStr === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'applicationId, daysAttended, and totalDays are required' 
            });
        }

        const daysAttended = parseInt(daysAttendedStr);
        const totalDays = parseInt(totalDaysStr);

        if (isNaN(daysAttended) || isNaN(totalDays) || totalDays <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid values for daysAttended or totalDays. They must be positive numbers.' 
            });
        }

        if (daysAttended > totalDays) {
            return res.status(400).json({ 
                success: false, 
                message: 'Days attended cannot exceed total working days.' 
            });
        }

        // Verify application
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { attendance: true }
        });

        if (!application) {
            return res.status(404).json({ 
                success: false, 
                message: 'Application not found' 
            });
        }

        // Check authorization (Mentor or Admin)
        if (application.mentorId !== mentorId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to mark attendance for this intern' 
            });
        }

        let fileUrl = application.attendance?.fileUrl || null;
        let fileName = application.attendance?.fileName || null;

        if (req.file) {
            fileUrl = `uploads/${req.file.filename}`;
            fileName = req.file.originalname;
        }

        // Require at least one uploaded file to be present
        if (!fileUrl && !req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Attendance sheet file is required (PDF, Excel, or Image).' 
            });
        }

        // Calculate percentage (Requirement: meets minimum at >= 90%)
        const percentage = (daysAttended / totalDays) * 100;
        const meetsMinimum = percentage >= 90;

        const updatedAttendance = await prisma.attendance.upsert({
            where: { applicationId },
            create: {
                applicationId,
                daysAttended,
                totalDays,
                meetsMinimum,
                fileUrl,
                fileName,
                minimumDays: Math.ceil(totalDays * 0.9) // store 90% of total days as minimumDays
            },
            update: {
                daysAttended,
                totalDays,
                meetsMinimum,
                fileUrl,
                fileName,
                minimumDays: Math.ceil(totalDays * 0.9)
            }
        });

        res.status(200).json({
            success: true,
            data: updatedAttendance,
            message: 'Attendance uploaded and updated successfully!'
        });
    } catch (error) {
        console.error('Upload attendance error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get attendance details
 * GET /api/v1/mentor/attendance
 */
const getAttendance = async (req, res) => {
    try {
        const { applicationId } = req.query;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (applicationId) {
            const attendance = await prisma.attendance.findUnique({
                where: { applicationId },
                include: {
                    application: {
                        include: {
                            student: {
                                select: {
                                    fullName: true,
                                    rollNumber: true,
                                    photoUrl: true
                                }
                            },
                            internship: {
                                select: {
                                    title: true
                                }
                            }
                        }
                    }
                }
            });

            return res.status(200).json({ success: true, data: attendance });
        }

        // Get all attendance records based on user role
        let whereClause = {};
        
        if (userRole === 'MENTOR') {
            whereClause = { application: { mentorId: userId } };
        } else if (userRole === 'STUDENT') {
            const studentProfile = await prisma.studentProfile.findUnique({
                where: { userId },
                include: { applications: true }
            });
            
            if (!studentProfile) {
                return res.status(404).json({ success: false, message: 'Student profile not found' });
            }
            
            const applicationIds = studentProfile.applications.map(app => app.id);
            whereClause = { applicationId: { in: applicationIds } };
        }

        const attendances = await prisma.attendance.findMany({
            where: whereClause,
            include: {
                application: {
                    include: {
                        student: {
                            select: {
                                fullName: true,
                                rollNumber: true,
                                photoUrl: true
                            }
                        },
                        internship: {
                            select: {
                                title: true
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({ success: true, data: attendances });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Legacy Bulk Mark Attendance (Kept as placeholder stub to prevent route breakages)
 */
const bulkMarkAttendance = async (req, res) => {
    return res.status(501).json({
        success: false,
        message: 'Bulk mark is deprecated. Please upload attendance sheet per student.'
    });
};

module.exports = {
    markAttendance,
    getAttendance,
    bulkMarkAttendance
};
