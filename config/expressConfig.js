const express = require("express");
const cors = require("cors");
const path = require("path");

const publicDir = path.join(__dirname, "../public");
const adminPortalDir = path.join(publicDir, "admin-portal");

const expressConfig = (app) => {
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	const corsOrigin = (process.env.CORS_ORIGIN || "").trim();
	const allowedOrigins = corsOrigin
		? corsOrigin.split(",").map((o) => o.trim()).filter(Boolean)
		: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"];
	app.use(
		cors({
			origin: (origin, cb) => {
				if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
				cb(null, false);
			},
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization", "Accept"],
			credentials: true,
			optionsSuccessStatus: 204,
		})
	);

	app.get("/admin.html", (_req, res) => {
		res.redirect(301, "/admin-portal/");
	});

	app.use("/admin-portal", express.static(adminPortalDir));
	app.get(/^\/admin-portal(\/.*)?$/, (req, res, next) => {
		if (/\.[a-zA-Z0-9]+$/.test(req.path)) return next();
		res.sendFile(path.join(adminPortalDir, "index.html"));
	});

	app.use(express.static(publicDir));
};

module.exports = expressConfig;
