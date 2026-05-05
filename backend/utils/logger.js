/**
 * Structured Logger Wrapper
 */
const logger = {
    info: (message, meta = {}) => {
        log('INFO', message, meta);
    },
    warn: (message, meta = {}) => {
        log('WARN', message, meta);
    },
    error: (message, meta = {}) => {
        log('ERROR', message, meta);
    },
    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV === 'development') {
            log('DEBUG', message, meta);
        }
    }
};

function log(level, message, meta) {
    const isProduction = process.env.NODE_ENV === 'production';
    const timestamp = new Date().toISOString();

    if (isProduction) {
        // Output JSON for production log aggregators
        console.log(JSON.stringify({
            timestamp,
            level,
            message,
            ...meta
        }));
    } else {
        // Human readable for development
        const metaStr = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
        console.log(`[${timestamp}] ${level}: ${message}${metaStr}`);
    }
}

module.exports = logger;
