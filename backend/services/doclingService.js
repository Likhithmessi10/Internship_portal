const fs = require('fs/promises');
const path = require('path');

const DOCLING_MATCH_URL = process.env.DOCLING_MATCH_URL || 'http://localhost:8000/match';
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

    const resumePath = path.resolve(resumeFile.path);
    const fileBuffer = await fs.readFile(resumePath);
    const blob = new Blob([fileBuffer], { type: resumeFile.mimetype || 'application/pdf' });

    const formData = new FormData();
    formData.append('resume', blob, resumeFile.originalname || path.basename(resumePath));
    formData.append('jd_text', JSON.stringify(buildJdPayload(internship)));

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DOCLING_TIMEOUT_MS);

    try {
        const response = await fetch(DOCLING_MATCH_URL, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Docling service failed with status ${response.status}: ${errorBody}`);
        }

        const data = await response.json();
        const rawScore = Number(data?.score);
        if (!Number.isFinite(rawScore)) return 0;

        // Guard rails: ensure a valid percentage-like score.
        return Math.max(0, Math.min(100, Number(rawScore.toFixed(2))));
    } finally {
        clearTimeout(timeout);
    }
};

module.exports = {
    getResumeFileFromUploads,
    getResumeMatchScore
};
