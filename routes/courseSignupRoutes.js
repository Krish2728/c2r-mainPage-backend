const express = require("express");
const { create, checkEmail } = require("../controllers/courseSignupController");
const router = express.Router();
router.post("/", create);
router.get("/check", checkEmail);
module.exports = router;
