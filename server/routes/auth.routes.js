import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
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
// OLD CODE register (Masih pakai id dan password)
// router.post("/register", async (req, res) => {
//   try {
//     const { name, employeeId, password, department, phone, email, position, schedule } = req.body;

//     if (!name || !employeeId || !password) {
//       return res.status(400).json({ message: "Nama, ID Karyawan, dan kata sandi wajib diisi." });
//     }

//     const [existing] = await pool.query("SELECT id FROM users WHERE employee_id = ?", [employeeId]);
//     if (existing.length > 0) {
//       return res.status(409).json({ message: "ID Karyawan sudah terdaftar." });
//     }

//     const id = randomUUID();
//     const passwordHash = await bcrypt.hash(password, 10);

//     await pool.query(
//       `INSERT INTO users (id, employee_id, name, password_hash, department, phone, email, position, schedule)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [id, employeeId, name, passwordHash, department || null, phone || null, email || null, position || null, schedule || "Senin - Jumat, 09:00 - 17:00"],
//     );

//     const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
//     const token = signToken(id);

//     res.status(201).json({ token, user: toUserDTO(rows[0]) });
//   } catch (err) {
//     console.error("Register error:", err);
//     res.status(500).json({ message: "Terjadi kesalahan pada server saat mendaftar." });
//   }
// });
// New code register (Wajib NIK & Email + Foreign Key)
router.post("/register", async (req, res) => {
  try {
    const {name, email, nik, password, id_department, id_position, phone} = req.body;

    if(!name || !email || !nik || !password || !id_department || !id_position || !phone) {
      return res.status(400).json({message: "Nama, Email, NIK, Password, ID Department, ID Position, dan No HP wajib diisi."});
    }

    const [existingUser] = await pool.query("SELECT id FROM users WHERE email = ? OR nik = ?", 
      [email, nik]
    );
    if(existingUser.length > 0) {
      return res.status(409).json({message: "Email atau NIK sudah terdaftar."});
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = randomUUID();

    await pool.query(
      `INSERT INTO users (id, name, email, nik, password_hash, id_department, id_position, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, nik, password_hash, id_department, id_position, phone]
    );

    const token = jwt.sign(
      { id: userId, role: 'EMPLOYEE' },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Akun berhasil dibuat.",
      token,
      user: { id: userId, name, email, nik, role: 'EMPLOYEE'}
    });


  } catch (err) {
    console.error("Error Register:", err);
    res.status(500).json({message: "Terjadi kesalahan pada server saat mendaftar."});
  }
})

/**
 * POST /api/auth/login
 * Login menggunakan ID Karyawan dan kata sandi.
 */
// OLD CODE login (Masih pakai id dan password)
// router.post("/login", async (req, res) => {
//   try {
//     const { employeeId, password } = req.body;
//     if (!employeeId || !password) {
//       return res.status(400).json({ message: "ID Karyawan dan kata sandi wajib diisi." });
//     }

//     const [rows] = await pool.query("SELECT * FROM users WHERE employee_id = ?", [employeeId]);
//     if (rows.length === 0) {
//       return res.status(401).json({ message: "ID Karyawan atau kata sandi salah." });
//     }

//     const user = rows[0];
//     const isValid = await bcrypt.compare(password, user.password_hash);
//     if (!isValid) {
//       return res.status(401).json({ message: "ID Karyawan atau kata sandi salah." });
//     }

//     const token = signToken(user.id);
//     res.json({ token, user: toUserDTO(user) });
//   } catch (err) {
//     console.error("Login error:", err);
//     res.status(500).json({ message: "Terjadi kesalahan pada server saat login." });
//   }
// });
// New code login (Wajib Email & Password)
router.post("/login", async (req, res) => {
  try {
    const identifier = req.body.email || req.body.nik || req.body.employeeId;
    const {password} = req.body;

    if(!identifier || !password) {
      return res.status(400).json({
        message: "Email/NIK/ID Karyawan dan Password wajib diisi."
      });
    }

    const [rows] = await pool.query(
      "SELECT * FROM users WHERE email = ? OR nik = ?",
      [identifier, identifier]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Email atau NIK Salah."
      })
    }

    const user = rows[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if(!isValid) {
      return res.status(401).json({
        message: "Password Salah Silahkan Coba Lagi!."
      });
    }

    const token = jwt.sign(
        { id: user.id, role: user.role },
        process.env.JWT_SECRET || "fallback_secret",
        { expiresIn: "7d" }
    );

    delete user.password_hash;
    res.json({
      message: "Login berhasil.",
      token,
      user
    });

  } catch (err) {
    console.error("Error Login:", err);
    res.status(500).json({message: "Terjadi kesalahan pada server saat login."});
  }
});

// Login Admin
// POST
router.post("/login-admin", async (req, res) => {
    try {
        const identifier = req.body.email || req.body.nik;
        const { password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Email/NIK dan Password wajib diisi." });
        }

        const [rows] = await pool.query(
            "SELECT * FROM users WHERE (email = ? OR nik = ?)", 
            [identifier, identifier]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Kredensial tidak valid." });
        }

        const user = rows[0];

        if (user.role !== 'ADMIN') {
            return res.status(403).json({ 
                message: "Akses ditolak. Anda tidak memiliki izin untuk masuk ke portal HRD." 
            });
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            return res.status(401).json({ message: "Kata sandi salah." });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET || "fallback_secret",
            { expiresIn: "12h" } 
        );

        delete user.password_hash;
        res.json({ message: "Selamat datang di Portal HRD", token, user });

    } catch (err) {
        console.error("Error Admin Login:", err);
        res.status(500).json({ message: "Terjadi kesalahan internal server." });
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
