const fs = require('fs').promises;
const path = require('path');

const fileValidator = async (req, res, next) => {
    try {
        // Normalise req.file (single) and req.files (multi) into one array
        let files = [];
        if (req.files) {
            files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
        } else if (req.file) {
            files = [req.file];
        }
        if (files.length === 0) return next();

        // Use dynamic import for ES module 'file-type'
        const { fileTypeFromFile } = await import('file-type');

        const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
        const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];

        for (const file of files) {
            const type = await fileTypeFromFile(file.path);

            if (!type || !allowedExtensions.includes(type.ext) || !allowedMimeTypes.includes(type.mime)) {
                // Cleanup invalid files
                for (const f of files) {
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
        if (files.length > 0) {
            for (const f of files) {
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
