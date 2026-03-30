const axios = require('axios');

const NO_REPLY_URL = process.env.EMAIL_SERVICE_URL || 'https://aptrservice.aptransco.gov.in/api/noreply';
const NO_REPLY_ATTACHMENT_URL = process.env.EMAIL_SERVICE_ATTACHMENT_URL || 'https://aptrservice.aptransco.gov.in/api/noreplyattachment';

/**
 * Send a simple email using APTRANSCO API
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} message - Email body (HTML supported usually)
 */
const sendEmail = async (to, subject, message) => {
    try {
        const response = await axios.post(NO_REPLY_URL, {
            to,
            subject,
            message
        });
        console.log(`Email sent to ${to}: ${response.status}`);
        return response.data;
    } catch (error) {
        console.error(`Failed to send email to ${to}:`, error.message);
        // We don't throw error to avoid breaking the main flow if email fails
        return null;
    }
};

/**
 * Notify mentor about new assignment
 */
const notifyMentorAssignment = async (mentor, student, internship) => {
    const subject = `New Internship Application Assigned - ${internship.title}`;
    const message = `
        <h3>Dear ${mentor.name},</h3>
        <p>You have been assigned as a mentor for the following intern application:</p>
        <ul>
            <li><strong>Intern Name:</strong> ${student.fullName}</li>
            <li><strong>Internship:</strong> ${internship.title}</li>
            <li><strong>Department:</strong> ${internship.department}</li>
        </ul>
        <p>Please log in to the APTRANSCO Internship Portal to review the application and manage the intern.</p>
        <p>Best Regards,<br>APTRANSCO Team</p>
    `;
    return sendEmail(mentor.email, subject, message);
};

/**
 * Notify intern about work assignment
 */
const notifyWorkAssignment = async (studentEmail, studentName, mentorName, workTitle, description) => {
    const subject = `New Work Assigned: ${workTitle}`;
    const message = `
        <h3>Hello ${studentName},</h3>
        <p>Your mentor, ${mentorName}, has assigned you a new task:</p>
        <div style="padding: 15px; background: #f4f4f4; border-radius: 5px;">
            <h4>${workTitle}</h4>
            <p>${description}</p>
        </div>
        <p>Please check your dashboard for more details.</p>
        <p>Best Regards,<br>APTRANSCO Team</p>
    `;
    return sendEmail(studentEmail, subject, message);
};

module.exports = {
    sendEmail,
    notifyMentorAssignment,
    notifyWorkAssignment
};
