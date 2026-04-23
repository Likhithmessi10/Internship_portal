const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Create an audit log entry
 * @param {string} action - The action performed (e.g., 'CREATE_INTERNSHIP')
 * @param {string} userEmail - Email of the user who performed the action
 * @param {string} details - Additional details
 * @param {string} target - Target ID or reference
 * @param {string} ipAddress - IP address of the requester
 * @param {string} userAgent - User agent string
 */
const createAuditLog = async (action, userEmail, details = null, target = null, ipAddress = null, userAgent = null) => {
    try {
        let finalDetails = details;
        if (ipAddress) finalDetails = finalDetails ? `${finalDetails} | IP: ${ipAddress}` : `IP: ${ipAddress}`;
        if (userAgent) finalDetails = finalDetails ? `${finalDetails} | UA: ${userAgent}` : `UA: ${userAgent}`;

        await prisma.auditLog.create({
            data: {
                action,
                userEmail: userEmail || 'system@aptransco.portal',
                details: finalDetails,
                target
            }
        });
    } catch (error) {
        console.error('Audit Log Error:', error.message);
    }
};

/**
 * Log security events (failed logins, unauthorized access, etc.)
 * @param {string} eventType - Type of security event
 * @param {string} email - Email involved (if known)
 * @param {string} ipAddress - IP address
 * @param {object} metadata - Additional metadata
 */
const logSecurityEvent = async (eventType, email, ipAddress, metadata = {}) => {
    try {
        await prisma.auditLog.create({
            data: {
                action: `SECURITY_${eventType}`,
                userEmail: email || 'anonymous',
                details: JSON.stringify({
                    ipAddress,
                    timestamp: new Date().toISOString(),
                    ...metadata
                }),
                target: null
            }
        });
    } catch (error) {
        console.error('Security Log Error:', error.message);
    }
};

/**
 * Log failed login attempt
 */
const logFailedLogin = async (email, ipAddress, reason = 'invalid_credentials') => {
    return logSecurityEvent('FAILED_LOGIN', email, ipAddress, { reason });
};

/**
 * Log successful login
 */
const logSuccessfulLogin = async (email, ipAddress) => {
    return logSecurityEvent('LOGIN', email, ipAddress, { status: 'success' });
};

/**
 * Log unauthorized access attempt
 */
const logUnauthorizedAccess = async (email, ipAddress, resource, action) => {
    return logSecurityEvent('UNAUTHORIZED_ACCESS', email, ipAddress, { resource, action });
};

module.exports = { 
    createAuditLog, 
    logSecurityEvent,
    logFailedLogin,
    logSuccessfulLogin,
    logUnauthorizedAccess
};
