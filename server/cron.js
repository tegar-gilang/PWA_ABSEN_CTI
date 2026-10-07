import { pool } from "./db.js";
import { randomUUID } from "crypto";

// Fungsi untuk mengecek dan mencatat absen (Alfa)
export async function runDailyAbsentCheck() {
  try {
    const today = new Date();
    // Gunakan format YYYY-MM-DD sesuai dengan local date MySQL
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    console.log(`[CRON] Menjalankan pengecekan Alfa untuk tanggal ${dateStr}...`);

    // 1. Ambil semua karyawan aktif
    const [users] = await pool.query("SELECT id FROM users WHERE role = 'EMPLOYEE'");
    if (users.length === 0) return;

    // 2. Ambil semua absen hari ini
    const [attendances] = await pool.query(
      "SELECT user_id FROM attendance_records WHERE date = ?",
      [dateStr]
    );
    const attendedUserIds = new Set(attendances.map(a => a.user_id));

    // 3. Ambil semua request (cuti/izin/sakit) yang disetujui dan mencakup hari ini
    const [requests] = await pool.query(
      "SELECT user_id FROM requests WHERE status = 'APPROVED' AND date <= ? AND (end_date IS NULL OR end_date >= ?)",
      [dateStr, dateStr]
    );
    const requestedUserIds = new Set(requests.map(r => r.user_id));

    // 4. Cari user yang tidak absen dan tidak ada izin
    const absentUserIds = users
      .map(u => u.id)
      .filter(id => !attendedUserIds.has(id) && !requestedUserIds.has(id));

    if (absentUserIds.length === 0) {
      console.log(`[CRON] Tidak ada karyawan Alfa hari ini.`);
      return;
    }

    // 5. Insert status ABSENT untuk karyawan yang alfa
    const insertPromises = absentUserIds.map(userId => {
      const recordId = randomUUID();
      return pool.query(
        `INSERT INTO attendance_records 
          (id, user_id, date, status, check_in_time) 
         VALUES (?, ?, ?, 'ABSENT', NULL)`,
        [recordId, userId, dateStr]
      );
    });

    await Promise.all(insertPromises);
    console.log(`[CRON] Berhasil mencatat ${absentUserIds.length} karyawan sebagai Alfa (ABSENT) hari ini.`);
  } catch (err) {
    console.error("[CRON] Gagal menjalankan pengecekan Alfa:", err);
  }
}

// Inisialisasi interval untuk cek jam 23:50 setiap hari
export function initCron() {
  // Cek setiap 10 menit
  setInterval(() => {
    const now = new Date();
    // Jika jam 23 dan menit >= 50, dan kita belum menjalankan cron untuk hari ini
    if (now.getHours() === 23 && now.getMinutes() >= 50) {
      const todayStr = now.toDateString();
      if (global.lastCronRun !== todayStr) {
        global.lastCronRun = todayStr;
        runDailyAbsentCheck();
      }
    }
  }, 10 * 60 * 1000); // 10 menit

  console.log("⏰ Cron job pengecekan Alfa diinisialisasi (berjalan pukul 23:50).");
}
