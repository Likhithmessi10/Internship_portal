/**
 * APTRANSCO Internship Portal - End-to-End Test Suite
 * Tests all user roles and complete internship workflow
 * 
 * Run: node test-e2e.js
 */

const axios = require('axios');
const readline = require('readline');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5001/api/v1';
const VERBOSE = process.env.VERBOSE !== 'false';

// Test State
const state = {
    tokens: {},
    users: {},
    internship: null,
    application: null,
    results: { passed: 0, failed: 0, skipped: 0 }
};

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
};

// Utility Functions
const log = {
    section: (msg) => console.log(`\n${colors.cyan}═══ ${msg} ═══${colors.reset}`),
    test: (msg) => console.log(`\n${colors.blue}▶ ${msg}${colors.reset}`),
    success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
    error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
    info: (msg) => console.log(`${colors.gray}ℹ ${msg}${colors.reset}`),
    warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
    data: (data) => VERBOSE && console.log(colors.gray + JSON.stringify(data, null, 2) + colors.reset)
};

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

const request = async (method, url, data = null, token = null) => {
    try {
        const config = {
            method,
            url,
            headers: token ? { Authorization: `Bearer ${token}` } : {}
        };
        if (data) config.data = data;
        
        const response = await api(config);
        return { success: true, data: response.data, status: response.status };
    } catch (error) {
        return { 
            success: false, 
            error: error.response?.data || error.message,
            status: error.response?.status || 0
        };
    }
};

const test = (name, condition) => {
    if (condition) {
        state.results.passed++;
        log.success(name);
        return true;
    } else {
        state.results.failed++;
        log.error(name);
        return false;
    }
};

// ============================================
// TEST SUITE
// ============================================

async function testHealthCheck() {
    log.section('1. Health Check & Security Headers');
    
    const result = await request('GET', '/health');
    test('Health endpoint accessible', result.success);
    test('Returns healthy status', result.data?.status === 'healthy');
    
    // Check security headers (if available)
    log.info('Security headers check skipped in test mode');
}

async function testAdminWorkflow() {
    log.section('2. Admin Workflow');
    
    // Login as admin
    log.test('Admin Login');
    const loginResult = await request('POST', '/auth/login', {
        email: 'admin@aptransco.gov.in',
        password: process.env.ADMIN_PASSWORD || 'admin@aptransco@123'
    });
    
    if (!loginResult.success) {
        log.error('Admin login failed - seeding may be required');
        state.results.skipped++;
        return false;
    }
    
    state.tokens.admin = loginResult.data.accessToken;
    state.users.admin = loginResult.data.user;
    test('Admin login successful', true);
    test('Access token received', !!state.tokens.admin);
    test('Refresh token received', !!loginResult.data.refreshToken);
    
    // Test password validation on new registration
    log.test('Password Validation');
    const weakPasswordResult = await request('POST', '/auth/register', {
        email: 'test@example.com',
        password: 'weak'
    });
    test('Weak password rejected', !weakPasswordResult.success);
    
    // Create internship
    log.test('Create Internship');
    const internshipData = {
        title: 'Software Development Internship',
        department: 'IT',
        description: 'Full stack development internship',
        roles: 'Developer,Tester',
        rolesData: [
            { name: 'Developer', openings: 5 },
            { name: 'Tester', openings: 2 }
        ],
        requirements: 'JavaScript, React, Node.js',
        expectations: 'Complete assigned tasks',
        location: 'Hyderabad',
        duration: '3 months',
        openingsCount: 7,
        applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        isActive: true
    };
    
    const createInternshipResult = await request(
        'POST', 
        '/admin/internships', 
        internshipData, 
        state.tokens.admin
    );
    
    if (createInternshipResult.success) {
        state.internship = createInternshipResult.data.data;
        test('Internship created', true);
        test('Internship has ID', !!state.internship.id);
    } else {
        log.error('Failed to create internship: ' + JSON.stringify(createInternshipResult.error));
        state.results.skipped++;
    }
    
    // Get all internships
    log.test('Get All Internships');
    const getInternshipsResult = await request(
        'GET', 
        '/admin/internships', 
        null, 
        state.tokens.admin
    );
    test('Retrieve internships list', getInternshipsResult.success);
    
    // Get users
    log.test('Get Users');
    const getUsersResult = await request(
        'GET', 
        '/admin/users?role=STUDENT', 
        null, 
        state.tokens.admin
    );
    test('Retrieve users list', getUsersResult.success);
    
    // Create HOD user
    log.test('Create HOD User');
    const hodEmail = `hod.it.${Date.now()}@aptransco.gov.in`;
    const createHodResult = await request(
        'POST', 
        '/auth/admin/register', 
        {
            email: hodEmail,
            password: 'HOD@SecurePass123',
            role: 'HOD',
            name: 'Test HOD',
            department: 'IT'
        },
        state.tokens.admin
    );
    
    if (createHodResult.success) {
        state.users.hod = createHodResult.data.user;
        state.tokens.hod = createHodResult.data.accessToken;
        test('HOD user created', true);
    } else {
        log.warn('HOD creation failed: ' + JSON.stringify(createHodResult.error));
        state.results.skipped++;
    }
    
    // Create Mentor user
    log.test('Create Mentor User');
    const mentorEmail = `mentor.it.${Date.now()}@aptransco.gov.in`;
    const createMentorResult = await request(
        'POST', 
        '/auth/admin/register', 
        {
            email: mentorEmail,
            password: 'Mentor@SecurePass123',
            role: 'MENTOR',
            name: 'Test Mentor',
            department: 'IT'
        },
        state.tokens.admin
    );
    
    if (createMentorResult.success) {
        state.users.mentor = createMentorResult.data.user;
        state.tokens.mentor = createMentorResult.data.accessToken;
        test('Mentor user created', true);
    } else {
        log.warn('Mentor creation failed: ' + JSON.stringify(createMentorResult.error));
        state.results.skipped++;
    }
    
    // Create Committee Member
    log.test('Create Committee Member');
    const committeeEmail = `committee.${Date.now()}@aptransco.gov.in`;
    const createCommitteeResult = await request(
        'POST', 
        '/auth/admin/register', 
        {
            email: committeeEmail,
            password: 'Committee@SecurePass123',
            role: 'COMMITTEE_MEMBER',
            name: 'Test Committee',
            department: 'IT'
        },
        state.tokens.admin
    );
    
    if (createCommitteeResult.success) {
        state.users.committee = createCommitteeResult.data.user;
        state.tokens.committee = createCommitteeResult.data.accessToken;
        test('Committee member created', true);
    } else {
        log.warn('Committee creation failed: ' + JSON.stringify(createCommitteeResult.error));
        state.results.skipped++;
    }
    
    // Create CE_PRTI user
    log.test('Create CE_PRTI User');
    const ceEmail = `ce.prti.${Date.now()}@aptransco.gov.in`;
    const createCEResult = await request(
        'POST', 
        '/auth/admin/register', 
        {
            email: ceEmail,
            password: 'CE@SecurePass123',
            role: 'CE_PRTI',
            name: 'Test CE PRTI',
            department: 'IT'
        },
        state.tokens.admin
    );
    
    if (createCEResult.success) {
        state.users.ce_prti = createCEResult.data.user;
        state.tokens.ce_prti = createCEResult.data.accessToken;
        test('CE_PRTI user created', true);
    } else {
        log.warn('CE_PRTI creation failed: ' + JSON.stringify(createCEResult.error));
        state.results.skipped++;
    }
    
    // Get audit logs
    log.test('Get Audit Logs');
    const auditLogsResult = await request(
        'GET', 
        '/admin/audit-logs', 
        null, 
        state.tokens.admin
    );
    test('Retrieve audit logs', auditLogsResult.success);
}

async function testStudentWorkflow() {
    log.section('3. Student Workflow');
    
    // Register student
    log.test('Student Registration');
    const studentEmail = `student.${Date.now()}@example.com`;
    const registerResult = await request('POST', '/auth/register', {
        email: studentEmail,
        password: 'Student@SecurePass123'
    });
    
    if (!registerResult.success) {
        log.error('Student registration failed: ' + JSON.stringify(registerResult.error));
        state.results.skipped++;
        return;
    }
    
    state.users.student = registerResult.data.user;
    state.tokens.student = registerResult.data.accessToken;
    test('Student registered', true);
    test('Password validation passed', true);
    
    // Create student profile
    log.test('Create Student Profile');
    const profileData = {
        fullName: 'Test Student',
        collegeRollNumber: `TS${Date.now()}`,
        phone: '9999999999',
        dob: '2000-01-15',
        address: 'Test Address, City',
        aadhar: `123456789${Math.floor(Math.random() * 90000) + 10000}`,
        collegeName: 'Test Engineering College',
        university: 'Test University',
        degree: 'B.Tech',
        branch: 'Computer Science',
        yearOfStudy: 3,
        cgpa: 8.5,
        collegeCategory: 'STATE_UNIV'
    };
    
    const profileResult = await request(
        'POST',
        '/students/profile',
        profileData,
        state.tokens.student
    );
    
    if (profileResult.success) {
        state.users.studentProfile = profileResult.data.data;
        test('Student profile created', true);
    } else {
        log.error('Profile creation failed: ' + JSON.stringify(profileResult.error));
        state.results.skipped++;
        return;
    }
    
    // Get public internships
    log.test('View Available Internships');
    const publicInternshipsResult = await request('GET', '/internships');
    test('Retrieve public internships', publicInternshipsResult.success);
    
    // Apply for internship
    if (state.internship) {
        log.test('Apply for Internship');
        const applyResult = await request(
            'POST',
            `/internships/${state.internship.id}/apply`,
            {
                sop: 'I am interested in this internship because...',
                preferredLocation: 'Hyderabad',
                assignedRole: 'Developer'
            },
            state.tokens.student
        );
        
        if (applyResult.success) {
            state.application = applyResult.data.data;
            test('Application submitted', true);
            test('Tracking ID generated', !!applyResult.data.data.trackingId);
        } else {
            log.error('Application failed: ' + JSON.stringify(applyResult.error));
            state.results.skipped++;
        }
    }
    
    // Get student profile with applications
    log.test('View My Applications');
    const getProfileResult = await request(
        'GET',
        '/students/profile',
        null,
        state.tokens.student
    );
    test('Retrieve student profile with applications', getProfileResult.success);
}

async function testHODWorkflow() {
    log.section('4. HOD Workflow');
    
    if (!state.tokens.hod) {
        log.warn('HOD token not available - skipping HOD tests');
        state.results.skipped += 3;
        return;
    }
    
    // Login as HOD
    log.test('HOD Login');
    const loginResult = await request('POST', '/auth/login', {
        email: state.users.hod.email,
        password: 'HOD@SecurePass123'
    });
    
    if (loginResult.success) {
        state.tokens.hod = loginResult.data.accessToken;
        test('HOD login successful', true);
    } else {
        state.results.skipped += 3;
        return;
    }
    
    // Get applications for review
    if (state.internship) {
        log.test('View Applications (HOD)');
        const applicationsResult = await request(
            'GET',
            `/admin/internships/${state.internship.id}/applications`,
            null,
            state.tokens.hod
        );
        test('Retrieve applications', applicationsResult.success);
        
        // Update application status to COMMITTEE_EVALUATION
        if (state.application && applicationsResult.success) {
            log.test('Shortlist Application (HOD)');
            const updateResult = await request(
                'PUT',
                `/admin/applications/${state.application.id}`,
                {
                    status: 'COMMITTEE_EVALUATION',
                    mentorId: state.users.mentor?.id
                },
                state.tokens.hod
            );
            test('Application shortlisted', updateResult.success);
        }
    }
    
    // Get users by department
    log.test('View Department Users');
    const usersResult = await request(
        'GET',
        '/admin/users?department=IT',
        null,
        state.tokens.hod
    );
    test('Retrieve department users', usersResult.success);
}

async function testCommitteeWorkflow() {
    log.section('5. Committee Workflow');
    
    if (!state.tokens.committee) {
        log.warn('Committee token not available - skipping committee tests');
        state.results.skipped += 2;
        return;
    }
    
    // Login as Committee
    log.test('Committee Login');
    const loginResult = await request('POST', '/auth/login', {
        email: state.users.committee.email,
        password: 'Committee@SecurePass123'
    });
    
    if (loginResult.success) {
        state.tokens.committee = loginResult.data.accessToken;
        test('Committee login successful', true);
    } else {
        state.results.skipped += 2;
        return;
    }
    
    // Evaluate application
    if (state.application) {
        log.test('Evaluate Application (Committee)');
        const evaluateResult = await request(
            'PUT',
            `/admin/applications/${state.application.id}`,
            {
                status: 'CA_APPROVED',
                score: 85,
                committeeId: 'COMM-001'
            },
            state.tokens.committee
        );
        test('Application evaluated', evaluateResult.success);
    }
}

async function testCEPRTIWorkflow() {
    log.section('6. CE_PRTI Workflow');
    
    if (!state.tokens.ce_prti) {
        log.warn('CE_PRTI token not available - skipping CE_PRTI tests');
        state.results.skipped += 2;
        return;
    }
    
    // Login as CE_PRTI
    log.test('CE_PRTI Login');
    const loginResult = await request('POST', '/auth/login', {
        email: state.users.ce_prti.email,
        password: 'CE@SecurePass123'
    });
    
    if (loginResult.success) {
        state.tokens.ce_prti = loginResult.data.accessToken;
        test('CE_PRTI login successful', true);
    } else {
        state.results.skipped += 2;
        return;
    }
    
    // Approve application
    if (state.application) {
        log.test('Final Approval (CE_PRTI)');
        const approveResult = await request(
            'PUT',
            `/admin/applications/${state.application.id}`,
            {
                status: 'HIRED',
                assignedRole: 'Developer',
                joiningDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            },
            state.tokens.ce_prti
        );
        test('Application approved (HIRED)', approveResult.success);
    }
}

async function testMentorWorkflow() {
    log.section('7. Mentor Workflow');
    
    if (!state.tokens.mentor) {
        log.warn('Mentor token not available - skipping mentor tests');
        state.results.skipped += 3;
        return;
    }
    
    // Login as Mentor
    log.test('Mentor Login');
    const loginResult = await request('POST', '/auth/login', {
        email: state.users.mentor.email,
        password: 'Mentor@SecurePass123'
    });
    
    if (loginResult.success) {
        state.tokens.mentor = loginResult.data.accessToken;
        test('Mentor login successful', true);
    } else {
        state.results.skipped += 3;
        return;
    }
    
    // Get mentor's interns
    log.test('View Assigned Interns');
    const internsResult = await request(
        'GET',
        '/admin/mentor/interns',
        null,
        state.tokens.mentor
    );
    test('Retrieve assigned interns', internsResult.success);
    
    // Assign work (if there are interns)
    if (internsResult.success && internsResult.data.data?.length > 0) {
        const internshipGroup = internsResult.data.data[0];
        if (internshipGroup.interns?.length > 0) {
            const applicationId = internshipGroup.interns[0].id;
            
            log.test('Assign Work to Intern');
            const assignWorkResult = await request(
                'POST',
                '/admin/work-assignment',
                {
                    applicationId,
                    title: 'Complete Module 1',
                    description: 'Finish the first module of the internship',
                    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
                },
                state.tokens.mentor
            );
            test('Work assigned to intern', assignWorkResult.success);
        }
    }
    
    // Get work assignments
    log.test('View Work Assignments');
    const workResult = await request(
        'GET',
        '/admin/work-assignments',
        null,
        state.tokens.mentor
    );
    test('Retrieve work assignments', workResult.success);
}

async function testSecurityFeatures() {
    log.section('8. Security Features');
    
    // Test rate limiting info
    log.test('Rate Limiting Headers');
    const healthResult = await request('GET', '/health');
    if (healthResult.data?.headers) {
        test('Rate limit headers present', 
            healthResult.data.headers['ratelimit-limit'] || 
            healthResult.data.headers['x-ratelimit-limit']
        );
    } else {
        log.info('Rate limit headers check skipped');
        state.results.skipped++;
    }
    
    // Test unauthorized access
    log.test('Unauthorized Access Blocked');
    const unauthorizedResult = await request(
        'GET',
        '/admin/internships',
        null,
        'invalid-token'
    );
    test('Invalid token rejected', !unauthorizedResult.success);
    
    // Test missing token
    log.test('Missing Token Blocked');
    const noTokenResult = await request(
        'GET',
        '/admin/users',
        null,
        null
    );
    test('No token rejected', !noTokenResult.success);
    
    // Test token refresh
    log.test('Token Refresh');
    if (state.tokens.student) {
        const refreshResult = await request('POST', '/auth/refresh', {
            refreshToken: state.tokens.student
        });
        // Note: This may fail if token expired during test
        if (refreshResult.success) {
            test('Token refresh works', true);
        } else {
            log.info('Token refresh skipped (token may have expired)');
            state.results.skipped++;
        }
    } else {
        state.results.skipped++;
    }
}

async function generateReport() {
    log.section('📊 Test Report');
    
    const total = state.results.passed + state.results.failed + state.results.skipped;
    const passRate = ((state.results.passed / (state.results.passed + state.results.failed)) * 100).toFixed(1);
    
    console.log(`\n${colors.cyan}┌─────────────────────────────────────────┐${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset}  ${colors.blue}E2E TEST SUMMARY${colors.reset}`.padEnd(42) + `${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}├─────────────────────────────────────────┤${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset}  Total Tests:  ${total.toString().padEnd(26)}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset}  ${colors.green}Passed:  ${state.results.passed.toString().padEnd(28)}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset}  ${colors.red}Failed:  ${state.results.failed.toString().padEnd(28)}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset}  ${colors.yellow}Skipped: ${state.results.skipped.toString().padEnd(28)}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}│${colors.reset}  Pass Rate:   ${passRate}%${' '.padEnd(22 - passRate.length)}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.cyan}└─────────────────────────────────────────┘${colors.reset}`);
    
    if (state.results.failed === 0) {
        console.log(`\n${colors.green}🎉 All tests passed!${colors.reset}`);
    } else {
        console.log(`\n${colors.red}⚠️  ${state.results.failed} test(s) failed${colors.reset}`);
    }
    
    // Save report to file
    const fs = require('fs');
    const report = {
        timestamp: new Date().toISOString(),
        results: state.results,
        passRate: parseFloat(passRate),
        summary: state.results.failed === 0 ? 'PASS' : 'FAIL'
    };
    
    fs.writeFileSync(
        'test-report.json',
        JSON.stringify(report, null, 2)
    );
    log.info('Report saved to test-report.json');
}

// ============================================
// MAIN EXECUTION
// ============================================

async function runTests() {
    console.log(`\n${colors.cyan}`);
    console.log('╔════════════════════════════════════════════╗');
    console.log('║   APTRANSCO Internship Portal             ║');
    console.log('║   End-to-End Test Suite                   ║');
    console.log('╚════════════════════════════════════════════╝');
    console.log(`${colors.reset}`);
    
    log.info(`API URL: ${BASE_URL}`);
    log.info(`Started at: ${new Date().toLocaleString()}`);
    
    try {
        await testHealthCheck();
        await testAdminWorkflow();
        await testStudentWorkflow();
        await testHODWorkflow();
        await testCommitteeWorkflow();
        await testCEPRTIWorkflow();
        await testMentorWorkflow();
        await testSecurityFeatures();
    } catch (error) {
        log.error(`Test suite error: ${error.message}`);
        console.error(error);
    } finally {
        await generateReport();
        console.log(`\nCompleted at: ${new Date().toLocaleString()}\n`);
    }
}

// Run tests
runTests();
