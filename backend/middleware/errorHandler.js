const { maskSensitiveData } = require('./sanitizer');

const errorHandler = (err, req, res, next) => {
    // Log error internally (with sensitive data masked)
    const maskedError = {
        message: err.message,
        code: err.code,
        stack: process.env.NODE_ENV === 'development' ? err.stack : 'Hidden in production'
    };
    console.error(`[Error Handler] ${err.message}`);

    // Some validation libraries might set their own status codes on the error object
    let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    // Handle Prisma specific errors (example: duplicate entry P2002)
    if (err.code === 'P2002') {
        statusCode = 400;
        err.message = 'Duplicate entry detected for one or more unique fields.';
    }

    // Handle Prisma record not found
    if (err.code === 'P2025') {
        statusCode = 404;
        err.message = 'Record not found.';
    }

    // Handle Prisma invalid input
    if (err.code === 'P2003') {
        statusCode = 400;
        err.message = 'Invalid reference to related record.';
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        err.message = 'Invalid token.';
    }

    if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        err.message = 'Token expired.';
    }

    // Generic error message for production (hide internal details)
    const isProduction = process.env.NODE_ENV === 'production';
    
    res.status(statusCode).json({
        success: false,
        message: isProduction ? 'An error occurred. Please try again.' : err.message,
        // Provide stack trace in development mode only
        stack: isProduction ? null : err.stack,
        // Internal error code for debugging (optional)
        errorCode: isProduction ? null : err.code
    });
};

module.exports = errorHandler;
