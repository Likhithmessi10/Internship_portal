/**
 * Application Status State Machine (Production-Hardened)
 * 7 Canonical Statuses: SUBMITTED, SHORTLISTED, APPROVED, REJECTED, HIRED, ONGOING, COMPLETED
 */

const STATUS = {
    SUBMITTED: 'SUBMITTED',
    SHORTLISTED: 'SHORTLISTED',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED',
    HIRED: 'HIRED',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED'
};

const ALLOWED_TRANSITIONS = {
    [STATUS.SUBMITTED]: [STATUS.SHORTLISTED, STATUS.REJECTED],
    [STATUS.SHORTLISTED]: [STATUS.APPROVED, STATUS.REJECTED],
    [STATUS.APPROVED]: [STATUS.HIRED, STATUS.REJECTED],
    [STATUS.HIRED]: [STATUS.ONGOING, STATUS.REJECTED],
    [STATUS.ONGOING]: [STATUS.COMPLETED, STATUS.REJECTED],
    [STATUS.COMPLETED]: [],
    [STATUS.REJECTED]: [STATUS.SUBMITTED]
};

const ROLE_PERMISSIONS = {
    ADMIN: Object.values(STATUS),
    CE_PRTI: [STATUS.APPROVED, STATUS.HIRED, STATUS.REJECTED],
    HOD: [STATUS.SHORTLISTED, STATUS.APPROVED, STATUS.REJECTED],
    MENTOR: [STATUS.ONGOING, STATUS.COMPLETED],
    STUDENT: []
};

/**
 * Validates if a status transition is allowed
 */
const canTransition = (fromStatus, toStatus, role) => {
    if (role === 'ADMIN') return true;

    const validNextStatuses = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!validNextStatuses.includes(toStatus)) return false;

    const allowedForRole = ROLE_PERMISSIONS[role] || [];
    if (!allowedForRole.includes(toStatus)) return false;

    return true;
};

module.exports = { STATUS, canTransition };
