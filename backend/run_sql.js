const fs = require('fs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://postgres:2912@localhost:5432/aptransco?schema=public'
});

async function main() {
    const sql = fs.readFileSync('../SQL', 'utf8');
    try {
        await pool.query(sql);
        console.log('SQL executed successfully');
    } catch (err) {
        console.error('Error executing SQL:', err);
    } finally {
        await pool.end();
    }
}

main();
