const { query } = require("../config/db");

const submitPartnership = async (req, res) => {
	try {
		const { companyName, contactPerson, email, message } = req.body;
		if (!email || !message) {
			return res.status(400).json({ message: "Email and message are required" });
		}
		await query(
			`INSERT INTO contact_submissions (type, company_name, contact_person, email, message)
       VALUES ('partnership', $1, $2, $3, $4)`,
			[companyName || null, contactPerson || null, email, message]
		);
		res.status(201).json({ message: "Thank you! We will get back to you soon." });
	} catch (err) {
		console.error("Partnership submission error:", err);
		res.status(500).json({ message: "Failed to submit inquiry" });
	}
};

module.exports = {
	submitPartnership,
};
