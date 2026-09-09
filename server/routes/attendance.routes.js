import { Router } from "express";
import { randomUUID } from "crypto";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";
import { haversineDistanceMeters, classifyAccuracy, calculateDistance } from "../utils/geo.js";

import { getLocalDateString, getMinutesSinceMidnight } from "../utils/date.js";

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
    hospitalId: row.hospital_id || null,
    customLocationName: row.custom_location_name || null,
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

async function getUserOffice(userId) {
  const [users] = await pool.query("SELECT assigned_office_id FROM users WHERE id = ?", [userId]);
  if (!users[0] || !users[0].assigned_office_id) return null; // Teknisi lapangan atau admin tanpa lokasi
  
  const [offices] = await pool.query("SELECT * FROM offices WHERE id = ?", [users[0].assigned_office_id]);
  return offices[0] || null;
}

/**
 * Validasi bersama untuk check-in maupun check-out:
 * - Memastikan lat/lng/accuracy dikirim
 * - Menolak jika akurasi GPS terlalu buruk (di atas ambang batas)
 * - Menghitung jarak ke kantor & menolak jika di luar radius geofence
 */
async function validateGeoOrThrow({ lat, lng, accuracy, history }, userId) {
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

  // ---- JITTER ANALYSIS (ANTI FAKE GPS) ----
  if (history && Array.isArray(history) && history.length >= 2) {
    let isStiff = true;
    const first = history[0];
    for (let i = 1; i < history.length; i++) {
      if (history[i].lat !== first.lat || history[i].lng !== first.lng) {
        isStiff = false;
        break;
      }
    }
    
    // Jika semua titik (lat & lng) 100% identik (tidak ada pergeseran milimeter pun), 
    // ini 99% buatan aplikasi Mock Location (Fake GPS)
    if (isStiff) {
      const err = new Error("Terdeteksi penggunaan Lokasi Palsu (Fake GPS). Titik koordinat tidak wajar.");
      err.status = 403;
      err.code = "FAKE_GPS_DETECTED";
      throw err;
    }
  }

  if (Number(accuracy) > MAX_ACCURACY_METERS) {
    const err = new Error(
      `Akurasi GPS terlalu rendah (±${Math.round(accuracy)} m). Mohon pindah ke area terbuka dan coba lagi (maksimal ±${MAX_ACCURACY_METERS} m).`,
    );
    err.status = 422;
    err.code = "LOW_ACCURACY";
    throw err;
  }

  const office = await getUserOffice(userId);
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
    const today = getLocalDateString();
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
// OLD CODE
// router.post("/checkin", async (req, res) => {
//   try {
//     const { lat, lng, accuracy, photoUrl } = req.body;
//     const { distance } = await validateGeoOrThrow({ lat, lng, accuracy });

//     const today = getLocalDateString();
//     const [existing] = await pool.query("SELECT id FROM attendance_records WHERE user_id = ? AND date = ?", [req.userId, today]);
//     if (existing.length > 0) {
//       return res.status(409).json({ message: "Anda sudah melakukan absen masuk hari ini." });
//     }

//     const now = new Date();
//     // Bandingkan jam:menit di timezone aplikasi (bukan timezone OS server) agar status
//     // ON_TIME/LATE selalu konsisten di mana pun server dijalankan.
//     const nowMinutes = getMinutesSinceMidnight(now);
//     const thresholdMinutes = WORK_START_HOUR * 60 + WORK_START_MINUTE + LATE_GRACE_MINUTES;
//     const status = nowMinutes > thresholdMinutes ? "LATE" : "ON_TIME";

//     const id = randomUUID();
//     await pool.query(
//       `INSERT INTO attendance_records
//         (id, user_id, date, check_in_time, status, check_in_lat, check_in_lng, check_in_accuracy_m, check_in_distance_m, check_in_photo_url)
//        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//       [id, req.userId, today, now, status, lat, lng, accuracy, distance, photoUrl || null],
//     );

//     const [rows] = await pool.query("SELECT * FROM attendance_records WHERE id = ?", [id]);
//     res.status(201).json({
//       record: toRecordDTO(rows[0]),
//       geo: { distanceMeters: distance, accuracyQuality: classifyAccuracy(accuracy) },
//     });
//   } catch (err) {
//     if (err.status) return res.status(err.status).json({ message: err.message, code: err.code });
//     console.error("Checkin error:", err);
//     res.status(500).json({ message: "Terjadi kesalahan pada server saat absen masuk." });
//   }
// });
// NEW CODE 
router.post("/checkin", async (req, res)=> {
  try {
    const latitude = req.body.latitude !== undefined ? Number(req.body.latitude) : (req.body.lat !== undefined ? Number(req.body.lat) : null);
    const longitude = req.body.longitude !== undefined ? Number(req.body.longitude) : (req.body.lng !== undefined ? Number(req.body.lng) : null);
    const accuracy = req.body.accuracy !== undefined ? Number(req.body.accuracy) : (req.body.accuracy_m !== undefined ? Number(req.body.accuracy_m) : null);
    const photo_url = req.body.photo_url || req.body.photoUrl || null;
    const hospital_id = req.body.hospital_id || req.body.hospitalId || null;
    const custom_location_name = req.body.custom_location_name || req.body.customLocationName || null;
    const userId = req.userId;
    const today = getLocalDateString();

    const [users] = await pool.query("SELECT jam_masuk FROM users WHERE id = ?", [userId]);
    if (users.length === 0) {
      return res.status(404).json({ message: "User tidak ditemukan." });
    }
    const user = users[0];

    let finalHospitalId = null;
    let finalCustomLocation = null;
    let distanceMeters = null;

    if (custom_location_name) {
      finalCustomLocation = custom_location_name;
    } else if (hospital_id) {
      const [hospitals] = await pool.query("SELECT latitude, longitude, radius_meters FROM hospitals WHERE id = ?", [hospital_id]);

      if (hospitals.length === 0) {
        return res.status(404).json({ message: "Rumah sakit tidak ditemukan." });
      }

      const rs = hospitals[0];
      if (latitude != null && longitude != null) {
        distanceMeters = calculateDistance(latitude, longitude, rs.latitude, rs.longitude);

        if (distanceMeters > rs.radius_meters) {
          return res.status(403).json({ message: `Jarak Anda terlalu jauh dari lokasi penugasan. Jarak saat ini: ${Math.round(distanceMeters)} meter. (Maksimal: ${rs.radius_meters} meter).` });
        }
      }

      finalHospitalId = hospital_id;
    } else {
      finalCustomLocation = "Kantor / Lapangan";
    }

    const checkInTime = new Date();
    const [hours, minutes, seconds] = (user.jam_masuk || '08:00:00').split(':');

    const limitWaktu = new Date();
    limitWaktu.setHours(parseInt(hours, 10), parseInt(minutes, 10) + 5, parseInt(seconds || 0, 10), 0);

    const attendanceStatus = checkInTime > limitWaktu ? 'LATE' : 'ON_TIME';

    const recordId = randomUUID();
    await pool.query(
      `INSERT INTO attendance_records 
        (id, user_id, date, check_in_time, status, hospital_id, custom_location_name, check_in_lat, check_in_lng, check_in_accuracy_m, check_in_distance_m, check_in_photo_url) 
       VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
      [recordId, userId, today, attendanceStatus, finalHospitalId, finalCustomLocation, latitude, longitude, accuracy, distanceMeters, photo_url]
    );

    const [rows] = await pool.query("SELECT * FROM attendance_records WHERE id = ?", [recordId]);
    res.status(201).json({ 
      message: `Check-in berhasil. Status: ${attendanceStatus === 'LATE' ? 'Terlambat' : 'Tepat Waktu'}`,
      status: attendanceStatus,
      record: toRecordDTO(rows[0]),
      geo: { distanceMeters, accuracyQuality: classifyAccuracy(accuracy || 15) }
    });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: "Anda sudah melakukan check-in hari ini." });
    }
    console.error("Error Check-in:", err);
    res.status(500).json({ message: "Terjadi kesalahan sistem saat check-in." });
  }
});

/**
 * POST /api/attendance/checkout
 * Body: { lat, lng, accuracy, photoUrl } atau { latitude, longitude, photo_url }
 */
router.post("/checkout", async (req, res)=> {
  try {
    const latitude = req.body.latitude !== undefined ? Number(req.body.latitude) : (req.body.lat !== undefined ? Number(req.body.lat) : null);
    const longitude = req.body.longitude !== undefined ? Number(req.body.longitude) : (req.body.lng !== undefined ? Number(req.body.lng) : null);
    const accuracy = req.body.accuracy !== undefined ? Number(req.body.accuracy) : (req.body.accuracy_m !== undefined ? Number(req.body.accuracy_m) : null);
    const photo_url = req.body.photo_url || req.body.photoUrl || null;
    const userId = req.userId;
    const today = getLocalDateString();

    const [records] = await pool.query("SELECT id, check_in_time, check_out_time, hospital_id FROM attendance_records WHERE user_id = ? AND date = ?", [userId, today]);

    if (records.length === 0) {
      return res.status(400).json({ message: "Anda belum melakukan Absen masuk hari ini." });
    }

    const record = records[0];

    if (record.check_out_time !== null) {
      return res.status(400).json({ message: "Anda sudah melakukan absen pulang (Check-Out) hari ini." });
    }

    let distanceMeters = null;
    if (record.hospital_id) {
      const [hospitals] = await pool.query("SELECT latitude, longitude FROM hospitals WHERE id = ?", [record.hospital_id]);

      if (hospitals.length > 0 && latitude != null && longitude != null) {
        const rs = hospitals[0];
        distanceMeters = calculateDistance(latitude, longitude, rs.latitude, rs.longitude);
      }
    }

    const checkInTime = new Date(record.check_in_time);
    const checkOutTime = new Date();

    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    const workingHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    await pool.query(
      `UPDATE attendance_records 
       SET check_out_time = NOW(), working_hours = ?, check_out_lat = ?, check_out_lng = ?, check_out_accuracy_m = ?, check_out_distance_m = ?, check_out_photo_url = ? 
       WHERE id = ?`,
      [workingHours, latitude, longitude, accuracy, distanceMeters, photo_url, record.id]
    );

    const [updated] = await pool.query("SELECT * FROM attendance_records WHERE id = ?", [record.id]);
    res.status(200).json({ 
      message: "Check-out berhasil.", 
      working_hours: workingHours,
      record: toRecordDTO(updated[0]),
      geo: { distanceMeters, accuracyQuality: classifyAccuracy(accuracy || 15) }
    });

  } catch (err) {
    console.error("Error Check-out:", err);
    res.status(500).json({ message: "Terjadi kesalahan sistem saat check-out." });
  }
});

// Route Lokasi(Rumah Sakit) Penugasan
// GET
router.get("/locations",requireAuth, async (req, res)=> {
  try {
    const [rows] = await pool.query("SELECT id, nama_rs, latitude, longitude, radius_meters FROM hospitals ORDER BY nama_rs ASC");
    res.json({ locations: rows });
  } catch (err) {
    console.error("Error saat mengambil daftar lokasi rumah sakit:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil daftar lokasi pengugasan." });
  }
})

export default router;
