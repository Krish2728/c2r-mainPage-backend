const express = require("express");
const {
	loginAdmin,
	getEmails,
	exportEmails,
	getDonations,
	getStats,
	getVolunteers,
} = require("../controllers/adminController");
const resourceVideoController = require("../controllers/resourceVideoController");
const careerGuideController = require("../controllers/careerGuideController");
const annualReportController = require("../controllers/annualReportController");
const mentorResourceController = require("../controllers/mentorResourceController");
const courseSignupController = require("../controllers/courseSignupController");
const { authenticateAdmin } = require("../middlewares/auth");

const router = express.Router();

router.post("/login", loginAdmin);
router.get("/emails", authenticateAdmin, getEmails);
router.get("/emails/export", authenticateAdmin, exportEmails);
router.get("/volunteers", authenticateAdmin, getVolunteers);
router.get("/donations", authenticateAdmin, getDonations);
router.get("/stats", authenticateAdmin, getStats);

router.get("/resource-videos", authenticateAdmin, resourceVideoController.listAdmin);
router.post("/resource-videos", authenticateAdmin, resourceVideoController.create);
router.put("/resource-videos/:id", authenticateAdmin, resourceVideoController.update);
router.delete("/resource-videos/:id", authenticateAdmin, resourceVideoController.remove);

router.get("/career-guides", authenticateAdmin, careerGuideController.listAdmin);
router.post("/career-guides", authenticateAdmin, careerGuideController.create);
router.put("/career-guides/:id", authenticateAdmin, careerGuideController.update);
router.delete("/career-guides/:id", authenticateAdmin, careerGuideController.remove);

router.get("/annual-reports", authenticateAdmin, annualReportController.listAdmin);
router.post("/annual-reports", authenticateAdmin, annualReportController.create);
router.put("/annual-reports/:id", authenticateAdmin, annualReportController.update);
router.delete("/annual-reports/:id", authenticateAdmin, annualReportController.remove);

router.get("/mentor-resources", authenticateAdmin, mentorResourceController.listAdmin);
router.post("/mentor-resources", authenticateAdmin, mentorResourceController.create);
router.put("/mentor-resources/:id", authenticateAdmin, mentorResourceController.update);
router.delete("/mentor-resources/:id", authenticateAdmin, mentorResourceController.remove);

router.get("/course-signups", authenticateAdmin, courseSignupController.listAdmin);

module.exports = router;
