/**
 * Utilitas tanggal & waktu yang TIDAK bergantung pada timezone sistem operasi server.
 *
 * Kenapa ini penting: jika hanya mengandalkan `new Date().toISOString()`, hasilnya selalu
 * dalam UTC. Kalau di-`slice(0, 10)` untuk mengambil tanggal, tanggal bisa "mundur satu hari"
 * dibanding tanggal kalender lokal teknisi (mis. WIB/UTC+7), terutama untuk absen dini hari,
 * ATAU jika server di-deploy di mesin dengan timezone OS berbeda (banyak VPS/cloud default-nya UTC).
 *
 * Dengan Intl.DateTimeFormat + opsi timeZone, kita selalu menghitung tanggal & jam berdasarkan
 * zona waktu APLIKASI (APP_TIMEZONE), bukan zona waktu mesin server - hasilnya konsisten
 * di mana pun server dijalankan.
 */

const DEFAULT_TIMEZONE = process.env.APP_TIMEZONE || "Asia/Jakarta";

/**
 * Mengembalikan tanggal kalender (YYYY-MM-DD) sesuai timezone aplikasi, terlepas dari
 * timezone sistem operasi tempat server berjalan.
 */
export function getLocalDateString(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  // Locale 'en-CA' menghasilkan format YYYY-MM-DD secara langsung
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Mengembalikan jumlah menit sejak tengah malam (00:00) sesuai timezone aplikasi.
 * Dipakai untuk menentukan status ON_TIME/LATE secara konsisten, tanpa terpengaruh
 * timezone OS server.
 */
export function getMinutesSinceMidnight(date = new Date(), timeZone = DEFAULT_TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0) % 24; // "24" jam tengah malam dinormalisasi jadi 0
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return hour * 60 + minute;
}
