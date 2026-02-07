require("dotenv").config();
const express = require("express");
const { pool } = require("./config/db");
const expressConfig = require("./config/expressConfig");
const routes = require("./routes");

const app = express();
const PORT = process.env.PORT || 4000;

expressConfig(app);

app.use("/api", routes);

app.use((err, req, res, next) => {
	console.error(err);
	res.status(500).json({ message: "Internal server error" });
});

pool
	.query("SELECT 1")
	.then(() => {
		console.log("✅ Database connected");
		app.listen(PORT, () => {
			console.log(`🚀 c2r-admin-backend running on http://localhost:${PORT}`);
			console.log(`   API: /api/contact, /api/partnership, /api/mentor-application, /api/donations`);
			console.log(`   Admin: POST /api/admin/login, GET /api/admin/emails, GET /api/admin/donations`);
		});
	})
	.catch((err) => {
		console.error("❌ Database connection failed:", err.message);
		process.exit(1);
	});
