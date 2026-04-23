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

// ============================================
// SECURITY MIDDLEWARE
// ============================================
app.use(cors({
    origin: '*', // Adjust as needed for production
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

const { sanitizeInput } = require('./middleware/sanitizer');
app.use(sanitizeInput);

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
