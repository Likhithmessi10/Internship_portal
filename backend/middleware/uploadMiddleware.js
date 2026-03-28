const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { malwareScanMiddleware } = require('./clamav');

// Configure Local Storage to `uploads/` folder
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        // Create unique string for filename
        const uniqueSuffix = crypto.randomBytes(16).toString('hex');
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

// File validation
const fileFilter = (req, file, cb) => {
    // allow PDF and common image types
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and image files (JPEG/PNG) are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    },
    fileFilter: fileFilter
});

/**
 * Upload middleware with malware scanning
 * Use this instead of upload.any() directly
 * Usage: upload.fields([...]), malwareScan
 */
const uploadWithScan = {
    any: () => [upload.any(), malwareScanMiddleware],
    fields: (fields) => [upload.fields(fields), malwareScanMiddleware],
    single: (name) => [upload.single(name), malwareScanMiddleware],
    array: (name, maxCount) => [upload.array(name, maxCount), malwareScanMiddleware]
};

module.exports = uploadWithScan;
