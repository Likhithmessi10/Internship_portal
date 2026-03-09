const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2912@localhost:5432/aptransco?schema=public'
});

// A list of some prominent engineering colleges and universities in India
const initialColleges = [
    // IITs
    { aishe_code: 'IIT-BOM', name: 'Indian Institute of Technology Bombay', university: 'Autonomous', state: 'Maharashtra', city: 'Mumbai', type: 'IIT' },
    { aishe_code: 'IIT-DEL', name: 'Indian Institute of Technology Delhi', university: 'Autonomous', state: 'Delhi', city: 'New Delhi', type: 'IIT' },
    { aishe_code: 'IIT-KAN', name: 'Indian Institute of Technology Kanpur', university: 'Autonomous', state: 'Uttar Pradesh', city: 'Kanpur', type: 'IIT' },
    { aishe_code: 'IIT-KGP', name: 'Indian Institute of Technology Kharagpur', university: 'Autonomous', state: 'West Bengal', city: 'Kharagpur', type: 'IIT' },
    { aishe_code: 'IIT-MAD', name: 'Indian Institute of Technology Madras', university: 'Autonomous', state: 'Tamil Nadu', city: 'Chennai', type: 'IIT' },
    { aishe_code: 'IIT-ROO', name: 'Indian Institute of Technology Roorkee', university: 'Autonomous', state: 'Uttarakhand', city: 'Roorkee', type: 'IIT' },
    { aishe_code: 'IIT-GWA', name: 'Indian Institute of Technology Guwahati', university: 'Autonomous', state: 'Assam', city: 'Guwahati', type: 'IIT' },
    { aishe_code: 'IIT-HYD', name: 'Indian Institute of Technology Hyderabad', university: 'Autonomous', state: 'Telangana', city: 'Sangareddy', type: 'IIT' },
    { aishe_code: 'IIT-GAN', name: 'Indian Institute of Technology Gandhinagar', university: 'Autonomous', state: 'Gujarat', city: 'Gandhinagar', type: 'IIT' },
    { aishe_code: 'IIT-BHU', name: 'Indian Institute of Technology (BHU) Varanasi', university: 'Autonomous', state: 'Uttar Pradesh', city: 'Varanasi', type: 'IIT' },
    { aishe_code: 'IIT-TRP', name: 'Indian Institute of Technology Tirupati', university: 'Autonomous', state: 'Andhra Pradesh', city: 'Tirupati', type: 'IIT' },

    // NITs
    { aishe_code: 'NIT-TRY', name: 'National Institute of Technology Tiruchirappalli', university: 'Autonomous', state: 'Tamil Nadu', city: 'Tiruchirappalli', type: 'NIT' },
    { aishe_code: 'NIT-SRT', name: 'National Institute of Technology Karnataka', university: 'Autonomous', state: 'Karnataka', city: 'Surathkal', type: 'NIT' },
    { aishe_code: 'NIT-ROU', name: 'National Institute of Technology Rourkela', university: 'Autonomous', state: 'Odisha', city: 'Rourkela', type: 'NIT' },
    { aishe_code: 'NIT-WGL', name: 'National Institute of Technology Warangal', university: 'Autonomous', state: 'Telangana', city: 'Warangal', type: 'NIT' },
    { aishe_code: 'NIT-CAL', name: 'National Institute of Technology Calicut', university: 'Autonomous', state: 'Kerala', city: 'Kozhikode', type: 'NIT' },
    { aishe_code: 'NIT-NGP', name: 'Visvesvaraya National Institute of Technology', university: 'Autonomous', state: 'Maharashtra', city: 'Nagpur', type: 'NIT' },
    { aishe_code: 'NIT-KUK', name: 'National Institute of Technology Kurukshetra', university: 'Autonomous', state: 'Haryana', city: 'Kurukshetra', type: 'NIT' },
    { aishe_code: 'NIT-DGP', name: 'National Institute of Technology Durgapur', university: 'Autonomous', state: 'West Bengal', city: 'Durgapur', type: 'NIT' },
    { aishe_code: 'NIT-SIL', name: 'National Institute of Technology Silchar', university: 'Autonomous', state: 'Assam', city: 'Silchar', type: 'NIT' },
    { aishe_code: 'NIT-MNNIT', name: 'Motilal Nehru National Institute of Technology', university: 'Autonomous', state: 'Uttar Pradesh', city: 'Prayagraj', type: 'NIT' },
    { aishe_code: 'NIT-AP', name: 'National Institute of Technology Andhra Pradesh', university: 'Autonomous', state: 'Andhra Pradesh', city: 'Tadepalligudem', type: 'NIT' },

    // IIITs
    { aishe_code: 'IIIT-HYD', name: 'International Institute of Information Technology Hyderabad', university: 'Autonomous', state: 'Telangana', city: 'Hyderabad', type: 'IIIT' },
    { aishe_code: 'IIIT-BAN', name: 'International Institute of Information Technology Bangalore', university: 'Autonomous', state: 'Karnataka', city: 'Bangalore', type: 'IIIT' },
    { aishe_code: 'IIIT-ALL', name: 'Indian Institute of Information Technology Allahabad', university: 'Autonomous', state: 'Uttar Pradesh', city: 'Prayagraj', type: 'IIIT' },
    { aishe_code: 'IIIT-GWA', name: 'Indian Institute of Information Technology Guwahati', university: 'Autonomous', state: 'Assam', city: 'Guwahati', type: 'IIIT' },
    { aishe_code: 'IIIT-KANC', name: 'Indian Institute of Information Technology Design and Manufacturing Kancheepuram', university: 'Autonomous', state: 'Tamil Nadu', city: 'Chennai', type: 'IIIT' },
    { aishe_code: 'IIIT-JAB', name: 'Indian Institute of Information Technology Design and Manufacturing Jabalpur', university: 'Autonomous', state: 'Madhya Pradesh', city: 'Jabalpur', type: 'IIIT' },
    { aishe_code: 'IIIT-SRC', name: 'Indian Institute of Information Technology Sri City', university: 'Autonomous', state: 'Andhra Pradesh', city: 'Chittoor', type: 'IIIT' },

    // Top Universities, State Univ, Private, Deemed
    { aishe_code: 'BITS-PIL', name: 'Birla Institute of Technology and Science Pilani', university: 'BITS Pilani', state: 'Rajasthan', city: 'Pilani', type: 'DEEMED' },
    { aishe_code: 'BITS-HYD', name: 'BITS Pilani Hyderabad Campus', university: 'BITS Pilani', state: 'Telangana', city: 'Hyderabad', type: 'DEEMED' },
    { aishe_code: 'BITS-GOA', name: 'BITS Pilani Goa Campus', university: 'BITS Pilani', state: 'Goa', city: 'Zuarinagar', type: 'DEEMED' },
    { aishe_code: 'VIT-VEL', name: 'Vellore Institute of Technology', university: 'VIT', state: 'Tamil Nadu', city: 'Vellore', type: 'DEEMED' },
    { aishe_code: 'MIT-MAN', name: 'Manipal Institute of Technology', university: 'MAHE', state: 'Karnataka', city: 'Manipal', type: 'DEEMED' },
    { aishe_code: 'SRM-CHE', name: 'SRM Institute of Science and Technology', university: 'SRM', state: 'Tamil Nadu', city: 'Chennai', type: 'DEEMED' },
    { aishe_code: 'THAP-PAT', name: 'Thapar Institute of Engineering and Technology', university: 'Autonomous', state: 'Punjab', city: 'Patiala', type: 'DEEMED' },
    { aishe_code: 'JAD-UNIV', name: 'Jadavpur University', university: 'Jadavpur University', state: 'West Bengal', city: 'Kolkata', type: 'STATE_UNIV' },
    { aishe_code: 'ANNA-UNIV', name: 'Anna University', university: 'Anna University', state: 'Tamil Nadu', city: 'Chennai', type: 'STATE_UNIV' },
    { aishe_code: 'DEL-TECH', name: 'Delhi Technological University', university: 'DTU', state: 'Delhi', city: 'New Delhi', type: 'STATE_UNIV' },
    { aishe_code: 'COEP-PUN', name: 'College of Engineering Pune', university: 'SPPU', state: 'Maharashtra', city: 'Pune', type: 'STATE_UNIV' },

    // Andhra Pradesh Specific
    { aishe_code: 'AU-ENG', name: 'Andhra University College of Engineering', university: 'Andhra University', state: 'Andhra Pradesh', city: 'Visakhapatnam', type: 'STATE_UNIV' },
    { aishe_code: 'SVU-ENG', name: 'Sri Venkateswara University College of Engineering', university: 'SVU', state: 'Andhra Pradesh', city: 'Tirupati', type: 'STATE_UNIV' },
    { aishe_code: 'JNTUK-01', name: 'JNTUK University College of Engineering Kakinada', university: 'JNTUK', state: 'Andhra Pradesh', city: 'Kakinada', type: 'STATE_UNIV' },
    { aishe_code: 'JNTUA-01', name: 'JNTUA University College of Engineering Anantapur', university: 'JNTUA', state: 'Andhra Pradesh', city: 'Anantapur', type: 'STATE_UNIV' },
    { aishe_code: 'KLU-01', name: 'Koneru Lakshmaiah Education Foundation (KL University)', university: 'KL University', state: 'Andhra Pradesh', city: 'Guntur', type: 'DEEMED' },
    { aishe_code: 'GITAM-01', name: 'GITAM (Gandhi Institute of Technology and Management)', university: 'GITAM', state: 'Andhra Pradesh', city: 'Visakhapatnam', type: 'DEEMED' },
    { aishe_code: 'VFSTR-01', name: 'Vignan Foundation for Science, Technology & Research', university: 'Vignan University', state: 'Andhra Pradesh', city: 'Guntur', type: 'DEEMED' },
];

/**
 * Normalizes college names for deduplication
 */
function normalizeName(name) {
    if (!name) return '';
    return name.toLowerCase()
        .replace(/[^a-z0-9]/g, ' ')
        .replace(/\b(of|and|the|for|institute|college|university|technology|engineering|science)\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Generates initial dataset
 */
async function generateInitialDataset() {
    console.log('Generating initial dataset of well-known colleges...');

    let count = 0;
    for (const c of initialColleges) {
        try {
            await pool.query(
                `INSERT INTO aishe_colleges
          (aishe_code, college_name, university_name, state_name, city, college_type)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (aishe_code) DO NOTHING`,
                [c.aishe_code, c.name, c.university, c.state, c.city, c.type]
            );
            count++;
        } catch (err) {
            console.error(`Failed to insert ${c.name}:`, err.message);
        }
    }

    console.log(`Successfully generated ${count} initial records.`);
}

/**
 * Validates and adds a new college manually
 */
async function addCustomCollege(data) {
    const { name, university, state, city, type } = data;

    if (!name || name.length < 5) {
        throw new Error('Invalid college name');
    }

    const normName = normalizeName(name);

    // Check for near-duplicates using trigram similarity if possible
    const dupCheck = await pool.query(
        `SELECT * FROM aishe_colleges 
     WHERE college_name ILIKE $1 
        OR similarity(college_name, $2) > 0.8`,
        [`%${name}%`, name]
    );

    if (dupCheck.rows.length > 0) {
        console.log(`Similar college already exists: ${dupCheck.rows[0].college_name}`);
        return dupCheck.rows[0];
    }

    // Generate a custom code
    const code = `CUSTOM-${Date.now().toString(36).toUpperCase()}`;

    const result = await pool.query(
        `INSERT INTO aishe_colleges
        (aishe_code, college_name, university_name, state_name, city, college_type, management_type)
    VALUES($1, $2, $3, $4, $5, $6, $7)
    RETURNING * `,
        [code, name, university || 'Other', state || 'Other', city || 'Other', type || 'OTHER', 'Custom Added']
    );

    console.log(`Added custom college: ${name} `);
    return result.rows[0];
}

// Ensure the trigram extension exists
async function setupDB() {
    try {
        await pool.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
        console.log('Database extensions verified.');
    } catch (err) {
        console.error('Failed to setup DB extensions:', err);
    }
}

async function main() {
    await setupDB();

    // Choose actions based on the arguments
    const args = process.argv.slice(2);

    if (args.includes('--generate')) {
        await generateInitialDataset();
    }

    if (args.includes('--add')) {
        const idx = args.indexOf('--add');
        const name = args[idx + 1];
        if (name) {
            try {
                await addCustomCollege({ name, state: 'Andhra Pradesh', type: 'OTHER' });
            } catch (e) {
                console.error('Failed to add custom college:', e.message);
            }
        }
    }

    await pool.end();
}

if (require.main === module) {
    main();
}

module.exports = {
    generateInitialDataset,
    addCustomCollege,
    normalizeName
};
