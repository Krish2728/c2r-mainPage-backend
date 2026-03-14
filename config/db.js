const { Pool } = require('pg');
require('dotenv').config();

// Supabase and most cloud Postgres require SSL; localhost typically does not
const isCloudDb =
  process.env.NODE_ENV === 'production' ||
  (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('supabase'));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false,
});

const query = (text, params) => pool.query(text, params);

module.exports = { pool, query };
