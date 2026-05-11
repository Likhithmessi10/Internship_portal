const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');

const DOCLING_MATCH_URL = process.env.DOCLING_MATCH_URL || 'http://127.0.0.1:8000/match';
const DOCLING_TIMEOUT_MS = parseInt(process.env.DOCLING_TIMEOUT_MS || '20000', 10);

const buildJdPayload = (internship) => {
    return {
        title: internship?.title || '',
        description: internship?.description || '',
        requirements: internship?.requirements || '',
        expectations: internship?.expectations || ''
    };
};

const getResumeFileFromUploads = (files = []) => {
    return files.find((file) => file.fieldname === 'RESUME')
        || files.find((file) => file.fieldname?.toLowerCase().includes('resume'))
        || null;
};

const getResumeMatchScore = async ({ internship, resumeFile }) => {
    if (!resumeFile?.path) {
        throw new Error('Resume file not found in uploaded documents.');
    }

    try {
        const resumePath = path.resolve(resumeFile.path);
        const fileBuffer = await fs.readFile(resumePath);
        
        const formData = new FormData();
        // Node's FormData needs a Blob or Buffer. For axios, we can use a Blob-like object or just use form-data package, 
        // but since we are in Node 18+, native FormData + axios works with Blobs.
        const blob = new Blob([fileBuffer], { type: resumeFile.mimetype || 'application/pdf' });
        
        formData.append('resume', blob, resumeFile.originalname || path.basename(resumePath));
        formData.append('jd_text', JSON.stringify(buildJdPayload(internship)));

        const response = await axios.post(DOCLING_MATCH_URL, formData, {
            timeout: DOCLING_TIMEOUT_MS,
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        const data = response.data;
        const rawScore = Number(data?.score);
        if (!Number.isFinite(rawScore)) return 0;

        // Guard rails: ensure a valid percentage-like score.
        return Math.max(0, Math.min(100, Number(rawScore.toFixed(2))));
    } catch (error) {
        if (error.response) {
            throw new Error(`Docling service failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`);
        }
        throw new Error(`Docling service communication error: ${error.message}`);
    }
};

module.exports = {
    getResumeFileFromUploads,
    getResumeMatchScore
};
