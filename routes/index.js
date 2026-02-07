const express = require("express");
const contactRoutes = require("./contactRoutes");
const partnershipRoutes = require("./partnershipRoutes");
const mentorApplicationRoutes = require("./mentorApplicationRoutes");
const donationRoutes = require("./donationRoutes");
const adminRoutes = require("./adminRoutes");
const resourceVideoRoutes = require("./resourceVideoRoutes");

const router = express.Router();

router.use("/contact", contactRoutes);
router.use("/partnership", partnershipRoutes);
router.use("/mentor-application", mentorApplicationRoutes);
router.use("/donations", donationRoutes);
router.use("/resource-videos", resourceVideoRoutes);
router.use("/admin", adminRoutes);

router.get("/health", (req, res) => res.json({ status: "ok", service: "c2r-admin-backend" }));

module.exports = router;
