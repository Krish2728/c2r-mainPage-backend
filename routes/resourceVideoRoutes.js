const express = require("express");
const { listPublic } = require("../controllers/resourceVideoController");

const router = express.Router();
router.get("/", listPublic);

module.exports = router;
