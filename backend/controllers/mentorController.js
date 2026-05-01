const prisma = require('../lib/prisma');

/**
 * GET /api/v1/mentor/internships
 * Returns all internships the mentor is assigned to, with intern counts and stats.
 */
const getMentorInternships = async (req, res) => {
    try {
        const mentorId = req.user.id;

        // Get all applications assigned to this mentor with HIRED+ statuses
        const applications = await prisma.application.findMany({
            where: {
                mentorId,
                status: { in: ['HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'] }
            },
            include: {
                internship: {
                    select: {
                        id: true,
                        title: true,
                        department: true,
                        isActive: true,
                        duration: true,
                        location: true,
                        applicationDeadline: true,
                        createdAt: true
                    }
                },
                attendance: true
            }
        });

        // Group by internship
        const internshipMap = {};
        for (const app of applications) {
            const intId = app.internshipId;
            if (!internshipMap[intId]) {
                internshipMap[intId] = {
                    ...app.internship,
                    internCount: 0,
                    activeCount: 0,
                    completedCount: 0,
                    avgAttendance: 0,
                    totalAttendancePct: 0
                };
            }
            internshipMap[intId].internCount++;
            if (['HIRED', 'APPROVED', 'ONGOING'].includes(app.status)) {
                internshipMap[intId].activeCount++;
            }
            if (app.status === 'COMPLETED') {
                internshipMap[intId].completedCount++;
            }
            if (app.attendance && app.attendance.totalDays > 0) {
                internshipMap[intId].totalAttendancePct +=
                    Math.round((app.attendance.daysAttended / app.attendance.totalDays) * 100);
            }
        }

        // Calculate averages
        const internships = Object.values(internshipMap).map(i => ({
            ...i,
            avgAttendance: i.internCount > 0 ? Math.round(i.totalAttendancePct / i.internCount) : 0,
            status: i.isActive ? 'ACTIVE' : 'COMPLETED'
        }));

        res.status(200).json({ success: true, data: internships });
    } catch (error) {
        console.error('getMentorInternships error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/v1/mentor/internships/:id/interns
 * Returns detailed intern list for a specific internship.
 */
const getInternshipInterns = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { id: internshipId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [interns, total] = await Promise.all([
            prisma.application.findMany({
                where: {
                    mentorId,
                    internshipId,
                    status: { in: ['HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'] }
                },
                skip,
                take: limit,
                include: {
                    student: {
                        include: {
                            user: { select: { email: true, name: true } }
                        }
                    },
                    internship: { select: { title: true, department: true } },
                    attendance: true,
                    workAssignments: {
                        orderBy: { createdAt: 'desc' },
                        include: {
                            submissions: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.application.count({
                where: {
                    mentorId,
                    internshipId,
                    status: { in: ['HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'] }
                }
            })
        ]);

        // Enrich with progress info
        const enriched = interns.map(intern => {
            const totalTasks = intern.workAssignments.length;
            const completedTasks = intern.workAssignments.filter(
                w => w.status === 'COMPLETED' || w.submissions.length > 0
            ).length;
            const attendancePct = intern.attendance && intern.attendance.totalDays > 0
                ? Math.round((intern.attendance.daysAttended / intern.attendance.totalDays) * 100)
                : 0;

            return {
                ...intern,
                progress: {
                    totalTasks,
                    completedTasks,
                    progressPct: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
                    attendancePct
                }
            };
        });

        res.status(200).json({
            success: true,
            data: enriched,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('getInternshipInterns error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/v1/mentor/tasks
 * Create a task and assign to specific interns or all interns in an internship.
 * Body: { internshipId, title, description, deadline, studentIds?: string[] }
 * If studentIds is omitted/empty, assigns to ALL interns in that internship.
 */
const createTask = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { internshipId, title, description, deadline, studentIds } = req.body;

        if (!internshipId || !title || !description) {
            return res.status(400).json({ success: false, message: 'internshipId, title, and description are required' });
        }

        // Get target applications
        const whereClause = {
            mentorId,
            internshipId,
            status: { in: ['HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'] }
        };

        // If specific students selected, filter further
        if (studentIds && studentIds.length > 0) {
            whereClause.studentId = { in: studentIds };
        }

        const applications = await prisma.application.findMany({
            where: whereClause,
            select: { id: true, studentId: true }
        });

        if (applications.length === 0) {
            return res.status(404).json({ success: false, message: 'No matching interns found' });
        }

        // Bulk create work assignments
        const assignments = await Promise.all(
            applications.map(app =>
                prisma.workAssignment.create({
                    data: {
                        applicationId: app.id,
                        mentorId,
                        studentId: app.studentId,
                        title,
                        description,
                        dueDate: deadline ? new Date(deadline) : null,
                        status: 'PENDING'
                    }
                })
            )
        );

        res.status(201).json({
            success: true,
            message: `Task assigned to ${assignments.length} intern(s)`,
            data: assignments
        });
    } catch (error) {
        console.error('createTask error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/v1/mentor/tasks?internshipId=xxx
 * Get all tasks created by this mentor, optionally filtered by internship.
 */
const getTasks = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { internshipId } = req.query;

        const whereClause = { mentorId };
        if (internshipId) {
            whereClause.application = { internshipId };
        }

        const tasks = await prisma.workAssignment.findMany({
            where: whereClause,
            include: {
                student: { select: { fullName: true, collegeName: true } },
                submissions: true,
                application: {
                    select: {
                        internship: { select: { title: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, data: tasks });
    } catch (error) {
        console.error('getTasks error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/v1/mentor/submissions?internshipId=xxx&status=xxx
 * Get all submissions for mentor's work assignments, with filters.
 */
const getSubmissions = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { internshipId, status } = req.query;

        // First get all assignment IDs for this mentor
        const assignmentWhere = { mentorId };
        if (internshipId) {
            assignmentWhere.application = { internshipId };
        }

        const mentorAssignments = await prisma.workAssignment.findMany({
            where: assignmentWhere,
            select: { id: true }
        });

        const assignmentIds = mentorAssignments.map(a => a.id);

        const submissionWhere = { workAssignmentId: { in: assignmentIds } };
        if (status) {
            submissionWhere.status = status;
        }

        const submissions = await prisma.taskSubmission.findMany({
            where: submissionWhere,
            include: {
                workAssignment: {
                    include: {
                        student: { select: { fullName: true, rollNumber: true, photoUrl: true, collegeName: true } },
                        application: {
                            include: {
                                internship: { select: { title: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { submissionDate: 'desc' }
        });

        res.status(200).json({ success: true, data: submissions });
    } catch (error) {
        console.error('getSubmissions error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * PUT /api/v1/mentor/submissions/:id/review
 * Approve/reject and rate a submission.
 */
const reviewSubmission = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { id: submissionId } = req.params;
        const { mentorFeedback, mentorRating, status } = req.body;

        const submission = await prisma.taskSubmission.findUnique({
            where: { id: submissionId },
            include: {
                workAssignment: {
                    include: { application: true }
                }
            }
        });

        if (!submission) {
            return res.status(404).json({ success: false, message: 'Submission not found' });
        }

        if (submission.workAssignment.application.mentorId !== mentorId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized to review this submission' });
        }

        const updated = await prisma.taskSubmission.update({
            where: { id: submissionId },
            data: {
                mentorFeedback,
                mentorRating: mentorRating ? parseInt(mentorRating) : null,
                status: status || 'REVIEWED',
                reviewedAt: new Date(),
                reviewedBy: mentorId
            }
        });

        // If revision requested, reset assignment
        if (status === 'REVISION_REQUESTED') {
            await prisma.workAssignment.update({
                where: { id: submission.workAssignmentId },
                data: { status: 'PENDING' }
            });
        }

        res.status(200).json({ success: true, data: updated, message: 'Submission reviewed successfully' });
    } catch (error) {
        console.error('reviewSubmission error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/v1/mentor/attendance
 * Mark daily attendance for an intern.
 */
const markAttendance = async (req, res) => {
    try {
        const { applicationId, date, present, hours } = req.body;
        const mentorId = req.user.id;

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { attendance: true }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        if (application.mentorId !== mentorId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        let attendanceLog = application.attendance?.attendanceLog || [];
        const existingIndex = attendanceLog.findIndex(log => log.date === date);

        if (existingIndex >= 0) {
            attendanceLog[existingIndex] = { date, present, hours: hours || 8, markedAt: new Date().toISOString() };
        } else {
            attendanceLog.push({ date, present, hours: hours || 8, markedAt: new Date().toISOString() });
        }

        const daysAttended = attendanceLog.filter(log => log.present).length;
        const totalDays = attendanceLog.length;
        const minimumDays = application.attendance?.minimumDays || 20;
        const meetsMinimum = daysAttended >= minimumDays;

        const updated = await prisma.attendance.upsert({
            where: { applicationId },
            create: { applicationId, daysAttended, totalDays, attendanceLog, meetsMinimum, minimumDays },
            update: { daysAttended, totalDays, attendanceLog, meetsMinimum }
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('markAttendance error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/v1/mentor/attendance/bulk
 * Bulk mark attendance for multiple interns on the same date.
 */
const bulkMarkAttendance = async (req, res) => {
    try {
        const { entries } = req.body; // [{applicationId, present}]
        const { date } = req.body;
        const mentorId = req.user.id;

        if (!entries || !date) {
            return res.status(400).json({ success: false, message: 'entries and date are required' });
        }

        const results = await Promise.all(
            entries.map(async ({ applicationId, present }) => {
                const application = await prisma.application.findUnique({
                    where: { id: applicationId },
                    include: { attendance: true }
                });

                if (!application || (application.mentorId !== mentorId && req.user.role !== 'ADMIN')) {
                    return null;
                }

                let attendanceLog = application.attendance?.attendanceLog || [];
                const existingIndex = attendanceLog.findIndex(log => log.date === date);

                if (existingIndex >= 0) {
                    attendanceLog[existingIndex] = { date, present, hours: 8, markedAt: new Date().toISOString() };
                } else {
                    attendanceLog.push({ date, present, hours: 8, markedAt: new Date().toISOString() });
                }

                const daysAttended = attendanceLog.filter(log => log.present).length;
                const totalDays = attendanceLog.length;
                const minimumDays = application.attendance?.minimumDays || 20;

                return prisma.attendance.upsert({
                    where: { applicationId },
                    create: { applicationId, daysAttended, totalDays, attendanceLog, meetsMinimum: daysAttended >= minimumDays, minimumDays },
                    update: { daysAttended, totalDays, attendanceLog, meetsMinimum: daysAttended >= minimumDays }
                });
            })
        );

        const successful = results.filter(Boolean);
        res.status(200).json({
            success: true,
            message: `Attendance marked for ${successful.length} intern(s)`,
            data: successful
        });
    } catch (error) {
        console.error('bulkMarkAttendance error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/v1/mentor/attendance?internshipId=xxx
 * Get attendance records for mentor's interns.
 */
const getAttendance = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { internshipId, applicationId } = req.query;

        if (applicationId) {
            const attendance = await prisma.attendance.findUnique({
                where: { applicationId },
                include: {
                    application: {
                        include: {
                            student: { select: { fullName: true, rollNumber: true, photoUrl: true } },
                            internship: { select: { title: true } }
                        }
                    }
                }
            });
            return res.status(200).json({ success: true, data: attendance });
        }

        const whereClause = { application: { mentorId } };
        if (internshipId) {
            whereClause.application.internshipId = internshipId;
        }

        const attendances = await prisma.attendance.findMany({
            where: whereClause,
            include: {
                application: {
                    include: {
                        student: { select: { fullName: true, rollNumber: true, photoUrl: true } },
                        internship: { select: { title: true } }
                    }
                }
            }
        });

        res.status(200).json({ success: true, data: attendances });
    } catch (error) {
        console.error('getAttendance error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getMentorInternships,
    getInternshipInterns,
    createTask,
    getTasks,
    getSubmissions,
    reviewSubmission,
    markAttendance,
    bulkMarkAttendance,
    getAttendance
};
