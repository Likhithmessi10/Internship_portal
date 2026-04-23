const prisma = require('../lib/prisma');
const { STATUS, canTransition } = require('../domain/workflow/applicationStateMachine');

/**
 * atomic application status transition with validation and audit trail
 */
const transitionApplicationStatus = async (applicationId, toStatus, user, auditDetails = '') => {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch current status
        const application = await tx.application.findUnique({
            where: { id: applicationId },
            select: { id: true, status: true, trackingId: true }
        });

        if (!application) {
            throw new Error('Application not found');
        }

        // 2. Validate transition
        if (!canTransition(application.status, toStatus, user.role)) {
            throw new Error(`Invalid status transition from ${application.status} to ${toStatus} for role ${user.role}`);
        }

        // 3. Perform update
        const updated = await tx.application.update({
            where: { id: applicationId },
            data: { status: toStatus }
        });

        // 4. Create Audit Log (using transaction client)
        await tx.auditLog.create({
            data: {
                action: 'STATUS_TRANSITION',
                userEmail: user.email,
                details: `Transitioned ${application.trackingId} from ${application.status} to ${toStatus}. ${auditDetails}`,
                target: applicationId
            }
        });

        return updated;
    });
};

module.exports = {
    transitionApplicationStatus,
    STATUS
};
