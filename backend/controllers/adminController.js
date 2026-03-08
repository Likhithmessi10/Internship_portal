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
        const { title, department, description, location, duration, openingsCount } = req.body;

        const internship = await prisma.internship.create({
            data: {
                title, department, description, location, duration, openingsCount: parseInt(openingsCount)
            }
        });

        res.status(201).json({ success: true, data: internship });
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
            include: { student: true, documents: true }
        });
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};



/**
 * @desc    Manually Update Application Status (Hire / Reject)
 * @route   PUT /api/v1/admin/applications/:id
 * @access  Private (Admin)
 */
const updateApplicationStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const app = await prisma.application.update({
            where: { id: req.params.id },
            data: { status }
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

        const applications = await prisma.application.findMany({
            where: { internshipId },
            include: { student: true, documents: true }
        });

        const workbook = new xl.Workbook();
        const worksheet = workbook.addWorksheet('Applications');

        worksheet.columns = [
            { header: 'Student Name', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 25 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'College', key: 'college', width: 30 },
            { header: 'CGPA', key: 'cgpa', width: 10 },
            { header: 'NIRF Rank', key: 'nirf', width: 10 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Resume URL', key: 'resume', width: 40 },
            { header: 'Principal Ltr URL', key: 'p_letter', width: 40 },
            { header: 'HOD Ltr URL', key: 'h_letter', width: 40 },
        ];

        for (const app of applications) {
            // Retrieve the related user email explicitly if needed via profile mapping or we assume profile has everything needed.
            // Our studentProfile doesn't have email natively (User table does).
            const user = await prisma.user.findUnique({ where: { id: app.student.userId } });

            const resumeDoc = app.documents.find(d => d.type === 'RESUME');
            const principalDoc = app.documents.find(d => d.type === 'PRINCIPAL_LETTER');
            const hodDoc = app.documents.find(d => d.type === 'HOD_LETTER');

            worksheet.addRow({
                name: app.student.fullName,
                email: user ? user.email : 'N/A',
                phone: app.student.phone,
                college: `${app.student.collegeName} (${app.student.collegeCategory})`,
                cgpa: app.student.cgpa,
                nirf: app.student.nirfRanking || 'N/A',
                status: app.status,
                resume: resumeDoc ? resumeDoc.url : 'Missing',
                p_letter: principalDoc ? principalDoc.url : 'Missing',
                h_letter: hodDoc ? hodDoc.url : 'Missing'
            });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=internship_export_${internshipId}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Export Failed' });
    }
};

module.exports = {
    createInternship,
    updateApplicationStatus,
    exportApplications,
    getApplications
};
