const prisma = require('../lib/prisma');

/**
 * GET /api/v1/admin/completed-internships
 * Lists internships with completionStatus = COMPLETED.
 * - PRTI / ADMIN: all departments
 * - HOD: scoped to their department only (matches Internship.department OR has a dept group of theirs)
 */
const listCompletedInternships = async (req, res) => {
    try {
        const where = { completionStatus: 'COMPLETED' };

        if (req.user.role === 'HOD' && req.user.department) {
            // HOD sees internships where their dept is the parent dept OR is a dept group
            where.OR = [
                { department: req.user.department },
                { departmentGroups: { some: { department: req.user.department } } }
            ];
        }

        const internships = await prisma.internship.findMany({
            where,
            orderBy: { completedAt: 'desc' },
            include: {
                departmentGroups: { select: { department: true } },
                _count: { select: { applications: true } }
            }
        });

        // Count certificates issued per internship
        const ids = internships.map(i => i.id);
        const certCounts = ids.length === 0 ? [] : await prisma.application.findMany({
            where: { internshipId: { in: ids } },
            select: {
                internshipId: true,
                completionStatus: true,
                _count: { select: {} }
            }
        });

        // Aggregate
        const completedByInternship = {};
        for (const a of certCounts) {
            completedByInternship[a.internshipId] = (completedByInternship[a.internshipId] || 0) + (a.completionStatus === 'COMPLETED' ? 1 : 0);
        }

        const summary = internships.map(i => ({
            id: i.id,
            title: i.title,
            department: i.department,
            duration: i.duration,
            internshipType: i.internshipType,
            internshipMode: i.internshipMode,
            completedAt: i.completedAt,
            departments: Array.from(new Set([i.department, ...i.departmentGroups.map(g => g.department)].filter(Boolean))),
            totalInterns: i._count.applications,
            completedInterns: completedByInternship[i.id] || 0
        }));

        res.json({ success: true, data: summary });
    } catch (err) {
        console.error('listCompletedInternships error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * GET /api/v1/admin/completed-internships/:id
 * Full detail for a completed internship: interns, daily logs, assignments, attendance, certificates.
 * HODs are restricted to interns of their department.
 */
const getCompletedInternshipDetail = async (req, res) => {
    try {
        const { id } = req.params;

        const internship = await prisma.internship.findUnique({
            where: { id },
            include: {
                departmentGroups: { select: { id: true, department: true, title: true } },
                completedBy: undefined  // no relation, completedById is just a string
            }
        });
        if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });
        if (internship.completionStatus !== 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Internship is not yet completed' });
        }

        // Permission guard for HOD
        if (req.user.role === 'HOD' && req.user.department) {
            const allDepts = new Set([internship.department, ...internship.departmentGroups.map(g => g.department)].filter(Boolean));
            if (!allDepts.has(req.user.department)) {
                return res.status(403).json({ success: false, message: 'Access denied' });
            }
        }

        // Build applications query — HOD limited to own dept group
        const appWhere = { internshipId: id };
        if (req.user.role === 'HOD' && req.user.department) {
            appWhere.OR = [
                { departmentGroup: { department: req.user.department } },
                { internship: { department: req.user.department } }
            ];
        }

        const applications = await prisma.application.findMany({
            where: appWhere,
            include: {
                student: {
                    include: { user: { select: { email: true } } }
                },
                attendance: true,
                workAssignments: {
                    include: { submissions: true },
                    orderBy: { createdAt: 'desc' }
                },
                workLogs: { orderBy: { date: 'desc' } },
                departmentGroup: { select: { department: true, title: true } },
                mentor: { select: { id: true, name: true, email: true } }
            }
        });

        const appIds = applications.map(a => a.id);
        const certificates = appIds.length === 0 ? [] : await prisma.certificate.findMany({
            where: { applicationId: { in: appIds } }
        });
        const certByApp = Object.fromEntries(certificates.map(c => [c.applicationId, c]));

        // Fetch finalizing mentor name
        let finalizedBy = null;
        if (internship.completedById) {
            finalizedBy = await prisma.user.findUnique({
                where: { id: internship.completedById },
                select: { id: true, name: true, email: true }
            });
        }

        const interns = applications.map(a => {
            const att = a.attendance && a.attendance.totalDays > 0
                ? Math.round((a.attendance.daysAttended / a.attendance.totalDays) * 100)
                : 0;
            return {
                applicationId: a.id,
                student: {
                    id: a.student.id,
                    fullName: a.student.fullName,
                    rollNumber: a.student.rollNumber,
                    collegeName: a.student.collegeName,
                    email: a.student.user?.email,
                    photoUrl: a.student.photoUrl
                },
                department: a.departmentGroup?.department || internship.department,
                mentor: a.mentor,
                completionStatus: a.completionStatus,
                mentorRemarks: a.mentorRemarks,
                mentorSatisfactionPercent: a.mentorSatisfactionPercent,
                attendance: {
                    daysAttended: a.attendance?.daysAttended || 0,
                    totalDays: a.attendance?.totalDays || 0,
                    percent: att,
                    lowAttendance: att < 90
                },
                assignments: a.workAssignments.map(w => ({
                    id: w.id,
                    title: w.title,
                    description: w.description,
                    dueDate: w.dueDate,
                    status: w.status,
                    submission: w.submissions[0] ? {
                        submissionDate: w.submissions[0].submissionDate,
                        status: w.submissions[0].status,
                        mentorFeedback: w.submissions[0].mentorFeedback,
                        satisfactionPercent: w.submissions[0].satisfactionPercent,
                        attachmentUrl: w.submissions[0].attachmentUrl
                    } : null
                })),
                workLogs: a.workLogs.map(l => ({
                    date: l.date,
                    description: l.description,
                    hoursWorked: l.hoursWorked
                })),
                certificate: certByApp[a.id]
                    ? {
                        id: certByApp[a.id].id,
                        fileUrl: certByApp[a.id].fileUrl,
                        issuedAt: certByApp[a.id].issuedAt,
                        attendancePercent: certByApp[a.id].attendancePercent,
                        satisfactionPercent: certByApp[a.id].satisfactionPercent
                    }
                    : null
            };
        });

        res.json({
            success: true,
            data: {
                internship: {
                    id: internship.id,
                    title: internship.title,
                    department: internship.department,
                    duration: internship.duration,
                    internshipType: internship.internshipType,
                    internshipMode: internship.internshipMode,
                    completedAt: internship.completedAt,
                    finalizedBy
                },
                interns
            }
        });
    } catch (err) {
        console.error('getCompletedInternshipDetail error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    listCompletedInternships,
    getCompletedInternshipDetail
};
