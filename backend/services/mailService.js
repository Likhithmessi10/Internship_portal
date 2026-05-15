const axios = require('axios');
const templates = require('./emailTemplates');

const NO_REPLY_URL = process.env.EMAIL_SERVICE_URL || 'https://aptrservice.aptransco.gov.in/api/noreply';

const SKIP_DOMAINS = ['@example.com', '@aptransco.portal', '@test.com', '@localhost'];

const sendEmail = async (to, subject, html) => {
    if (!to || SKIP_DOMAINS.some(d => to.endsWith(d))) return null;

    try {
        const response = await axios.post(NO_REPLY_URL, { to, subject, body: html });
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
    sendHodGroupNotification,
    notifyMentorAssignment,
    notifyWorkAssignment,
    notifyPrtiInternshipCreated,
    notifyPrtiJoiningIn5Days,
};
