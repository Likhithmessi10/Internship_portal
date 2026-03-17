const clean = (s) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const priorityCollegeName = "Antigravity Institute of Technology";
const collegeNameRaw = "Antigravity Institute of Technology";

const pCollege = clean(priorityCollegeName);
const collegeName = clean(collegeNameRaw);

const isNominated = pCollege && (collegeName.includes(pCollege) || pCollege.includes(collegeName));

console.log('Priority College Name:', priorityCollegeName);
console.log('Cleaned P:', pCollege);
console.log('Cleaned C:', collegeName);
console.log('Is Nominated:', isNominated);
