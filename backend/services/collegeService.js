const fs = require('fs');
const path = require('path');

/**
 * COLLEGE SERVICE
 * Handles validation and metadata extraction for colleges using the trusted dataset.
 */

let collegesData = null;

/**
 * Loads and caches the trusted college dataset
 */
const loadColleges = () => {
    if (collegesData) return collegesData;
    
    try {
        const filePath = path.resolve(__dirname, '../colleges_dump.json');
        if (fs.existsSync(filePath)) {
            const raw = fs.readFileSync(filePath, 'utf8');
            collegesData = JSON.parse(raw);
            return collegesData;
        }
    } catch (error) {
        console.error('[CollegeService] Failed to load colleges dump:', error.message);
    }
    
    collegesData = [];
    return collegesData;
};

/**
 * Finds a college in the dataset with normalization
 */
const findCollege = (name) => {
    if (!name) return null;
    const data = loadColleges();
    const clean = (s) => (s || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = clean(name);
    
    // Attempt 1: Exact normalized match
    let match = data.find(c => clean(c.institute_name) === target);
    if (match) return match;
    
    // Attempt 2: Partial match (contains)
    match = data.find(c => clean(c.institute_name).includes(target) || target.includes(clean(c.institute_name)));
    return match || null;
};

/**
 * Maps dataset institution_type to our CollegeCategory enum
 */
const mapCategory = (instType) => {
    const type = (instType || '').toUpperCase();
    if (type.includes('IIT')) return 'IIT';
    if (type.includes('NIT')) return 'NIT';
    if (type.includes('IIIT')) return 'IIIT';
    if (type.includes('CENTRAL')) return 'CENTRAL';
    if (type.includes('STATE')) return 'STATE';
    if (type.includes('PRIVATE')) return 'PRIVATE';
    return 'OTHER';
};

module.exports = {
    findCollege,
    mapCategory
};
