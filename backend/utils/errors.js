/**
 * Base Application Error class
 */
class AppError extends Error {
    constructor(message, statusCode, errorCode = 'INTERNAL_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends AppError {
    constructor(message, errors = []) {
        super(message, 400, 'VALIDATION_ERROR');
        this.errors = errors;
    }
}

class AuthError extends AppError {
    constructor(message = 'Not authorized') {
        super(message, 401, 'AUTH_ERROR');
    }
}

class ForbiddenError extends AppError {
    constructor(message = 'Forbidden') {
        super(message, 403, 'FORBIDDEN_ERROR');
    }
}

class NotFoundError extends AppError {
    constructor(message = 'Resource not found') {
        super(message, 404, 'NOT_FOUND');
    }
}

class ConflictError extends AppError {
    constructor(message = 'Conflict detected') {
        super(message, 409, 'CONFLICT');
    }
}

module.exports = {
    AppError,
    ValidationError,
    AuthError,
    ForbiddenError,
    NotFoundError,
    ConflictError
};
