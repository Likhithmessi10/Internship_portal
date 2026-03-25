const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Generate Token
const getSignedJwtToken = (id, role, department) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }
    return jwt.sign({ id, role, department }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

/**
 * @desc    Register a user
 * @route   POST /api/v1/auth/register
 * @access  Public
 */
const register = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Check if user exists
        const exitingUser = await prisma.user.findUnique({ where: { email } });
        if (exitingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        // SECURITY FIX: Never allow role from body in public registration
        // Default to STUDENT. Admin creation should be a separate, restricted route.
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: 'STUDENT'
            }
        });

        // Create token
        const token = getSignedJwtToken(user.id, user.role, user.department);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error(error);
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
        const { email, password, role, name, department } = req.body;

        if (!['ADMIN', 'CE_PRTI', 'HOD', 'MENTOR', 'COMMITTEE_MEMBER'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid admin role' });
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
                name: name || null,
                department: department || null
            }
        });

        const token = getSignedJwtToken(user.id, user.role, user.department);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error(error);
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
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Create token
        const token = getSignedJwtToken(user.id, user.role, user.department);

        res.status(200).json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
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
            select: { id: true, email: true, role: true, department: true, createdAt: true }
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

module.exports = {
    register,
    registerAdmin,
    login,
    getMe
};
