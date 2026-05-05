const { maskSensitiveData } = require('./sanitizer');

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'An error occurred. Please try again.';
    let errorCode = err.errorCode || 'INTERNAL_ERROR';
    let errors = err.errors || null;

    // Log error internally (with stack trace in dev)
    if (process.env.NODE_ENV === 'development') {
        console.error(`[Error Handler] ${err.stack}`);
    } else {
        console.error(`[Error Handler] ${err.message}`);
    }

    // Handle Prisma specific errors (duplicate entry P2002)
    if (err.code === 'P2002') {
        statusCode = 400;
        message = 'Duplicate entry detected for one or more unique fields.';
        errorCode = 'DUPLICATE_ENTRY';
    }

    // Handle Prisma record not found
    if (err.code === 'P2025') {
        statusCode = 404;
        message = 'Record not found.';
        errorCode = 'NOT_FOUND';
    }

    // Handle Prisma invalid input
    if (err.code === 'P2003') {
        statusCode = 400;
        message = 'Invalid reference to related record.';
        errorCode = 'INVALID_REFERENCE';
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token.';
        errorCode = 'INVALID_TOKEN';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired.';
        errorCode = 'TOKEN_EXPIRED';
    }

    // Mask internal error messages in production unless they are operational errors
    const isProduction = process.env.NODE_ENV === 'production';
    const isOperational = err.isOperational || false;
    
    res.status(statusCode).json({
        success: false,
        message: isProduction && !isOperational ? 'An internal error occurred. Please try again.' : message,
        errorCode: errorCode,
        errors: errors,
        // Provide stack trace in development mode only
        stack: isProduction ? null : err.stack
    });
};

module.exports = errorHandler;
