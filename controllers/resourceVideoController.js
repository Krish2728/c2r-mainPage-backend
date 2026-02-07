const { query } = require("../config/db");

function getYouTubeVideoId(input) {
  if (!input || typeof input !== "string") return "";
  const s = String(input).trim();
  if (/^[\w-]{10,12}$/.test(s)) return s;
  try {
    const short = s.match(/(?:youtu\.be\/)([\w-]+)/);
    if (short) return short[1];
    const url = new URL(s.startsWith("http") ? s : "https://" + s);
    if (url.hostname.replace("www.", "") === "youtube.com") {
      const v = url.searchParams.get("v");
      if (v) return v;
      const embed = url.pathname.match(/\/embed\/([\w-]+)/);
      if (embed) return embed[1];
    }
    if (url.hostname === "youtu.be") return url.pathname.slice(1).split("?")[0] || "";
  } catch (e) {}
  return s;
}

function isTableMissing(err) {
  return err && err.code === "42P01";
}

const listPublic = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, description, topic, video_id, sort_order
       FROM resource_videos
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    if (isTableMissing(err)) {
      console.error("Resource videos table missing. Run: npm run init-db");
      return res.status(503).json({
        message: "Resource videos not configured. Run database init (npm run init-db).",
        details: "relation \"resource_videos\" does not exist",
      });
    }
    console.error("Resource videos list error:", err);
    res.status(500).json({ message: "Failed to fetch resource videos" });
  }
};

const listAdmin = async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, description, topic, video_id, sort_order, created_at
       FROM resource_videos
       ORDER BY sort_order ASC, id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    if (isTableMissing(err)) {
      console.error("Resource videos table missing. Run: npm run init-db");
      return res.status(503).json({
        message: "Resource videos not configured. Run database init (npm run init-db).",
        details: "relation \"resource_videos\" does not exist",
      });
    }
    console.error("Admin resource videos list error:", err);
    res.status(500).json({ message: "Failed to fetch resource videos" });
  }
};

const create = async (req, res) => {
  try {
    const { title, description, topic, video_id, sort_order } = req.body;
    if (!title || !video_id) {
      return res.status(400).json({ message: "Title and video_id are required" });
    }
    const cleanVideoId = getYouTubeVideoId(video_id);
    if (!cleanVideoId || cleanVideoId.length < 10) return res.status(400).json({ message: "Invalid YouTube video ID or URL (use the 11-character video ID or a full YouTube link)" });
    const result = await query(
      `INSERT INTO resource_videos (title, description, topic, video_id, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, topic, video_id, sort_order, created_at`,
      [
        title || "",
        description || "",
        topic || "Career Development",
        cleanVideoId,
        typeof sort_order === "number" ? sort_order : 0,
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (isTableMissing(err)) {
      console.error("Resource videos table missing. Run: npm run init-db");
      return res.status(503).json({
        message: "Resource videos not configured. Run database init (npm run init-db).",
        details: "relation \"resource_videos\" does not exist",
      });
    }
    console.error("Create resource video error:", err);
    res.status(500).json({ message: "Failed to create resource video" });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, topic, video_id, sort_order } = req.body;
    const check = await query("SELECT id FROM resource_videos WHERE id = $1", [id]);
    if (!check.rows.length) {
      return res.status(404).json({ message: "Resource video not found" });
    }
    const updates = [];
    const values = [];
    let n = 1;
    if (title !== undefined) {
      updates.push(`title = $${n++}`);
      values.push(title);
    }
    if (description !== undefined) {
      updates.push(`description = $${n++}`);
      values.push(description);
    }
    if (topic !== undefined) {
      updates.push(`topic = $${n++}`);
      values.push(topic);
    }
    if (video_id !== undefined) {
      const cleanVideoId = getYouTubeVideoId(video_id);
      if (cleanVideoId && cleanVideoId.length >= 10) {
        updates.push(`video_id = $${n++}`);
        values.push(cleanVideoId);
      }
    }
    if (sort_order !== undefined) {
      updates.push(`sort_order = $${n++}`);
      values.push(Number(sort_order));
    }
    if (updates.length === 0) {
      const r = await query(
        "SELECT id, title, description, topic, video_id, sort_order, created_at FROM resource_videos WHERE id = $1",
        [id]
      );
      return res.json(r.rows[0]);
    }
    values.push(id);
    const result = await query(
      `UPDATE resource_videos SET ${updates.join(", ")} WHERE id = $${n} RETURNING id, title, description, topic, video_id, sort_order, created_at`,
      values
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (isTableMissing(err)) {
      console.error("Resource videos table missing. Run: npm run init-db");
      return res.status(503).json({
        message: "Resource videos not configured. Run database init (npm run init-db).",
        details: "relation \"resource_videos\" does not exist",
      });
    }
    console.error("Update resource video error:", err);
    res.status(500).json({ message: "Failed to update resource video" });
  }
};

const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("DELETE FROM resource_videos WHERE id = $1 RETURNING id", [id]);
    if (!result.rows.length) {
      return res.status(404).json({ message: "Resource video not found" });
    }
    res.status(204).send();
  } catch (err) {
    if (isTableMissing(err)) {
      console.error("Resource videos table missing. Run: npm run init-db");
      return res.status(503).json({
        message: "Resource videos not configured. Run database init (npm run init-db).",
        details: "relation \"resource_videos\" does not exist",
      });
    }
    console.error("Delete resource video error:", err);
    res.status(500).json({ message: "Failed to delete resource video" });
  }
};

module.exports = {
  listPublic,
  listAdmin,
  create,
  update,
  remove,
};
