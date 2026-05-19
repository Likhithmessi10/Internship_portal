const express = require('express');
const {
    createInternship,
    getAllInternships,
    deleteInternship,
    toggleInternship,
    getApplications,
    getRejectedApplications,
    updateApplicationStatus,
    exportApplications,
    extendDeadline,
    getPortalConfig,
    updatePortalConfig,
    getCommitteeDetails,
    updateCommitteeDetails,
    getUsersByRole,
    updateUserRole,
    deleteUser,
    getStipendDetails,
    updateStipendDetails,
    getAllInterns,
    getMeetings,
    getMentorMeetings,
    assignWork,
    getWorkAssignments,
    addDepartmentGroup,
    updateDepartmentGroup,
    deleteDepartmentGroup,
    getBatches,
    createBatch,
    deleteBatch,
    searchInternByRollNumber,
    getBatchDetails,
    getHodPendingSubmissions,
    getHodGroupSubmissions,
    getGroupInternshipProgress,
    getHodPsApplications,
    getHodLearningApplications,
    addGroupField,
    deleteGroupField,
    assignApplicationMentor,
    setFieldHeldSeats
} = require('../controllers/adminController');
const { getAuditLogs } = require('../controllers/auditController');
const { getSystemHealth } = require('../controllers/systemController');
const {
    markAttendance,
    getAttendance,
    bulkMarkAttendance
} = require('../controllers/attendanceController');
const {
    submitProblemStatement,
    getProblemStatements,
    updateProblemStatement,
    deleteProblemStatement,
    assignPsMentor
} = require('../controllers/hodProblemStatementController');
const {
    getDepartments, createDepartment, updateDepartment, deleteDepartment,
    getFields, createField, updateField, deleteField,
    requestDocuments, verifyDocuments, getLearningPendingDocs, resequenceDepts
} = require('../controllers/deptFieldController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { getApplicationWorkLogs, exportApplicationWorkLogs, exportInternshipWorkLogs } = require('../controllers/workLogController');

const router = express.Router();

// Publicly accessible configurations (needed for registration)
router.get('/config', getPortalConfig);

router.use(protect);
router.use(authorize('ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'));

// Portal Configuration Updates (Admin Only)
router.put('/config', authorize('ADMIN'), updatePortalConfig);

// Internship Management
router.get('/batches', getBatches);
router.get('/batches/:id/details', authorize('ADMIN', 'CE_PRTI', 'HOD'), getBatchDetails);
router.post('/batches', authorize('ADMIN', 'CE_PRTI', 'HOD'), createBatch);
router.delete('/batches/:id', authorize('ADMIN', 'CE_PRTI', 'HOD'), deleteBatch);

router.get('/internships', getAllInternships);
router.get('/interns/all', authorize('ADMIN', 'CE_PRTI', 'HOD', 'MENTOR'), getAllInterns);
router.get('/interns/search/:rollNumber', authorize('ADMIN', 'CE_PRTI', 'HOD', 'MENTOR'), searchInternByRollNumber);
router.get('/meetings', authorize('ADMIN', 'CE_PRTI', 'HOD'), getMeetings);
router.post('/internships', createInternship);
router.delete('/internships/:id', authorize('ADMIN', 'CE_PRTI', 'HOD'), deleteInternship);
router.put('/internships/:id/toggle', toggleInternship);

// Upload Job Description (JD) for an internship
router.post(
    '/internships/:id/upload-jd',
    authorize('ADMIN', 'CE_PRTI', 'HOD'),
    require('../middleware/uploadMiddleware').single('jd'),
    async (req, res) => {
        try {
            const { id } = req.params;
            if (!req.file) return res.status(400).json({ success: false, message: 'No JD file uploaded' });

            const prisma = require('../lib/prisma');
            const internship = await prisma.internship.findUnique({ where: { id } });
            if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });

            const updated = await prisma.internship.update({
                where: { id },
                data: {
                    jdUrl:      req.file.path.replace(/\\/g, '/'),
                    jdFileName: req.file.originalname,
                },
                select: { id: true, jdUrl: true, jdFileName: true }
            });
            res.json({ success: true, data: updated });
        } catch (err) {
            console.error('Upload JD error:', err.message);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
);

// Remove Job Description for an internship
router.delete(
    '/internships/:id/upload-jd',
    authorize('ADMIN', 'CE_PRTI', 'HOD'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const prisma = require('../lib/prisma');
            await prisma.internship.update({
                where: { id },
                data: { jdUrl: null, jdFileName: null }
            });
            res.json({ success: true });
        } catch (err) {
            console.error('Delete JD error:', err.message);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
);
router.put('/internships/:id/publish', authorize('ADMIN', 'CE_PRTI', 'HOD'), async (req, res) => {
    try {
        await require('../lib/prisma').internship.update({
            where: { id: req.params.id },
            data: { publishStatus: 'LIVE' }
        });
        res.json({ success: true, message: 'Internship published' });
    } catch (err) {
        console.error('Publish internship error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});
router.put('/internships/:id/deadline', extendDeadline);

// HOD: pending GROUP internship problem-statement submissions (used by dashboard banner)
router.get('/hod/pending-group-submissions', authorize('ADMIN', 'CE_PRTI', 'HOD'), getHodPendingSubmissions);
// HOD: ALL group submissions — pending + submitted (used by problem-statements page)
router.get('/hod/group-submissions', authorize('ADMIN', 'CE_PRTI', 'HOD'), getHodGroupSubmissions);
// HOD: problem statements with nested applications (used by Applications page)
router.get('/hod/ps-applications', authorize('ADMIN', 'CE_PRTI', 'HOD'), getHodPsApplications);
// HOD: Learning Internship (NON_STIPEND) applications for their dept
router.get('/hod/learning-applications', authorize('ADMIN', 'CE_PRTI', 'HOD'), getHodLearningApplications);

// ── Department & Field Master (Learning Internship configuration) ─────────────
router.post('/dept-master/resequence',                  authorize('ADMIN', 'CE_PRTI'), resequenceDepts);
router.get('/dept-master',                              authorize('ADMIN', 'CE_PRTI', 'HOD'), getDepartments);
router.post('/dept-master',                             authorize('ADMIN', 'CE_PRTI'), createDepartment);
router.put('/dept-master/:id',                          authorize('ADMIN', 'CE_PRTI'), updateDepartment);
router.delete('/dept-master/:id',                       authorize('ADMIN', 'CE_PRTI'), deleteDepartment);
router.get('/dept-master/:deptId/fields',               authorize('ADMIN', 'CE_PRTI', 'HOD'), getFields);
router.post('/dept-master/:deptId/fields',              authorize('ADMIN', 'CE_PRTI', 'HOD'), createField);
router.put('/dept-master/:deptId/fields/:fieldId',      authorize('ADMIN', 'CE_PRTI', 'HOD'), updateField);
router.delete('/dept-master/:deptId/fields/:fieldId',   authorize('ADMIN', 'CE_PRTI'), deleteField);

// ── PRTI Document Verification Flow (Learning Internships) ───────────────────
router.get('/learning/pending-docs',                  authorize('ADMIN', 'CE_PRTI'), getLearningPendingDocs);
router.post('/applications/:id/request-documents',    authorize('ADMIN', 'CE_PRTI', 'HOD'), requestDocuments);
router.post('/applications/:id/verify-documents',     authorize('ADMIN', 'CE_PRTI', 'HOD'), verifyDocuments);
// GROUP NON_STIPEND: field management per dept group
router.post('/internships/:id/groups/:groupId/fields', authorize('ADMIN', 'CE_PRTI', 'HOD'), addGroupField);
router.delete('/internships/:id/groups/:groupId/fields/:fieldId', authorize('ADMIN', 'CE_PRTI', 'HOD'), deleteGroupField);
router.patch('/internships/:id/groups/:groupId/fields/:fieldId/held-seats', authorize('ADMIN', 'CE_PRTI'), setFieldHeldSeats);

// PRTI: department-wise submission progress for a GROUP internship
router.get('/internships/:id/group-progress', authorize('ADMIN', 'CE_PRTI'), getGroupInternshipProgress);

// Department Group CRUD (for GROUP internships)
router.post('/internships/:id/groups', authorize('ADMIN', 'CE_PRTI', 'HOD'), addDepartmentGroup);
router.put('/internships/:id/groups/:groupId', authorize('ADMIN', 'CE_PRTI', 'HOD'), updateDepartmentGroup);
router.delete('/internships/:id/groups/:groupId', authorize('ADMIN', 'CE_PRTI'), deleteDepartmentGroup);

// Problem Statements (HOD submits for their dept group)
router.get('/internships/:id/groups/:groupId/problem-statements', authorize('ADMIN', 'CE_PRTI', 'HOD'), getProblemStatements);
router.post('/internships/:id/groups/:groupId/problem-statements', authorize('ADMIN', 'CE_PRTI', 'HOD'), submitProblemStatement);
router.put('/internships/:id/groups/:groupId/problem-statements/:psId', authorize('ADMIN', 'CE_PRTI', 'HOD'), updateProblemStatement);
router.delete('/internships/:id/groups/:groupId/problem-statements/:psId', authorize('ADMIN', 'CE_PRTI', 'HOD'), deleteProblemStatement);
router.put('/internships/:id/groups/:groupId/problem-statements/:psId/mentor', authorize('ADMIN', 'CE_PRTI', 'HOD'), assignPsMentor);

// Committee Management
router.get('/internships/:id/committee', getCommitteeDetails);
router.put('/internships/:id/committee', updateCommitteeDetails);

// Application Management
const { submitEvaluation } = require('../controllers/prtiController');
router.get('/internships/:id/applications', authorize('ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), getApplications);
router.get('/internships/:id/export', authorize('ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), exportApplications);
router.get('/applications/rejected', authorize('ADMIN', 'HOD'), getRejectedApplications);
router.put('/applications/:id', authorize('ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), updateApplicationStatus);
router.put('/applications/:id/mentor', authorize('ADMIN', 'CE_PRTI', 'HOD'), assignApplicationMentor);
// PRTI: approve a batch of selected applications (unlocks doc request + hire for HOD)
router.post('/applications/prti-approve-batch', authorize('ADMIN', 'CE_PRTI'), async (req, res) => {
    try {
        const { applicationIds } = req.body;
        if (!Array.isArray(applicationIds) || applicationIds.length === 0)
            return res.status(400).json({ success: false, message: 'applicationIds array required' });

        const prisma = require('../lib/prisma');
        await prisma.application.updateMany({
            where: { id: { in: applicationIds }, status: 'SELECTED' },
            data: { prtiApproved: true }
        });

        // Notify the relevant HOD(s) — group by department
        try {
            const apps = await prisma.application.findMany({
                where: { id: { in: applicationIds } },
                include: {
                    student: { select: { fullName: true } },
                    internship: { select: { title: true, department: true } },
                    field: { select: { fieldName: true } },
                    departmentGroup: { select: { department: true } }
                }
            });
            // Group by (department + internshipTitle + fieldName)
            const groups = {};
            for (const a of apps) {
                const dept = a.departmentGroup?.department || a.internship?.department || 'GENERAL';
                const key = `${dept}|${a.internship?.title}|${a.field?.fieldName || ''}`;
                if (!groups[key]) groups[key] = { dept, internshipTitle: a.internship?.title, fieldName: a.field?.fieldName, candidates: [] };
                groups[key].candidates.push({ name: a.student?.fullName, location: a.preferredLocation });
            }

            const { sendPrtiApprovedHodEmail } = require('../services/mailService');
            for (const { dept, internshipTitle, fieldName, candidates } of Object.values(groups)) {
                const hods = await prisma.user.findMany({
                    where: { role: 'HOD', department: dept },
                    select: { email: true, name: true }
                });
                for (const hod of hods) {
                    sendPrtiApprovedHodEmail(hod.email, {
                        hodName: hod.name,
                        hodDepartment: dept,
                        internshipTitle,
                        fieldName,
                        count: candidates.length,
                        candidates,
                    }).catch(() => {});
                }
            }
        } catch (mailErr) {
            console.error('[PRTI-approve HOD email error]', mailErr.message);
        }

        res.json({ success: true, message: `${applicationIds.length} application(s) approved by PRTI` });
    } catch (err) {
        console.error('PRTI approve batch error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.put('/applications/:id/prti-note', authorize('ADMIN', 'CE_PRTI'), async (req, res) => {
    try {
        const { note } = req.body;
        const updated = await require('../lib/prisma').application.update({
            where: { id: req.params.id },
            data: { prtiNote: note ?? null }
        });
        res.json({ success: true, data: { prtiNote: updated.prtiNote } });
    } catch (err) {
        console.error('PRTI note update error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});
router.post('/applications/:id/evaluate', authorize('ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), submitEvaluation);

// Stipend Management
router.get('/applications/:id/stipend', authorize('ADMIN', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), getStipendDetails);
router.put('/applications/:id/stipend', authorize('ADMIN', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), updateStipendDetails);

// User Management
router.get('/users', getUsersByRole);
router.put('/users/:id/role', authorize('ADMIN', 'CE_PRTI'), updateUserRole);
router.delete('/users/:id', authorize('ADMIN', 'CE_PRTI', 'HOD'), deleteUser);

// Infrastructure & Diagnostics
router.get('/audit-logs', authorize('ADMIN', 'CE_PRTI'), getAuditLogs);
router.get('/system/health', authorize('ADMIN', 'CE_PRTI'), getSystemHealth);

// Mentor & Work Assignments
router.get('/meetings/my', getMentorMeetings);
router.post('/work/assign', assignWork);
router.get('/work/assignments', getWorkAssignments);

// Work Logs (mentor/HOD/PRTI read access)
router.get('/applications/:id/work-logs',        authorize('ADMIN', 'CE_PRTI', 'HOD', 'MENTOR'), getApplicationWorkLogs);
router.get('/applications/:id/work-logs/export', authorize('ADMIN', 'CE_PRTI', 'HOD', 'MENTOR'), exportApplicationWorkLogs);
router.get('/internships/:id/work-logs/export',  authorize('ADMIN', 'CE_PRTI', 'HOD', 'MENTOR'), exportInternshipWorkLogs);

// Department group details — required docs + joining letter template (read-only)
router.get('/internships/:id/groups/:groupId/details', authorize('ADMIN', 'CE_PRTI', 'HOD'), async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await require('../lib/prisma').internshipDepartmentGroup.findUnique({
            where: { id: groupId },
            select: {
                id: true, internshipId: true, department: true, title: true,
                requiredDocuments: true,
                joiningLetterTemplateUrl: true,
                joiningLetterTemplateName: true,
                documentTemplates: true,
            }
        });
        if (!group) return res.status(404).json({ success: false, message: 'Department group not found' });
        if (req.user.role === 'HOD' && group.department !== req.user.department) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }
        res.json({ success: true, data: group });
    } catch (err) {
        console.error('Get group details error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// HOD: update required documents for a dept group
router.put('/internships/:id/groups/:groupId/required-docs', authorize('ADMIN', 'CE_PRTI', 'HOD'), async (req, res) => {
    try {
        const { groupId } = req.params;
        const { requiredDocuments } = req.body;
        await require('../lib/prisma').internshipDepartmentGroup.update({
            where: { id: groupId },
            data: { requiredDocuments: Array.isArray(requiredDocuments) ? requiredDocuments : [] }
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Update required docs error:', err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// HOD: upload a template for a specific document type (JOINING_LETTER, BOND, POLICY, UNDERTAKING, etc.)
router.post(
    '/internships/:id/groups/:groupId/document-templates/:docId',
    authorize('ADMIN', 'CE_PRTI', 'HOD'),
    require('../middleware/uploadMiddleware').single('template'),
    async (req, res) => {
        try {
            const { groupId, docId } = req.params;
            const normalizedId = String(docId).toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 32);
            if (!normalizedId) return res.status(400).json({ success: false, message: 'Invalid document ID' });
            if (!req.file) return res.status(400).json({ success: false, message: 'No template file uploaded' });

            const prisma = require('../lib/prisma');
            const group = await prisma.internshipDepartmentGroup.findUnique({ where: { id: groupId } });
            if (!group) return res.status(404).json({ success: false, message: 'Department group not found' });
            if (req.user.role === 'HOD' && group.department !== req.user.department) {
                return res.status(403).json({ success: false, message: 'You can only manage templates for your department' });
            }

            const existing = (typeof group.documentTemplates === 'object' && group.documentTemplates !== null)
                ? group.documentTemplates
                : {};
            const updated = {
                ...existing,
                [normalizedId]: { url: req.file.path.replace(/\\/g, '/'), name: req.file.originalname }
            };

            await prisma.internshipDepartmentGroup.update({
                where: { id: groupId },
                data: { documentTemplates: updated }
            });
            res.json({ success: true, data: { docId: normalizedId, ...updated[normalizedId] } });
        } catch (err) {
            console.error('Upload doc template error:', err.message);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
);

// HOD: remove a specific document template
router.delete(
    '/internships/:id/groups/:groupId/document-templates/:docId',
    authorize('ADMIN', 'CE_PRTI', 'HOD'),
    async (req, res) => {
        try {
            const { groupId, docId } = req.params;
            const normalizedId = String(docId).toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 32);
            const prisma = require('../lib/prisma');
            const group = await prisma.internshipDepartmentGroup.findUnique({ where: { id: groupId } });
            if (!group) return res.status(404).json({ success: false, message: 'Department group not found' });
            if (req.user.role === 'HOD' && group.department !== req.user.department) {
                return res.status(403).json({ success: false, message: 'You can only manage templates for your department' });
            }

            const existing = (typeof group.documentTemplates === 'object' && group.documentTemplates !== null)
                ? { ...group.documentTemplates }
                : {};
            delete existing[normalizedId];

            await prisma.internshipDepartmentGroup.update({
                where: { id: groupId },
                data: { documentTemplates: existing }
            });
            res.json({ success: true });
        } catch (err) {
            console.error('Delete doc template error:', err.message);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
);

// HOD: upload joining letter template for a dept group (students download, fill, upload back)
router.post(
    '/internships/:id/groups/:groupId/joining-letter-template',
    authorize('ADMIN', 'CE_PRTI', 'HOD'),
    require('../middleware/uploadMiddleware').single('template'),
    async (req, res) => {
        try {
            const { groupId } = req.params;
            if (!req.file) return res.status(400).json({ success: false, message: 'No template file uploaded' });

            const group = await require('../lib/prisma').internshipDepartmentGroup.findUnique({ where: { id: groupId } });
            if (!group) return res.status(404).json({ success: false, message: 'Department group not found' });
            if (req.user.role === 'HOD' && group.department !== req.user.department) {
                return res.status(403).json({ success: false, message: 'You can only manage templates for your department' });
            }

            const updated = await require('../lib/prisma').internshipDepartmentGroup.update({
                where: { id: groupId },
                data: {
                    joiningLetterTemplateUrl: req.file.path.replace(/\\/g, '/'),
                    joiningLetterTemplateName: req.file.originalname
                },
                select: { id: true, joiningLetterTemplateUrl: true, joiningLetterTemplateName: true }
            });
            res.json({ success: true, data: updated });
        } catch (err) {
            console.error('Upload joining letter template error:', err.message);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
);

// HOD: remove joining letter template
router.delete(
    '/internships/:id/groups/:groupId/joining-letter-template',
    authorize('ADMIN', 'CE_PRTI', 'HOD'),
    async (req, res) => {
        try {
            const { groupId } = req.params;
            const group = await require('../lib/prisma').internshipDepartmentGroup.findUnique({ where: { id: groupId } });
            if (!group) return res.status(404).json({ success: false, message: 'Department group not found' });
            if (req.user.role === 'HOD' && group.department !== req.user.department) {
                return res.status(403).json({ success: false, message: 'You can only manage templates for your department' });
            }

            await require('../lib/prisma').internshipDepartmentGroup.update({
                where: { id: groupId },
                data: { joiningLetterTemplateUrl: null, joiningLetterTemplateName: null }
            });
            res.json({ success: true });
        } catch (err) {
            console.error('Delete joining letter template error:', err.message);
            res.status(500).json({ success: false, message: 'Server Error' });
        }
    }
);

// Attendance Management
const upload = require('../middleware/uploadMiddleware');
router.post('/attendance/mark', upload.single('file'), markAttendance);
router.get('/attendance', getAttendance);
router.post('/attendance/bulk', bulkMarkAttendance);

// Completed Internships (PRTI/HOD/ADMIN view; HOD scoped to own dept)
const {
    listCompletedInternships,
    getCompletedInternshipDetail
} = require('../controllers/completedInternshipsController');
router.get('/completed-internships',     authorize('ADMIN', 'CE_PRTI', 'HOD'), listCompletedInternships);
router.get('/completed-internships/:id', authorize('ADMIN', 'CE_PRTI', 'HOD'), getCompletedInternshipDetail);

module.exports = router;
