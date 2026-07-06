const Razorpay = require("razorpay");
const crypto = require("crypto");

let instance = null;

function getRazorpay() {
	if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
		throw new Error("Razorpay keys not configured");
	}
	if (!instance) {
		instance = new Razorpay({
			key_id: process.env.RAZORPAY_KEY_ID,
			key_secret: process.env.RAZORPAY_KEY_SECRET,
		});
	}
	return instance;
}

async function createOrder({ amountPaise, receipt, notes = {} }) {
	const razorpay = getRazorpay();
	return razorpay.orders.create({
		amount: amountPaise,
		currency: "INR",
		receipt,
		notes,
	});
}

function verifyPaymentSignature({ orderId, paymentId, signature }) {
	const secret = process.env.RAZORPAY_KEY_SECRET;
	const payload = `${orderId}|${paymentId}`;
	const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
	return expected === signature;
}

function getKeyId() {
	return process.env.RAZORPAY_KEY_ID || "";
}

module.exports = {
	getRazorpay,
	createOrder,
	verifyPaymentSignature,
	getKeyId,
};
