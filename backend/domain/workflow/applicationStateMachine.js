/**
 * Application Status State Machine
 * Centralized logic for allowed transitions and role-based permissions
 */

const STATUS = {
    APPLIED: 'APPLIED',
    SUBMITTED: 'SUBMITTED',
    HOD_REVIEW: 'HOD_REVIEW',
    COMMITTEE_EVALUATION: 'COMMITTEE_EVALUATION',
    CA_APPROVED: 'CA_APPROVED', // Central Admin / PRTI Head Approved
    HIRED: 'HIRED',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED',
    REJECTED: 'REJECTED'
};

const ALLOWED_TRANSITIONS = {
    [STATUS.APPLIED]: [STATUS.SUBMITTED, STATUS.REJECTED],
    [STATUS.SUBMITTED]: [STATUS.HOD_REVIEW, STATUS.REJECTED],
    [STATUS.HOD_REVIEW]: [STATUS.COMMITTEE_EVALUATION, STATUS.REJECTED],
    [STATUS.COMMITTEE_EVALUATION]: [STATUS.HIRED, STATUS.REJECTED, STATUS.CA_APPROVED],
    [STATUS.CA_APPROVED]: [STATUS.HIRED, STATUS.REJECTED],
    [STATUS.HIRED]: [STATUS.ONGOING, STATUS.REJECTED],
    [STATUS.ONGOING]: [STATUS.COMPLETED, STATUS.REJECTED],
    [STATUS.COMPLETED]: [],
    [STATUS.REJECTED]: [STATUS.HOD_REVIEW] // Allow re-opening if needed by HOD
};

const ROLE_PERMISSIONS = {
    ADMIN: Object.values(STATUS), // Can do anything
    CE_PRTI: [STATUS.CA_APPROVED, STATUS.HIRED, STATUS.REJECTED],
    HOD: [STATUS.HOD_REVIEW, STATUS.COMMITTEE_EVALUATION, STATUS.REJECTED],
    MENTOR: [STATUS.ONGOING, STATUS.COMPLETED],
    STUDENT: [] // Students cannot change their own status
};

/**
 * Validates if a status transition is allowed
 * @param {string} fromStatus Current status
 * @param {string} toStatus Target status
 * @param {string} role User role performing the action
 * @returns {boolean}
 */
const canTransition = (fromStatus, toStatus, role) => {
    // 1. Is the transition physically allowed?
    const validNextStatuses = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!validNextStatuses.includes(toStatus) && role !== 'ADMIN') {
        return false;
    }

    // 2. Does the role have permission to set the target status?
    const allowedForRole = ROLE_PERMISSIONS[role] || [];
    if (!allowedForRole.includes(toStatus) && role !== 'ADMIN') {
        return false;
    }

    return true;
};

module.exports = {
    STATUS,
    canTransition
};
