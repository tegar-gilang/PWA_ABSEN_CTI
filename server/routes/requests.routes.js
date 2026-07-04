import { Router } from "express";
import { randomUUID } from "crypto";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function toRequestDTO(row) {
  return {
    id: row.id,
    type: row.type,
    reason: row.reason,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date,
    status: row.status,
    attachmentUrl: row.attachment_url || undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * GET /api/requests
 * Mengambil daftar pengajuan milik user, terbaru lebih dulu.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM requests WHERE user_id = ? ORDER BY created_at DESC", [req.userId]);
    res.json({ requests: rows.map(toRequestDTO) });
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil daftar pengajuan." });
  }
});

/**
 * POST /api/requests
 * Body: { type, reason, date, attachmentUrl? }
 */
router.post("/", async (req, res) => {
  try {
    const { type, reason, date, attachmentUrl } = req.body;
    if (!type || !reason || !date) {
      return res.status(400).json({ message: "Jenis, alasan, dan tanggal pengajuan wajib diisi." });
    }

    const id = randomUUID();
    await pool.query(
      `INSERT INTO requests (id, user_id, type, reason, date, attachment_url) VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.userId, type, reason, date, attachmentUrl || null],
    );

    const [rows] = await pool.query("SELECT * FROM requests WHERE id = ?", [id]);
    res.status(201).json({ request: toRequestDTO(rows[0]) });
  } catch (err) {
    console.error("Submit request error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengirim pengajuan." });
  }
});

export default router;
