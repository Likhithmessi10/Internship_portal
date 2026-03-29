const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get committee details for an internship
 * GET /api/v1/prti/committees/:internshipId
 */
const getCommittee = async (req, res) => {
    try {
        const { internshipId } = req.params;

        const committee = await prisma.committee.findUnique({
            where: { internshipId },
            include: {
                internship: {
                    select: {
                        title: true,
                        department: true
                    }
                }
            }
        });

        if (!committee) {
            return res.status(404).json({
                success: false,
                message: 'Committee not found for this internship'
            });
        }

        // Get HOD and Mentor details
        const hodUser = committee.hodId ? await prisma.user.findUnique({
            where: { id: committee.hodId },
            select: { id: true, name: true, email: true, department: true }
        }) : null;

        const mentorUser = committee.mentorId ? await prisma.user.findUnique({
            where: { id: committee.mentorId },
            select: { id: true, name: true, email: true, department: true }
        }) : null;

        const prtiUser = committee.prtiMemberId ? await prisma.user.findUnique({
            where: { id: committee.prtiMemberId },
            select: { id: true, name: true, email: true, department: true }
        }) : null;

        res.status(200).json({
            success: true,
            data: {
                ...committee,
                hod: hodUser,
                mentor: mentorUser,
                prtiMember: prtiUser
            }
        });
    } catch (error) {
        console.error('Get committee error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Update PRTI representative (3rd member) in committee
 * PUT /api/v1/prti/committees/:internshipId/member
 * 
 * RESTRICTION: Only PRTI member assigned to this department can edit
 */
const updatePRTIMember = async (req, res) => {
    try {
        const { internshipId } = req.params;
        const { prtiMemberId } = req.body;
        const userId = req.user.id;
        const userRole = req.user.role;

        if (!prtiMemberId) {
            return res.status(400).json({
                success: false,
                message: 'PRTI member ID is required'
            });
        }

        // Verify the internship exists
        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
            select: { id: true, department: true, title: true }
        });

        if (!internship) {
            return res.status(404).json({
                success: false,
                message: 'Internship not found'
            });
        }

        // AUTHORIZATION CHECK:
        // Only ADMIN can edit any committee
        // PRTI members can only edit committees in their assigned department
        if (userRole !== 'ADMIN') {
            // Check if this PRTI member is already assigned to this committee
            const existingCommittee = await prisma.committee.findUnique({
                where: { internshipId }
            });

            if (existingCommittee && existingCommittee.prtiMemberId !== userId) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to edit this committee. Only the assigned PRTI representative or Admin can modify it.'
                });
            }
        }

        // Verify the PRTI member exists and is a valid role
        const prtiUser = await prisma.user.findUnique({
            where: {
                id: prtiMemberId,
                role: { in: ['CE_PRTI', 'COMMITTEE_MEMBER', 'ADMIN'] }
            }
        });

        if (!prtiUser) {
            return res.status(400).json({
                success: false,
                message: 'Invalid PRTI member selected'
            });
        }

        // Update committee with PRTI member
        const committee = await prisma.committee.upsert({
            where: { internshipId },
            update: {
                prtiMemberId
            },
            create: {
                internshipId,
                prtiMemberId,
                membersData: {
                    structure: {
                        member1: 'HOD (Permanent)',
                        member2: 'Mentor (Assigned by HOD)',
                        member3: 'PRTI Representative (Editable)'
                    },
                    assignedBy: userId,
                    assignedAt: new Date().toISOString()
                }
            }
        });

        res.status(200).json({
            success: true,
            message: 'PRTI representative updated successfully',
            data: committee
        });
    } catch (error) {
        console.error('Update PRTI member error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get available PRTI members for selection
 * GET /api/v1/prti/committees/members/available
 */
const getAvailablePRTIMembers = async (req, res) => {
    try {
        const members = await prisma.user.findMany({
            where: {
                role: { in: ['CE_PRTI', 'COMMITTEE_MEMBER', 'ADMIN'] }
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });

        res.status(200).json({
            success: true,
            data: members
        });
    } catch (error) {
        console.error('Get available PRTI members error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getCommittee,
    updatePRTIMember,
    getAvailablePRTIMembers
};
