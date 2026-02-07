const express = require("express");
const { createDonation, completeDonation } = require("../controllers/donationController");

const router = express.Router();

router.post("/", createDonation);
router.patch("/:id/complete", completeDonation);

module.exports = router;
