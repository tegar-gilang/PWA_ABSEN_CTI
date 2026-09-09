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
    const [rows] = await pool.query(
      `SELECT u.*, d.name as department, p.name as position 
       FROM users u
       LEFT JOIN master_departments d ON u.id_department = d.id
       LEFT JOIN master_positions p ON u.id_position = p.id
       WHERE u.id = ?`,
      [req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    res.json({ user: toUserDTO(rows[0]) });
  } catch (err) {
    console.error("Get profile error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil profil." });
  }
});

/**
 * Handler pembaruan profil (mendukung PUT dan PATCH)
 */
async function handleUpdateProfile(req, res) {
  try {
    const userId = req.userId;
    const name = req.body.name;
    const nik = req.body.nik;
    const email = req.body.email;
    const address = req.body.address;
    const phone = req.body.phone;
    const photo_url = req.body.photo_url || req.body.photoUrl;
    const emergency_contact = req.body.emergency_contact || req.body.emergencyContact;

    let id_department = req.body.id_department;
    if (!id_department && req.body.department) {
      const [depts] = await pool.query("SELECT id FROM master_departments WHERE name = ?", [req.body.department]);
      if (depts.length > 0) id_department = depts[0].id;
    }

    let id_position = req.body.id_position;
    if (!id_position && req.body.position) {
      const [positions] = await pool.query("SELECT id FROM master_positions WHERE name = ?", [req.body.position]);
      if (positions.length > 0) id_position = positions[0].id;
    }

    const [result] = await pool.query(
      `UPDATE users 
       SET name = COALESCE(?, name),
           nik = COALESCE(?, nik),
           email = COALESCE(?, email),
           address = COALESCE(?, address),
           phone = COALESCE(?, phone),
           photo_url = COALESCE(?, photo_url),
           emergency_contact = COALESCE(?, emergency_contact),
           id_department = COALESCE(?, id_department),
           id_position = COALESCE(?, id_position)
       WHERE id = ?`,
      [name, nik, email, address, phone, photo_url, emergency_contact, id_department, id_position, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    const [rows] = await pool.query(
      `SELECT u.*, d.name as department, p.name as position 
       FROM users u
       LEFT JOIN master_departments d ON u.id_department = d.id
       LEFT JOIN master_positions p ON u.id_position = p.id
       WHERE u.id = ?`,
      [userId]
    );

    res.json({
      message: "Profil berhasil diperbarui.",
      user: toUserDTO(rows[0])
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: "Email atau NIK sudah terdaftar pada akun lain." });
    }
    if (err.code === "ER_DATA_TOO_LONG") {
      return res.status(413).json({ message: "Data yang dikirim terlalu besar. Gunakan foto dengan resolusi lebih kecil." });
    }
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat memperbarui profil." });
  }
}

router.put("/", handleUpdateProfile);
router.patch("/", handleUpdateProfile);

export default router;
