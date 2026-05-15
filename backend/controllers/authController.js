const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validatePassword } = require('../middleware/passwordValidator');
const { logFailedLogin, logSuccessfulLogin } = require('../utils/auditLogger');

const prisma = require('../lib/prisma');

// Generate Access Token
const generateAccessToken = (id, email, role, department, phone, name) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id, email, role, department, phone, name }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY || '2h'
    });
};

// Generate Refresh Token
const generateRefreshToken = (id, email, role, department, phone, name) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id, email, role, department, phone, name }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d'
    });
};

/**
 * @desc    Register a user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { password, role } = req.body;
        const email = req.body.email?.trim().toLowerCase();

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password does not meet requirements',
                errors: passwordValidation.errors
            });
        }

        // Check if user exists
        const exitingUser = await prisma.user.findUnique({ where: { email } });
        if (exitingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const allowedRoles = ['STUDENT', 'ADMIN', 'CE_PRTI', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'];
        const finalRole = allowedRoles.includes(role) ? role : 'STUDENT';

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: finalRole
            }
        });

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.email, user.role, user.department, user.phone, user.name);
        const refreshToken = generateRefreshToken(user.id, user.email, user.role, user.department, user.phone, user.name);

        res.status(201).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                department: user.department,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Register an Admin / Staff user
 * @route   POST /api/v1/auth/admin/register
 * @access  Public (or semi-private depending on setup)
 */
const registerAdmin = async (req, res) => {
    try {
        const { password, role, name, department, phone, designation, mentorField, mentorLocation } = req.body;
        const email = req.body.email?.trim().toLowerCase();

        if (!['ADMIN', 'CE_PRTI', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid admin role' });
        }

        // Validate password strength
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password does not meet requirements',
                errors: passwordValidation.errors
            });
        }

        const exitingUser = await prisma.user.findUnique({ where: { email } });
        if (exitingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role,
                name:           name           || null,
                department:     department     || null,
                phone:          phone          || null,
                designation:    designation    || null,
                mentorField:    mentorField    || null,
                mentorLocation: mentorLocation || null,
            }
        });

        const accessToken = generateAccessToken(user.id, user.email, user.role, user.department, user.phone, user.name);
        const refreshToken = generateRefreshToken(user.id, user.email, user.role, user.department, user.phone, user.name);

        res.status(201).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department,
                phone: user.phone
            }
        });
    } catch (error) {
        console.error('Admin registration error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
const login = async (req, res) => {
    try {
        const { password } = req.body;
        const email = req.body.email?.trim().toLowerCase();
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            await logFailedLogin(email, ipAddress, 'user_not_found');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            await logFailedLogin(email, ipAddress, 'invalid_password');
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate tokens
        const accessToken = generateAccessToken(user.id, user.email, user.role, user.department, user.phone, user.name);
        const refreshToken = generateRefreshToken(user.id, user.email, user.role, user.department, user.phone, user.name);

        // Log successful login
        await logSuccessfulLogin(email, ipAddress);

        res.status(200).json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                department: user.department,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Refresh access token using refresh token
 * @route   POST /api/v1/auth/refresh
 * @access  Public (requires valid refresh token)
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ success: false, message: 'Refresh token required' });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        
        // Verify user still exists
        const user = await prisma.user.findUnique({ 
            where: { id: decoded.id },
            select: { id: true, email: true, role: true, department: true, phone: true, name: true }
        });
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        // Generate new access token
        const newAccessToken = generateAccessToken(user.id, user.email, user.role, user.department, user.phone, user.name);

        res.status(200).json({
            success: true,
            accessToken: newAccessToken
        });
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Refresh token expired. Please log in again.',
                errorCode: 'REFRESH_TOKEN_EXPIRED'
            });
        }
        console.error('Token refresh error:', err);
        res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: { id: true, email: true, role: true, department: true, name: true, phone: true, designation: true, mentorField: true, mentorLocation: true, photoUrl: true, createdAt: true }
        });

        res.status(200).json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Reset password
 * @route   PUT /api/v1/auth/reset-password
 * @access  Private
 */
const resetPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Current and new passwords are required' });
        }

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' });
        }

        // Validate new password strength
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({ 
                success: false, 
                message: 'New password does not meet requirements',
                errors: passwordValidation.errors
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password reset error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update user profile (Name and Photo)
 * @route   PUT /api/v1/auth/update-profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
    try {
        const { name, phone, designation, mentorField, mentorLocation } = req.body;
        const updateData = {};

        if (name !== undefined) updateData.name = name;
        if (phone !== undefined) updateData.phone = phone;
        if (designation !== undefined) updateData.designation = designation;
        if (mentorField !== undefined) updateData.mentorField = mentorField;
        if (mentorLocation !== undefined) updateData.mentorLocation = mentorLocation;

        if (req.file) {
            updateData.photoUrl = `uploads/${req.file.filename}`;
        }

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: { id: true, email: true, role: true, department: true, name: true, photoUrl: true, phone: true, designation: true, mentorField: true, mentorLocation: true }
        });

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: user
        });
    } catch (error) {
        console.error('Update profile error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    register,
    registerAdmin,
    login,
    refreshToken,
    getMe,
    resetPassword,
    updateProfile
};
