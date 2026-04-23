const prisma = require('../lib/prisma');
const { STATUS, canTransition } = require('../domain/workflow/applicationStateMachine');

/**
 * atomic application status transition with validation and audit trail
 */
const transitionApplicationStatus = async (applicationId, toStatus, user, auditDetails = '', existingTx = null) => {
    const logic = async (tx) => {
        // 1. Fetch current application and its internship boundaries
        const application = await tx.application.findUnique({
            where: { id: applicationId },
            include: { internship: true }
        });

        if (!application) {
            throw new Error('Application not found');
        }

        // 2. Validate transition against state machine
        if (!canTransition(application.status, toStatus, user.role)) {
            throw new Error(`Invalid status transition from ${application.status} to ${toStatus} for role ${user.role}`);
        }

        // 3. Seat Limit Enforcement (Requirement 3: Fix approval race condition)
        const SEAT_CONSUMING = [STATUS.APPROVED, STATUS.HIRED, STATUS.ONGOING];
        
        // If moving TO a seat-consuming status FROM a non-consuming one
        if (SEAT_CONSUMING.includes(toStatus) && !SEAT_CONSUMING.includes(application.status)) {
            const activeCount = await tx.application.count({
                where: {
                    internshipId: application.internshipId,
                    status: { in: SEAT_CONSUMING }
                }
            });

            if (activeCount >= application.internship.openingsCount) {
                throw new Error(`Allocation Failed: No seats remaining. All ${application.internship.openingsCount} slots are filled.`);
            }
        }

        // 4. Perform update
        const updated = await tx.application.update({
            where: { id: applicationId },
            data: { status: toStatus }
        });

        // 5. Create Audit Log
        await tx.auditLog.create({
            data: {
                action: 'STATUS_TRANSITION',
                userEmail: user.email,
                details: `Transitioned ${application.trackingId} from ${application.status} to ${toStatus}. ${auditDetails}`,
                target: applicationId
            }
        });

        return updated;
    };

    if (existingTx) {
        return await logic(existingTx);
    } else {
        return await prisma.$transaction(logic);
    }
};


module.exports = {
    transitionApplicationStatus,
    STATUS
};
