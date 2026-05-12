const prisma = require('../lib/prisma');
const { createAuditLog } = require('../utils/auditLogger');

// ── Department Master ─────────────────────────────────────────────────────────

const getDepartments = async (req, res) => {
    try {
        const showAll = req.query.all === 'true';
        const depts = await prisma.departmentMaster.findMany({
            where: showAll ? {} : { isActive: true },
            include: {
                _count: { select: { fields: true } },
                fields: {
                    where: showAll ? {} : { isActive: true },
                    orderBy: { fieldNumber: 'asc' }
                }
            },
            orderBy: { deptNumber: 'asc' }
        });
        res.json({ success: true, data: depts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const createDepartment = async (req, res) => {
    try {
        const { name, code } = req.body;
        if (!name || !code) return res.status(400).json({ success: false, message: 'name and code are required' });

        // Auto-assign next deptNumber (immutable)
        const last = await prisma.departmentMaster.findFirst({ orderBy: { deptNumber: 'desc' } });
        const deptNumber = (last?.deptNumber || 0) + 1;

        const dept = await prisma.departmentMaster.create({
            data: { name, code: code.toUpperCase().trim(), deptNumber, createdBy: req.user.id }
        });

        await createAuditLog('CREATE_DEPT_MASTER', req.user.email, `Created department "${name}" (${code}) #${deptNumber}`, dept.id);
        res.status(201).json({ success: true, data: dept });
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'Department name or code already exists' });
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, isActive } = req.body;
        // NOTE: deptNumber and code are immutable — never updated

        const updateData = {};
        if (name !== undefined) updateData.name = name;
        if (isActive !== undefined) updateData.isActive = isActive;

        const dept = await prisma.departmentMaster.update({ where: { id }, data: updateData });
        res.json({ success: true, data: dept });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── Field Master ──────────────────────────────────────────────────────────────

const getFields = async (req, res) => {
    try {
        const { deptId } = req.params;
        const showAll = req.query.all === 'true';
        const fields = await prisma.fieldMaster.findMany({
            where: { departmentId: deptId, ...(showAll ? {} : { isActive: true }) },
            orderBy: { fieldNumber: 'asc' }
        });
        res.json({ success: true, data: fields });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const createField = async (req, res) => {
    try {
        const { deptId } = req.params;
        const { fieldName } = req.body;
        if (!fieldName) return res.status(400).json({ success: false, message: 'fieldName is required' });

        const dept = await prisma.departmentMaster.findUnique({ where: { id: deptId } });
        if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

        // Append-only: assign next fieldNumber within this dept (immutable)
        const last = await prisma.fieldMaster.findFirst({
            where: { departmentId: deptId },
            orderBy: { fieldNumber: 'desc' }
        });
        const fieldNumber = (last?.fieldNumber || 0) + 1;

        // Auto-generate fieldCode: {DEPTCODE}-{FIELDNAME_SHORT}-{padded}
        const nameSlug = fieldName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        const fieldCode = `${dept.code}-${nameSlug}-${String(fieldNumber).padStart(3, '0')}`;

        // Ensure no duplicate fieldCode
        const existing = await prisma.fieldMaster.findUnique({ where: { fieldCode } });
        if (existing) return res.status(400).json({ success: false, message: `Field code ${fieldCode} already exists` });

        const field = await prisma.fieldMaster.create({
            data: { departmentId: deptId, fieldCode, fieldName, fieldNumber }
        });

        await createAuditLog('CREATE_FIELD_MASTER', req.user.email, `Added field "${fieldName}" (${fieldCode}) to ${dept.code}`, field.id);
        res.status(201).json({ success: true, data: field });
    } catch (err) {
        if (err.code === 'P2002') return res.status(400).json({ success: false, message: 'Field code must be unique' });
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateField = async (req, res) => {
    try {
        const { deptId, fieldId } = req.params;
        const { isActive } = req.body;
        // NOTE: fieldCode, fieldName, fieldNumber, departmentId — all immutable for roll number stability

        const field = await prisma.fieldMaster.findFirst({ where: { id: fieldId, departmentId: deptId } });
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

        const updated = await prisma.fieldMaster.update({
            where: { id: fieldId },
            data: { isActive: isActive ?? field.isActive }
        });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// ── PRTI Document Verification Flow ──────────────────────────────────────────

/**
 * PRTI triggers document collection after HOD selects (SELECTED → DOCUMENTS_PENDING)
 * POST /admin/applications/:id/request-documents
 */
const requestDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const app = await prisma.application.findUnique({
            where: { id },
            include: {
                internship: { select: { internshipType: true, title: true } },
                student: { include: { user: { select: { email: true } } } }
            }
        });

        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        if (app.internship.internshipType !== 'NON_STIPEND') {
            return res.status(400).json({ success: false, message: 'Only Learning Internship applications use this flow' });
        }
        if (app.status !== 'SELECTED') {
            return res.status(400).json({ success: false, message: `Application must be SELECTED (currently ${app.status})` });
        }

        await prisma.application.update({ where: { id }, data: { status: 'DOCUMENTS_PENDING' } });

        // Notify student
        const { sendEmail } = require('../services/mailService');
        const studentEmail = app.student?.user?.email;
        if (studentEmail) {
            sendEmail(studentEmail, 'Action Required: Upload Joining Documents',
                `<h3>Dear ${app.student.fullName},</h3>
                <p>Congratulations! You have been selected for the <strong>${app.internship.title}</strong> Learning Internship.</p>
                <p>Please log in to the portal and upload the following joining documents:</p>
                <ul><li>NOC (No Objection Certificate)</li><li>Bond</li><li>Undertaking</li><li>Insurance</li></ul>
                <p>Best Regards,<br>APTRANSCO Internship Cell</p>`
            ).catch(() => {});
        }

        await createAuditLog('REQUEST_DOCUMENTS', req.user.email, 'Triggered document collection', id);
        res.json({ success: true, message: 'Document collection triggered' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PRTI verifies documents (DOCUMENTS_PENDING → DOCUMENTS_VERIFIED)
 * POST /admin/applications/:id/verify-documents
 */
const verifyDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, reason } = req.body; // action: 'approve' | 'reject'

        const app = await prisma.application.findUnique({
            where: { id },
            include: {
                internship: { select: { internshipType: true } },
                documents: true,
                student: { include: { user: { select: { email: true } } } }
            }
        });

        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        if (app.internship.internshipType !== 'NON_STIPEND') {
            return res.status(400).json({ success: false, message: 'Only for Learning Internships' });
        }
        if (app.status !== 'DOCUMENTS_PENDING') {
            return res.status(400).json({ success: false, message: `Status must be DOCUMENTS_PENDING (currently ${app.status})` });
        }

        if (action === 'approve') {
            // Mark all docs as verified
            await prisma.document.updateMany({
                where: { applicationId: id },
                data: { verified: true }
            });
            await prisma.application.update({ where: { id }, data: { status: 'DOCUMENTS_VERIFIED' } });
            await createAuditLog('VERIFY_DOCUMENTS', req.user.email, 'Documents approved', id);
            res.json({ success: true, message: 'Documents verified' });
        } else {
            // Reject — send back with reason, keep status for re-upload
            const { sendEmail } = require('../services/mailService');
            const studentEmail = app.student?.user?.email;
            if (studentEmail && reason) {
                sendEmail(studentEmail, 'Document Verification — Action Required',
                    `<h3>Dear ${app.student.fullName},</h3>
                    <p>Your documents need attention: <strong>${reason}</strong></p>
                    <p>Please re-upload the required documents on the portal.</p>`
                ).catch(() => {});
            }
            await createAuditLog('REJECT_DOCUMENTS', req.user.email, `Docs rejected: ${reason || 'no reason'}`, id);
            res.json({ success: true, message: 'Rejection notified to student' });
        }
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PRTI: get all NON_STIPEND applications pending doc review
 * GET /admin/learning/pending-docs
 */
const getLearningPendingDocs = async (req, res) => {
    try {
        const apps = await prisma.application.findMany({
            where: {
                internship: { internshipType: 'NON_STIPEND' },
                status: { in: ['SELECTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED'] }
            },
            include: {
                student: { select: { fullName: true, collegeName: true, rollNumber: true, user: { select: { email: true } } } },
                internship: { select: { id: true, title: true } },
                field: { include: { fieldMaster: { include: { department: true } } } },
                departmentGroup: { select: { department: true } },
                documents: true
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.json({ success: true, data: apps });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getDepartments,
    createDepartment,
    updateDepartment,
    getFields,
    createField,
    updateField,
    requestDocuments,
    verifyDocuments,
    getLearningPendingDocs
};
