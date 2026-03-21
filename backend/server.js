const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const { PrismaClient } = require('@prisma/client');
const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;

// CORS: Restrict to allowed origins from env (comma-separated list)
// In .env set: CORS_ORIGINS=http://YOUR_SERVER_IP:5173,http://YOUR_SERVER_IP:5174
const DEV_ORIGINS = [
    'http://localhost:5173', // Student frontend
    'http://localhost:5174', // Admin portal
    'http://localhost:3000', // Generic dev
];

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : DEV_ORIGINS;

console.log('[CORS] Allowed origins:', allowedOrigins);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error(`CORS: Origin ${origin} not allowed`));
        }
    },
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve Static Portal (Student Side)
app.use(express.static(path.join(__dirname, '../')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../aptransco_portal.html'));
});

// Serve Uploaded Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate Limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' }
});
app.use('/api/', limiter);

// Import Routes
const authRoutes = require('./routes/authRoutes');
const studentRoutes = require('./routes/studentRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const collegeRoutes = require('./routes/colleges');
const errorHandler = require('./middleware/errorHandler');

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/students', studentRoutes); // Still here for backward compat/admin use
app.use('/api/v1/internships', internshipRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);
app.use('/api/v1/colleges', collegeRoutes); // Changed from /api/v1/public to /api/v1/colleges

// Global Error Handler Middleware
app.use(errorHandler);

const startServer = async () => {
    try {
        await prisma.$connect();
        console.log('Connected to PostgreSQL Database via Prisma');
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;
