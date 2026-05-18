const puppeteer = require('puppeteer');

/**
 * Generates a PDF buffer from HTML content using Puppeteer
 * @param {string} htmlContent - The HTML markup to render
 * @returns {Promise<Buffer>} - The generated PDF as a buffer
 */
async function generatePDF(htmlContent) {
    const browser = await puppeteer.launch({
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });
    try {
        const page = await browser.newPage();
        // Set HTML content and wait for it to load
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        // Generate PDF buffer
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: {
                top: '15mm',
                bottom: '15mm',
                left: '15mm',
                right: '15mm'
            }
        });
        return pdfBuffer;
    } finally {
        await browser.close();
    }
}

module.exports = { generatePDF };
