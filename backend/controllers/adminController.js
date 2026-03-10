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
            expectations, location, duration, openingsCount, applicationDeadline
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
    try {
        const { status, assignedRole } = req.body;

        const updateData = { status };
        if (assignedRole) {
            updateData.assignedRole = assignedRole;
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

module.exports = {
    createInternship,
    getAllInternships,
    deleteInternship,
    toggleInternship,
    getApplications,
    getRejectedApplications,
    updateApplicationStatus,
    exportApplications,
    extendDeadline
};
