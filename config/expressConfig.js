const express = require("express");
const cors = require("cors");
const path = require("path");

const expressConfig = (app) => {
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	const corsOrigin = (process.env.CORS_ORIGIN || "").trim();
	const allowedOrigins = corsOrigin
		? corsOrigin.split(",").map((o) => o.trim()).filter(Boolean)
		: ["http://localhost:3000", "http://localhost:5173"];
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
	app.use(express.static(path.join(__dirname, "../public")));
};

module.exports = expressConfig;
