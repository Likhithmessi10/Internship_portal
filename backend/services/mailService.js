const axios = require('axios');
const templates = require('./emailTemplates');

const NO_REPLY_URL    = process.env.EMAIL_SERVICE_URL || process.env.EMAIL_API_URL || 'https://aptrservice.aptransco.gov.in/api/noreply';
const EMAIL_API_KEY   = process.env.EMAIL_API_KEY || '';
const EMAIL_KEY_HEADER = process.env.EMAIL_API_KEY_HEADER || 'X-API-Key';

const SKIP_DOMAINS = ['@example.com', '@aptransco.portal', '@test.com', '@localhost'];

if (!EMAIL_API_KEY) {
    console.warn('[mailService] EMAIL_API_KEY is not set — outbound emails will be skipped. Set it in your environment or .env file.');
}

const sendEmail = async (to, subject, html) => {
    if (!to || SKIP_DOMAINS.some(d => to.endsWith(d))) return null;
    if (!EMAIL_API_KEY) {
        console.warn(`[mailService] Skipping email to ${to}: EMAIL_API_KEY not configured.`);
        return null;
    }

    try {
        // The upstream API expects multipart/form-data with the auth key in a header.
        const FormData = require('form-data');
        const fd = new FormData();
        fd.append('to', to);
        fd.append('subject', subject);
        fd.append('body', html);

        const response = await axios.post(NO_REPLY_URL, fd, {
            headers: {
                ...fd.getHeaders(),
                [EMAIL_KEY_HEADER]: EMAIL_API_KEY,
            },
            timeout: 10000,
        });
        console.log(`Email sent to ${to}: ${response.status}`);
        return response.data;
    } catch (error) {
        const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
        console.error(`Failed to send email to ${to}: ${detail}`);
        return null; // never throw — email is non-critical
    }
};

// ── Typed senders (use these instead of raw sendEmail where possible) ─────────

const sendShortlistingEmail = (to, data) => {
    const { subject, html } = templates.shortlistingEmail(data);
    return sendEmail(to, subject, html);
};

const sendSelectionEmail = (to, data) => {
    const { subject, html } = templates.selectionEmail(data);
    return sendEmail(to, subject, html);
};

const sendHiringEmail = (to, data) => {
    const { subject, html } = templates.hiringEmail(data);
    return sendEmail(to, subject, html);
};

const sendRejectionEmail = (to, data) => {
    const { subject, html } = templates.rejectionEmail(data);
    return sendEmail(to, subject, html);
};

const sendDocumentRequestEmail = (to, data) => {
    const { subject, html } = templates.documentRequestEmail(data);
    return sendEmail(to, subject, html);
};

const sendPrtiApprovedHodEmail = (to, data) => {
    const { subject, html } = templates.prtiApprovedHodEmail(data);
    return sendEmail(to, subject, html);
};

const sendGrandJoiningLetter = (to, data) => {
    const { subject, html } = templates.grandJoiningLetterEmail(data);
    return sendEmail(to, subject, html);
};

const sendHodGroupNotification = (to, data) => {
    const { subject, html } = templates.hodGroupNotificationEmail(data);
    return sendEmail(to, subject, html);
};

// ── Legacy helpers (kept for backwards compat) ────────────────────────────────
const notifyMentorAssignment = (mentor, student, internship) =>
    sendEmail(
        mentor.email,
        `New Internship Assignment — ${internship.title}`,
        `<p>Dear ${mentor.name},</p><p>You have been assigned as mentor for <strong>${student.fullName}</strong> in <strong>${internship.title}</strong>.</p><p>Best Regards,<br>APTRANSCO Internship Cell</p>`
    );

const notifyWorkAssignment = (studentEmail, studentName, mentorName, workTitle, description) =>
    sendEmail(
        studentEmail,
        `New Work Assigned: ${workTitle}`,
        `<p>Hello ${studentName},</p><p>Your mentor <strong>${mentorName}</strong> has assigned you: <strong>${workTitle}</strong></p><p>${description}</p><p>Best Regards,<br>APTRANSCO</p>`
    );

const notifyPrtiInternshipCreated = (to, data) => {
    const { subject, html } = templates.internshipCreatedPrtiEmail(data);
    return sendEmail(to, subject, html);
};

const notifyPrtiJoiningIn5Days = (to, data) => {
    const { subject, html } = templates.joiningReminderPrtiEmail(data);
    return sendEmail(to, subject, html);
};

module.exports = {
    sendEmail,
    sendShortlistingEmail,
    sendSelectionEmail,
    sendHiringEmail,
    sendRejectionEmail,
    sendDocumentRequestEmail,
    sendPrtiApprovedHodEmail,
    sendGrandJoiningLetter,
    sendHodGroupNotification,
    notifyMentorAssignment,
    notifyWorkAssignment,
    notifyPrtiInternshipCreated,
    notifyPrtiJoiningIn5Days,
};
