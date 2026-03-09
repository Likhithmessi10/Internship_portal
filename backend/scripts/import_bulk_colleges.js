const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const csv = require('csv-parser');
const { addCustomCollege, normalizeName } = require('./manage_colleges');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:2912@localhost:5432/aptransco?schema=public'
});

/**
 * Helper to sleep between requests to avoid rate limits
 */
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * 1. SCRAPE WIKIPEDIA TABLES
 * 
 * Fetches common Wikipedia lists of colleges (e.g., in AP/TS) and extracts names.
 */
async function scrapeWikipediaColleges() {
    console.log('\n--- Scraping Wikipedia College Lists ---');

    const targets = [
        {
            url: 'https://en.wikipedia.org/wiki/List_of_institutions_of_higher_education_in_Andhra_Pradesh',
            state: 'Andhra Pradesh'
        },
        {
            url: 'https://en.wikipedia.org/wiki/List_of_institutions_of_higher_education_in_Telangana',
            state: 'Telangana'
        }
    ];

    let totalScraped = 0;

    for (const target of targets) {
        console.log(`\nFetching ${target.url}...`);
        try {
            const { data } = await axios.get(target.url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
                }
            });
            const $ = cheerio.load(data);

            // Look for tables with 'wikitable' class
            const colleges = [];
            $('table.wikitable tbody tr').each((i, row) => {
                // Usually the first or second column contains the college name
                // This is a naive heuristic that works reasonably well for these wiki lists
                const cells = $(row).find('td, th');
                if (cells.length > 0) {
                    let name = $(cells[0]).text().trim().replace(/\[\d+\]/g, ''); // Remove citation brackets like [1]

                    // If the first column is basically a number (like an index row), try the second column
                    if (name.length < 5 || /^\d+$/.test(name)) {
                        name = $(cells[1]).text().trim().replace(/\[\d+\]/g, '');
                    }

                    // Clean up and push if looks like a valid college name
                    if (name && name.length >= 8 && !name.toLowerCase().includes('total')) {
                        colleges.push(name.split('\n')[0]); // Take only the first line if there are line breaks
                    }
                }
            });

            console.log(`Found ${colleges.length} potential colleges from ${target.state} page.`);

            // Insert them
            for (const cName of colleges) {
                try {
                    // Add simple type detection
                    let type = 'OTHER';
                    const lower = cName.toLowerCase();
                    if (lower.includes('university')) {
                        if (lower.includes('central')) type = 'CENTRAL';
                        else if (lower.includes('state')) type = 'STATE_UNIV';
                        else type = 'STATE_UNIV'; // fallback assumption for uni
                    } else if (lower.includes('iit') || lower.includes('indian institute of technology')) {
                        type = 'IIT';
                    } else if (lower.includes('nit') || lower.includes('national institute of technology')) {
                        type = 'NIT';
                    } else if (lower.includes('iiit') || lower.includes('information technology')) {
                        type = 'IIIT';
                    }

                    await addCustomCollege({
                        name: cName,
                        state: target.state,
                        type: type,
                        university: 'Various/Autonomous'
                    });
                    totalScraped++;
                    await delay(50); // slight delay to prevent hammering database locks
                } catch (e) {
                    // ignore validation/duplication errors silently in bulk scrape
                }
            }

        } catch (error) {
            console.error(`Failed to scrape ${target.url}:`, error.message);
        }
    }
    console.log(`\nFinished Wikipedia scrape. Added/Processed approx ${totalScraped} records.`);
}

/**
 * 2. BULK CSV IMPORT
 * 
 * Takes an AICTE or AISHE CSV dump file and streams it into the database.
 * 
 * Usage from CLI: node import_bulk_colleges.js --csv path/to/aicte_list.csv
 */
async function importCSV(filePath) {
    console.log(`\n--- Importing CSV Data from ${filePath} ---`);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    let count = 0;

    return new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', async (row) => {
                // Determine headers dynamically based on common CSV formats
                const name = row['Institution Name'] || row['college_name'] || row['Name'] || row[Object.keys(row)[0]];
                const state = row['State'] || row['state_name'] || 'India';
                const city = row['City'] || row['District'] || row['city'] || 'Unknown';
                const type = row['Institution Type'] || row['college_type'] || 'OTHER';

                if (name && name.length > 5) {
                    try {
                        // Pause stream while DB inserts to prevent overwhelming pool
                        await addCustomCollege({
                            name: name.trim(),
                            state: state.trim(),
                            city: city.trim(),
                            type: type.trim(),
                            university: row['University'] || 'Autonomous/Other'
                        });
                        count++;
                    } catch (e) {
                        // silently skip duplicates/errors
                    }
                }
            })
            .on('end', () => {
                console.log(`\nCSV processing finished. Sent ${count} rows for insertion.`);
                resolve();
            })
            .on('error', reject);
    });
}

/**
 * 3. EXECUTION HANDLER
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Usage:
  node scripts/import_bulk_colleges.js --scrape
     (Scrapes Wikipedia for state engineering colleges)
     
  node scripts/import_bulk_colleges.js --csv <filepath.csv>
     (Imports an AICTE/AISHE dataset directly from CSV)
        `);
        process.exit(0);
    }

    if (args.includes('--scrape')) {
        await scrapeWikipediaColleges();
    }

    if (args.includes('--csv')) {
        const idx = args.indexOf('--csv');
        const file = args[idx + 1];
        if (file) {
            await importCSV(file);
        } else {
            console.error('Please provide a file path after --csv');
        }
    }

    // Slight buffer for async pool queries to finish
    setTimeout(() => {
        pool.end();
        process.exit(0);
    }, 2000);
}

if (require.main === module) {
    main();
}

module.exports = {
    scrapeWikipediaColleges,
    importCSV
};
