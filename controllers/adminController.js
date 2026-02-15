const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ExcelJS = require("exceljs");
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

const exportEmails = async (req, res) => {
	try {
		const result = await query(
			`SELECT id, type, name, email, message, company_name, contact_person,
			        profession, experience, motivation, created_at
			 FROM contact_submissions
			 ORDER BY created_at DESC`
		);
		const rows = result.rows || [];

		const workbook = new ExcelJS.Workbook();
		workbook.creator = "Connect2Roots Admin";
		const sheet = workbook.addWorksheet("Emails", { headerRows: 1 });

		sheet.columns = [
			{ header: "Date", key: "created_at", width: 20 },
			{ header: "Type", key: "type", width: 14 },
			{ header: "Name", key: "name", width: 22 },
			{ header: "Email", key: "email", width: 28 },
			{ header: "Message", key: "message", width: 40 },
			{ header: "Company Name", key: "company_name", width: 22 },
			{ header: "Contact Person", key: "contact_person", width: 18 },
			{ header: "Profession", key: "profession", width: 16 },
			{ header: "Experience", key: "experience", width: 25 },
			{ header: "Motivation", key: "motivation", width: 25 },
		];

		sheet.getRow(1).font = { bold: true };
		sheet.getRow(1).fill = {
			type: "pattern",
			pattern: "solid",
			fgColor: { argb: "FFE8F5E0" },
		};

		rows.forEach((r) => {
			sheet.addRow({
				created_at: r.created_at ? new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19) : "",
				type: r.type || "",
				name: r.name || "",
				email: r.email || "",
				message: (r.message || "").toString().slice(0, 32000),
				company_name: r.company_name || "",
				contact_person: r.contact_person || "",
				profession: r.profession || "",
				experience: (r.experience || "").toString().slice(0, 32000),
				motivation: (r.motivation || "").toString().slice(0, 32000),
			});
		});

		const buffer = await workbook.xlsx.writeBuffer();
		res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
		res.setHeader("Content-Disposition", "attachment; filename=connect2roots-emails.xlsx");
		res.send(buffer);
	} catch (err) {
		console.error("Export emails error:", err);
		res.status(500).json({ message: "Failed to export emails" });
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
		const [emailsCount, volunteersCount, donationsCount, donationsTotal] = await Promise.all([
			query("SELECT COUNT(*) FROM contact_submissions"),
			query("SELECT COUNT(*) FROM volunteer_submissions").catch(() => ({ rows: [{ count: "0" }] })),
			query("SELECT COUNT(*) FROM donations WHERE status = $1", ["completed"]),
			query("SELECT COALESCE(SUM(amount_display), 0) AS total FROM donations WHERE status = $1", ["completed"]),
		]);
		const totalEmails = parseInt(emailsCount.rows[0].count, 10);
		const totalVolunteers = parseInt(volunteersCount.rows[0].count, 10);
		res.json({
			totalEmails: totalEmails + totalVolunteers,
			totalDonationsCount: parseInt(donationsCount.rows[0].count, 10),
			totalDonationsAmount: parseFloat(donationsTotal.rows[0].total) || 0,
		});
	} catch (err) {
		console.error("Admin stats error:", err);
		res.status(500).json({ message: "Failed to fetch stats" });
	}
};

const getVolunteers = async (req, res) => {
	try {
		const { limit = 200, offset = 0 } = req.query;
		const result = await query(
			`SELECT id, email, full_name, gender, mobile_no, date_of_birth, current_address,
			        native_city_village, languages, current_company_org, designation, linkedin_profile,
			        years_of_experience, has_volunteered_before, highest_qualification, how_can_you_contribute,
			        preferred_areas_mentoring, hours_per_week, preferred_days, preferred_timings, identity_number, created_at
			 FROM volunteer_submissions
			 ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
			[parseInt(limit, 10) || 200, parseInt(offset, 10) || 0]
		);
		const countResult = await query("SELECT COUNT(*) FROM volunteer_submissions");
		const total = parseInt(countResult.rows[0].count, 10);
		res.json({
			volunteers: result.rows,
			total,
			limit: parseInt(limit, 10) || 200,
			offset: parseInt(offset, 10) || 0,
		});
	} catch (err) {
		console.error("Admin volunteers list error:", err);
		// If table doesn't exist yet (e.g. init-db not run), return empty list so admin UI doesn't 500
		const msg = err.message || "";
		if (msg.includes("volunteer_submissions") && (msg.includes("does not exist") || msg.includes("relation"))) {
			console.warn("volunteer_submissions table missing. Run: npm run init-db");
			return res.json({ volunteers: [], total: 0, limit: parseInt(req.query.limit, 10) || 200, offset: parseInt(req.query.offset, 10) || 0 });
		}
		res.status(500).json({ message: "Failed to fetch volunteers" });
	}
};

module.exports = {
	loginAdmin,
	getEmails,
	exportEmails,
	getDonations,
	getStats,
	getVolunteers,
};
