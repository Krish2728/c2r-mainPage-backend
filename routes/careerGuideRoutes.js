const express = require("express");
const { listPublic } = require("../controllers/careerGuideController");
const router = express.Router();
router.get("/", listPublic);
module.exports = router;
