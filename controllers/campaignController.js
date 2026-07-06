const { query } = require("../config/db");
const { normalizeCategory } = require("../constants/campaignSections");

function slugify(text) {
	return String(text || "")
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 120);
}

function rupeesToPaise(value) {
	return Math.round(Number(value || 0) * 100);
}

function paiseToRupees(paise) {
	return Number(paise || 0) / 100;
}

function normalizePresetAmounts(input) {
	if (!Array.isArray(input)) return [];
	return input
		.map((item) => {
			if (typeof item === "number") {
				return { amount: Math.round(item), label: "" };
			}
			const amount = Math.round(Number(item?.amount ?? item?.amount_rupees) || 0);
			if (amount < 500) return null;
			return {
				amount,
				label: String(item?.label || "").trim(),
			};
		})
		.filter(Boolean);
}

function parsePresetAmountsField(value) {
	if (Array.isArray(value)) return normalizePresetAmounts(value);
	return normalizePresetAmounts(
		String(value || "")
			.split("\n")
			.map((line) => line.trim())
			.filter(Boolean)
			.map((line) => {
				const parts = line.split("|").map((p) => p.trim());
				const amount = parseInt(parts[0], 10);
				if (!amount || amount < 500) return null;
				return { amount, label: parts[1] || "" };
			})
			.filter(Boolean)
	);
}

function mapCampaignRow(row) {
	if (!row) return null;
	const preset_amounts = normalizePresetAmounts(row.preset_amounts);
	return {
		...row,
		goal_amount: paiseToRupees(row.goal_amount_paise),
		raised_amount: paiseToRupees(row.raised_amount_paise),
		preset_amounts,
		progress_percent:
			row.goal_amount_paise > 0
				? Math.min(100, Math.round((row.raised_amount_paise / row.goal_amount_paise) * 100))
				: 0,
	};
}

async function loadCostItems(campaignId) {
	const result = await query(
		`SELECT id, campaign_id, item_name, description, quantity, unit_cost_paise, total_cost_paise, priority, sort_order
     FROM campaign_cost_items WHERE campaign_id = $1 ORDER BY sort_order ASC, priority ASC, id ASC`,
		[campaignId]
	);
	return result.rows.map((row) => ({
		...row,
		unit_cost: paiseToRupees(row.unit_cost_paise),
		total_cost: paiseToRupees(row.total_cost_paise),
	}));
}

async function loadProofs(campaignId, publicOnly = false) {
	const sql = publicOnly
		? `SELECT id, campaign_id, title, description, proof_type, media_url, amount_attributed_paise, visible_to_public, created_at
       FROM campaign_proofs WHERE campaign_id = $1 AND visible_to_public = true ORDER BY created_at DESC`
		: `SELECT id, campaign_id, title, description, proof_type, media_url, amount_attributed_paise, visible_to_public, created_at
       FROM campaign_proofs WHERE campaign_id = $1 ORDER BY created_at DESC`;
	const result = await query(sql, [campaignId]);
	return result.rows.map((row) => ({
		...row,
		amount_attributed: row.amount_attributed_paise ? paiseToRupees(row.amount_attributed_paise) : null,
	}));
}

async function replaceCostItems(campaignId, costItems = []) {
	await query("DELETE FROM campaign_cost_items WHERE campaign_id = $1", [campaignId]);
	let totalPaise = 0;
	for (let i = 0; i < costItems.length; i++) {
		const item = costItems[i];
		const qty = Math.max(1, Number(item.quantity) || 1);
		const unitPaise = rupeesToPaise(item.unit_cost ?? item.unit_cost_rupees);
		const totalItemPaise = item.total_cost_paise
			? Number(item.total_cost_paise)
			: unitPaise * qty;
		totalPaise += totalItemPaise;
		await query(
			`INSERT INTO campaign_cost_items
       (campaign_id, item_name, description, quantity, unit_cost_paise, total_cost_paise, priority, sort_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
			[
				campaignId,
				item.item_name || item.name || "Item",
				item.description || "",
				qty,
				unitPaise,
				totalItemPaise,
				Number(item.priority) || i + 1,
				Number(item.sort_order) ?? i,
			]
		);
	}
	return totalPaise;
}

const listPublic = async (req, res) => {
	try {
		const { category, featured, urgent } = req.query;
		const conditions = ["status = 'published'"];
		const values = [];
		if (category) {
			values.push(category);
			conditions.push(`category = $${values.length}`);
		}
		if (featured === "true") {
			conditions.push("is_featured = true");
		}
		if (urgent === "true") {
			conditions.push("is_urgent = true");
		}
		const result = await query(
			`SELECT id, slug, title, short_description, cover_image_url, category, location,
              beneficiary_label, goal_amount_paise, raised_amount_paise, donor_count,
              is_featured, is_urgent, published_at, preset_amounts
       FROM donation_campaigns
       WHERE ${conditions.join(" AND ")}
       ORDER BY is_urgent DESC, is_featured DESC, published_at DESC NULLS LAST, id DESC`,
			values
		);
		res.json(result.rows.map(mapCampaignRow));
	} catch (err) {
		console.error("Campaign list error:", err);
		res.status(500).json({ message: "Failed to fetch campaigns" });
	}
};

const getStats = async (req, res) => {
	try {
		const result = await query(`
      SELECT
        (SELECT COUNT(*)::int FROM donations WHERE status = 'completed') AS total_donors,
        (SELECT COALESCE(SUM(amount_paise), 0)::bigint FROM donations WHERE status = 'completed') AS total_raised_paise,
        (SELECT COUNT(*)::int FROM donation_campaigns WHERE status = 'published') AS active_campaigns
    `);
		const row = result.rows[0];
		res.json({
			total_donors: row.total_donors,
			total_raised: paiseToRupees(row.total_raised_paise),
			active_campaigns: row.active_campaigns,
		});
	} catch (err) {
		console.error("Campaign stats error:", err);
		res.status(500).json({ message: "Failed to fetch donation stats" });
	}
};

const getBySlug = async (req, res) => {
	try {
		const { slug } = req.params;
		const result = await query(
			`SELECT id, slug, title, short_description, full_story, cover_image_url, category, location,
              beneficiary_label, goal_amount_paise, raised_amount_paise, donor_count,
              is_featured, is_urgent, status, published_at, preset_amounts
       FROM donation_campaigns WHERE slug = $1 AND status = 'published'`,
			[slug]
		);
		if (!result.rows.length) {
			return res.status(404).json({ message: "Campaign not found" });
		}
		const campaign = mapCampaignRow(result.rows[0]);
		campaign.cost_items = await loadCostItems(campaign.id);
		campaign.proofs = await loadProofs(campaign.id, true);
		res.json(campaign);
	} catch (err) {
		console.error("Campaign detail error:", err);
		res.status(500).json({ message: "Failed to fetch campaign" });
	}
};

const listAdmin = async (req, res) => {
	try {
		const result = await query(
			`SELECT id, slug, title, short_description, cover_image_url, category, location,
              beneficiary_label, goal_amount_paise, raised_amount_paise, donor_count,
              status, is_featured, is_urgent, published_at, created_at, updated_at, preset_amounts
       FROM donation_campaigns ORDER BY created_at DESC`
		);
		res.json(result.rows.map(mapCampaignRow));
	} catch (err) {
		console.error("Admin campaign list error:", err);
		res.status(500).json({ message: "Failed to fetch campaigns" });
	}
};

const getAdminById = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await query("SELECT * FROM donation_campaigns WHERE id = $1", [id]);
		if (!result.rows.length) {
			return res.status(404).json({ message: "Campaign not found" });
		}
		const campaign = mapCampaignRow(result.rows[0]);
		campaign.cost_items = await loadCostItems(campaign.id);
		campaign.proofs = await loadProofs(campaign.id, false);
		res.json(campaign);
	} catch (err) {
		console.error("Admin campaign detail error:", err);
		res.status(500).json({ message: "Failed to fetch campaign" });
	}
};

const create = async (req, res) => {
	try {
		const {
			title,
			slug,
			short_description,
			full_story,
			cover_image_url,
			category,
			location,
			beneficiary_label,
			goal_amount_rupees,
			is_featured,
			is_urgent,
			cost_items,
			preset_amounts,
		} = req.body;
		if (!title) {
			return res.status(400).json({ message: "Title is required" });
		}
		const presetAmountsJson = JSON.stringify(parsePresetAmountsField(preset_amounts));
		let finalSlug = slugify(slug || title);
		const existing = await query("SELECT id FROM donation_campaigns WHERE slug = $1", [finalSlug]);
		if (existing.rows.length) {
			finalSlug = `${finalSlug}-${Date.now()}`;
		}
		let goalPaise = rupeesToPaise(goal_amount_rupees);
		const result = await query(
			`INSERT INTO donation_campaigns
       (slug, title, short_description, full_story, cover_image_url, category, location,
        beneficiary_label, goal_amount_paise, status, is_featured, is_urgent, preset_amounts)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'draft',$10,$11,$12)
       RETURNING *`,
			[
				finalSlug,
				title,
				short_description || "",
				full_story || "",
				cover_image_url || "",
				normalizeCategory(category),
				location || "",
				beneficiary_label || "",
				goalPaise,
				!!is_featured,
				!!is_urgent,
				presetAmountsJson,
			]
		);
		const campaign = result.rows[0];
		if (Array.isArray(cost_items) && cost_items.length) {
			const computedGoal = await replaceCostItems(campaign.id, cost_items);
			if (computedGoal > 0) {
				goalPaise = computedGoal;
				await query("UPDATE donation_campaigns SET goal_amount_paise = $1 WHERE id = $2", [
					goalPaise,
					campaign.id,
				]);
				campaign.goal_amount_paise = goalPaise;
			}
		}
		res.status(201).json(mapCampaignRow(campaign));
	} catch (err) {
		console.error("Create campaign error:", err);
		res.status(500).json({ message: "Failed to create campaign" });
	}
};

const update = async (req, res) => {
	try {
		const { id } = req.params;
		const check = await query("SELECT id FROM donation_campaigns WHERE id = $1", [id]);
		if (!check.rows.length) {
			return res.status(404).json({ message: "Campaign not found" });
		}
		const {
			title,
			slug,
			short_description,
			full_story,
			cover_image_url,
			category,
			location,
			beneficiary_label,
			goal_amount_rupees,
			is_featured,
			is_urgent,
			status,
			cost_items,
			preset_amounts,
		} = req.body;

		const updates = [];
		const values = [];
		let n = 1;
		const setField = (col, val) => {
			updates.push(`${col} = $${n++}`);
			values.push(val);
		};

		if (title !== undefined) setField("title", title);
		if (slug !== undefined) setField("slug", slugify(slug));
		if (short_description !== undefined) setField("short_description", short_description);
		if (full_story !== undefined) setField("full_story", full_story);
		if (cover_image_url !== undefined) setField("cover_image_url", cover_image_url);
		if (category !== undefined) setField("category", normalizeCategory(category));
		if (location !== undefined) setField("location", location);
		if (beneficiary_label !== undefined) setField("beneficiary_label", beneficiary_label);
		if (goal_amount_rupees !== undefined) setField("goal_amount_paise", rupeesToPaise(goal_amount_rupees));
		if (is_featured !== undefined) setField("is_featured", !!is_featured);
		if (is_urgent !== undefined) setField("is_urgent", !!is_urgent);
		if (status !== undefined) setField("status", status);
		if (preset_amounts !== undefined) {
			setField("preset_amounts", JSON.stringify(parsePresetAmountsField(preset_amounts)));
		}

		if (updates.length) {
			updates.push(`updated_at = NOW()`);
			values.push(id);
			await query(
				`UPDATE donation_campaigns SET ${updates.join(", ")} WHERE id = $${n}`,
				values
			);
		}

		if (Array.isArray(cost_items)) {
			const computedGoal = await replaceCostItems(id, cost_items);
			if (computedGoal > 0) {
				await query("UPDATE donation_campaigns SET goal_amount_paise = $1, updated_at = NOW() WHERE id = $2", [
					computedGoal,
					id,
				]);
			}
		}

		const result = await query("SELECT * FROM donation_campaigns WHERE id = $1", [id]);
		const campaign = mapCampaignRow(result.rows[0]);
		campaign.cost_items = await loadCostItems(id);
		campaign.proofs = await loadProofs(id, false);
		res.json(campaign);
	} catch (err) {
		console.error("Update campaign error:", err);
		res.status(500).json({ message: "Failed to update campaign" });
	}
};

const publish = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await query(
			`UPDATE donation_campaigns SET status = 'published', published_at = COALESCE(published_at, NOW()), updated_at = NOW()
       WHERE id = $1 RETURNING *`,
			[id]
		);
		if (!result.rows.length) {
			return res.status(404).json({ message: "Campaign not found" });
		}
		res.json(mapCampaignRow(result.rows[0]));
	} catch (err) {
		console.error("Publish campaign error:", err);
		res.status(500).json({ message: "Failed to publish campaign" });
	}
};

const remove = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await query("DELETE FROM donation_campaigns WHERE id = $1 RETURNING id", [id]);
		if (!result.rows.length) {
			return res.status(404).json({ message: "Campaign not found" });
		}
		res.status(204).send();
	} catch (err) {
		console.error("Delete campaign error:", err);
		res.status(500).json({ message: "Failed to delete campaign" });
	}
};

const addProof = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, description, proof_type, media_url, amount_attributed_rupees, visible_to_public } =
			req.body;
		if (!title || !media_url) {
			return res.status(400).json({ message: "Title and media URL are required" });
		}
		const check = await query("SELECT id FROM donation_campaigns WHERE id = $1", [id]);
		if (!check.rows.length) {
			return res.status(404).json({ message: "Campaign not found" });
		}
		const result = await query(
			`INSERT INTO campaign_proofs
       (campaign_id, title, description, proof_type, media_url, amount_attributed_paise, visible_to_public)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
			[
				id,
				title,
				description || "",
				proof_type || "photo",
				media_url,
				amount_attributed_rupees ? rupeesToPaise(amount_attributed_rupees) : null,
				visible_to_public !== false,
			]
		);
		const row = result.rows[0];
		res.status(201).json({
			...row,
			amount_attributed: row.amount_attributed_paise ? paiseToRupees(row.amount_attributed_paise) : null,
		});
	} catch (err) {
		console.error("Add proof error:", err);
		res.status(500).json({ message: "Failed to add proof" });
	}
};

const removeProof = async (req, res) => {
	try {
		const { proofId } = req.params;
		const result = await query("DELETE FROM campaign_proofs WHERE id = $1 RETURNING id", [proofId]);
		if (!result.rows.length) {
			return res.status(404).json({ message: "Proof not found" });
		}
		res.status(204).send();
	} catch (err) {
		console.error("Delete proof error:", err);
		res.status(500).json({ message: "Failed to delete proof" });
	}
};

module.exports = {
	listPublic,
	getStats,
	getBySlug,
	listAdmin,
	getAdminById,
	create,
	update,
	publish,
	remove,
	addProof,
	removeProof,
};
