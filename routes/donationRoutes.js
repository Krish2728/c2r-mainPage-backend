const express = require("express");
const {
	createDonation,
	verifyPayment,
	completeDonation,
} = require("../controllers/donationController");

const router = express.Router();

router.post("/", createDonation);
router.post("/verify", verifyPayment);
router.patch("/:id/complete", completeDonation);

module.exports = router;
