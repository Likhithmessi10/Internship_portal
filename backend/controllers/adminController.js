const { PrismaClient } = require('@prisma/client');
const prisma = require('../lib/prisma');
const emailService = require('../services/email/emailService');
const xl = require('exceljs');
const { allocateApplicants } = require('../services/allocationService');
const { createAuditLog } = require('../utils/auditLogger');
const { notifyMentorAssignment, notifyWorkAssignment } = require('../services/mailService');
const { transitionApplicationStatus } = require('../services/applicationWorkflowService');


const internshipService = require('../services/internshipService');
const applicationService = require('../services/applicationService');

/**
 * @desc    Create Internship
 */
const createInternship = async (req, res, next) => {
    try {
        const internship = await internshipService.createInternship(req.body, req.user);
        res.status(201).json({ success: true, data: internship });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get All Internships
 */
const getAllInternships = async (req, res, next) => {
    try {
        const result = await internshipService.getAllInternships({
            page: parseInt(req.query.page),
            limit: parseInt(req.query.limit)
        }, req.user);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Delete Internship
 */
const deleteInternship = async (req, res, next) => {
    try {
        await internshipService.deleteInternship(req.params.id, req.user);
        res.status(200).json({ success: true, message: 'Internship deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Toggle Internship Active Status
 */
const toggleInternship = async (req, res, next) => {
    try {
        const updated = await internshipService.toggleInternship(req.params.id, req.user);
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get All Applications for Internship
 */
const getApplications = async (req, res, next) => {
    try {
        const result = await applicationService.getApplications(req.params.id, {
            page: parseInt(req.query.page),
            limit: parseInt(req.query.limit)
        }, req.user);
        res.status(200).json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Run automated shortlisting for internship
 */
const runShortlistingAction = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { enqueueJob } = require('../services/jobService');
        const job = await enqueueJob(
            'BATCH_SHORTLIST', 
            { 
                internshipId: id,
                triggeredBy: { email: req.user.email, role: req.user.role }
            },
            `shortlist_${id}`
        );
        
        await createAuditLog('RUN_SHORTLISTING', req.user.email, `Enqueued auto-shortlisting for internship ${id}`, id);
        
        res.status(202).json({ 
            success: true, 
            message: 'Shortlisting process started in the background.',
            jobId: job.id
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get All Rejected Applications
 */
const getRejectedApplications = async (req, res, next) => {
    try {
        const applications = await prisma.application.findMany({
            where: { status: 'REJECTED' },
            include: {
                student: true,
                internship: { select: { title: true, department: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Manually Update Application Status
 */
const updateApplicationStatus = async (req, res, next) => {
    try {
        const result = await applicationService.updateApplication(req.params.id, req.body, req.user);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        next(error);
    }
};

const userService = require('../services/userService');
const workService = require('../services/workService');

/**
 * @desc    Get Users by Role
 */
const getUsersByRole = async (req, res, next) => {
    try {
        const users = await userService.getUsersByRole(req.query, req.user);
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update User Role
 */
const updateUserRole = async (req, res, next) => {
    try {
        const updated = await userService.updateUserRole(req.params.id, req.body.role, req.user);
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Assign Work to Intern
 */
const assignWork = async (req, res, next) => {
    try {
        const work = await workService.assignWork(req.body, req.user);
        res.status(201).json({ success: true, data: work });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Work Assignments
 */
const getWorkAssignments = async (req, res, next) => {
    try {
        const assignments = await workService.getWorkAssignments(req.query, req.user);
        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Export applications to Excel
 */
const exportApplications = async (req, res, next) => {
    try {
        const internshipId = req.params.id;
        const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
        const applications = await prisma.application.findMany({
            where: { internshipId },
            include: { student: { include: { user: true } }, documents: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!internship) throw new NotFoundError('Internship not found');

        const workbook = new xl.Workbook();
        const worksheet = workbook.addWorksheet('Applications');
        worksheet.columns = [
            { header: '#', key: 'no', width: 5 },
            { header: 'Tracking ID', key: 'trackingId', width: 22 },
            { header: 'Full Name', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'College', key: 'college', width: 40 },
            { header: 'Branch', key: 'branch', width: 20 },
            { header: 'Year', key: 'year', width: 8 },
            { header: 'CGPA', key: 'cgpa', width: 8 },
            { header: 'Status', key: 'status', width: 20 },
            { header: 'Applied On', key: 'applied', width: 20 }
        ];

        applications.forEach((app, idx) => {
            const s = app.student;
            worksheet.addRow({
                no: idx + 1,
                trackingId: app.trackingId,
                name: s?.fullName || '',
                email: s?.user?.email || '',
                phone: s?.phone || '',
                college: s?.collegeName || '',
                branch: s?.branch || '',
                year: s?.yearOfStudy || '',
                cgpa: s?.cgpa || '',
                status: app.status,
                applied: new Date(app.createdAt).toLocaleString('en-IN')
            });
        });

        const filename = `${internship.title.replace(/[^a-z0-9]/gi, '_')}_Applications.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        const buffer = await workbook.xlsx.writeBuffer();
        res.send(buffer);
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Extend / Update Application Deadline
 */
const extendDeadline = async (req, res, next) => {
    try {
        const { deadline } = req.body;
        const updated = await prisma.internship.update({
            where: { id: req.params.id },
            data: { applicationDeadline: deadline ? new Date(deadline) : null }
        });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Portal Configuration
 */
const getPortalConfig = async (req, res, next) => {
    try {
        let config = await prisma.portalConfiguration.findUnique({ where: { id: 'singleton' } });
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update Portal Configuration
 */
const updatePortalConfig = async (req, res, next) => {
    try {
        const { authorizedTotal, departments } = req.body;
        const config = await prisma.portalConfiguration.upsert({
            where: { id: 'singleton' },
            update: { authorizedTotal: parseInt(authorizedTotal) || 0, departments },
            create: { id: 'singleton', authorizedTotal: parseInt(authorizedTotal) || 0, departments }
        });
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Deterministically Allocate Applicants (Proposed Selection)
 */
const allocateApplicantsAction = async (req, res, next) => {
    try {
        const internshipId = req.params.id;
        const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
        const applications = await prisma.application.findMany({
            where: { internshipId, status: { in: ['SUBMITTED', 'SHORTLISTED'] } },
            include: { student: true }
        });
        const allocation = allocateApplicants(applications, internship);
        res.status(200).json({ success: true, data: allocation });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Committee details
 */
const getCommitteeDetails = async (req, res, next) => {
    try {
        const committee = await prisma.committee.findUnique({ 
            where: { internshipId: req.params.id },
            include: {
                internship: {
                    include: {
                        applications: {
                            where: { status: 'SHORTLISTED' },
                            include: { student: { include: { user: true } } }
                        }
                    }
                }
            }
        });
        res.status(200).json({ success: true, data: committee });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update Committee details
 */
const updateCommitteeDetails = async (req, res, next) => {
    try {
        const { meetLink, interviewDate, mentorId, prtiMemberId, hodId, membersData } = req.body;
        const internshipId = req.params.id;
        const committee = await prisma.committee.upsert({
            where: { internshipId },
            update: { meetLink, interviewDate: interviewDate ? new Date(interviewDate) : undefined, mentorId, prtiMemberId, hodId, membersData },
            create: { internshipId, meetLink, interviewDate: interviewDate ? new Date(interviewDate) : undefined, mentorId, prtiMemberId, hodId, membersData }
        });
        res.status(200).json({ success: true, data: committee });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Stipend Details
 */
const getStipendDetails = async (req, res, next) => {
    try {
        const stipend = await prisma.stipend.findUnique({ where: { applicationId: req.params.id } });
        res.status(200).json({ success: true, data: stipend });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Update Stipend Details
 */
const updateStipendDetails = async (req, res, next) => {
    try {
        const stipend = await prisma.stipend.upsert({
            where: { applicationId: req.params.id },
            update: req.body,
            create: { applicationId: req.params.id, ...req.body }
        });
        res.status(200).json({ success: true, data: stipend });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get All Interns
 */
const getAllInterns = async (req, res, next) => {
    try {
        const interns = await prisma.application.findMany({
            where: { status: 'APPROVED' },
            include: {
                student: true,
                internship: { select: { title: true, department: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: interns });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get All Meetings
 */
const getMeetings = async (req, res, next) => {
    try {
        const committees = await prisma.committee.findMany({
            include: { internship: { select: { title: true, department: true } } },
            orderBy: { interviewDate: 'asc' }
        });
        res.status(200).json({ success: true, data: committees });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Meetings for Mentor/HOD/PRTI
 */
const getMentorMeetings = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const committees = await prisma.committee.findMany({
            where: {
                OR: [{ hodId: userId }, { mentorId: userId }, { prtiMemberId: userId }]
            },
            include: { internship: { select: { title: true, department: true } } },
            orderBy: { interviewDate: 'asc' }
        });
        res.status(200).json({ success: true, data: committees });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Interns for Mentor
 */
const getMentorInterns = async (req, res, next) => {
    try {
        const interns = await prisma.application.findMany({
            where: {
                mentorId: req.user.id,
                status: { in: ['HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'] }
            },
            include: {
                student: true,
                internship: { select: { title: true } }
            }
        });
        res.status(200).json({ success: true, data: interns });
    } catch (error) {
        next(error);
    }
};

// Export all refactored handlers
module.exports = {
    createInternship,
    getAllInternships,
    deleteInternship,
    toggleInternship,
    getApplications,
    getRejectedApplications,
    updateApplicationStatus,
    exportApplications,
    extendDeadline,
    getPortalConfig,
    updatePortalConfig,
    allocateApplicantsAction,
    getCommitteeDetails,
    updateCommitteeDetails,
    getUsersByRole,
    updateUserRole,
    getStipendDetails,
    updateStipendDetails,
    getAllInterns,
    getMeetings,
    getMentorMeetings,
    getMentorInterns,
    assignWork,
    getWorkAssignments,
    runShortlistingAction
};
