const { query } = require("../config/db");

const createDonation = async (req, res) => {
	try {
		const { amount, donorName, donorEmail } = req.body;
		if (!donorEmail || !donorName) {
			return res.status(400).json({ message: "Donor name and email are required" });
		}
		const amountPaise = typeof amount === "bigint" ? Number(amount) : Math.round(Number(amount) || 0);
		const amountDisplay = amountPaise / 100;
		if (amountDisplay < 5) {
			return res.status(400).json({ message: "Minimum donation amount is Rs. 500" });
		}
		const result = await query(
			`INSERT INTO donations (amount_paise, amount_display, donor_name, donor_email, status)
       VALUES ($1, $2, $3, $4, 'pending')
       RETURNING id, amount_paise, amount_display, donor_name, donor_email, status, created_at`,
			[amountPaise, amountDisplay, donorName, donorEmail]
		);
		const row = result.rows[0];
		const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
		const checkoutUrl = `${baseUrl}/donation-success?donationId=${row.id}&sessionId=local&accountId=local`;
		res.status(201).json({
			donationId: row.id,
			checkoutUrl,
			donation: {
				id: row.id,
				amount_paise: row.amount_paise,
				amount_display: Number(row.amount_display),
				donor_name: row.donor_name,
				donor_email: row.donor_email,
				status: row.status,
				created_at: row.created_at,
			},
		});
	} catch (err) {
		console.error("Donation create error:", err);
		res.status(500).json({ message: "Failed to create donation" });
	}
};

const completeDonation = async (req, res) => {
	try {
		const { id } = req.params;
		const { payment_session_id, payment_provider } = req.body || {};
		const result = await query(
			`UPDATE donations SET status = 'completed', completed_at = NOW(),
       payment_session_id = COALESCE($2, payment_session_id),
       payment_provider = COALESCE($3, payment_provider)
       WHERE id = $1 RETURNING id, status, completed_at`,
			[id, payment_session_id || null, payment_provider || null]
		);
		if (!result.rows.length) {
			return res.status(404).json({ message: "Donation not found" });
		}
		res.json(result.rows[0]);
	} catch (err) {
		console.error("Donation complete error:", err);
		res.status(500).json({ message: "Failed to update donation" });
	}
};

module.exports = {
	createDonation,
	completeDonation,
};
