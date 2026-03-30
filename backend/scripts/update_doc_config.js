const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateDocConfig() {
    try {
        console.log('Updating document configuration...');
        
        const newDocs = [
            { id: 'RESUME', label: 'Resume / CV', type: 'PDF', mandatory: true },
            { 
                id: 'NOC_LETTER', 
                label: 'No Objection Certificate', 
                type: 'PDF', 
                mandatory: true,
                templates: [
                    { label: 'Download PDF', url: '/uploads/templates/No Objection Certificate for APTRANSCO Internship Programme.pdf' },
                    { label: 'Download DOCX', url: '/uploads/templates/No Objection Certificate for APTRANSCO Internship Programme.docx' }
                ]
            },
            { 
                id: 'UNDERTAKING_FORM', 
                label: 'Undertaking Form', 
                type: 'PDF', 
                mandatory: true,
                templates: [
                    { label: 'Download PDF', url: '/uploads/templates/Undertaking Form for APTRANSCO Internship Programme.pdf' },
                    { label: 'Download DOCX', url: '/uploads/templates/Undertaking Form for APTRANSCO Internship Programme.docx' }
                ]
            },
            { id: 'MARKSHEET', label: 'Mark Sheet', type: 'PDF', mandatory: true },
            { id: 'PASSPORT_PHOTO', label: 'Passport Photo', type: 'IMAGE', mandatory: true }
        ];

        const config = await prisma.documentConfiguration.upsert({
            where: { id: 'singleton' },
            update: { documents: newDocs },
            create: {
                id: 'singleton',
                documents: newDocs
            }
        });

        console.log('Successfully updated document configuration:', JSON.stringify(config, null, 2));
    } catch (error) {
        console.error('Error updating document configuration:', error);
    } finally {
        await prisma.$disconnect();
    }
}

updateDocConfig();
