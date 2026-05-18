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

// ── 5. Document request (now dynamic — uses HOD-configured docs) ─────────────
const documentRequestEmail = ({ studentName, internshipTitle, fieldName, location, requiredDocs = [], deadlineDays = 7, portalUrl = 'https://aptransco.gov.in/intern' }) => {
    // Normalise docs: accept strings or { label, format, mandatory } objects
    const docs = requiredDocs.length > 0 ? requiredDocs : [
        { label: 'No Objection Certificate (NOC)', format: 'PDF', mandatory: true },
        { label: 'Service Bond / Agreement',       format: 'PDF', mandatory: true },
        { label: 'Undertaking Form',               format: 'PDF', mandatory: true },
    ];
    const fmtHint = (f) => f === 'IMAGE' ? 'JPG / PNG' : f === 'ANY' ? 'PDF or Image' : 'PDF';
    return {
        subject: `Action Required: Upload Joining Documents | APTRANSCO`,
        html: wrap(`
            <p style="color:#374151;font-size:15px;">Dear <strong>${studentName}</strong>,</p>
            <p style="color:#374151;font-size:14px;line-height:1.6;">
                Congratulations on your selection for the <strong>${internshipTitle}</strong>${fieldName ? ` — <strong>${fieldName}</strong>` : ''} programme${location ? ` at <strong>${location}</strong>` : ''}.
                Your selection has been approved by PRTI. To proceed with your onboarding, please upload the documents listed below through the portal.
            </p>
            <div style="margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">
                <p style="color:#1e40af;font-size:12px;font-weight:800;margin:0 0 12px;text-transform:uppercase;letter-spacing:1px;">Required Documents</p>
                ${docs.map((d, i) => {
                    const label = typeof d === 'string' ? d : (d.label || 'Document');
                    const format = typeof d === 'object' ? (d.format || 'PDF') : 'PDF';
                    const mandatory = typeof d === 'object' ? (d.mandatory !== false) : true;
                    return `<div style="display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:${i < docs.length - 1 ? '1px solid #e5e7eb' : 'none'};">
                        <span style="width:24px;height:24px;background:#1e40af10;border:1px solid #1e40af30;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#1e40af;font-weight:700;font-size:11px;flex-shrink:0;">${i + 1}</span>
                        <div style="flex:1;">
                            <p style="color:#111827;font-size:13px;font-weight:700;margin:0 0 2px;">${label}${!mandatory ? ' <span style="color:#94a3b8;font-weight:500;font-size:11px;">(optional)</span>' : ''}</p>
                            <p style="color:#6b7280;font-size:11px;margin:0;">Format: ${fmtHint(format)} · Max 5 MB</p>
                        </div>
                    </div>`;
                }).join('')}
            </div>
            <p style="color:#374151;font-size:14px;line-height:1.6;">
                During upload, you will also be asked to enter your <strong>preferred joining date</strong> and <strong>end date</strong>. These will be used to compute your working days.
            </p>
            <div style="text-align:center;margin:28px 0;">
                ${btn('Upload Documents', portalUrl)}
            </div>
            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 14px;margin:20px 0;">
                <p style="color:#b91c1c;font-size:12px;font-weight:700;margin:0;">⚠ Important</p>
                <p style="color:#991b1b;font-size:12px;margin:4px 0 0;line-height:1.5;">Documents must be uploaded within <strong>${deadlineDays} days</strong> of this email. Failure to do so may result in cancellation of your selection.</p>
            </div>
            <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO Internship Cell</strong></p>
        `)
    };
};

// ── 5b. PRTI approved → HOD notification ─────────────────────────────────────
const prtiApprovedHodEmail = ({ hodName, hodDepartment, internshipTitle, fieldName, count, candidates = [], adminPortalUrl = 'https://aptransco.gov.in/admin' }) => ({
    subject: `PRTI Approved ${count} Selection(s) — ${internshipTitle} | APTRANSCO`,
    html: wrap(`
        <p style="color:#374151;font-size:15px;">Dear <strong>${hodName || (hodDepartment ? hodDepartment + ' HOD' : 'HOD')}</strong>,</p>
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            Good news! PRTI has reviewed and <strong>approved ${count} candidate selection${count !== 1 ? 's' : ''}</strong>
            for the <strong>${internshipTitle}</strong>${fieldName ? ` — <strong>${fieldName}</strong>` : ''} programme.
        </p>
        <div style="margin:24px 0;padding:20px;background:#f0fdf4;border-left:4px solid #16a34a;border-radius:0 8px 8px 0;">
            <table style="width:100%;border-collapse:collapse;">
                ${infoRow('Programme', internshipTitle)}
                ${fieldName ? infoRow('Field', fieldName) : ''}
                ${hodDepartment ? infoRow('Department', hodDepartment) : ''}
                ${infoRow('PRTI-Approved Count', `✅ ${count}`)}
                ${infoRow('Next Step', 'Request joining documents')}
            </table>
        </div>
        ${candidates.length > 0 ? `
        <div style="margin:20px 0;padding:16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
            <p style="color:#1e40af;font-size:12px;font-weight:800;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;">Approved Candidates</p>
            ${candidates.slice(0, 10).map((c, i) =>
                `<div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:${i < Math.min(candidates.length, 10) - 1 ? '1px solid #f3f4f6' : 'none'};">
                    <span style="width:22px;height:22px;background:#16a34a15;color:#16a34a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:10px;flex-shrink:0;">${i + 1}</span>
                    <span style="color:#111827;font-size:13px;font-weight:600;">${c.name || 'Candidate'}</span>
                    ${c.location ? `<span style="color:#6b7280;font-size:11px;font-weight:500;">· ${c.location}</span>` : ''}
                </div>`
            ).join('')}
            ${candidates.length > 10 ? `<p style="color:#9ca3af;font-size:11px;margin:8px 0 0;font-style:italic;">+ ${candidates.length - 10} more — log in to view all</p>` : ''}
        </div>` : ''}
        <p style="color:#374151;font-size:14px;line-height:1.6;">
            You can now <strong>request joining documents</strong> from these candidates. Use the "Request Docs" button on the HOD Applications page.
        </p>
        <div style="text-align:center;margin:28px 0;">
            ${btn('Open HOD Portal', adminPortalUrl + '/hod/applications', '#16a34a')}
        </div>
        <p style="color:#6b7280;font-size:13px;">Best Regards,<br><strong>APTRANSCO — PRTI Office</strong></p>
    `)
});

// ── 5c. Grand Joining Letter — sent after documents verified & student hired ──
const grandJoiningLetterEmail = ({ studentName, rollNumber, internshipTitle, fieldName, department, location, joiningDate, endDate, mentorName, mentorEmail, mentorPhone, hodName, durationDays, portalUrl = 'https://aptransco.gov.in/intern' }) => {
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'To be confirmed';
    const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const totalDays = durationDays || (joiningDate && endDate
        ? Math.max(0, Math.ceil((new Date(endDate) - new Date(joiningDate)) / (1000 * 60 * 60 * 24)))
        : null);
    return {
        subject: `Official Joining Letter — ${internshipTitle} | APTRANSCO`,
        html: wrap(`
            <!-- Official letterhead band -->
            <div style="background:linear-gradient(90deg,#FF9933 0%,#FFFFFF 50%,#138808 100%);height:4px;margin:-32px -32px 24px;"></div>

            <div style="text-align:center;margin-bottom:8px;">
                <p style="color:#1e40af;font-size:11px;font-weight:800;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase;">Government of Andhra Pradesh — Energy Department</p>
                <p style="color:#111827;font-size:18px;font-weight:800;margin:0;">Andhra Pradesh Transmission Corporation Limited</p>
                <p style="color:#6b7280;font-size:12px;margin:4px 0 0;font-weight:600;">Internship Programme · Office of the PRTI</p>
            </div>

            <hr style="border:0;border-top:1px solid #e5e7eb;margin:24px 0;"/>

            <div style="text-align:right;margin-bottom:16px;">
                <p style="color:#6b7280;font-size:11px;margin:0;font-weight:600;">Ref: APT/INT/${rollNumber || 'NEW'}/${new Date().getFullYear()}</p>
                <p style="color:#6b7280;font-size:11px;margin:2px 0 0;">Date: ${fmtShort(new Date())}</p>
            </div>

            <h2 style="text-align:center;color:#111827;font-size:18px;font-weight:800;letter-spacing:0.5px;margin:24px 0;text-transform:uppercase;background:#f0f9ff;padding:12px;border:1px solid #bfdbfe;border-radius:6px;">
                Letter of Internship Commencement
            </h2>

            <p style="color:#111827;font-size:14px;margin:0 0 4px;"><strong>To,</strong></p>
            <p style="color:#111827;font-size:14px;margin:0;"><strong>${studentName}</strong></p>
            ${rollNumber ? `<p style="color:#6b7280;font-size:13px;margin:2px 0 0;font-weight:600;">Roll Number: <strong style="color:#1e40af;font-family:monospace;">${rollNumber}</strong></p>` : ''}

            <p style="color:#374151;font-size:14px;line-height:1.7;margin:24px 0 16px;">
                <strong>Sub:</strong> Confirmation of Internship — ${internshipTitle}${fieldName ? ` (${fieldName})` : ''}
            </p>

            <p style="color:#374151;font-size:14px;line-height:1.8;">
                Dear <strong>${studentName}</strong>,
            </p>

            <p style="color:#374151;font-size:14px;line-height:1.8;text-align:justify;">
                With reference to your application and the successful verification of your submitted documents, the Andhra Pradesh Transmission Corporation Limited is pleased to formally confirm your appointment as an <strong>Intern</strong> under the APTRANSCO Internship Programme${department ? ` in the <strong>${department}</strong> Department` : ''}${location ? `, at <strong>${location}</strong>` : ''}.
            </p>

            <div style="margin:24px 0;padding:0;border:2px solid #1e40af;border-radius:10px;overflow:hidden;">
                <div style="background:#1e40af;color:#ffffff;padding:10px 16px;font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;">
                    📋 Appointment Particulars
                </div>
                <table style="width:100%;border-collapse:collapse;padding:16px;">
                    <tr><td style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:160px;border-bottom:1px solid #f3f4f6;">Intern Name</td><td style="padding:10px 16px;color:#111827;font-size:14px;font-weight:700;border-bottom:1px solid #f3f4f6;">${studentName}</td></tr>
                    ${rollNumber ? `<tr><td style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f3f4f6;">Roll Number</td><td style="padding:10px 16px;color:#1e40af;font-size:14px;font-weight:800;font-family:monospace;border-bottom:1px solid #f3f4f6;">${rollNumber}</td></tr>` : ''}
                    <tr><td style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f3f4f6;">Programme</td><td style="padding:10px 16px;color:#111827;font-size:14px;font-weight:700;border-bottom:1px solid #f3f4f6;">${internshipTitle}</td></tr>
                    ${fieldName ? `<tr><td style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f3f4f6;">Field / Position</td><td style="padding:10px 16px;color:#111827;font-size:14px;font-weight:700;border-bottom:1px solid #f3f4f6;">${fieldName}</td></tr>` : ''}
                    ${department ? `<tr><td style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f3f4f6;">Department</td><td style="padding:10px 16px;color:#111827;font-size:14px;font-weight:700;border-bottom:1px solid #f3f4f6;">${department}</td></tr>` : ''}
                    ${location ? `<tr><td style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f3f4f6;">Reporting Location</td><td style="padding:10px 16px;color:#111827;font-size:14px;font-weight:700;border-bottom:1px solid #f3f4f6;">${location}</td></tr>` : ''}
                    <tr style="background:#f0fdf4;"><td style="padding:12px 16px;color:#15803d;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #bbf7d0;">📅 Joining Date</td><td style="padding:12px 16px;color:#14532d;font-size:14px;font-weight:800;border-bottom:1px solid #bbf7d0;">${fmtDate(joiningDate)}</td></tr>
                    <tr style="background:#fef9ec;"><td style="padding:12px 16px;color:#b45309;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #fde68a;">🏁 End Date</td><td style="padding:12px 16px;color:#78350f;font-size:14px;font-weight:800;border-bottom:1px solid #fde68a;">${fmtDate(endDate)}</td></tr>
                    ${totalDays ? `<tr><td style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:1px solid #f3f4f6;">Duration</td><td style="padding:10px 16px;color:#111827;font-size:14px;font-weight:700;border-bottom:1px solid #f3f4f6;">${totalDays} day${totalDays !== 1 ? 's' : ''}</td></tr>` : ''}
                    ${mentorName ? `<tr><td style="padding:10px 16px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Assigned Mentor</td><td style="padding:10px 16px;color:#111827;font-size:14px;font-weight:700;">${mentorName}${mentorEmail ? ` <span style="color:#6b7280;font-weight:500;font-size:12px;">· ${mentorEmail}</span>` : ''}${mentorPhone ? ` <span style="color:#6b7280;font-weight:500;font-size:12px;">· ${mentorPhone}</span>` : ''}</td></tr>` : ''}
                </table>
            </div>

            <p style="color:#374151;font-size:14px;line-height:1.7;text-align:justify;">
                You are advised to report to the assigned location on <strong>${fmtShort(joiningDate)}</strong> by 10:00 AM. Please carry the following items in physical form:
            </p>

            <ul style="color:#374151;font-size:13px;line-height:2;padding-left:20px;">
                <li>A printed copy of this letter</li>
                <li>Your college / institution Identity Card</li>
                <li>An original copy of your Aadhaar Card for verification</li>
                <li>Two recent passport-sized photographs</li>
                <li>Any documents that were uploaded online (original copies for sighting)</li>
            </ul>

            <div style="margin:24px 0;padding:16px;background:#eff6ff;border-left:4px solid #1e40af;border-radius:0 8px 8px 0;">
                <p style="color:#1e3a8a;font-size:13px;font-weight:700;margin:0 0 6px;">📌 Working Days &amp; Conduct</p>
                <p style="color:#1e40af;font-size:12px;margin:0;line-height:1.6;">
                    Your effective working days will be counted from <strong>${fmtShort(joiningDate)}</strong> to <strong>${fmtShort(endDate)}</strong>.
                    You are expected to maintain professional conduct, submit daily work logs through the portal, and complete all assignments given by your mentor.
                </p>
            </div>

            <p style="color:#374151;font-size:14px;line-height:1.7;text-align:justify;">
                This internship is offered subject to APTRANSCO's standard terms and conditions for interns, including confidentiality and adherence to safety protocols. A copy of the official conduct guidelines is available on the portal.
            </p>

            <p style="color:#374151;font-size:14px;line-height:1.7;">
                We extend a warm welcome to APTRANSCO and wish you a productive and rewarding internship experience.
            </p>

            <div style="text-align:center;margin:28px 0;">
                ${btn('View Portal & Mark Reporting', portalUrl, '#1e40af')}
            </div>

            <hr style="border:0;border-top:1px solid #e5e7eb;margin:32px 0 20px;"/>

            <table style="width:100%;border-collapse:collapse;">
                <tr>
                    <td style="vertical-align:top;width:50%;">
                        <p style="color:#374151;font-size:13px;margin:0;line-height:1.6;">
                            Yours sincerely,<br>
                            <strong style="color:#111827;">${hodName || 'Head of Department'}</strong><br>
                            <span style="color:#6b7280;font-size:12px;">${department || 'APTRANSCO'} — APTRANSCO</span>
                        </p>
                    </td>
                    <td style="vertical-align:top;width:50%;text-align:right;">
                        <div style="display:inline-block;text-align:center;">
                            <div style="border:2px dashed #93c5fd;border-radius:50%;width:70px;height:70px;display:flex;align-items:center;justify-content:center;color:#1e40af;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;margin:0 auto;">
                                APTRANSCO<br>SEAL
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        `)
    };
};

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
    prtiApprovedHodEmail,
    grandJoiningLetterEmail,
    hodGroupNotificationEmail,
    internshipCreatedPrtiEmail,
    joiningReminderPrtiEmail,
};
