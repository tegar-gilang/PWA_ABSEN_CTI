import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testConnection } from "./db.js";

import authRoutes from "./routes/auth.routes.js";
import attendanceRoutes from "./routes/attendance.routes.js";
import requestsRoutes from "./routes/requests.routes.js";
import notificationsRoutes from "./routes/notifications.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import officeRoutes from "./routes/office.routes.js";
import hrdRoutes from "./routes/hrd.routes.js";

dotenv.config();

// Jaring pengaman terakhir: mencatat error async yang tidak tertangkap (unhandled rejection)
// tanpa mematikan seluruh proses server. Idealnya setiap route sudah punya try-catch sendiri,
// tapi ini mencegah satu error tak terduga membuat SELURUH server down untuk semua pengguna.
process.on("unhandledRejection", (reason) => {
  console.error("⚠️  Unhandled Rejection (server tetap berjalan):", reason);
});
process.on("uncaughtException", (err) => {
  console.error("⚠️  Uncaught Exception (server tetap berjalan):", err);
});

const app = express();

app.use(cors());
// Limit dinaikkan ke 20mb karena foto absen/profil dikirim sebagai base64,
// yang ukurannya bisa membengkak ~33% dari ukuran file foto aslinya.
app.use(express.json({ limit: "20mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/requests", requestsRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/office", officeRoutes);
app.use("/api/hrd", hrdRoutes);
// Penanganan error global sebagai jaring pengaman terakhir
app.use((err, req, res, next) => {
  // Pesan khusus jika body request (mis. foto base64) melebihi batas ukuran yang diizinkan
  if (err.type === "entity.too.large" || err.status === 413) {
    return res.status(413).json({
      message: "Ukuran data yang dikirim terlalu besar (mis. foto). Coba gunakan foto dengan resolusi/ukuran lebih kecil.",
    });
  }
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Terjadi kesalahan tak terduga pada server." });
});

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await testConnection();
  } catch (err) {
    console.error("❌ Gagal terhubung ke database MySQL:", err.message);
    console.error("   Pastikan MySQL berjalan dan konfigurasi di file .env sudah benar.");
  }
  app.listen(PORT, () => {
    console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
  });
}

start();
