const emailService = require('./backend/services/email/emailService');
require('dotenv').config({ path: './backend/.env' });

async function testEmail() {
    console.log('--- Testing Email Service ---');
    const testEmail = 'likhithmessi10@gmail.com'; // Change to a valid test email if needed
    const testName = 'Test Student';

    try {
        console.log(`Sending test email to ${testEmail}...`);
        
        // Test Application Received (Template 1)
        const res1 = await emailService.sendApplicationReceived(testEmail, testName);
        console.log('Template 1 (Received) Result:', res1);

        // Test Status Update (Template 2)
        const res2 = await emailService.sendStatusUpdate(testEmail, testName, 'Forwarded', 'Good luck!');
        console.log('Template 2 (Status) Result:', res2);

        console.log('--- Test Completed Successfully ---');
    } catch (error) {
        console.error('--- Test Failed ---');
        console.error(error.message);
    }
}

testEmail();
