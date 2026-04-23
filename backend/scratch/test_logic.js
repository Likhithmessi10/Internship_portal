const { categorizeApplicant, sortApplicants } = require('../services/rankingService');
const { findCollege, mapCategory } = require('../services/collegeService');

// TEST 1: College Validation
console.log('Testing College Validation...');
const college = findCollege('Government Polytechnic Diglipur');
console.log('Match found:', college ? 'YES' : 'NO');
if (college) {
    console.log('Category:', mapCategory(college.institution_type));
}

// TEST 2: Ranking Logic
console.log('\nTesting Ranking Logic...');
const mockInternship = { priorityCollege: 'IIT Delhi', openingsCount: 2 };
const applicants = [
    { id: '1', score: 8.5, extractedSkills: ['react', 'node'], student: { cgpa: 9.0, collegeName: 'IIT Delhi' } },
    { id: '2', score: 8.5, extractedSkills: ['react', 'node', 'python'], student: { cgpa: 8.0, collegeName: 'IIT Delhi' } },
    { id: '3', score: 9.0, extractedSkills: ['react'], student: { cgpa: 7.5, collegeName: 'Other College' } },
];

const sorted = sortApplicants(applicants);
console.log('Sorted Order (IDs):', sorted.map(a => a.id));
// Expected: 
// 1. App 3 (Score 9.0)
// 2. App 2 (Score 8.5, more skills)
// 3. App 1 (Score 8.5, fewer skills)

// TEST 3: Categorization
console.log('\nTesting Categorization...');
applicants.forEach(a => {
    console.log(`App ${a.id}: ${categorizeApplicant(a.student, mockInternship)}`);
});

process.exit(0);
