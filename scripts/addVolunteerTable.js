/**
 * Create only the volunteer_submissions table (if it doesn't exist).
 * Use this when you get: relation "volunteer_submissions" does not exist
 *
 * Run from c2r-admin-backend folder:
 *   node scripts/addVolunteerTable.js
 */
require('dotenv').config();
const { pool } = require('../config/db');

const sql = `
CREATE TABLE IF NOT EXISTS volunteer_submissions (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  gender VARCHAR(50),
  mobile_no VARCHAR(50),
  date_of_birth DATE,
  current_address TEXT,
  native_city_village VARCHAR(255),
  languages VARCHAR(255),
  current_company_org VARCHAR(255),
  designation VARCHAR(255),
  linkedin_profile VARCHAR(1024),
  years_of_experience VARCHAR(100),
  has_volunteered_before VARCHAR(10),
  highest_qualification VARCHAR(255),
  how_can_you_contribute TEXT,
  preferred_areas_mentoring TEXT,
  hours_per_week VARCHAR(100),
  preferred_days VARCHAR(100),
  preferred_timings VARCHAR(100),
  identity_number VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_volunteer_submissions_created_at ON volunteer_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_volunteer_submissions_email ON volunteer_submissions(email);
`;

async function run() {
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log('✅ Table volunteer_submissions created (or already exists).');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
