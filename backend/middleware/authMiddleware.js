const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
            return res.status(401).json({ success: false, message: 'Deleted or staled user account. Please log in again.' });
        }

        req.user = decoded; // { id, role }
        next();
    } catch (err) {
        return res.status(401).json({ success: false, message: 'Session expired or not authorized' });
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

module.exports = { protect, authorize };
