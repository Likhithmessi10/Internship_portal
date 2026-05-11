const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const fileValidator = require('../middleware/fileValidator');
const { uploadLimiter, otpLimiter, generalLimiter } = require('../middleware/rateLimiter');
const {
    submitApplication,
    trackStatus,
    getPublicInternships,
    generateOtp,
    verifyOtp,
    searchColleges,
    getCollegeByCode
} = require('../controllers/publicController');

const router = express.Router();

router.post('/otp/generate', otpLimiter, generateOtp);
router.post('/otp/verify', otpLimiter, verifyOtp);
router.get('/internships', generalLimiter, getPublicInternships);
router.get('/track/:trackingId', generalLimiter, trackStatus);

// Public application upload with rate limiting, file validation, and malware scan
router.post('/apply', uploadLimiter, upload.any(), fileValidator, submitApplication);

// College Search
router.get('/colleges', searchColleges);
router.get('/colleges/:code', getCollegeByCode);

router.get('/health/docling', async (req, res) => {
    try {
        const DOCLING_MATCH_URL = process.env.DOCLING_MATCH_URL || 'http://127.0.0.1:8000/match';
        const baseUrl = new URL(DOCLING_MATCH_URL).origin;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        
        try {
            const response = await fetch(baseUrl, { signal: controller.signal });
            res.json({ success: true, status: response.ok ? 'online' : 'unreachable' });
        } catch (e) {
            res.json({ success: true, status: 'offline' });
        } finally {
            clearTimeout(timeout);
        }
    } catch (err) {
        res.json({ success: false, status: 'error' });
    }
});

module.exports = router;
