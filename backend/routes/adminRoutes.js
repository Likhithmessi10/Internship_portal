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
    assignApplicationMentor
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
    getDepartments, createDepartment, updateDepartment,
    getFields, createField, updateField,
    requestDocuments, verifyDocuments, getLearningPendingDocs
} = require('../controllers/deptFieldController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Publicly accessible configurations (needed for registration)
router.get('/config', getPortalConfig);

router.use(protect);
router.use(authorize('ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'));

// Portal Configuration Updates (Admin Only)
router.put('/config', authorize('ADMIN'), updatePortalConfig);

// Internship Management
router.get('/batches', getBatches);
router.get('/batches/:id/details', authorize('ADMIN', 'CE_PRTI'), getBatchDetails);
router.post('/batches', authorize('ADMIN', 'CE_PRTI'), createBatch);
router.delete('/batches/:id', authorize('ADMIN', 'CE_PRTI'), deleteBatch);

router.get('/internships', getAllInternships);
router.get('/interns/all', authorize('ADMIN', 'CE_PRTI', 'HOD', 'MENTOR'), getAllInterns);
router.get('/interns/search/:rollNumber', authorize('ADMIN', 'CE_PRTI', 'HOD'), searchInternByRollNumber);
router.get('/meetings', authorize('ADMIN', 'CE_PRTI', 'HOD'), getMeetings);
router.post('/internships', createInternship);
router.delete('/internships/:id', authorize('ADMIN', 'CE_PRTI'), deleteInternship);
router.put('/internships/:id/toggle', toggleInternship);
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
router.get('/dept-master',                    authorize('ADMIN', 'CE_PRTI', 'HOD'), getDepartments);
router.post('/dept-master',                   authorize('ADMIN', 'CE_PRTI'), createDepartment);
router.put('/dept-master/:id',                authorize('ADMIN', 'CE_PRTI'), updateDepartment);
router.get('/dept-master/:deptId/fields',     authorize('ADMIN', 'CE_PRTI', 'HOD'), getFields);
router.post('/dept-master/:deptId/fields',    authorize('ADMIN', 'CE_PRTI'), createField);
router.put('/dept-master/:deptId/fields/:fieldId', authorize('ADMIN', 'CE_PRTI'), updateField);

// ── PRTI Document Verification Flow (Learning Internships) ───────────────────
router.get('/learning/pending-docs',                  authorize('ADMIN', 'CE_PRTI'), getLearningPendingDocs);
router.post('/applications/:id/request-documents',    authorize('ADMIN', 'CE_PRTI'), requestDocuments);
router.post('/applications/:id/verify-documents',     authorize('ADMIN', 'CE_PRTI'), verifyDocuments);
// GROUP NON_STIPEND: field management per dept group
router.post('/internships/:id/groups/:groupId/fields', authorize('ADMIN', 'CE_PRTI', 'HOD'), addGroupField);
router.delete('/internships/:id/groups/:groupId/fields/:fieldId', authorize('ADMIN', 'CE_PRTI', 'HOD'), deleteGroupField);

// PRTI: department-wise submission progress for a GROUP internship
router.get('/internships/:id/group-progress', authorize('ADMIN', 'CE_PRTI'), getGroupInternshipProgress);

// Department Group CRUD (for GROUP internships)
router.post('/internships/:id/groups', authorize('ADMIN', 'CE_PRTI'), addDepartmentGroup);
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
router.post('/applications/:id/evaluate', authorize('ADMIN', 'CE_PRTI', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), submitEvaluation);

// Stipend Management
router.get('/applications/:id/stipend', authorize('ADMIN', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), getStipendDetails);
router.put('/applications/:id/stipend', authorize('ADMIN', 'HOD', 'COMMITTEE_MEMBER', 'MENTOR'), updateStipendDetails);

// User Management
router.get('/users', getUsersByRole);
router.put('/users/:id/role', authorize('ADMIN', 'CE_PRTI'), updateUserRole);

// Infrastructure & Diagnostics
router.get('/audit-logs', authorize('ADMIN', 'CE_PRTI'), getAuditLogs);
router.get('/system/health', authorize('ADMIN', 'CE_PRTI'), getSystemHealth);

// Mentor & Work Assignments
router.get('/meetings/my', getMentorMeetings);
router.post('/work/assign', assignWork);
router.get('/work/assignments', getWorkAssignments);

// Attendance Management
router.post('/attendance/mark', markAttendance);
router.get('/attendance', getAttendance);
router.post('/attendance/bulk', bulkMarkAttendance);

module.exports = router;
