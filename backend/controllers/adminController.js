const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { autoShortlist } = require('../utils/shortlistingEngine');
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
            include: { student: true, documents: true },
            orderBy: { score: 'desc' }
        });
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update Scoring Weights
 * @route   PUT /api/v1/admin/config/weights
 * @access  Private (Admin)
 */
const updateWeights = async (req, res) => {
    try {
        const { collegeWeight, cgpaWeight, experienceWeight, nirfWeight } = req.body;

        // Ensure weights add up to 100
        const total = parseFloat(collegeWeight) + parseFloat(cgpaWeight) + parseFloat(experienceWeight) + parseFloat(nirfWeight);
        if (total !== 100) {
            return res.status(400).json({ success: false, message: 'Weights must add up to 100' });
        }

        // Upsert the single global rule record
        let rule = await prisma.automationRule.findFirst();

        if (rule) {
            rule = await prisma.automationRule.update({
                where: { id: rule.id },
                data: { collegeWeight, cgpaWeight, experienceWeight, nirfWeight }
            });
        } else {
            rule = await prisma.automationRule.create({
                data: { collegeWeight, cgpaWeight, experienceWeight, nirfWeight }
            });
        }

        res.status(200).json({ success: true, data: rule, message: 'Weights updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Scoring Weights
 * @route   GET /api/v1/admin/config/weights
 * @access  Private (Admin)
 */
const getWeights = async (req, res) => {
    try {
        const rule = await prisma.automationRule.findFirst();
        res.status(200).json({ success: true, data: rule });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Trigger Auto-Shortlist for an Internship
 * @route   POST /api/v1/admin/internships/:id/shortlist
 * @access  Private (Admin)
 */
const triggerShortlisting = async (req, res) => {
    try {
        const internshipId = req.params.id;

        const internship = await prisma.internship.findUnique({
            where: { id: internshipId }
        });

        if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });

        // Get all PENDING applications
        const applications = await prisma.application.findMany({
            where: { internshipId, status: 'PENDING' },
            include: { student: true, documents: true }
        });

        if (applications.length === 0) {
            return res.status(400).json({ success: false, message: 'No pending applications to shortlist' });
        }

        // Execute shortlisting engine (which internally expects .score property already populated at application time)
        const sortedDocs = applications.sort((a, b) => b.score - a.score); // Simple rank step

        const result = autoShortlist(sortedDocs, internship.openingsCount);

        // Update database: Top candidates stay PENDING for admin review, bottom candidates are REJECTED
        const rejectedIds = result.automaticallyRejected.map(app => app.id);
        const reviewIds = result.candidatesToReview.map(app => app.id);

        // This acts as the "70% automated shortlisting" gate
        await prisma.application.updateMany({
            where: { id: { in: rejectedIds } },
            data: { status: 'REJECTED' }
        });

        // The candidatesToReview are now SHORTLISTED (which meant manual review phase per prompt logic) 
        // Or we could leave them PENDING and let Admin SHORTLIST/HIRE them.
        await prisma.application.updateMany({
            where: { id: { in: reviewIds } },
            data: { status: 'SHORTLISTED' }
        });

        res.status(200).json({
            success: true,
            summary: {
                totalApplicationsProcessed: applications.length,
                automaticallyRejected: rejectedIds.length,
                shortlistedForReview: reviewIds.length
            }
        });
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
            include: { student: true, documents: true },
            orderBy: { score: 'desc' }
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
            { header: 'Score', key: 'score', width: 10 },
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
                score: app.score,
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
    updateWeights,
    getWeights,
    triggerShortlisting,
    updateApplicationStatus,
    exportApplications,
    getApplications
};
