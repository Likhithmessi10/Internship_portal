const rateLimit = require('express-rate-limit');

// General API rate limiter
// 100 requests per 15 minutes
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
// 7 failed attempts per 15 minutes (brute force protection)
// Only counts FAILED attempts, and tracks by email (not IP to avoid IPv6 bypass issues)
const authLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 7,
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Only count failed requests
    skipSuccessfulRequests: true,
    // Create unique key per email to track attempts independently per user
    keyGenerator: (req, res) => {
        const email = req.body?.email || 'unknown';
        return email.toLowerCase().trim();
    },
});

// Upload rate limiter
// 20 requests per hour (prevent storage abuse)
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: {
        success: false,
        message: 'Too many file uploads, please try again after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    generalLimiter,
    authLimiter,
    uploadLimiter
};
