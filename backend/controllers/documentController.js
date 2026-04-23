const prisma = require('../lib/prisma');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Securely download an uploaded document
 * @route   GET /api/v1/common/documents/:id
 * @access  Private (Authenticated)
 */
const downloadDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;

        // 1. Find document metadata
        const document = await prisma.document.findUnique({
            where: { id },
            include: { application: { include: { internship: true } } }
        });

        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        // 2. Authorization Check
        let isAuthorized = false;

        if (user.role === 'ADMIN' || user.role === 'CE_PRTI') {
            isAuthorized = true;
        } else if (user.role === 'HOD' || user.role === 'COMMITTEE_MEMBER' || user.role === 'MENTOR') {
            // Check department match
            if (user.department === document.application.internship.department) {
                isAuthorized = true;
            }
        } else if (user.role === 'STUDENT') {
            const student = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
            if (student && document.application.studentId === student.id) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this document' });
        }

        // 3. Serve file
        // doc.url might be "uploads/abc.pdf" or just "abc.pdf"
        const cleanPath = document.url.replace(/^uploads[\\\/]/, '');
        const filePath = path.resolve(__dirname, '../../uploads', cleanPath);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Physical file not found on server' });
        }

        res.sendFile(filePath);
    } catch (error) {
        console.error('[Document Access Error]', error.message);
        res.status(500).json({ success: false, message: 'Failed to access document' });
    }
};

module.exports = { downloadDocument };
