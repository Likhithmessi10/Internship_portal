const prisma = require('../lib/prisma');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const { generatePDF } = require('../utils/pdfGenerator');

const ALLOWED_INTERN_STATUSES = ['SELECTED', 'REPORTED', 'HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'];

/**
 * Compute attendance percentage from an Attendance record.
 * Returns 0 if no record or zero totalDays.
 */
function attendancePct(att) {
    if (!att || !att.totalDays) return 0;
    return Math.round((att.daysAttended / att.totalDays) * 100);
}

/**
 * GET /api/v1/mentor/internships/:id/completion-summary
 * Returns every intern in the internship plus their submissions/scores/attendance/work-logs.
 * Drives the "Complete Internship" wizard UI on the mentor portal.
 */
const getCompletionSummary = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { id: internshipId } = req.params;

        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
            select: {
                id: true, title: true, department: true, duration: true,
                completionStatus: true, completedAt: true
            }
        });
        if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });

        const interns = await prisma.application.findMany({
            where: {
                mentorId,
                internshipId,
                status: { in: ALLOWED_INTERN_STATUSES }
            },
            include: {
                student: { include: { user: { select: { email: true } } } },
                attendance: true,
                workAssignments: {
                    include: { submissions: true },
                    orderBy: { createdAt: 'desc' }
                },
                workLogs: { orderBy: { date: 'desc' } }
            }
        });

        // Pull existing certificates for these applications (if any)
        const certificates = await prisma.certificate.findMany({
            where: { applicationId: { in: interns.map(i => i.id) } }
        });
        const certByApp = Object.fromEntries(certificates.map(c => [c.applicationId, c]));

        const enriched = interns.map(intern => {
            const totalAssignments = intern.workAssignments.length;
            const reviewedAssignments = intern.workAssignments.filter(
                w => w.submissions.length > 0 && w.submissions[0].reviewedAt
            ).length;
            const att = attendancePct(intern.attendance);

            return {
                applicationId: intern.id,
                student: {
                    id: intern.student.id,
                    fullName: intern.student.fullName,
                    rollNumber: intern.student.rollNumber,
                    email: intern.student.user?.email,
                    collegeName: intern.student.collegeName,
                    photoUrl: intern.student.photoUrl
                },
                status: intern.status,
                completionStatus: intern.completionStatus || 'PENDING',
                mentorRemarks: intern.mentorRemarks || '',
                mentorSatisfactionPercent: intern.mentorSatisfactionPercent ?? null,
                completionProcessedAt: intern.completionProcessedAt,
                attendance: {
                    daysAttended: intern.attendance?.daysAttended || 0,
                    totalDays: intern.attendance?.totalDays || 0,
                    percent: att,
                    lowAttendance: att < 90
                },
                assignments: intern.workAssignments.map(w => ({
                    id: w.id,
                    title: w.title,
                    description: w.description,
                    dueDate: w.dueDate,
                    status: w.status,
                    submission: w.submissions[0] ? {
                        id: w.submissions[0].id,
                        submissionDate: w.submissions[0].submissionDate,
                        status: w.submissions[0].status,
                        mentorFeedback: w.submissions[0].mentorFeedback,
                        mentorRating: w.submissions[0].mentorRating,
                        satisfactionPercent: w.submissions[0].satisfactionPercent
                    } : null
                })),
                progress: {
                    totalAssignments,
                    reviewedAssignments,
                    pendingReview: totalAssignments - reviewedAssignments
                },
                workLogsCount: intern.workLogs.length,
                certificate: certByApp[intern.id]
                    ? {
                        id: certByApp[intern.id].id,
                        fileUrl: certByApp[intern.id].fileUrl,
                        issuedAt: certByApp[intern.id].issuedAt,
                        attendancePercent: certByApp[intern.id].attendancePercent,
                        satisfactionPercent: certByApp[intern.id].satisfactionPercent
                    }
                    : null
            };
        });

        const allProcessed = enriched.length > 0 && enriched.every(i => i.completionStatus !== 'PENDING');

        res.json({
            success: true,
            data: {
                internship,
                interns: enriched,
                stats: {
                    total: enriched.length,
                    processed: enriched.filter(i => i.completionStatus !== 'PENDING').length,
                    certificatesIssued: enriched.filter(i => i.certificate).length,
                    canFinalize: allProcessed && internship.completionStatus !== 'COMPLETED'
                }
            }
        });
    } catch (err) {
        console.error('getCompletionSummary error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/v1/mentor/internships/:internshipId/interns/:applicationId/remarks
 * Save mentor remarks + overall satisfaction percent for a single intern.
 */
const saveInternRemarks = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { internshipId, applicationId } = req.params;
        const { remarks, satisfactionPercent } = req.body;

        let sat = null;
        if (satisfactionPercent !== undefined && satisfactionPercent !== null && satisfactionPercent !== '') {
            sat = parseInt(satisfactionPercent);
            if (Number.isNaN(sat) || sat < 0 || sat > 100) {
                return res.status(400).json({ success: false, message: 'satisfactionPercent must be 0-100' });
            }
        }

        const app = await prisma.application.findFirst({
            where: { id: applicationId, internshipId, mentorId }
        });
        if (!app) return res.status(404).json({ success: false, message: 'Intern not found under this mentor for this internship' });

        const updated = await prisma.application.update({
            where: { id: applicationId },
            data: {
                mentorRemarks: remarks ?? app.mentorRemarks,
                mentorSatisfactionPercent: sat ?? app.mentorSatisfactionPercent,
                completionStatus: 'COMPLETED',
                completionProcessedAt: new Date()
            },
            select: {
                id: true, mentorRemarks: true, mentorSatisfactionPercent: true,
                completionStatus: true, completionProcessedAt: true
            }
        });

        res.json({ success: true, data: updated });
    } catch (err) {
        console.error('saveInternRemarks error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * POST /api/v1/mentor/internships/:internshipId/interns/:applicationId/certificate
 * Generate the completion certificate PDF for this intern, persist it,
 * and return the file URL.
 */
const issueCertificate = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { internshipId, applicationId } = req.params;

        const app = await prisma.application.findFirst({
            where: { id: applicationId, internshipId, mentorId },
            include: {
                student: { include: { user: { select: { email: true } } } },
                internship: true,
                departmentGroup: { select: { department: true, title: true } },
                attendance: true,
                mentor: { select: { id: true, name: true, email: true } }
            }
        });
        if (!app) return res.status(404).json({ success: false, message: 'Intern not found under this mentor for this internship' });

        const att = attendancePct(app.attendance);
        const lowAttendance = att < 90;

        const fmt = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
        const esc = (s) => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');

        const html = `
        <!DOCTYPE html>
        <html><head><meta charset="utf-8"><style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1f2937; }
          .border-frame { border: 6px double #1e3a8a; padding: 30px; text-align: center; min-height: 700px; }
          .header { text-transform: uppercase; letter-spacing: 2px; color: #1e3a8a; font-size: 12px; font-weight: 800; }
          .corp { font-size: 22px; font-weight: 800; color: #111827; margin: 8px 0 0; text-transform: uppercase; }
          .sub { font-size: 13px; color: #4b5563; margin: 4px 0 30px; }
          .title { font-size: 36px; font-weight: 800; color: #1e3a8a; letter-spacing: 4px; margin: 20px 0 10px; text-transform: uppercase; }
          .subtitle { font-size: 13px; color: #6b7280; margin-bottom: 30px; text-transform: uppercase; letter-spacing: 2px; }
          .body { font-size: 14px; color: #374151; line-height: 1.8; margin: 0 40px; }
          .name { font-size: 30px; font-weight: 800; color: #111827; margin: 16px 0; font-style: italic; border-bottom: 1px solid #cbd5e1; padding-bottom: 10px; display: inline-block; min-width: 60%; }
          .details { margin: 30px auto; font-size: 13px; color: #4b5563; }
          .details strong { color: #111827; }
          .stats { display: flex; justify-content: center; gap: 30px; margin: 25px 0; }
          .stat { background: #f1f5f9; padding: 12px 18px; border-radius: 8px; }
          .stat-val { font-size: 22px; font-weight: 800; color: #1e3a8a; }
          .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1.2px; }
          .low { color: #b45309 !important; }
          .remarks { background: #fef9ec; border-left: 4px solid #f59e0b; padding: 12px 18px; margin: 25px 40px; text-align: left; font-size: 12px; color: #78350f; border-radius: 0 8px 8px 0; }
          .footer { margin-top: 50px; display: flex; justify-content: space-between; padding: 0 40px; font-size: 12px; }
          .footer .col { width: 45%; text-align: center; }
          .footer .line { border-top: 1px solid #1e3a8a; margin: 40px 30px 8px; }
          .footer .role { font-weight: 700; color: #111827; }
          .footer .who { font-size: 11px; color: #6b7280; }
        </style></head><body>
          <div class="border-frame">
            <div class="header">Government of Andhra Pradesh — Energy Department</div>
            <div class="corp">Andhra Pradesh Transmission Corporation Limited</div>
            <div class="sub">PRTI Internship Programme</div>

            <div class="title">Certificate of Completion</div>
            <div class="subtitle">— Awarded with appreciation —</div>

            <div class="body">
              This is to certify that
              <div class="name">${esc(app.student.fullName)}</div>
              ${app.student.rollNumber ? `bearing roll number <strong>${esc(app.student.rollNumber)}</strong>, ` : ''}from <strong>${esc(app.student.collegeName || 'their institution')}</strong>,
              has successfully completed the internship programme <strong>"${esc(app.internship.title)}"</strong>
              in the <strong>${esc(app.departmentGroup?.department || app.internship.department)}</strong> department
              ${app.joiningDate ? `from ${fmt(app.joiningDate)} ${app.endDate ? `to ${fmt(app.endDate)}` : ''}` : ''}.
            </div>

            <div class="stats">
              <div class="stat">
                <div class="stat-val ${lowAttendance ? 'low' : ''}">${att}%</div>
                <div class="stat-label">Attendance</div>
              </div>
              ${app.mentorSatisfactionPercent != null ? `
              <div class="stat">
                <div class="stat-val">${app.mentorSatisfactionPercent}%</div>
                <div class="stat-label">Mentor Satisfaction</div>
              </div>` : ''}
            </div>

            ${lowAttendance ? `<div class="remarks"><strong>Note:</strong> Attendance recorded below the standard 90% threshold. Certificate issued at mentor discretion.</div>` : ''}
            ${app.mentorRemarks ? `<div class="remarks"><strong>Mentor's Remarks:</strong><br>${esc(app.mentorRemarks).replace(/\n/g, '<br>')}</div>` : ''}

            <div class="footer">
              <div class="col">
                <div class="line"></div>
                <div class="role">${esc(app.mentor?.name || 'Mentor')}</div>
                <div class="who">Internship Mentor</div>
              </div>
              <div class="col">
                <div class="line"></div>
                <div class="role">PRTI Internship Cell</div>
                <div class="who">APTRANSCO</div>
              </div>
            </div>
          </div>
        </body></html>
        `;

        const pdfBuffer = await generatePDF(html);

        // Persist PDF to uploads/ so PRTI/HOD can also download it later
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
        const safeName = app.student.fullName.replace(/[^a-z0-9]+/gi, '_');
        const fileName = `certificate_${safeName}_${app.id.substring(0, 8)}.pdf`;
        const filePath = path.join(uploadsDir, fileName);
        fs.writeFileSync(filePath, pdfBuffer);
        const relUrl = `uploads/${fileName}`;

        // Upsert certificate row
        const cert = await prisma.certificate.upsert({
            where: { applicationId: app.id },
            update: {
                issuedById: mentorId,
                fileUrl: relUrl,
                attendancePercent: att,
                satisfactionPercent: app.mentorSatisfactionPercent ?? null,
                remarks: app.mentorRemarks ?? null,
                issuedAt: new Date()
            },
            create: {
                applicationId: app.id,
                issuedById: mentorId,
                fileUrl: relUrl,
                attendancePercent: att,
                satisfactionPercent: app.mentorSatisfactionPercent ?? null,
                remarks: app.mentorRemarks ?? null
            }
        });

        res.json({ success: true, data: cert });
    } catch (err) {
        console.error('issueCertificate error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to issue certificate' });
    }
};

/**
 * POST /api/v1/mentor/internships/:id/finalize
 * Re-auth with mentor password, mark the internship + all its applications COMPLETED.
 * Blocks unless every assigned intern has been processed (completionStatus !== PENDING).
 */
const finalizeInternship = async (req, res) => {
    try {
        const mentorId = req.user.id;
        const { id: internshipId } = req.params;
        const { password } = req.body;

        if (!password) return res.status(400).json({ success: false, message: 'Password is required to finalize' });

        // Re-auth the mentor
        const user = await prisma.user.findUnique({ where: { id: mentorId } });
        if (!user) return res.status(401).json({ success: false, message: 'Invalid session' });
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ success: false, message: 'Incorrect password' });

        const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
        if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });
        if (internship.completionStatus === 'COMPLETED') {
            return res.status(400).json({ success: false, message: 'Internship already finalized' });
        }

        // Pull this mentor's interns
        const interns = await prisma.application.findMany({
            where: { internshipId, mentorId, status: { in: ALLOWED_INTERN_STATUSES } },
            select: { id: true, completionStatus: true }
        });

        const unprocessed = interns.filter(i => !i.completionStatus || i.completionStatus === 'PENDING');
        if (unprocessed.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot finalize: ${unprocessed.length} intern(s) still need remarks/certificate decisions`
            });
        }

        // Mark every application COMPLETED and the internship itself COMPLETED
        await prisma.$transaction([
            prisma.application.updateMany({
                where: { id: { in: interns.map(i => i.id) } },
                data: { status: 'COMPLETED' }
            }),
            prisma.internship.update({
                where: { id: internshipId },
                data: {
                    completionStatus: 'COMPLETED',
                    completedAt: new Date(),
                    completedById: mentorId,
                    isActive: false
                }
            })
        ]);

        res.json({ success: true, message: 'Internship finalized successfully' });
    } catch (err) {
        console.error('finalizeInternship error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getCompletionSummary,
    saveInternRemarks,
    issueCertificate,
    finalizeInternship
};
