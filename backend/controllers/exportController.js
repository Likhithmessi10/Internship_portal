const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const xl = require('exceljs');

/**
 * @desc    Dynamic Export of Applications based on Role, Filters, and Columns
 * @route   GET /api/v1/export/applications
 * @access  Private (All Roles)
 */
const exportApplicationsGlobal = async (req, res) => {
    try {
        const { status, columns, internshipId } = req.query;
        let whereClause = {};

        // 1. Scope by Role
        const userRole = req.user.role;
        if (userRole === 'STUDENT') {
            const profile = await prisma.studentProfile.findUnique({ where: { userId: req.user.id } });
            if (!profile) return res.status(404).json({ success: false, message: 'Profile not found' });
            whereClause.studentId = profile.id;
        } else if (userRole === 'MENTOR') {
            whereClause.mentorId = req.user.id;
        } else if (userRole === 'HOD') {
            const userDept = req.user.department;
            const deptInts = await prisma.internship.findMany({ where: { department: userDept } });
            whereClause.internshipId = { in: deptInts.map(i => i.id) };
        } else if (userRole === 'COMMITTEE_MEMBER') {
            whereClause.status = { in: ['APPROVED', 'REJECTED'] };
        }

        // 2. Status scope
        if (status && status !== 'All') {
            whereClause.status = status;
        }
        
        // 3. Internship scope (if explicit filter)
        if (internshipId) {
            whereClause.internshipId = internshipId;
        }

        const applications = await prisma.application.findMany({
            where: whereClause,
            include: { student: { include: { user: true } }, internship: true },
            orderBy: { createdAt: 'desc' }
        });

        // Parse desired columns
        let selectedCols = [];
        if (columns) {
            selectedCols = columns.split(',');
        } else {
            selectedCols = ['trackingId', 'name', 'email', 'college', 'cgpa', 'status']; // default
        }

        const workbook = new xl.Workbook();
        const worksheet = workbook.addWorksheet('Export Data');

        const colDefsMap = {
            trackingId: { header: 'Tracking ID', key: 'trackingId', width: 22 },
            name: { header: 'Full Name', key: 'name', width: 30 },
            email: { header: 'Email', key: 'email', width: 30 },
            phone: { header: 'Phone', key: 'phone', width: 15 },
            college: { header: 'College', key: 'college', width: 40 },
            branch: { header: 'Branch', key: 'branch', width: 20 },
            year: { header: 'Year', key: 'year', width: 8 },
            cgpa: { header: 'CGPA', key: 'cgpa', width: 8 },
            status: { header: 'Status', key: 'status', width: 20 },
            applied: { header: 'Applied On', key: 'applied', width: 20 },
            internshipTitle: { header: 'Program', key: 'internshipTitle', width: 35 },
            internshipDept: { header: 'Department', key: 'internshipDept', width: 20 }
        };

        const finalCols = [{ header: '#', key: 'no', width: 5 }];
        selectedCols.forEach(c => {
            if (colDefsMap[c]) finalCols.push(colDefsMap[c]);
        });
        
        worksheet.columns = finalCols;

        // Styling
        worksheet.getRow(1).font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003087' } };

        applications.forEach((app, idx) => {
            const s = app.student;
            const r = { no: idx + 1 };
            
            if (selectedCols.includes('trackingId')) r.trackingId = app.trackingId;
            if (selectedCols.includes('name')) r.name = s?.fullName || '';
            if (selectedCols.includes('email')) r.email = s?.user?.email || '';
            if (selectedCols.includes('phone')) r.phone = s?.phone || '';
            if (selectedCols.includes('college')) r.college = s?.collegeName || '';
            if (selectedCols.includes('branch')) r.branch = s?.branch || '';
            if (selectedCols.includes('year')) r.year = s?.yearOfStudy || '';
            if (selectedCols.includes('cgpa')) r.cgpa = s?.cgpa || '';
            if (selectedCols.includes('status')) r.status = app.status;
            if (selectedCols.includes('applied')) r.applied = new Date(app.createdAt).toLocaleDateString();
            if (selectedCols.includes('internshipTitle')) r.internshipTitle = app.internship?.title || '';
            if (selectedCols.includes('internshipDept')) r.internshipDept = app.internship?.department || '';

            worksheet.addRow(r);
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Export_${new Date().getTime()}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Export Error:', error.message);
        res.status(500).json({ success: false, message: 'Export failed' });
    }
};

module.exports = { exportApplicationsGlobal };
