const xss = require('xss');

/**
 * Input Sanitization Middleware
 * Protects against XSS attacks by sanitizing user input
 */

/**
 * Custom XSS filter options
 * Allows safe HTML tags for rich text fields
 */
const whiteList = {
    p: ['class'],
    br: [],
    strong: [],
    em: [],
    u: [],
    ol: ['class'],
    ul: ['class'],
    li: [],
    a: ['href', 'title', 'target'],
    b: []
};

/**
 * Sanitize a single string value
 */
const sanitizeString = (str, options = {}) => {
    if (typeof str !== 'string') return str;
    return xss(str, { whiteList, ...options });
};

/**
 * Middleware to sanitize request body
 */
const sanitizeInput = (req, res, next) => {
    // Skip if no body
    if (!req.body) {
        return next();
    }
    
    const fieldsToSanitize = ['fullName', 'address', 'experienceDesc', 'projectsDesc', 'skills', 'sop', 'description'];
    
    fieldsToSanitize.forEach(field => {
        if (req.body[field] !== undefined && req.body[field] !== null) {
            if (typeof req.body[field] === 'string') {
                req.body[field] = sanitizeString(req.body[field]);
            } else if (typeof req.body[field] === 'object') {
                // Recursively sanitize object values
                try {
                    req.body[field] = JSON.parse(sanitizeString(JSON.stringify(req.body[field])));
                } catch (e) {
                    // Skip if JSON parsing fails
                }
            }
        }
    });
    
    next();
};

/**
 * Sanitize HTML content that should be allowed
 * Use this for fields that need rich text (SOP, descriptions, etc.)
 */
const sanitizeHTML = (req, res, next) => {
    const fieldsToSanitize = ['sop', 'description', 'experienceDesc', 'projectsDesc', 'address'];
    
    fieldsToSanitize.forEach(field => {
        if (req.body[field] && typeof req.body[field] === 'string') {
            // Allow safe HTML tags
            req.body[field] = xss(req.body[field], { whiteList });
        }
    });
    
    next();
};

/**
 * Sanitize specific sensitive fields (log masking)
 * Use this to mask sensitive data before logging
 */
const maskSensitiveData = (data, fields = ['aadhar', 'phone', 'password', 'bankAccount', 'ifscCode']) => {
    const masked = { ...data };
    
    fields.forEach(field => {
        if (masked[field]) {
            const value = String(masked[field]);
            if (value.length > 4) {
                masked[field] = '*'.repeat(value.length - 4) + value.slice(-4);
            } else {
                masked[field] = '****';
            }
        }
    });
    
    return masked;
};

module.exports = {
    sanitizeInput,
    sanitizeHTML,
    maskSensitiveData,
    sanitizeString
};
