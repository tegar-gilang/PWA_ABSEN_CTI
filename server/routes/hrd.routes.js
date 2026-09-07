import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { randomUUID } from "crypto";
import { getLocalDateString } from "../utils/date.js";
import bcrypt from "bcryptjs";
import { request } from "https";

const router = Router();

// Middleware to require authentication for admin routes
async function requireAdmin(req, res, next) {
    try {
        const [rows] = await pool.query("SELECT role FROM users WHERE id = ?", [req.userId]);
        if (rows.length === 0 || rows[0].role !== 'ADMIN') {
            return res.status(403).json({message: "Access denied Admins/HRD only."});
        }
        next();
    } catch (err) {
        res.status(500).json({message: "Internal server error."});
    }
}

router.use(requireAuth, requireAdmin);

// API FOR AUTH ADMIN (REGISTER ADMIN) ===========================================================================================================================>
// Route Register New Admin 
// POST
router.post("/admins/register", async (req, res) => {
    try {
        const {name, email, nik, password} = req.body;

        if(!name || !email || !nik || !password) {
            return res.status(400).json({
                message: "Data tidak lengkap, Slahkan isi Informasi dengan Lengkap."
            });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const userId = randomUUID();

        await pool.query(
            `INSERT INTO users (id, nik, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?, 'ADMIN')`,
            [userId, nik, email, name, password_hash]
        );

        res.status(201).json({
            message: "Akun Admin Berhasil Terdaftar.",
        });
    } catch (err) {
        console.error("Error saat mendaftarkan Admin:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Email atau NIK sudah digunakan." });
        }
        res.status(500).json({message: "Gagal membuat akun admin."});
    }
});
// ============================================================================================================================================================>



// API FOR RUMAH SAKIT CRUD ===================================================================================================================================>
// Route RS Rumah Sakit
// GET
router.get("/hospitals", async (req, res)=> {
    try {
        const [rows] =  await pool.query("SELECT * FROM hospitals ORDER BY nama_rs ASC");
        res.json({hospitals: rows});
    } catch (err) {
        console.error("Error saat mengambil data rumah sakit:", err);
        res.status(500).json({message: "Gagal memuat daftar rumah sakit."});
    }
});

// Route RS Rumah Sakit
// POST
router.post("/hospitals", async (req,res)=> {
    try {
        const {nama_rs, address, latitude, longitude, radius_meters = 200} = req.body;

        if(!nama_rs || !address || !latitude || !longitude) {
            return res.status(400).json({message: "Data tidak lengkap, Silahkan isi semua field."});
        }

        const id = randomUUID();
        await pool.query(
            "INSERT INTO hospitals (id, nama_rs, address, latitude, longitude, radius_meters) VALUES (?, ?, ?, ?, ?, ?)",
            [id, nama_rs, address, latitude, longitude, radius_meters]
        );
        res.status(201).json({message: "Rumah sakit berhasil ditambahkan."});
    } catch (err) {
        console.error("Error saat menambahkan rumah sakit:", err);
        res.status(500).json({message: "Gagal menambahkan rumah sakit."});
    }
});

// Route RS Rumah Sakit
// PUT
router.put("/hospitals/:id", async (req, res)=> {
    try {
        const {id} = req.params;
        const {nama_rs, address, latitude, longitude, radius_meters} = req.body;

        await pool.query("UPDATE hospitals SET nama_rs = ?, address = ?, latitude = ?, longitude = ?, radius_meters = ? WHERE id = ?",
            [nama_rs, address, latitude, longitude, radius_meters, id]
        );
        res.status(201).json({message: "Rumah sakit berhasil diperbarui."});
    } catch (err) {
        console.error("Error saat memperbarui rumah sakit:", err);
        res.status(500).json({message: "Gagal memperbarui rumah sakit."});
    }
});

// Route RS Rumah Sakit
// DELETE
router.delete("/hospitals/:id", async (req, res) => {
    try {
        const {id} = req.params;
        await pool.query("DELETE FROM hospitals WHERE id = ?", [id]);
        res.status(200).json({message: "Rumah sakit berhasil dihapus."});
    } catch (err) {
        console.error("Error saat menghapus rumah sakit:", err);
        res.status(500).json({message: "Gagal menghapus rumah sakit."});
    }
});
// ============================================================================================================================================================>



// API FOR DEPARTMENTS AND POSISI ===================================================================================================================================>
// Route Divisi
// POST
router.post("/departments", async (req, res) => {
    try {
        const { name } = req.body;

        if( !name ) {
            return res.status(400).json({message: "Nama divisi tidak boleh kosong. SIlahkan isi nama divisi."});
        }

        const id = randomUUID();
        await pool.query("INSERT INTO master_departments (id, name) VALUES (?, ?)", [id, name]);
        res.status(201).json({message: "Divisi berhasil ditambahkan."});
    } catch (err) {
        console.error("Error saat menambahkan divisi:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Nama divisi sudah ada." });
        }
        res.status(500).json({message: "Gagal menambahkan divisi."});
    }
});

// Route Divisi
// PUT
router.put("/departments/:id", async (req, res) => {
    try {
        const { id } =  req.params;
        const { name } = req.body;

        const [result] = await pool.query("UPDATE master_departments SET name = ? WHERE id = ?", [name, id]);
        if(result.affectedRows === 0) {
            return res.status(404).json({message: "Divisi tidak ditemukan."});
        }
        res.status(200).json({message: "Divisi berhasil diperbarui."});
    } catch (err) {
        console.error("Error saat memperbarui divisi:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Nama divisi sudah ada." });
        }
        res.status(500).json({message: "Gagal memperbarui divisi."});
    }
});

// Route Divisi
// DELETE
router.delete("/departments/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.query("DELETE FROM master_departments WHERE id = ?", [id]);
        if(result.affectedRows === 0) {
            return res.status(404).json({message: "Divisi tidak ditemukan."});
        }
        res.status(200).json({message: "Divisi berhasil dihapus."});
    } catch (err) {
        console.error("Error saat menghapus divisi:", err);
        res.status(500).json({message: "Gagal menghapus divisi."});
    }
});

// Route Posisi
// POST
router.post("/positions", async (req, res) => {
    try {
        const { name } = req.body;

        if( !name ) {
            return res.status(400).json({message: "Nama posisi tidak boleh kosong. SIlahkan isi nama posisi."});
        }

        const id = randomUUID();
        await pool.query("INSERT INTO master_positions (id, name) VALUES (?, ?)", [id, name]);
        res.status(201).json({message: "Posisi berhasil ditambahkan."});
    } catch (err) {
        console.error("Error saat menambahkan posisi:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Nama posisi sudah ada." });
        }
        res.status(500).json({message: "Gagal menambahkan posisi."});
    }
});

// Route Posisi
// PUT
router.put("/positions/:id", async (req, res) => {
    try {
        const { id } =  req.params;
        const { name } = req.body;

        const [result] = await pool.query("UPDATE master_positions SET name = ? WHERE id = ?", [name, id]);
        if(result.affectedRows === 0) {
            return res.status(404).json({message: "Posisi tidak ditemukan."});
        }
        res.status(200).json({message: "Posisi berhasil diperbarui."});
    } catch (err) {
        console.error("Error saat memperbarui posisi:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Nama posisi sudah ada." });
        }
        res.status(500).json({message: "Gagal memperbarui posisi."});
    }
});

// Route Posisi
// DELETE
router.delete("/positions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await pool.query("DELETE FROM master_positions WHERE id = ?", [id]);
        if(result.affectedRows === 0) {
            return res.status(404).json({message: "Posisi tidak ditemukan."});
        }
        res.status(200).json({message: "Posisi berhasil dihapus."});
    } catch (err) {
        console.error("Error saat menghapus posisi:", err);
        res.status(500).json({message: "Gagal menghapus posisi."});
    }
});
// ============================================================================================================================================================>



// API FOR DASHBOARD ===================================================================================================================================>    
// Route Dahsboard HRD
// GET
router.get("/dashboard/overview", async (req, res) => {
    try {
        const today = getLocalDateString();
        const [totalEmp] = await pool.query("SELECT COUNT(*) AS count FROM users");
        const [present] = await pool.query("SELECT COUNT(*) AS count FROM attendance_records WHERE date = ? AND status = 'ON_TIME'", [today]);
        const [late] = await pool.query("SELECT COUNT(*) AS count FROM attendance_records WHERE date = ? AND status = 'LATE'", [today]);
        const [pendingLeaves] = await pool.query("SELECT COUNT(*) AS count FROM requests WHERE status = 'PENDING'");

        // Recent Activities
        const [recentActivities] = await pool.query(
            `SELECT a.id, u.name, u.id_position as role, 'Check-in/out' as action, 
                    DATE_FORMAT(a.check_in_time, '%h:%i %p') as time, a.status
            FROM attendance_records a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.created_at DESC LIMIT 5`
        );

        res.json({
            metrics: {
                totalEmployees: totalEmp[0].count,
                presentToday: present[0].count,
                lateToday: late[0].count,
                pendingLeaves: pendingLeaves[0].count
            },
            recentActivities
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Failed to Fetch Dashboard Data."});
    }
});
// ============================================================================================================================================================>



// API FOR ABSEN KEHADIRAN ===================================================================================================================================>
// Route Lihat Data Kehadiran Karyawan
// GET
router.get("/attendance", async (req, res) => {
    try {
        const { date } = req.query;

        let query = `
            SELECT a.id, u.name, u.id_position, u.email as email, a.status, 
                   DATE_FORMAT(a.check_in_time, '%H:%i') as checkInTime, 
                   DATE_FORMAT(a.check_out_time, '%H:%i') as checkOutTime,
                   a.check_in_lat, a.check_in_lng, a.check_in_photo_url,
                   a.check_out_lat, a.check_out_lng, a.check_out_photo_url, 
                   DATE_FORMAT(a.date, '%Y-%m-%d') as date
            FROM attendance_records a
            JOIN users u ON a.user_id = u.id
            WHERE 1=1
        `;
        const params = [];

        if (date) {
            query += ` AND DATE(a.date) = ?`;
            params.push(date);
        }

        query += ` ORDER BY a.date DESC, a.check_in_time DESC`;

        const [rows] = await pool.query(query, params);
        
        res.json({ records: rows }); 
    } catch (err) {
        console.error("SQL Error pada /hrd/attendance:", err);
        res.status(500).json({message: "Failed to Fetch Attendance Records."});
    }
});
// ============================================================================================================================================================>




// API Manajemen Data Karyawan ================================================================================================================================>
// Route Lihat Data Karyawan
// GET
router.get("/employees", async (req, res) => {
    try {
        const { name, department } = req.query;
        let query = `
            SELECT u.name, u.nik, u.email, u.phone, u.address, u.status_karyawan, u.photo_url as profile_photo_url,
                d.name as department_name, p.name as position_name, 
                u.jam_masuk, u.jam_keluar
            FROM users u
            LEFT JOIN master_departments d ON u.id_department = d.id
            LEFT JOIN master_positions p ON u.id_position = p.id
            WHERE u.role = 'EMPLOYEE'
        `;
        const params = [];

        if (name) {
            query += ` AND u.name LIKE ?`;
            params.push(`%${name}%`);
        }
        if (department) {
            query += ` AND d.name LIKE ?`;
            params.push(`%${department}%`);
        }

        query += ` ORDER BY d.name ASC, u.name ASC`;

        const [employees] = await pool.query(query, params);
        res.status(200).json({ total: employees.length, data: employees });
    } catch (err) {
        console.error("Error Laporan Karyawan:", err);
        res.status(500).json({ message: "Gagal memuat data karyawan." });
    }
});

// Route HRD Menghapus Karyawan
// DELETE
router.delete("/employees/:id", async (req, res) => {
    try {
        const targetUserId = req.params.id;

        if(targetUserId === req.userId) {
            return res.status(400).json({message: "Tidak dapat menghapus akun sendiri."});
        }

        const [result] = await pool.query("DELETE FROM users WHERE id = ?", [targetUserId]);
        if(result.affectedRows === 0) {
            return res.status(404).json({message: "Karyawan tidak ditemukan."});
        }
        res.status(200).json({message: "Karyawan berhasil dihapus."});
    } catch (err) {
        console.error("SQL Error pada /hrd/employees/:id:", err);
        res.status(500).json({message: "Gagal Menghapus Karyawan."});
    }
});

// Route HRD Mengubah Jam Kerja, Department, dan Posisi
// PUT
router.put("/employees/:id", async (req,res) => {
    try {
        const targetUserId = req.params.id;
        const { jam_masuk, jam_keluar, id_department, id_position} = req.body;

        const [result] = await pool.query("UPDATE users SET jam_masuk = COALESCE(?, jam_masuk), jam_keluar = COALESCE(?, jam_keluar), id_department = COALESCE(?, id_department), id_position = COALESCE(?, id_position) WHERE id = ?", [jam_masuk, jam_keluar, id_department, id_position, targetUserId]);
        
        if(result.affectedRows === 0) {
            return res.status(404).json({message: "Karyawan tidak ditemukan."});
        }
        res.status(200).json({message: "Data karyawan berhasil diperbarui."});
    } catch (err) {
        console.error("SQL Error pada /hrd/employees/:id:", err);
        res.status(500).json({message: "Gagal Memperbarui Data Karyawan."});
    }
});
// =========================================================================================================================================================================================>



// API Manajemen Perizinan =================================================================================================================================================================>
// Route Lihat Data Cuti/Izin/Sakit Karyawan
    // GET 
router.get("/leaves", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT 
                r.id, 
                u.name, 
                r.type, 
                r.reason, 
                DATE_FORMAT(r.date, '%Y-%m-%d') as date, 
                r.status, 
                r.rejection_reason,
                r.attachment_url,
                r.created_at
            FROM requests r
            JOIN users u ON r.user_id = u.id
            ORDER BY r.created_at DESC`
        );
        
        res.json({ requests: rows });
    } catch (err) {
        console.error("Error mengambil data cuti:", err);
        res.status(500).json({ message: "Gagal memuat daftar permintaan cuti/izin." });
    }
    
});

// Route Manajemen Cuti
// PATCH
router.patch("/leaves/:id/approval", async(req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; 

        if(!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({message: "Invalid status value."});
        }

        await pool.query(
            "UPDATE requests SET status = ?, rejection_reason = ? WHERE id = ?",
            [status, status === 'REJECTED' ? req.body.rejection_reason : null, id]
        );
        res.json({ message: `Leave request updated to ${status.toLowerCase()} successfully.` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update leave request." });
    }
});
// =========================================================================================================================================================================================>




// API LAPORAN LAPORAN =====================================================================================================================================================================>
// Route Laporan Data Karyawan
// GET
router.get("/reports/employees", async (req, res) => {
    try {
        const { name, department } = req.query;
        let query = `
            SELECT u.name, u.nik, u.email, u.phone, u.address, u.status_karyawan,
                d.name as department_name, p.name as position_name, 
                u.jam_masuk, u.jam_keluar
            FROM users u
            LEFT JOIN master_departments d ON u.id_department = d.id
            LEFT JOIN master_positions p ON u.id_position = p.id
            WHERE u.role = 'EMPLOYEE'
        `;
        const params = [];

        if (name) {
            query += ` AND u.name LIKE ?`;
            params.push(`%${name}%`);
        }
        if (department) {
            query += ` AND d.name LIKE ?`;
            params.push(`%${department}%`);
        }

        query += ` ORDER BY d.name ASC, u.name ASC`;

        const [employees] = await pool.query(query, params);
        res.status(200).json({ total: employees.length, data: employees });
    } catch (err) {
        console.error("Error Laporan Karyawan:", err);
        res.status(500).json({ message: "Gagal memuat data karyawan." });
    }
});

// Route Laporan Absensi Karyawan Dinamis berdasarkan Nama Karyawan, Tanggal, dan Rentang Tanggal
// GET
router.get("/reports/export", async (req, res) => {
    try {
        const { startDate, endDate, name } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ message: "Parameter startDate dan endDate wajib diisi." });
        }

        let userQuery = `
            SELECT u.id, u.name, u.nik, d.name as department 
            FROM users u
            LEFT JOIN master_departments d ON u.id_department = d.id
            WHERE u.role = 'EMPLOYEE' AND u.status_karyawan = 'ACTIVE'
        `;
        const userParams = [];

        if (name) {
            userQuery += ` AND u.name LIKE ?`;
            userParams.push(`%${name}%`);
        }
        
        const [users] = await pool.query(userQuery, userParams);

        if (users.length === 0) {
            return res.status(404).json({ message: "Data karyawan tidak ditemukan." });
        }

        const matchedUserIds = users.map(u => u.id);

        let attQuery = `
            SELECT a.user_id, DATE_FORMAT(a.date, '%Y-%m-%d') as date, a.status,
                DATE_FORMAT(a.check_in_time, '%H:%i:%s') as check_in_time,
                DATE_FORMAT(a.check_out_time, '%H:%i:%s') as check_out_time,
                a.working_hours, a.custom_location_name, h.nama_rs
            FROM attendance_records a
            LEFT JOIN hospitals h ON a.hospital_id = h.id
            WHERE a.date BETWEEN ? AND ?
        `;
        const attParams = [startDate, endDate];
        
        if (name) {
            attQuery += ` AND a.user_id IN (?)`;
            attParams.push(matchedUserIds);
        }
        const [attendances] = await pool.query(attQuery, attParams);

        let reqQuery = `
            SELECT user_id, DATE_FORMAT(date, '%Y-%m-%d') as date, type 
            FROM requests 
            WHERE status = 'APPROVED' AND date BETWEEN ? AND ?
        `;
        const reqParams = [startDate, endDate];

        if (name) {
            reqQuery += ` AND user_id IN (?)`;
            reqParams.push(matchedUserIds);
        }
        const [requests] = await pool.query(reqQuery, reqParams);

        const exportData = users.map(user => {
            const userAtt = attendances.filter(a => a.user_id === user.id);
            const userReq = requests.filter(r => r.user_id === user.id);

            const telat = userAtt.filter(a => a.status === 'LATE');
            const alfa = userAtt.filter(a => a.status === 'ABSENT');
            const izin = userReq.filter(r => r.type === 'IZIN');
            const cuti = userReq.filter(r => r.type === 'CUTI');
            const sakit = userReq.filter(r => r.type === 'SAKIT');

            return {
                informasi_karyawan: {
                    id: user.id,
                    nama: user.name,
                    nik: user.nik,
                    divisi: user.department || "Tidak Ada Divisi"
                },
                ringkasan: {
                    total_hadir: userAtt.filter(a => a.status === 'ON_TIME' || a.status === 'LATE').length,
                    total_telat: telat.length,
                    tanggal_telat: telat.map(a => a.date),
                    total_alfa: alfa.length,
                    tanggal_alfa: alfa.map(a => a.date),
                    total_izin: izin.length,
                    tanggal_izin: izin.map(r => r.date),
                    total_cuti: cuti.length,
                    tanggal_cuti: cuti.map(r => r.date),
                    total_sakit: sakit.length,
                    tanggal_sakit: sakit.map(r => r.date)
                },
                detail_harian: userAtt.map(a => ({
                    tanggal: a.date,
                    status: a.status,
                    jam_masuk: a.check_in_time,
                    jam_keluar: a.check_out_time,
                    total_jam_kerja: a.working_hours,
                    lokasi: a.nama_rs || a.custom_location_name || "Tidak Diketahui"
                }))
            };
        });

        res.status(200).json({ 
            periode: `${startDate} hingga ${endDate}`, 
            data: exportData 
        });

    } catch (err) {
        console.error("Error Export Laporan:", err);
        res.status(500).json({ message: "Gagal menghasilkan data export." });
    }
});
// ==================================================================================================================================>








// Route Manajemen KPI
// GET
router.get("/kpi", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT k.*, u.name 
            FROM kpi_records k
            JOIN users u ON k.user_id = u.id
            ORDER BY k.period DESC`
        );
        res.json({ kpi: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Failed to Fetch KPI Records."});
    }
});

// Route Rekrutmen
// POST 
router.post("/recruitment/jobs", async (req, res) => {
    try {
        const { title, role } = req.body;
        if (!title || !role) return res.status(400).json({ message: "Data not complete." });
        
        const id = randomUUID();
        await pool.query(
            "INSERT INTO job_openings (id, title, role, status) VALUES (?, ?, ?, 'OPEN')",
            [id, title, role]   
        );
        res.status(201).json({ message: "Job opening created successfully.", jobId: id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to create job opening." });
    }
});

// Route Rekrutmen
//GET
router.get("/recruitment/overview", async (req, res)=> {
    try {
        const [rows] = await pool.query(
            `SELECT j.id, j.title, j.role, j.status,
                    COUNT(c.id) as total_candidates
            FROM job_openings j
            LEFT JOIN candidates c ON j.id = c.job_opening_id
            GROUP BY j.id
            ORDER BY j.created_at DESC`
        );
        res.json({ recruitment: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch recruitment overview." });
    }
});

// Route Rekrutmen
// EDIT
router.put("/recruitment/jobs/:id", async (req, res)=> {
    try {
        const { id } = req.params;
        const { title, role, status } = req.body;

        if (!title || !role || !status) {
            return res.status(400).json({ message: "Data not complete." });
        }

        if (!['OPEN', 'CLOSED'].includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const [result] = await pool.query(
            "UPDATE job_openings SET title = ?, role = ?, status = ? WHERE id = ?",
            [title, role, status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Job opening not found." });
        }

        res.json({ message: "Job opening updated successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update job opening." });
    }
});

// Route Rekrutmen
// DELETE
router.delete("/recruitment/jobs/:id", async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query("DELETE FROM job_openings WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Job opening not found." });
        }
        res.json({ message: "Job opening deleted successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete job opening." });
    }
});

export default router;
