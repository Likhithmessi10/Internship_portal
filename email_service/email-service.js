// Email Service Module
// ====================
// Isolated service for sending emails via HTTP POST request
// Usage: import or include this file and call EmailService.sendEmail()

const EmailService = (function() {
  
  // Configuration - Update these values as needed
  const CONFIG = {
    apiUrl: 'https://aptrservice.aptransco.gov.in/api/noreply', // Replace with your email API endpoint
    headerKey: 'X-API-Key', // Header key for authentication
    headerValue: 'NOVAC_MRZ', // Your API key here
    timeout: 10000 // Request timeout in ms
  };

  /**
   * Configure the email service
   * @param {Object} options - Configuration options
   * @param {string} options.apiUrl - The email API endpoint URL
   * @param {string} options.headerKey - Authentication header key
   * @param {string} options.headerValue - Authentication header value
   * @param {number} options.timeout - Request timeout in milliseconds
   */
  function configure(options) {
    Object.assign(CONFIG, options);
  }

  /**
   * Send an email
   * @param {Object} emailData - Email details
   * @param {string} emailData.to - Recipient email address
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.body - Email body content
   * @returns {Promise<Object>} - Response from the email service
   */
  async function sendEmail({ to, subject, body }) {
    // Validate inputs
    if (!to || !subject || !body) {
      throw new Error('Missing required fields: to, subject, and body are required');
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('body', body);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.timeout);

      const response = await fetch(CONFIG.apiUrl, {
        method: 'POST',
        headers: {
          [CONFIG.headerKey]: CONFIG.headerValue
          // Note: Don't set Content-Type header manually for FormData
          // Browser will set it automatically with boundary
        },
        body: formData,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error: ${response.status}`);
      }

      const result = await response.json();
      return {
        success: true,
        data: result,
        status: response.status
      };

    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - email service did not respond');
      }
      throw error;
    }
  }

  /**
   * Send bulk emails
   * @param {Array<Object>} emails - Array of email data objects
   * @returns {Promise<Array<Object>>} - Array of results for each email
   */
  async function sendBulkEmails(emails) {
    const results = [];
    
    for (const email of emails) {
      try {
        const result = await sendEmail(email);
        results.push({ success: true, email, result });
      } catch (error) {
        results.push({ success: false, email, error: error.message });
      }
    }
    
    return results;
  }

  // Public API
  return {
    configure,
    sendEmail,
    sendBulkEmails,
    getConfig: () => ({ ...CONFIG })
  };

})();

// Export for Node.js/CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EmailService;
}

// Usage Examples:
// ===============
// 
// 1. Basic usage:
//    EmailService.configure({
//      apiUrl: 'https://your-api.com/send-email',
//      headerKey: 'Authorization',
//      headerValue: 'Bearer your-token-here'
//    });
//
//    await EmailService.sendEmail({
//      to: 'user@example.com',
//      subject: 'Test Email',
//      body: 'This is the email body'
//    });
//
// 2. Bulk emails:
//    const results = await EmailService.sendBulkEmails([
//      { to: 'user1@example.com', subject: 'Test 1', body: 'Body 1' },
//      { to: 'user2@example.com', subject: 'Test 2', body: 'Body 2' }
//    ]);
//
// 3. Error handling:
//    try {
//      await EmailService.sendEmail({ to, subject, body });
//    } catch (error) {
//      console.error('Email failed:', error.message);
//    }
