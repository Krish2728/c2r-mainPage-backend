const { query } = require("../config/db");

function isTableMissing(err) {
  return err && err.code === "42P01";
}

const listPublic = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, description, category, pdf_url, sort_order
       FROM career_guides
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Career guides not configured." });
    console.error("Career guides list error:", err);
    res.status(500).json({ message: "Failed to fetch career guides" });
  }
};

const listAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, description, category, pdf_url, sort_order, created_at
       FROM career_guides
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Career guides not configured." });
    console.error("Admin career guides list error:", err);
    res.status(500).json({ message: "Failed to fetch career guides" });
  }
};

const create = async (req, res) => {
  try {
    const { title, description, category, pdf_url, sort_order } = req.body;
    if (!title || !pdf_url) {
      return res.status(400).json({ message: "Title and pdf_url are required" });
    }
    const result = await query(
      `INSERT INTO career_guides (title, description, category, pdf_url, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, category, pdf_url, sort_order, created_at`,
      [
        title.trim(),
        description || "",
        (category || "Career Prep").trim(),
        String(pdf_url).trim(),
        typeof sort_order === "number" ? sort_order : 0,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Career guides not configured." });
    console.error("Create career guide error:", err);
    res.status(500).json({ message: "Failed to create career guide" });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, pdf_url, sort_order } = req.body;
    const check = await query("SELECT id FROM career_guides WHERE id = $1", [id]);
    if (!check.rows.length) return res.status(404).json({ message: "Career guide not found" });
    const updates = [];
    const values = [];
    let n = 1;
    if (title !== undefined) { updates.push(`title = $${n++}`); values.push(title); }
    if (description !== undefined) { updates.push(`description = $${n++}`); values.push(description); }
    if (category !== undefined) { updates.push(`category = $${n++}`); values.push(category); }
    if (pdf_url !== undefined) { updates.push(`pdf_url = $${n++}`); values.push(String(pdf_url).trim()); }
    if (sort_order !== undefined) { updates.push(`sort_order = $${n++}`); values.push(Number(sort_order)); }
    if (updates.length === 0) {
      const r = await query("SELECT id, title, description, category, pdf_url, sort_order, created_at FROM career_guides WHERE id = $1", [id]);
      return res.json(r.rows[0]);
    }
    values.push(id);
    const result = await query(
      `UPDATE career_guides SET ${updates.join(", ")} WHERE id = $${n} RETURNING id, title, description, category, pdf_url, sort_order, created_at`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Career guides not configured." });
    console.error("Update career guide error:", err);
    res.status(500).json({ message: "Failed to update career guide" });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM career_guides WHERE id = $1 RETURNING id", [id]);
    if (!result.rows.length) return res.status(404).json({ message: "Career guide not found" });
    res.status(204).send();
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Career guides not configured." });
    console.error("Delete career guide error:", err);
    res.status(500).json({ message: "Failed to delete career guide" });
  }
};

module.exports = { listPublic, listAdmin, create, update, remove };
