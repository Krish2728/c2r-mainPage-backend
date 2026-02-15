const { query } = require("../config/db");

function isTableMissing(err) {
  return err && err.code === "42P01";
}

const create = async (req, res) => {
  try {
    const { name, email, age, mobile_number } = req.body;
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }
    const result = await query(
      `INSERT INTO course_signups (name, email, age, mobile_number)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, age = EXCLUDED.age, mobile_number = EXCLUDED.mobile_number
       RETURNING id, name, email, age, mobile_number, created_at`,
      [
        String(name).trim(),
        String(email).trim().toLowerCase(),
        age != null && age !== "" ? parseInt(age, 10) : null,
        mobile_number != null ? String(mobile_number).trim() : null,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Course signups not configured." });
    console.error("Course signup create error:", err);
    res.status(500).json({ message: "Failed to sign up" });
  }
};

const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== "string" || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    const result = await query(
      "SELECT id, email FROM course_signups WHERE email = $1",
      [email.trim().toLowerCase()]
    );
    res.json({ exists: result.rows.length > 0 });
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Course signups not configured." });
    console.error("Course signup check error:", err);
    res.status(500).json({ message: "Failed to check email" });
  }
};

const listAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, name, email, age, mobile_number, created_at
       FROM course_signups
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Course signups not configured." });
    console.error("Admin course signups list error:", err);
    res.status(500).json({ message: "Failed to fetch signups" });
  }
};

module.exports = { create, checkEmail, listAdmin };
