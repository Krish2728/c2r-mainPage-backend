const express = require("express");
const { submitMentorApplication } = require("../controllers/mentorApplicationController");

const router = express.Router();

router.post("/", submitMentorApplication);

module.exports = router;
