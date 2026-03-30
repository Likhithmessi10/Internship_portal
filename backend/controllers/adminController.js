const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
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
            stipendType, stipendAmount
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
                stipendAmount: stipendAmount ? parseFloat(stipendAmount) : null
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
        const whereClause = {};
        if (req.user.role !== 'ADMIN' && req.user.department) {
            whereClause.department = req.user.department;
        }

        const internships = await prisma.internship.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { applications: true } },
                applications: { select: { status: true } }
            }
        });

        const result = internships.map(i => ({
            ...i,
            applicationsCount: i._count.applications,
            hiredCount: i.applications.filter(a => ['CA_APPROVED', 'ONGOING', 'COMPLETED'].includes(a.status)).length,
            remainingOpenings: Math.max(0, i.openingsCount - i.applications.filter(a => ['CA_APPROVED', 'ONGOING', 'COMPLETED'].includes(a.status)).length),
            applications: undefined,
            _count: undefined
        }));

        res.status(200).json({ success: true, data: result });
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
        const whereClause = { internshipId: req.params.id };
        if (req.user.role === 'MENTOR') {
            whereClause.mentorId = req.user.id;
        } else if (req.user.role === 'COMMITTEE_MEMBER') {
            whereClause.status = { in: ['COMMITTEE_EVALUATION', 'CA_APPROVED', 'HIRED', 'ONGOING', 'COMPLETED', 'REJECTED'] };
        }

        const applications = await prisma.application.findMany({
            where: whereClause,
            include: {
                student: {
                    include: {
                        user: { select: { email: true, name: true } }
                    }
                },
                documents: true,
                mentor: { select: { name: true, email: true } },
                shortlist: true,
                attendance: true,
                stipend: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
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
        const {
            status, assignedRole, rollNumber, joiningDate, endDate, mentorId, committeeId, score,
            hodScore, mentorScore, prtiScore
        } = req.body;
        const applicationId = req.params.id;
        const userRole = req.user.role;

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { student: { include: { user: true } }, internship: true }
        });

        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

        const s = application.student;
        const internship = application.internship;

        // HOD assigning Mentor and Forwarding to Committee
        if (status === 'COMMITTEE_EVALUATION') {
            // HOD must assign mentor from SAME department
            if (!mentorId) {
                return res.status(400).json({
                    success: false,
                    message: 'HOD must assign a mentor from the same department before forwarding to committee.'
                });
            }

            if (mentorId) {
                const mentorUser = await prisma.user.findFirst({
                    where: {
                        id: mentorId,
                        role: 'MENTOR',
                        department: internship.department // ENFORCE same department
                    }
                });
                if (!mentorUser) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid Mentor. Mentor must be from the same department as the internship.'
                    });
                }
                await prisma.application.update({
                    where: { id: applicationId },
                    data: { mentorId: mentorUser.id }
                });

                // Find HOD of the same department (permanent committee member)
                const hodUser = await prisma.user.findFirst({
                    where: {
                        role: 'HOD',
                        department: internship.department
                    }
                });

                // Auto-create committee with HOD as permanent member
                await prisma.committee.upsert({
                    where: { internshipId: internship.id },
                    update: {
                        mentorId: mentorUser.id,
                        hodId: hodUser?.id || null
                    },
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

                // Notify Mentor
                await notifyMentorAssignment(mentorUser, s, internship);
            }
        }

        // Committee Evaluating (All 3 members submit scores)
        if (status === 'CA_APPROVED') {
            const { member1Score, member2Score, member3Score } = req.body;
            const shortlistData = {
                score: parseInt(score) || 0,
                decision: status,
                hodScore: hodScore || member1Score || undefined,
                mentorScore: mentorScore || member2Score || undefined,
                prtiScore: prtiScore || member3Score || undefined,
                evaluatedAt: new Date()
            };

            await prisma.shortlist.upsert({
                where: { applicationId },
                update: shortlistData,
                create: { ...shortlistData, applicationId }
            });
        }

        // PRTI Member (Committee Head) gives FINAL APPROVAL
        if (status === 'HIRED') {
            // Only PRTI Member or ADMIN can give final approval
            if (userRole !== 'CE_PRTI' && userRole !== 'ADMIN' && userRole !== 'HOD') {
                return res.status(403).json({
                    success: false,
                    message: 'Only PRTI Member, Admin, or HOD can give final approval.'
                });
            }

            if (!assignedRole) {
                return res.status(400).json({
                    success: false,
                    message: 'Role is mandatory for hiring/approval.'
                });
            }

            const totalHiredCount = await prisma.application.count({
                where: {
                    internshipId: internship.id,
                    status: { in: ['HIRED', 'CA_APPROVED', 'ONGOING', 'COMPLETED'] }
                }
            });

            if (totalHiredCount >= internship.openingsCount && application.status !== 'HIRED' && application.status !== 'CA_APPROVED') {
                return res.status(400).json({
                    success: false,
                    message: `Internship Full: All ${internship.openingsCount} openings have been filled.`
                });
            }

            if (assignedRole && internship.rolesData) {
                const rolesArray = Array.isArray(internship.rolesData) ? internship.rolesData : [];
                const roleInfo = rolesArray.find(r => r.name === assignedRole);

                if (roleInfo) {
                    const hiredRoleCount = await prisma.application.count({
                        where: {
                            internshipId: internship.id,
                            status: { in: ['HIRED', 'CA_APPROVED', 'ONGOING', 'COMPLETED'] },
                            assignedRole: assignedRole
                        }
                    });
                    const roleLimit = roleInfo.openings || 0;
                    if (hiredRoleCount >= roleLimit && application.status !== 'HIRED' && application.status !== 'CA_APPROVED') {
                        return res.status(400).json({
                            success: false,
                            message: `Role Full: Already hired ${hiredRoleCount} students for '${assignedRole}' (Limit: ${roleLimit}).`
                        });
                    }
                }
            }

            if (rollNumber) {
                await prisma.studentProfile.update({
                    where: { id: application.studentId },
                    data: { rollNumber }
                });
            }
        }

        const updateData = { status };
        if (assignedRole) updateData.assignedRole = assignedRole;
        if (joiningDate) updateData.joiningDate = new Date(joiningDate);
        if (endDate) updateData.endDate = new Date(endDate);
        if (mentorId) updateData.mentorId = mentorId;

        const app = await prisma.application.update({
            where: { id: req.params.id },
            data: updateData
        });



        res.status(200).json({ success: true, data: app });

        // --- EMAIL TRIGGERS (Async) ---
        const studentEmail = application.student.user?.email;
        if (studentEmail && !studentEmail.endsWith('@aptransco.portal')) {
            const studentName = application.student.fullName;
            if (status === 'COMMITTEE_EVALUATION') {
                emailService.sendStatusUpdate(studentEmail, studentName, 'Forwarded to Committee', 'Your application has been reviewed by the HOD and forwarded to the PRTI Committee for final evaluation.');
            } else if (status === 'REJECTED') {
                emailService.sendStatusUpdate(studentEmail, studentName, 'Rejected', 'We regret to inform you that your application was not selected for this internship following the institutional review.');
            } else if (status === 'HIRED') {
                emailService.sendInterviewPass(studentEmail, studentName);
            }
        }

        // Audit Log
        await createAuditLog('UPDATE_APPLICATION', req.user.email, `Status changed to ${status}`, applicationId);
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
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
            include: { student: true, documents: true },
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
                email: s?.email || '',
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
        const committee = await prisma.committee.findUnique({ where: { internshipId: req.params.id } });
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
        const { meetLink, interviewDate, membersData } = req.body;

        // Security Check: If mentor is being assigned, verify department
        if (membersData?.mentorId) {
            const internship = await prisma.internship.findUnique({ where: { id: req.params.id } });
            const mentor = await prisma.user.findUnique({ where: { id: membersData.mentorId } });

            if (mentor && internship && mentor.department !== internship.department) {
                return res.status(400).json({
                    success: false,
                    message: `Mentor department mismatch. Selected mentor is from ${mentor.department}, but internship is in ${internship.department}.`
                });
            }
        }

        res.status(200).json({ success: true, data: committee });

        // --- EMAIL TRIGGER: Notify Applicants of Interview (Async) ---
        if (meetLink && interviewDate) {
            const applicants = await prisma.application.findMany({
                where: { 
                    internshipId: req.params.id,
                    status: 'COMMITTEE_EVALUATION'
                },
                include: { student: { include: { user: true } } }
            });

            applicants.forEach(app => {
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
            where: { status: { in: ['CA_APPROVED', 'ONGOING', 'COMPLETED'] } },
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
                status: { in: ['HIRED', 'CA_APPROVED', 'ONGOING', 'COMPLETED'] }
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
    getWorkAssignments
};
