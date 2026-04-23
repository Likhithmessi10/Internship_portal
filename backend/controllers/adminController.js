const { PrismaClient } = require('@prisma/client');
const prisma = require('../lib/prisma');
const emailService = require('../services/email/emailService');
const xl = require('exceljs');
const { allocateApplicants } = require('../services/allocationService');
const { createAuditLog } = require('../utils/auditLogger');
const { notifyMentorAssignment, notifyWorkAssignment } = require('../services/mailService');


/**
 * @desc    Create Internship
 * @route   POST /api/v1/admin/internships
 * @access  Private (Admin)
 */
const createInternship = async (req, res) => {
    try {
        const {
            title, department, description, roles, rolesData, requirements,
            expectations, location, duration, openingsCount, applicationDeadline,
            requiredDocuments, quotaPercentages, priorityCollege, priorityCollegeQuota,
            stipendType, stipendAmount, shortlistingRatio, preferredColleges,
            topColleges, seatAllocation
        } = req.body;

        let targetDepartment = department;

        // Only force department for HOD and MENTOR (they can only create for their own dept)
        // ADMIN and CE_PRTI can create for ANY department
        if ((req.user.role === 'HOD' || req.user.role === 'MENTOR') && req.user.department) {
            targetDepartment = req.user.department;
        }

        // If no department provided and user is HOD/MENTOR, use their department
        if (!targetDepartment && (req.user.role === 'HOD' || req.user.role === 'MENTOR') && req.user.department) {
            targetDepartment = req.user.department;
        }

        // Validate department is provided
        if (!targetDepartment) {
            return res.status(400).json({
                success: false,
                message: 'Department is required'
            });
        }

        const internship = await prisma.internship.create({
            data: {
                title,
                department: targetDepartment,
                description,
                roles: roles || null,
                rolesData: rolesData || null,
                requirements: requirements || null,
                expectations: expectations || null,
                location: location || null,
                duration,
                openingsCount: parseInt(openingsCount),
                applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
                requiredDocuments: requiredDocuments || null,
                quotaPercentages: quotaPercentages || null,
                priorityCollege: priorityCollege || null,
                priorityCollegeQuota: parseInt(priorityCollegeQuota) || 0,
                stipendType: stipendType || 'NON_COLLABORATIVE',
                stipendAmount: stipendAmount ? parseFloat(stipendAmount) : null,
                shortlistingRatio: shortlistingRatio ? parseInt(shortlistingRatio) : 2,
                preferredColleges: preferredColleges || [],
                topColleges: topColleges || [],
                seatAllocation: seatAllocation || {}
            }
        });

        res.status(201).json({ success: true, data: internship });

        // Audit Log
        await createAuditLog('CREATE_INTERNSHIP', req.user.email, `Created: ${title}`, internship.id);
    } catch (error) {
        console.error('Create internship error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Internships (Admin) with application counts
 * @route   GET /api/v1/admin/internships
 * @access  Private (Admin)
 */
const getAllInternships = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const whereClause = {};
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CE_PRTI' && req.user.department) {
            whereClause.department = req.user.department;
        }

        const [internships, total] = await Promise.all([
            prisma.internship.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    _count: { select: { applications: true } },
                    applications: { select: { status: true } }
                }
            }),
            prisma.internship.count({ where: whereClause })
        ]);

        const result = internships.map(i => ({
            ...i,
            applicationsCount: i._count.applications,
            hiredCount: i.applications.filter(a => ['APPROVED', 'HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length,
            remainingOpenings: Math.max(0, i.openingsCount - i.applications.filter(a => ['APPROVED', 'HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length),
            applications: undefined,
            _count: undefined
        }));

        res.status(200).json({ 
            success: true, 
            data: result,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get internships error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Delete Internship
 * @route   DELETE /api/v1/admin/internships/:id
 * @access  Private (Admin, CE_PRTI)
 */
const deleteInternship = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the internship first
        const internship = await prisma.internship.findUnique({
            where: { id }
        });

        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        // Delete the internship (Cascade should handle related records in Prisma)
        await prisma.internship.delete({ where: { id } });

        // Audit Log
        await createAuditLog('DELETE_INTERNSHIP', req.user.email, `Deleted internship: ${internship.title}`, id);

        res.status(200).json({
            success: true,
            message: 'Internship deleted successfully'
        });
    } catch (error) {
        console.error('Delete internship error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Toggle Internship Active Status
 * @route   PUT /api/v1/admin/internships/:id/toggle
 * @access  Private (Admin)
 */
const toggleInternship = async (req, res) => {
    try {
        const internship = await prisma.internship.findUnique({ where: { id: req.params.id } });
        if (!internship) return res.status(404).json({ success: false, message: 'Not found' });

        const updated = await prisma.internship.update({
            where: { id: req.params.id },
            data: { isActive: !internship.isActive }
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Applications for Internship
 * @route   GET /api/v1/admin/internships/:id/applications
 * @access  Private (Admin)
 */
const getApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        
        const internship = await prisma.internship.findUnique({
            where: { id: req.params.id }
        });
        
        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        const whereClause = { internshipId: req.params.id };
        if (req.user.role === 'MENTOR') {
            whereClause.mentorId = req.user.id;
        }

        const [applications, total] = await Promise.all([
            prisma.application.findMany({
                where: whereClause,
                skip,
                take: limit,
                orderBy: { score: 'desc' },
                include: {
                    student: {
                        include: { user: { select: { email: true, name: true } } }
                    },
                    documents: true,
                    mentor: { select: { name: true, email: true } },
                    shortlist: true,
                    attendance: true,
                    stipend: true
                }
            }),
            prisma.application.count({ where: whereClause })
        ]);

        res.status(200).json({ 
            success: true, 
            data: applications,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get applications error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Run automated shortlisting for internship
 */
const runShortlistingAction = async (req, res) => {
    try {
        const { id } = req.params;
        const { enqueueJob } = require('../services/jobService');
        const job = await enqueueJob(
            'BATCH_SHORTLIST', 
            { internshipId: id },
            `shortlist_${id}`
        );
        
        // Audit Log
        await createAuditLog('RUN_SHORTLISTING', req.user.email, `Enqueued auto-shortlisting for internship ${id}`, id);
        
        res.status(202).json({ 
            success: true, 
            message: 'Shortlisting process started in the background. It will process all applications deterministically.',
            jobId: job.id
        });
    } catch (error) {
        console.error('Run shortlisting error:', error.message);
        res.status(500).json({ success: false, message: error.message || 'Failed to run shortlisting' });
    }
};

/**
 * @desc    Get All Rejected Applications (across all internships)
 * @route   GET /api/v1/admin/applications/rejected
 * @access  Private (Admin)
 */
const getRejectedApplications = async (req, res) => {
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
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Manually Update Application Status
 * @route   PUT /api/v1/admin/applications/:id
 * @access  Private (Admin, HOD, MENTOR, COMMITTEE)
 */
const updateApplicationStatus = async (req, res) => {
    try {
        const { status, assignedRole, rollNumber, joiningDate, endDate, mentorId } = req.body;
        const applicationId = req.params.id;

        // 1. Strict Enum Enforcement
        const allowed = ['SUBMITTED', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'HIRED', 'ONGOING', 'COMPLETED'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { student: { include: { user: true } }, internship: true }
        });

        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

        const internship = application.internship;
        const student = application.student;

        // 2. Mentor Verification (if provided)
        let mentorUser = null;
        if (mentorId) {
            mentorUser = await prisma.user.findFirst({
                where: {
                    id: mentorId,
                    role: 'MENTOR',
                    department: internship.department
                }
            });

            if (!mentorUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Mentor. Mentor must be from the same department as the internship.'
                });
            }
        }

        // 3. Atomic Transaction for Updates
        const result = await prisma.$transaction(async (tx) => {
            // Seat Check
            if (status === 'APPROVED' || status === 'HIRED') {
                const currentHired = await tx.application.count({
                    where: {
                        internshipId: internship.id,
                        status: { in: ['APPROVED', 'HIRED', 'ONGOING'] }
                    }
                });

                if (currentHired >= internship.openingsCount && application.status !== status) {
                    throw new Error(`Internship Full: All ${internship.openingsCount} openings are filled.`);
                }
            }

            // Update student roll number if provided
            if (rollNumber) {
                await tx.studentProfile.update({
                    where: { id: application.studentId },
                    data: { rollNumber }
                });
            }

            // Core status and assignment update
            const updateData = { status };
            if (assignedRole) updateData.assignedRole = assignedRole;
            if (joiningDate) updateData.joiningDate = new Date(joiningDate);
            if (endDate) updateData.endDate = new Date(endDate);
            if (mentorId) updateData.mentorId = mentorId;

            const updatedApp = await tx.application.update({
                where: { id: applicationId },
                data: updateData
            });

            // Committee Auto-Sync
            if (mentorUser) {
                const hodUser = await tx.user.findFirst({
                    where: { role: 'HOD', department: internship.department }
                });

                await tx.committee.upsert({
                    where: { internshipId: internship.id },
                    update: { mentorId: mentorUser.id, hodId: hodUser?.id || null },
                    create: {
                        internshipId: internship.id,
                        mentorId: mentorUser.id,
                        hodId: hodUser?.id || null,
                        membersData: {
                            structure: {
                                member1: 'HOD (Permanent)',
                                member2: 'Mentor (Assigned by HOD)',
                                member3: 'PRTI Representative (Editable)'
                            }
                        }
                    }
                });
            }

            return updatedApp;
        });

        // 4. Notifications & Logs
        res.status(200).json({ success: true, data: result });

        if (mentorUser) {
            notifyMentorAssignment(mentorUser, student, internship).catch(e => console.error('Mentor notify fail', e));
        }

        const studentEmail = student.user?.email;
        if (studentEmail && !studentEmail.endsWith('@aptransco.portal')) {
            if (status === 'REJECTED') {
                emailService.sendStatusUpdate(studentEmail, student.fullName, 'Rejected', 'Your application was not selected.');
            } else if (status === 'APPROVED' || status === 'HIRED') {
                emailService.sendInterviewPass(studentEmail, student.fullName);
            }
        }

        await createAuditLog('UPDATE_APPLICATION', req.user.email, `Status -> ${status}`, applicationId);

    } catch (error) {
        console.error('[UpdateStatus Error]', error.message);
        res.status(error.message.includes('Full') ? 400 : 500).json({ 
            success: false, 
            message: error.message || 'Server Error' 
        });
    }
};

/**
 * @desc    Export applications to Excel
 * @route   GET /api/v1/admin/internships/:id/export
 * @access  Private (Admin, CE_PRTI, HOD, MENTOR)
 */
const exportApplications = async (req, res) => {
    try {
        const internshipId = req.params.id;

        const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
        const applications = await prisma.application.findMany({
            where: { internshipId },
            include: { student: { include: { user: true } }, documents: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

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
            { header: 'Applied On', key: 'applied', width: 20 },
            { header: 'SOP', key: 'sop', width: 50 },
            { header: 'Preferred Location', key: 'location', width: 25 },
            { header: 'Assigned Role', key: 'role', width: 25 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, size: 12 };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF003087' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

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
                applied: new Date(app.createdAt).toLocaleString('en-IN'),
                sop: app.sop ? app.sop.substring(0, 100) : '',
                location: app.preferredLocation || '',
                role: app.assignedRole || ''
            });
        });

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `${internship.title.replace(/[^a-z0-9]/gi, '_')}_Applications_${timestamp}.xlsx`;

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Export failed',
            error: error.message
        });
    }
};

/**
 * @desc    Extend / Update Application Deadline
 * @route   PUT /api/v1/admin/internships/:id/deadline
 * @access  Private (Admin)
 */
const extendDeadline = async (req, res) => {
    try {
        const { deadline } = req.body;
        const updated = await prisma.internship.update({
            where: { id: req.params.id },
            data: { applicationDeadline: deadline ? new Date(deadline) : null }
        });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Portal Configuration
 * @route   GET /api/v1/admin/config
 */
const getPortalConfig = async (req, res) => {
    try {
        let config = await prisma.portalConfiguration.findUnique({ where: { id: 'singleton' } });

        // If no config exists, create default config with departments
        if (!config) {
            const defaultDepartments = [
                'TRANSMISSION',
                'PLANNING AND POWER SYSTEMS',
                'SLDC',
                'PROJECTS',
                'APPCC AND LEGAL',
                'COMMERCIAL AND COORDINATION LMC',
                'HRD',
                'ZONE VIJAYAWADA',
                'ZONE VISHAKAPATNAM',
                'APPCC',
                'ZONE KADAPA',
                'CIVIL',
                'TELECOM AND IT',
                'ADDITIONAL SECRETARY',
                'CGM AND FINANCE'
            ];
            config = await prisma.portalConfiguration.create({
                data: {
                    id: 'singleton',
                    authorizedTotal: 100,
                    departments: defaultDepartments
                }
            });
        }

        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update Portal Configuration
 * @route   PUT /api/v1/admin/config
 */
const updatePortalConfig = async (req, res) => {
    try {
        const { authorizedTotal, departments } = req.body;
        const config = await prisma.portalConfiguration.upsert({
            where: { id: 'singleton' },
            update: { authorizedTotal: parseInt(authorizedTotal) || 0, departments },
            create: { id: 'singleton', authorizedTotal: parseInt(authorizedTotal) || 0, departments }
        });
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
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
            where: { internshipId, status: { in: ['PENDING', 'SHORTLISTED'] } },
            include: { student: true }
        });
        const allocation = allocateApplicants(applications, internship);
        res.status(200).json({ success: true, data: allocation });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get Committee details for an Internship
 */
const getCommitteeDetails = async (req, res) => {
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
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update Committee details
 */
const updateCommitteeDetails = async (req, res) => {
    try {
        const { meetLink, interviewDate, mentorId, prtiMemberId, hodId, membersData } = req.body;
        const internshipId = req.params.id;

        const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
        if (!internship) {
             return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        // 1. Prepare Update Object
        const updateObj = {};
        if (meetLink !== undefined) updateObj.meetLink = meetLink;
        if (interviewDate !== undefined) updateObj.interviewDate = interviewDate ? new Date(interviewDate) : null;
        if (mentorId !== undefined) updateObj.mentorId = mentorId;
        if (prtiMemberId !== undefined) updateObj.prtiMemberId = prtiMemberId;
        if (hodId !== undefined) updateObj.hodId = hodId;
        
        if (membersData) {
            updateObj.membersData = membersData;
        }

        // 2. Security/Validation
        const targetMentorId = mentorId || membersData?.mentorId;
        if (targetMentorId) {
            const mentor = await prisma.user.findUnique({ where: { id: targetMentorId } });
            if (mentor && mentor.department !== internship.department && req.user.role !== 'ADMIN') {
                return res.status(400).json({
                    success: false,
                    message: `Mentor department mismatch. Selected mentor is from ${mentor.department}, but internship is in ${internship.department}.`
                });
            }
        }

        // 3. Perform Update/Upsert
        const committee = await prisma.committee.upsert({
            where: { internshipId },
            update: updateObj,
            create: {
                ...updateObj,
                internshipId,
                membersData: membersData || {
                    structure: {
                        member1: 'HOD (Permanent)',
                        member2: 'Mentor (Assigned by HOD)',
                        member3: 'PRTI Representative (Editable)'
                    }
                }
            }
        });

        // 4. Email Trigger Logic
        const targetApplicants = await prisma.application.findMany({
            where: { 
                internshipId,
                status: { in: ['SHORTLISTED'] }
            },
            include: { student: { include: { user: true } } }
        });

        if (meetLink && interviewDate && targetApplicants.length > 0) {
            targetApplicants.forEach(app => {
                const email = app.student.user?.email;
                if (email && !email.endsWith('@aptransco.portal')) {
                    const dateStr = new Date(interviewDate).toLocaleDateString();
                    const timeStr = new Date(interviewDate).toLocaleTimeString();
                    emailService.sendInterviewScheduled(email, app.student.fullName, dateStr, timeStr, meetLink).catch(err => {
                        console.error(`Failed to send interview email to ${email}:`, err.message);
                    });
                }
            });
        }

        res.status(200).json({ success: true, data: committee });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Users by Role
 * @route   GET /api/v1/admin/users
 * @access  Private
 */
const getUsersByRole = async (req, res) => {
    try {
        const { role, department } = req.query;
        const whereClause = {};
        if (role) whereClause.role = role;

        // If HOD, force their department
        if (req.user.role === 'HOD' && req.user.department) {
            whereClause.department = req.user.department;
        } else if (department) {
            whereClause.department = department;
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: { id: true, name: true, email: true, department: true },
            orderBy: { name: 'asc' }
        });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update User Role
 */
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const targetId = req.params.id;
        const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

        if (role === 'ADMIN' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const updated = await prisma.user.update({
            where: { id: targetId },
            data: { role }
        });

        await createAuditLog('UPDATE_USER_ROLE', req.user.email, `Changed ${targetUser.email} role to ${role}`, targetId);
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Stipend Details
 */
const getStipendDetails = async (req, res) => {
    try {
        const stipend = await prisma.stipend.findUnique({ where: { applicationId: req.params.id } });
        res.status(200).json({ success: true, data: stipend });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update Stipend Details
 */
const updateStipendDetails = async (req, res) => {
    try {
        const { panNumber, bankAccount, ifscCode, bankName, bankBranch, approvalStatus } = req.body;
        const stipend = await prisma.stipend.upsert({
            where: { applicationId: req.params.id },
            update: { panNumber, bankAccount, ifscCode, bankName, bankBranch, approvalStatus },
            create: { applicationId: req.params.id, panNumber, bankAccount, ifscCode, bankName, bankBranch, approvalStatus }
        });
        res.status(200).json({ success: true, data: stipend });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Interns
 */
const getAllInterns = async (req, res) => {
    try {
        const interns = await prisma.application.findMany({
            where: { status: 'APPROVED' },
            include: {
                student: true,
                internship: { select: { title: true, department: true, location: true } },
                mentor: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: interns });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Meetings
 */
const getMeetings = async (req, res) => {
    try {
        const committees = await prisma.committee.findMany({
            include: { internship: { select: { title: true, department: true } } },
            orderBy: { interviewDate: 'asc' }
        });
        res.status(200).json({ success: true, data: committees });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Interns for Mentor (Dashboard)
 */
const getMentorInterns = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const userRole = req.user.role;

        console.log('=== MENTOR INTERNS QUERY ===');
        console.log('Mentor ID:', mentorId);
        console.log('User Role:', userRole);
        console.log('User Email:', req.user.email);

        // Show interns with HIRED, CA_APPROVED, ONGOING, or COMPLETED status
        const interns = await prisma.application.findMany({
            where: {
                mentorId,
                status: { in: ['HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'] }
            },
            include: {
                student: {
                    include: {
                        user: { select: { email: true } }
                    }
                },
                internship: { select: { title: true, department: true } },
                attendance: true,
                workAssignments: { orderBy: { createdAt: 'desc' } }
            },
            orderBy: { createdAt: 'desc' }
        });

        console.log('Found interns:', interns.length);
        if (interns.length > 0) {
            console.log('Interns:', interns.map(i => ({
                student: i.student.fullName,
                status: i.status,
                mentorId: i.mentorId,
                internship: i.internship.title
            })));
        }

        // Group by Internship
        const groupedByInternship = interns.reduce((acc, current) => {
            const intTitle = current.internship.title;
            if (!acc[intTitle]) {
                acc[intTitle] = {
                    title: intTitle,
                    id: current.internshipId,
                    interns: []
                };
            }
            acc[intTitle].interns.push(current);
            return acc;
        }, {});

        res.status(200).json({ success: true, data: Object.values(groupedByInternship) });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Assign Work to Intern
 */
const assignWork = async (req, res) => {
    try {
        const { applicationId, title, description, dueDate } = req.body;
        const mentorId = req.user.id;

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { student: { include: { user: true } } }
        });

        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
        if (application.mentorId !== mentorId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const work = await prisma.workAssignment.create({
            data: {
                applicationId,
                mentorId,
                studentId: application.studentId,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        // Notify Intern
        const student = application.student;
        await notifyWorkAssignment(
            student.user.email,
            student.fullName,
            req.user.name || 'Your Mentor',
            title,
            description
        );

        res.status(201).json({ success: true, data: work });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Work Assignments
 */
const getWorkAssignments = async (req, res) => {
    try {
        const { applicationId } = req.query;
        let whereClause = {};

        if (applicationId) {
            whereClause.applicationId = applicationId;
        } else if (req.user.role === 'MENTOR') {
            whereClause.mentorId = req.user.id;
        } else if (req.user.role === 'STUDENT') {
            whereClause.studentId = req.user.studentProfileId; // Check this based on how student profile is handled
        }

        const assignments = await prisma.workAssignment.findMany({
            where: whereClause,
            include: {
                student: { select: { fullName: true } },
                mentor: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Meetings for Mentor/HOD/PRTI
 * @route   GET /api/v1/admin/meetings/my
 * @access  Private
 */
const getMentorMeetings = async (req, res) => {
    try {
        const userId = req.user.id;
        const role = req.user.role;

        let whereClause = {};

        if (role === 'HOD') {
            whereClause.hodId = userId;
        } else if (role === 'MENTOR') {
            whereClause.mentorId = userId;
        } else if (role === 'CE_PRTI') {
            whereClause.prtiMemberId = userId;
        } else if (role !== 'ADMIN') {
            // Other roles might be part of committee membersData
            whereClause.OR = [
                { hodId: userId },
                { mentorId: userId },
                { prtiMemberId: userId }
            ];
        }

        const committees = await prisma.committee.findMany({
            where: whereClause,
            include: {
                internship: {
                    select: {
                        id: true,
                        title: true,
                        department: true,
                        location: true
                    }
                }
            },
            orderBy: { interviewDate: 'asc' }
        });

        res.status(200).json({ success: true, data: committees });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

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
