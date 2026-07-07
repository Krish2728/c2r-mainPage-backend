const express = require("express");
const teamController = require("../controllers/teamController");

const router = express.Router();

router.get("/page", teamController.getPublicPage);

module.exports = router;
