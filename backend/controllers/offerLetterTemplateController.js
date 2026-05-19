/**
 * Offer Letter Template controller — talks to the template-filling sidecar
 * to let PRTI choose which uploaded template is the active offer letter,
 * and stores that choice in PortalConfiguration.offerLetterTemplateId.
 */
const prisma = require('../lib/prisma');

// Internal URL the backend uses to call the sidecar server-to-server.
// In docker this is the service hostname; in local dev it's localhost.
const TEMPLATE_FILLING_URL = (process.env.TEMPLATE_FILLING_URL || 'http://localhost:3100').replace(/\/+$/, '');
// Public URL the BROWSER uses to open the sidecar's admin designer.
// Falls back to TEMPLATE_FILLING_URL when not set (single-host local dev).
const TEMPLATE_FILLING_PUBLIC_URL = (process.env.TEMPLATE_FILLING_PUBLIC_URL || TEMPLATE_FILLING_URL).replace(/\/+$/, '');

/**
 * GET /api/v1/prti/config/offer-letter
 * Returns the currently active offer-letter template config + the chosen
 * template's metadata (if reachable), plus the sidecar URL for admin links.
 */
const getOfferLetterConfig = async (req, res) => {
    try {
        const config = await prisma.portalConfiguration.upsert({
            where: { id: 'singleton' },
            update: {},
            create: { id: 'singleton' }
        });

        let templateMeta = null;
        if (config.offerLetterTemplateId) {
            try {
                const r = await fetch(`${TEMPLATE_FILLING_URL}/api/templates/${config.offerLetterTemplateId}`, {
                    headers: { 'x-sidecar-token': process.env.SIDECAR_TOKEN || '' }
                });
                if (r.ok) templateMeta = await r.json();
            } catch {
                // sidecar unreachable; leave templateMeta null
            }
        }

        res.json({
            success: true,
            data: {
                offerLetterTemplateId: config.offerLetterTemplateId,
                template: templateMeta,
                templateFillingUrl: TEMPLATE_FILLING_PUBLIC_URL
            }
        });
    } catch (err) {
        console.error('getOfferLetterConfig error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * PUT /api/v1/prti/config/offer-letter
 * Body: { offerLetterTemplateId: string | null }
 * Sets (or clears) the active offer-letter template.
 */
const setOfferLetterConfig = async (req, res) => {
    try {
        const { offerLetterTemplateId } = req.body;
        if (offerLetterTemplateId !== null && typeof offerLetterTemplateId !== 'string') {
            return res.status(400).json({ success: false, message: 'offerLetterTemplateId must be a string or null' });
        }

        // Validate the template exists in the sidecar (when setting, not clearing)
        if (offerLetterTemplateId) {
            try {
                const r = await fetch(`${TEMPLATE_FILLING_URL}/api/templates/${offerLetterTemplateId}`, {
                    headers: { 'x-sidecar-token': process.env.SIDECAR_TOKEN || '' }
                });
                if (r.status === 404) {
                    return res.status(400).json({ success: false, message: 'Template ID not found in template-filling service' });
                }
                if (!r.ok) {
                    return res.status(502).json({ success: false, message: `Template-filling service returned ${r.status}` });
                }
            } catch (e) {
                return res.status(502).json({ success: false, message: `Cannot reach template-filling service at ${TEMPLATE_FILLING_URL}` });
            }
        }

        const updated = await prisma.portalConfiguration.upsert({
            where: { id: 'singleton' },
            update: { offerLetterTemplateId: offerLetterTemplateId || null },
            create: { id: 'singleton', offerLetterTemplateId: offerLetterTemplateId || null }
        });

        res.json({ success: true, data: { offerLetterTemplateId: updated.offerLetterTemplateId } });
    } catch (err) {
        console.error('setOfferLetterConfig error:', err.message);
        res.status(500).json({ success: false, message: err.message });
    }
};

/**
 * GET /api/v1/prti/config/offer-letter/templates
 * Proxies to the sidecar's GET /api/templates so the PRTI UI can list
 * everything available for selection in one round-trip.
 */
const listOfferLetterTemplates = async (req, res) => {
    try {
        const r = await fetch(`${TEMPLATE_FILLING_URL}/api/templates`, {
            headers: { 'x-sidecar-token': process.env.SIDECAR_TOKEN || '' }
        });
        if (!r.ok) {
            return res.status(502).json({ success: false, message: `Template-filling service returned ${r.status}` });
        }
        const templates = await r.json();
        res.json({ success: true, data: templates, templateFillingUrl: TEMPLATE_FILLING_PUBLIC_URL });
    } catch (e) {
        res.status(502).json({ success: false, message: `Cannot reach template-filling service at ${TEMPLATE_FILLING_URL}` });
    }
};

module.exports = {
    getOfferLetterConfig,
    setOfferLetterConfig,
    listOfferLetterTemplates
};
