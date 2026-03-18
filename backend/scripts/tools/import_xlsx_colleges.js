const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2912@localhost:5432/aptransco?schema=public'
});

async function main() {
    const filePath = path.join('c:', 'Users', 'mukka', 'Desktop', 'internship portal', 'College-Affiliated College.xlsx');
    console.log(`Reading Excel file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        console.error("File not found!");
        process.exit(1);
    }

    const wb = xlsx.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    // First row is usually a title, second row is the headers
    // Row 2 : ['Aishe Code', 'Name', 'State', 'District', 'Website', 'Year Of Establishment', 'Location', 'College Type', 'Manegement', 'University Aishe Code', 'University Name', 'University Type']

    let dbRows = [];

    for (let i = 2; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0 || !row[1]) continue;

        let aishe_code = row[0] ? String(row[0]).trim() : '';
        let name = row[1] ? String(row[1]).trim() : '';
        let state = row[2] ? String(row[2]).trim() : '';
        let district = row[3] ? String(row[3]).trim() : '';
        let location = row[6] ? String(row[6]).trim() : '';
        let type_raw = row[7] ? String(row[7]).trim() : '';
        let management = row[8] ? String(row[8]).trim() : '';
        let uni_code = row[9] ? String(row[9]).trim() : '';
        let uni_name = row[10] ? String(row[10]).trim() : '';

        if (!aishe_code) {
            aishe_code = `EXC-${i}-${Date.now().toString().slice(-6)}`;
        }

        let type = 'college';
        const lowerName = name.toLowerCase();
        const lowerTypeRaw = type_raw.toLowerCase();

        if (lowerName.includes('deemed') || lowerTypeRaw.includes('deemed')) {
            type = 'deemed';
        } else if (lowerName.includes('autonomous') || lowerTypeRaw.includes('autonomous')) {
            type = 'autonomous';
        } else if (lowerName.includes('institute') || lowerName.includes('technology')) {
            type = 'institute';
        } else if (lowerTypeRaw.includes('affiliated')) {
            type = 'college';
        } else if (type_raw) {
            type = 'college';
        }

        dbRows.push({
            aishe_code: aishe_code.substring(0, 20),
            college_name: name.substring(0, 500),
            university_name: uni_name.substring(0, 200) || 'Various/Affiliated',
            university_code: uni_code.substring(0, 20),
            state_name: state.substring(0, 100),
            district_name: district.substring(0, 100),
            city: location.substring(0, 100) || district.substring(0, 100),
            college_type: type.substring(0, 20),
            management_type: management.substring(0, 60)
        });
    }

    console.log(`Parsed ${dbRows.length} valid colleges from Excel.`);

    // Batch insert
    let batchSize = 500;
    for (let i = 0; i < dbRows.length; i += batchSize) {
        const batch = dbRows.slice(i, i + batchSize);
        let valuesStr = [];
        let params = [];
        let pId = 1;

        for (const c of batch) {
            valuesStr.push(`($${pId}, $${pId + 1}, $${pId + 2}, $${pId + 3}, $${pId + 4}, $${pId + 5}, $${pId + 6}, $${pId + 7}, $${pId + 8})`);
            params.push(c.aishe_code);
            params.push(c.college_name);
            params.push(c.university_name);
            params.push(c.university_code);
            params.push(c.state_name);
            params.push(c.district_name);
            params.push(c.city);
            params.push(c.college_type);
            params.push(c.management_type);
            pId += 9;
        }

        const query = `
            INSERT INTO aishe_colleges (
                aishe_code, college_name, university_name, university_code,
                state_name, district_name, city, college_type, management_type
            )
            VALUES ${valuesStr.join(', ')}
            ON CONFLICT (aishe_code) DO NOTHING
        `;

        try {
            await pool.query(query, params);
            console.log(`Inserted batch ${i / batchSize + 1}/${Math.ceil(dbRows.length / batchSize)}`);
        } catch (err) {
            console.error("Batch insert error:", err.message);
        }
    }

    console.log("Done inserting Excel colleges!");
    pool.end();
}

main().catch(console.error);
