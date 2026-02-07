const { query } = require("../config/db");

const submitMentorApplication = async (req, res) => {
	try {
		const { name, email, profession, experience, motivation } = req.body;
		if (!email) {
			return res.status(400).json({ message: "Email is required" });
		}
		await query(
			`INSERT INTO contact_submissions (type, name, email, profession, experience, motivation, message)
       VALUES ('mentor_application', $1, $2, $3, $4, $5, COALESCE($6, ''))`,
			[name || null, email, profession || null, experience || null, motivation || null, motivation || ""]
		);
		res.status(201).json({ message: "Thank you! Your application has been received." });
	} catch (err) {
		console.error("Mentor application error:", err);
		res.status(500).json({ message: "Failed to submit application" });
	}
};

module.exports = {
	submitMentorApplication,
};
