/**
 * Lightweight ClamAV Malware Scanner
 * Uses lazy loading to minimize resource usage
 * Only initializes ClamAV when enabled in environment variables
 */

let clamscan = null;
let isInitialized = false;
let isEnabled = false;

/**
 * Initialize ClamAV scanner (lazy loading)
 * Only called when scanning is actually needed
 */
const initClamAV = async () => {
    if (isInitialized && clamscan) {
        return clamscan;
    }

    // Only enable if explicitly set
    if (process.env.CLAMAV_ENABLED !== 'true') {
        isEnabled = false;
        return null;
    }

    try {
        // Dynamic import for lazy loading
        const NodeClam = require('clamscan');
        
        clamscan = await NodeClam.init({
            remove_infected: false, // Don't delete infected files - just detect
            quarantine_infected: false, // Don't quarantine
            scan_log: null, // No log file
            debug_mode: process.env.NODE_ENV === 'development',
            files: null,
            scan_recursively: false,
            clamscan: {
                path: '/usr/bin/clamscan', // Default path
                scan_archives: false, // Don't scan archives (saves resources)
                db: null,
                active: false // Prefer clamdscan
            },
            clamdscan: {
                socket: process.env.CLAMAV_SOCKET_PATH || null,
                host: process.env.CLAMAV_HOST || 'localhost',
                port: parseInt(process.env.CLAMAV_PORT) || 3310,
                timeout: 60000, // 60 seconds
                local_fallback: false, // Don't fallback to clamscan
                path: '/usr/bin/clamdscan',
                config_file: null,
                multiscan: false, // Faster: scan all files at once
                reload_db: false,
                active: true
            },
            preference: 'clamdscan' // Prefer clamdscan (daemon) for speed
        });

        isInitialized = true;
        isEnabled = true;
        console.log('[ClamAV] Scanner initialized');
        return clamscan;
    } catch (error) {
        console.error('[ClamAV] Initialization error:', error.message);
        console.warn('[ClamAV] Falling back to no scanning - uploads will proceed without malware check');
        isInitialized = true;
        isEnabled = false;
        return null;
    }
};

/**
 * Scan a file for malware
 * @param {string} filePath - Path to the file to scan
 * @returns {Promise<{isClean: boolean, threat: string|null}>}
 */
const scanFile = async (filePath) => {
    // Skip if ClamAV is not enabled
    if (process.env.CLAMAV_ENABLED !== 'true') {
        return { isClean: true, threat: null, skipped: true, reason: 'ClamAV disabled' };
    }

    try {
        const scanner = await initClamAV();
        
        // If initialization failed or not enabled, skip scanning
        if (!scanner || !isEnabled) {
            return { isClean: true, threat: null, skipped: true, reason: 'Scanner unavailable' };
        }

        const { isInfected, viruses } = await scanner.scanFile(filePath);

        if (isInfected) {
            console.warn(`[ClamAV] THREAT DETECTED in ${filePath}: ${viruses.join(', ')}`);
            return {
                isClean: false,
                threat: viruses.join(', '),
                scanned: true
            };
        }

        return { isClean: true, threat: null, scanned: true };
    } catch (error) {
        console.error('[ClamAV] Scan error:', error.message);
        // On error, allow file but log warning
        return { 
            isClean: true, 
            threat: null, 
            scanned: false, 
            error: error.message 
        };
    }
};

/**
 * Scan a file stream for malware
 * @param {ReadStream} stream - Readable stream to scan
 * @returns {Promise<{isClean: boolean, threat: string|null}>}
 */
const scanStream = async (stream) => {
    if (process.env.CLAMAV_ENABLED !== 'true') {
        return { isClean: true, threat: null, skipped: true };
    }

    try {
        const scanner = await initClamAV();
        
        if (!scanner || !isEnabled) {
            return { isClean: true, threat: null, skipped: true };
        }

        const { isInfected, viruses } = await scanner.scanStream(stream);

        if (isInfected) {
            console.warn(`[ClamAV] THREAT DETECTED in stream: ${viruses.join(', ')}`);
            return {
                isClean: false,
                threat: viruses.join(', '),
                scanned: true
            };
        }

        return { isClean: true, threat: null, scanned: true };
    } catch (error) {
        console.error('[ClamAV] Stream scan error:', error.message);
        return { 
            isClean: true, 
            threat: null, 
            scanned: false, 
            error: error.message 
        };
    }
};

/**
 * Middleware to scan uploaded files for malware
 * Should be used AFTER multer middleware
 */
const malwareScanMiddleware = async (req, res, next) => {
    // Skip if no files uploaded
    if (!req.files || req.files.length === 0) {
        return next();
    }

    // Skip if ClamAV is disabled
    if (process.env.CLAMAV_ENABLED !== 'true') {
        req.scanResults = [{ skipped: true, reason: 'ClamAV disabled' }];
        return next();
    }

    const scanResults = [];

    for (const file of req.files) {
        const result = await scanFile(file.path);
        scanResults.push({
            filename: file.originalname,
            path: file.path,
            ...result
        });

        // If file is infected, delete it and return error
        if (result.isClean === false) {
            const fs = require('fs').promises;
            
            // Delete infected file
            try {
                await fs.unlink(file.path);
                console.log(`[ClamAV] Deleted infected file: ${file.path}`);
            } catch (unlinkError) {
                console.error('[ClamAV] Failed to delete infected file:', unlinkError.message);
            }

            return res.status(400).json({
                success: false,
                message: 'Security Alert: Uploaded file failed malware scan',
                threat: result.threat
            });
        }
    }

    // Attach scan results to request for logging
    req.scanResults = scanResults;
    next();
};

module.exports = {
    scanFile,
    scanStream,
    malwareScanMiddleware,
    initClamAV
};
