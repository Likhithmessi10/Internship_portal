const prisma = require('../lib/prisma');
const { createAuditLog } = require('../utils/auditLogger');

/**
 * HOD submits a problem statement for their department group.
 * POST /api/v1/admin/internships/:id/groups/:groupId/problem-statements
 */
const submitProblemStatement = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { title, description, requirements, vacancies, locations } = req.body;

        if (!title) return res.status(400).json({ success: false, message: 'Problem statement title is required' });
        if (!vacancies || parseInt(vacancies) < 1) {
            return res.status(400).json({ success: false, message: 'Vacancies must be at least 1' });
        }

        const group = await prisma.internshipDepartmentGroup.findUnique({
            where: { id: groupId },
            include: { internship: true }
        });

        if (!group) return res.status(404).json({ success: false, message: 'Department group not found' });

        if (group.internship.internshipType !== 'COLLABORATIVE') {
            return res.status(400).json({ success: false, message: 'Problem statements are only for Collaborative internships.' });
        }

        if (group.internship.publishStatus === 'LIVE') {
            return res.status(400).json({ success: false, message: 'This internship is already live. Problem statements cannot be modified after launch.' });
        }

        // HOD can only submit for their own department
        if (req.user.role === 'HOD' && group.department !== req.user.department) {
            return res.status(403).json({ success: false, message: 'You can only submit problem statements for your department' });
        }

        // Auto-assign sequential problem statement number within this group
        const existingCount = await prisma.internshipDepartmentProblemStatement.count({
            where: { departmentGroupId: groupId }
        });

        const ps = await prisma.internshipDepartmentProblemStatement.create({
            data: {
                departmentGroupId: groupId,
                internshipId: group.internshipId,
                title,
                description: description || null,
                requirements: requirements || null,
                vacancies: parseInt(vacancies),
                locations: locations || [],
                problemStatementNumber: existingCount + 1,
                createdBy: req.user.id
            }
        });

        // Mark group as HOD-submitted and recalculate total openings
        await prisma.internshipDepartmentGroup.update({
            where: { id: groupId },
            data: {
                hodSubmitted: true,
                hodSubmittedAt: group.hodSubmittedAt || new Date()
            }
        });

        // Recalculate group openings = sum of all problem statement vacancies
        const allPs = await prisma.internshipDepartmentProblemStatement.findMany({
            where: { departmentGroupId: groupId }
        });
        const totalVacancies = allPs.reduce((sum, p) => sum + p.vacancies, 0);
        await prisma.internshipDepartmentGroup.update({
            where: { id: groupId },
            data: { openings: totalVacancies }
        });

        // Recalculate parent internship total openings
        const allGroups = await prisma.internshipDepartmentGroup.findMany({
            where: { internshipId: group.internshipId }
        });
        const parentTotal = allGroups.reduce((s, g) => s + g.openings, 0);
        await prisma.internship.update({
            where: { id: group.internshipId },
            data: { openingsCount: parentTotal }
        });

        // Notify PRTI of this submission
        const allHodSubmitted = allGroups.every(g => g.hodSubmitted);
        const unpublishedGroups = allGroups.filter(g => !g.hodSubmitted);
        const prtiUsers = await prisma.user.findMany({ where: { role: 'CE_PRTI' } });
        const { sendEmail } = require('../services/mailService');
        for (const prti of prtiUsers) {
            const subject = allHodSubmitted
                ? `All Submissions Ready — ${group.internship.title}`
                : `Problem Statement Submitted — ${group.department}`;
            const body = allHodSubmitted
                ? `<h3>Dear ${prti.name || 'CE PRTI'},</h3>
                   <p>All departments have submitted their problem statements for <strong>${group.internship.title}</strong>.</p>
                   <p>The internship is now <strong>ready to launch</strong>. Please log in and click "Launch Internship" to make it visible to students.</p>
                   <p>Best Regards,<br>APTRANSCO Portal</p>`
                : `<h3>Dear ${prti.name || 'CE PRTI'},</h3>
                   <p>The HOD of <strong>${group.department}</strong> has submitted a problem statement for <strong>${group.internship.title}</strong>.</p>
                   <p>Remaining departments yet to submit: ${unpublishedGroups.length}</p>
                   <p>Best Regards,<br>APTRANSCO Portal</p>`;
            sendEmail(prti.email, subject, body).catch(() => {});
        }

        await createAuditLog(
            'SUBMIT_PROBLEM_STATEMENT',
            req.user.email,
            `Submitted problem statement "${title}" for ${group.department}`,
            ps.id
        );

        res.status(201).json({ success: true, data: ps });
    } catch (error) {
        console.error('Submit problem statement error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get all problem statements for a department group.
 * GET /api/v1/admin/internships/:id/groups/:groupId/problem-statements
 */
const getProblemStatements = async (req, res) => {
    try {
        const { groupId } = req.params;

        const group = await prisma.internshipDepartmentGroup.findUnique({
            where: { id: groupId }
        });
        if (!group) return res.status(404).json({ success: false, message: 'Department group not found' });

        if (req.user.role === 'HOD' && group.department !== req.user.department) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const problemStatements = await prisma.internshipDepartmentProblemStatement.findMany({
            where: { departmentGroupId: groupId },
            include: {
                _count: { select: { applications: true } }
            },
            orderBy: { problemStatementNumber: 'asc' }
        });

        res.status(200).json({ success: true, data: problemStatements });
    } catch (error) {
        console.error('Get problem statements error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Update a problem statement.
 * PUT /api/v1/admin/internships/:id/groups/:groupId/problem-statements/:psId
 */
const updateProblemStatement = async (req, res) => {
    try {
        const { groupId, psId } = req.params;
        const { title, description, requirements, vacancies, locations } = req.body;

        const ps = await prisma.internshipDepartmentProblemStatement.findUnique({
            where: { id: psId },
            include: { departmentGroup: true }
        });

        if (!ps || ps.departmentGroupId !== groupId) {
            return res.status(404).json({ success: false, message: 'Problem statement not found' });
        }

        if (req.user.role === 'HOD' && ps.departmentGroup.department !== req.user.department) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (requirements !== undefined) updateData.requirements = requirements;
        if (vacancies !== undefined) updateData.vacancies = parseInt(vacancies);
        if (locations !== undefined) updateData.locations = locations;

        const updated = await prisma.internshipDepartmentProblemStatement.update({
            where: { id: psId },
            data: updateData
        });

        // Recalculate group + parent openings if vacancies changed
        if (vacancies !== undefined) {
            const allPs = await prisma.internshipDepartmentProblemStatement.findMany({
                where: { departmentGroupId: groupId }
            });
            const totalVacancies = allPs.reduce((sum, p) => sum + p.vacancies, 0);
            await prisma.internshipDepartmentGroup.update({
                where: { id: groupId },
                data: { openings: totalVacancies }
            });

            const allGroups = await prisma.internshipDepartmentGroup.findMany({
                where: { internshipId: ps.internshipId }
            });
            const parentTotal = allGroups.reduce((s, g) => s + g.openings, 0);
            await prisma.internship.update({
                where: { id: ps.internshipId },
                data: { openingsCount: parentTotal }
            });
        }

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('Update problem statement error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Delete a problem statement (only if no applications exist for it).
 * DELETE /api/v1/admin/internships/:id/groups/:groupId/problem-statements/:psId
 */
const deleteProblemStatement = async (req, res) => {
    try {
        const { groupId, psId } = req.params;

        const ps = await prisma.internshipDepartmentProblemStatement.findUnique({
            where: { id: psId },
            include: {
                departmentGroup: true,
                _count: { select: { applications: true } }
            }
        });

        if (!ps || ps.departmentGroupId !== groupId) {
            return res.status(404).json({ success: false, message: 'Problem statement not found' });
        }

        if (req.user.role === 'HOD' && ps.departmentGroup.department !== req.user.department) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (ps._count.applications > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete: ${ps._count.applications} application(s) exist for this problem statement`
            });
        }

        await prisma.internshipDepartmentProblemStatement.delete({ where: { id: psId } });

        // Re-sequence remaining problem statements
        const remaining = await prisma.internshipDepartmentProblemStatement.findMany({
            where: { departmentGroupId: groupId },
            orderBy: { problemStatementNumber: 'asc' }
        });
        for (let i = 0; i < remaining.length; i++) {
            await prisma.internshipDepartmentProblemStatement.update({
                where: { id: remaining[i].id },
                data: { problemStatementNumber: i + 1 }
            });
        }

        // Recalculate openings
        const totalVacancies = remaining.reduce((sum, p) => sum + p.vacancies, 0);
        await prisma.internshipDepartmentGroup.update({
            where: { id: groupId },
            data: { openings: totalVacancies }
        });

        const allGroups = await prisma.internshipDepartmentGroup.findMany({
            where: { internshipId: ps.internshipId }
        });
        await prisma.internship.update({
            where: { id: ps.internshipId },
            data: { openingsCount: allGroups.reduce((s, g) => s + g.openings, 0) }
        });

        res.status(200).json({ success: true, message: 'Problem statement deleted' });
    } catch (error) {
        console.error('Delete problem statement error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * PRTI manually publishes a GROUP internship (overrides auto-publish).
 * POST /api/v1/prti/internships/:id/publish
 */
const publishInternship = async (req, res) => {
    try {
        const { id } = req.params;

        if (!['CE_PRTI', 'ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Only CE_PRTI can publish internships' });
        }

        const internship = await prisma.internship.findUnique({
            where: { id },
            include: { departmentGroups: true }
        });

        if (!internship) return res.status(404).json({ success: false, message: 'Internship not found' });
        if (internship.publishStatus === 'LIVE') {
            return res.status(400).json({ success: false, message: 'Internship is already live' });
        }

        // Warn if some HODs haven't submitted yet (but allow override)
        const pendingGroups = internship.departmentGroups.filter(g => !g.hodSubmitted);

        await prisma.internship.update({
            where: { id },
            data: { publishStatus: 'LIVE' }
        });

        await createAuditLog(
            'PUBLISH_INTERNSHIP',
            req.user.email,
            `Published internship "${internship.title}"${pendingGroups.length > 0 ? ` (${pendingGroups.length} dept(s) had not submitted)` : ''}`,
            id
        );

        res.status(200).json({
            success: true,
            message: 'Internship published successfully',
            data: {
                pendingDepartments: pendingGroups.map(g => g.department)
            }
        });
    } catch (error) {
        console.error('Publish internship error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Assign or update mentor for a problem statement.
 * PUT /api/v1/admin/internships/:id/groups/:groupId/problem-statements/:psId/mentor
 */
const assignPsMentor = async (req, res) => {
    try {
        const { psId, groupId } = req.params;
        const { mentorId } = req.body;

        if (!mentorId) return res.status(400).json({ success: false, message: 'mentorId is required' });

        const ps = await prisma.internshipDepartmentProblemStatement.findUnique({
            where: { id: psId },
            include: { departmentGroup: true }
        });
        if (!ps || ps.departmentGroupId !== groupId) {
            return res.status(404).json({ success: false, message: 'Problem statement not found' });
        }

        // Verify mentor exists and belongs to the dept
        const mentor = await prisma.user.findFirst({
            where: { id: mentorId, role: 'MENTOR', department: ps.departmentGroup.department }
        });
        if (!mentor) {
            return res.status(400).json({ success: false, message: 'Mentor not found or not from this department' });
        }

        const updated = await prisma.internshipDepartmentProblemStatement.update({
            where: { id: psId },
            data: { mentorId },
            include: { mentor: { select: { id: true, name: true, email: true } } }
        });

        // Also update all existing SUBMITTED applications under this PS to use this mentor
        await prisma.application.updateMany({
            where: { problemStatementId: psId, status: 'SUBMITTED' },
            data: { mentorId }
        });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        console.error('assignPsMentor error:', error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    submitProblemStatement,
    getProblemStatements,
    updateProblemStatement,
    deleteProblemStatement,
    publishInternship,
    assignPsMentor
};
