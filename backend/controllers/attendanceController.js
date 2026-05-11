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
 * Bulk mark attendance for a single date (Multiple Interns)
 * POST /api/v1/mentor/attendance/bulk
 */
const bulkMarkAttendance = async (req, res) => {
    try {
        const { date, entries } = req.body;
        const mentorId = req.user.id;
        const userRole = req.user.role;

        if (!entries || !Array.isArray(entries)) {
            return res.status(400).json({ success: false, message: 'Invalid entries' });
        }

        const applicationIds = entries.map(e => e.applicationId);

        // Verify ownership/auth for all applications
        const applications = await prisma.application.findMany({
            where: { id: { in: applicationIds } }
        });

        const authorized = applications.every(app => 
            app.mentorId === mentorId || userRole === 'ADMIN'
        );

        if (!authorized) {
            return res.status(403).json({ 
                success: false, 
                message: 'Not authorized to mark attendance for some selected interns' 
            });
        }

        // Process all entries
        const results = await Promise.all(entries.map(async (entry) => {
            const { applicationId, present, hours } = entry;
            
            const app = await prisma.application.findUnique({
                where: { id: applicationId },
                include: { attendance: true }
            });

            let attendanceLog = app.attendance?.attendanceLog || [];
            const existingIndex = attendanceLog.findIndex(log => log.date === date);

            const logEntry = { 
                date, 
                present, 
                hours: hours || 8, 
                markedAt: new Date().toISOString() 
            };

            if (existingIndex >= 0) {
                attendanceLog[existingIndex] = logEntry;
            } else {
                attendanceLog.push(logEntry);
            }

            const daysAttended = attendanceLog.filter(log => log.present).length;
            const totalDays = attendanceLog.length;
            const minimumDays = app.attendance?.minimumDays || 20;
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
