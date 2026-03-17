const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xl = require('exceljs');

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

        const internship = await prisma.internship.create({
            data: {
                title,
                department,
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
        const internships = await prisma.internship.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { applications: true } },
                applications: { select: { status: true } }
            }
        });

        const result = internships.map(i => ({
            ...i,
            applicationsCount: i._count.applications,
            hiredCount: i.applications.filter(a => a.status === 'HIRED').length,
            remainingOpenings: Math.max(0, i.openingsCount - i.applications.filter(a => a.status === 'HIRED').length),
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
        const applications = await prisma.application.findMany({
            where: { internshipId: req.params.id },
            include: {
                student: true,
                documents: true
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
        const { status, assignedRole, rollNumber, joiningDate, endDate } = req.body;
        const applicationId = req.params.id;

        // If status is being changed to HIRED, check quotas and mandatory fields
        if (status === 'HIRED') {
            if (!assignedRole || !rollNumber || !joiningDate || !endDate) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Role, Roll Number, Joining Date, and End Date are mandatory for hiring.' 
                });
            }

            const application = await prisma.application.findUnique({
                where: { id: applicationId },
                include: { student: true, internship: true }
            });

            if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

            const s = application.student;
            const internship = application.internship;
            
            // --- Helper for category checks ---
            const clean = (str) => (str || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
            const isPriority = clean(s.collegeName).includes(clean(internship.priorityCollege || 'NOT_SET'));
            
            const isTopUniv = (student) => {
                const nirf = parseInt(student.nirfRanking);
                const category = student.collegeCategory;
                const topCats = ['IIT', 'NIT', 'IIIT', 'CENTRAL'];
                return (nirf > 0 && nirf <= 100) || topCats.includes(category);
            };

            // 0. --- GLOBAL OPENINGS CHECK ---
            const totalHiredCount = await prisma.application.count({
                where: {
                    internshipId: internship.id,
                    status: 'HIRED'
                }
            });

            if (totalHiredCount >= internship.openingsCount) {
                return res.status(400).json({
                    success: false,
                    message: `Internship Full: All ${internship.openingsCount} openings have been filled. You cannot hire more students.`
                });
            }

            // 1. --- CATEGORY QUOTA CHECK ---
            if (isPriority) {
                const hiredPriorityCount = await prisma.application.count({
                    where: {
                        internshipId: internship.id,
                        status: 'HIRED',
                        student: {
                            collegeName: { contains: internship.priorityCollege, mode: 'insensitive' }
                        }
                    }
                });
                const priorityLimit = internship.priorityCollegeQuota || 0;
                if (hiredPriorityCount >= priorityLimit) {
                    return res.status(400).json({ 
                        success: false, 
                        message: `Priority Quota Full: Already hired ${hiredPriorityCount} students from ${internship.priorityCollege} (Limit: ${priorityLimit}).` 
                    });
                }
            } else if (isTopUniv(s)) {
                const quotaPct = internship.quotaPercentages?.topUniversity || 0;
                const maxQuotaSeats = Math.round((internship.openingsCount * quotaPct) / 100);
                
                if (maxQuotaSeats > 0) {
                    const hiredQuotaCount = await prisma.application.count({
                        where: {
                            internshipId: internship.id,
                            status: 'HIRED',
                            student: {
                                AND: [
                                    { NOT: { collegeName: { contains: internship.priorityCollege || '___', mode: 'insensitive' } } },
                                    {
                                        OR: [
                                            { nirfRanking: { lte: 100, gt: 0 } },
                                            { collegeCategory: { in: ['IIT', 'NIT', 'IIIT', 'CENTRAL'] } }
                                        ]
                                    }
                                ]
                            }
                        }
                    });
                    if (hiredQuotaCount >= maxQuotaSeats) {
                        return res.status(400).json({ 
                            success: false, 
                            message: `Top University Quota Full: Already hired ${hiredQuotaCount} students (Limit: ${maxQuotaSeats}).` 
                        });
                    }
                }
            }

            // 2. --- ROLE OPENINGS CHECK ---
            if (assignedRole && internship.rolesData) {
                const rolesArray = Array.isArray(internship.rolesData) ? internship.rolesData : [];
                const roleInfo = rolesArray.find(r => r.name === assignedRole);
                
                if (roleInfo) {
                    const hiredRoleCount = await prisma.application.count({
                        where: {
                            internshipId: internship.id,
                            status: 'HIRED',
                            assignedRole: assignedRole
                        }
                    });
                    const roleLimit = roleInfo.openings || 0;
                    if (hiredRoleCount >= roleLimit) {
                        return res.status(400).json({ 
                            success: false, 
                            message: `Role Full: Already hired ${hiredRoleCount} students for '${assignedRole}' (Limit: ${roleLimit}).` 
                        });
                    }
                }
            }
        }

        const updateData = { status };
        if (assignedRole) {
            updateData.assignedRole = assignedRole;
        }
        if (joiningDate) {
            updateData.joiningDate = new Date(joiningDate);
        }
        if (endDate) {
            updateData.endDate = new Date(endDate);
        }

        // If HIRED, also update the student's profile with the manual roll number
        if (status === 'HIRED' && rollNumber) {
            await prisma.studentProfile.update({
                where: { id: application.studentId },
                data: { rollNumber }
            });
        }

        const app = await prisma.application.update({
            where: { id: req.params.id },
            data: updateData
        });
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
    updatePortalConfig
};
