const { query } = require("../config/db");

const submitContact = async (req, res) => {
	try {
		const { name, email, message } = req.body;
		if (!email || !message) {
			return res.status(400).json({ message: "Email and message are required" });
		}
		await query(
			`INSERT INTO contact_submissions (type, name, email, message)
       VALUES ('general', $1, $2, $3)`,
			[name || null, email, message]
		);
		res.status(201).json({ message: "Thank you! Your message has been sent." });
	} catch (err) {
		console.error("Contact submission error:", err);
		res.status(500).json({ message: "Failed to submit message" });
	}
};

module.exports = {
	submitContact,
};
