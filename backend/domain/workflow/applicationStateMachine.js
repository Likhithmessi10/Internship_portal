/**
 * Application Status State Machine
 *
 * Canonical flow:
 *   SUBMITTED → SHORTLISTED → UNDER_COMMITTEE_REVIEW → SELECTED → REPORTED → HIRED → ONGOING → COMPLETED
 *
 * SELECTED  : HOD final selection after committee evaluation
 * REPORTED  : Student physically reported to PRTI; roll number generated at this transition
 * HIRED     : All joining formalities (NOC/Bond/Undertaking) verified; internship begins
 *
 * APPROVED is kept in the enum for backward compatibility but is no longer used in new flows.
 */

const STATUS = {
    SUBMITTED: 'SUBMITTED',
    SHORTLISTED: 'SHORTLISTED',
    UNDER_COMMITTEE_REVIEW: 'UNDER_COMMITTEE_REVIEW',
    SELECTED: 'SELECTED',
    APPROVED: 'APPROVED',   // legacy
    REPORTED: 'REPORTED',
    REJECTED: 'REJECTED',
    WAITLISTED: 'WAITLISTED',
    HIRED: 'HIRED',
    ONGOING: 'ONGOING',
    COMPLETED: 'COMPLETED'
};

const ALLOWED_TRANSITIONS = {
    [STATUS.SUBMITTED]:               [STATUS.SHORTLISTED, STATUS.REJECTED],
    [STATUS.SHORTLISTED]:             [STATUS.UNDER_COMMITTEE_REVIEW, STATUS.REJECTED],
    [STATUS.UNDER_COMMITTEE_REVIEW]:  [STATUS.SELECTED, STATUS.APPROVED, STATUS.REJECTED, STATUS.WAITLISTED],
    [STATUS.SELECTED]:                [STATUS.REPORTED, STATUS.REJECTED],
    [STATUS.APPROVED]:                [STATUS.REPORTED, STATUS.HIRED, STATUS.REJECTED], // legacy path
    [STATUS.REPORTED]:                [STATUS.HIRED, STATUS.REJECTED],
    [STATUS.WAITLISTED]:              [STATUS.SELECTED, STATUS.APPROVED, STATUS.REJECTED],
    [STATUS.HIRED]:                   [STATUS.ONGOING, STATUS.REJECTED],
    [STATUS.ONGOING]:                 [STATUS.COMPLETED, STATUS.REJECTED],
    [STATUS.COMPLETED]:               [],
    [STATUS.REJECTED]:                [STATUS.SUBMITTED]
};

const ROLE_PERMISSIONS = {
    ADMIN: Object.values(STATUS),
    // CE_PRTI marks physical reporting and completes the hiring step
    CE_PRTI: [
        STATUS.REPORTED,
        STATUS.HIRED,
        STATUS.REJECTED,
        STATUS.UNDER_COMMITTEE_REVIEW,
        STATUS.SELECTED
    ],
    // HOD shortlists candidates and gives final selection after committee evaluation
    HOD: [
        STATUS.SHORTLISTED,
        STATUS.SELECTED,
        STATUS.APPROVED, // legacy
        STATUS.REJECTED,
        STATUS.WAITLISTED
    ],
    MENTOR: [STATUS.ONGOING, STATUS.COMPLETED, STATUS.UNDER_COMMITTEE_REVIEW],
    STUDENT: []
};

/**
 * Returns true if the transition is permitted for the given role.
 * Pass internshipType = 'NON_STIPEND' to enable the simplified Learning Internship path.
 */
const canTransition = (fromStatus, toStatus, role, internshipType = null) => {
    if (role === 'ADMIN') return true;

    // Learning Internships (NON_STIPEND): no committee, HOD hires/selects directly
    if (internshipType === 'NON_STIPEND') {
        if (['HOD', 'CE_PRTI'].includes(role)) {
            const learningAllowed = {
                [STATUS.SUBMITTED]:   [STATUS.SHORTLISTED, STATUS.SELECTED, STATUS.APPROVED, STATUS.HIRED, STATUS.REJECTED],
                [STATUS.SHORTLISTED]: [STATUS.SELECTED, STATUS.APPROVED, STATUS.HIRED, STATUS.REJECTED],
                [STATUS.SELECTED]:    [STATUS.HIRED, STATUS.REJECTED],
                [STATUS.APPROVED]:    [STATUS.HIRED, STATUS.REJECTED],
                [STATUS.HIRED]:       [STATUS.ONGOING],
                [STATUS.ONGOING]:     [STATUS.COMPLETED],
                [STATUS.REJECTED]:    [STATUS.SUBMITTED],
            };
            return (learningAllowed[fromStatus] || []).includes(toStatus);
        }
    }

    const validNextStatuses = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!validNextStatuses.includes(toStatus)) return false;

    const allowedForRole = ROLE_PERMISSIONS[role] || [];
    return allowedForRole.includes(toStatus);
};

module.exports = { STATUS, canTransition, ALLOWED_TRANSITIONS };
