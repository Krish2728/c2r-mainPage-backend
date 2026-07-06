const crypto = require("crypto");
const { query, pool } = require("../config/db");
const razorpayService = require("../services/razorpayService");

const MIN_DONATION_PAISE = 1000;

async function finalizeDonation(donationId, paymentId, provider = "razorpay") {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const donationRes = await client.query(
			`SELECT id, status, campaign_id, amount_paise FROM donations WHERE id = $1 FOR UPDATE`,
			[donationId]
		);
		if (!donationRes.rows.length) {
			await client.query("ROLLBACK");
			return { ok: false, reason: "not_found" };
		}
		const donation = donationRes.rows[0];
		if (donation.status === "completed") {
			await client.query("COMMIT");
			return { ok: true, alreadyCompleted: true };
		}
		await client.query(
			`UPDATE donations SET status = 'completed', completed_at = NOW(),
       payment_session_id = $2, payment_provider = $3, razorpay_payment_id = $2
       WHERE id = $1`,
			[donationId, paymentId, provider]
		);
		if (donation.campaign_id) {
			await client.query(
				`UPDATE donation_campaigns SET
          raised_amount_paise = raised_amount_paise + $1,
          donor_count = donor_count + 1,
          updated_at = NOW()
         WHERE id = $2`,
				[donation.amount_paise, donation.campaign_id]
			);
		}
		await client.query("COMMIT");
		return { ok: true };
	} catch (err) {
		await client.query("ROLLBACK");
		throw err;
	} finally {
		client.release();
	}
}

const createDonation = async (req, res) => {
	try {
		const { amount, donorName, donorEmail, campaignId } = req.body;
		if (!donorEmail || !donorName) {
			return res.status(400).json({ message: "Donor name and email are required" });
		}
		const amountPaise = Math.round(Number(amount) || 0);
		const amountDisplay = amountPaise / 100;
		if (amountPaise < MIN_DONATION_PAISE) {
			return res.status(400).json({ message: "Minimum donation amount is Rs. 10" });
		}

		let campaignTitle = null;
		if (campaignId) {
			const campaignRes = await query(
				`SELECT id, title, status FROM donation_campaigns WHERE id = $1`,
				[campaignId]
			);
			if (!campaignRes.rows.length) {
				return res.status(404).json({ message: "Campaign not found" });
			}
			if (campaignRes.rows[0].status !== "published") {
				return res.status(400).json({ message: "Campaign is not accepting donations" });
			}
			campaignTitle = campaignRes.rows[0].title;
		}

		const result = await query(
			`INSERT INTO donations (amount_paise, amount_display, donor_name, donor_email, status, campaign_id)
       VALUES ($1, $2, $3, $4, 'pending', $5)
       RETURNING id, amount_paise, amount_display, donor_name, donor_email, status, campaign_id, created_at`,
			[amountPaise, amountDisplay, donorName.trim(), donorEmail.trim(), campaignId || null]
		);
		const row = result.rows[0];

		let order;
		try {
			order = await razorpayService.createOrder({
				amountPaise,
				receipt: `donation_${row.id}`,
				notes: {
					donation_id: String(row.id),
					campaign_id: campaignId ? String(campaignId) : "",
				},
			});
		} catch (err) {
			console.error("Razorpay order error:", err.message);
			await query("DELETE FROM donations WHERE id = $1", [row.id]);
			return res.status(503).json({
				message: "Payment gateway is not configured. Please contact support.",
			});
		}

		await query(`UPDATE donations SET razorpay_order_id = $1 WHERE id = $2`, [
			order.id,
			row.id,
		]);

		res.status(201).json({
			donationId: row.id,
			orderId: order.id,
			keyId: razorpayService.getKeyId(),
			amount: amountPaise,
			currency: "INR",
			campaignTitle,
			donation: {
				id: row.id,
				amount_paise: row.amount_paise,
				amount_display: Number(row.amount_display),
				donor_name: row.donor_name,
				donor_email: row.donor_email,
				status: row.status,
				campaign_id: row.campaign_id,
				created_at: row.created_at,
			},
		});
	} catch (err) {
		console.error("Donation create error:", err);
		res.status(500).json({ message: "Failed to create donation" });
	}
};

const verifyPayment = async (req, res) => {
	try {
		const { razorpay_order_id, razorpay_payment_id, razorpay_signature, donationId } =
			req.body;
		if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !donationId) {
			return res.status(400).json({ message: "Missing payment verification fields" });
		}

		const valid = razorpayService.verifyPaymentSignature({
			orderId: razorpay_order_id,
			paymentId: razorpay_payment_id,
			signature: razorpay_signature,
		});
		if (!valid) {
			return res.status(400).json({ message: "Invalid payment signature" });
		}

		const donationRes = await query(
			`SELECT id, status, razorpay_order_id FROM donations WHERE id = $1`,
			[donationId]
		);
		if (!donationRes.rows.length) {
			return res.status(404).json({ message: "Donation not found" });
		}
		const donation = donationRes.rows[0];
		if (donation.razorpay_order_id !== razorpay_order_id) {
			return res.status(400).json({ message: "Order mismatch" });
		}

		const result = await finalizeDonation(donationId, razorpay_payment_id);
		if (!result.ok) {
			return res.status(404).json({ message: "Donation not found" });
		}

		const baseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
		res.json({
			success: true,
			redirectUrl: `${baseUrl}/donation-success?donationId=${donationId}`,
		});
	} catch (err) {
		console.error("Donation verify error:", err);
		res.status(500).json({ message: "Failed to verify payment" });
	}
};

const handleRazorpayWebhook = async (req, res) => {
	try {
		const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
		if (webhookSecret) {
			const signature = req.headers["x-razorpay-signature"];
			const expected = crypto
				.createHmac("sha256", webhookSecret)
				.update(req.body)
				.digest("hex");
			if (expected !== signature) {
				return res.status(400).send("Invalid signature");
			}
		}

		const payload = JSON.parse(req.body.toString());
		if (payload.event === "payment.captured") {
			const payment = payload.payload?.payment?.entity;
			if (payment?.order_id && payment?.id) {
				const donationRes = await query(
					`SELECT id FROM donations WHERE razorpay_order_id = $1 AND status = 'pending'`,
					[payment.order_id]
				);
				if (donationRes.rows.length) {
					await finalizeDonation(donationRes.rows[0].id, payment.id);
				}
			}
		}
		res.json({ status: "ok" });
	} catch (err) {
		console.error("Razorpay webhook error:", err);
		res.status(500).json({ message: "Webhook processing failed" });
	}
};

const completeDonation = async (req, res) => {
	try {
		const { id } = req.params;
		const { payment_session_id, payment_provider } = req.body || {};
		const result = await finalizeDonation(
			id,
			payment_session_id || "manual",
			payment_provider || "manual"
		);
		if (!result.ok) {
			return res.status(404).json({ message: "Donation not found" });
		}
		res.json({ id, status: "completed" });
	} catch (err) {
		console.error("Donation complete error:", err);
		res.status(500).json({ message: "Failed to update donation" });
	}
};

module.exports = {
	createDonation,
	verifyPayment,
	handleRazorpayWebhook,
	completeDonation,
};
