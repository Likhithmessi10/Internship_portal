/**
 * Offer Letter Service
 *
 * Delegates offer-letter PDF generation to the `template-filling/` sidecar
 * (Next.js app in this repo). The PRTI uploads a blank offer-letter PDF in
 * the sidecar's admin UI, visually places named field markers on it (e.g.
 * a "Student Name" box, a "Roll Number" box…), and the chosen template's id
 * is recorded in PortalConfiguration.offerLetterTemplateId.
 *
 * When a student downloads their offer letter, this service:
 *   1. Pulls the active template id from PortalConfiguration
 *   2. Builds a FLAT label→value dictionary from the application
 *   3. POSTs `{ templateId, data }` to `${TEMPLATE_FILLING_URL}/api/fill`
 *   4. Streams the returned PDF back to the caller
 *
 * Env:
 *   TEMPLATE_FILLING_URL          base URL of the sidecar (default http://localhost:3100)
 *   OFFER_LETTER_API_TIMEOUT_MS   request timeout in ms (default 30000)
 */

const prisma = require('../lib/prisma');

const FETCH_TIMEOUT = parseInt(process.env.OFFER_LETTER_API_TIMEOUT_MS || '30000', 10);
const TEMPLATE_FILLING_URL = (process.env.TEMPLATE_FILLING_URL || 'http://localhost:3100').replace(/\/+$/, '');

/** Format a date as a readable Indian-style string, or empty string. */
function fmtDate(d) {
    if (!d) return '';
    try {
        return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
    } catch { return ''; }
}

/**
 * Build the flat label→value dictionary the sidecar's /api/fill expects.
 *
 * Every label here must be placed on the offer-letter template in the
 * template-filling admin UI for the corresponding value to be drawn onto
 * the PDF. Unused labels are silently ignored by the sidecar.
 */
function buildOfferLetterFields(application) {
    const a = application;
    const today = new Date();
    const refId = a.id.substring(0, 8).toUpperCase();
    const isMonetary = a.internship?.internshipType !== 'NON_STIPEND';

    return {
        // Student
        'Student Name':       a.student?.fullName || '',
        'Roll Number':        a.student?.rollNumber || '',
        'College':            a.student?.collegeName || '',
        'Branch':             a.student?.branch || '',
        'Year of Study':      a.student?.yearOfStudy != null ? String(a.student.yearOfStudy) : '',
        'CGPA':               a.student?.cgpa != null ? String(a.student.cgpa) : '',
        'Email':              a.student?.user?.email || '',
        'Phone':              a.student?.phone || '',

        // Internship
        'Internship Title':   a.internship?.title || '',
        'Department':         a.departmentGroup?.department || a.internship?.department || '',
        'Field':              a.field?.fieldName || '',
        'Location':           a.preferredLocation || '',
        'Duration':           a.internship?.duration || '',
        'Internship Type':    a.internship?.internshipType || '',
        'Internship Mode':    a.internship?.internshipMode || '',
        'Assigned Role':      a.assignedRole || '',

        // Stipend
        'Stipend':            isMonetary && a.stipendAmount ? `₹${a.stipendAmount}` : (isMonetary ? 'As per category' : 'Unpaid / Learning'),
        'Stipend Amount':     a.stipendAmount != null ? String(a.stipendAmount) : '',

        // Mentor
        'Mentor Name':        a.mentor?.name || '',
        'Mentor Email':       a.mentor?.email || '',

        // Dates
        'Issue Date':         fmtDate(today),
        'Joining Date':       fmtDate(a.joiningDate),
        'End Date':           fmtDate(a.endDate),

        // Reference
        'Reference ID':       refId,
        'Ref No':             `APT/INT/OFFER/${refId}/${today.getFullYear()}`,
        'Year':               String(today.getFullYear())
    };
}

/**
 * Calls the template-filling sidecar's /api/fill and returns the PDF buffer.
 * Throws when the sidecar URL is wrong, the chosen template doesn't exist,
 * or no template has been picked yet.
 */
async function generateOfferLetterPDF(application) {
    const config = await prisma.portalConfiguration.findUnique({ where: { id: 'singleton' } });
    const templateId = config?.offerLetterTemplateId;

    if (!templateId) {
        const err = new Error('No offer-letter template has been configured yet.');
        err.code = 'OFFER_LETTER_TEMPLATE_NOT_SET';
        throw err;
    }

    const data = buildOfferLetterFields(application);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    let res;
    try {
        res = await fetch(`${TEMPLATE_FILLING_URL}/api/fill`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/pdf',
                'x-sidecar-token': process.env.SIDECAR_TOKEN || ''
            },
            body: JSON.stringify({ templateId, data }),
            signal: controller.signal
        });
    } catch (e) {
        clearTimeout(timeoutId);
        const err = new Error(`Could not reach template-filling sidecar at ${TEMPLATE_FILLING_URL}: ${e.message}`);
        err.code = 'OFFER_LETTER_SIDECAR_UNREACHABLE';
        throw err;
    }
    clearTimeout(timeoutId);

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        const err = new Error(`Template-filling sidecar returned ${res.status}: ${body.substring(0, 200)}`);
        err.code = res.status === 404 ? 'OFFER_LETTER_TEMPLATE_NOT_FOUND' : 'OFFER_LETTER_SIDECAR_ERROR';
        throw err;
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/pdf')) {
        const err = new Error(`Sidecar returned unexpected content-type: ${contentType}`);
        err.code = 'OFFER_LETTER_SIDECAR_BAD_CONTENT_TYPE';
        throw err;
    }

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

module.exports = { generateOfferLetterPDF, buildOfferLetterFields, TEMPLATE_FILLING_URL };
