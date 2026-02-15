const express = require("express");
const { listPublic } = require("../controllers/mentorResourceController");
const router = express.Router();
router.get("/", listPublic);
module.exports = router;
