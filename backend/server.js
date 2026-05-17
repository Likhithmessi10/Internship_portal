const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = require('./lib/prisma');
const PORT = process.env.PORT || 5001;

// Trust Nginx proxy for correct IP tracking
app.set('trust proxy', 1);

// ============================================
// SECURITY MIDDLEWARE
// ============================================
const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : '*';
app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const { sanitizeInput } = require('./middleware/sanitizer');
app.use(sanitizeInput);

const { generalLimiter } = require('./middleware/rateLimiter');
app.use('/api/v1', generalLimiter);

// ============================================
// API ROUTES
// ============================================
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const prtiRoutes = require('./routes/prtiRoutes');
const mentorRoutes = require('./routes/mentorRoutes');
const commonRoutes = require('./routes/commonRoutes');
const errorHandler = require('./middleware/errorHandler');

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/common', commonRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/internships', internshipRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/prti', prtiRoutes);
app.use('/api/v1/mentor', mentorRoutes);

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
// ── Daily job: email PRTI for interns joining in 5 days ──────────────────────
const { notifyPrtiJoiningIn5Days } = require('./services/mailService');

const runJoiningReminders = async () => {
    try {
        const target = new Date();
        target.setDate(target.getDate() + 5);
        const dayStart = new Date(target); dayStart.setHours(0, 0, 0, 0);
        const dayEnd   = new Date(target); dayEnd.setHours(23, 59, 59, 999);

        const apps = await prisma.application.findMany({
            where: {
                joiningDate: { gte: dayStart, lte: dayEnd },
                status: { in: ['HIRED', 'ONGOING'] },
            },
            include: {
                student: { select: { fullName: true } },
                internship: { select: { title: true } },
                field:      { select: { fieldName: true } },
            }
        });

        if (apps.length === 0) return;

        const prtiUsers = await prisma.user.findMany({ where: { role: 'CE_PRTI' }, select: { email: true } });
        for (const u of prtiUsers) {
            for (const app of apps) {
                notifyPrtiJoiningIn5Days(u.email, {
                    studentName:      app.student?.fullName || 'Unknown',
                    internshipTitle:  app.internship?.title || 'Unknown',
                    joiningDate:      app.joiningDate,
                    fieldName:        app.field?.fieldName,
                    location:         app.preferredLocation,
                }).catch(() => {});
            }
        }
        console.log(`📧 Joining reminders sent for ${apps.length} intern(s).`);
    } catch (err) {
        console.error('Joining reminder job error:', err.message);
    }
};

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('✅ Connected to PostgreSQL Database via Prisma');

        // Run joining reminder check immediately and then every 24 hours
        runJoiningReminders();
        setInterval(runJoiningReminders, 24 * 60 * 60 * 1000);

        app.listen(PORT, () => {
            console.log(`🚀 Server listening on port ${PORT}`);
            console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error.message);
        process.exit(1);
    }
}

// Only start HTTP server when run directly — not when imported by tests
if (require.main === module) {
    startServer();
} else {
    // Tests import this file; just connect Prisma, no port binding
    prisma.$connect().catch(err => console.error('Prisma connect error:', err.message));
}

module.exports = app;
