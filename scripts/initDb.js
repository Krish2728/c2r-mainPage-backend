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

-- Career guides (Resources page – Career Guides tab) – admin-managed
CREATE TABLE IF NOT EXISTS career_guides (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL DEFAULT 'Career Prep',
  pdf_url VARCHAR(1024) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_career_guides_sort ON career_guides(sort_order);

-- Annual reports (Resources page – Annual Reports tab) – admin-managed
CREATE TABLE IF NOT EXISTS annual_reports (
  id SERIAL PRIMARY KEY,
  year VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  pdf_url VARCHAR(1024) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_annual_reports_sort ON annual_reports(sort_order);

-- Mentor resources (Resources page – For Mentors tab) – admin-managed
CREATE TABLE IF NOT EXISTS mentor_resources (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  pdf_url VARCHAR(1024) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mentor_resources_sort ON mentor_resources(sort_order);

-- Free course signups (Resources page – sign in/sign up for free courses; visible to admin)
CREATE TABLE IF NOT EXISTS course_signups (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  age INT,
  mobile_number VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_course_signups_created_at ON course_signups(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_course_signups_email ON course_signups(email);

-- Volunteer form submissions (Contact page – Volunteer tab)
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
