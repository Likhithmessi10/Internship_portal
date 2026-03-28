const crypto = require('crypto');

/**
 * Generates a 6-digit numeric OTP
 * @returns {string} 6-digit OTP
 */
const generateOTP = () => {
    // Generate a random number between 100000 and 999999
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Sends an OTP to a provided destination (email/phone)
 * @param {string} destination - Email or Phone number
 * @param {string} otp - The OTP to send
 * @returns {Promise<void>}
 * 
 * NOTE: In production, implement actual email/SMS delivery:
 * - Email: Use nodemailer with SMTP
 * - SMS: Use Twilio, AWS SNS, or similar service
 */
const sendOTP = async (destination, otp) => {
    // SECURITY: Never log OTPs in production!
    // This is a placeholder - implement actual delivery method
    
    // TODO: Implement email sending via nodemailer
    // TODO: Implement SMS sending via Twilio/AWS SNS
    
    // For development only - remove in production
    if (process.env.NODE_ENV === 'development') {
        console.log(`[DEV MODE] OTP for ${destination}: ${otp}`);
    }
    
    // Simulate async network delay
    return new Promise(resolve => setTimeout(resolve, 500));
};

module.exports = {
    generateOTP,
    sendOTP
};
