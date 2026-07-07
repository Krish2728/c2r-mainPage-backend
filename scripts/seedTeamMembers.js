/**
 * Seed team_members + team_categories from constants/teamSeedData.js (idempotent when table empty).
 * Run: npm run seed-team
 */
require("dotenv").config();
const { pool } = require("../config/db");
const seed = require("../constants/teamSeedData");

async function seedTeamData(client) {
	const countRes = await client.query("SELECT COUNT(*)::int AS n FROM team_members");
	if (countRes.rows[0].n > 0) {
		return false;
	}

	const categoryIdByTitle = new Map();
	for (const cat of seed.categories) {
		const res = await client.query(
			`INSERT INTO team_categories (title, sort_order, is_additional)
       VALUES ($1, $2, $3)
       RETURNING id, title`,
			[cat.title, cat.sortOrder, !!cat.isAdditional]
		);
		categoryIdByTitle.set(res.rows[0].title, res.rows[0].id);
	}

	const sortCounters = new Map();
	const groupKey = (panelType, categoryTitle) =>
		`${panelType}:${categoryTitle || "core"}`;

	for (const member of seed.members) {
		const key = groupKey(member.panelType, member.categoryTitle);
		const order = sortCounters.get(key) ?? 0;
		sortCounters.set(key, order + 1);

		const categoryId =
			member.panelType === "advisory" && member.categoryTitle
				? categoryIdByTitle.get(member.categoryTitle)
				: null;

		await client.query(
			`INSERT INTO team_members
       (name, role, bio, linkedin_url, photo_url, photo_class, panel_type, category_id, sort_order, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'published')`,
			[
				member.name,
				member.role,
				member.bio,
				member.linkedinUrl || "",
				member.photoUrl || null,
				member.photoClass || null,
				member.panelType,
				categoryId,
				order,
			]
		);
	}

	return true;
}

async function main() {
	const client = await pool.connect();
	try {
		await client.query("BEGIN");
		const seeded = await seedTeamData(client);
		await client.query("COMMIT");
		if (seeded) {
			console.log(
				`✅ Seeded ${seed.members.length} team members and ${seed.categories.length} sections.`
			);
		} else {
			console.log("Team members already exist — skipping seed.");
		}
	} catch (err) {
		await client.query("ROLLBACK");
		console.error("Seed team error:", err);
		process.exit(1);
	} finally {
		client.release();
		await pool.end();
	}
}

module.exports = { seedTeamData };

if (require.main === module) {
	main();
}
