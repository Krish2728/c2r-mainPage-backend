const { query } = require("../config/db");

function isTableMissing(err) {
  return err && err.code === "42P01";
}

const listPublic = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, year, title, description, pdf_url, sort_order
       FROM annual_reports
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Annual reports not configured." });
    console.error("Annual reports list error:", err);
    res.status(500).json({ message: "Failed to fetch annual reports" });
  }
};

const listAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, year, title, description, pdf_url, sort_order, created_at
       FROM annual_reports
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Annual reports not configured." });
    console.error("Admin annual reports list error:", err);
    res.status(500).json({ message: "Failed to fetch annual reports" });
  }
};

const create = async (req, res) => {
  try {
    const { year, title, description, pdf_url, sort_order } = req.body;
    if (!title || !pdf_url) {
      return res.status(400).json({ message: "Title and pdf_url are required" });
    }
    const result = await query(
      `INSERT INTO annual_reports (year, title, description, pdf_url, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, year, title, description, pdf_url, sort_order, created_at`,
      [
        String(year || new Date().getFullYear()).trim(),
        title.trim(),
        description || "",
        String(pdf_url).trim(),
        typeof sort_order === "number" ? sort_order : 0,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Annual reports not configured." });
    console.error("Create annual report error:", err);
    res.status(500).json({ message: "Failed to create annual report" });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { year, title, description, pdf_url, sort_order } = req.body;
    const check = await query("SELECT id FROM annual_reports WHERE id = $1", [id]);
    if (!check.rows.length) return res.status(404).json({ message: "Annual report not found" });
    const updates = [];
    const values = [];
    let n = 1;
    if (year !== undefined) { updates.push(`year = $${n++}`); values.push(String(year).trim()); }
    if (title !== undefined) { updates.push(`title = $${n++}`); values.push(title); }
    if (description !== undefined) { updates.push(`description = $${n++}`); values.push(description); }
    if (pdf_url !== undefined) { updates.push(`pdf_url = $${n++}`); values.push(String(pdf_url).trim()); }
    if (sort_order !== undefined) { updates.push(`sort_order = $${n++}`); values.push(Number(sort_order)); }
    if (updates.length === 0) {
      const r = await query("SELECT id, year, title, description, pdf_url, sort_order, created_at FROM annual_reports WHERE id = $1", [id]);
      return res.json(r.rows[0]);
    }
    values.push(id);
    const result = await query(
      `UPDATE annual_reports SET ${updates.join(", ")} WHERE id = $${n} RETURNING id, year, title, description, pdf_url, sort_order, created_at`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Annual reports not configured." });
    console.error("Update annual report error:", err);
    res.status(500).json({ message: "Failed to update annual report" });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM annual_reports WHERE id = $1 RETURNING id", [id]);
    if (!result.rows.length) return res.status(404).json({ message: "Annual report not found" });
    res.status(204).send();
  } catch (err) {
    if (isTableMissing(err)) return res.status(503).json({ message: "Annual reports not configured." });
    console.error("Delete annual report error:", err);
    res.status(500).json({ message: "Failed to delete annual report" });
  }
};

module.exports = { listPublic, listAdmin, create, update, remove };
