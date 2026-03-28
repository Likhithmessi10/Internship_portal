const fs = require('fs').promises;
const path = require('path');

const fileValidator = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return next(); // No files to validate
        }

        // Use dynamic import for ES module 'file-type'
        const { fileTypeFromFile } = await import('file-type');

        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

        for (const file of req.files) {
            const type = await fileTypeFromFile(file.path);

            if (!type || !allowedExtensions.includes(type.ext) || !allowedMimeTypes.includes(type.mime)) {
                // Cleanup invalid files
                for (const f of req.files) {
                    if (await fs.access(f.path).then(() => true).catch(() => false)) {
                        await fs.unlink(f.path);
                    }
                }

                return res.status(400).json({
                    success: false,
                    message: 'Invalid file content detected. Only valid PDFs and images are allowed.'
                });
            }
        }

        // Pass to ClamAV malware scanner (if enabled)
        // The actual scanning happens in malwareScanMiddleware
        // This is just a placeholder for the flow
        if (process.env.CLAMAV_ENABLED === 'true') {
            req.clamavReady = true;
        }

        next();
    } catch (error) {
        console.error('File Validation Error:', error.message);

        // Cleanup on error
        if (req.files) {
            for (const f of req.files) {
                try {
                    await fs.unlink(f.path);
                } catch (unlinkError) {
                    console.error('Failed to delete file:', unlinkError.message);
                }
            }
        }

        res.status(500).json({ success: false, message: 'Server error during file validation.' });
    }
};

module.exports = fileValidator;
