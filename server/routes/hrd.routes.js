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
                message: "Data tidak lengkap, Silahkan isi Informasi dengan Lengkap."
            });
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const userId = randomUUID();

        await pool.query(
            `INSERT INTO users (id, employee_id, nik, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?, ?, 'ADMIN')`,
            [userId, nik, nik, email, name, password_hash]
        );

        res.status(201).json({
            message: "Akun Admin Berhasil Terdaftar.",
        });
    } catch (err) {
        console.error("Error saat mendaftarkan Admin:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Email atau NIK/Employee ID sudah digunakan." });
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
        const [rows] = await pool.query("SELECT id, nama_rs, nama_rs as name, address, latitude, longitude, radius_meters FROM hospitals WHERE type = 'rumah_sakit' ORDER BY nama_rs ASC");
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
        const nama_rs = req.body.nama_rs || req.body.name;
        const address = req.body.address;
        const latitude = req.body.latitude;
        const longitude = req.body.longitude;
        const radius_meters = req.body.radius_meters || req.body.radiusMeters || 200;

        if(!nama_rs || !address || latitude === undefined || longitude === undefined) {
            return res.status(400).json({message: "Data tidak lengkap, Silahkan isi semua field."});
        }

        const id = randomUUID();
        await pool.query(
            "INSERT INTO hospitals (id, nama_rs, address, latitude, longitude, radius_meters, type) VALUES (?, ?, ?, ?, ?, ?, 'rumah_sakit')",
            [id, nama_rs, address, latitude, longitude, radius_meters]
        );
        res.status(201).json({
            message: "Rumah sakit berhasil ditambahkan.",
            hospital: { id, nama_rs, name: nama_rs, address, latitude, longitude, radius_meters }
        });
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
        const nama_rs = req.body.nama_rs || req.body.name;
        const address = req.body.address;
        const latitude = req.body.latitude;
        const longitude = req.body.longitude;
        const radius_meters = req.body.radius_meters || req.body.radiusMeters || 200;

        if(!nama_rs || !address || latitude === undefined || longitude === undefined) {
            return res.status(400).json({message: "Data tidak lengkap, Silahkan isi semua field."});
        }

        const [result] = await pool.query(
            "UPDATE hospitals SET nama_rs = ?, address = ?, latitude = ?, longitude = ?, radius_meters = ? WHERE id = ? AND type = 'rumah_sakit'",
            [nama_rs, address, latitude, longitude, radius_meters, id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Rumah sakit tidak ditemukan." });
        }
        res.status(200).json({
            message: "Rumah sakit berhasil diperbarui.",
            hospital: { id, nama_rs, name: nama_rs, address, latitude, longitude, radius_meters }
        });
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
        const [result] = await pool.query("DELETE FROM hospitals WHERE id = ? AND type = 'rumah_sakit'", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Rumah sakit tidak ditemukan." });
        }
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

        // Attendance Trends (Last 7 Days)
        const [attendanceTrends] = await pool.query(
            `SELECT 
                date,
                SUM(CASE WHEN status = 'ON_TIME' THEN 1 ELSE 0 END) as on_time,
                SUM(CASE WHEN status = 'LATE' THEN 1 ELSE 0 END) as late,
                SUM(CASE WHEN status IN ('SICK', 'LEAVE', 'CUTI') THEN 1 ELSE 0 END) as leaves
            FROM attendance_records
            WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY date
            ORDER BY date ASC`
        );

        res.json({
            metrics: {
                totalEmployees: totalEmp[0].count,
                presentToday: present[0].count,
                lateToday: late[0].count,
                pendingLeaves: pendingLeaves[0].count
            },
            recentActivities,
            attendanceTrends
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
        const { date, startDate, endDate } = req.query;

        let query = `
            SELECT a.id, u.name, 
                   COALESCE(u.employee_id, '-') as employeeId,
                   COALESCE(d.name, u.department, 'Staff') as department,
                   COALESCE(p.name, u.position, 'Staff') as position, 
                   u.email as email, a.status, 
                   DATE_FORMAT(a.check_in_time, '%H:%i') as checkInTime, 
                   DATE_FORMAT(a.check_out_time, '%H:%i') as checkOutTime,
                   a.check_in_lat, a.check_in_lng, a.check_in_photo_url,
                   a.check_out_lat, a.check_out_lng, a.check_out_photo_url,
                   DATE_FORMAT(a.date, '%Y-%m-%d') as date
            FROM attendance_records a
            JOIN users u ON a.user_id = u.id
            LEFT JOIN master_departments d ON u.id_department = d.id
            LEFT JOIN master_positions p ON u.id_position = p.id
            WHERE 1=1
        `;
        const params = [];

        if (startDate && endDate) {
            query += ` AND DATE(a.date) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        } else if (startDate) {
            query += ` AND DATE(a.date) >= ?`;
            params.push(startDate);
        } else if (date) {
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


// Helper nama hari bahasa Indonesia
function getIndonesianDayName(dateStr) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return days[d.getDay()] || '';
    }
    const d = new Date(dateStr);
    return days[d.getDay()] || '';
}

// Route Ringkasan Data Absensi Karyawan
// GET /hrd/attendance-summary
router.get("/attendance-summary", async (req, res) => {
    try {
        const { date, startDate, endDate, search } = req.query;

        // Ambil semua karyawan
        let empQuery = `
            SELECT u.id, 
                   u.nik, 
                   u.employee_id,
                   COALESCE(u.employee_id, u.nik) as employeeId, 
                   u.name, 
                   COALESCE(d.name, 'Staff') as department, 
                   u.email, 
                   u.phone, 
                   COALESCE(p.name, 'Staff') as position, 
                   u.role
            FROM users u
            LEFT JOIN master_departments d ON u.id_department = d.id
            LEFT JOIN master_positions p ON u.id_position = p.id
            WHERE 1=1
        `;
        const empParams = [];
        if (search) {
            empQuery += ` AND (u.name LIKE ? OR u.nik LIKE ? OR u.employee_id LIKE ? OR d.name LIKE ?)`;
            const s = `%${search}%`;
            empParams.push(s, s, s, s);
        }
        empQuery += ` ORDER BY u.name ASC`;

        let [employees] = await pool.query(empQuery, empParams);

        if (employees.length === 0 && !search) {
            const [allUsers] = await pool.query(
                `SELECT u.id, u.nik, u.employee_id, COALESCE(u.employee_id, u.nik) as employeeId, u.name, COALESCE(d.name, 'Staff') as department, u.email, u.phone, COALESCE(p.name, 'Staff') as position, u.role 
                 FROM users u
                 LEFT JOIN master_departments d ON u.id_department = d.id
                 LEFT JOIN master_positions p ON u.id_position = p.id
                 ORDER BY u.name ASC`
            );
            employees = allUsers;
        }

        // Ambil data absensi
        let attQuery = `SELECT user_id, status, check_in_time, DATE_FORMAT(date, '%Y-%m-%d') as date FROM attendance_records`;
        const [attendances] = await pool.query(attQuery);

        // Ambil data pengajuan cuti/izin
        let reqQuery = `SELECT user_id, type, reason, status, DATE_FORMAT(date, '%Y-%m-%d') as date, DATE_FORMAT(end_date, '%Y-%m-%d') as end_date FROM requests`;
        const [requests] = await pool.query(reqQuery);

        const targetDateStr = date || getLocalDateString();
        const [tYearStr, tMonthStr] = targetDateStr.split('-');
        const yearStartStr = `${tYearStr}-01-01`;
        const monthStartStr = `${tYearStr}-${tMonthStr}-01`;

        const dayNum = parseInt(targetDateStr.split('-')[2], 10);
        const weekStartStr = `${tYearStr}-${tMonthStr}-${String(Math.floor((dayNum - 1) / 7) * 7 + 1).padStart(2, '0')}`;

        const isReqInRange = (r, sDate, eDate) => {
            const s = r.date;
            const e = r.end_date || r.date;
            return s <= eDate && e >= sDate;
        };

        const calcLateMins = (attList) => {
            let totalMins = 0;
            for (const a of attList) {
                if (a.status === 'LATE') {
                    totalMins += 15;
                }
            }
            return totalMins;
        };

        const summary = employees.map(emp => {
            const userAtt = attendances.filter(a => a.user_id === emp.id);
            const userReq = requests.filter(r => r.user_id === emp.id);

            const yearAtt = userAtt.filter(a => a.date >= yearStartStr && a.date <= targetDateStr);
            const yearReq = userReq.filter(r => isReqInRange(r, yearStartStr, targetDateStr));

            const monthAtt = userAtt.filter(a => a.date >= monthStartStr && a.date <= targetDateStr);
            const monthReq = userReq.filter(r => isReqInRange(r, monthStartStr, targetDateStr));

            const weekAtt = userAtt.filter(a => a.date >= weekStartStr && a.date <= targetDateStr);
            const weekReq = userReq.filter(r => isReqInRange(r, weekStartStr, targetDateStr));

            const todayAtt = userAtt.filter(a => a.date === targetDateStr);
            const todayReq = userReq.filter(r => isReqInRange(r, targetDateStr, targetDateStr));

            const getCounts = (attList, reqList) => {
                const telatCount = attList.filter(a => a.status === 'LATE').length;
                const alpaCount = attList.filter(a => a.status === 'ABSENT').length;
                const hadirCount = attList.filter(a => a.status === 'ON_TIME' || a.status === 'LATE').length;
                const izinCount = reqList.filter(r => (r.type === 'PERMISSION' || r.type === 'IZIN') && r.status !== 'REJECTED').length;
                const sakitCount = reqList.filter(r => (r.type === 'SICK' || r.type === 'SAKIT') && r.status !== 'REJECTED').length;
                const cutiCount = reqList.filter(r => (r.type === 'LEAVE' || r.type === 'CUTI') && r.status !== 'REJECTED').length;
                const lateMins = calcLateMins(attList);
                return { telat: telatCount, alpa: alpaCount, hadir: hadirCount, izin: izinCount, sakit: sakitCount, cuti: cutiCount, lateMins };
            };

            const yearCounts = getCounts(yearAtt, yearReq);
            const monthCounts = getCounts(monthAtt, monthReq);
            const weekCounts = getCounts(weekAtt, weekReq);
            const todayCounts = getCounts(todayAtt, todayReq);

            const hasAnyData = userAtt.length > 0 || userReq.length > 0;

            // Hitung data ringkasan aktif untuk tabel
            let activeCounts;
            let activePeriode;
            let activeSubtext;

            if (startDate && endDate) {
                const rangeAtt = userAtt.filter(a => a.date >= startDate && a.date <= endDate);
                const rangeReq = userReq.filter(r => isReqInRange(r, startDate, endDate));
                activeCounts = getCounts(rangeAtt, rangeReq);
                if (startDate === endDate) {
                    activePeriode = startDate;
                    activeSubtext = 'Filter Tanggal';
                } else {
                    activePeriode = `${startDate} s/d ${endDate}`;
                    activeSubtext = 'Rentang Tanggal';
                }
            } else if (startDate) {
                const rangeAtt = userAtt.filter(a => a.date >= startDate);
                const rangeReq = userReq.filter(r => (r.end_date || r.date) >= startDate);
                activeCounts = getCounts(rangeAtt, rangeReq);
                activePeriode = `Mulai ${startDate}`;
                activeSubtext = 'Filter Tanggal';
            } else if (date) {
                activeCounts = todayCounts;
                activePeriode = date;
                activeSubtext = 'Filter Tanggal';
            } else {
                if (hasAnyData) {
                    activeCounts = getCounts(userAtt, userReq);
                    activePeriode = '08/07/2026 - Sekarang';
                    activeSubtext = 'Rekap Kumulatif';
                } else {
                    activeCounts = { telat: 0, alpa: 0, hadir: 0, izin: 0, sakit: 0, cuti: 0, lateMins: 0 };
                    activePeriode = '-';
                    activeSubtext = null;
                }
            }

            return {
                id: emp.id,
                name: emp.name,
                employeeId: emp.employee_id || emp.employeeId || emp.nik || `EMP-${emp.id.slice(0, 5)}`,
                department: emp.department || 'Staff',
                position: emp.position || 'Staff',
                email: emp.email || '-',
                phone: emp.phone || '-',
                izin: activeCounts.izin,
                sakit: activeCounts.sakit,
                alpa: activeCounts.alpa,
                cuti: activeCounts.cuti,
                telat: activeCounts.telat,
                telatMenit: activeCounts.lateMins,
                hadir: activeCounts.hadir,
                periode: activePeriode,
                periodeSubtext: activeSubtext,
                today: todayCounts,
                weekly: weekCounts,
                monthly: monthCounts,
                yearly: yearCounts,
                hasData: hasAnyData
            };
        });

        res.json({ summary });
    } catch (err) {
        console.error("SQL Error pada /hrd/attendance-summary:", err);
        res.status(500).json({ message: "Gagal mengambil ringkasan absensi karyawan." });
    }
});

// Route Detail Laporan Perorangan
// GET /hrd/employee-report/:userId
router.get("/employee-report/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const { date, startDate, endDate } = req.query;

        // Ambil data profil karyawan
        const [users] = await pool.query(
            `SELECT u.id, u.nik, u.employee_id, COALESCE(u.employee_id, u.nik) as employeeId, u.name, COALESCE(d.name, 'Staff') as department, COALESCE(p.name, 'Staff') as position, u.email, u.phone 
             FROM users u
             LEFT JOIN master_departments d ON u.id_department = d.id
             LEFT JOIN master_positions p ON u.id_position = p.id
             WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "Karyawan tidak ditemukan." });
        }
        const employee = users[0];

        // Ambil data absensi karyawan
        let attQuery = `
            SELECT id, date, status, 
                   DATE_FORMAT(check_in_time, '%H:%i') as checkInTime,
                   DATE_FORMAT(check_out_time, '%H:%i') as checkOutTime,
                   working_hours as workingHours
            FROM attendance_records
            WHERE user_id = ?
        `;
        const attParams = [userId];
        if (startDate && endDate) { attQuery += ` AND date BETWEEN ? AND ?`; attParams.push(startDate, endDate); }
        else if (startDate) { attQuery += ` AND date >= ?`; attParams.push(startDate); }
        else if (date) { attQuery += ` AND date <= ?`; attParams.push(date); }
        attQuery += ` ORDER BY date DESC`;
        const [attendances] = await pool.query(attQuery, attParams);

        // Ambil data pengajuan izin/cuti
        let reqQuery = `
            SELECT id, type, reason, status, DATE_FORMAT(date, '%Y-%m-%d') as date, rejection_reason
            FROM requests
            WHERE user_id = ?
        `;
        const reqParams = [userId];
        if (startDate && endDate) { reqQuery += ` AND date BETWEEN ? AND ?`; reqParams.push(startDate, endDate); }
        else if (startDate) { reqQuery += ` AND date >= ?`; reqParams.push(startDate); }
        else if (date) { reqQuery += ` AND date <= ?`; reqParams.push(date); }
        reqQuery += ` ORDER BY date DESC`;
        const [requests] = await pool.query(reqQuery, reqParams);

        const details = [];
        for (const att of attendances) {
            const dateFormatted = typeof att.date === 'string' ? att.date : (att.date ? new Date(att.date).toISOString().slice(0, 10) : '');
            details.push({
                date: dateFormatted,
                dayName: getIndonesianDayName(dateFormatted),
                category: att.status === 'LATE' ? 'TERLAMBAT' : 'HADIR',
                categoryLabel: att.status === 'LATE' ? 'Terlambat Masuk' : 'Hadir Tepat Waktu',
                keterangan: att.status === 'LATE' ? `Check-in pukul ${att.checkInTime}` : 'Hadir sesuai jadwal',
                status: 'Tercatat di Sistem'
            });
        }

        for (const r of requests) {
            const dateFormatted = typeof r.date === 'string' ? r.date : (r.date ? new Date(r.date).toISOString().slice(0, 10) : '');
            let categoryLabel = 'Izin';
            if (r.type === 'LEAVE' || r.type === 'CUTI') categoryLabel = 'Cuti Kerja';
            else if (r.type === 'SICK' || r.type === 'SAKIT') categoryLabel = 'Izin Sakit';
            
            details.push({
                date: dateFormatted,
                dayName: getIndonesianDayName(dateFormatted),
                category: (r.type === 'LEAVE' || r.type === 'CUTI') ? 'CUTI' : 'IZIN',
                categoryLabel,
                keterangan: r.reason || `Pengajuan ${categoryLabel}`,
                status: r.status === 'APPROVED' ? 'Disetujui HRD' : 'Menunggu'
            });
        }

        details.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const totalIzin = details.filter(d => d.category === 'IZIN').length;
        const totalCuti = details.filter(d => d.category === 'CUTI').length;
        const totalTelat = details.filter(d => d.category === 'TERLAMBAT').length;
        const totalHadir = details.filter(d => d.category === 'HADIR').length;

        res.json({
            employee: {
                id: employee.id,
                name: employee.name,
                employeeId: employee.employeeId || employee.nik || `EMP-${employee.id.slice(0, 5)}`,
                department: employee.department || 'Staff',
                position: employee.position || 'Staff',
                email: employee.email || '-',
                phone: employee.phone || '-'
            },
            summary: { totalIzin, totalCuti, totalTelat, totalHadir, totalHariAktif: details.length },
            periode: (startDate && endDate) ? (startDate === endDate ? startDate : `${startDate} s/d ${endDate}`) : (date ? `s/d ${date}` : "Periode Berjalan"),
            details,
            incidentDetails: details.filter(d => ['IZIN', 'CUTI', 'TERLAMBAT'].includes(d.category))
        });
    } catch (err) {
        console.error("SQL Error pada /hrd/employee-report:", err);
        res.status(500).json({ message: "Gagal mengambil rincian laporan absensi karyawan." });
    }
});

// Route Lihat Data Karyawan
// GET
router.get("/employees", async (req, res) => {
    try {
        const { name, department } = req.query;
        let query = `
            SELECT u.id, u.employee_id as employeeId, u.nik, u.name, u.email, u.phone, u.address, u.emergency_contact,
                   u.status_karyawan, u.performance_status, u.photo_url as profile_photo_url,
                   COALESCE(d.name, u.department, 'Staff') as department_name, 
                   COALESCE(d.name, u.department, 'Staff') as department, 
                   COALESCE(p.name, u.position, 'Staff') as position_name, 
                   COALESCE(p.name, u.position, 'Staff') as position, 
                   u.jam_masuk, u.jam_keluar,
                   COALESCE(
                       CASE 
                           WHEN u.jam_masuk IS NOT NULL AND u.jam_keluar IS NOT NULL 
                           THEN CONCAT(DATE_FORMAT(u.jam_masuk, '%H:%i'), ' - ', DATE_FORMAT(u.jam_keluar, '%H:%i'))
                           ELSE NULL 
                       END,
                       NULLIF(u.schedule, ''),
                       '08:00 - 17:00'
                   ) as schedule,
                   u.hospital_id,
                   COALESCE(h.nama_rs, h.name, '-') as hospital_name,
                   u.role
            FROM users u
            LEFT JOIN master_departments d ON u.id_department = d.id
            LEFT JOIN master_positions p ON u.id_position = p.id
            LEFT JOIN hospitals h ON u.hospital_id = h.id
        `;
        const params = [];
        if (name) { query += ` AND u.name LIKE ?`; params.push(`%${name}%`); }
        if (department) { query += ` AND d.name LIKE ?`; params.push(`%${department}%`); }
        query += ` ORDER BY d.name ASC, u.name ASC`;

        const [employees] = await pool.query(query, params);
        res.status(200).json({ total: employees.length, employees, data: employees });
    } catch (err) {
        console.error("Error Laporan Karyawan:", err);
        res.status(500).json({ message: "Gagal memuat data karyawan." });
    }
});

// Route Tambah Data Karyawan
// POST
router.post("/employees", async (req, res) => {
    try {
        let { name, email, nik, employee_id, phone, password, address, hospital_id, id_department, id_position, jam_masuk, jam_keluar, schedule, role } = req.body;

        if(!name || !nik || !password) {
            return res.status(400).json({
                message: "Data tidak lengkap. Nama, NIK, dan Password wajib diisi."
            });
        }

        // Cek dan buat department baru jika belum ada dan berupa text
        if (id_department && !id_department.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
            const [depts] = await pool.query("SELECT id FROM master_departments WHERE name = ?", [id_department]);
            if (depts.length > 0) {
                id_department = depts[0].id;
            } else {
                const newDeptId = randomUUID();
                await pool.query("INSERT INTO master_departments (id, name) VALUES (?, ?)", [newDeptId, id_department]);
                id_department = newDeptId;
            }
        }

        // Cek dan buat hospital/office baru jika belum ada dan berupa text
        if (hospital_id && !hospital_id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
            const [hosps] = await pool.query("SELECT id FROM hospitals WHERE nama_rs = ? OR name = ?", [hospital_id, hospital_id]);
            if (hosps.length > 0) {
                hospital_id = hosps[0].id;
            } else {
                const newHospId = randomUUID();
                await pool.query("INSERT INTO hospitals (id, nama_rs, address, latitude, longitude, radius_meters, type) VALUES (?, ?, ?, ?, ?, ?, 'kantor')", [newHospId, hospital_id, 'Alamat Belum Diatur', 0, 0, 200]);
                hospital_id = newHospId;
            }
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        const userId = randomUUID();
        
        let finalEmployeeId = employee_id;
        if (!finalEmployeeId) {
            const [rows] = await pool.query("SELECT employee_id FROM users WHERE employee_id LIKE 'CTI-%'");
            let maxId = 0;
            rows.forEach(row => {
                const numStr = row.employee_id.replace('CTI-', '');
                const num = parseInt(numStr, 10);
                if (!isNaN(num) && num > maxId) {
                    maxId = num;
                }
            });
            finalEmployeeId = `CTI-${String(maxId + 1).padStart(3, '0')}`;
        }

        await pool.query(
            `INSERT INTO users (id, employee_id, nik, email, name, phone, password_hash, role, address, hospital_id, id_department, id_position, jam_masuk, jam_keluar, schedule) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, finalEmployeeId, nik, email || null, name, phone || null, password_hash, role || 'EMPLOYEE', address || null, hospital_id || null, id_department || null, id_position || null, jam_masuk || null, jam_keluar || null, schedule || null]
        );

        res.status(201).json({
            message: "Karyawan Berhasil Didaftarkan.",
            employee: { id: userId, name, nik, email }
        });
    } catch (err) {
        console.error("SQL Error pada POST /hrd/employees:", err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ message: "Email atau NIK/Employee ID sudah digunakan." });
        }
        res.status(500).json({message: "Gagal membuat akun karyawan."});
    }
});

// Route HRD Mengubah Data Karyawan
// PUT
router.put("/employees/:id", async (req, res) => {
    try {
        const targetUserId = req.params.id;
        let { 
            name,
            employeeId,
            employee_id,
            nik,
            jam_masuk, 
            jam_keluar, 
            id_department, 
            id_position, 
            email, 
            phone, 
            address, 
            hospital_id,
            emergency_contact, 
            status_karyawan, 
            performance_status, 
            schedule,
            role
        } = req.body;

        const targetEmployeeId = employeeId !== undefined ? employeeId : employee_id;

        // Ekstrak jam_masuk dan jam_keluar jika schedule dikirim dalam format "HH:mm - HH:mm"
        if (schedule && typeof schedule === 'string' && schedule.includes('-')) {
            const parts = schedule.split('-').map(s => s.trim());
            if (parts[0]) jam_masuk = parts[0].length === 5 ? `${parts[0]}:00` : parts[0];
            if (parts[1]) jam_keluar = parts[1].length === 5 ? `${parts[1]}:00` : parts[1];
        }

        // Cek dan buat department baru jika belum ada dan berupa text
        if (id_department && !id_department.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
            const [depts] = await pool.query("SELECT id FROM master_departments WHERE name = ?", [id_department]);
            if (depts.length > 0) {
                id_department = depts[0].id;
            } else {
                const newDeptId = randomUUID();
                await pool.query("INSERT INTO master_departments (id, name) VALUES (?, ?)", [newDeptId, id_department]);
                id_department = newDeptId;
            }
        }

        // Cek dan buat hospital/office baru jika belum ada dan berupa text
        if (hospital_id && !hospital_id.match(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/)) {
            const [hosps] = await pool.query("SELECT id FROM hospitals WHERE nama_rs = ? OR name = ?", [hospital_id, hospital_id]);
            if (hosps.length > 0) {
                hospital_id = hosps[0].id;
            } else {
                const newHospId = randomUUID();
                await pool.query("INSERT INTO hospitals (id, nama_rs, address, latitude, longitude, radius_meters, type) VALUES (?, ?, ?, ?, ?, ?, 'kantor')", [newHospId, hospital_id, 'Alamat Belum Diatur', 0, 0, 200]);
                hospital_id = newHospId;
            }
        }

        const [result] = await pool.query(
            `UPDATE users 
             SET name = COALESCE(?, name),
                 employee_id = COALESCE(?, employee_id),
                 nik = COALESCE(?, nik),
                 jam_masuk = COALESCE(?, jam_masuk), 
                 jam_keluar = COALESCE(?, jam_keluar), 
                 schedule = COALESCE(?, schedule),
                 id_department = ?, 
                 id_position = ?, 
                 email = COALESCE(?, email), 
                 phone = COALESCE(?, phone), 
                 address = COALESCE(?, address), 
                 hospital_id = ?,
                 emergency_contact = COALESCE(?, emergency_contact), 
                 status_karyawan = COALESCE(?, status_karyawan), 
                 performance_status = COALESCE(?, performance_status),
                 role = COALESCE(?, role)
             WHERE id = ?`,
            [
                name, 
                targetEmployeeId, 
                nik !== undefined ? (nik || null) : null, 
                jam_masuk, 
                jam_keluar, 
                schedule,
                id_department || null, 
                id_position || null, 
                email, 
                phone, 
                address, 
                hospital_id || null, 
                emergency_contact, 
                status_karyawan, 
                performance_status,
                role,
                targetUserId
            ]
        );
        
        if(result.affectedRows === 0) return res.status(404).json({message: "Karyawan tidak ditemukan."});
        res.status(200).json({message: "Data karyawan berhasil diperbarui."});
    } catch (err) {
        console.error("SQL Error pada /hrd/employees/:id:", err);
        res.status(500).json({message: "Gagal Memperbarui Data Karyawan."});
    }
});

// Route HRD Menghapus Karyawan
// DELETE
router.delete("/employees/:id", async (req, res) => {
    try {
        const targetUserId = req.params.id;
        if(targetUserId === req.userId) return res.status(400).json({message: "Tidak dapat menghapus akun sendiri."});

        const [result] = await pool.query("DELETE FROM users WHERE id = ?", [targetUserId]);
        if(result.affectedRows === 0) return res.status(404).json({message: "Karyawan tidak ditemukan."});
        res.status(200).json({message: "Karyawan berhasil dihapus."});
    } catch (err) {
        console.error("SQL Error pada /hrd/employees/:id:", err);
        res.status(500).json({message: "Gagal Menghapus Karyawan."});
    }
});

// Route Manajemen Perizinan
// GET 
router.get("/leaves", async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let query = `SELECT 
                r.id, 
                u.name, 
                r.type, 
                r.reason, 
                DATE_FORMAT(r.date, '%Y-%m-%d') as date, 
                DATE_FORMAT(r.end_date, '%Y-%m-%d') as end_date,
                r.status, 
                r.rejection_reason,
                r.attachment_url,
                r.created_at
            FROM requests r
            JOIN users u ON r.user_id = u.id
            WHERE 1=1`;
        const params = [];
        
        if (startDate && endDate) {
            query += ` AND DATE(r.date) BETWEEN ? AND ?`;
            params.push(startDate, endDate);
        }

        query += ` ORDER BY r.created_at DESC`;

        const [rows] = await pool.query(query, params);
        
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
        const { status, rejection_reason } = req.body; 

        if(!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({message: "Invalid status value."});
        }

        // Ambil data pengajuan untuk notifikasi ke karyawan
        const [reqRows] = await pool.query(
            "SELECT user_id, type, DATE_FORMAT(date, '%Y-%m-%d') as date FROM requests WHERE id = ?", 
            [id]
        );

        await pool.query(
            "UPDATE requests SET status = ?, rejection_reason = ? WHERE id = ?",
            [status, status === 'REJECTED' ? (rejection_reason || null) : null, id]
        );

        if (reqRows.length > 0) {
            const reqItem = reqRows[0];
            const typeLabel = reqItem.type === 'LEAVE' ? 'Cuti' : (reqItem.type === 'PERMISSION' ? 'Izin' : (reqItem.type === 'SICK' ? 'Sakit' : reqItem.type));
            const notifTitle = status === 'APPROVED' ? `Pengajuan ${typeLabel} Disetujui` : `Pengajuan ${typeLabel} Ditolak`;
            const notifDesc = status === 'APPROVED'
                ? `Pengajuan ${typeLabel} Anda untuk tanggal ${reqItem.date} telah disetujui HRD.`
                : `Pengajuan ${typeLabel} Anda untuk tanggal ${reqItem.date} ditolak. Alasan: ${rejection_reason || 'Tidak ada alasan khusus.'}`;

            await pool.query(
                "INSERT INTO notifications (id, user_id, title, description, type) VALUES (UUID(), ?, ?, ?, ?)",
                [reqItem.user_id, notifTitle, notifDesc, status === 'APPROVED' ? 'SUCCESS' : 'WARNING']
            ).catch(e => console.error("Gagal mengirim notifikasi status cuti:", e));
        }

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


// API OFFICES =====================================================================================================================================================================>

// GET
router.get("/offices", async (req, res)=> {
    try {
        // Hanya ambil data yang bertipe 'kantor'
        const [rows] = await pool.query(
            "SELECT id, nama_rs as name, address, latitude, longitude, radius_meters FROM hospitals WHERE type = 'kantor' ORDER BY nama_rs ASC"
        );
        res.json({ offices: rows });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Gagal memuat daftar kantor." });
    }
});

// POST
router.post("/offices", async (req, res)=> {
    try {
        const name = req.body.name;
        const address = req.body.address;
        const latitude = req.body.latitude;
        const longitude = req.body.longitude;
        const radius_meters = req.body.radius_meters || req.body.radiusMeters || 200;
        
        const type = 'kantor'; 

        if (!name || !address || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: "Data tidak lengkap." });
        }

        const id = randomUUID();

        await pool.query(
            "INSERT INTO hospitals (id, nama_rs, address, latitude, longitude, radius_meters, type) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [id, name, address, latitude, longitude, radius_meters, type]
        );
        
        res.status(201).json({
            message: "Kantor berhasil ditambahkan.",
            office: { id, name, address, latitude, longitude, radius_meters }
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Gagal menambahkan kantor." });
    }
});

// PUT
router.put("/offices/:id", async (req, res)=> {
    try {
        const { id } = req.params;
        const name = req.body.name;
        const address = req.body.address;
        const latitude = req.body.latitude;
        const longitude = req.body.longitude;
        const radius_meters = req.body.radius_meters || req.body.radiusMeters || 200;

        if (!name || !address || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ message: "Data tidak lengkap." });
        }

        // Pastikan hanya bisa mengedit jika type-nya 'kantor'
        const [result] = await pool.query(
            "UPDATE hospitals SET nama_rs = ?, address = ?, latitude = ?, longitude = ?, radius_meters = ? WHERE id = ? AND type = 'kantor'",
            [name, address, latitude, longitude, radius_meters, id]
        );
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Kantor tidak ditemukan." });
        }
        res.status(200).json({
            message: "Kantor berhasil diperbarui.",
            office: { id, name, address, latitude, longitude, radius_meters }
        });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Gagal memperbarui kantor." });
    }
});

// DELETE
router.delete("/offices/:id", async (req, res) => {
    try {
        const { id } = req.params;
        // Pastikan hanya menghapus jika type-nya 'kantor'
        const [result] = await pool.query("DELETE FROM hospitals WHERE id = ? AND type = 'kantor'", [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Kantor tidak ditemukan." });
        }
        res.status(200).json({ message: "Kantor berhasil dihapus." });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ message: "Gagal menghapus kantor." });
    }
});
// ==========================================================================================================================================================================================>



// Route Manajemen KPI
// GET
router.get("/kpi", async (req, res) => {
    try {
        const month = req.query.month || new Date().toISOString().substring(0,7); // e.g. '2026-08'
        
        // 1. Ambil semua karyawan
        const [users] = await pool.query(`
            SELECT u.id, u.name, COALESCE(d.name, u.department, 'Staff') as department 
            FROM users u
            LEFT JOIN master_departments d ON u.id_department = d.id
            ORDER BY u.name
        `);
        
        // 2. Ambil absensi bulan ini
        const [attendances] = await pool.query(
            `SELECT user_id, status, date FROM attendance_records WHERE DATE_FORMAT(date, '%Y-%m') = ?`,
            [month]
        );
        
        // 3. Ambil cuti/izin bulan ini (yang disetujui)
        const [requests] = await pool.query(
            `SELECT user_id, type FROM requests WHERE status IN ('APPROVED', 'DISETUJUI') AND DATE_FORMAT(date, '%Y-%m') = ?`,
            [month]
        );
        
        // 4. Ambil input manual KPI
        const [evals] = await pool.query(
            `SELECT * FROM kpi_evaluations WHERE month_year = ?`,
            [month]
        );
        
        // Estimasi hari kerja (jumlah tanggal unik dimana ada absen dari siapapun)
        const uniqueDates = new Set(attendances.map(a => a.date.toString()));
        const workDays = uniqueDates.size;
        
        const kpiData = users.map(user => {
            const userAtt = attendances.filter(a => a.user_id === user.id);
            const userReq = requests.filter(r => r.user_id === user.id);
            const userEval = evals.find(e => e.user_id === user.id) || {
                terlambat_laporan: 0,
                laporan_tidak_sesuai: 0,
                komplain: 0,
                target_persen: 0,
                pelanggaran_sop: 0,
                skor_disiplin: null,
                skor_terlambat: null,
                skor_kinerja: null,
                skor_sop: null
            };
            
            const izin = userReq.filter(r => r.type === 'PERMISSION' || r.type === 'IZIN').length;
            const sakit = userReq.filter(r => r.type === 'SICK' || r.type === 'SAKIT').length;
            const cuti = userReq.filter(r => r.type === 'LEAVE' || r.type === 'CUTI').length;
            const terlambat = userAtt.filter(a => a.status === 'LATE').length;
            const alfa = userAtt.filter(a => a.status === 'ABSENT').length;

            // Logika Skoring — auto-calculate dulu, lalu override jika ada nilai manual
            // Misalnya skor disiplin dinilai dari izin+sakit+alfa
            const auto_skor_disiplin = (izin + sakit + alfa) >= 5 ? 0 : 1;
            const auto_skor_terlambat = terlambat >= 3 ? 0 : 1;
            
            let auto_skor_kinerja = 0;
            if (userEval.target_persen >= 80) auto_skor_kinerja = 2;
            else if (userEval.target_persen >= 50) auto_skor_kinerja = 1;
            
            let auto_skor_sop = 4;
            if (userEval.pelanggaran_sop) auto_skor_sop -= 1;
            if (userEval.komplain > 0) auto_skor_sop -= 1;
            if (userEval.laporan_tidak_sesuai > 0) auto_skor_sop -= 1;
            if (userEval.terlambat_laporan > 0) auto_skor_sop -= 1;
            if (auto_skor_sop < 0) auto_skor_sop = 0;

            // Gunakan nilai manual jika ada (bukan null), kalau null pakai auto
            const skor_disiplin = userEval.skor_disiplin !== null && userEval.skor_disiplin !== undefined
                ? userEval.skor_disiplin : auto_skor_disiplin;
            const skor_terlambat = userEval.skor_terlambat !== null && userEval.skor_terlambat !== undefined
                ? userEval.skor_terlambat : auto_skor_terlambat;
            const skor_kinerja = userEval.skor_kinerja !== null && userEval.skor_kinerja !== undefined
                ? userEval.skor_kinerja : auto_skor_kinerja;
            const skor_sop = userEval.skor_sop !== null && userEval.skor_sop !== undefined
                ? userEval.skor_sop : auto_skor_sop;
            
            const total_skor = skor_disiplin + skor_terlambat + skor_kinerja + skor_sop;
            let kategori = 'KURANG';
            if (total_skor >= 5) kategori = 'BERKUALITAS';
            else if (total_skor === 4) kategori = 'CUKUP';
            
            return {
                user_id: user.id,
                name: user.name,
                department: user.department,
                izin,
                sakit,
                cuti,
                alfa,
                terlambat,
                terlambat_laporan: userEval.terlambat_laporan,
                laporan_tidak_sesuai: userEval.laporan_tidak_sesuai,
                komplain: userEval.komplain,
                target_persen: userEval.target_persen,
                pelanggaran_sop: userEval.pelanggaran_sop ? 'Y' : 'T',
                skor_disiplin,
                skor_terlambat,
                skor_kinerja,
                skor_sop,
                total_skor,
                kategori,
                // Kirim juga auto values supaya frontend bisa tampilkan sebagai placeholder
                auto_skor_disiplin,
                auto_skor_terlambat,
                auto_skor_kinerja,
                auto_skor_sop,
                // Flag apakah skor pakai manual override
                skor_manual: {
                    disiplin: userEval.skor_disiplin !== null && userEval.skor_disiplin !== undefined,
                    terlambat: userEval.skor_terlambat !== null && userEval.skor_terlambat !== undefined,
                    kinerja: userEval.skor_kinerja !== null && userEval.skor_kinerja !== undefined,
                    sop: userEval.skor_sop !== null && userEval.skor_sop !== undefined
                }
            };
        });
        
        res.json({ kpi: kpiData });
    } catch (err) {
        console.error("Error on /hrd/kpi:", err);
        res.status(500).json({message: "Failed to fetch KPI data."});
    }
});

// POST
router.post("/kpi", async (req, res) => {
    try {
        const { user_id, month_year, terlambat_laporan, laporan_tidak_sesuai, komplain, target_persen, pelanggaran_sop,
                skor_disiplin, skor_terlambat, skor_kinerja, skor_sop } = req.body;
        
        const id = randomUUID();
        const sopBool = pelanggaran_sop === 'Y' ? 1 : 0;

        // Skor: jika kosong/undefined → null (pakai auto), jika ada angka → simpan manual override
        const parseSkor = (val) => {
            if (val === '' || val === null || val === undefined) return null;
            const n = parseInt(val);
            return isNaN(n) ? null : n;
        };
        
        await pool.query(
            `INSERT INTO kpi_evaluations 
            (id, user_id, month_year, terlambat_laporan, laporan_tidak_sesuai, komplain, target_persen, pelanggaran_sop,
             skor_disiplin, skor_terlambat, skor_kinerja, skor_sop) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
            terlambat_laporan = VALUES(terlambat_laporan),
            laporan_tidak_sesuai = VALUES(laporan_tidak_sesuai),
            komplain = VALUES(komplain),
            target_persen = VALUES(target_persen),
            pelanggaran_sop = VALUES(pelanggaran_sop),
            skor_disiplin = VALUES(skor_disiplin),
            skor_terlambat = VALUES(skor_terlambat),
            skor_kinerja = VALUES(skor_kinerja),
            skor_sop = VALUES(skor_sop)`,
            [id, user_id, month_year, terlambat_laporan || 0, laporan_tidak_sesuai || 0, komplain || 0, target_persen || 0, sopBool,
             parseSkor(skor_disiplin), parseSkor(skor_terlambat), parseSkor(skor_kinerja), parseSkor(skor_sop)]
        );
        
        res.json({ message: "KPI Evaluation saved successfully." });
    } catch (err) {
        console.error("Error saving KPI:", err);
        res.status(500).json({ message: "Failed to save KPI evaluation." });
    }
});

// Route Rekrutmen
// POST 
router.post("/recruitment/jobs", async (req, res) => {
    try {
        const title = req.body.title;
        const role = req.body.role || req.body.department;
        if (!title || !role) return res.status(400).json({ message: "Data not complete." });
        
        const id = randomUUID();
        await pool.query(
            "INSERT INTO job_openings (id, title, role, department, status) VALUES (?, ?, ?, ?, 'OPEN')",
            [id, title, role, role]   
        );
        res.status(201).json({ message: "Job opening created successfully.", jobId: id });
    } catch (err) {
        console.error("Error creating job opening:", err);
        res.status(500).json({ message: "Failed to create job opening." });
    }
});

// Route Rekrutmen
//GET
router.get("/recruitment/overview", async (req, res)=> {
    try {
        const [rows] = await pool.query(
            `SELECT j.id, j.title, 
                    COALESCE(j.role, j.department, '') as role, 
                    COALESCE(j.department, j.role, '') as department,
                    CASE WHEN j.status = 'ACTIVE' THEN 'OPEN' ELSE j.status END as status, 
                    j.created_at,
                    COUNT(c.id) as total_candidates,
                    COALESCE(SUM(CASE WHEN c.stage = 'INTERVIEW' THEN 1 ELSE 0 END), 0) as interview_count
            FROM job_openings j
            LEFT JOIN candidates c ON j.id = c.job_opening_id
            GROUP BY j.id
            ORDER BY j.created_at DESC`
        );
        res.json({ recruitment: rows });
    } catch (err) {
        console.error("Error fetching recruitment overview:", err);
        res.status(500).json({ message: "Failed to fetch recruitment overview." });
    }
});

// Route Rekrutmen
// EDIT
router.put("/recruitment/jobs/:id", async (req, res)=> {
    try {
        const { id } = req.params;
        const title = req.body.title;
        const role = req.body.role || req.body.department;
        const status = req.body.status;

        if (!title || !role || !status) {
            return res.status(400).json({ message: "Data not complete." });
        }

        if (!['OPEN', 'ACTIVE', 'CLOSED'].includes(status)) {
            return res.status(400).json({ message: "Invalid status value." });
        }

        const [result] = await pool.query(
            "UPDATE job_openings SET title = ?, role = ?, department = ?, status = ? WHERE id = ?",
            [title, role, role, status === 'ACTIVE' ? 'OPEN' : status, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Job opening not found." });
        }

        res.json({ message: "Job opening updated successfully." });
    } catch (err) {
        console.error("Error updating job opening:", err);
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

// Route Candidates
// GET
router.get("/recruitment/candidates", async (req, res) => {
    try {
        const { job_opening_id } = req.query;
        let query = `SELECT c.*, j.title as job_title, j.role as job_role
                     FROM candidates c
                     JOIN job_openings j ON c.job_opening_id = j.id`;
        const params = [];
        if (job_opening_id) {
            query += " WHERE c.job_opening_id = ?";
            params.push(job_opening_id);
        }
        query += " ORDER BY c.created_at DESC";
        const [rows] = await pool.query(query, params);
        res.json({ candidates: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to fetch candidates." });
    }
});

// POST Candidate
router.post("/recruitment/candidates", async (req, res) => {
    try {
        const { 
            job_opening_id, name, stage = 'SCREENING', 
            tempat_tanggal_lahir, umur, no_ktp, jenis_kelamin, 
            no_telepon, status_pernikahan, email, alamat, 
            pendidikan, jurusan, pengalaman, cv_lamaran, 
            tgl_dipanggil, hasil_interview
        } = req.body;
        
        if (!job_opening_id || !name) {
            return res.status(400).json({ message: "Data candidate not complete." });
        }
        const id = randomUUID();
        await pool.query(
            `INSERT INTO candidates (
                id, job_opening_id, name, stage, tempat_tanggal_lahir, umur, no_ktp, jenis_kelamin, 
                no_telepon, status_pernikahan, email, alamat, pendidikan, jurusan, pengalaman, 
                cv_lamaran, tgl_dipanggil, hasil_interview
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                id, job_opening_id, name, stage, 
                tempat_tanggal_lahir || null, umur || null, no_ktp || null, jenis_kelamin || null,
                no_telepon || null, status_pernikahan || null, email || null, alamat || null, 
                pendidikan || null, jurusan || null, pengalaman || null, cv_lamaran || null, 
                tgl_dipanggil || null, hasil_interview || null
            ]
        );
        res.status(201).json({ message: "Candidate added successfully.", candidateId: id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to add candidate." });
    }
});

// PUT Candidate (Full Update)
router.put("/recruitment/candidates/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            name, stage, tempat_tanggal_lahir, umur, no_ktp, jenis_kelamin, 
            no_telepon, status_pernikahan, email, alamat, pendidikan, jurusan, 
            pengalaman, cv_lamaran, tgl_dipanggil, hasil_interview
        } = req.body;

        await pool.query(
            `UPDATE candidates SET 
                name = ?, stage = ?, tempat_tanggal_lahir = ?, umur = ?, no_ktp = ?, 
                jenis_kelamin = ?, no_telepon = ?, status_pernikahan = ?, email = ?, 
                alamat = ?, pendidikan = ?, jurusan = ?, pengalaman = ?, cv_lamaran = ?, 
                tgl_dipanggil = ?, hasil_interview = ?
            WHERE id = ?`,
            [
                name, stage, tempat_tanggal_lahir || null, umur || null, no_ktp || null, 
                jenis_kelamin || null, no_telepon || null, status_pernikahan || null, email || null, 
                alamat || null, pendidikan || null, jurusan || null, pengalaman || null, 
                cv_lamaran || null, tgl_dipanggil || null, hasil_interview || null,
                id
            ]
        );
        res.json({ message: "Candidate updated successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update candidate." });
    }
});

// PATCH Candidate Stage
router.patch("/recruitment/candidates/:id/stage", async (req, res) => {
    try {
        const { id } = req.params;
        const { stage } = req.body;
        if (!['SCREENING', 'INTERVIEW', 'HIRED', 'REJECTED'].includes(stage)) {
            return res.status(400).json({ message: "Invalid candidate stage." });
        }
        await pool.query("UPDATE candidates SET stage = ? WHERE id = ?", [stage, id]);
        res.json({ message: "Candidate stage updated successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update candidate stage." });
    }
});

// DELETE Candidate
router.delete("/recruitment/candidates/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM candidates WHERE id = ?", [id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Candidate not found." });
        }
        res.json({ message: "Candidate deleted successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to delete candidate." });
    }
});

// ==========================================================================================================================================================================================>
// API DYNAMIC KPI (MANAJEMEN KPI DINAMIS)
// ==========================================================================================================================================================================================>

// GET semua KPI Templates
router.get("/kpi-templates", async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT id, nama_halaman, target_bagian, skema_kolom, created_at, updated_at FROM kpi_templates ORDER BY created_at ASC"
        );
        // Parse skema_kolom dari string JSON ke array jika perlu
        const templates = rows.map(r => ({
            ...r,
            skema_kolom: typeof r.skema_kolom === 'string' ? JSON.parse(r.skema_kolom) : r.skema_kolom
        }));
        res.json({ templates });
    } catch (err) {
        console.error("Error GET /kpi-templates:", err);
        res.status(500).json({ message: "Gagal memuat daftar template KPI." });
    }
});

// POST buat KPI Template baru
router.post("/kpi-templates", async (req, res) => {
    try {
        const { nama_halaman, target_bagian, skema_kolom } = req.body;

        if (!nama_halaman || !target_bagian || !skema_kolom || !Array.isArray(skema_kolom) || skema_kolom.length === 0) {
            return res.status(400).json({ message: "Data tidak lengkap. Nama halaman, target bagian, dan minimal 1 kolom metrik wajib diisi." });
        }

        const id = randomUUID();
        await pool.query(
            "INSERT INTO kpi_templates (id, nama_halaman, target_bagian, skema_kolom) VALUES (?, ?, ?, ?)",
            [id, nama_halaman, target_bagian, JSON.stringify(skema_kolom)]
        );

        res.status(201).json({
            message: "Template KPI berhasil dibuat.",
            template: { id, nama_halaman, target_bagian, skema_kolom }
        });
    } catch (err) {
        console.error("Error POST /kpi-templates:", err);
        res.status(500).json({ message: "Gagal membuat template KPI." });
    }
});

// PUT update KPI Template
router.put("/kpi-templates/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { nama_halaman, target_bagian, skema_kolom } = req.body;

        if (!nama_halaman || !target_bagian || !skema_kolom || !Array.isArray(skema_kolom) || skema_kolom.length === 0) {
            return res.status(400).json({ message: "Data tidak lengkap." });
        }

        const [result] = await pool.query(
            "UPDATE kpi_templates SET nama_halaman = ?, target_bagian = ?, skema_kolom = ? WHERE id = ?",
            [nama_halaman, target_bagian, JSON.stringify(skema_kolom), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Template KPI tidak ditemukan." });
        }

        res.json({ message: "Template KPI berhasil diperbarui." });
    } catch (err) {
        console.error("Error PUT /kpi-templates/:id:", err);
        res.status(500).json({ message: "Gagal memperbarui template KPI." });
    }
});

// DELETE KPI Template
router.delete("/kpi-templates/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await pool.query("DELETE FROM kpi_templates WHERE id = ?", [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Template KPI tidak ditemukan." });
        }

        res.json({ message: "Template KPI berhasil dihapus." });
    } catch (err) {
        console.error("Error DELETE /kpi-templates/:id:", err);
        res.status(500).json({ message: "Gagal menghapus template KPI." });
    }
});

// GET evaluasi KPI Dinamis berdasarkan template + periode
// Memfilter karyawan berdasarkan target_bagian dan JOIN dengan data absensi
router.get("/kpi-dynamic/:templateId", async (req, res) => {
    try {
        const { templateId } = req.params;
        const { periode } = req.query; // format: "September 2026"

        if (!periode) {
            return res.status(400).json({ message: "Parameter 'periode' wajib diisi." });
        }

        // 1. Ambil data template
        const [templates] = await pool.query("SELECT * FROM kpi_templates WHERE id = ?", [templateId]);
        if (templates.length === 0) {
            return res.status(404).json({ message: "Template KPI tidak ditemukan." });
        }
        const template = templates[0];
        const skemaKolom = typeof template.skema_kolom === 'string' ? JSON.parse(template.skema_kolom) : template.skema_kolom;

        // 2. Ambil karyawan yang bagiannya sesuai target_bagian
        // Filter berdasarkan nama divisi (dari master_departments) yang cocok dengan target_bagian template
        const [employees] = await pool.query(
            `SELECT u.id, u.name, COALESCE(d.name, u.department, '-') as department,
                    COALESCE(p.name, u.position, '-') as position
             FROM users u
             LEFT JOIN master_departments d ON u.id_department = d.id
             LEFT JOIN master_positions p ON u.id_position = p.id
             WHERE u.role = 'EMPLOYEE'
               AND (? = 'Seluruh Karyawan' OR COALESCE(d.name, u.department, '') = ?)
             ORDER BY u.name ASC`,
            [template.target_bagian, template.target_bagian]
        );

        // 3. Parse periode ke month range untuk query absensi
        // Format periode: "September 2026"
        const bulanMap = {
            'Januari': '01', 'Februari': '02', 'Maret': '03', 'April': '04',
            'Mei': '05', 'Juni': '06', 'Juli': '07', 'Agustus': '08',
            'September': '09', 'Oktober': '10', 'November': '11', 'Desember': '12'
        };

        let monthYear = null;
        const periodeMatch = periode.match(/^(\w+)\s+(\d{4})$/);
        if (periodeMatch) {
            const monthNum = bulanMap[periodeMatch[1]];
            if (monthNum) {
                monthYear = `${periodeMatch[2]}-${monthNum}`;
            }
        }

        // 4. Ambil data absensi otomatis per karyawan
        const employeeIds = employees.map(e => e.id);
        let absensiMap = {};

        if (employeeIds.length > 0 && monthYear) {
            const [attendances] = await pool.query(
                `SELECT user_id, status FROM attendance_records
                 WHERE user_id IN (?) AND DATE_FORMAT(date, '%Y-%m') = ?`,
                [employeeIds, monthYear]
            );

            const [reqs] = await pool.query(
                `SELECT user_id, type FROM requests
                 WHERE user_id IN (?) AND status IN ('APPROVED', 'DISETUJUI') AND DATE_FORMAT(date, '%Y-%m') = ?`,
                [employeeIds, monthYear]
            );

            for (const empId of employeeIds) {
                const userAtt = attendances.filter(a => a.user_id === empId);
                const userReq = reqs.filter(r => r.user_id === empId);

                const izin = userReq.filter(r => ['PERMISSION', 'LEAVE', 'SICK'].includes(r.type)).length;
                const alfa_count = userAtt.filter(a => a.status === 'ABSENT').length;
                const terlambat = userAtt.filter(a => a.status === 'LATE').length;

                absensiMap[empId] = {
                    izin: izin,
                    alfa: alfa_count,
                    terlambat: terlambat
                };
            }
        }

        // 5. Ambil data evaluasi yang sudah tersimpan
        let existingEvals = {};
        if (employeeIds.length > 0) {
            const [evals] = await pool.query(
                `SELECT id_karyawan, nilai_custom FROM kpi_dynamic_evaluations
                 WHERE id_template = ? AND periode = ? AND id_karyawan IN (?)`,
                [templateId, periode, employeeIds]
            );
            for (const ev of evals) {
                existingEvals[ev.id_karyawan] = typeof ev.nilai_custom === 'string' ? JSON.parse(ev.nilai_custom) : ev.nilai_custom;
            }
        }

        // 6. Gabungkan data
        const evaluations = employees.map(emp => {
            const absensi = absensiMap[emp.id] || { izin: 0, alfa: 0, terlambat: 0 };
            const nilaiCustom = existingEvals[emp.id] || {};

            // Pastikan setiap kolom di skema ada di nilai_custom, default ke string kosong
            const nilaiLengkap = {};
            for (const kolomDef of skemaKolom) {
                const isObj = typeof kolomDef === 'object' && kolomDef !== null;
                const colKey = isObj ? kolomDef.id_kolom : kolomDef;
                nilaiLengkap[colKey] = nilaiCustom[colKey] !== undefined ? nilaiCustom[colKey] : '';
            }

            return {
                id_karyawan: emp.id,
                nama: emp.name,
                department: emp.department,
                position: emp.position,
                absensi: {
                    izin: absensi.izin,
                    alfa: absensi.alfa,
                    terlambat: absensi.terlambat
                },
                nilai_custom: nilaiLengkap
            };
        });

        res.json({
            template: {
                id: template.id,
                nama_halaman: template.nama_halaman,
                target_bagian: template.target_bagian,
                skema_kolom: skemaKolom
            },
            periode,
            evaluations
        });

    } catch (err) {
        console.error("Error GET /kpi-dynamic/:templateId:", err);
        res.status(500).json({ message: "Gagal memuat data evaluasi KPI." });
    }
});

// POST/PUT batch save evaluasi KPI Dinamis
router.post("/kpi-dynamic/:templateId", async (req, res) => {
    try {
        const { templateId } = req.params;
        const { periode, evaluations } = req.body;
        // evaluations = [{ id_karyawan: '...', nilai_custom: { "Efisiensi": 80, ... } }, ...]

        if (!periode || !evaluations || !Array.isArray(evaluations)) {
            return res.status(400).json({ message: "Parameter 'periode' dan 'evaluations' (array) wajib diisi." });
        }

        // Verifikasi template ada
        const [templates] = await pool.query("SELECT id FROM kpi_templates WHERE id = ?", [templateId]);
        if (templates.length === 0) {
            return res.status(404).json({ message: "Template KPI tidak ditemukan." });
        }

        // Batch upsert
        let savedCount = 0;
        for (const evalItem of evaluations) {
            if (!evalItem.id_karyawan || !evalItem.nilai_custom) continue;

            const id = randomUUID();
            await pool.query(
                `INSERT INTO kpi_dynamic_evaluations (id, id_template, periode, id_karyawan, nilai_custom)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 nilai_custom = VALUES(nilai_custom),
                 updated_at = CURRENT_TIMESTAMP`,
                [id, templateId, periode, evalItem.id_karyawan, JSON.stringify(evalItem.nilai_custom)]
            );
            savedCount++;
        }

        res.json({ message: `Berhasil menyimpan ${savedCount} evaluasi KPI.`, saved: savedCount });
    } catch (err) {
        console.error("Error POST /kpi-dynamic/:templateId:", err);
        res.status(500).json({ message: "Gagal menyimpan data evaluasi KPI." });
    }
});

export default router;

