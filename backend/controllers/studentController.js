const prisma = require('../lib/prisma');

/**
 * @desc    Create or Update Student Profile
 * @route   POST /api/v1/students/profile
 * @access  Private (Student)
 */
const upsertProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // Ensure user is a student
        if (req.user.role !== 'STUDENT') {
            return res.status(403).json({ success: false, message: 'Only students can manage student profiles' });
        }

        let {
            fullName, collegeRollNumber, phone, dob, address, aadhar, aadhaarNumber,
            collegeName, university, degree, branch,
            yearOfStudy, cgpa, collegeCategory, nirfRanking,
            hasExperience, hasProjects, hasCertifications,
            experienceDesc, projectsDesc, certificationsDesc, skills, photoUrl,
            linkedinUrl, githubUrl
        } = req.body;

        // Standardize: Prefer aadhaarNumber if present, fallback to aadhar
        const finalAadhaar = aadhaarNumber || aadhar;

        // Validation for Aadhaar Number (12 digits)
        if (finalAadhaar && !/^\d{12}$/.test(finalAadhaar.replace(/[-\s]/g, ''))) {
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid Aadhaar Number format. It must be exactly 12 digits.' 
            });
        }

        // MVP Profile Validation
        if (!fullName || !collegeName || !branch || !yearOfStudy || !finalAadhaar || !dob || !phone || !university || !degree) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mandatory fields missing: fullName, collegeName, branch, yearOfStudy, aadhaarNumber, dob, phone, university, or degree' 
            });
        }

        // Requirement 6: Validate college against trusted dataset
        const { findCollege, mapCategory } = require('../services/collegeService');
        const trustedMatch = findCollege(collegeName);
        
        let validatedCategory = 'OTHER';
        let validatedNirf = (nirfRanking && !isNaN(parseInt(nirfRanking))) ? parseInt(nirfRanking) : null;
        let finalCollegeName = collegeName;

        if (trustedMatch) {
            // Use canonical data if matched
            finalCollegeName = trustedMatch.institute_name;
            validatedCategory = mapCategory(trustedMatch.institution_type || trustedMatch.college_type);
            // Only overwrite if the dataset has it; otherwise, keep user input if we trust it, or keep null
            if (trustedMatch.nirf_rank) validatedNirf = parseInt(trustedMatch.nirf_rank);
        } else {
            // Manual Entry Fallback (Requirement: manual entry implemented)
            const allowedCategories = ['IIT', 'NIT', 'IIIT', 'CENTRAL', 'STATE', 'PRIVATE', 'OTHER'];
            validatedCategory = allowedCategories.includes(collegeCategory) ? collegeCategory : 'OTHER';
        }

        let finalPhotoUrl = photoUrl;
        if (req.file) {
            finalPhotoUrl = `uploads/${req.file.filename}`;
        }

        const parsedCgpa = (cgpa && !isNaN(parseFloat(cgpa))) ? parseFloat(cgpa) : 0;

        const profileData = {
            fullName: fullName || "",
            collegeRollNumber: collegeRollNumber || null,
            phone: phone || "",
            dob: new Date(dob),
            address: address || "",
            aadhaarNumber: finalAadhaar || "",
            collegeName: finalCollegeName || "",
            university: university || "",
            degree: degree || "",
            branch: branch || "",
            yearOfStudy: parseInt(yearOfStudy) || 1,
            cgpa: parsedCgpa,
            collegeCategory: validatedCategory,
            nirfRanking: validatedNirf,
            hasExperience: hasExperience === true || hasExperience === 'true',
            hasProjects: hasProjects === true || hasProjects === 'true',
            hasCertifications: hasCertifications === true || hasCertifications === 'true',
            experienceDesc: experienceDesc || null,
            projectsDesc: projectsDesc || null,
            certificationsDesc: certificationsDesc || null,
            skills: skills || null,
            photoUrl: finalPhotoUrl || null,
            linkedinUrl: linkedinUrl || null,
            githubUrl: githubUrl || null
        };


        const profile = await prisma.studentProfile.upsert({
            where: { userId },
            update: profileData,
            create: {
                ...profileData,
                userId
            }
        });

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        // Don't log sensitive data
        console.error('Profile upsert error:', error.message);

        // Handle unique constraint violations with specifics
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Aadhar or Roll Number';
            return res.status(400).json({
                success: false,
                message: `Setup failed: A student with this ${field} already exists in the system.`
            });
        }

        res.status(500).json({ success: false, message: `Server Error: ${error.message}` });
    }
};

/**
 * @desc    Get current student's profile
 * @route   GET /api/v1/students/profile
 * @access  Private (Student)
 */
const getProfile = async (req, res) => {
    try {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id },
            include: {
                applications: {
                    include: {
                        internship: true,
                        stipend: true,
                        mentor: { select: { name: true, email: true, phone: true } },
                        attendance: true,
                        documents: true,
                        departmentGroup: { select: { id: true, department: true, title: true, requiredDocuments: true } },
                        field: { select: { id: true, fieldName: true } }
                    }
                }
            }
        });

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Profile not found' });
        }

        // Ensure each hired/active application has an attendance object (even if empty)
        // to prevent frontend "missing property" issues
        for (const app of profile.applications) {
            if (['SELECTED', 'REPORTED', 'HIRED', 'APPROVED', 'ONGOING', 'COMPLETED'].includes(app.status) && !app.attendance) {
                app.attendance = {
                    daysAttended: 0,
                    totalDays: 0,
                    attendanceLog: [],
                    meetsMinimum: false,
                    minimumDays: 20
                };
            }
        }

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Upsert Stipend Details for an application
 * @route   POST /api/v1/students/applications/:id/stipend
 * @access  Private (Student)
 */
const upsertStipend = async (req, res) => {
    try {
        const { panNumber, bankAccount, ifscCode, bankName, bankBranch } = req.body;
        const applicationId = req.params.id;

        // Verify application belongs to student
        const application = await prisma.application.findFirst({
            where: { id: applicationId, student: { userId: req.user.id } }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        const stipend = await prisma.stipend.upsert({
            where: { applicationId },
            update: { panNumber, bankAccount, ifscCode, bankName, bankBranch },
            create: { applicationId, panNumber, bankAccount, ifscCode, bankName, bankBranch }
        });

        res.status(200).json({ success: true, data: stipend });
    } catch (error) {
        console.error('Stipend upsert error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Upload joining documents (NOC, BOND, UNDERTAKING) after reporting
 * @route   POST /api/v1/students/applications/:id/joining-documents
 * @access  Private (Student)
 *
 * These documents are unlocked only after the student's status is REPORTED or HIRED.
 */
const uploadJoiningDocuments = async (req, res) => {
    try {
        const applicationId = req.params.id;

        const application = await prisma.application.findFirst({
            where: { id: applicationId, student: { userId: req.user.id } }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Full application needed to check internship type + HOD-configured docs
        const appFull = await prisma.application.findFirst({
            where: { id: applicationId },
            include: {
                internship: { select: { internshipType: true } },
                departmentGroup: { select: { requiredDocuments: true } }
            }
        });
        const isLearning = appFull?.internship?.internshipType === 'NON_STIPEND';

        // MONETARY: unlock at REPORTED/HIRED; NON_STIPEND: unlock at DOCUMENTS_PENDING
        const unlockStatuses = isLearning
            ? ['DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED', 'HIRED']
            : ['SELECTED', 'REPORTED', 'HIRED'];

        if (!unlockStatuses.includes(application.status)) {
            return res.status(403).json({
                success: false,
                message: isLearning
                    ? 'Documents can be uploaded once PRTI has triggered document collection.'
                    : 'Joining documents can only be uploaded after your reporting has been confirmed by PRTI'
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'No files uploaded' });
        }

        // Build the allowed doc map from HOD config (fallback to defaults if not configured)
        // configuredDocs: [{ id, label, format, mandatory }]
        const configuredDocs = Array.isArray(appFull?.departmentGroup?.requiredDocuments)
            ? appFull.departmentGroup.requiredDocuments
            : [];
        const docMetaById = {};
        const normalizeId = s => String(s).toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');

        if (configuredDocs.length > 0) {
            configuredDocs.forEach((d, i) => {
                const id = typeof d === 'string' ? normalizeId(d) : (d.id || normalizeId(d.label || `DOC_${i+1}`));
                docMetaById[id] = {
                    id,
                    label: typeof d === 'string' ? d : (d.label || id),
                    format: typeof d === 'object' && ['PDF', 'IMAGE', 'ANY'].includes(d.format) ? d.format : 'PDF',
                };
            });
        } else {
            // Defaults — required from every student after selection
            const DEFAULTS = [
                { id: 'BOND',        label: '₹100 Bond',        format: 'PDF' },
                { id: 'INSURANCE',   label: 'Insurance Policy', format: 'PDF' },
                { id: 'UNDERTAKING', label: 'Undertaking Form', format: 'PDF' },
            ];
            DEFAULTS.forEach(d => { docMetaById[d.id] = d; });
        }

        // Validate doc types
        const invalidDocs = req.files.filter(f => !docMetaById[f.fieldname]);
        if (invalidDocs.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid document type(s): ${invalidDocs.map(f => f.fieldname).join(', ')}. Allowed: ${Object.keys(docMetaById).join(', ')}`
            });
        }

        // Validate file formats against the configured per-doc format
        const fmtErr = [];
        for (const f of req.files) {
            const want = docMetaById[f.fieldname].format;  // PDF | IMAGE | ANY
            const isPdf = f.mimetype === 'application/pdf';
            const isImg = /^image\/(jpeg|jpg|png)$/i.test(f.mimetype);
            const ok = (want === 'PDF' && isPdf) || (want === 'IMAGE' && isImg) || (want === 'ANY' && (isPdf || isImg));
            if (!ok) fmtErr.push(`${docMetaById[f.fieldname].label} must be ${want === 'PDF' ? 'a PDF' : want === 'IMAGE' ? 'an image (JPG/PNG)' : 'a PDF or image'}`);
        }
        if (fmtErr.length > 0) {
            return res.status(400).json({ success: false, message: fmtErr.join('; ') });
        }

        // Save joining dates if provided by student
        const { joiningDate, endDate } = req.body;
        if (joiningDate || endDate) {
            await prisma.application.update({
                where: { id: applicationId },
                data: {
                    ...(joiningDate ? { joiningDate: new Date(joiningDate) } : {}),
                    ...(endDate     ? { endDate:     new Date(endDate)     } : {})
                }
            });
        }

        // Upsert each document (replace if already uploaded)
        for (const file of req.files) {
            const existing = await prisma.document.findFirst({
                where: { applicationId, type: file.fieldname }
            });

            if (existing) {
                await prisma.document.update({
                    where: { id: existing.id },
                    data: { url: file.path, uploadedAt: new Date() }
                });
            } else {
                await prisma.document.create({
                    data: {
                        applicationId,
                        type: file.fieldname,
                        url: file.path,
                        label: docMetaById[file.fieldname]?.label || file.fieldname
                    }
                });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Joining documents uploaded successfully',
            uploadedTypes: req.files.map(f => f.fieldname)
        });
    } catch (error) {
        console.error('Upload joining docs error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Student reapplies for a different location on the same rejected field
 * PUT /students/applications/:id/reapply-location
 */
const reapplyLocation = async (req, res) => {
    const prisma = require('../lib/prisma');
    try {
        const { id } = req.params;
        const { preferredLocation } = req.body;
        if (!preferredLocation) return res.status(400).json({ success: false, message: 'preferredLocation is required' });

        const app = await prisma.application.findUnique({
            where: { id },
            include: {
                internship: { select: { internshipType: true } },
                field: { select: { locations: true } },
                student: { select: { userId: true } }
            }
        });

        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        if (app.student.userId !== req.user.id) return res.status(403).json({ success: false, message: 'Forbidden' });
        if (app.status !== 'REJECTED') return res.status(400).json({ success: false, message: 'Only rejected applications can request a location change' });
        if (app.internship.internshipType !== 'NON_STIPEND') return res.status(400).json({ success: false, message: 'Only Learning Internship applications support location reapply' });

        const fieldLocs = Array.isArray(app.field?.locations) ? app.field.locations : [];
        if (fieldLocs.length > 0 && !fieldLocs.includes(preferredLocation)) {
            return res.status(400).json({ success: false, message: `Location must be one of: ${fieldLocs.join(', ')}` });
        }
        if (preferredLocation === app.preferredLocation) {
            return res.status(400).json({ success: false, message: 'Choose a different location from your previous choice' });
        }

        const updated = await prisma.application.update({
            where: { id },
            data: { status: 'SUBMITTED', preferredLocation }
        });

        res.json({ success: true, data: updated, message: 'Application resubmitted for the new location.' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Student confirms willingness to join and sets their joining/end dates
 * PUT /students/applications/:id/confirm-joining
 */
const confirmJoining = async (req, res) => {
    try {
        const { id } = req.params;
        const { joiningDate, endDate } = req.body;

        if (!joiningDate || !endDate) {
            return res.status(400).json({ success: false, message: 'joiningDate and endDate are required' });
        }

        const app = await prisma.application.findUnique({
            where: { id },
            include: { student: { select: { userId: true } } }
        });
        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        if (app.student.userId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        if (app.status !== 'HIRED') {
            return res.status(400).json({ success: false, message: 'Only HIRED applications can confirm joining' });
        }

        const updated = await prisma.application.update({
            where: { id },
            data: {
                joiningDate: new Date(joiningDate),
                endDate: new Date(endDate),
            }
        });

        res.json({ success: true, data: updated, message: 'Joining confirmed successfully.' });
    } catch (err) {
        console.error('Confirm joining error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Generate and download Offer Letter PDF
 * GET /api/v1/students/applications/:id/offer-letter
 */
const getOfferLetter = async (req, res) => {
    try {
        const { id } = req.params;
        const app = await prisma.application.findUnique({
            where: { id },
            include: {
                student: { include: { user: { select: { email: true } } } },
                internship: { select: { id: true, title: true, internshipType: true, internshipMode: true, duration: true, department: true } },
                field: true,
                departmentGroup: { select: { id: true, department: true, title: true } },
                mentor: { select: { id: true, name: true, email: true } }
            }
        });

        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        
        // Ensure student owns this application or is admin
        if (app.student.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Allow downloading offer letter once they are SELECTED onwards
        const allowedStatuses = ['SELECTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED', 'HIRED', 'ONGOING', 'COMPLETED'];
        if (!allowedStatuses.includes(app.status)) {
            return res.status(400).json({ success: false, message: 'Offer letter not issued yet. Current status: ' + app.status });
        }

        // Construct HTML for Offer Letter
        const year = new Date().getFullYear();
        const date = new Date(app.updatedAt || app.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        const refId = app.id.substring(0, 8).toUpperCase();
        
        const isMonetary = app.internship.internshipType !== 'NON_STIPEND';
        const stipendStatus = isMonetary 
            ? `Monetary Stipend (Based on college category)` 
            : 'Unpaid / Learning Only (No Stipend)';

        const deptName = app.departmentGroup?.department || app.internship.department || 'APTRANSCO Department';
        const fieldName = app.field?.fieldName || 'General Technical Stream';

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #1f2937; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px; }
          .gov-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #1e3a8a; margin: 0; }
          .main-title { font-size: 20px; font-weight: 800; color: #111827; margin: 5px 0 0; text-transform: uppercase; }
          .sub-title { font-size: 13px; font-weight: 600; color: #4b5563; margin: 5px 0 0; }
          .meta-table { width: 100%; margin-bottom: 20px; font-size: 12px; color: #4b5563; }
          .meta-table td { padding: 4px 0; }
          .subject { font-size: 14px; font-weight: 700; margin: 20px 0; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          .content { font-size: 13px; text-align: justify; }
          .details-box { border: 2px solid #1e3a8a; border-radius: 8px; margin: 20px 0; overflow: hidden; }
          .details-header { background-color: #1e3a8a; color: white; padding: 8px 15px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
          .details-table { width: 100%; border-collapse: collapse; }
          .details-table td { padding: 10px 15px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
          .details-table td.label { color: #6b7280; font-weight: 600; text-transform: uppercase; font-size: 11px; width: 35%; }
          .details-table td.value { color: #111827; font-weight: 700; }
          .terms { font-size: 12px; color: #4b5563; margin-top: 25px; background: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; }
          .terms-title { font-weight: 700; color: #111827; margin-bottom: 8px; }
          .signature-section { margin-top: 50px; width: 100%; }
          .signature-table { width: 100%; }
          .signature-title { font-weight: 700; color: #111827; font-size: 13px; }
          .seal { border: 2px dashed #93c5fd; border-radius: 50%; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; color: #1e3a8a; font-size: 8px; font-weight: 800; text-align: center; }
        </style>
        </head>
        <body>
          <div class="header">
            <p class="gov-title">Government of Andhra Pradesh — Energy Department</p>
            <h1 class="main-title">Andhra Pradesh Transmission Corporation Limited</h1>
            <p class="sub-title">Internship Programme · Office of the PRTI</p>
          </div>

          <table class="meta-table">
            <tr>
              <td style="font-weight: 700;">Ref: APT/INT/OFFER/${refId}/${year}</td>
              <td style="text-align: right; font-weight: 700;">Date: ${date}</td>
            </tr>
          </table>

          <h2 style="text-align: center; color: #111827; font-size: 16px; font-weight: 800; text-transform: uppercase; background: #f0f9ff; padding: 10px; border: 1px solid #bfdbfe; border-radius: 6px; margin: 20px 0;">
            Letter of Internship Offer
          </h2>

          <div class="content">
            <p><strong>To,</strong></p>
            <p style="font-size: 14px; font-weight: 700; margin: 0 0 5px;"><strong>${app.student.fullName}</strong></p>
            <p style="color: #6b7280; font-size: 12px; margin: 0;">College: ${app.student.collegeName}</p>

            <div class="subject">
              <strong>Sub:</strong> Offer of Internship — ${app.internship.title}
            </div>

            <p>Dear <strong>${app.student.fullName}</strong>,</p>
            <p>
              APTRANSCO is pleased to offer you a temporary <strong>Learning Internship</strong> position under the APTRANSCO Internship Programme. Based on your academic qualifications, committee evaluation, and branch relevance, you have been selected for the following department and role assignment.
            </p>

            <div class="details-box">
              <div class="details-header">📋 Internship Particulars</div>
              <table class="details-table">
                <tr>
                  <td class="label">Intern Name</td>
                  <td class="value">${app.student.fullName}</td>
                </tr>
                <tr>
                  <td class="label">Programme Name</td>
                  <td class="value">${app.internship.title}</td>
                </tr>
                <tr>
                  <td class="label">Assigned Department</td>
                  <td class="value">${deptName}</td>
                </tr>
                <tr>
                  <td class="label">Field / Specialization</td>
                  <td class="value">${fieldName}</td>
                </tr>
                <tr>
                  <td class="label">Internship Mode</td>
                  <td class="value">${app.internship.internshipMode || 'SINGLE'}</td>
                </tr>
                <tr>
                  <td class="label">Stipend Details</td>
                  <td class="value">${stipendStatus}</td>
                </tr>
              </table>
            </div>

            <p>
              This offer is subject to your verification of physical documents and reporting formalities at the designated office. To accept this offer and proceed, you must upload the required joining documents (No Objection Certificate, Service Bond, and Undertaking Form) through your student portal within the stipulated deadline.
            </p>

            <div class="terms">
              <div class="terms-title">📌 Key Terms of Internship:</div>
              <ol style="margin: 0; padding-left: 15px; line-height: 1.5;">
                <li>This internship is purely educational and does not constitute an offer of permanent employment or guarantee job prospects at APTRANSCO.</li>
                <li>You will be assigned a designated Mentor to oversee your day-to-day work, tasks, and attendance.</li>
                <li>A minimum of 90% attendance is required to qualify for certificate issuance.</li>
                <li>You are required to adhere to all safety protocols, cyber-security policies, and confidentiality agreements during the period.</li>
              </ol>
            </div>

            <p>We welcome you to APTRANSCO and hope this provides a valuable, hands-on learning experience in the energy sector.</p>
          </div>

          <div class="signature-section">
            <table class="signature-table">
              <tr>
                <td style="width: 60%; vertical-align: top;">
                  <p style="margin: 0; line-height: 1.5; font-size: 13px;">
                    Yours sincerely,<br><br><br>
                    <span class="signature-title">PRTI Internship Cell</span><br>
                    <span style="color: #6b7280; font-size: 11px;">Andhra Pradesh Transmission Corporation Limited</span>
                  </p>
                </td>
                <td style="width: 40%; text-align: right; vertical-align: top;">
                  <div style="display: inline-block;">
                    <div class="seal">
                      APTRANSCO<br>PRTI OFFICE<br>SEAL
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </body>
        </html>
        `;

        const { generatePDF } = require('../utils/pdfGenerator');
        const pdfBuffer = await generatePDF(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Offer_Letter_${app.student.fullName.replace(/\s+/g, '_')}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('getOfferLetter error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate Offer Letter PDF' });
    }
};

/**
 * Generate and download Joining Letter PDF
 * GET /api/v1/students/applications/:id/joining-letter
 */
const getJoiningLetter = async (req, res) => {
    try {
        const { id } = req.params;
        const app = await prisma.application.findUnique({
            where: { id },
            include: {
                student: { include: { user: { select: { email: true } } } },
                internship: { select: { id: true, title: true, internshipType: true, internshipMode: true, duration: true, department: true } },
                field: true,
                departmentGroup: { select: { id: true, department: true, title: true } },
                mentor: { select: { id: true, name: true, email: true, phone: true } }
            }
        });

        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        
        // Ensure student owns this application or is admin
        if (app.student.userId !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Allow downloading joining letter once they are HIRED onwards
        const allowedStatuses = ['HIRED', 'ONGOING', 'COMPLETED'];
        if (!allowedStatuses.includes(app.status)) {
            return res.status(400).json({ success: false, message: 'Joining letter not issued yet. Current status: ' + app.status });
        }

        // Format dates
        const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) : 'To be confirmed';
        const fmtShort = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
        
        const year = new Date().getFullYear();
        const refId = app.student.rollNumber || 'NEW';
        
        const deptName = app.departmentGroup?.department || app.internship.department || 'APTRANSCO Department';
        const fieldName = app.field?.fieldName || 'General Technical Stream';
        const locationName = app.preferredLocation || 'APTRANSCO Divisional Office';

        const totalDays = app.joiningDate && app.endDate
            ? Math.max(0, Math.ceil((new Date(app.endDate) - new Date(app.joiningDate)) / (1000 * 60 * 60 * 24)))
            : null;

        const html = `
        <!DOCTYPE html>
        <html>
        <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; color: #1f2937; line-height: 1.6; }
          .official-band { background: linear-gradient(90deg,#FF9933 0%,#FFFFFF 50%,#138808 100%); height: 4px; margin-bottom: 20px; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 15px; margin-bottom: 25px; }
          .gov-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #1e3a8a; margin: 0; }
          .main-title { font-size: 20px; font-weight: 800; color: #111827; margin: 5px 0 0; text-transform: uppercase; }
          .sub-title { font-size: 13px; font-weight: 600; color: #4b5563; margin: 5px 0 0; }
          .meta-table { width: 100%; margin-bottom: 20px; font-size: 12px; color: #4b5563; }
          .meta-table td { padding: 4px 0; }
          .subject { font-size: 14px; font-weight: 700; margin: 20px 0; color: #111827; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
          .content { font-size: 13px; text-align: justify; }
          .details-box { border: 2px solid #1e40af; border-radius: 8px; margin: 20px 0; overflow: hidden; }
          .details-header { background-color: #1e40af; color: white; padding: 8px 15px; font-size: 12px; font-weight: 800; text-transform: uppercase; }
          .details-table { width: 100%; border-collapse: collapse; }
          .details-table td { padding: 8px 15px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
          .details-table td.label { color: #6b7280; font-weight: 700; text-transform: uppercase; font-size: 11px; width: 35%; }
          .details-table td.value { color: #111827; font-weight: 700; }
          .details-table tr.highlight-green { background-color: #f0fdf4; }
          .details-table tr.highlight-green td.label { color: #15803d; }
          .details-table tr.highlight-amber { background-color: #fef9ec; }
          .details-table tr.highlight-amber td.label { color: #b45309; }
          .reminder-box { margin: 20px 0; padding: 15px; background: #eff6ff; border-left: 4px solid #1e40af; border-radius: 0 8px 8px 0; font-size: 12px; line-height: 1.5; color: #1e3a8a; }
          .signature-section { margin-top: 50px; width: 100%; }
          .signature-table { width: 100%; }
          .signature-title { font-weight: 700; color: #111827; font-size: 13px; }
          .seal { border: 2px dashed #93c5fd; border-radius: 50%; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; color: #1e40af; font-size: 8px; font-weight: 800; text-align: center; }
        </style>
        </head>
        <body>
          <div class="official-band"></div>
          <div class="header">
            <p class="gov-title">Government of Andhra Pradesh — Energy Department</p>
            <h1 class="main-title">Andhra Pradesh Transmission Corporation Limited</h1>
            <p class="sub-title">Internship Programme · Office of the PRTI</p>
          </div>

          <table class="meta-table">
            <tr>
              <td style="font-weight: 700;">Ref: APT/INT/${refId}/${year}</td>
              <td style="text-align: right; font-weight: 700;">Date: ${fmtShort(new Date())}</td>
            </tr>
          </table>

          <h2 style="text-align: center; color: #111827; font-size: 16px; font-weight: 800; text-transform: uppercase; background: #f0f9ff; padding: 10px; border: 1px solid #bfdbfe; border-radius: 6px; margin: 20px 0;">
            Letter of Internship Commencement
          </h2>

          <div class="content">
            <p><strong>To,</strong></p>
            <p style="font-size: 14px; font-weight: 700; margin: 0 0 5px;"><strong>${app.student.fullName}</strong></p>
            <p style="color: #6b7280; font-size: 12px; margin: 0;">Roll Number: <strong style="color:#1e40af;font-family:monospace;">${refId}</strong></p>

            <div class="subject">
              <strong>Sub:</strong> Confirmation of Internship — ${app.internship.title}
            </div>

            <p>Dear <strong>${app.student.fullName}</strong>,</p>
            <p>
              With reference to your application and the successful verification of your submitted documents, the Andhra Pradesh Transmission Corporation Limited is pleased to formally confirm your appointment as an <strong>Intern</strong> under the APTRANSCO Internship Programme in the <strong>${deptName}</strong> Department, at <strong>${locationName}</strong>.
            </p>

            <div class="details-box">
              <div class="details-header">📋 Appointment Particulars</div>
              <table class="details-table">
                <tr>
                  <td class="label">Intern Name</td>
                  <td class="value">${app.student.fullName}</td>
                </tr>
                <tr>
                  <td class="label">Roll Number</td>
                  <td class="value" style="color: #1e40af; font-family: monospace; font-weight: 800;">${refId}</td>
                </tr>
                <tr>
                  <td class="label">Programme</td>
                  <td class="value">${app.internship.title}</td>
                </tr>
                <tr>
                  <td class="label">Field / Stream</td>
                  <td class="value">${fieldName}</td>
                </tr>
                <tr>
                  <td class="label">Reporting Location</td>
                  <td class="value">${locationName}</td>
                </tr>
                <tr class="highlight-green">
                  <td class="label">📅 Joining Date</td>
                  <td class="value" style="color: #14532d; font-weight: 800;">${fmtDate(app.joiningDate)}</td>
                </tr>
                <tr class="highlight-amber">
                  <td class="label">🏁 End Date</td>
                  <td class="value" style="color: #78350f; font-weight: 800;">${fmtDate(app.endDate)}</td>
                </tr>
                ${totalDays ? `
                <tr>
                  <td class="label">Duration</td>
                  <td class="value">${totalDays} Day${totalDays !== 1 ? 's' : ''}</td>
                </tr>
                ` : ''}
                ${app.mentor ? `
                <tr>
                  <td class="label">Assigned Mentor</td>
                  <td class="value">${app.mentor.name} (${app.mentor.email || ''})</td>
                </tr>
                ` : ''}
              </table>
            </div>

            <p>
              You are advised to report to the assigned location on <strong>${fmtShort(app.joiningDate)}</strong> by 10:00 AM. Please carry a printed copy of this letter, your college Identity Card, and your Aadhaar Card.
            </p>

            <div class="reminder-box">
              <strong>📌 Working Days & Conduct</strong><br>
              Your effective working days will be counted from ${fmtShort(app.joiningDate)} to ${fmtShort(app.endDate)}. You are expected to maintain professional conduct, submit daily work logs through the portal, and complete all assignments given by your mentor. A minimum of 90% attendance is strictly enforced for certification.
            </div>

            <p>We extend a warm welcome to APTRANSCO and wish you a highly productive and rewarding internship experience.</p>
          </div>

          <div class="signature-section">
            <table class="signature-table">
              <tr>
                <td style="width: 60%; vertical-align: top;">
                  <p style="margin: 0; line-height: 1.5; font-size: 13px;">
                    Yours sincerely,<br><br><br>
                    <strong style="color: #111827;">PRTI Internship Cell</strong><br>
                    <span style="color: #6b7280; font-size: 11px;">Andhra Pradesh Transmission Corporation Limited</span>
                  </p>
                </td>
                <td style="width: 40%; text-align: right; vertical-align: top;">
                  <div style="display: inline-block;">
                    <div class="seal">
                      APTRANSCO<br>SEAL
                    </div>
                  </div>
                </td>
              </tr>
            </table>
          </div>
        </body>
        </html>
        `;

        const { generatePDF } = require('../utils/pdfGenerator');
        const pdfBuffer = await generatePDF(html);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Joining_Letter_${app.student.fullName.replace(/\s+/g, '_')}.pdf`);
        res.send(pdfBuffer);
    } catch (err) {
        console.error('getJoiningLetter error:', err.message);
        res.status(500).json({ success: false, message: 'Failed to generate Joining Letter PDF' });
    }
};

module.exports = {
    upsertProfile,
    getProfile,
    upsertStipend,
    uploadJoiningDocuments,
    reapplyLocation,
    confirmJoining,
    getOfferLetter,
    getJoiningLetter,
};
