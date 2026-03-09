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
        const filetypes = /pdf|jpg|jpeg|png/;
        const extnameMatch = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetypeMatch = filetypes.test(file.mimetype);
        if (extnameMatch && mimetypeMatch) return cb(null, true);
        cb(new Error('Only PDF and image files are allowed!'));
    }
});

router.get('/internships', getPublicInternships);
router.get('/track/:trackingId', trackStatus);
router.post('/apply', upload.any(), submitApplication);

module.exports = router;
