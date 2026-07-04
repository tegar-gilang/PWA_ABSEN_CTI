import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

/**
 * Connection pool ke database MySQL.
 * Menggunakan pool (bukan koneksi tunggal) agar bisa menangani banyak
 * request secara bersamaan tanpa membuat koneksi baru tiap saat.
 */
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "absensi_cti",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true, // agar kolom DECIMAL dikembalikan sebagai number, bukan string
});

/**
 * Fungsi bantu untuk mengecek koneksi database saat server pertama kali start.
 */
export async function testConnection() {
  const conn = await pool.getConnection();
  try {
    await conn.query("SELECT 1");
    console.log("✅ Koneksi database MySQL berhasil");
  } finally {
    conn.release();
  }
}
