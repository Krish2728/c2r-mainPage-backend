/**
 * Initialize PostgreSQL schema for c2r-admin-backend.
 * Run: npm run init-db
 */
require('dotenv').config();
const { pool } = require('../config/db');

const schema = `
-- Contact form submissions (general contact)
CREATE TABLE IF NOT EXISTS contact_submissions (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL DEFAULT 'general',
  name VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  company_name VARCHAR(255),
  contact_person VARCHAR(255),
  profession VARCHAR(255),
  experience TEXT,
  motivation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  amount_paise BIGINT NOT NULL,
  amount_display DECIMAL(12,2) NOT NULL,
  donor_name VARCHAR(255) NOT NULL,
  donor_email VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  payment_session_id VARCHAR(255),
  payment_provider VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_contact_submissions_created_at ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_type ON contact_submissions(type);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);

-- Admin users for dashboard login
CREATE TABLE IF NOT EXISTS admin_users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource videos (shown on Resources page, Videos tab) – admin-managed
CREATE TABLE IF NOT EXISTS resource_videos (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  topic VARCHAR(100) NOT NULL DEFAULT 'Career Development',
  video_id VARCHAR(20) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_videos_sort ON resource_videos(sort_order);

`;

async function initDb() {
  const bcrypt = require('bcryptjs');
  const client = await pool.connect();
  try {
    await client.query(schema);
    console.log('✅ Database schema initialized.');
    const hash = await bcrypt.hash('admin123', 10);
    const res = await client.query(
      `INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['admin@connect2roots.org', hash, 'Admin']
    );
    console.log('✅ Default admin: admin@connect2roots.org / admin123');
  } catch (err) {
    console.error('Init DB error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
