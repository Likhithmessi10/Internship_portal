const pdf = require('pdf-parse');
const fs = require('fs');
const path = require('path');
const prisma = require('../lib/prisma');

/**
 * Normalizes text for better matching
 */
const normalize = (text) => {
    return (text || '').toLowerCase().replace(/[^a-z0-9+#]/g, ' ').trim();
};

/**
 * Extracts text from a resume (Optimized for robustness and fallbacks)
 */
async function parseResume(filePath) {
    try {
        if (!fs.existsSync(filePath)) return "";
        
        const extension = path.extname(filePath).toLowerCase();
        const dataBuffer = await fs.promises.readFile(filePath);
        if (!dataBuffer || dataBuffer.length === 0) return "";

        // FALLBACK 1: Handle Plain Text files directly
        if (extension === '.txt') {
            return normalize(dataBuffer.toString());
        }

        // DEFAULT: PDF Parsing
        try {
            const data = await pdf(dataBuffer);
            return normalize(data.text);
        } catch (pdfError) {
            console.warn(`[ParseResume] PDF Parse failed for ${filePath}, attempting raw string fallback`);
            // FALLBACK 2: Basic string extraction from binary (very rough)
            return normalize(dataBuffer.toString('utf8').replace(/[^\x20-\x7E\n\r\t]/g, ' '));
        }
    } catch (error) {
        console.error(`[ParseResume] Critical Error: ${error.message}`);
        return ""; 
    }
}

module.exports = {
    parseResume,
    normalize
};

