import { Router } from "express";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { pool } from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";

const router = Router();

function toUserDTO(row) {
  return {
    id: row.id,
    employeeId: row.employee_id,
    name: row.name,
    department: row.department,
    position: row.position,
    phone: row.phone,
    email: row.email,
    schedule: row.schedule,
    photoUrl: row.photo_url,
    emergencyContact: row.emergency_contact,
    role: row.role,
  };
}

/**
 * POST /api/auth/register
 * Mendaftarkan akun karyawan baru.
 */
router.post("/register", async (req, res) => {
  try {
    const { name, employeeId, password, department, phone, email, position, schedule } = req.body;

    if (!name || !employeeId || !password) {
      return res.status(400).json({ message: "Nama, ID Karyawan, dan kata sandi wajib diisi." });
    }

    const [existing] = await pool.query("SELECT id FROM users WHERE employee_id = ?", [employeeId]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "ID Karyawan sudah terdaftar." });
    }

    const id = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users (id, employee_id, name, password_hash, department, phone, email, position, schedule)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, employeeId, name, passwordHash, department || null, phone || null, email || null, position || null, schedule || "Senin - Jumat, 09:00 - 17:00"],
    );

    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    const token = signToken(id);

    res.status(201).json({ token, user: toUserDTO(rows[0]) });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mendaftar." });
  }
});

/**
 * POST /api/auth/login
 * Login menggunakan ID Karyawan dan kata sandi.
 */
router.post("/login", async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    if (!employeeId || !password) {
      return res.status(400).json({ message: "ID Karyawan dan kata sandi wajib diisi." });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE employee_id = ?", [employeeId]);
    if (rows.length === 0) {
      return res.status(401).json({ message: "ID Karyawan atau kata sandi salah." });
    }

    const user = rows[0];
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: "ID Karyawan atau kata sandi salah." });
    }

    const token = signToken(user.id);
    res.json({ token, user: toUserDTO(user) });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat login." });
  }
});

/**
 * GET /api/auth/me
 * Mengambil data user yang sedang login berdasarkan token.
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [req.userId]);
    if (rows.length === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    res.json({ user: toUserDTO(rows[0]) });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil data pengguna." });
  }
});

export default router;
export { toUserDTO };
