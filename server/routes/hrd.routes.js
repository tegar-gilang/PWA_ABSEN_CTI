import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { randomUUID } from "crypto";

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

// Route Dahsboard HRD
// GET
router.get("/dashboard/overview", async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        const [totalEmp] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'EMPLOYEE'");
        const [present] = await pool.query("SELECT COUNT(*) AS count FROM attendance_records WHERE date = ? AND status = 'ON_TIME'", [today]);
        const [late] = await pool.query("SELECT COUNT(*) AS count FROM attendance_records WHERE date = ? AND status = 'LATE'", [today]);
        const [pendingLeaves] = await pool.query("SELECT COUNT(*) AS count FROM requests WHERE status = 'PENDING'");

        // Recent Activities
        const [recentActivities] = await pool.query(
            `SELECT a.id, u.name, u.department as role, 'Check-in/out' as action, 
                    DATE_FORMAT(a.check_in_time, '%H:%I %p') as time, a.status
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

// Route Manajemen Kehadiran
// GET
router.get("/attendance", async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT a.id, u.name, a.status, 
                    DATE_FORMAT(a.check_in_time, '%H:%i') as checkInTime, 
                    DATE_FORMAT(a.check_out_time, '%H:%i') as checkOutTime,
                    a.check_in_lat, a.check_in_lng, a.check_in_photo_url
            FROM attendance_records a
            JOIN users u ON a.user_id = u.id
            ORDER BY a.date DESC`
        );
        res.json({ attendance: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Failed to Fetch Attendance Records."});
    }
});

// Route Manajemen Karyawan
// GET
router.get("/employees", async (req, res) => {
    try {
        const [rows] = await pool.query(
                    `SELECT id, name, department, status_karyawan, performance_status, schedule 
            FROM users WHERE role = 'EMPLOYEE'`
        );
        res.json({ employees: rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({message: "Failed to Fetch Employees."});
    }
});

// Route Manajemen Cuti
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
        
        res.json({ leaves: rows });
    } catch (err) {
        console.error("Error mengambil data cuti:", err);
        res.status(500).json({ message: "Gagal memuat daftar permintaan cuti/izin." });
    }
});

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
