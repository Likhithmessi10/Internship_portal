const express = require('express');
const { getInternships, getInternshipDetails, applyForInternship } = require('../controllers/internshipController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const fileValidator = require('../middleware/fileValidator');
const { uploadLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', getInternships);
router.get('/:id', getInternshipDetails);

// Apply with file upload, validation, malware scan, and rate limiting
router.post('/:id/apply', 
    protect, 
    uploadLimiter,
    upload.any(), 
    fileValidator, 
    applyForInternship
);

module.exports = router;
