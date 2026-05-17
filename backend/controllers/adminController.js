const prisma = require('../lib/prisma');
const emailService = require('../services/email/emailService');
const xl = require('exceljs');
const { createAuditLog } = require('../utils/auditLogger');
const { notifyMentorAssignment, notifyWorkAssignment } = require('../services/mailService');
const { transitionApplicationStatus } = require('../services/applicationWorkflowService');


/**
 * @desc    Create Internship
 * @route   POST /api/v1/admin/internships
 * @access  Private (Admin)
 */
const normalizeRequirements = (rawRequirements) => {
    if (Array.isArray(rawRequirements)) {
        const unique = [...new Set(rawRequirements.map(item => String(item || '').trim()).filter(Boolean))];
        return unique.join(', ');
    }
    if (typeof rawRequirements === 'string') {
        const unique = [...new Set(rawRequirements.split(',').map(item => item.trim()).filter(Boolean))];
        return unique.join(', ');
    }
    return null;
};

const createInternship = async (req, res) => {
    try {
        const {
            batchId, title, department, description, roles, rolesData, requirements,
            expectations, location, duration, openingsCount, applicationDeadline,
            requiredDocuments, stipendType, stipendAmounts, customQuestions,
            evaluationQuestions, preferredColleges
        } = req.body;

        // batchId is optional — internship can be standalone (no master program)
        if (batchId) {
            const batch = await prisma.internshipBatch.findUnique({ where: { id: batchId } });
            if (!batch) {
                return res.status(404).json({ success: false, message: 'Invalid Master Program selected' });
            }
        }

        const isGroupMode = req.body.internshipMode === 'GROUP';

        let targetDepartment = department;
        if (req.user.role === 'HOD' || req.user.role === 'MENTOR') {
            if (!req.user.department) {
                return res.status(403).json({ success: false, message: 'You are not assigned to any department. Please contact the administrator.' });
            }
            targetDepartment = req.user.department;
        }

        // GROUP internships span multiple departments — no single department required
        if (!targetDepartment && !isGroupMode) {
            return res.status(400).json({ success: false, message: 'Department is required' });
        }
        if (!targetDepartment) targetDepartment = 'ALL';

        const internship = await prisma.internship.create({
            data: {
                batchId,
                title,
                department: targetDepartment,
                description,
                roles: roles || null,
                rolesData: rolesData || null,
                requirements: normalizeRequirements(requirements),
                expectations: expectations || null,
                location: location || null,
                duration,
                openingsCount: parseInt(openingsCount),
                applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
                requiredDocuments: requiredDocuments || null,
                stipendType: stipendType || 'NON_COLLABORATIVE',
                // stipendAmounts: { IIT: 25000, NIT: 20000, STATE: 12000, PRIVATE: 8000, ... }
                stipendAmounts: stipendAmounts || null,
                customQuestions: customQuestions || [],
                preferredColleges: preferredColleges || [],
                quotaPercentages: req.body.quotaPercentages || null,
                internshipType: req.body.internshipType || 'STIPEND',
                internshipMode: req.body.internshipMode || 'SINGLE',
                // GROUP internships start as DRAFT — visible only after HODs submit and PRTI publishes
                publishStatus: (req.body.internshipMode === 'GROUP') ? 'DRAFT' : 'LIVE',
                fields: {
                    create: (req.body.fields || []).map(f => ({
                        fieldName: f.fieldName,
                        description: f.description,
                        vacancies: parseInt(f.vacancies) || 0,
                        locations: f.locations || []
                    }))
                }
            }
        });

        const questionsToUse = (evaluationQuestions && Array.isArray(evaluationQuestions) && evaluationQuestions.length > 0)
            ? evaluationQuestions
            : ["Technical Skills & Domain Knowledge", "Communication & Problem Solving"];
        
        await prisma.internshipEvaluationCriteria.createMany({
            data: questionsToUse.map(q => ({ internshipId: internship.id, question: q, maxScore: 50 }))
        });

        res.status(201).json({ success: true, data: internship });
        await createAuditLog('CREATE_INTERNSHIP', req.user.email, `Created ${title}${batchId ? ` in batch ${batchId}` : ' (standalone)'}`, internship.id);

        // Notify all PRTI users that a new internship was created
        const mailService = require('../services/mailService');
        const prtiUsers = await prisma.user.findMany({ where: { role: 'CE_PRTI' }, select: { email: true } });
        for (const u of prtiUsers) {
            mailService.notifyPrtiInternshipCreated(u.email, {
                internshipTitle: title,
                department: targetDepartment,
                createdBy: req.user.email,
                internshipType: req.body.internshipType || 'COLLABORATIVE',
            }).catch(() => {}); // fire-and-forget
        }
    } catch (error) {
        console.error('Create internship error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Internship Batches (Master Folders)
 * @route   GET /api/v1/admin/batches
 * @access  Private (Admin)
 */
const getBatches = async (req, res) => {
    try {
        const batches = await prisma.internshipBatch.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { internships: true } }
            }
        });
        res.status(200).json({ success: true, data: batches });
    } catch (error) {
        console.error('Get batches error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Create Internship Batch (Master Folder)
 * @route   POST /api/v1/admin/batches
 * @access  Private (PRTI, Admin)
 */
const createBatch = async (req, res) => {
    try {
        const { title, description } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

        const batch = await prisma.internshipBatch.create({
            data: {
                title,
                description,
                createdBy: req.user.email
            }
        });

        res.status(201).json({ success: true, data: batch });
        await createAuditLog('CREATE_BATCH', req.user.email, `Created Program: ${title}`, batch.id);
    } catch (error) {
        console.error('Create batch error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Delete Internship Batch
 * @route   DELETE /api/v1/admin/batches/:id
 * @access  Private (PRTI, Admin)
 */
const deleteBatch = async (req, res) => {
    try {
        const { id } = req.params;
        const batch = await prisma.internshipBatch.findUnique({ 
            where: { id },
            include: { _count: { select: { internships: true } } }
        });

        if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });
        if (batch._count.internships > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete program with existing internships' });
        }

        await prisma.internshipBatch.delete({ where: { id } });
        res.status(200).json({ success: true, message: 'Program deleted successfully' });
    } catch (error) {
        console.error('Delete batch error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Internships (Admin) with application counts
 * @route   GET /api/v1/admin/internships
 * @access  Private (Admin)
 */
const getAllInternships = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const whereClause = {};
        if (req.query.batchId) {
            whereClause.batchId = req.query.batchId;
        }

        // For HOD/MENTOR: show internships from their dept.
        // GROUP internships store department='ALL' — match via departmentGroups relation.
        if (req.user.role !== 'ADMIN' && req.user.role !== 'CE_PRTI' && req.user.department) {
            whereClause.OR = [
                { department: req.user.department },
                { internshipMode: 'GROUP', departmentGroups: { some: { department: req.user.department } } }
            ];
        }

        const [internships, total] = await Promise.all([
            prisma.internship.findMany({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    _count: { select: { applications: true } },
                    applications: { select: { status: true } },
                    batch: { select: { id: true, title: true } },
                    departmentGroups: {
                        include: {
                            _count: { select: { applications: true } },
                            fields: true
                        },
                        orderBy: { department: 'asc' }
                    },
                    fields: true
                }
            }),
            prisma.internship.count({ where: whereClause })
        ]);

        const result = internships.map(i => ({
            ...i,
            applicationsCount: i._count.applications,
            hiredCount: i.applications.filter(a => ['SELECTED', 'APPROVED', 'REPORTED', 'HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length,
            remainingOpenings: Math.max(0, i.openingsCount - i.applications.filter(a => ['SELECTED', 'APPROVED', 'REPORTED', 'HIRED', 'ONGOING', 'COMPLETED'].includes(a.status)).length),
            applications: undefined,
            _count: undefined,
            departmentGroups: i.departmentGroups.map(g => ({
                ...g,
                applicationsCount: g._count.applications,
                _count: undefined
            }))
        }));

        res.status(200).json({ 
            success: true, 
            data: result,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get internships error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Delete Internship
 * @route   DELETE /api/v1/admin/internships/:id
 * @access  Private (Admin, CE_PRTI)
 */
const deleteInternship = async (req, res) => {
    try {
        const { id } = req.params;
        const { password } = req.body;

        // Password verification is required for all roles
        if (!password) {
            return res.status(400).json({ success: false, message: 'Password is required to delete an internship.' });
        }

        const bcrypt = require('bcrypt');
        const requestingUser = await prisma.user.findUnique({ where: { id: req.user.id } });
        const passwordMatch  = await bcrypt.compare(password, requestingUser.password);
        if (!passwordMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password. Deletion not authorised.' });
        }

        const internship = await prisma.internship.findUnique({
            where: { id },
            include: { departmentGroups: { select: { department: true } } }
        });

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        // HOD may only delete internships that belong to their department
        if (req.user.role === 'HOD') {
            const dept = req.user.department;
            const inDept = internship.department === dept ||
                internship.departmentGroups.some(g => g.department === dept);
            if (!inDept) {
                return res.status(403).json({ success: false, message: 'You can only delete internships in your department.' });
            }
        }

        await prisma.internship.delete({ where: { id } });
        await createAuditLog('DELETE_INTERNSHIP', req.user.email, `Deleted internship: ${internship.title}`, id);

        res.status(200).json({ success: true, message: 'Internship deleted successfully' });
    } catch (error) {
        console.error('Delete internship error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Toggle Internship Active Status
 * @route   PUT /api/v1/admin/internships/:id/toggle
 * @access  Private (Admin)
 */
const toggleInternship = async (req, res) => {
    try {
        const internship = await prisma.internship.findUnique({ where: { id: req.params.id } });
        if (!internship) return res.status(404).json({ success: false, message: 'Not found' });

        const updated = await prisma.internship.update({
            where: { id: req.params.id },
            data: { isActive: !internship.isActive }
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Applications for Internship
 * @route   GET /api/v1/admin/internships/:id/applications
 * @access  Private (Admin)
 */
// Helper for string similarity
const getLevenshteinDistance = (a, b) => {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    for (var i = 0; i <= b.length; i++) matrix[i] = [i];
    for (var j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (var i = 1; i <= b.length; i++) {
        for (var j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
};

const STOP_TOKENS = new Set(['college', 'university', 'institute', 'inst', 'technology', 'technologies', 'school', 'of', 'the', 'and']);
const ABBR_MAP = {
    nit: 'national institute technology',
    iit: 'indian institute technology',
    iiit: 'indian institute information technology',
    nitt: 'national institute technology trichy',
    vnit: 'visvesvaraya national institute technology',
    mnnit: 'motilal nehru national institute technology',
    nitw: 'national institute technology warangal',
    nitk: 'national institute technology karnataka',
    nitc: 'national institute technology calicut',
    nits: 'national institute technology silchar',
    nita: 'national institute technology agartala',
    nitd: 'national institute technology delhi',
    nitr: 'national institute technology rourkela',
    nitj: 'national institute technology jalandhar',
    nitp: 'national institute technology patna',
    iitm: 'indian institute technology madras',
    iitd: 'indian institute technology delhi',
    iitb: 'indian institute technology bombay',
    iitk: 'indian institute technology kanpur',
    iitkgp: 'indian institute technology kharagpur',
    iitr: 'indian institute technology roorkee',
    iith: 'indian institute technology hyderabad',
    iitg: 'indian institute technology guwahati'
};

const expandAbbreviations = (s) => {
    let text = (s || '').toLowerCase();
    Object.entries(ABBR_MAP).forEach(([abbr, full]) => {
        const re = new RegExp(`\\b${abbr}\\b`, 'g');
        text = text.replace(re, full);
    });
    return text;
};

const normalizeCollege = (s) => expandAbbreviations(s).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
const tokenizeCollege = (s) => normalizeCollege(s).split(' ').filter(tok => tok && !STOP_TOKENS.has(tok));

const tokenSimilarity = (a, b) => {
    const aSet = new Set(tokenizeCollege(a));
    const bSet = new Set(tokenizeCollege(b));
    if (aSet.size === 0 || bSet.size === 0) return 0;
    let inter = 0;
    aSet.forEach(t => { if (bSet.has(t)) inter += 1; });
    const union = new Set([...aSet, ...bSet]).size;
    return union > 0 ? inter / union : 0;
};

const isPreferredCollege = (collegeName, preferredColleges) => {
    if (!preferredColleges || preferredColleges.length === 0) return false;
    if (!collegeName) return false;
    const target = normalizeCollege(collegeName).replace(/\s/g, '');
    for (const pref of preferredColleges) {
        const p = normalizeCollege(pref).replace(/\s/g, '');
        if (!p) continue;
        if (target.includes(p) || p.includes(target)) return true;
        if (tokenSimilarity(collegeName, pref) >= 0.5) return true;
        const maxLen = Math.max(target.length, p.length);
        if (maxLen > 0 && Math.abs(target.length - p.length) <= Math.max(6, Math.floor(maxLen * 0.35))) {
            const dist = getLevenshteinDistance(target, p);
            const ratio = dist / maxLen;
            if (ratio <= 0.22) return true;
        }
    }
    return false;
};

const getApplications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const departmentGroupId = req.query.departmentGroupId;
        const fieldId = req.query.fieldId;
        
        const internship = await prisma.internship.findUnique({
            where: { id: req.params.id },
            include: { 
                departmentGroups: {
                    include: { fields: true }
                }, 
                fields: true 
            }
        });
        
        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        const whereClause = { internshipId: req.params.id };

        // GROUP mode: filter by department group
        if (internship.internshipMode === 'GROUP' && departmentGroupId) {
            whereClause.departmentGroupId = departmentGroupId;
        }

        if (fieldId) {
            whereClause.fieldId = fieldId;
        }

        if (req.user.role === 'MENTOR') {
            whereClause.mentorId = req.user.id;
        }

        // HOD authorization: for SINGLE, check internship dept; for GROUP, check group dept
        if (req.user.role === 'HOD') {
            if (internship.internshipMode === 'SINGLE' && internship.department !== req.user.department) {
                return res.status(403).json({ success: false, message: 'Not authorized for this department' });
            }
            if (internship.internshipMode === 'GROUP') {
                // HOD can only see applications from groups matching their department
                const hodGroups = internship.departmentGroups.filter(g => g.department === req.user.department);
                if (hodGroups.length === 0) {
                    return res.status(403).json({ success: false, message: 'Not authorized for this department' });
                }
                if (!departmentGroupId) {
                    // Default to HOD's department group
                    whereClause.departmentGroupId = { in: hodGroups.map(g => g.id) };
                }
            }
        }

        const allApplications = await prisma.application.findMany({
            where: whereClause,
            take: limit,
            skip,
            include: {
                student: {
                    include: { user: { select: { email: true, name: true } } }
                },
                documents: true,
                mentor: { select: { name: true, email: true } },
                attendance: true,
                stipend: true,
                departmentGroup: { select: { id: true, department: true, title: true } },
                field: true,
                internship: { select: { id: true, title: true, internshipType: true, shortlistingRatio: true, department: true } }
            }
        });

        // Determine preferred colleges based on mode
        let preferredColleges = internship.preferredColleges || [];
        if (internship.internshipMode === 'GROUP' && departmentGroupId) {
            const activeGroup = internship.departmentGroups.find(g => g.id === departmentGroupId);
            if (activeGroup) {
                preferredColleges = activeGroup.preferredColleges || [];
            }
        }

        // Apply Priority Sorting
        allApplications.sort((a, b) => {
             // Tier 1: Preferred
             const aPref = isPreferredCollege(a.student?.collegeName, preferredColleges);
             const bPref = isPreferredCollege(b.student?.collegeName, preferredColleges);
             if (aPref && !bPref) return -1;
             if (!aPref && bPref) return 1;

             // Tier 2: IIT / NIT
             const aPremier = a.student?.collegeCategory === 'IIT' || a.student?.collegeCategory === 'NIT';
             const bPremier = b.student?.collegeCategory === 'IIT' || b.student?.collegeCategory === 'NIT';
             if (aPremier && !bPremier) return -1;
             if (!aPremier && bPremier) return 1;

             // Tier 3: Top 100 NIRF
             const aNirf = (a.student?.nirfRanking && a.student.nirfRanking <= 100) ? 1 : 0;
             const bNirf = (b.student?.nirfRanking && b.student.nirfRanking <= 100) ? 1 : 0;
             if (aNirf > bNirf) return -1;
             if (aNirf < bNirf) return 1;

             // Tier 4: CGPA Sorting
             const aCgpa = a.student?.cgpa || 0;
             const bCgpa = b.student?.cgpa || 0;
             if (bCgpa !== aCgpa) return bCgpa - aCgpa;

             return 0; // Default
        });

        const total = allApplications.length;
        const paginatedApplications = allApplications.slice(skip, skip + limit);

        res.status(200).json({ 
            success: true, 
            data: paginatedApplications,
            // Include department groups for GROUP mode so frontend can build filter tabs
            departmentGroups: internship.internshipMode === 'GROUP' ? internship.departmentGroups : undefined,
            fields: internship.fields,
            internshipMode: internship.internshipMode,
            internshipType: internship.internshipType,
            pagination: { total, page, limit, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get applications error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Rejected Applications (across all internships)
 * @route   GET /api/v1/admin/applications/rejected
 * @access  Private (Admin)
 */
const getRejectedApplications = async (req, res) => {
    try {
        const applications = await prisma.application.findMany({
            where: { status: 'REJECTED' },
            include: {
                student: true,
                internship: { select: { title: true, department: true } }
            },
            orderBy: { updatedAt: 'desc' }
        });
        res.status(200).json({ success: true, data: applications });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Manually Update Application Status
 * @route   PUT /api/v1/admin/applications/:id
 * @access  Private (Admin, HOD, MENTOR, COMMITTEE)
 */
const updateApplicationStatus = async (req, res) => {
    try {
        const { status, assignedRole, joiningDate, endDate, mentorId, isHeldSeat, fieldId: overrideFieldId, preferredLocation: overrideLocation } = req.body;
        const applicationId = req.params.id;

        // 1. Strict Enum Enforcement
        const allowed = [
            'SUBMITTED', 'SHORTLISTED', 'UNDER_COMMITTEE_REVIEW',
            'SELECTED', 'APPROVED', 'REPORTED',
            'REJECTED', 'WAITLISTED', 'DOCUMENTS_PENDING', 'DOCUMENTS_VERIFIED',
            'HIRED', 'ONGOING', 'COMPLETED'
        ];
        if (!allowed.includes(status)) {
            return res.status(400).json({ success: false, message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
        }

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                student: { include: { user: true } },
                internship: true,
                departmentGroup: true
            }
        });

        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

        const internship = application.internship;
        const student = application.student;

        // 2. Mentor Verification (if provided)
        // For GROUP internships, internship.department = 'ALL', so use the dept group's department
        let mentorUser = null;
        if (mentorId) {
            const mentorDept = internship.internshipMode === 'GROUP'
                ? (application.departmentGroup?.department || req.user.department)
                : internship.department;

            mentorUser = await prisma.user.findFirst({
                where: { id: mentorId, role: 'MENTOR', department: mentorDept }
            });

            if (!mentorUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Mentor. Mentor must be from the same department as the internship.'
                });
            }
        }

        // 3. Atomic Transaction for Updates
        const result = await prisma.$transaction(async (tx) => {
            // Apply field/location reassignment BEFORE the seat check so the transition
            // enforces limits against the HOD-assigned location, not the student's applied location.
            if (overrideFieldId || overrideLocation !== undefined) {
                await tx.application.update({
                    where: { id: applicationId },
                    data: {
                        ...(overrideFieldId      ? { fieldId:           overrideFieldId  } : {}),
                        ...(overrideLocation !== undefined ? { preferredLocation: overrideLocation } : {})
                    }
                });
            }

            // Requirement 4: All status updates must go through workflow service
            const updatedApp = await transitionApplicationStatus(
                applicationId,
                status,
                req.user,
                `Manual update via Admin Controller. Assigned Role: ${assignedRole || 'None'}`,
                tx
            );

            // Student roll number is now automatically handled by the transitionApplicationStatus
            // within the applicationWorkflowService using the generatePortalRollNumber utility.

            // Update metadata (Role, Dates, Mentor)
            const metadataUpdates = {};
            if (assignedRole) metadataUpdates.assignedRole = assignedRole;
            if (joiningDate) metadataUpdates.joiningDate = new Date(joiningDate);
            if (endDate) metadataUpdates.endDate = new Date(endDate);
            if (mentorId) metadataUpdates.mentorId = mentorId;
            if (isHeldSeat !== undefined) metadataUpdates.isHeldSeat = !!isHeldSeat;
            // fieldId / preferredLocation already written above before the seat check
            // When PRTI directly selects a candidate, auto-approve so HOD can request docs immediately
            if (status === 'SELECTED' && req.user.role === 'CE_PRTI') {
                metadataUpdates.prtiApproved = true;
            }

            if (Object.keys(metadataUpdates).length > 0) {
                await tx.application.update({
                    where: { id: applicationId },
                    data: metadataUpdates
                });
            }

            // Committee Auto-Sync logic removed to prevent assigning mentor to the entire internship.

            return updatedApp;
        });


        // 4. Notifications & Logs
        res.status(200).json({ success: true, data: result });

        if (mentorUser) {
            notifyMentorAssignment(mentorUser, student, internship).catch(e => console.error('Mentor notify fail', e));
        }

        const studentEmail = student.user?.email;
        if (studentEmail && !studentEmail.endsWith('@aptransco.portal')) {
            const {
                sendShortlistingEmail, sendSelectionEmail,
                sendHiringEmail, sendRejectionEmail
            } = require('../services/mailService');

            const fieldName = result.field?.fieldName || result.assignedRole;
            const location  = result.preferredLocation;

            if (status === 'SHORTLISTED') {
                sendShortlistingEmail(studentEmail, {
                    studentName:     student.fullName,
                    internshipTitle: internship.title,
                    fieldName,
                    department:      application.departmentGroup?.department || internship.department,
                }).catch(() => {});
            } else if (status === 'SELECTED') {
                sendSelectionEmail(studentEmail, {
                    studentName:     student.fullName,
                    internshipTitle: internship.title,
                    fieldName,
                    location,
                }).catch(() => {});
            } else if (status === 'HIRED') {
                const mentorRecord = mentorId
                    ? await prisma.user.findUnique({ where: { id: mentorId }, select: { name: true } })
                    : null;
                sendHiringEmail(studentEmail, {
                    studentName:     student.fullName,
                    internshipTitle: internship.title,
                    fieldName,
                    location,
                    joiningDate:     result.joiningDate,
                    endDate:         result.endDate,
                    rollNumber:      student.rollNumber,
                    mentorName:      mentorRecord?.name,
                }).catch(() => {});
            } else if (status === 'REJECTED') {
                // Check if the field has other locations the student hasn't tried
                let hasAlternateLocations = false;
                if (result.fieldId) {
                    const field = await prisma.internshipField.findUnique({ where: { id: result.fieldId } });
                    const fieldLocs = Array.isArray(field?.locations) ? field.locations : [];
                    hasAlternateLocations = fieldLocs.length > 1;
                }
                sendRejectionEmail(studentEmail, {
                    studentName:     student.fullName,
                    internshipTitle: internship.title,
                    fieldName,
                    hasAlternateLocations,
                }).catch(() => {});
            }
        }

        await createAuditLog('UPDATE_APPLICATION', req.user.email, `Status -> ${status}`, applicationId);

    } catch (error) {
        console.error('[UpdateStatus Error]', error.message);
        res.status(error.message.includes('Full') ? 400 : 500).json({ 
            success: false, 
            message: error.message || 'Server Error' 
        });
    }
};

/**
 * @desc    Export applications to Excel
 * @route   GET /api/v1/admin/internships/:id/export
 * @access  Private (Admin, CE_PRTI, HOD, MENTOR)
 */
const exportApplications = async (req, res) => {
    try {
        const internshipId = req.params.id;

        const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
        const applications = await prisma.application.findMany({
            where: { internshipId },
            include: { student: { include: { user: true } }, documents: true },
            orderBy: { createdAt: 'desc' }
        });

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        const workbook = new xl.Workbook();
        const worksheet = workbook.addWorksheet('Applications');

        worksheet.columns = [
            { header: '#', key: 'no', width: 5 },
            { header: 'Tracking ID', key: 'trackingId', width: 22 },
            { header: 'Full Name', key: 'name', width: 30 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Phone', key: 'phone', width: 15 },
            { header: 'College', key: 'college', width: 40 },
            { header: 'Branch', key: 'branch', width: 20 },
            { header: 'Year', key: 'year', width: 8 },
            { header: 'CGPA', key: 'cgpa', width: 8 },
            { header: 'Status', key: 'status', width: 20 },
            { header: 'Applied On', key: 'applied', width: 20 },
            { header: 'SOP', key: 'sop', width: 50 },
            { header: 'Preferred Location', key: 'location', width: 25 },
            { header: 'Assigned Role', key: 'role', width: 25 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true, size: 12 };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF003087' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        applications.forEach((app, idx) => {
            const s = app.student;
            worksheet.addRow({
                no: idx + 1,
                trackingId: app.trackingId,
                name: s?.fullName || '',
                email: s?.user?.email || '',
                phone: s?.phone || '',
                college: s?.collegeName || '',
                branch: s?.branch || '',
                year: s?.yearOfStudy || '',
                cgpa: s?.cgpa || '',
                status: app.status,
                applied: new Date(app.createdAt).toLocaleString('en-IN'),
                sop: app.sop ? app.sop.substring(0, 100) : '',
                location: app.preferredLocation || '',
                role: app.assignedRole || ''
            });
        });

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `${internship.title.replace(/[^a-z0-9]/gi, '_')}_Applications_${timestamp}.xlsx`;

        const buffer = await workbook.xlsx.writeBuffer();

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            message: 'Export failed',
            error: error.message
        });
    }
};

/**
 * @desc    Extend / Update Application Deadline
 * @route   PUT /api/v1/admin/internships/:id/deadline
 * @access  Private (Admin)
 */
const extendDeadline = async (req, res) => {
    try {
        const { deadline } = req.body;
        const updated = await prisma.internship.update({
            where: { id: req.params.id },
            data: { applicationDeadline: deadline ? new Date(deadline) : null }
        });
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Portal Configuration
 * @route   GET /api/v1/admin/config
 */
const getPortalConfig = async (req, res) => {
    try {
        let config = await prisma.portalConfiguration.findUnique({ where: { id: 'singleton' } });

        // If no config exists, create default config with departments
        if (!config) {
            const defaultDepartments = [
                'PRTI',
                'TRANSMISSION',
                'PLANNING AND POWER SYSTEMS',
                'SLDC',
                'PROJECTS',
                'APPCC AND LEGAL',
                'COMMERCIAL AND COORDINATION LMC',
                'HRD',
                'ZONE VIJAYAWADA',
                'ZONE VISHAKAPATNAM',
                'APPCC',
                'ZONE KADAPA',
                'CIVIL',
                'TELECOM AND IT',
                'ADDITIONAL SECRETARY',
                'CGM AND FINANCE'
            ];
            config = await prisma.portalConfiguration.create({
                data: {
                    id: 'singleton',
                    authorizedTotal: 100,
                    departments: defaultDepartments
                }
            });
        }

        // Ensure 'PRTI' is always present in the department list
        if (config && Array.isArray(config.departments) && !config.departments.includes('PRTI')) {
            config = await prisma.portalConfiguration.update({
                where: { id: 'singleton' },
                data: { departments: ['PRTI', ...config.departments] }
            });
        }

        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update Portal Configuration
 * @route   PUT /api/v1/admin/config
 */
const updatePortalConfig = async (req, res) => {
    try {
        const { authorizedTotal, departments } = req.body;
        const config = await prisma.portalConfiguration.upsert({
            where: { id: 'singleton' },
            update: { authorizedTotal: parseInt(authorizedTotal) || 0, departments },
            create: { id: 'singleton', authorizedTotal: parseInt(authorizedTotal) || 0, departments }
        });
        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Committee details for an Internship
 */
const getCommitteeDetails = async (req, res) => {
    try {
        const departmentGroupId = req.query.departmentGroupId;
        let committee;

        if (departmentGroupId) {
            // GROUP mode: lookup by department group
            committee = await prisma.committee.findUnique({
                where: { departmentGroupId },
                include: {
                    departmentGroup: {
                        include: {
                            applications: {
                                where: { status: 'SHORTLISTED' },
                                include: { student: { include: { user: true } } }
                            }
                        }
                    }
                }
            });
        } else {
            // SINGLE mode: lookup by internship
            committee = await prisma.committee.findUnique({ 
                where: { internshipId: req.params.id },
                include: {
                    internship: {
                        include: {
                            applications: {
                                where: { status: 'SHORTLISTED' },
                                include: { student: { include: { user: true } } }
                            }
                        }
                    }
                }
            });
        }
        res.status(200).json({ success: true, data: committee });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update Committee details (supports both SINGLE and GROUP via ?departmentGroupId)
 */
const updateCommitteeDetails = async (req, res) => {
    try {
        const { meetLink, interviewDate, mentorId, prtiMemberId, hodId, membersData } = req.body;
        const internshipId = req.params.id;
        const departmentGroupId = req.query.departmentGroupId;

        const internship = await prisma.internship.findUnique({ where: { id: internshipId } });
        if (!internship) {
             return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        // Determine target department for mentor validation
        let targetDepartment = internship.department;
        if (departmentGroupId) {
            const group = await prisma.internshipDepartmentGroup.findUnique({ where: { id: departmentGroupId } });
            if (!group || group.internshipId !== internshipId) {
                return res.status(400).json({ success: false, message: 'Invalid department group' });
            }
            targetDepartment = group.department;
        }

        // 1. Prepare Update Object
        const updateObj = {};
        if (meetLink !== undefined) updateObj.meetLink = meetLink;
        if (interviewDate !== undefined) updateObj.interviewDate = interviewDate ? new Date(interviewDate) : null;
        if (mentorId !== undefined) updateObj.mentorId = mentorId;
        if (prtiMemberId !== undefined) updateObj.prtiMemberId = prtiMemberId;
        if (hodId !== undefined) updateObj.hodId = hodId;
        
        if (membersData) {
            updateObj.membersData = membersData;
        }

        // 2. Security/Validation (use targetDepartment)
        const targetMentorId = mentorId || membersData?.mentorId;
        if (targetMentorId) {
            const mentor = await prisma.user.findUnique({ where: { id: targetMentorId } });
            if (mentor && mentor.department !== targetDepartment && req.user.role !== 'ADMIN') {
                return res.status(400).json({
                    success: false,
                    message: `Mentor department mismatch. Selected mentor is from ${mentor.department}, but the target is ${targetDepartment}.`
                });
            }
        }

        // 3. Perform Update/Upsert
        let committee;
        if (departmentGroupId) {
            committee = await prisma.committee.upsert({
                where: { departmentGroupId },
                update: updateObj,
                create: {
                    ...updateObj,
                    departmentGroupId,
                    membersData: membersData || {
                        structure: {
                            member1: 'HOD (Permanent)',
                            member2: 'Mentor (Assigned by HOD)',
                            member3: 'PRTI Representative (Editable)'
                        }
                    }
                }
            });
        } else {
            committee = await prisma.committee.upsert({
                where: { internshipId },
                update: updateObj,
                create: {
                    ...updateObj,
                    internshipId,
                    membersData: membersData || {
                        structure: {
                            member1: 'HOD (Permanent)',
                            member2: 'Mentor (Assigned by HOD)',
                            member3: 'PRTI Representative (Editable)'
                        }
                    }
                }
            });
        }

        // 3b. For NON_STIPEND internships: propagate mentor to all HIRED/VERIFIED applications
        const effectiveMentorId = mentorId || membersData?.mentorId;
        if (effectiveMentorId && internship.internshipType === 'NON_STIPEND') {
            const propagateWhere = {
                internshipId,
                status: { in: ['HIRED', 'DOCUMENTS_VERIFIED', 'ONGOING', 'COMPLETED'] }
            };
            if (departmentGroupId) propagateWhere.departmentGroupId = departmentGroupId;
            await prisma.application.updateMany({ where: propagateWhere, data: { mentorId: effectiveMentorId } });
        }

        // 4. Email Trigger Logic
        const appWhere = { internshipId, status: { in: ['SHORTLISTED'] } };
        if (departmentGroupId) appWhere.departmentGroupId = departmentGroupId;

        const targetApplicants = await prisma.application.findMany({
            where: appWhere,
            include: { student: { include: { user: true } } }
        });

        if (meetLink && interviewDate && targetApplicants.length > 0) {
            targetApplicants.forEach(app => {
                const email = app.student.user?.email;
                if (email && !email.endsWith('@aptransco.portal')) {
                    const dateStr = new Date(interviewDate).toLocaleDateString();
                    const timeStr = new Date(interviewDate).toLocaleTimeString();
                    emailService.sendInterviewScheduled(email, app.student.fullName, dateStr, timeStr, meetLink).catch(err => {
                        console.error(`Failed to send interview email to ${email}:`, err.message);
                    });
                }
            });
        }

        res.status(200).json({ success: true, data: committee });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Users by Role
 * @route   GET /api/v1/admin/users
 * @access  Private
 */
const getUsersByRole = async (req, res) => {
    try {
        const { role, department } = req.query;
        const whereClause = {};
        if (role) whereClause.role = role;

        // If HOD, force their department
        if (req.user.role === 'HOD' && req.user.department) {
            whereClause.department = req.user.department;
        } else if (department) {
            whereClause.department = department;
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: { id: true, name: true, email: true, department: true, designation: true, mentorField: true, mentorLocation: true, phone: true },
            orderBy: { name: 'asc' }
        });
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Delete a MENTOR user (HOD can only delete mentors from own dept)
 * @route   DELETE /api/v1/admin/users/:id
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const target = await prisma.user.findUnique({ where: { id } });
        if (!target) return res.status(404).json({ success: false, message: 'User not found' });
        if (target.role !== 'MENTOR') return res.status(403).json({ success: false, message: 'Only MENTOR accounts can be deleted this way' });
        if (req.user.role === 'HOD' && target.department !== req.user.department)
            return res.status(403).json({ success: false, message: 'You can only delete mentors from your own department' });
        await prisma.user.delete({ where: { id } });
        res.json({ success: true, message: 'Mentor deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * @desc    Update User Role
 */
const updateUserRole = async (req, res) => {
    try {
        const { role } = req.body;
        const targetId = req.params.id;
        const targetUser = await prisma.user.findUnique({ where: { id: targetId } });
        if (!targetUser) return res.status(404).json({ success: false, message: 'User not found' });

        if (role === 'ADMIN' && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const updated = await prisma.user.update({
            where: { id: targetId },
            data: { role }
        });

        await createAuditLog('UPDATE_USER_ROLE', req.user.email, `Changed ${targetUser.email} role to ${role}`, targetId);
        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Stipend Details
 */
const getStipendDetails = async (req, res) => {
    try {
        const stipend = await prisma.stipend.findUnique({ where: { applicationId: req.params.id } });
        res.status(200).json({ success: true, data: stipend });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update Stipend Details
 */
const updateStipendDetails = async (req, res) => {
    try {
        const { panNumber, bankAccount, ifscCode, bankName, bankBranch, approvalStatus } = req.body;
        const stipend = await prisma.stipend.upsert({
            where: { applicationId: req.params.id },
            update: { panNumber, bankAccount, ifscCode, bankName, bankBranch, approvalStatus },
            create: { applicationId: req.params.id, panNumber, bankAccount, ifscCode, bankName, bankBranch, approvalStatus }
        });
        res.status(200).json({ success: true, data: stipend });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Interns
 */
const getAllInterns = async (req, res) => {
    try {
        const whereClause = {
            status: { in: ['SELECTED', 'APPROVED', 'REPORTED', 'HIRED', 'ONGOING', 'COMPLETED'] }
        };

        // Role-based filtering
        if (req.user.role === 'MENTOR') {
            // Mentors see only their own assigned interns
            whereClause.mentorId = req.user.id;
        } else if (req.user.role === 'HOD') {
            if (req.user.department) {
                whereClause.OR = [
                    { internship: { department: req.user.department } },
                    { departmentGroup: { department: req.user.department } }
                ];
            }
        }

        const interns = await prisma.application.findMany({
            where: whereClause,
            include: {
                student: { include: { user: { select: { email: true } } } },
                internship: { select: { title: true, department: true, location: true } },
                mentor: { select: { name: true, email: true } },
                departmentGroup: { select: { department: true } },
                field: { select: { fieldName: true, locations: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.status(200).json({ success: true, data: interns });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get All Meetings
 */
const getMeetings = async (req, res) => {
    try {
        const committees = await prisma.committee.findMany({
            include: { internship: { select: { title: true, department: true } } },
            orderBy: { interviewDate: 'asc' }
        });
        res.status(200).json({ success: true, data: committees });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Assign Work to Intern
 */
const assignWork = async (req, res) => {
    try {
        const { applicationId, title, description, dueDate } = req.body;
        const mentorId = req.user.id;

        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: { student: { include: { user: true } } }
        });

        if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
        if (application.mentorId !== mentorId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const work = await prisma.workAssignment.create({
            data: {
                applicationId,
                mentorId,
                studentId: application.studentId,
                title,
                description,
                dueDate: dueDate ? new Date(dueDate) : null
            }
        });

        // Notify Intern
        const student = application.student;
        await notifyWorkAssignment(
            student.user.email,
            student.fullName,
            req.user.name || 'Your Mentor',
            title,
            description
        );

        res.status(201).json({ success: true, data: work });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Work Assignments
 */
const getWorkAssignments = async (req, res) => {
    try {
        const { applicationId } = req.query;
        let whereClause = {};

        if (applicationId) {
            whereClause.applicationId = applicationId;
        } else if (req.user.role === 'MENTOR') {
            whereClause.mentorId = req.user.id;
        } else if (req.user.role === 'STUDENT') {
            whereClause.studentId = req.user.studentProfileId; // Check this based on how student profile is handled
        }

        const assignments = await prisma.workAssignment.findMany({
            where: whereClause,
            include: {
                student: { select: { fullName: true } },
                mentor: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({ success: true, data: assignments });
    } catch (error) {
        console.error('Admin controller error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get Meetings for Mentor/HOD/PRTI
 * @route   GET /api/v1/admin/meetings/my
 * @access  Private
 */
const getMentorMeetings = async (req, res) => {
    try {
        const userId = req.user.id;
        const role   = req.user.role;

        let committeeWhere = {};
        if (role === 'HOD') {
            committeeWhere.hodId = userId;
        } else if (role === 'MENTOR') {
            committeeWhere.mentorId = userId;
        } else if (role === 'CE_PRTI') {
            committeeWhere.prtiMemberId = userId;
        } else if (role !== 'ADMIN') {
            committeeWhere.OR = [{ hodId: userId }, { mentorId: userId }, { prtiMemberId: userId }];
        }

        // SINGLE internship committees (existing)
        const committees = await prisma.committee.findMany({
            where: committeeWhere,
            include: {
                internship: {
                    select: { id: true, title: true, department: true, location: true, internshipMode: true }
                }
            },
            orderBy: { interviewDate: 'asc' }
        });

        // GROUP internship: PS-level mentor assignments
        let psAssignments = [];
        if (role === 'MENTOR' || role === 'ADMIN') {
            const problemStatements = await prisma.internshipDepartmentProblemStatement.findMany({
                where: { mentorId: userId },
                include: {
                    internship: {
                        select: { id: true, title: true, internshipMode: true }
                    },
                    departmentGroup: {
                        select: { id: true, department: true, title: true }
                    },
                    _count: { select: { applications: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            psAssignments = problemStatements.map(ps => ({
                _type: 'PS_ASSIGNMENT',
                id: ps.id,
                psNumber: ps.problemStatementNumber,
                psTitle: ps.title,
                vacancies: ps.vacancies,
                applicationsCount: ps._count.applications,
                department: ps.departmentGroup?.department,
                internship: ps.internship,
                departmentGroup: ps.departmentGroup
            }));
        }

        // Tag SINGLE committees for easier rendering
        const taggedCommittees = committees
            .filter(c => c.internship?.internshipMode !== 'GROUP') // exclude old GROUP committee stubs
            .map(c => ({ _type: 'COMMITTEE', ...c }));

        res.status(200).json({ success: true, data: [...taggedCommittees, ...psAssignments] });
    } catch (error) {
        console.error('getMentorMeetings error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ─── Department Group CRUD (for GROUP internships) ───

/**
 * @desc    Add a department group to an existing GROUP internship
 * @route   POST /api/v1/admin/internships/:id/groups
 */
const addDepartmentGroup = async (req, res) => {
    try {
        const internship = await prisma.internship.findUnique({ where: { id: req.params.id } });
        if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });
        if (internship.internshipMode !== 'GROUP') {
            return res.status(400).json({ success: false, message: 'Cannot add groups to SINGLE mode internship' });
        }

        const { department, title, description, openings, rolesData, skillsRequired, expectations,
                preferredColleges, quotaPercentages, customQuestions, internshipType } = req.body;

        if (!department) return res.status(400).json({ success: false, message: 'Department is required' });

        // Use the internshipType from the request body; fall back to the parent internship's type
        const resolvedType = internshipType || internship.internshipType || 'COLLABORATIVE';

        const group = await prisma.internshipDepartmentGroup.create({
            data: {
                internshipId: req.params.id,
                department,
                title: title || `${department} Internship`,
                description: description || null,
                openings: parseInt(openings) || 0,
                rolesData: rolesData || null,
                skillsRequired: normalizeRequirements(skillsRequired),
                expectations: expectations || null,
                preferredColleges: preferredColleges || [],
                quotaPercentages: quotaPercentages || null,
                customQuestions: customQuestions || [],
                internshipType: resolvedType,
                notifiedAt: new Date()
            }
        });

        // Create committee stub
        await prisma.committee.create({ data: { departmentGroupId: group.id } });

        // For COLLABORATIVE: move to PENDING_HOD_INPUTS so HODs can submit PSes
        // For NON_STIPEND: stay DRAFT until frontend explicitly publishes after fields are added
        if (internship.publishStatus === 'DRAFT' && internship.internshipType === 'COLLABORATIVE') {
            await prisma.internship.update({
                where: { id: req.params.id },
                data: { publishStatus: 'PENDING_HOD_INPUTS' }
            });
        }

        // Update parent openings total
        const allGroups = await prisma.internshipDepartmentGroup.findMany({ where: { internshipId: req.params.id } });
        const totalOpenings = allGroups.reduce((s, g) => s + g.openings, 0);
        await prisma.internship.update({ where: { id: req.params.id }, data: { openingsCount: totalOpenings } });

        // Only notify HODs for COLLABORATIVE — NON_STIPEND goes live directly without HOD inputs
        if (internship.internshipType === 'COLLABORATIVE') {
            const hodUser = await prisma.user.findFirst({ where: { role: 'HOD', department } });
            if (hodUser) {
                const { sendEmail } = require('../services/mailService');
                sendEmail(
                    hodUser.email,
                    `Action Required: Submit Problem Statements for ${internship.title}`,
                    `<h3>Dear ${hodUser.name || 'HOD'},</h3>
                    <p>APTRANSCO has created a new internship program: <strong>${internship.title}</strong></p>
                    <p>Your department (<strong>${department}</strong>) has been included. Please log in to the APTRANSCO Internship Portal and submit problem statements for your department.</p>
                    <p>The internship will go live for students only after all departments submit their problem statements.</p>
                    <p>Best Regards,<br>APTRANSCO Internship Cell</p>`
                ).catch(err => console.error('HOD notify fail:', err.message));
            }
        }

        res.status(201).json({ success: true, data: group });
    } catch (error) {
        if (error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'This department already exists in this internship' });
        }
        console.error('Add department group error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Update a department group
 * @route   PUT /api/v1/admin/internships/:id/groups/:groupId
 */
const updateDepartmentGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await prisma.internshipDepartmentGroup.findUnique({ where: { id: groupId } });
        if (!group || group.internshipId !== req.params.id) {
            return res.status(404).json({ success: false, message: 'Department group not found' });
        }

        const updateData = {};
        const fields = ['title', 'description', 'openings', 'rolesData', 'skillsRequired', 'expectations',
                         'preferredColleges', 'quotaPercentages', 'problemStatements', 'customQuestions'];
        
        for (const f of fields) {
            if (req.body[f] !== undefined) {
                if (f === 'openings') updateData[f] = parseInt(req.body[f]) || 0;
                else if (f === 'skillsRequired') updateData[f] = normalizeRequirements(req.body[f]);
                else updateData[f] = req.body[f];
            }
        }

        const updated = await prisma.internshipDepartmentGroup.update({
            where: { id: groupId },
            data: updateData
        });

        // Recalculate parent openings
        const allGroups = await prisma.internshipDepartmentGroup.findMany({ where: { internshipId: req.params.id } });
        const totalOpenings = allGroups.reduce((s, g) => s + g.openings, 0);
        await prisma.internship.update({ where: { id: req.params.id }, data: { openingsCount: totalOpenings } });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Update department group error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Delete a department group
 * @route   DELETE /api/v1/admin/internships/:id/groups/:groupId
 */
const deleteDepartmentGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const group = await prisma.internshipDepartmentGroup.findUnique({ where: { id: groupId } });
        if (!group || group.internshipId !== req.params.id) {
            return res.status(404).json({ success: false, message: 'Department group not found' });
        }

        // Check for existing applications
        const appCount = await prisma.application.count({ where: { departmentGroupId: groupId } });
        if (appCount > 0) {
            return res.status(400).json({ success: false, message: `Cannot delete: ${appCount} applications exist for this group` });
        }

        await prisma.internshipDepartmentGroup.delete({ where: { id: groupId } });

        // Recalculate parent openings
        const allGroups = await prisma.internshipDepartmentGroup.findMany({ where: { internshipId: req.params.id } });
        const totalOpenings = allGroups.reduce((s, g) => s + g.openings, 0);
        await prisma.internship.update({ where: { id: req.params.id }, data: { openingsCount: totalOpenings } });

        res.status(200).json({ success: true, message: 'Department group deleted' });
    } catch (error) {
        console.error('Delete department group error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Search Intern by Roll Number
 * @route   GET /api/v1/admin/interns/search/:rollNumber
 */
const searchInternByRollNumber = async (req, res) => {
    try {
        const { rollNumber } = req.params;

        // 1. Find the student by roll number
        const student = await prisma.studentProfile.findFirst({
            where: {
                rollNumber: {
                    equals: rollNumber,
                    mode: 'insensitive'
                }
            },
            include: {
                user: {
                    select: {
                        email: true,
                        createdAt: true
                    }
                },
                applications: {
                    include: {
                        internship: true,
                        departmentGroup: true,
                        mentor: {
                            select: {
                                name: true,
                                email: true,
                                phone: true
                            }
                        },
                        attendance: true,
                        stipend: true,
                        workAssignments: {
                            orderBy: { createdAt: 'desc' }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student with this roll number not found' });
        }

        // Check department access if HOD or MENTOR
        if (['HOD', 'MENTOR'].includes(req.user.role)) {
            const hasAccess = student.applications.some(app => 
                app.internship?.department === req.user.department || 
                app.departmentGroup?.department === req.user.department
            );
            if (!hasAccess) {
                return res.status(403).json({ success: false, message: 'Access denied: Student is not in your department' });
            }
        }

        res.status(200).json({ success: true, data: student });
    } catch (error) {
        console.error('Search intern error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    PRTI: full batch detail — all internships with dept groups + problem statements
 * @route   GET /api/v1/admin/batches/:id/details
 * @access  Private (ADMIN, CE_PRTI)
 */
const getBatchDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const batch = await prisma.internshipBatch.findUnique({ where: { id } });
        if (!batch) return res.status(404).json({ success: false, message: 'Batch not found' });

        const internships = await prisma.internship.findMany({
            where: { batchId: id },
            include: {
                departmentGroups: {
                    include: {
                        problemStatements: { orderBy: { problemStatementNumber: 'asc' } },
                        fields: true,
                        _count: { select: { applications: true } }
                    },
                    orderBy: [{ hodSubmitted: 'asc' }, { department: 'asc' }]
                },
                _count: { select: { applications: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Submission progress metrics only track COLLABORATIVE GROUP internships
        const collabGroups        = internships.filter(i => i.internshipType === 'COLLABORATIVE').flatMap(i => i.departmentGroups);
        const totalGroups         = collabGroups.length;
        const submittedGroups     = collabGroups.filter(g => g.hodSubmitted).length;
        const totalVacancies      = internships.reduce((s, i) => s + (i.openingsCount || 0), 0);
        const totalProblemStmts   = collabGroups.reduce((s, g) => s + g.problemStatements.length, 0);

        console.log(`[Batch Details] "${batch.title}": ${internships.length} internship(s), ${submittedGroups}/${totalGroups} groups submitted`);

        res.status(200).json({
            success: true,
            data: {
                batch,
                internships: internships.map(i => ({
                    ...i,
                    applicationsCount: i._count.applications,
                    _count: undefined,
                    departmentGroups: i.departmentGroups.map(g => ({
                        ...g,
                        applicationsCount: g._count.applications,
                        _count: undefined
                    }))
                })),
                summary: {
                    totalInternships: internships.length,
                    totalGroups,
                    submittedGroups,
                    pendingGroups: totalGroups - submittedGroups,
                    totalVacancies,
                    totalProblemStmts
                }
            }
        });
    } catch (error) {
        console.error('getBatchDetails error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    HOD: fetch all GROUP internship dept-groups that are still pending submission
 * @route   GET /api/v1/admin/hod/pending-group-submissions
 * @access  Private (HOD, ADMIN, CE_PRTI)
 *
 * Queries InternshipDepartmentGroup.department (group-level field) — NOT
 * Internship.department (which is 'ALL' for GROUP internships and would never match).
 */
const getHodPendingSubmissions = async (req, res) => {
    try {
        const { role, department } = req.user;

        const whereClause = {
            hodSubmitted: false,
            internship: { isActive: true, internshipMode: 'GROUP', internshipType: 'COLLABORATIVE' }
        };

        if (role === 'HOD') {
            if (!department) {
                return res.status(400).json({ success: false, message: 'HOD department not set' });
            }
            whereClause.department = department;
        }

        const pendingGroups = await prisma.internshipDepartmentGroup.findMany({
            where: whereClause,
            include: {
                internship: {
                    select: {
                        id: true, title: true, description: true, duration: true,
                        internshipType: true, applicationDeadline: true, createdAt: true,
                        publishStatus: true,
                        batch: { select: { title: true } }
                    }
                },
                problemStatements: { orderBy: { problemStatementNumber: 'asc' } }
            },
            orderBy: { createdAt: 'asc' }
        });

        console.log(`[HOD Pending] dept="${department}" → ${pendingGroups.length} pending group(s)`);

        res.status(200).json({ success: true, data: pendingGroups });
    } catch (error) {
        console.error('getHodPendingSubmissions error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    HOD: fetch ALL GROUP internship dept-groups (pending + submitted) for their dept
 * @route   GET /api/v1/admin/hod/group-submissions
 * @access  Private (HOD, ADMIN, CE_PRTI)
 *
 * This is the correct query for the problem-statements page.  The previous approach
 * called GET /admin/internships and tried to extract groups from it, but GROUP
 * internships have Internship.department = 'ALL' which never matches HOD's dept
 * filter — so submitted groups silently disappeared after the first submission.
 * Querying InternshipDepartmentGroup directly (by group.department) fixes this.
 */
const getHodGroupSubmissions = async (req, res) => {
    try {
        const { role, department } = req.user;

        const whereClause = {
            internship: { isActive: true, internshipMode: 'GROUP', internshipType: 'COLLABORATIVE' }
        };

        if (role === 'HOD') {
            if (!department) {
                return res.status(400).json({ success: false, message: 'HOD department not set' });
            }
            whereClause.department = department;
        }

        const groups = await prisma.internshipDepartmentGroup.findMany({
            where: whereClause,
            include: {
                internship: {
                    select: {
                        id: true, title: true, description: true, duration: true,
                        internshipType: true, applicationDeadline: true, createdAt: true,
                        publishStatus: true,
                        batch: { select: { title: true } }
                    }
                },
                problemStatements: { orderBy: { problemStatementNumber: 'asc' } }
            },
            // Pending first, then submitted; within each bucket sort by creation time
            orderBy: [{ hodSubmitted: 'asc' }, { createdAt: 'asc' }]
        });

        const pending = groups.filter(g => !g.hodSubmitted).length;
        const submitted = groups.filter(g => g.hodSubmitted).length;
        console.log(`[HOD Group Submissions] dept="${department}" → ${pending} pending, ${submitted} submitted`);

        res.status(200).json({ success: true, data: groups });
    } catch (error) {
        console.error('getHodGroupSubmissions error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    PRTI: get department-wise submission progress for a GROUP internship
 * @route   GET /api/v1/admin/internships/:id/group-progress
 * @access  Private (ADMIN, CE_PRTI)
 */
const getGroupInternshipProgress = async (req, res) => {
    try {
        const { id } = req.params;

        const internship = await prisma.internship.findUnique({
            where: { id },
            include: {
                departmentGroups: {
                    include: {
                        problemStatements: { orderBy: { problemStatementNumber: 'asc' } },
                        _count: { select: { applications: true } }
                    },
                    orderBy: { department: 'asc' }
                },
                batch: { select: { title: true } }
            }
        });

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        const total = internship.departmentGroups.length;
        const submitted = internship.departmentGroups.filter(g => g.hodSubmitted).length;

        console.log(`[Group Progress] "${internship.title}": ${submitted}/${total} depts submitted`);

        res.status(200).json({
            success: true,
            data: {
                id: internship.id,
                title: internship.title,
                publishStatus: internship.publishStatus,
                batch: internship.batch,
                total,
                submitted,
                pending: total - submitted,
                groups: internship.departmentGroups.map(g => ({
                    ...g,
                    applicationsCount: g._count.applications,
                    _count: undefined
                }))
            }
        });
    } catch (error) {
        console.error('getGroupInternshipProgress error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    HOD: applications for Learning Internships (NON_STIPEND) in their dept
 * @route   GET /api/v1/admin/hod/learning-applications
 * @access  Private (HOD, ADMIN, CE_PRTI)
 */
const getHodLearningApplications = async (req, res) => {
    try {
        const hodDept = req.user.department;
        if (!hodDept) return res.status(400).json({ success: false, message: 'HOD department not set' });

        const appInclude = {
            student: { include: { user: { select: { email: true } } } },
            internship: { select: { id: true, title: true, internshipType: true, internshipMode: true, duration: true, department: true, requiredDocuments: true } },
            field: true,
            departmentGroup: { select: { id: true, department: true, title: true } },
            mentor: { select: { id: true, name: true, email: true } },
            documents: true
        };

        // SINGLE NON_STIPEND — dept matches Internship.department directly
        const singleApps = await prisma.application.findMany({
            where: {
                internship: {
                    internshipType: 'NON_STIPEND',
                    internshipMode: 'SINGLE',
                    department: hodDept,
                    isActive: true
                }
            },
            include: appInclude,
            orderBy: { createdAt: 'asc' }
        });

        // GROUP NON_STIPEND — dept matches InternshipDepartmentGroup.department
        const groupApps = await prisma.application.findMany({
            where: {
                internship: { internshipType: 'NON_STIPEND', internshipMode: 'GROUP', isActive: true },
                departmentGroup: { department: hodDept }
            },
            include: appInclude,
            orderBy: { createdAt: 'asc' }
        });

        res.status(200).json({ success: true, data: [...singleApps, ...groupApps] });
    } catch (error) {
        console.error('getHodLearningApplications error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Add a field to a GROUP NON_STIPEND dept group (or internship for SINGLE)
 * @route   POST /api/v1/admin/internships/:id/groups/:groupId/fields
 * @access  Private (ADMIN, CE_PRTI, HOD)
 */
const addGroupField = async (req, res) => {
    try {
        const { id: internshipId, groupId } = req.params;
        const { fieldName, fieldMasterId, description, vacancies, locations, specializations } = req.body;

        if (!fieldName) return res.status(400).json({ success: false, message: 'Field name is required' });

        const group = await prisma.internshipDepartmentGroup.findUnique({ where: { id: groupId } });
        if (!group || group.internshipId !== internshipId) {
            return res.status(404).json({ success: false, message: 'Department group not found' });
        }

        // locations can be string[] (legacy) or {name, vacancies}[] (new format)
        const normalizedLocations = (locations || []).map(l =>
            typeof l === 'string' ? { name: l, vacancies: 0 } : l
        );
        const computedVacancies = normalizedLocations.length > 0
            ? normalizedLocations.reduce((s, l) => s + (parseInt(l.vacancies) || 0), 0)
            : parseInt(vacancies) || 0;

        // Inherit specializations from FieldMaster if linked; else use provided
        let resolvedSpecializations = Array.isArray(specializations) ? specializations : [];
        if (fieldMasterId && resolvedSpecializations.length === 0) {
            const master = await prisma.fieldMaster.findUnique({ where: { id: fieldMasterId }, select: { specializations: true } });
            if (Array.isArray(master?.specializations)) resolvedSpecializations = master.specializations;
        }

        const field = await prisma.internshipField.create({
            data: {
                departmentGroupId: groupId,
                fieldName,
                fieldMasterId: fieldMasterId || null,
                description: description || null,
                vacancies: computedVacancies,
                locations: normalizedLocations,
                specializations: resolvedSpecializations
            }
        });

        // Recalculate group + parent internship openings
        const allFields = await prisma.internshipField.findMany({ where: { departmentGroupId: groupId } });
        const groupTotal = allFields.reduce((s, f) => s + f.vacancies, 0);
        await prisma.internshipDepartmentGroup.update({ where: { id: groupId }, data: { openings: groupTotal } });

        const allGroups = await prisma.internshipDepartmentGroup.findMany({ where: { internshipId } });
        await prisma.internship.update({
            where: { id: internshipId },
            data: { openingsCount: allGroups.reduce((s, g) => s + g.openings, 0) }
        });

        res.status(201).json({ success: true, data: field });
    } catch (error) {
        console.error('addGroupField error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Delete a field from a GROUP dept group
 * @route   DELETE /api/v1/admin/internships/:id/groups/:groupId/fields/:fieldId
 */
const deleteGroupField = async (req, res) => {
    try {
        const { id: internshipId, groupId, fieldId } = req.params;

        const field = await prisma.internshipField.findUnique({
            where: { id: fieldId },
            include: { _count: { select: { applications: true } } }
        });
        if (!field || field.departmentGroupId !== groupId) {
            return res.status(404).json({ success: false, message: 'Field not found' });
        }
        if (field._count.applications > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete field with existing applications' });
        }

        await prisma.internshipField.delete({ where: { id: fieldId } });

        // Recalculate openings
        const allFields = await prisma.internshipField.findMany({ where: { departmentGroupId: groupId } });
        const groupTotal = allFields.reduce((s, f) => s + f.vacancies, 0);
        await prisma.internshipDepartmentGroup.update({ where: { id: groupId }, data: { openings: groupTotal } });

        const allGroups = await prisma.internshipDepartmentGroup.findMany({ where: { internshipId } });
        await prisma.internship.update({
            where: { id: internshipId },
            data: { openingsCount: allGroups.reduce((s, g) => s + g.openings, 0) }
        });

        res.status(200).json({ success: true, message: 'Field deleted' });
    } catch (error) {
        console.error('deleteGroupField error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * @desc    Get HOD's dept problem statements with nested applications (for Applications page)
 * @route   GET /api/v1/admin/hod/ps-applications
 * @access  Private (HOD, ADMIN, CE_PRTI)
 */
const getHodPsApplications = async (req, res) => {
    try {
        const hodDept = req.user.department;
        if (!hodDept) return res.status(400).json({ success: false, message: 'HOD department not set' });

        const groups = await prisma.internshipDepartmentGroup.findMany({
            where: {
                department: hodDept,
                internship: { internshipMode: 'GROUP', internshipType: 'COLLABORATIVE' }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                internship: {
                    select: {
                        id: true, title: true, publishStatus: true, internshipType: true,
                        duration: true, shortlistingRatio: true, preferredColleges: true
                    }
                },
                problemStatements: {
                    orderBy: { problemStatementNumber: 'asc' },
                    include: {
                        mentor: { select: { id: true, name: true, email: true } },
                        applications: {
                            orderBy: { createdAt: 'desc' },
                            include: {
                                student: {
                                    include: {
                                        user: { select: { email: true, name: true } }
                                    }
                                },
                                documents: true,
                                stipend: true,
                                mentor: { select: { name: true, email: true } },
                                departmentGroup: { select: { id: true, department: true, title: true } },
                                internship: {
                                    include: { evaluationCriteria: { orderBy: { createdAt: 'asc' } } }
                                },
                                evaluationScores: true
                            }
                        }
                    }
                }
            }
        });

        res.status(200).json({ success: true, data: groups });
    } catch (error) {
        console.error('getHodPsApplications error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Assign mentor to an application without changing status
 * PUT /admin/applications/:id/mentor
 */
const assignApplicationMentor = async (req, res) => {
    try {
        const { id } = req.params;
        const { mentorId } = req.body;
        if (!mentorId) return res.status(400).json({ success: false, message: 'mentorId required' });

        const app = await prisma.application.findUnique({
            where: { id },
            include: { departmentGroup: { select: { department: true } }, internship: { select: { department: true } } }
        });
        if (!app) return res.status(404).json({ success: false, message: 'Application not found' });

        // HOD can only assign mentors from their own department
        // ADMIN / CE_PRTI can assign any mentor (no dept restriction)
        const isHod = req.user.role === 'HOD';
        const mentorWhere = { id: mentorId, role: 'MENTOR' };
        if (isHod) mentorWhere.department = req.user.department;

        const mentor = await prisma.user.findFirst({ where: mentorWhere });
        if (!mentor) {
            const hint = isHod
                ? `No mentor with that ID found in your department (${req.user.department}). Make sure the user has been assigned the MENTOR role.`
                : 'Mentor not found or does not have MENTOR role.';
            return res.status(400).json({ success: false, message: hint });
        }

        await prisma.application.update({ where: { id }, data: { mentorId } });
        res.json({ success: true, message: 'Mentor assigned', mentor: { id: mentor.id, name: mentor.name } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * Update held seats count for a specific field
 * PATCH /admin/internships/:id/groups/:groupId/fields/:fieldId/held-seats
 */
const setFieldHeldSeats = async (req, res) => {
    try {
        const { fieldId } = req.params;
        const { heldSeats } = req.body;
        if (heldSeats === undefined || heldSeats < 0) {
            return res.status(400).json({ success: false, message: 'heldSeats must be a non-negative integer' });
        }
        const field = await prisma.internshipField.findUnique({ where: { id: fieldId } });
        if (!field) return res.status(404).json({ success: false, message: 'Field not found' });

        const updated = await prisma.internshipField.update({
            where: { id: fieldId },
            data: { heldSeats: parseInt(heldSeats) }
        });
        await createAuditLog('SET_HELD_SEATS', req.user.email, `Field ${field.fieldName}: heldSeats → ${heldSeats}`, fieldId);
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

module.exports = {
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
    deleteUser,
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
    assignApplicationMentor,
    setFieldHeldSeats
};
