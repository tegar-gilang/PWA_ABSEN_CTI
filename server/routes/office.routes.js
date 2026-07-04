import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
router.use(requireAuth);

/**
 * GET /api/office
 * Mengembalikan titik lokasi kantor + radius geofence,
 * dipakai frontend untuk menggambar lingkaran radius di peta.
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM offices ORDER BY id ASC LIMIT 1");
    if (rows.length === 0) return res.json({ office: null });
    const office = rows[0];
    res.json({
      office: {
        id: office.id,
        name: office.name,
        lat: Number(office.latitude),
        lng: Number(office.longitude),
        radiusMeters: office.radius_meters,
      },
    });
  } catch (err) {
    console.error("Get office error:", err);
    res.status(500).json({ message: "Terjadi kesalahan pada server saat mengambil data kantor." });
  }
});

export default router;
