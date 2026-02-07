const express = require("express");
const { submitPartnership } = require("../controllers/partnershipController");

const router = express.Router();

router.post("/", submitPartnership);

module.exports = router;
