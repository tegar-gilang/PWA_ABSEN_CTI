import { Router } from "express";
import { randomUUID } from "crypto";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { haversineDistanceMeters, classifyAccuracy } from "../utils/geo.js";

const router = Router();
router.use(requireAuth);

// Ambang batas akurasi GPS maksimum yang masih bisa diterima (meter).
// Jika accuracy dari device lebih besar dari ini, absen ditolak agar data lokasi tetap valid.
const MAX_ACCURACY_METERS = Number(process.env.MAX_ACCURACY_METERS) || 75;

// Jam mulai kerja untuk menentukan status ON_TIME / LATE (format 24 jam)
const WORK_START_HOUR = Number(process.env.WORK_START_HOUR) || 9;
const WORK_START_MINUTE = Number(process.env.WORK_START_MINUTE) || 0;
const LATE_GRACE_MINUTES = Number(process.env.LATE_GRACE_MINUTES) || 15;

// Menentukan apakah absen dibatasi hanya di radius kantor tertentu (geofencing).
// Default NONAKTIF karena target pengguna adalah teknisi lapangan yang lokasi kerjanya
// berpindah-pindah - lokasi GPS tetap direkam apa adanya, tanpa dibatasi radius kantor.
// Set ENABLE_GEOFENCING=true di .env jika suatu saat ingin mengaktifkan pembatasan radius kantor.
const ENABLE_GEOFENCING = String(process.env.ENABLE_GEOFENCING || "false").toLowerCase() === "true";

function toRecordDTO(row) {
  return {
    id: row.id,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date,
    checkInTime: row.check_in_time ? new Date(row.check_in_time).toISOString() : null,
    checkOutTime: row.check_out_time ? new Date(row.check_out_time).toISOString() : null,
    status: row.status,
    workingHours: row.working_hours != null ? Number(row.working_hours) : null,
    checkInLocation:
      row.check_in_lat != null
        ? { lat: Number(row.check_in_lat), lng: Number(row.check_in_lng), accuracy: row.check_in_accuracy_m != null ? Number(row.check_in_accuracy_m) : null }
        : null,
    checkOutLocation:
      row.check_out_lat != null
        ? { lat: Number(row.check_out_lat), lng: Number(row.check_out_lng), accuracy: row.check_out_accuracy_m != null ? Number(row.check_out_accuracy_m) : null }
        : null,
    checkInPhotoUrl: row.check_in_photo_url || null,
    checkOutPhotoUrl: row.check_out_photo_url || null,
    checkInDistanceMeters: row.check_in_distance_m != null ? Number(row.check_in_distance_m) : null,
    checkOutDistanceMeters: row.check_out_distance_m != null ? Number(row.check_out_distance_m) : null,
  };
}

async function getActiveOffice() {
  const [rows] = await pool.query("SELECT * FROM offices ORDER BY id ASC LIMIT 1");
  return rows[0] || null;
}

/**
 * Validasi bersama untuk check-in maupun check-out:
 * - Memastikan lat/lng/accuracy dikirim
 * - Menolak jika akurasi GPS terlalu buruk (di atas ambang batas)
 * - Menghitung jarak ke kantor & menolak jika di luar radius geofence
 */
async function validateGeoOrThrow({ lat, lng, accuracy }) {
  if (lat == null || lng == null) {
    const err = new Error("Data lokasi GPS tidak ditemukan. Pastikan GPS aktif.");
    err.status = 400;
    throw err;
  }

  if (accuracy == null || Number.isNaN(Number(accuracy))) {
    const err = new Error("Data akurasi GPS tidak ditemukan.");
    err.status = 400;
    throw err;
  }

  if (Number(accuracy) > MAX_ACCURACY_METERS) {
    const err = new Error(
      `Akurasi GPS terlalu rendah (±${Math.round(accuracy)} m). Mohon pindah ke area terbuka dan coba lagi (maksimal ±${MAX_ACCURACY_METERS} m).`,
    );
    err.status = 422;
    err.code = "LOW_ACCURACY";
    throw err;
  }

  const office = await getActiveOffice();
  let distance = null;
  if (office) {
    distance = haversineDistanceMeters(Number(lat), Number(lng), Number(office.latitude), Number(office.longitude));

    // Hanya menolak absen jika geofencing benar-benar diaktifkan.
    // Untuk teknisi lapangan (default), jarak ini hanya disimpan sebagai informasi, tidak memblokir absen.
    if (ENABLE_GEOFENCING && distance > office.radius_meters) {
      const err = new Error(
        `Anda berada di luar radius kantor (jarak ±${Math.round(distance)} m, radius diizinkan ${office.radius_meters} m).`,
      );
      err.status = 403;
      err.code = "OUT_OF_RADIUS";
      err.distance = distance;
      err.office = office;
      throw err;
    }
  }

  return { distance, office };
}

/**
 * GET /api/attendance/today
 * Mengambil status absensi user untuk hari ini.
 */
router.get("/today", async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query("SELECT * FROM attendance_records WHERE user_id = ? AND date = ?", [req.userId, today]);
    res.json({ record: rows[0] ? toRecordDTO(rows[0]) : null });
  } catch (err) {
    console.error("Get today attendance error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil status absensi hari ini." });
  }
});

/**
 * GET /api/attendance/history
 * Mengambil seluruh riwayat absensi user, terbaru lebih dulu.
 */
router.get("/history", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM attendance_records WHERE user_id = ? ORDER BY date DESC", [req.userId]);
    res.json({ records: rows.map(toRecordDTO) });
  } catch (err) {
    console.error("Get attendance history error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil riwayat absensi." });
  }
});

/**
 * POST /api/attendance/checkin
 * Body: { lat, lng, accuracy, photoUrl }
 */
router.post("/checkin", async (req, res) => {
  try {
    const { lat, lng, accuracy, photoUrl } = req.body;
    const { distance } = await validateGeoOrThrow({ lat, lng, accuracy });

    const today = new Date().toISOString().slice(0, 10);
    const [existing] = await pool.query("SELECT id FROM attendance_records WHERE user_id = ? AND date = ?", [req.userId, today]);
    if (existing.length > 0) {
      return res.status(409).json({ message: "Anda sudah melakukan absen masuk hari ini." });
    }

    const now = new Date();
    const lateThreshold = new Date(now);
    lateThreshold.setHours(WORK_START_HOUR, WORK_START_MINUTE + LATE_GRACE_MINUTES, 0, 0);
    const status = now > lateThreshold ? "LATE" : "ON_TIME";

    const id = randomUUID();
    await pool.query(
      `INSERT INTO attendance_records
        (id, user_id, date, check_in_time, status, check_in_lat, check_in_lng, check_in_accuracy_m, check_in_distance_m, check_in_photo_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, req.userId, today, now, status, lat, lng, accuracy, distance, photoUrl || null],
    );

    const [rows] = await pool.query("SELECT * FROM attendance_records WHERE id = ?", [id]);
    res.status(201).json({
      record: toRecordDTO(rows[0]),
      geo: { distanceMeters: distance, accuracyQuality: classifyAccuracy(accuracy) },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message, code: err.code });
    console.error("Checkin error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat absen masuk." });
  }
});

/**
 * POST /api/attendance/checkout
 * Body: { lat, lng, accuracy, photoUrl }
 */
router.post("/checkout", async (req, res) => {
  try {
    const { lat, lng, accuracy, photoUrl } = req.body;
    const { distance } = await validateGeoOrThrow({ lat, lng, accuracy });

    const today = new Date().toISOString().slice(0, 10);
    const [rows] = await pool.query("SELECT * FROM attendance_records WHERE user_id = ? AND date = ?", [req.userId, today]);
    const record = rows[0];

    if (!record) {
      return res.status(400).json({ message: "Anda belum melakukan absen masuk hari ini." });
    }
    if (record.check_out_time) {
      return res.status(409).json({ message: "Anda sudah melakukan absen pulang hari ini." });
    }

    const now = new Date();
    const checkInTime = new Date(record.check_in_time);
    const workingHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);

    await pool.query(
      `UPDATE attendance_records
       SET check_out_time = ?, working_hours = ?, check_out_lat = ?, check_out_lng = ?, check_out_accuracy_m = ?, check_out_distance_m = ?, check_out_photo_url = ?
       WHERE id = ?`,
      [now, workingHours.toFixed(2), lat, lng, accuracy, distance, photoUrl || null, record.id],
    );

    const [updated] = await pool.query("SELECT * FROM attendance_records WHERE id = ?", [record.id]);
    res.json({
      record: toRecordDTO(updated[0]),
      geo: { distanceMeters: distance, accuracyQuality: classifyAccuracy(accuracy) },
    });
  } catch (err) {
    if (err.status) return res.status(err.status).json({ message: err.message, code: err.code });
    console.error("Checkout error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat absen pulang." });
  }
});

export default router;
