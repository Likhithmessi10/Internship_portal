const helmet = require('helmet');

/**
 * Security Headers Configuration
 * Uses Helmet.js to set various HTTP headers for security
 */
const securityHeaders = helmet({
    // Content Security Policy - Controls what resources can load
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
            fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https://cdn.jsdelivr.net'],
            imgSrc: ["'self'", 'data:', 'https:'],
            scriptSrc: ["'self'"],
            connectSrc: ["'self'"],
            frameSrc: ["'self'"],
            frameAncestors: ["'self'", 'http://localhost:5173', 'http://localhost:5174'],
            objectSrc: ["'none'"],
            upgradeInsecureRequests: [],
        },
    },
    
    // Prevent clickjacking attacks (superseded by frame-ancestors but kept for safety)
    frameguard: false,
    
    // Prevent MIME type sniffing
    noSniff: true,
    
    // XSS Protection for older browsers
    xssFilter: true,
    
    // Referrer Policy
    referrerPolicy: {
        policy: 'strict-origin-when-cross-origin'
    },
    
    // HSTS - Force HTTPS (enable in production)
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    
    // Hide X-Powered-By header
    hidePoweredBy: true,
    
    // DNS Prefetch Control
    dnsPrefetchControl: {
        allow: false
    },
    
    // IE Edge mode
    ieNoOpen: true,
    
    // Permitted Cross-Origin Policies
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
});

module.exports = securityHeaders;
