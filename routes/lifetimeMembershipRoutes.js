const express = require("express");
const { submitLifetimeMembership } = require("../controllers/lifetimeMembershipController");

const router = express.Router();

router.post("/", submitLifetimeMembership);

module.exports = router;
