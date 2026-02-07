const express = require("express");
const {
	loginAdmin,
	getEmails,
	getDonations,
	getStats,
} = require("../controllers/adminController");
const resourceVideoController = require("../controllers/resourceVideoController");
const { authenticateAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/emails", authenticateAdmin, getEmails);
router.get("/donations", authenticateAdmin, getDonations);
router.get("/stats", authenticateAdmin, getStats);

router.get("/resource-videos", authenticateAdmin, resourceVideoController.listAdmin);
router.post("/resource-videos", authenticateAdmin, resourceVideoController.create);
router.put("/resource-videos/:id", authenticateAdmin, resourceVideoController.update);
router.delete("/resource-videos/:id", authenticateAdmin, resourceVideoController.remove);

module.exports = router;
