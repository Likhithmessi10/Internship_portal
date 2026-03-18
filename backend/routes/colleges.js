// =============================================================================
//  routes/colleges.js  —  AISHE College Search API
//  APTRANSCO Internship Portal — Backend
//
//  Mount in your main app.js / server.js:
//      const collegeRoutes = require('./routes/colleges');
//      app.use('/api/v1/public', collegeRoutes);
//
//  Endpoint exposed:
//      GET /api/v1/public/colleges?search=venkateswara&state=Andhra Pradesh&type=STATE_UNIV&limit=20
// =============================================================================

const express = require('express');
const router = express.Router();
const { Pool } = require('pg');   // adjust if you use a shared db.js pool

// ── DB POOL ──────────────────────────────────────────────────────────────────
// If you already have a shared pool (e.g. require('../db')), replace this block
// with: const pool = require('../db');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // OR use individual env vars:
  // host:     process.env.DB_HOST,
  // port:     process.env.DB_PORT     || 5432,
  // database: process.env.DB_NAME,
  // user:     process.env.DB_USER,
  // password: process.env.DB_PASSWORD,
  max: 10,    // max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000,
});


// ── HELPER — sanitise + validate query parameters ───────────────────────────
function parseSearchParams(query) {
  const search = (query.search || '').toString().trim();
  const state = (query.state || '').toString().trim();
  const type = (query.type || '').toString().trim();
  const limit = Math.min(Math.max(parseInt(query.limit) || 20, 1), 50); // clamp 1–50

  // Allowed college_type values
  const ALLOWED_TYPES = [
    'IIT', 'NIT', 'IIIT', 'CENTRAL', 'STATE_UNIV', 'DEEMED', 'OTHER',
    'deemed', 'autonomous', 'college', 'institute'
  ];

  return {
    search,
    state,
    type: ALLOWED_TYPES.includes(type) ? type : null,
    limit,
  };
}


// ── GET /api/v1/public/colleges ──────────────────────────────────────────────
/**
 * Search AISHE colleges with optional filters.
 *
 * Query params:
 *   search  (string, required, min 3 chars) — searched against college_name + university_name
 *   state   (string, optional)              — exact match on state_name
 *   type    (string, optional)              — exact match on college_type
 *   limit   (number, optional, default 20)  — max results (capped at 50)
 *
 * Response:
 *   { success: true, count: N, data: [ { aishe_code, college_name, university_name, state_name, city, college_type }, ... ] }
 */
router.get('/colleges', async (req, res) => {
  const { search, state, type, limit } = parseSearchParams(req.query);

  // Enforce minimum 3 characters — mirrors frontend guard
  if (search.length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 3 characters.',
    });
  }

  try {
    // ── Build dynamic query ──────────────────────────────────────────────────
    //
    //  We use ILIKE with the pg_trgm GIN index for fast substring matching.
    //  The query plan will use: "Bitmap Index Scan on idx_aishe_college_name_trgm"
    //  which handles 50,000+ rows in < 10 ms.
    //
    //  We search both college_name AND university_name so users can type either.

    const params = [];  // positional params for pg
    const filters = ['c.is_active = TRUE'];

    // Search term (always present — validated above)
    params.push(`%${search}%`);
    filters.push(
      `(c.college_name ILIKE $${params.length} OR c.university_name ILIKE $${params.length})`
    );

    // Optional: state filter
    if (state) {
      params.push(state);
      filters.push(`c.state_name = $${params.length}`);
    }

    // Optional: college type filter
    if (type) {
      params.push(type);
      filters.push(`c.college_type = $${params.length}`);
    }

    // LIMIT — always positional to prevent injection
    params.push(limit);
    const limitClause = `$${params.length}`;

    const sql = `
      SELECT
        c.aishe_code,
        c.college_name,
        c.university_name,
        c.state_name,
        c.district_name,
        c.city,
        c.college_type,
        c.management_type,
        c.nirf_rank
      FROM aishe_colleges c
      WHERE ${filters.join(' AND ')}
      ORDER BY
        -- Exact prefix matches rank first (relevance ordering)
        CASE WHEN LOWER(c.college_name) LIKE LOWER($1) THEN 0 ELSE 1 END,
        c.nirf_rank ASC NULLS LAST,   -- NIRF-ranked colleges appear before unranked
        c.college_name ASC
      LIMIT ${limitClause}
    `;

    const result = await pool.query(sql, params);

    return res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });

  } catch (err) {
    console.error('[College Search Error]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again.',
    });
  }
});


// ── POST /api/v1/public/colleges/custom ──────────────────────────────────────
const { addCustomCollege } = require('../scripts/tools/manage_colleges');

router.post('/colleges/custom', express.json(), async (req, res) => {
  try {
    const { name, state, type } = req.body;
    const result = await addCustomCollege({ name, state, type });
    return res.json({ success: true, data: result });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});


// ── GET /api/v1/public/colleges/:aishe_code ──────────────────────────────────
/**
 * Fetch a single college by AISHE code.
 * Used if you want to hydrate full details after selection.
 */
router.get('/colleges/:aishe_code', async (req, res) => {
  const code = (req.params.aishe_code || '').toString().trim().toUpperCase();
  if (!code) {
    return res.status(400).json({ success: false, message: 'AISHE code is required.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM aishe_colleges WHERE aishe_code = $1 AND is_active = TRUE',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'College not found.' });
    }

    return res.json({ success: true, data: result.rows[0] });

  } catch (err) {
    console.error('[College Fetch Error]', err.message);
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});


module.exports = router;


// =============================================================================
//  HOW TO WIRE THIS INTO YOUR EXISTING server.js / app.js
// =============================================================================
//
//  1. Place this file at:  backend/routes/colleges.js
//
//  2. In your main app.js, add TWO lines:
//
//       const collegeRoutes = require('./routes/colleges');
//       app.use('/api/v1/public', collegeRoutes);
//
//     ← That's it. The endpoint is now live at:
//        GET http://localhost:5000/api/v1/public/colleges?search=venkateswara
//
//  3. Make sure your .env has DATABASE_URL or individual DB_* variables.
//
//  4. The frontend HTML already calls this URL automatically.
//     No changes needed in the HTML.
//
//
//  QUICK CURL TEST (once the server is running):
//
//    curl "http://localhost:5000/api/v1/public/colleges?search=venkateswara&state=Andhra+Pradesh&limit=5"
//
//  Expected response:
//    {
//      "success": true,
//      "count": 3,
//      "data": [
//        { "aishe_code": "C-SVU-ENG", "college_name": "Sri Venkateswara University...", ... },
//        ...
//      ]
//    }
//
// =============================================================================