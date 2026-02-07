const express = require("express");
const cors = require("cors");
const path = require("path");

const expressConfig = (app) => {
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));
	app.use(
		cors({
			origin: ["http://localhost:3000", "http://localhost:5173"],
			methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization", "Accept"],
			credentials: true,
			optionsSuccessStatus: 204,
		})
	);
	app.use(express.static(path.join(__dirname, "../public")));
};

module.exports = expressConfig;
