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
router.put('/internships/:id/publish', authorize('ADMIN', 'CE_PRTI', 'HOD'), async (req, res) => {
    try {
        await require('../lib/prisma').internship.update({
            where: { id: req.params.id },
            data: { publishStatus: 'LIVE' }
        });
        res.json({ success: true, message: 'Internship published' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
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
        res.status(500).json({ success: false, message: err.message });
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
        res.status(500).json({ success: false, message: err.message });
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
        res.status(500).json({ success: false, message: err.message });
    }
});

// Attendance Management
const upload = require('../middleware/uploadMiddleware');
router.post('/attendance/mark', upload.single('file'), markAttendance);
router.get('/attendance', getAttendance);
router.post('/attendance/bulk', bulkMarkAttendance);

module.exports = router;
