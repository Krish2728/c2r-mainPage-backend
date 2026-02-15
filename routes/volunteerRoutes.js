const express = require("express");
const { submitVolunteer } = require("../controllers/volunteerController");

const router = express.Router();

router.post("/", submitVolunteer);

module.exports = router;
