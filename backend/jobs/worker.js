// Background job worker — resume matching removed.
// This module is kept as a no-op so server.js startup remains unchanged.

const workerLoop = async () => {
    console.log('ℹ️  Background worker: resume matching disabled. No jobs to process.');
};

module.exports = { workerLoop };
