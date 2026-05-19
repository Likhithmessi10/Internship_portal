const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { malwareScanMiddleware } = require('./clamav');
const fileValidator = require('./fileValidator');

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
    // allow PDF, common image types, and Excel files
    const allowedMimeTypes = [
        'application/pdf', 
        'image/jpeg', 
        'image/png', 
        'image/jpg',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, image files (JPEG/PNG), and Excel files (XLS/XLSX) are allowed!'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    },
    fileFilter: fileFilter
});

const enforcePerFieldLimits = (req, res, next) => {
    // Define field-specific limits (e.g. photo <= 500KB, default 5MB)
    const fieldLimits = {
        photo: 500 * 1024,
        signature: 500 * 1024,
        document: 5 * 1024 * 1024,
        resume: 2 * 1024 * 1024
    };

    const files = req.file ? [req.file] : req.files ? (Array.isArray(req.files) ? req.files : Object.values(req.files).flat()) : [];
    
    for (const file of files) {
        const limit = fieldLimits[file.fieldname] || 5 * 1024 * 1024;
        if (file.size > limit) {
            return res.status(400).json({ success: false, message: `File size for ${file.fieldname} exceeds the limit.` });
        }
    }
    next();
};

/**
 * Upload middleware with malware scanning
 * Use this instead of upload.any() directly
 * Usage: upload.fields([...]), malwareScan
 */
const uploadWithScan = {
    any: () => [upload.any(), enforcePerFieldLimits, fileValidator, malwareScanMiddleware],
    fields: (fields) => [upload.fields(fields), enforcePerFieldLimits, fileValidator, malwareScanMiddleware],
    single: (name) => [upload.single(name), enforcePerFieldLimits, fileValidator, malwareScanMiddleware],
    array: (name, maxCount) => [upload.array(name, maxCount), enforcePerFieldLimits, fileValidator, malwareScanMiddleware]
};

module.exports = uploadWithScan;
