const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../lib/prisma');

/**
 * Protect route - Verify JWT access token
 */
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET missing in .env');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if user still exists in DB
        const user = await prisma.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            console.warn(`[Auth] User not found for ID: ${decoded.id}`);
            return res.status(401).json({ success: false, message: 'Deleted or staled user account. Please log in again.' });
        }

        req.user = decoded; // { id, role, department }
        next();
    } catch (err) {
        console.error('[Auth Error]', err.message);
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Session expired. Please refresh your token or log in again.',
                errorCode: 'TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({ success: false, message: 'Session expired or not authorized' });
    }
};

/**
 * Verify refresh token and issue new access token
 */
const verifyRefreshToken = async (req, res, next) => {
    let refreshToken;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        refreshToken = req.headers.authorization.split(' ')[1];
    }

    if (!refreshToken) {
        return res.status(401).json({ success: false, message: 'Refresh token required' });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Verify user still exists
        const user = await prisma.user.findUnique({ 
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, department: true }
        });
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Refresh token expired. Please log in again.',
                errorCode: 'REFRESH_TOKEN_EXPIRED'
            });
        }
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `User role ${req.user.role} is not authorized`
            });
        }
        next();
    };
};

module.exports = { protect, authorize, verifyRefreshToken };
