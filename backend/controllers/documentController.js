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

        // 2. Authorization Check (Least Privilege)
        let isAuthorized = false;

        if (user.role === 'ADMIN' || user.role === 'CE_PRTI') {
            isAuthorized = true;
        } else if (user.role === 'HOD' || user.role === 'COMMITTEE_MEMBER' || user.role === 'MENTOR') {
            // Strict Department Scoping
            if (user.department === document.application.internship.department) {
                isAuthorized = true;
            }
        } else if (user.role === 'STUDENT') {
            // Ownership check
            const student = await prisma.studentProfile.findUnique({ where: { userId: user.id } });
            if (student && document.application.studentId === student.id) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ success: false, message: 'Not authorized to access this document' });
        }

        // 3. SECURE FILE ACCESS & PATH VALIDATION
        const uploadsDir = path.resolve(__dirname, '../../uploads');
        // Ensure document.url is just the filename or relative path from uploads/
        const relativePath = document.url.replace(/^uploads[\\\/]/, '');
        const filePath = path.join(uploadsDir, relativePath);

        // PATH TRAVERSAL PROTECTION: Ensure the resolved path is still inside the uploads directory
        const normalizedPath = path.normalize(filePath);
        if (!normalizedPath.startsWith(uploadsDir)) {
            console.warn(`[Security Alert] Potential path traversal attempt by user ${user.email} for ID ${id}`);
            return res.status(400).json({ success: false, message: 'Invalid file path' });
        }

        if (!fs.existsSync(normalizedPath)) {
            return res.status(404).json({ success: false, message: 'Physical file not found on server' });
        }

        res.sendFile(normalizedPath);
    } catch (error) {
        console.error('[Document Access Error]', error.message);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};

module.exports = { downloadDocument };
