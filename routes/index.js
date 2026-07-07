const express = require("express");
const contactRoutes = require("./contactRoutes");
const partnershipRoutes = require("./partnershipRoutes");
const volunteerRoutes = require("./volunteerRoutes");
const lifetimeMembershipRoutes = require("./lifetimeMembershipRoutes");
const mentorApplicationRoutes = require("./mentorApplicationRoutes");
const donationRoutes = require("./donationRoutes");
const adminRoutes = require("./adminRoutes");
const resourceVideoRoutes = require("./resourceVideoRoutes");
const careerGuideRoutes = require("./careerGuideRoutes");
const annualReportRoutes = require("./annualReportRoutes");
const mentorResourceRoutes = require("./mentorResourceRoutes");
const courseSignupRoutes = require("./courseSignupRoutes");
const campaignRoutes = require("./campaignRoutes");
const teamRoutes = require("./teamRoutes");

const router = express.Router();

router.use("/contact", contactRoutes);
router.use("/partnership", partnershipRoutes);
router.use("/volunteer", volunteerRoutes);
router.use("/lifetime-membership", lifetimeMembershipRoutes);
router.use("/mentor-application", mentorApplicationRoutes);
router.use("/donations", donationRoutes);
router.use("/campaigns", campaignRoutes);
router.use("/team", teamRoutes);
router.use("/resource-videos", resourceVideoRoutes);
router.use("/career-guides", careerGuideRoutes);
router.use("/annual-reports", annualReportRoutes);
router.use("/mentor-resources", mentorResourceRoutes);
router.use("/course-signups", courseSignupRoutes);
router.use("/admin", adminRoutes);

router.get("/health", (req, res) => res.json({ status: "ok", service: "c2r-admin-backend" }));

module.exports = router;
