const path = require('path');
const fs = require('fs');
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
    'https://terrence-pseudoaggressive-undewily.ngrok-free.dev'
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

// Serve Static Files for the Student Portal (Specific files only)
// Note: It's better to serve the build directory in production.
const staticPath = path.join(__dirname, '../public'); // Create a public folder if it doesn't exist
if (!fs.existsSync(staticPath)) fs.mkdirSync(staticPath, { recursive: true });
app.use(express.static(staticPath));

// Secure File Route (Redirecting /uploads to our secure API soon)
// For now, keeping it limited to the exact subfolder
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================
// API ROUTES
// ============================================
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const collegeRoutes = require('./routes/colleges');
const prtiRoutes = require('./routes/prtiRoutes');
const commonRoutes = require('./routes/commonRoutes');
const errorHandler = require('./middleware/errorHandler');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/common', commonRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/internships', internshipRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/colleges', collegeRoutes);
app.use('/api/v1/prti', prtiRoutes);

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

        const { workerLoop } = require('./jobs/worker');
        workerLoop(); // Start background worker loop (no await as it's a daemon)

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
