/**
 * Application Status State Machine
 *
 * MONETARY (COLLABORATIVE) flow:
 *   SUBMITTED → SHORTLISTED → UNDER_COMMITTEE_REVIEW → SELECTED → REPORTED → HIRED → ONGOING → COMPLETED
 *
 * NON_STIPEND (Learning Internship) flow:
 *   SUBMITTED → SHORTLISTED → SELECTED → DOCUMENTS_PENDING → DOCUMENTS_VERIFIED → HIRED → ONGOING → COMPLETED
 *
 * DOCUMENTS_PENDING  : Unlocks doc upload (NOC/Bond/Undertaking/Insurance) after PRTI triggers
 * DOCUMENTS_VERIFIED : PRTI verified all docs — ready to hire
 * HIRED              : NON_STIPEND: roll number generated here; MONETARY: joining formalities done
 */

const STATUS = {
    SUBMITTED:              'SUBMITTED',
    SHORTLISTED:            'SHORTLISTED',
    UNDER_COMMITTEE_REVIEW: 'UNDER_COMMITTEE_REVIEW',
    SELECTED:               'SELECTED',
    APPROVED:               'APPROVED',           // legacy MONETARY
    REPORTED:               'REPORTED',           // MONETARY only — physical reporting
    REJECTED:               'REJECTED',
    WAITLISTED:             'WAITLISTED',
    DOCUMENTS_PENDING:      'DOCUMENTS_PENDING',  // NON_STIPEND
    DOCUMENTS_VERIFIED:     'DOCUMENTS_VERIFIED', // NON_STIPEND
    HIRED:                  'HIRED',
    ONGOING:                'ONGOING',
    COMPLETED:              'COMPLETED'
};

// ── MONETARY transitions ──────────────────────────────────────────────────────
const ALLOWED_TRANSITIONS = {
    [STATUS.SUBMITTED]:               [STATUS.SHORTLISTED, STATUS.REJECTED],
    [STATUS.SHORTLISTED]:             [STATUS.UNDER_COMMITTEE_REVIEW, STATUS.REJECTED],
    [STATUS.UNDER_COMMITTEE_REVIEW]:  [STATUS.SELECTED, STATUS.APPROVED, STATUS.REJECTED, STATUS.WAITLISTED],
    [STATUS.SELECTED]:                [STATUS.REPORTED, STATUS.REJECTED],
    [STATUS.APPROVED]:                [STATUS.REPORTED, STATUS.HIRED, STATUS.REJECTED],
    [STATUS.REPORTED]:                [STATUS.HIRED, STATUS.REJECTED],
    [STATUS.WAITLISTED]:              [STATUS.SELECTED, STATUS.APPROVED, STATUS.REJECTED],
    [STATUS.HIRED]:                   [STATUS.ONGOING, STATUS.REJECTED],
    [STATUS.ONGOING]:                 [STATUS.COMPLETED, STATUS.REJECTED],
    [STATUS.COMPLETED]:               [],
    [STATUS.REJECTED]:                [STATUS.SUBMITTED]
};

// ── NON_STIPEND transitions ───────────────────────────────────────────────────
const NON_STIPEND_TRANSITIONS = {
    [STATUS.SUBMITTED]:           [STATUS.SHORTLISTED, STATUS.REJECTED],
    [STATUS.SHORTLISTED]:         [STATUS.SELECTED, STATUS.REJECTED],
    [STATUS.SELECTED]:            [STATUS.DOCUMENTS_PENDING, STATUS.REJECTED],
    [STATUS.DOCUMENTS_PENDING]:   [STATUS.DOCUMENTS_VERIFIED, STATUS.REJECTED],
    [STATUS.DOCUMENTS_VERIFIED]:  [STATUS.HIRED, STATUS.REJECTED],
    [STATUS.HIRED]:               [STATUS.ONGOING],
    [STATUS.ONGOING]:             [STATUS.COMPLETED],
    [STATUS.COMPLETED]:           [],
    [STATUS.REJECTED]:            [STATUS.SUBMITTED]
};

// ── Role permissions — MONETARY ───────────────────────────────────────────────
const ROLE_PERMISSIONS = {
    ADMIN: Object.values(STATUS),
    CE_PRTI: [
        STATUS.REPORTED, STATUS.HIRED, STATUS.REJECTED,
        STATUS.UNDER_COMMITTEE_REVIEW, STATUS.SELECTED,
        STATUS.DOCUMENTS_PENDING, STATUS.DOCUMENTS_VERIFIED
    ],
    HOD: [
        STATUS.SHORTLISTED, STATUS.SELECTED,
        STATUS.APPROVED, STATUS.REJECTED, STATUS.WAITLISTED
    ],
    MENTOR: [STATUS.ONGOING, STATUS.COMPLETED, STATUS.UNDER_COMMITTEE_REVIEW],
    STUDENT: []
};

// ── Role permissions — NON_STIPEND ────────────────────────────────────────────
// HOD handles up through SELECTED; PRTI takes over from DOCUMENTS_PENDING onward
const NON_STIPEND_ROLE_PERMISSIONS = {
    HOD:     [STATUS.SHORTLISTED, STATUS.SELECTED, STATUS.REJECTED],
    CE_PRTI: [STATUS.DOCUMENTS_PENDING, STATUS.DOCUMENTS_VERIFIED, STATUS.HIRED, STATUS.REJECTED]
};

/**
 * Returns true if the transition is valid for the given role.
 * Pass internshipType = 'NON_STIPEND' to use the Learning Internship path.
 */
const canTransition = (fromStatus, toStatus, role, internshipType = null) => {
    if (role === 'ADMIN') return true;

    if (internshipType === 'NON_STIPEND') {
        const allowed = NON_STIPEND_TRANSITIONS[fromStatus] || [];
        if (!allowed.includes(toStatus)) return false;
        const roleAllowed = NON_STIPEND_ROLE_PERMISSIONS[role] || [];
        return roleAllowed.includes(toStatus);
    }

    const validNext = ALLOWED_TRANSITIONS[fromStatus] || [];
    if (!validNext.includes(toStatus)) return false;
    const roleAllowed = ROLE_PERMISSIONS[role] || [];
    return roleAllowed.includes(toStatus);
};

module.exports = { STATUS, canTransition, ALLOWED_TRANSITIONS, NON_STIPEND_TRANSITIONS };
