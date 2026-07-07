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

-- Donation campaigns (KindKart-style; admin-managed)
CREATE TABLE IF NOT EXISTS donation_campaigns (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(140) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  short_description TEXT DEFAULT '',
  full_story TEXT DEFAULT '',
  cover_image_url VARCHAR(1024) DEFAULT '',
  category VARCHAR(100) DEFAULT 'education',
  location VARCHAR(255) DEFAULT '',
  beneficiary_label VARCHAR(255) DEFAULT '',
  goal_amount_paise BIGINT NOT NULL DEFAULT 0,
  raised_amount_paise BIGINT NOT NULL DEFAULT 0,
  donor_count INT NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_urgent BOOLEAN NOT NULL DEFAULT false,
  preset_amounts JSONB DEFAULT '[]'::jsonb,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaign_cost_items (
  id SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES donation_campaigns(id) ON DELETE CASCADE,
  item_name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  quantity INT NOT NULL DEFAULT 1,
  unit_cost_paise BIGINT NOT NULL DEFAULT 0,
  total_cost_paise BIGINT NOT NULL DEFAULT 0,
  priority INT NOT NULL DEFAULT 1,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS campaign_proofs (
  id SERIAL PRIMARY KEY,
  campaign_id INT NOT NULL REFERENCES donation_campaigns(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  proof_type VARCHAR(50) DEFAULT 'photo',
  media_url VARCHAR(1024) NOT NULL,
  amount_attributed_paise BIGINT,
  visible_to_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donation_campaigns_status ON donation_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_donation_campaigns_slug ON donation_campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_campaign_cost_items_campaign ON campaign_cost_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_proofs_campaign ON campaign_proofs(campaign_id);

ALTER TABLE donations ADD COLUMN IF NOT EXISTS campaign_id INT REFERENCES donation_campaigns(id);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS razorpay_order_id VARCHAR(255);
ALTER TABLE donations ADD COLUMN IF NOT EXISTS razorpay_payment_id VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_donations_campaign_id ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_razorpay_order ON donations(razorpay_order_id);

-- Team page (admin-managed)
CREATE TABLE IF NOT EXISTS team_categories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  is_additional BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  bio TEXT NOT NULL,
  linkedin_url VARCHAR(512) DEFAULT '',
  photo_url VARCHAR(1024),
  photo_class VARCHAR(255),
  panel_type VARCHAR(20) NOT NULL DEFAULT 'core',
  category_id INT REFERENCES team_categories(id) ON DELETE SET NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT team_members_panel_type_check CHECK (panel_type IN ('core', 'advisory')),
  CONSTRAINT team_members_status_check CHECK (status IN ('draft', 'published'))
);

CREATE INDEX IF NOT EXISTS idx_team_categories_sort ON team_categories(sort_order);
CREATE INDEX IF NOT EXISTS idx_team_members_panel_sort ON team_members(panel_type, category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_team_members_status ON team_members(status);

`;

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function initDb() {
  const bcrypt = require('bcryptjs');
  let client;
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      client = await pool.connect();
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      console.warn(
        `Database connection attempt ${attempt}/${MAX_RETRIES} failed: ${err.message}`
      );
      if (attempt < MAX_RETRIES) {
        console.warn(`Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await sleep(RETRY_DELAY_MS);
      }
    }
  }
  if (lastErr || !client) {
    console.error(
      'Init DB error: Could not connect to database. If you see getaddrinfo ENOTFOUND with a host like dpg-xxx-a, use the External Database URL in Render: Dashboard → PostgreSQL → Connect → copy "External Database URL" → Web Service → Environment → set DATABASE_URL to that URL.'
    );
    console.error('Connection error:', lastErr);
    process.exit(1);
  }
  try {
    await client.query(schema);
    await client.query(`
      ALTER TABLE donations DROP CONSTRAINT IF EXISTS donations_campaign_id_fkey;
      ALTER TABLE donations ADD CONSTRAINT donations_campaign_id_fkey
        FOREIGN KEY (campaign_id) REFERENCES donation_campaigns(id) ON DELETE SET NULL;
    `);
    console.log('✅ Database schema initialized.');
    const hash = await bcrypt.hash('admin123', 10);
    const res = await client.query(
      `INSERT INTO admin_users (email, password_hash, name) VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      ['admin@connect2roots.org', hash, 'Admin']
    );
    console.log('✅ Default admin: admin@connect2roots.org / admin123');

    const teamCount = await client.query('SELECT COUNT(*)::int AS n FROM team_members');
    if (teamCount.rows[0].n === 0) {
      const { seedTeamData } = require('./seedTeamMembers');
      await seedTeamData(client);
      console.log('✅ Team page seeded with default members.');
    }
  } catch (err) {
    console.error('Init DB error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

initDb();
