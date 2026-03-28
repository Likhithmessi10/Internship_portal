const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Helmet.js Security Headers
const securityHeaders = require('./middleware/securityHeaders');
app.use(securityHeaders);

// CORS: Restrict to allowed origins from env (comma-separated list)
const DEV_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
];

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : DEV_ORIGINS;

console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true
}));

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// XSS Protection (global sanitization) - Moved after body parsing
const { sanitizeInput } = require('./middleware/sanitizer');
app.use(sanitizeInput);

// ============================================
// REQUEST LOGGING (Morgan)
// ============================================
const morgan = require('morgan');
const logFormat = process.env.MORGAN_LOG_FORMAT || 'dev';
app.use(morgan(logFormat, {
    skip: (req, res) => {
        // Skip logging for health checks and static files
        return req.path === '/health' || req.path.startsWith('/uploads/');
    }
}));

// ============================================
// RATE LIMITING
// ============================================
const { generalLimiter } = require('./middleware/rateLimiter');
app.use('/api/', generalLimiter);

// ============================================
// STATIC FILES
// ============================================

// Serve Static Portal (Student Side)
app.use(express.static(path.join(__dirname, '../')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../aptransco_portal.html'));
});

// Serve Uploaded Files (SECURED - requires authentication)
const { protect } = require('./middleware/authMiddleware');
app.use('/uploads', protect, express.static(path.join(__dirname, 'uploads')));

// ============================================
// API ROUTES
// ============================================
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const collegeRoutes = require('./routes/colleges');
const errorHandler = require('./middleware/errorHandler');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/internships', internshipRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/colleges', collegeRoutes);

// Health check endpoint (no auth required)
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Global Error Handler Middleware
app.use(errorHandler);

// ============================================
// SERVER STARTUP
// ============================================
const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL Database via Prisma');
        
        app.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();

module.exports = app;
