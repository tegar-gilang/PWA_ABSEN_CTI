import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import { pool } from "../db.js";
import { requireAuth, signToken } from "../middleware/auth.js";
import nodemailer from "nodemailer";

const router = Router();

function toUserDTO(row) {
  return {
    id: row.id,
    employeeId: row.employee_id || row.nik,
    nik: row.nik,
    name: row.name,
    department: row.department || (row.department_name ? row.department_name : null),
    position: row.position || (row.position_name ? row.position_name : null),
    phone: row.phone,
    email: row.email,
    schedule: row.schedule || (row.jam_masuk && row.jam_keluar ? `${row.jam_masuk.slice(0, 5)} - ${row.jam_keluar.slice(0, 5)}` : null),
    jamMasuk: row.jam_masuk ? row.jam_masuk.slice(0, 5) : null,
    jamKeluar: row.jam_keluar ? row.jam_keluar.slice(0, 5) : null,
    photoUrl: row.photo_url,
    emergencyContact: row.emergency_contact,
    role: row.role,
  };
}

/**
 * POST /api/auth/register
 * Mendaftarkan akun karyawan baru.
 */
// router.post("/register", async (req, res) => {
//   try {
//     const { name, nik, password, phone } = req.body;
//     let { email, id_department, id_position } = req.body;

//     if (!name || !nik || !password || !email) {
//       return res.status(400).json({ message: "Nama, NIK, Email, dan Password wajib diisi." });
//     }

//     // Validasi NIK hanya boleh angka
//     if (!/^\d+$/.test(String(nik).trim())) {
//       return res.status(400).json({ message: "NIK hanya boleh berisi angka." });
//     }

//     // Cek apakah email atau NIK sudah ada
//     const [existingUser] = await pool.query(
//       "SELECT id FROM users WHERE email = ? OR nik = ?",
//       [email, nik]
//     );
//     if (existingUser.length > 0) {
//       return res.status(409).json({ message: "Email atau NIK sudah terdaftar." });
//     }

//     // Resolusi id_department jika dikirim sebagai nama atau belum terisi
//     if (!id_department && req.body.department) {
//       const [depts] = await pool.query("SELECT id FROM master_departments WHERE name = ?", [req.body.department]);
//       if (depts.length > 0) {
//         id_department = depts[0].id;
//       } else {
//         const newDeptId = randomUUID();
//         await pool.query("INSERT INTO master_departments (id, name) VALUES (?, ?)", [newDeptId, req.body.department]);
//         id_department = newDeptId;
//       }
//     }
//     if (!id_department) {
//       const [depts] = await pool.query("SELECT id FROM master_departments LIMIT 1");
//       if (depts.length > 0) id_department = depts[0].id;
//     }

//     // Resolusi id_position jika dikirim sebagai nama atau belum terisi
//     if (!id_position && req.body.position) {
//       const [positions] = await pool.query("SELECT id FROM master_positions WHERE name = ?", [req.body.position]);
//       if (positions.length > 0) {
//         id_position = positions[0].id;
//       } else {
//         const newPosId = randomUUID();
//         await pool.query("INSERT INTO master_positions (id, name) VALUES (?, ?)", [newPosId, req.body.position]);
//         id_position = newPosId;
//       }
//     }
//     if (!id_position) {
//       const [positions] = await pool.query("SELECT id FROM master_positions LIMIT 1");
//       if (positions.length > 0) id_position = positions[0].id;
//     }

//     const salt = await bcrypt.genSalt(10);
//     const password_hash = await bcrypt.hash(password, salt);
//     const userId = randomUUID();

//     await pool.query(
//       `INSERT INTO users (id, name, email, nik, password_hash, id_department, id_position, phone)
//       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
//       [userId, name, email, nik, password_hash, id_department || null, id_position || null, phone]
//     );

//     const token = jwt.sign(
//       { id: userId, role: 'EMPLOYEE' },
//       process.env.JWT_SECRET || "fallback_secret",
//       { expiresIn: "7d" }
//     );

//     const [rows] = await pool.query(
//       `SELECT u.*, d.name as department, p.name as position 
//        FROM users u
//        LEFT JOIN master_departments d ON u.id_department = d.id
//        LEFT JOIN master_positions p ON u.id_position = p.id
//        WHERE u.id = ?`,
//       [userId]
//     );

//     res.status(201).json({
//       message: "Akun berhasil dibuat.",
//       token,
//       user: toUserDTO(rows[0])
//     });
//   } catch (err) {
//     console.error("Error Register:", err);
//     res.status(500).json({ message: "Terjadi kesalahan pada server saat mendaftar." });
//   }
// });
router.post("/register", async (req, res) => {
  try {
    // 1. KITA AMBIL JUGA employee_id DARI POSTMAN
    const { name, nik, employee_id, password, phone } = req.body;
    let { email, id_department, id_position } = req.body;

    // 2. Fallback cerdas: kalau Postman cuma ngirim employee_id, jadikan itu sebagai NIK juga
    const finalNik = nik || employee_id;
    const finalEmployeeId = employee_id || nik;

    if (!name || !finalEmployeeId || !password || !email) {
      return res.status(400).json({ message: "Nama, NIK/Employee ID, Email, dan Password wajib diisi." });
    }

    // Cek apakah email atau NIK sudah ada
    const [existingUser] = await pool.query(
      "SELECT id FROM users WHERE email = ? OR employee_id = ? OR nik = ?",
      [email, finalEmployeeId, finalNik]
    );
    if (existingUser.length > 0) {
      return res.status(409).json({ message: "Email atau NIK sudah terdaftar." });
    }

    // Resolusi id_department 
    if (!id_department && req.body.department) {
      const [depts] = await pool.query("SELECT id FROM master_departments WHERE name = ?", [req.body.department]);
      if (depts.length > 0) {
        id_department = depts[0].id;
      } else {
        const newDeptId = randomUUID();
        await pool.query("INSERT INTO master_departments (id, name) VALUES (?, ?)", [newDeptId, req.body.department]);
        id_department = newDeptId;
      }
    }
    if (!id_department) {
      const [depts] = await pool.query("SELECT id FROM master_departments LIMIT 1");
      if (depts.length > 0) id_department = depts[0].id;
    }

    // Resolusi id_position
    if (!id_position && req.body.position) {
      const [positions] = await pool.query("SELECT id FROM master_positions WHERE name = ?", [req.body.position]);
      if (positions.length > 0) {
        id_position = positions[0].id;
      } else {
        const newPosId = randomUUID();
        await pool.query("INSERT INTO master_positions (id, name) VALUES (?, ?)", [newPosId, req.body.position]);
        id_position = newPosId;
      }
    }
    if (!id_position) {
      const [positions] = await pool.query("SELECT id FROM master_positions LIMIT 1");
      if (positions.length > 0) id_position = positions[0].id;
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const userId = randomUUID();

    // 3. MASUKKAN finalEmployeeId KE DALAM QUERY DATABASE!
    await pool.query(
      `INSERT INTO users (id, name, email, employee_id, nik, password_hash, id_department, id_position, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, finalEmployeeId, finalNik, password_hash, id_department || null, id_position || null, phone]
    );

    const token = jwt.sign(
      { id: userId, role: 'EMPLOYEE' },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    const [rows] = await pool.query(
      `SELECT u.*, d.name as department, p.name as position 
       FROM users u
       LEFT JOIN master_departments d ON u.id_department = d.id
       LEFT JOIN master_positions p ON u.id_position = p.id
       WHERE u.id = ?`,
      [userId]
    );

    res.status(201).json({
      message: "Akun berhasil dibuat.",
      token,
      user: rows[0]
    });
  } catch (err) {
    console.error("Error Register:", err); // <-- INI YANG AKAN MUNCUL DI TERMINAL
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mendaftar." });
  }
});

/**
 * POST /api/auth/login
 * Login menggunakan Email dan kata sandi saja (tidak menggunakan ID Karyawan atau NIK).
 */
router.post("/login", async (req, res) => {
  try {
    const email = (req.body.email || req.body.employeeId || req.body.identifier || '').trim();
    const { password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email dan Kata Sandi wajib diisi."
      });
    }

    // Cari akun berdasarkan Email (atau nama admin khusus)
    const [rows] = await pool.query(
      `SELECT u.*, 
              COALESCE(d.name, u.department, 'Staff') as department, 
              COALESCE(p.name, u.position, 'Staff') as position 
       FROM users u
       LEFT JOIN master_departments d ON u.id_department = d.id
       LEFT JOIN master_positions p ON u.id_position = p.id
       WHERE LOWER(u.email) = LOWER(?) OR (u.role = 'ADMIN' AND (LOWER(u.email) = LOWER(?) OR LOWER(u.nik) = LOWER(?)))`,
      [email, email, email]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message: "Email belum terdaftar atau salah."
      });
    }

    const user = rows[0];

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({
        message: "Kata sandi yang Anda masukkan salah. Silakan coba lagi."
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
      user: toUserDTO(user)
    });

  } catch (err) {
    console.error("Error Login:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat login." });
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
      `SELECT u.*, 
              COALESCE(d.name, u.department, 'Staff') as department, 
              COALESCE(p.name, u.position, 'Staff') as position 
       FROM users u
       LEFT JOIN master_departments d ON u.id_department = d.id
       LEFT JOIN master_positions p ON u.id_position = p.id
       WHERE (u.email = ? OR u.nik = ? OR u.employee_id = ?)`, 
      [identifier, identifier, identifier]
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
    res.json({ message: "Selamat datang di Portal HRD", token, user: toUserDTO(user) });

  } catch (err) {
    console.error("Error Admin Login:", err);
    res.status(500).json({ message: "Terjadi kesalahan internal server." });
  }
});

// Data Divisi/Department / Bagian
// GET
router.get("/departments", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, name FROM master_departments ORDER BY CASE WHEN display_order > 0 THEN 0 ELSE 1 END, display_order ASC, name ASC"
    );
    res.json({ departments: rows });
  } catch (err) {
    console.error("Error fetching departments:", err);
    res.status(500).json({ message: "Failed to fetch departments." });
  }
});

// Data Posisi/Position
// GET
router.get("/positions", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, name FROM master_positions ORDER BY name ASC");
    res.json({ positions: rows });
  } catch (err) {
    console.error("Error fetching positions:", err);
    res.status(500).json({ message: "Failed to fetch positions." });
  }
});

/**
 * GET /api/auth/me
 * Mengambil data user yang sedang login berdasarkan token.
 */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT u.*, 
              COALESCE(d.name, u.department, 'Staff') as department, 
              COALESCE(p.name, u.position, 'Staff') as position 
       FROM users u
       LEFT JOIN master_departments d ON u.id_department = d.id
       LEFT JOIN master_positions p ON u.id_position = p.id
       WHERE u.id = ?`,
      [req.userId]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    res.json({ user: toUserDTO(rows[0]) });
  } catch (err) {
    console.error("Get me error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil data pengguna." });
  }
});

/**
 * POST /api/auth/forgot-password
 * Mengirim OTP ke email karyawan yang lupa kata sandi
 */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email wajib diisi." });
    }

    // Cek apakah email ada di database
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: "Email tidak ditemukan di sistem." });
    }

    // Buat kode OTP 6 digit acak
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set waktu kedaluwarsa OTP (15 menit dari sekarang)
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Simpan OTP ke database MySQL
    await pool.query(
      "UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE email = ?", 
      [otp, expires, email]
    );

    // Konfigurasi pengirim email (Nodemailer)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Isi dan kirim email
    await transporter.sendMail({
      from: '"HRD SmartWork" <no-reply@smartwork.com>',
      to: email,
      subject: "Kode OTP Pemulihan Kata Sandi",
      html: `
        <h3>Halo,</h3>
        <p>Anda telah meminta untuk mengatur ulang kata sandi akun SmartWork Anda.</p>
        <p>Berikut adalah kode OTP Anda: <b><span style="font-size: 24px; color: #2563eb;">${otp}</span></b></p>
        <p><i>Kode ini hanya berlaku selama 15 menit. JANGAN berikan kode ini kepada siapa pun.</i></p>
      `
    });

    res.json({ message: "Kode OTP telah dikirim ke email Anda." });

  } catch (err) {
    console.error("Error Forgot Password:", err);
    res.status(500).json({ message: "Terjadi kesalahan saat memproses permintaan." });
  }
});

/**
 * POST /api/auth/reset-password
 * Memverifikasi OTP dan mengganti kata sandi
 */
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, dan Kata Sandi Baru wajib diisi." });
    }

    // Cari user berdasarkan email
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users[0];

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    // Cek apakah OTP cocok
    if (user.reset_otp !== otp) {
      return res.status(400).json({ message: "Kode OTP salah." });
    }

    // Cek apakah OTP sudah kedaluwarsa
    if (new Date() > new Date(user.reset_otp_expires)) {
      return res.status(400).json({ message: "Kode OTP sudah kedaluwarsa. Silakan minta kode baru." });
    }

    // Enkripsi (Hash) password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password di database dan hapus data OTP agar tidak bisa dipakai ulang
    await pool.query(
      "UPDATE users SET password_hash = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE email = ?",
      [hashedPassword, email]
    );

    res.json({ message: "Kata sandi berhasil diubah! Silakan masuk dengan sandi baru Anda." });

  } catch (err) {
    console.error("Error Reset Password:", err);
    res.status(500).json({ message: "Terjadi kesalahan saat mengganti kata sandi." });
  }
});

export default router;
export { toUserDTO };
