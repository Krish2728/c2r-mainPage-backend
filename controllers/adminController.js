const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../config/db");

const loginAdmin = async (req, res) => {
	try {
		const { email, password } = req.body;
		if (!email || !password) {
			return res.status(400).json({ message: "Email and password are required" });
		}
		const result = await query(
			"SELECT id, email, name, password_hash FROM admin_users WHERE email = $1",
			[email]
		);
		if (!result.rows.length) {
			return res.status(401).json({ message: "Invalid email or password" });
		}
		const admin = result.rows[0];
		const valid = await bcrypt.compare(password, admin.password_hash);
		if (!valid) {
			return res.status(401).json({ message: "Invalid email or password" });
		}
		const token = jwt.sign({ id: admin.id }, process.env.JWT_SECRET, { expiresIn: "7d" });
		res.json({
			token,
			admin: { id: admin.id, email: admin.email, name: admin.name },
		});
	} catch (err) {
		console.error("Admin login error:", err);
		res.status(500).json({ message: "Login failed" });
	}
};

const getEmails = async (req, res) => {
	try {
		const { type, limit = 100, offset = 0 } = req.query;
		let sql = `
      SELECT id, type, name, email, message, company_name, contact_person,
             profession, experience, motivation, created_at
      FROM contact_submissions
    `;
		const params = [];
		if (type) {
			params.push(type);
			sql += ` WHERE type = $${params.length}`;
		}
		sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(parseInt(limit, 10) || 100, parseInt(offset, 10) || 0);
		const result = await query(sql, params);
		const countResult = await query(
			type ? "SELECT COUNT(*) FROM contact_submissions WHERE type = $1" : "SELECT COUNT(*) FROM contact_submissions",
			type ? [type] : []
		);
		const total = parseInt(countResult.rows[0].count, 10);
		res.json({
			emails: result.rows,
			total,
			limit: params[params.length - 2],
			offset: params[params.length - 1],
		});
	} catch (err) {
		console.error("Admin emails list error:", err);
		res.status(500).json({ message: "Failed to fetch emails" });
	}
};

const getDonations = async (req, res) => {
	try {
		const { status, limit = 100, offset = 0 } = req.query;
		let sql = `
      SELECT id, amount_paise, amount_display, donor_name, donor_email,
             status, payment_session_id, payment_provider, created_at, completed_at
      FROM donations
    `;
		const params = [];
		if (status) {
			params.push(status);
			sql += ` WHERE status = $${params.length}`;
		}
		sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
		params.push(parseInt(limit, 10) || 100, parseInt(offset, 10) || 0);
		const result = await query(sql, params);
		const countResult = await query(
			status ? "SELECT COUNT(*) FROM donations WHERE status = $1" : "SELECT COUNT(*) FROM donations",
			status ? [status] : []
		);
		const total = parseInt(countResult.rows[0].count, 10);
		const donations = result.rows.map((r) => ({
			...r,
			amount_display: Number(r.amount_display),
		}));
		res.json({
			donations,
			total,
			limit: params[params.length - 2],
			offset: params[params.length - 1],
		});
	} catch (err) {
		console.error("Admin donations list error:", err);
		res.status(500).json({ message: "Failed to fetch donations" });
	}
};

const getStats = async (req, res) => {
	try {
		const [emailsCount, donationsCount, donationsTotal] = await Promise.all([
			query("SELECT COUNT(*) FROM contact_submissions"),
			query("SELECT COUNT(*) FROM donations WHERE status = $1", ["completed"]),
			query("SELECT COALESCE(SUM(amount_display), 0) AS total FROM donations WHERE status = $1", ["completed"]),
		]);
		res.json({
			totalEmails: parseInt(emailsCount.rows[0].count, 10),
			totalDonationsCount: parseInt(donationsCount.rows[0].count, 10),
			totalDonationsAmount: parseFloat(donationsTotal.rows[0].total) || 0,
		});
	} catch (err) {
		console.error("Admin stats error:", err);
		res.status(500).json({ message: "Failed to fetch stats" });
	}
};

module.exports = {
	loginAdmin,
	getEmails,
	getDonations,
	getStats,
};
