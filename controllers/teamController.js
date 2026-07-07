const { query, pool } = require("../config/db");

function isTableMissing(err) {
	return err && err.code === "42P01";
}

function toPublicMember(row) {
	const member = {
		name: row.name,
		role: row.role,
		bio: row.bio,
		linkedinUrl: row.linkedin_url || "",
	};
	if (row.photo_url) member.photoUrl = row.photo_url;
	if (row.photo_class) member.photoClass = row.photo_class;
	return member;
}

function toAdminMember(row) {
	return {
		id: row.id,
		name: row.name,
		role: row.role,
		bio: row.bio,
		linkedinUrl: row.linkedin_url || "",
		photoUrl: row.photo_url || "",
		photoClass: row.photo_class || "",
		panelType: row.panel_type,
		categoryId: row.category_id,
		categoryTitle: row.category_title || null,
		sortOrder: row.sort_order,
		status: row.status,
		createdAt: row.created_at,
	};
}

async function fetchCategories(client = null) {
	const run = client ? client.query.bind(client) : query;
	const result = await run(
		`SELECT id, title, sort_order, is_additional, created_at
     FROM team_categories
     ORDER BY sort_order ASC, id ASC`
	);
	return result.rows;
}

async function fetchMembers(whereSql, params, client = null) {
	const run = client ? client.query.bind(client) : query;
	const result = await run(
		`SELECT m.id, m.name, m.role, m.bio, m.linkedin_url, m.photo_url, m.photo_class,
            m.panel_type, m.category_id, m.sort_order, m.status, m.created_at,
            c.title AS category_title
     FROM team_members m
     LEFT JOIN team_categories c ON c.id = m.category_id
     ${whereSql}
     ORDER BY m.sort_order ASC, m.id ASC`,
		params
	);
	return result.rows;
}

function buildPublicPage(categories, members) {
	const advisoryBuckets = new Map();
	for (const cat of categories) {
		if (!cat.is_additional) {
			advisoryBuckets.set(cat.id, { title: cat.title, members: [] });
		}
	}

	const coreTeam = [];
	const additionalAdvisors = [];

	for (const row of members) {
		const member = toPublicMember(row);
		if (row.panel_type === "core") {
			coreTeam.push(member);
			continue;
		}
		if (!row.category_id) continue;
		const cat = categories.find((c) => c.id === row.category_id);
		if (!cat) continue;
		if (cat.is_additional) {
			additionalAdvisors.push(member);
		} else {
			const bucket = advisoryBuckets.get(row.category_id);
			if (bucket) bucket.members.push(member);
		}
	}

	const advisoryCategories = categories
		.filter((c) => !c.is_additional)
		.map((c) => advisoryBuckets.get(c.id))
		.filter((c) => c && c.members.length > 0);

	return { coreTeam, advisoryCategories, additionalAdvisors };
}

const getPublicPage = async (req, res) => {
	try {
		const [categories, members] = await Promise.all([
			fetchCategories(),
			fetchMembers("WHERE m.status = 'published'", []),
		]);
		res.json(buildPublicPage(categories, members));
	} catch (err) {
		if (isTableMissing(err)) {
			return res.status(503).json({ message: "Team page not configured." });
		}
		console.error("Team page error:", err);
		res.status(500).json({ message: "Failed to fetch team page" });
	}
};

const listAdminMembers = async (req, res) => {
	try {
		const rows = await fetchMembers("", []);
		res.json(rows.map(toAdminMember));
	} catch (err) {
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Admin team list error:", err);
		res.status(500).json({ message: "Failed to fetch team members" });
	}
};

const listAdminCategories = async (req, res) => {
	try {
		const categories = await fetchCategories();
		res.json(
			categories.map((c) => ({
				id: c.id,
				title: c.title,
				sortOrder: c.sort_order,
				isAdditional: c.is_additional,
				createdAt: c.created_at,
			}))
		);
	} catch (err) {
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Admin categories list error:", err);
		res.status(500).json({ message: "Failed to fetch categories" });
	}
};

async function nextSortOrder(panelType, categoryId, client = null) {
	const run = client ? client.query.bind(client) : query;
	const result = await run(
		`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order
     FROM team_members
     WHERE panel_type = $1 AND (category_id IS NOT DISTINCT FROM $2)`,
		[panelType, categoryId ?? null]
	);
	return result.rows[0].next_order;
}

async function nextCategorySortOrder(client = null) {
	const run = client ? client.query.bind(client) : query;
	const result = await run(
		`SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM team_categories`
	);
	return result.rows[0].next_order;
}

const createMember = async (req, res) => {
	try {
		const {
			name,
			role,
			bio,
			linkedin_url,
			linkedinUrl,
			photo_url,
			photoUrl,
			photo_class,
			photoClass,
			panel_type,
			panelType,
			category_id,
			categoryId,
			status,
		} = req.body;

		const panel = panel_type || panelType || "core";
		const catId = category_id ?? categoryId ?? null;
		const linkedin = (linkedin_url || linkedinUrl || "").trim();
		const photo = (photo_url || photoUrl || "").trim();
		const photoCls = (photo_class || photoClass || "").trim();

		if (!name?.trim() || !role?.trim() || !bio?.trim()) {
			return res.status(400).json({ message: "Name, title, and bio are required" });
		}
		if (panel === "advisory" && !catId) {
			return res.status(400).json({ message: "Advisory members require a section" });
		}
		if (panel === "core" && catId) {
			return res.status(400).json({ message: "Core team members cannot belong to a section" });
		}

		if (catId) {
			const catCheck = await query("SELECT id, is_additional FROM team_categories WHERE id = $1", [
				catId,
			]);
			if (!catCheck.rows.length) {
				return res.status(400).json({ message: "Section not found" });
			}
		}

		const sortOrder = await nextSortOrder(panel, catId);
		const memberStatus = status === "draft" ? "draft" : "published";

		const result = await query(
			`INSERT INTO team_members
       (name, role, bio, linkedin_url, photo_url, photo_class, panel_type, category_id, sort_order, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING id`,
			[
				name.trim(),
				role.trim(),
				bio.trim(),
				linkedin,
				photo || null,
				photoCls || null,
				panel,
				catId,
				sortOrder,
				memberStatus,
			]
		);

		const rows = await fetchMembers("WHERE m.id = $1", [result.rows[0].id]);
		res.status(201).json(toAdminMember(rows[0]));
	} catch (err) {
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Create team member error:", err);
		res.status(500).json({ message: "Failed to create team member" });
	}
};

const updateMember = async (req, res) => {
	try {
		const { id } = req.params;
		const check = await query("SELECT id FROM team_members WHERE id = $1", [id]);
		if (!check.rows.length) return res.status(404).json({ message: "Team member not found" });

		const body = req.body;
		const updates = [];
		const values = [];
		let n = 1;

		const setField = (col, val) => {
			if (val === undefined) return;
			updates.push(`${col} = $${n++}`);
			values.push(val);
		};

		if (body.name !== undefined) setField("name", String(body.name).trim());
		if (body.role !== undefined) setField("role", String(body.role).trim());
		if (body.bio !== undefined) setField("bio", String(body.bio).trim());
		if (body.linkedin_url !== undefined || body.linkedinUrl !== undefined) {
			setField("linkedin_url", String(body.linkedin_url ?? body.linkedinUrl ?? "").trim());
		}
		if (body.photo_url !== undefined || body.photoUrl !== undefined) {
			const photo = String(body.photo_url ?? body.photoUrl ?? "").trim();
			setField("photo_url", photo || null);
		}
		if (body.photo_class !== undefined || body.photoClass !== undefined) {
			const cls = String(body.photo_class ?? body.photoClass ?? "").trim();
			setField("photo_class", cls || null);
		}
		if (body.status !== undefined) {
			setField("status", body.status === "draft" ? "draft" : "published");
		}
		if (body.panel_type !== undefined || body.panelType !== undefined) {
			const panel = body.panel_type || body.panelType;
			setField("panel_type", panel === "advisory" ? "advisory" : "core");
		}
		if (body.category_id !== undefined || body.categoryId !== undefined) {
			const catId = body.category_id ?? body.categoryId;
			setField("category_id", catId === null || catId === "" ? null : Number(catId));
		}
		if (body.sort_order !== undefined || body.sortOrder !== undefined) {
			setField("sort_order", Number(body.sort_order ?? body.sortOrder));
		}

		if (updates.length === 0) {
			const rows = await fetchMembers("WHERE m.id = $1", [id]);
			return res.json(toAdminMember(rows[0]));
		}

		values.push(id);
		await query(`UPDATE team_members SET ${updates.join(", ")} WHERE id = $${n}`, values);
		const rows = await fetchMembers("WHERE m.id = $1", [id]);
		res.json(toAdminMember(rows[0]));
	} catch (err) {
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Update team member error:", err);
		res.status(500).json({ message: "Failed to update team member" });
	}
};

const removeMember = async (req, res) => {
	try {
		const { id } = req.params;
		const result = await query("DELETE FROM team_members WHERE id = $1 RETURNING id", [id]);
		if (!result.rows.length) return res.status(404).json({ message: "Team member not found" });
		res.status(204).send();
	} catch (err) {
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Delete team member error:", err);
		res.status(500).json({ message: "Failed to delete team member" });
	}
};

function memberId(value) {
	return Number(value);
}

async function renumberSortOrder(client, table, ids) {
	for (let i = 0; i < ids.length; i++) {
		await client.query(`UPDATE ${table} SET sort_order = $1 WHERE id = $2`, [i, ids[i]]);
	}
}

const moveMember = async (req, res) => {
	const client = await pool.connect();
	try {
		const id = memberId(req.params.id);
		const direction = req.body.direction === "down" ? "down" : "up";

		await client.query("BEGIN");
		const currentRes = await client.query(
			`SELECT id, panel_type, category_id FROM team_members WHERE id = $1 FOR UPDATE`,
			[id]
		);
		if (!currentRes.rows.length) {
			await client.query("ROLLBACK");
			return res.status(404).json({ message: "Team member not found" });
		}
		const current = currentRes.rows[0];

		const peersRes = await client.query(
			`SELECT id FROM team_members
       WHERE panel_type = $1 AND (category_id IS NOT DISTINCT FROM $2)
       ORDER BY sort_order ASC, id ASC`,
			[current.panel_type, current.category_id]
		);
		const ids = peersRes.rows.map((row) => memberId(row.id));
		const idx = ids.indexOf(memberId(current.id));
		if (idx < 0) {
			await client.query("ROLLBACK");
			return res.status(404).json({ message: "Team member not found in group" });
		}

		const swapIdx = direction === "up" ? idx - 1 : idx + 1;
		if (swapIdx >= 0 && swapIdx < ids.length) {
			[ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
			await renumberSortOrder(client, "team_members", ids);
		}

		await client.query("COMMIT");

		const rows = await fetchMembers("WHERE m.id = $1", [id]);
		if (!rows.length) return res.status(404).json({ message: "Team member not found" });
		res.json(toAdminMember(rows[0]));
	} catch (err) {
		try {
			await client.query("ROLLBACK");
		} catch (_) {
			/* ignore */
		}
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Move team member error:", err);
		res.status(500).json({ message: "Failed to reorder team member" });
	} finally {
		client.release();
	}
};

const createCategory = async (req, res) => {
	try {
		const { title, is_additional, isAdditional } = req.body;
		if (!title?.trim()) return res.status(400).json({ message: "Section title is required" });
		const sortOrder = await nextCategorySortOrder();
		const additional = !!(is_additional ?? isAdditional);
		const result = await query(
			`INSERT INTO team_categories (title, sort_order, is_additional)
       VALUES ($1, $2, $3)
       RETURNING id, title, sort_order, is_additional, created_at`,
			[title.trim(), sortOrder, additional]
		);
		const row = result.rows[0];
		res.status(201).json({
			id: row.id,
			title: row.title,
			sortOrder: row.sort_order,
			isAdditional: row.is_additional,
			createdAt: row.created_at,
		});
	} catch (err) {
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Create category error:", err);
		res.status(500).json({ message: "Failed to create section" });
	}
};

const updateCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const { title, sort_order, sortOrder, is_additional, isAdditional } = req.body;
		const check = await query("SELECT id FROM team_categories WHERE id = $1", [id]);
		if (!check.rows.length) return res.status(404).json({ message: "Section not found" });

		const updates = [];
		const values = [];
		let n = 1;
		if (title !== undefined) {
			updates.push(`title = $${n++}`);
			values.push(String(title).trim());
		}
		if (sort_order !== undefined || sortOrder !== undefined) {
			updates.push(`sort_order = $${n++}`);
			values.push(Number(sort_order ?? sortOrder));
		}
		if (is_additional !== undefined || isAdditional !== undefined) {
			updates.push(`is_additional = $${n++}`);
			values.push(!!(is_additional ?? isAdditional));
		}
		if (!updates.length) {
			const categories = await fetchCategories();
			const row = categories.find((c) => c.id === Number(id));
			return res.json({
				id: row.id,
				title: row.title,
				sortOrder: row.sort_order,
				isAdditional: row.is_additional,
				createdAt: row.created_at,
			});
		}
		values.push(id);
		const result = await query(
			`UPDATE team_categories SET ${updates.join(", ")} WHERE id = $${n}
       RETURNING id, title, sort_order, is_additional, created_at`,
			values
		);
		const row = result.rows[0];
		res.json({
			id: row.id,
			title: row.title,
			sortOrder: row.sort_order,
			isAdditional: row.is_additional,
			createdAt: row.created_at,
		});
	} catch (err) {
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Update category error:", err);
		res.status(500).json({ message: "Failed to update section" });
	}
};

const removeCategory = async (req, res) => {
	try {
		const { id } = req.params;
		const count = await query(
			"SELECT COUNT(*)::int AS n FROM team_members WHERE category_id = $1",
			[id]
		);
		if (count.rows[0].n > 0) {
			return res.status(400).json({
				message: "Cannot delete a section that still has members. Reassign or delete them first.",
			});
		}
		const result = await query("DELETE FROM team_categories WHERE id = $1 RETURNING id", [id]);
		if (!result.rows.length) return res.status(404).json({ message: "Section not found" });
		res.status(204).send();
	} catch (err) {
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Delete category error:", err);
		res.status(500).json({ message: "Failed to delete section" });
	}
};

const moveCategory = async (req, res) => {
	const client = await pool.connect();
	try {
		const id = memberId(req.params.id);
		const direction = req.body.direction === "down" ? "down" : "up";

		await client.query("BEGIN");
		const currentRes = await client.query(
			`SELECT id FROM team_categories WHERE id = $1 FOR UPDATE`,
			[id]
		);
		if (!currentRes.rows.length) {
			await client.query("ROLLBACK");
			return res.status(404).json({ message: "Section not found" });
		}

		const peersRes = await client.query(
			`SELECT id FROM team_categories ORDER BY sort_order ASC, id ASC`
		);
		const ids = peersRes.rows.map((row) => memberId(row.id));
		const idx = ids.indexOf(id);
		if (idx < 0) {
			await client.query("ROLLBACK");
			return res.status(404).json({ message: "Section not found" });
		}

		const swapIdx = direction === "up" ? idx - 1 : idx + 1;
		if (swapIdx >= 0 && swapIdx < ids.length) {
			[ids[idx], ids[swapIdx]] = [ids[swapIdx], ids[idx]];
			await renumberSortOrder(client, "team_categories", ids);
		}

		await client.query("COMMIT");

		const categories = await fetchCategories();
		const row = categories.find((c) => memberId(c.id) === id);
		if (!row) return res.status(404).json({ message: "Section not found" });
		res.json({
			id: row.id,
			title: row.title,
			sortOrder: row.sort_order,
			isAdditional: row.is_additional,
			createdAt: row.created_at,
		});
	} catch (err) {
		try {
			await client.query("ROLLBACK");
		} catch (_) {
			/* ignore */
		}
		if (isTableMissing(err)) return res.status(503).json({ message: "Team not configured." });
		console.error("Move category error:", err);
		res.status(500).json({ message: "Failed to reorder section" });
	} finally {
		client.release();
	}
};

module.exports = {
	getPublicPage,
	listAdminMembers,
	listAdminCategories,
	createMember,
	updateMember,
	removeMember,
	moveMember,
	createCategory,
	updateCategory,
	removeCategory,
	moveCategory,
};
