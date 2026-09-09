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
    endDate: row.end_date ? (row.end_date instanceof Date ? row.end_date.toISOString().slice(0, 10) : row.end_date) : undefined,
    status: row.status,
    attachmentUrl: row.attachment_url || undefined,
    rejectionReason: row.rejection_reason || undefined,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * GET /api/requests
 * Mengambil daftar pengajuan milik user, terbaru lebih dulu.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, user_id, type, reason, 
              DATE_FORMAT(date, '%Y-%m-%d') as date, 
              DATE_FORMAT(end_date, '%Y-%m-%d') as end_date, 
              status, rejection_reason, attachment_url, created_at 
       FROM requests 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [req.userId]
    );
    res.json({ requests: rows.map(toRequestDTO) });
  } catch (err) {
    console.error("Get requests error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil daftar pengajuan." });
  }
});

/**
 * POST /api/requests
 * Body: { type, reason, date, endDate?, startDate?, attachmentUrl? }
 */
router.post("/", async (req, res) => {
  try {
    const { type, reason, date, endDate, startDate, attachmentUrl } = req.body;
    const reqStartDate = startDate || date;
    const reqEndDate = endDate || reqStartDate;

    if (!type || !reason || !reqStartDate) {
      return res.status(400).json({ message: "Jenis, alasan, dan tanggal pengajuan wajib diisi." });
    }

    const id = randomUUID();
    await pool.query(
      `INSERT INTO requests (id, user_id, type, reason, date, end_date, attachment_url) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, type, reason, reqStartDate, reqEndDate !== reqStartDate ? reqEndDate : null, attachmentUrl || null],
    );

    const [rows] = await pool.query(
      `SELECT id, user_id, type, reason, 
              DATE_FORMAT(date, '%Y-%m-%d') as date, 
              DATE_FORMAT(end_date, '%Y-%m-%d') as end_date, 
              status, rejection_reason, attachment_url, created_at 
       FROM requests 
       WHERE id = ?`,
      [id]
    );
    res.status(201).json({ request: toRequestDTO(rows[0]) });
  } catch (err) {
    console.error("Submit request error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengirim pengajuan." });
  }
});

export default router;
