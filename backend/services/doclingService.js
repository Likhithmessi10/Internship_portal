// Docling resume-matching service removed. Resume upload is still supported.

const getResumeFileFromUploads = (files = []) => {
    return files.find(f => f.fieldname === 'RESUME')
        || files.find(f => f.fieldname?.toLowerCase().includes('resume'))
        || null;
};

module.exports = { getResumeFileFromUploads };
