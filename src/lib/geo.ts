import { AccuracyQuality } from "../types";

/**
 * Menghitung jarak antara dua titik koordinat GPS (formula Haversine), dalam meter.
 * Dipakai di sisi frontend hanya untuk keperluan tampilan (mis. "jarak Anda ke kantor").
 * Validasi geofencing yang sebenarnya tetap dilakukan di backend agar tidak bisa dimanipulasi.
 */
export function haversineDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Mengklasifikasikan akurasi GPS (meter) menjadi label kualitas yang mudah dipahami pengguna.
 */
export function classifyAccuracy(accuracyMeters: number | null | undefined): AccuracyQuality {
  if (accuracyMeters == null || Number.isNaN(accuracyMeters)) return "UNKNOWN";
  if (accuracyMeters <= 20) return "GOOD";
  if (accuracyMeters <= 50) return "MEDIUM";
  return "POOR";
}

export function accuracyQualityLabel(quality: AccuracyQuality): string {
  switch (quality) {
    case "GOOD":
      return "Akurat";
    case "MEDIUM":
      return "Cukup Akurat";
    case "POOR":
      return "Kurang Akurat";
    default:
      return "Tidak Diketahui";
  }
}

export function accuracyQualityColorClasses(quality: AccuracyQuality): string {
  switch (quality) {
    case "GOOD":
      return "bg-green-50 text-green-700 border-green-200";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "POOR":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-50 text-slate-500 border-slate-200";
  }
}
