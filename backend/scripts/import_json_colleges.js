const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2912@localhost:5432/aptransco?schema=public'
});

async function main() {
    console.log("Loading all 39,000+ colleges from the dataset...");
    const data = JSON.parse(fs.readFileSync('colleges_dump.json', 'utf8'));

    // We will do batched inserts for speed
    // The user requested classifications: deemed, autonomus, collage , institute
    // We will map based on the name or the existing institution_type if it helps

    let count = 0;

    for (let i = 0; i < data.length; i += 500) {
        const batch = data.slice(i, i + 500);
        let valuesStr = [];
        let params = [];
        let pId = 1;

        for (const c of batch) {
            if (!c.institute_name) continue;
            let type = 'college';
            const lower = c.institute_name.toLowerCase();

            // "classify all the collages according to the category deemed, autonomus, collage , institute"
            if (lower.includes('deemed')) {
                type = 'deemed';
            } else if (lower.includes('autonomous') || lower.includes('autonomus')) {
                type = 'autonomous';
            } else if (lower.includes('institute') || lower.includes('technology')) {
                type = 'institute';
            } else {
                type = 'college';
            }

            // Using AICTE ID as aishe_code fallback
            let code = c.aicte_id || c.other_id || `CUSTOM-${count}-${Date.now()}`;

            // Ensure no duplicate custom IDs in the same batch by incrementing count
            count++;

            valuesStr.push(`($${pId}, $${pId + 1}, $${pId + 2}, $${pId + 3}, $${pId + 4}, $${pId + 5})`);
            params.push(code);                              // 1: aishe_code
            params.push(c.institute_name.substring(0, 200));// 2: college_name
            params.push('Various/AICTE');                   // 3: university_name
            params.push('Other/Unknown');                   // 4: state_name (will fallback to unknown since state is not in this dataset)
            params.push(c.district ? c.district.substring(0, 100) : 'Unknown'); // 5: district/city
            params.push(type.substring(0, 20));             // 6: college_type

            pId += 6;
        }

        const query = `
            INSERT INTO aishe_colleges (aishe_code, college_name, university_name, state_name, city, college_type)
            VALUES ${valuesStr.join(', ')}
            ON CONFLICT (aishe_code) DO NOTHING
        `;

        try {
            await pool.query(query, params);
            console.log(`Inserted batch ${i / 500 + 1}/${Math.ceil(data.length / 500)}`);
        } catch (err) {
            console.error("Batch insert error:", err.message);
        }
    }

    console.log(`Finished processing ${data.length} colleges.`);
    pool.end();
}

main().catch(console.error);
