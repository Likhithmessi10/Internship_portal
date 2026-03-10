const errorHandler = (err, req, res, next) => {
    console.error(`[Error Handler] ${err.message}`);

    // Some validation libraries might set their own status codes on the error object
    let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    // Handle Prisma specific errors (example: duplicate entry P2002)
    if (err.code === 'P2002') {
        statusCode = 400;
        err.message = 'Duplicate entry detected for one or more unique fields.';
    }

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        // Provide stack trace in development mode only
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;
