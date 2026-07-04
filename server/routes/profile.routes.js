import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { toUserDTO } from "./auth.routes.js";

const router = Router();
router.use(requireAuth);

/**
 * GET /api/profile
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    res.json({ user: toUserDTO(rows[0]) });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil profil." });
  }
});

/**
 * PATCH /api/profile
 * Body bisa berisi sebagian field: phone, emergencyContact, photoUrl, name, department, position, email, schedule
 */
router.patch("/", async (req, res) => {
  try {
    const allowedFields = {
      phone: "phone",
      emergencyContact: "emergency_contact",
      photoUrl: "photo_url",
      name: "name",
      department: "department",
      position: "position",
      email: "email",
      schedule: "schedule",
    };

    const updates = [];
    const values = [];
    for (const [key, column] of Object.entries(allowedFields)) {
      if (req.body[key] !== undefined) {
        updates.push(`${column} = ?`);
        values.push(req.body[key]);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Tidak ada data yang diperbarui." });
    }

    values.push(req.userId);
    await pool.query(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    res.json({ user: toUserDTO(rows[0]) });
  } catch (err) {
    console.error("Update profile error:", err);
    // Pesan khusus jika penyebabnya foto/field terlalu besar untuk kolom database
    if (err.code === "ER_DATA_TOO_LONG") {
      return res.status(413).json({ message: "Data yang dikirim terlalu besar (mis. ukuran foto). Coba gunakan foto dengan resolusi lebih kecil." });
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server saat memperbarui profil." });
  }
});

export default router;
