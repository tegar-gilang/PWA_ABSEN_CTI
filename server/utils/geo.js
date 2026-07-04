/**
 * Menghitung jarak antara dua titik koordinat GPS menggunakan formula Haversine.
 * Hasil dikembalikan dalam satuan meter.
 *
 * @param {number} lat1 Latitude titik pertama
 * @param {number} lng1 Longitude titik pertama
 * @param {number} lat2 Latitude titik kedua
 * @param {number} lng2 Longitude titik kedua
 * @returns {number} jarak dalam meter
 */
export function haversineDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000; // radius bumi dalam meter
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Menilai kualitas akurasi GPS (dalam meter) menjadi label yang mudah dibaca.
 * Dipakai baik oleh backend (validasi) maupun bisa dicerminkan di frontend.
 */
export function classifyAccuracy(accuracyMeters) {
  if (accuracyMeters == null || Number.isNaN(accuracyMeters)) return "UNKNOWN";
  if (accuracyMeters <= 20) return "GOOD";
  if (accuracyMeters <= 50) return "MEDIUM";
  return "POOR";
}
