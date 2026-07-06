const express = require("express");
const campaignController = require("../controllers/campaignController");

const router = express.Router();

router.get("/stats", campaignController.getStats);
router.get("/", campaignController.listPublic);
router.get("/:slug", campaignController.getBySlug);

module.exports = router;
