// ── APTRANSCO Internship Portal — Email Templates ────────────────────────────
// Each function returns { subject, html } ready for mailService.sendEmail()

const BASE = `
<div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
  <div style="background:linear-gradient(135deg,#1e3a5f 0%,#1e40af 100%);padding:28px 32px;">
    <img src="https://aptransco.gov.in/img/logo.png" alt="APTRANSCO" style="height:40px;object-fit:contain;" onerror="this.style.display='none'"/>
    <h1 style="color:#ffffff;margin:12px 0 0;font-size:20px;font-weight:700;letter-spacing:0.5px;">APTRANSCO Internship Portal</h1>
  </div>
  <div style="padding:32px;">
    {{BODY}}
  </div>
  <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
    <p style="color:#9ca3af;font-size:11px;margin:0;">This is an automated email from APTRANSCO Internship Portal. Please do not reply.</p>
    <p style="color:#9ca3af;font-size:11px;margin:4px 0 0;">© ${new Date().getFullYear()} AP Transmission Corporation Limited</p>
  </div>
</div>`;

const wrap = (body) => BASE.replace('{{BODY}}', body);

const pill = (text, color = '#1e40af') =>
    `<span style="display:inline-block;background:${color}10;color:${color};border:1px solid ${color}30;border-radius:999px;padding:3px 12px;font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;">${text}</span>`;

const infoRow = (label, value) =>
    `<tr><td style="padding:8px 0;color:#6b7280;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;width:140px;">${label}</td><td style="padding:8px 0;color:#111827;font-size:13px;font-weight:700;">${value || '—'}</td></tr>`;

const btn = (label, url, color = '#1e40af') =>
    `<a href="${url}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:700;font-size:13px;letter-spacing:0.5px;">${label}</a>`;

// ── 1. Shortlisting ───────────────────────────────────────────────────────────
const shortlistingEmail = ({ studentName, internshipTitle, fieldName, department, portalUrl = 'https://aptransco.gov.in/intern' }) => ({
    subject: `Shortlisted — ${internshipTitle} | APTRANSCO Internship Portal`,
    html: wrap(`
        <p style="color:#374151;font-size:15px;">Dear <strong>${studentName}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Congratulations! Your application has been <strong>shortlisted</strong> for the following internship position.
            Your profile stood out and you have advanced to the next stage of the selection process.
        </p>
        <div style="margin:24px 0;padding:20px;background:#f0f9ff;border-left:4px solid #1e40af;border-radius:0 8px 8px 0;">
            <table style="width:100%;border-collapse:collapse;">
                ${infoRow('Programme', internshipTitle)}
                ${fieldName ? infoRow('Field', fieldName) : ''}
                ${department ? infoRow('Department', department) : ''}
                ${infoRow('Status', '🔵 Shortlisted')}
            </table>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Please log in to the portal regularly to check for any updates or further instructions from the department.
        </p>
        <div style="text-align:center;margin:28px 0;">
            ${btn('View Application Status', portalUrl)}
        </div>
        <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO Internship Cell</strong></p>
    `)
});

// ── 2. Selection confirmation (SELECTED) ─────────────────────────────────────
const selectionEmail = ({ studentName, internshipTitle, fieldName, location, portalUrl = 'https://aptransco.gov.in/intern' }) => ({
    subject: `Congratulations — You've Been Selected | APTRANSCO Internship`,
    html: wrap(`
        <p style="color:#374151;font-size:15px;">Dear <strong>${studentName}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Congratulations! You have been <strong>selected</strong> for the APTRANSCO Learning Internship Programme.
        </p>
        <div style="margin:24px 0;padding:20px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;">
            <table style="width:100%;border-collapse:collapse;">
                ${infoRow('Programme', internshipTitle)}
                ${fieldName ? infoRow('Field / Position', fieldName) : ''}
                ${location ? infoRow('Appointed Location', location) : ''}
                ${infoRow('Status', '✅ Selected')}
            </table>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Your selection is being reviewed by the PRTI office. Once confirmed, you will receive a separate email asking you to submit the required joining documents through the portal.
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Please keep the following ready in advance:
        </p>
        <ul style="color:#374151;font-size:13px;line-height:2;">
            <li>No Objection Certificate (NOC) from your institution</li>
            <li>Service Bond / Agreement</li>
            <li>Undertaking Form</li>
            <li>Any other documents specified by your HOD</li>
        </ul>
        <div style="text-align:center;margin:28px 0;">
            ${btn('View Your Application', portalUrl, '#16a34a')}
        </div>
        <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO Internship Cell</strong></p>
    `)
});

// ── 3. Hiring confirmation ────────────────────────────────────────────────────
const hiringEmail = ({ studentName, internshipTitle, fieldName, location, joiningDate, endDate, rollNumber, mentorName, portalUrl = 'https://aptransco.gov.in/intern' }) => ({
    subject: `Welcome Aboard — Internship Confirmed | APTRANSCO`,
    html: wrap(`
        <p style="color:#374151;font-size:15px;">Dear <strong>${studentName}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Congratulations! Your internship at APTRANSCO has been officially confirmed.
            We look forward to your contribution and a productive internship experience.
        </p>
        <div style="margin:24px 0;padding:20px;background:#fdf4ff;border-left:4px solid #7c3aed;border-radius:0 8px 8px 0;">
            <table style="width:100%;border-collapse:collapse;">
                ${infoRow('Programme', internshipTitle)}
                ${fieldName ? infoRow('Field / Position', fieldName) : ''}
                ${location ? infoRow('Reporting Location', location) : ''}
                ${rollNumber ? infoRow('Your Roll Number', rollNumber) : ''}
                ${joiningDate ? infoRow('Joining Date', new Date(joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })) : ''}
                ${endDate ? infoRow('End Date', new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })) : ''}
                ${mentorName ? infoRow('Your Mentor', mentorName) : ''}
            </table>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Please report to the assigned location on your joining date. Carry your college ID and a copy of this email.
        </p>
        <div style="text-align:center;margin:28px 0;">
            ${btn('View Internship Details', portalUrl, '#7c3aed')}
        </div>
        <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO Internship Cell</strong></p>
    `)
});

// ── 4. Rejection ─────────────────────────────────────────────────────────────
const rejectionEmail = ({ studentName, internshipTitle, fieldName, hasAlternateLocations = false, portalUrl = 'https://aptransco.gov.in/intern' }) => ({
    subject: `Application Update — Not Selected | APTRANSCO Internship`,
    html: wrap(`
        <p style="color:#374151;font-size:15px;">Dear <strong>${studentName}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Thank you for applying to the APTRANSCO Learning Internship Programme and for your interest in working with us.
        </p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            After careful review, we regret to inform you that your application for
            <strong>${internshipTitle}${fieldName ? ` — ${fieldName}` : ''}</strong>
            was not successful in this round. We appreciate the effort you put into your application.
        </p>
        <div style="margin:24px 0;padding:16px;background:#fef9ec;border:1px solid #fde68a;border-radius:8px;">
            <p style="color:#92400e;font-size:13px;font-weight:700;margin:0 0 4px;">Don't be discouraged!</p>
            <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                We encourage you to keep applying. New internship opportunities open regularly on the portal.
                You are welcome to apply again in the next cycle.
            </p>
        </div>
        ${hasAlternateLocations ? `
        <div style="margin:24px 0;padding:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;">
            <p style="color:#1e40af;font-size:13px;font-weight:700;margin:0 0 8px;">💡 Alternate locations may be available</p>
            <p style="color:#1e40af;font-size:13px;margin:0;line-height:1.5;">
                This field has other posting locations with openings. Log in to apply for an alternate location.
            </p>
        </div>
        <div style="text-align:center;margin:20px 0;">
            ${btn('Apply for Alternate Location', portalUrl, '#2563eb')}
        </div>
        ` : `
        <div style="text-align:center;margin:28px 0;">
            ${btn('Browse Open Internships', portalUrl, '#003087')}
        </div>
        `}
        <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO Internship Cell</strong></p>
    `)
});

// ── 5. Document request ───────────────────────────────────────────────────────
const documentRequestEmail = ({ studentName, internshipTitle, portalUrl = 'https://aptransco.gov.in/intern' }) => ({
    subject: `Action Required: Upload Joining Documents | APTRANSCO`,
    html: wrap(`
        <p style="color:#374151;font-size:15px;">Dear <strong>${studentName}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            You have been selected for the <strong>${internshipTitle}</strong> Learning Internship.
            To proceed with your onboarding, please upload the following joining documents.
        </p>
        <div style="margin:20px 0;">
            ${['No Objection Certificate (NOC)', 'Service Bond / Agreement', 'Undertaking Form'].map((d, i) =>
                `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="width:24px;height:24px;background:#1e40af10;border:1px solid #1e40af30;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#1e40af;font-weight:700;font-size:11px;flex-shrink:0;">${i + 1}</span>
                    <span style="color:#111827;font-size:13px;font-weight:600;">${d}</span>
                </div>`
            ).join('')}
        </div>
        <div style="text-align:center;margin:28px 0;">
            ${btn('Upload Documents', portalUrl)}
        </div>
        <p style="color:#dc2626;font-size:12px;font-weight:600;">⚠ Failure to upload within 7 days may result in cancellation of your selection.</p>
        <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO Internship Cell</strong></p>
    `)
});

// ── 6. HOD notification (new internship group assigned) ───────────────────────
const hodGroupNotificationEmail = ({ hodName, hodDepartment, internshipTitle, batchTitle, portalUrl = 'https://aptransco.gov.in/admin' }) => ({
    subject: `Action Required: Submit Problem Statements — ${internshipTitle} | APTRANSCO`,
    html: wrap(`
        <p style="color:#374151;font-size:15px;">Dear <strong>${hodName || hodDepartment + ' HOD'}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            PRTI has launched a new internship under <strong>${batchTitle || 'the current batch'}</strong>
            and your department (<strong>${hodDepartment}</strong>) has been included.
        </p>
        <div style="margin:24px 0;padding:20px;background:#f0f9ff;border-left:4px solid #1e40af;border-radius:0 8px 8px 0;">
            <table style="width:100%;border-collapse:collapse;">
                ${infoRow('Programme', internshipTitle)}
                ${batchTitle ? infoRow('Batch', batchTitle) : ''}
                ${infoRow('Your Department', hodDepartment)}
                ${infoRow('Action Required', 'Submit Problem Statements')}
            </table>
        </div>
        <div style="text-align:center;margin:28px 0;">
            ${btn('Submit Problem Statements', portalUrl)}
        </div>
        <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO — PRTI</strong></p>
    `)
});

// ── 7. PRTI — new internship created notification ─────────────────────────────
const internshipCreatedPrtiEmail = ({ internshipTitle, department, createdBy, internshipType, adminPortalUrl = 'https://aptransco.gov.in/admin' }) => ({
    subject: `New Internship Created — ${internshipTitle} | APTRANSCO PRTI`,
    html: wrap(`
        <p style="color:#374151;font-size:15px;">Dear PRTI Team,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            A new internship programme has been created and requires your review. Please log in to the PRTI portal to configure seat allocations and review the setup.
        </p>
        <div style="margin:24px 0;padding:20px;background:#eff6ff;border-left:4px solid #1e40af;border-radius:0 8px 8px 0;">
            <table style="width:100%;border-collapse:collapse;">
                ${infoRow('Programme', internshipTitle)}
                ${infoRow('Department', department || 'All Departments')}
                ${infoRow('Type', internshipType === 'NON_STIPEND' ? 'Learning Internship (No Stipend)' : 'Collaborative (With Stipend)')}
                ${infoRow('Created By', createdBy)}
                ${infoRow('Action Required', 'Set held seats & review')}
            </table>
        </div>
        <div style="text-align:center;margin:28px 0;">
            ${btn('Open PRTI Portal', adminPortalUrl)}
        </div>
        <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO Internship Portal</strong></p>
    `)
});

// ── 8. PRTI — intern joining in 5 days reminder ───────────────────────────────
const joiningReminderPrtiEmail = ({ studentName, internshipTitle, joiningDate, fieldName, location }) => ({
    subject: `Joining Reminder — ${studentName} joining in 5 days | APTRANSCO PRTI`,
    html: wrap(`
        <p style="color:#374151;font-size:15px;">Dear PRTI Team,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            This is a reminder that the following intern is scheduled to join in <strong>5 days</strong>.
            Please prepare the joining letter and ensure all onboarding formalities are ready.
        </p>
        <div style="margin:24px 0;padding:20px;background:#fefce8;border-left:4px solid #ca8a04;border-radius:0 8px 8px 0;">
            <table style="width:100%;border-collapse:collapse;">
                ${infoRow('Intern Name', studentName)}
                ${infoRow('Programme', internshipTitle)}
                ${fieldName ? infoRow('Field', fieldName) : ''}
                ${location ? infoRow('Location', location) : ''}
                ${infoRow('Joining Date', new Date(joiningDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }))}
                ${infoRow('Action Required', 'Prepare joining letter')}
            </table>
        </div>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Please ensure the joining letter and workstation/access are ready before the intern's arrival.
        </p>
        <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO Internship Portal (Automated Reminder)</strong></p>
    `)
});

module.exports = {
    shortlistingEmail,
    selectionEmail,
    hiringEmail,
    rejectionEmail,
    documentRequestEmail,
    hodGroupNotificationEmail,
    internshipCreatedPrtiEmail,
    joiningReminderPrtiEmail,
};
