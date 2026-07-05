import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

function toNotificationDTO(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isRead: !!row.is_read,
    createdAt: new Date(row.created_at).toISOString(),
    type: row.type,
  };
}

/**
 * GET /api/notifications
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC", [req.userId]);
    res.json({ notifications: rows.map(toNotificationDTO) });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil notifikasi." });
  }
});

/**
 * PATCH /api/notifications/:id/read
 */
router.patch("/:id/read", async (req, res) => {
  try {
    await pool.query("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?", [req.params.id, req.userId]);
    res.json({ success: true });
  } catch (err) {
    console.error("Mark notification read error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat menandai notifikasi." });
  }
});

export default router;
