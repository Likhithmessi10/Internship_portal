const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    apiUrl: process.env.EMAIL_API_URL || 'https://aptrservice.aptransco.gov.in/api/noreply',
    apiKey: process.env.EMAIL_API_KEY || 'NOVAC_MRZ',
    headerKey: 'X-API-Key',
    timeout: 10000
};

/**
 * Load and process an HTML template
 * @param {string} templateName - Name of the template file (e.g., 'template1.html')
 * @param {Object} placeholders - Key-value pairs for replacement
 * @returns {string} - Processed HTML string
 */
const getTemplate = (templateName, placeholders = {}) => {
    try {
        const filePath = path.join(__dirname, 'templates', templateName);
        let content = fs.readFileSync(filePath, 'utf8');

        // Replace placeholders: {{key}} -> value
        Object.entries(placeholders).forEach(([key, value]) => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            content = content.replace(regex, value || '');
        });

        return content;
    } catch (error) {
        console.error(`Error loading email template ${templateName}:`, error.message);
        return '';
    }
};

/**
 * Send an email via the external API
 */
const sendEmail = async ({ to, subject, body }) => {
    if (!to || !subject || !body) {
        throw new Error('Missing required fields: to, subject, and body are required');
    }

    const formData = new FormData();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('body', body);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

        const response = await fetch(CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                [CONFIG.headerKey]: CONFIG.apiKey
            },
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Email sending failed:', error.message);
        throw error;
    }
};

/**
 * High-level service methods for specific triggers
 */
const emailService = {
    /**
     * Send email when an application is submitted
     */
    sendApplicationReceived: async (to, name) => {
        const body = getTemplate('template1.html', { Applicant_Name: name });
        return sendEmail({
            to,
            subject: 'Application Received - APTRANSCO Internship Programme',
            body
        });
    },

    /**
     * Send email for status updates (HOD Review, Rejection, etc.)
     */
    sendStatusUpdate: async (to, name, status, note = '') => {
        const body = getTemplate('template2.html', { 
            Applicant_Name: name,
            Status_Note: note || `Your application status has been updated to: ${status}`
        });
        return sendEmail({
            to,
            subject: `Application Update: ${status}`,
            body
        });
    },

    /**
     * Send email when an interview is scheduled
     */
    sendInterviewScheduled: async (to, name, date, time, link) => {
        const body = getTemplate('template3.html', {
            Applicant_Name: name,
            Interview_Date: date,
            Interview_Time: time,
            Interview_Link: link
        });
        return sendEmail({
            to,
            subject: 'Interview Scheduled - APTRANSCO Internship Selection',
            body
        });
    },

    /**
     * Send email when an interview is passed (Hired)
     */
    sendInterviewPass: async (to, name) => {
        const body = getTemplate('template4.html', { Applicant_Name: name });
        return sendEmail({
            to,
            subject: 'Congratulations! You are selected for APTRANSCO Internship',
            body
        });
    },

    /**
     * Send email when an interview is failed
     */
    sendInterviewFail: async (to, name) => {
        const body = getTemplate('template2.html', { 
            Applicant_Name: name,
            Status_Note: 'We regret to inform you that you were not selected for the internship after the committee evaluation.'
        });
        return sendEmail({
            to,
            subject: 'Update on your Internship Application',
            body
        });
    }
};

module.exports = emailService;
