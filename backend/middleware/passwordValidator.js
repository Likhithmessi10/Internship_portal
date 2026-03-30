/**
 * Password Validation Utility
 * Enforces password requirements based on environment config
 */

/**
 * Validates password strength based on configured requirements
 * @param {string} password - The password to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
const validatePassword = (password) => {
    const errors = [];

    // Minimum length check (development friendly)
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 6;
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }

    // Uppercase requirement (only if enabled in env)
    if (process.env.PASSWORD_REQUIRE_UPPERCASE === 'true') {
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
    }

    // Number requirement (only if enabled in env)
    if (process.env.PASSWORD_REQUIRE_NUMBER === 'true') {
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
    }

    // Special character requirement (only if enabled in env)
    if (process.env.PASSWORD_REQUIRE_SPECIAL === 'true') {
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
    }

    // Check for common weak passwords (only in development if very short)
    if (password.length < 6) {
        const weakPasswords = ['password', '12345', '123456', 'qwerty', 'admin'];
        if (weakPasswords.includes(password.toLowerCase())) {
            errors.push('Password is too common/weak');
        }
    }

    // Skip sequential and repetition checks in development for easier testing

    return {
        valid: errors.length === 0,
        errors
    };
};

/**
 * Middleware to validate password in request body
 */
const passwordValidator = (req, res, next) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Password is required'
        });
    }

    const validation = validatePassword(password);

    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            message: 'Password does not meet requirements',
            errors: validation.errors
        });
    }

    next();
};

module.exports = {
    validatePassword,
    passwordValidator
};
