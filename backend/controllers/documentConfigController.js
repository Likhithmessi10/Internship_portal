const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get global document configuration
 * GET /api/v1/prti/config/documents
 */
const getDocumentConfig = async (req, res) => {
    try {
        let config = await prisma.documentConfiguration.findUnique({
            where: { id: 'singleton' }
        });

        // If no config exists, create default
        if (!config) {
            config = await prisma.documentConfiguration.create({
                data: {
                    documents: [
                        { id: 'RESUME', label: 'Resume / CV', type: 'PDF', mandatory: true },
                        { id: 'NOC_LETTER', label: 'NOC Letter', type: 'PDF', mandatory: true },
                        { id: 'HOD_LETTER', label: 'HOD Letter', type: 'PDF', mandatory: true },
                        { id: 'MARKSHEET', label: 'Mark Sheet', type: 'PDF', mandatory: true },
                        { id: 'PASSPORT_PHOTO', label: 'Passport Photo', type: 'IMAGE', mandatory: true }
                    ]
                }
            });
        }

        res.status(200).json({ success: true, data: config });
    } catch (error) {
        console.error('Get document config error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Update global document configuration
 * PUT /api/v1/prti/config/documents
 */
const updateDocumentConfig = async (req, res) => {
    try {
        const { documents } = req.body;

        if (!Array.isArray(documents)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Documents must be an array' 
            });
        }

        // Validate each document
        const validatedDocs = documents.map(doc => ({
            id: doc.id?.toUpperCase().replace(/\s+/g, '_') || doc.label?.toUpperCase().replace(/\s+/g, '_'),
            label: doc.label,
            type: doc.type || 'PDF', // PDF or IMAGE
            mandatory: doc.mandatory !== undefined ? doc.mandatory : true
        }));

        const config = await prisma.documentConfiguration.upsert({
            where: { id: 'singleton' },
            update: { documents: validatedDocs },
            create: {
                id: 'singleton',
                documents: validatedDocs
            }
        });

        res.status(200).json({ 
            success: true, 
            message: 'Document configuration updated successfully',
            data: config 
        });
    } catch (error) {
        console.error('Update document config error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Get documents for specific internship (overrides global config)
 * GET /api/v1/prti/config/documents/:internshipId
 */
const getInternshipDocuments = async (req, res) => {
    try {
        const { internshipId } = req.params;

        const internship = await prisma.internship.findUnique({
            where: { id: internshipId },
            select: { requiredDocuments: true }
        });

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        // If internship has custom documents, return them
        // Otherwise return global config
        if (internship.requiredDocuments && internship.requiredDocuments.length > 0) {
            res.status(200).json({ 
                success: true, 
                data: { 
                    documents: internship.requiredDocuments,
                    source: 'internship'
                } 
            });
        } else {
            const globalConfig = await prisma.documentConfiguration.findUnique({
                where: { id: 'singleton' }
            });
            res.status(200).json({ 
                success: true, 
                data: { 
                    documents: globalConfig?.documents || [],
                    source: 'global'
                } 
            });
        }
    } catch (error) {
        console.error('Get internship documents error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

/**
 * Set custom documents for specific internship
 * PUT /api/v1/prti/config/documents/:internshipId
 */
const setInternshipDocuments = async (req, res) => {
    try {
        const { internshipId } = req.params;
        const { documents, useGlobal } = req.body;

        const internship = await prisma.internship.findUnique({
            where: { id: internshipId }
        });

        if (!internship) {
            return res.status(404).json({ success: false, message: 'Internship not found' });
        }

        let updatedInternship;

        if (useGlobal) {
            // Use global configuration
            updatedInternship = await prisma.internship.update({
                where: { id: internshipId },
                data: { requiredDocuments: null }
            });
        } else {
            // Set custom documents
            const validatedDocs = (documents || []).map(doc => ({
                id: doc.id?.toUpperCase().replace(/\s+/g, '_') || doc.label?.toUpperCase().replace(/\s+/g, '_'),
                label: doc.label,
                type: doc.type || 'PDF',
                mandatory: doc.mandatory !== undefined ? doc.mandatory : true
            }));

            updatedInternship = await prisma.internship.update({
                where: { id: internshipId },
                data: { requiredDocuments: validatedDocs }
            });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Internship documents updated successfully',
            data: updatedInternship 
        });
    } catch (error) {
        console.error('Set internship documents error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

module.exports = {
    getDocumentConfig,
    updateDocumentConfig,
    getInternshipDocuments,
    setInternshipDocuments
};
