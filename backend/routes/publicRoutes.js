const express = require('express');
const multer = require('multer');
const path = require('path');
const {
    submitApplication,
    trackStatus,
    getPublicInternships
} = require('../controllers/publicController');

const router = express.Router();

// Multer Config for Public Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const filetypes = /pdf/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (mextname && mimetype) return cb(null, true);
        cb(new Error('Only PDF files are allowed!'));
    }
});

router.get('/internships', getPublicInternships);
router.get('/track/:trackingId', trackStatus);
router.post('/apply', upload.any(), submitApplication);

module.exports = router;
