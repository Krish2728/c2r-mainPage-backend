/**
 * Create the c2r_admin database. Connects to default 'postgres' DB first.
 * Run once: node scripts/createDb.js
 * Usage: POSTGRES_URL=postgres://postgres:password@localhost:5432/postgres node scripts/createDb.js
 */
require("dotenv").config();
const { Client } = require("pg");

const connectionString =
	process.env.POSTGRES_URL || "postgres://postgres:NewPassword123@localhost:5432/postgres";
const dbName = "c2r_admin";

async function createDb() {
	const client = new Client({
		connectionString,
	});
	try {
		await client.connect();
		// Check if DB exists (pg doesn't have CREATE DATABASE IF NOT EXISTS)
		const check = await client.query(
			"SELECT 1 FROM pg_database WHERE datname = $1",
			[dbName]
		);
		if (check.rows.length > 0) {
			console.log(`✅ Database "${dbName}" already exists.`);
			return;
		}
		await client.query(`CREATE DATABASE ${dbName}`);
		console.log(`✅ Database "${dbName}" created successfully.`);
	} catch (err) {
		console.error("Create DB error:", err.message);
		process.exit(1);
	} finally {
		await client.end();
	}
}

createDb();
