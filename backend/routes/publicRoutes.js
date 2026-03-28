const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const fileValidator = require('../middleware/fileValidator');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
    submitApplication,
    trackStatus,
    getPublicInternships,
    generateOtp,
    verifyOtp
} = require('../controllers/publicController');

const router = express.Router();

router.post('/otp/generate', generateOtp);
router.post('/otp/verify', verifyOtp);
router.get('/internships', getPublicInternships);
router.get('/track/:trackingId', trackStatus);

// Public application upload with rate limiting, file validation, and malware scan
router.post('/apply', uploadLimiter, upload.any(), fileValidator, submitApplication);

module.exports = router;
