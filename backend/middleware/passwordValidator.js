/**
 * Password Validation Utility
 * Enforces strong password requirements
 */

/**
 * Validates password strength based on configured requirements
 * @param {string} password - The password to validate
 * @returns {object} - { valid: boolean, errors: string[] }
 */
const validatePassword = (password) => {
    const errors = [];
    
    // Minimum length check
    const minLength = parseInt(process.env.PASSWORD_MIN_LENGTH) || 8;
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    // Uppercase requirement
    if (process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false') {
        if (!/[A-Z]/.test(password)) {
            errors.push('Password must contain at least one uppercase letter');
        }
    }
    
    // Number requirement
    if (process.env.PASSWORD_REQUIRE_NUMBER !== 'false') {
        if (!/[0-9]/.test(password)) {
            errors.push('Password must contain at least one number');
        }
    }
    
    // Special character requirement
    if (process.env.PASSWORD_REQUIRE_SPECIAL !== 'false') {
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push('Password must contain at least one special character');
        }
    }
    
    // Check for common weak passwords
    const weakPasswords = ['password', '123456', '12345678', 'qwerty', 'admin123', 'password123'];
    if (weakPasswords.includes(password.toLowerCase())) {
        errors.push('Password is too common/weak');
    }
    
    // Check for excessive repetition
    if (/(.)\1{2,}/.test(password)) {
        errors.push('Password contains too many repeated characters');
    }
    
    // Check for sequential characters
    const sequentialPatterns = [
        /123|234|345|456|567|678|789|890/,
        /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz/i,
        /qwe|wer|ert|rty|tyu|yui|uio|op|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm/i
    ];
    
    for (const pattern of sequentialPatterns) {
        if (pattern.test(password.toLowerCase())) {
            errors.push('Password contains sequential characters');
            break;
        }
    }
    
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
