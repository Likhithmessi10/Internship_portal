const prisma = require('../lib/prisma');

/**
 * Mark attendance for an intern
 * POST /api/v1/admin/attendance/mark
 */
const markAttendance = async (req, res) => {
    try {
        const { applicationId, date, present, hours } = req.body;
        const mentorId = req.user.id;

        // Verify mentor owns this application
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

        // Check if user is mentor or admin
        if (application.mentorId !== mentorId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to mark attendance for this intern' 
            });
        }

        // Create or update attendance log
        let attendanceLog = application.attendance?.attendanceLog || [];
        const existingIndex = attendanceLog.findIndex(log => log.date === date);

        if (existingIndex >= 0) {
            attendanceLog[existingIndex] = { 
                date, 
                present, 
                hours: hours || 8, 
                markedAt: new Date().toISOString() 
            };
        } else {
            attendanceLog.push({ 
                date, 
                present, 
                hours: hours || 8, 
                markedAt: new Date().toISOString() 
            });
        }

        // Calculate totals
        const daysAttended = attendanceLog.filter(log => log.present).length;
        const totalDays = attendanceLog.length;
        const minimumDays = application.attendance?.minimumDays || 20;
        const meetsMinimum = daysAttended >= minimumDays;

        const updatedAttendance = await prisma.attendance.upsert({
            where: { applicationId },
            create: {
                applicationId,
                daysAttended,
                totalDays,
                attendanceLog,
                meetsMinimum,
                minimumDays
            },
            update: {
                daysAttended,
                totalDays,
                attendanceLog,
                meetsMinimum
            }
        });

        res.status(200).json({
            success: true,
            data: updatedAttendance
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get attendance for mentor's interns
 * GET /api/v1/admin/attendance
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

        // Get all attendance based on user role
        let whereClause = {};
        
        if (userRole === 'MENTOR') {
            whereClause = { application: { mentorId: userId } };
        } else if (userRole === 'STUDENT') {
            // Student can view their own attendance
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
        // ADMIN can see all - no where clause filter

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
 * Bulk mark attendance for a date range
 * POST /api/v1/admin/attendance/bulk
 */
const bulkMarkAttendance = async (req, res) => {
    try {
        const { applicationIds, startDate, endDate, present, hours } = req.body;
        const mentorId = req.user.id;
        const userRole = req.user.role;

        // Verify ownership for all applications
        const applications = await prisma.application.findMany({
            where: {
                id: { in: applicationIds }
            }
        });

        // Check authorization
        const authorized = applications.every(app => 
            app.mentorId === mentorId || userRole === 'ADMIN'
        );

        if (!authorized) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to mark attendance for some selected interns' 
            });
        }

        // Generate date range
        const dateRange = [];
        let currentDate = new Date(startDate);
        const end = new Date(endDate);
        
        while (currentDate <= end) {
            dateRange.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // Update each application
        const results = await Promise.all(applicationIds.map(async (applicationId) => {
            const application = await prisma.application.findUnique({
                where: { id: applicationId },
                include: { attendance: true }
            });

            let attendanceLog = application.attendance?.attendanceLog || [];
            
            dateRange.forEach(date => {
                const existingIndex = attendanceLog.findIndex(log => log.date === date);
                if (existingIndex >= 0) {
                    attendanceLog[existingIndex] = { date, present, hours: hours || 8, markedAt: new Date().toISOString() };
                } else {
                    attendanceLog.push({ date, present, hours: hours || 8, markedAt: new Date().toISOString() });
                }
            });

            const daysAttended = attendanceLog.filter(log => log.present).length;
            const totalDays = attendanceLog.length;
            const minimumDays = application.attendance?.minimumDays || 20;
            const meetsMinimum = daysAttended >= minimumDays;

            return prisma.attendance.upsert({
                where: { applicationId },
                create: {
                    applicationId,
                    daysAttended,
                    totalDays,
                    attendanceLog,
                    meetsMinimum,
                    minimumDays
                },
                update: {
                    daysAttended,
                    totalDays,
                    attendanceLog,
                    meetsMinimum
                }
            });
        }));

        res.status(200).json({
            success: true,
            message: `Attendance marked for ${results.length} interns`,
            data: results
        });
    } catch (error) {
        console.error('Bulk mark attendance error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    markAttendance,
    getAttendance,
    bulkMarkAttendance
};
