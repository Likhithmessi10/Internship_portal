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
 */
const sendOTP = async (destination, otp) => {
    // In a real application, you would integrate Twilio (SMS) or NodeMailer (Email) here.
    // For demonstration purposes, we are logging it to the console.
    console.log(`\n================================`);
    console.log(`🔐 OTP for ${destination} is: ${otp}`);
    console.log(`================================\n`);

    // Simulate async network delay
    return new Promise(resolve => setTimeout(resolve, 500));
};

module.exports = {
    generateOTP,
    sendOTP
};
