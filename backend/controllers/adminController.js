const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xl = require('exceljs');
const { allocateApplicants } = require('../services/allocationService');

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
            requiredDocuments, quotaPercentages, priorityCollege, priorityCollegeQuota
        } = req.body;

        let targetDepartment = department;
        if (req.user.role !== 'ADMIN' && req.user.department) {
            targetDepartment = req.user.department;
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
                location: location || 'ANY',
                duration,
                openingsCount: parseInt(openingsCount),
                applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
                requiredDocuments: requiredDocuments || null,
                quotaPercentages: quotaPercentages || null,
                priorityCollege: priorityCollege || null,
                priorityCollegeQuota: parseInt(priorityCollegeQuota) || 0,
            }
        });

        res.status(201).json({ success: true, data: internship });
    } catch (error) {
        console.error(error);
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
            hiredCount: i.applications.filter(a => ['HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length,
            remainingOpenings: Math.max(0, i.openingsCount - i.applications.filter(a => ['HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length),
            applications: undefined,
            _count: undefined
        }));

        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Delete Internship
 * @route   DELETE /api/v1/admin/internships/:id
 * @access  Private (Admin)
 */
const deleteInternship = async (req, res) => {
    try {
        await prisma.internship.delete({ where: { id: req.params.id } });
        res.status(200).json({ success: true, message: 'Internship deleted' });
    } catch (error) {
        console.error(error);
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
        console.error(error);
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
            // Wait, mentor might not have an ID matched directly if we use name. 
            // In the modal we allow assigning Mentor by ID or Name. It gets saved to mentorId.
            // Let's assume mentorId in Application table is meant to hold the mentor's DB ID or Name string.
            // If they are logged in, req.user.id or req.user.name could be used.
            // Let's support both or just ID if we expect ID.
            whereClause.mentorId = req.user.id;
        } else if (req.user.role === 'COMMITTEE_MEMBER') {
            // Committee sees applications forwarded to them or already approved by them
            whereClause.status = { in: ['COMMITTEE_EVALUATION', 'CA_APPROVED', 'HIRED', 'ONGOING', 'COMPLETED', 'REJECTED'] };
        }

        const applications = await prisma.application.findMany({
            where: whereClause,
            include: {
                student: true,
                documents: true,
                mentor: { select: { name: true, email: true } },
                shortlist: true,
                attendance: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error(error);
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
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Manually Update Application Status
 * @route   PUT /api/v1/admin/applications/:id
 * @access  Private (Admin)
 */
const updateApplicationStatus = async (req, res) => {
    console.log('>>> updateApplicationStatus Triggered for ID:', req.params.id);
    console.log('>>> Payload:', req.body);
    try {
        const { status, assignedRole, rollNumber, joiningDate, endDate, mentorId, committeeId, score } = req.body;
        const applicationId = req.params.id;

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { student: true, internship: true }
        });

        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

        const s = application.student;
        const internship = application.internship;

        // HOD assigning Mentor and Shortlisting
        if (status === 'COMMITTEE_EVALUATION') {
            if (mentorId) {
                const mentorUser = await prisma.user.findFirst({
                    where: {
                        OR: [{ id: mentorId }, { email: mentorId }, { name: { contains: mentorId, mode: 'insensitive' } }],
                        role: 'MENTOR'
                    }
                });
                if (!mentorUser) {
                    return res.status(400).json({ success: false, message: 'Invalid Mentor ID or Name. Mentor not found.' });
                }
                await prisma.application.update({
                    where: { id: applicationId },
                    data: { mentorId: mentorUser.id }
                });
            }
        }

        // Committee Evaluating and Selecting
        if (status === 'CA_APPROVED') {
            if (score) {
                await prisma.shortlist.upsert({
                    where: { applicationId },
                    update: { evaluationScore: parseInt(score), committeeMemberId: req.user.id },
                    create: { applicationId, evaluationScore: parseInt(score), committeeMemberId: req.user.id }
                });
            }
        }
        if (status === 'HIRED') {
            if (!assignedRole) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Role is mandatory for hiring/approval.' 
                });
            }

            const clean = (str) => (str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const isPriority = clean(s.collegeName).includes(clean(internship.priorityCollege || 'NOT_SET'));
            
            const isTopUniv = (student) => {
                const nirf = parseInt(student.nirfRanking);
                const category = student.collegeCategory;
                const topCats = ['IIT', 'NIT', 'IIIT', 'CENTRAL'];
                return (nirf > 0 && nirf <= 100) || topCats.includes(category);
            };

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

            // Category Quota Checks omitted for brevity or re-included similar to before...
            // Role Openings Check
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

        // Add to Shortlist if committeeId is provided
        if (committeeId) {
            await prisma.shortlist.upsert({
                where: { applicationId },
                update: { committeeId, score: parseInt(score) || 0, decision: status },
                create: { applicationId, committeeId, score: parseInt(score) || 0, decision: status }
            });
        }

        res.status(200).json({ success: true, data: app });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Export applications to Excel
 * @route   GET /api/v1/admin/internships/:id/export
 * @access  Private (Admin)
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

        const workbook = new xl.Workbook();
        workbook.creator = 'APTRANSCO Admin';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Applications', {
            views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }]
        });

        // Header styling
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3730A3' } };
        const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };

        worksheet.columns = [
            { header: '#', key: 'no', width: 5 },
            { header: 'Tracking ID', key: 'trackingId', width: 22 },
            { header: 'Full Name', key: 'name', width: 26 },
            { header: 'Phone', key: 'phone', width: 14 },
            { header: 'Email / Roll No', key: 'roll', width: 20 },
            { header: 'College', key: 'college', width: 35 },
            { header: 'Tier', key: 'tier', width: 12 },
            { header: 'Degree & Branch', key: 'degree', width: 22 },
            { header: 'Year', key: 'year', width: 6 },
            { header: 'CGPA', key: 'cgpa', width: 8 },
            { header: 'NIRF Rank', key: 'nirf', width: 10 },
            { header: 'Address', key: 'address', width: 30 },
            { header: 'Status', key: 'status', width: 14 },
            { header: 'Resume', key: 'resume', width: 50 },
            { header: 'NOC Letter', key: 'noc', width: 50 },
            { header: 'Marksheet', key: 'marksheet', width: 50 },
            { header: 'Passport Photo', key: 'photo', width: 50 },
            { header: 'Applied On', key: 'applied', width: 18 },
        ];

        // Apply header style
        worksheet.getRow(1).eachCell(cell => {
            cell.fill = headerFill;
            cell.font = headerFont;
            cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
        worksheet.getRow(1).height = 22;

        // Data rows
        applications.forEach((app, idx) => {
            const s = app.student;
            const getDoc = (type) => app.documents.find(d => d.type === type)?.url || '';

            const row = worksheet.addRow({
                no: idx + 1,
                trackingId: app.trackingId,
                name: s?.fullName || '',
                phone: s?.phone || '',
                roll: s?.rollNumber || '',
                college: s?.collegeName || '',
                tier: s?.collegeCategory || '',
                degree: s ? `${s.degree} – ${s.branch}` : '',
                year: s?.yearOfStudy || '',
                cgpa: s?.cgpa || '',
                nirf: s?.nirfRanking || '',
                address: s?.address || '',
                status: app.status,
                resume: getDoc('RESUME'),
                noc: getDoc('NOC_LETTER') || getDoc('PRINCIPAL_LETTER'),
                marksheet: getDoc('MARKSHEET'),
                photo: getDoc('PASSPORT_PHOTO'),
                applied: new Date(app.createdAt).toLocaleString('en-IN'),
            });

            // Alternate row shading
            if (idx % 2 === 0) {
                row.eachCell(cell => {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } };
                });
            }

            // Status color
            const statusCell = row.getCell('status');
            const statusColors = {
                HIRED: 'FF065F46', REJECTED: 'FF9B1C1C',
                PENDING: 'FF92400E', SHORTLISTED: 'FF1E40AF'
            };
            if (statusColors[app.status]) {
                statusCell.font = { bold: true, color: { argb: statusColors[app.status] } };
            }
        });

        // Freeze + autofilter
        worksheet.autoFilter = { from: 'A1', to: `R1` };

        // Write to buffer then send
        const buffer = await workbook.xlsx.writeBuffer();

        const safeTitle = (internship?.title || 'applications').replace(/[^a-zA-Z0-9]/g, '_');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${safeTitle}_applications.xlsx"`);
        res.setHeader('Content-Length', buffer.length);
        res.end(buffer);

    } catch (error) {
        console.error('Export error:', error);
        if (!res.headersSent) {
            res.status(500).json({ success: false, message: 'Export failed: ' + error.message });
        }
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
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Advanced export with multi-filters
 * @route   GET /api/v1/admin/applications/export/advanced
 * @access  Private (Admin)
 */
const exportAdvanced = async (req, res) => {
    try {
        const { internshipId, collegeName, yearOfStudy, status, tier } = req.query;

        const where = {};
        if (internshipId) where.internshipId = internshipId;
        if (status && status !== 'All') where.status = status;

        const studentWhere = {};
        if (collegeName) studentWhere.collegeName = { contains: collegeName, mode: 'insensitive' };
        if (yearOfStudy) studentWhere.yearOfStudy = parseInt(yearOfStudy);
        if (tier && tier !== 'All') studentWhere.collegeCategory = tier;

        if (Object.keys(studentWhere).length > 0) {
            where.student = studentWhere;
        }

        const applications = await prisma.application.findMany({
            where,
            include: { student: true, documents: true, internship: { select: { title: true } } },
            orderBy: { createdAt: 'desc' }
        });

        const workbook = new xl.Workbook();
        const worksheet = workbook.addWorksheet('Filtered Applications');

        worksheet.columns = [
            { header: 'Internship', key: 'internship', width: 25 },
            { header: 'Tracking ID', key: 'trackingId', width: 20 },
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'College', key: 'college', width: 35 },
            { header: 'Year', key: 'year', width: 10 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Joining Date', key: 'joining', width: 15 },
            { header: 'End Date', key: 'end', width: 15 },
            { header: 'Applied On', key: 'applied', width: 20 },
        ];

        applications.forEach(app => {
            worksheet.addRow({
                internship: app.internship?.title || 'N/A',
                trackingId: app.trackingId,
                name: app.student?.fullName || '',
                college: app.student?.collegeName || '',
                year: app.student?.yearOfStudy || '',
                status: app.status,
                joining: app.joiningDate ? new Date(app.joiningDate).toLocaleDateString() : '',
                end: app.endDate ? new Date(app.endDate).toLocaleDateString() : '',
                applied: new Date(app.createdAt).toLocaleString(),
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="advanced_export.xlsx"');
        res.end(buffer);

    } catch (error) {
        console.error('Advanced export error:', error);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};

/**
 * @desc    Get Portal Configuration
 * @route   GET /api/v1/admin/config
 * @access  Private (Admin)
 */
const getPortalConfig = async (req, res) => {
    try {
        let config = await prisma.portalConfiguration.findUnique({ where: { id: 'singleton' } });
        if (!config) {
            config = await prisma.portalConfiguration.create({ 
                data: { id: 'singleton', authorizedTotal: 0 } 
            });
        }
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update Portal Configuration
 * @route   PUT /api/v1/admin/config
 * @access  Private (Admin)
 */
const updatePortalConfig = async (req, res) => {
    try {
        const { authorizedTotal } = req.body;
        const config = await prisma.portalConfiguration.upsert({
            where: { id: 'singleton' },
            update: { authorizedTotal: parseInt(authorizedTotal) || 0 },
            create: { id: 'singleton', authorizedTotal: parseInt(authorizedTotal) || 0 }
        });
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Deterministically Allocate Applicants (Proposed Selection)
 * @route   POST /api/v1/admin/internships/:id/allocate
 * @access  Private (Admin)
 */
const allocateApplicantsAction = async (req, res, next) => {
    try {
        const internshipId = req.params.id;

        // 1. Fetch Internship Data
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId }
        });

        if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });

        // 2. Fetch ALL Applications for this Internship (only Pending/Shortlisted)
        const applications = await prisma.application.findMany({
            where: { 
                internshipId,
                status: { in: ['PENDING', 'SHORTLISTED'] } 
            },
            include: { student: true }
        });

        if (applications.length === 0) {
            return res.status(200).json({ 
                success: true, 
                message: 'No pending applications to allocate.',
                allocated: [],
                stats: { total: 0, selected: 0 }
            });
        }

        // 3. Trigger Allocation Engine
        const allocation = allocateApplicants(applications, internship);

        // 4. Return the Proposed allocation
        // We do NOT update the DB yet. The UI will show this and let the admin "Confirm".
        res.status(200).json({
            success: true,
            data: allocation,
            stats: {
                totalApplicants: applications.length,
                totalCapacity: internship.openingsCount,
                selectedCount: allocation.length,
                categories: {
                    priority: allocation.filter(a => a.category === 'PRIORITY').length,
                    topUniv: allocation.filter(a => a.category === 'TOP_UNIV').length,
                    normal: allocation.filter(a => a.category === 'NORMAL').length
                }
            }
        });

    } catch (error) {
        next(error);
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
    exportAdvanced,
    extendDeadline,
    getPortalConfig,
    updatePortalConfig,
    allocateApplicantsAction
};
