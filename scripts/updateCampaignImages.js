/**
 * Update example campaign cover + proof images to curated Unsplash URLs.
 * Run: node scripts/updateCampaignImages.js
 */
require("dotenv").config();
const { pool } = require("../config/db");

const IMAGES = {
	"mentorship-kits-for-rural-students": {
		cover:
			"https://images.unsplash.com/photo-1623863568368-69e4cbe6cc0b?w=800&h=500&fit=crop&q=85&auto=format",
		proof:
			"https://images.unsplash.com/photo-1623303366639-0e330d7c3d9f?w=600&h=400&fit=crop&q=85&auto=format",
	},
	"fund-for-students-in-jharkhand": {
		cover:
			"https://images.unsplash.com/photo-1659985281435-d8d3ea55b55c?w=800&h=500&fit=crop&q=85&auto=format",
		proof:
			"https://images.unsplash.com/photo-1573894998033-c0cef4ed722b?w=600&h=400&fit=crop&q=85&auto=format",
	},
};

async function main() {
	const client = await pool.connect();
	try {
		for (const [slug, urls] of Object.entries(IMAGES)) {
			const res = await client.query(
				`UPDATE donation_campaigns SET cover_image_url = $1, updated_at = NOW()
         WHERE slug = $2 RETURNING id, title`,
				[urls.cover, slug]
			);
			if (!res.rows.length) {
				console.warn(`Campaign not found: ${slug}`);
				continue;
			}
			const campaignId = res.rows[0].id;
			console.log(`Updated cover: ${res.rows[0].title}`);

			await client.query(
				`UPDATE campaign_proofs SET media_url = $1
         WHERE campaign_id = $2 AND proof_type = 'photo'`,
				[urls.proof, campaignId]
			);

			const proofCount = await client.query(
				`SELECT COUNT(*)::int AS n FROM campaign_proofs WHERE campaign_id = $1`,
				[campaignId]
			);
			if (proofCount.rows[0].n === 0) {
				await client.query(
					`INSERT INTO campaign_proofs
           (campaign_id, title, description, proof_type, media_url, visible_to_public)
           VALUES ($1, 'Learning materials distributed', 'Students receiving notebooks and study kits.', 'photo', $2, true)`,
					[campaignId, urls.proof]
				);
				console.log(`  Added proof photo`);
			} else {
				console.log(`  Updated proof photo(s)`);
			}
		}
		console.log("Done.");
	} finally {
		client.release();
		await pool.end();
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
