const express = require("express");
const { listPublic } = require("../controllers/annualReportController");
const router = express.Router();
router.get("/", listPublic);
module.exports = router;
