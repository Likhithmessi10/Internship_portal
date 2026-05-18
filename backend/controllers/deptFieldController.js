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
        const { fieldName, specializations, locations } = req.body;
        if (!fieldName) return res.status(400).json({ success: false, message: 'fieldName is required' });

        const dept = await prisma.departmentMaster.findUnique({ where: { id: deptId } });
        if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

        // HOD can only manage their own department
        if (req.user.role === 'HOD') {
            const hodDept = req.user.department?.toUpperCase().trim();
            if (dept.code?.toUpperCase() !== hodDept && dept.name?.toUpperCase() !== hodDept) {
                return res.status(403).json({ success: false, message: 'You can only manage fields for your own department.' });
            }
        }

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
            data: {
                departmentId: deptId,
                fieldCode,
                fieldName,
                fieldNumber,
                specializations: Array.isArray(specializations) ? specializations : [],
                locations: Array.isArray(locations) ? locations : []
            }
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
        const { isActive, specializations, locations } = req.body;
        // NOTE: fieldCode, fieldName, fieldNumber, departmentId — all immutable for roll number stability

        const field = await prisma.fieldMaster.findFirst({
            where: { id: fieldId, departmentId: deptId },
            include: { department: true }
        });
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

        // HOD can only update their own department's fields
        if (req.user.role === 'HOD') {
            const hodDept = req.user.department?.toUpperCase().trim();
            const deptCode = field.department?.code?.toUpperCase();
            const deptName = field.department?.name?.toUpperCase();
            if (deptCode !== hodDept && deptName !== hodDept) {
                return res.status(403).json({ success: false, message: 'You can only manage fields for your own department.' });
            }
        }

        const updated = await prisma.fieldMaster.update({
            where: { id: fieldId },
            data: {
                isActive: isActive ?? field.isActive,
                ...(Array.isArray(specializations) && { specializations }),
                ...(Array.isArray(locations) && { locations })
            }
        });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteField = async (req, res) => {
    try {
        const { deptId, fieldId } = req.params;
        const field = await prisma.fieldMaster.findFirst({ where: { id: fieldId, departmentId: deptId } });
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

        // Block deletion if any application references this field master
        const usedInApp = await prisma.internshipField.findFirst({ where: { fieldMasterId: fieldId } });
        if (usedInApp) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete — this field is linked to one or more internship postings. Deactivate it instead.'
            });
        }

        await prisma.fieldMaster.delete({ where: { id: fieldId } });
        res.json({ success: true, message: 'Field deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

const deleteDepartment = async (req, res) => {
    try {
        const { id } = req.params;
        const dept = await prisma.departmentMaster.findUnique({ where: { id }, include: { fields: true } });
        if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

        // Block if any field is in use
        if (dept.fields.length > 0) {
            const fieldIds = dept.fields.map(f => f.id);
            const usedField = await prisma.internshipField.findFirst({ where: { fieldMasterId: { in: fieldIds } } });
            if (usedField) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete — one or more fields in this department are linked to internship postings. Deactivate the department instead.'
                });
            }
            // Delete fields first
            await prisma.fieldMaster.deleteMany({ where: { departmentId: id } });
        }

        await prisma.departmentMaster.delete({ where: { id } });
        res.json({ success: true, message: 'Department deleted' });
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
                departmentGroup: { select: { requiredDocuments: true, department: true } },
                field: { select: { fieldName: true } },
                student: { include: { user: { select: { email: true } } } }
            },
        });

        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
        if (app.internship.internshipType !== 'NON_STIPEND') {
            return res.status(400).json({ success: false, message: 'Only Learning Internship applications use this flow' });
        }
        if (app.status !== 'SELECTED') {
            return res.status(400).json({ success: false, message: `Application must be SELECTED (currently ${app.status})` });
        }
        if (!app.prtiApproved) {
            return res.status(403).json({ success: false, message: 'PRTI has not yet approved this selection. Please wait for PRTI to verify and proceed.' });
        }

        await prisma.application.update({ where: { id }, data: { status: 'DOCUMENTS_PENDING' } });

        // Notify student with the proper template — include HOD-configured docs
        const { sendDocumentRequestEmail } = require('../services/mailService');
        const studentEmail = app.student?.user?.email;
        if (studentEmail) {
            const configured = Array.isArray(app.departmentGroup?.requiredDocuments) ? app.departmentGroup.requiredDocuments : [];
            sendDocumentRequestEmail(studentEmail, {
                studentName: app.student.fullName,
                internshipTitle: app.internship.title,
                fieldName: app.field?.fieldName,
                location: app.preferredLocation,
                requiredDocs: configured,
                deadlineDays: 7,
            }).catch(() => {});
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

            // Auto-hire immediately after verification
            const { transitionApplicationStatus } = require('../services/applicationWorkflowService');
            let hiredOk = false;
            try {
                const appForRole = await prisma.application.findUnique({
                    where: { id },
                    select: { field: { select: { fieldName: true } }, assignedRole: true }
                });
                await transitionApplicationStatus(id, 'HIRED', req.user, 'Auto-hired after document verification.');
                if (appForRole?.field?.fieldName && !appForRole.assignedRole) {
                    await prisma.application.update({ where: { id }, data: { assignedRole: appForRole.field.fieldName } });
                }
                hiredOk = true;
            } catch (hireErr) {
                console.error('[Auto-hire error]', hireErr.message);
                // Don't fail the request — student is at least DOCUMENTS_VERIFIED
            }

            // Send the grand joining letter to the student once hired
            if (hiredOk) {
                try {
                    const hired = await prisma.application.findUnique({
                        where: { id },
                        include: {
                            internship: { select: { title: true } },
                            field:      { select: { fieldName: true } },
                            departmentGroup: { select: { department: true } },
                            mentor:     { select: { name: true, email: true, phone: true } },
                            student:    { include: { user: { select: { email: true } } } }
                        }
                    });
                    const studentEmail = hired?.student?.user?.email;
                    if (studentEmail) {
                        const { sendGrandJoiningLetter } = require('../services/mailService');
                        sendGrandJoiningLetter(studentEmail, {
                            studentName:     hired.student.fullName,
                            rollNumber:      hired.student.rollNumber,
                            internshipTitle: hired.internship?.title,
                            fieldName:       hired.field?.fieldName,
                            department:      hired.departmentGroup?.department || hired.internship?.department,
                            location:        hired.preferredLocation,
                            joiningDate:     hired.joiningDate,
                            endDate:         hired.endDate,
                            mentorName:      hired.mentor?.name,
                            mentorEmail:     hired.mentor?.email,
                            mentorPhone:     hired.mentor?.phone,
                            hodName:         req.user?.name || `${hired.departmentGroup?.department || ''} HOD`.trim(),
                        }).catch(() => {});
                    }
                } catch (mailErr) {
                    console.error('[Joining letter error]', mailErr.message);
                }
            }

            res.json({ success: true, message: 'Documents verified and intern hired. Joining letter dispatched.' });
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

/**
 * Re-sequence deptNumber and fieldNumber values to fill gaps after deletions.
 * Orders by current deptNumber, reassigns 1, 2, 3...
 * Also re-sequences fieldNumber within each dept.
 * WARNING: invalidates any roll numbers already generated.
 * POST /admin/dept-master/resequence
 */
const resequenceDepts = async (req, res) => {
    try {
        // Check if any learning internship applications have roll numbers already set
        const hiredApps = await prisma.application.findMany({
            where: {
                internship: { internshipType: 'NON_STIPEND' },
                status: { in: ['HIRED', 'ONGOING', 'COMPLETED'] },
                student: { rollNumber: { not: null } }
            },
            select: { id: true }
        });

        if (hiredApps.length > 0 && !req.body.force) {
            return res.status(409).json({
                success: false,
                message: `${hiredApps.length} student(s) already have roll numbers generated from current dept/field numbers. Re-sequencing will make those roll numbers inconsistent. Send force:true to proceed anyway.`,
                hiredCount: hiredApps.length
            });
        }

        // Fetch all depts ordered by current deptNumber
        const depts = await prisma.departmentMaster.findMany({
            include: { fields: { orderBy: { fieldNumber: 'asc' } } },
            orderBy: { deptNumber: 'asc' }
        });

        // Use a transaction to atomically renumber everything
        await prisma.$transaction(async (tx) => {
            // Step 1: set all deptNumbers to large temporary values to avoid unique conflicts
            for (let i = 0; i < depts.length; i++) {
                await tx.departmentMaster.update({
                    where: { id: depts[i].id },
                    data: { deptNumber: 10000 + i }
                });
            }
            // Step 2: assign final sequential values
            for (let i = 0; i < depts.length; i++) {
                const newDeptNum = i + 1;
                await tx.departmentMaster.update({
                    where: { id: depts[i].id },
                    data: { deptNumber: newDeptNum }
                });

                // Re-sequence fields within this dept
                const fields = depts[i].fields;
                // Temp values first
                for (let j = 0; j < fields.length; j++) {
                    await tx.fieldMaster.update({
                        where: { id: fields[j].id },
                        data: { fieldNumber: 10000 + j }
                    });
                }
                // Final sequential values
                for (let j = 0; j < fields.length; j++) {
                    await tx.fieldMaster.update({
                        where: { id: fields[j].id },
                        data: { fieldNumber: j + 1 }
                    });
                }
            }
        });

        res.json({ success: true, message: `Re-sequenced ${depts.length} departments.` });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
    getDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    getFields,
    createField,
    updateField,
    deleteField,
    requestDocuments,
    verifyDocuments,
    getLearningPendingDocs,
    resequenceDepts
};
