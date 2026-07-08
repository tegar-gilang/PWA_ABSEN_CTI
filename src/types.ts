export type User = {
  id: string;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  schedule: string;
  photoUrl: string;
  emergencyContact: string;
  role: 'EMPLOYEE' | 'ADMIN';
};

export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'ABSENT';

/**
 * Titik koordinat GPS beserta tingkat akurasinya (dalam meter).
 * `accuracy` berasal dari GeolocationPosition.coords.accuracy pada browser -
 * semakin kecil nilainya, semakin presisi lokasi yang terbaca.
 */
export type GeoPoint = {
  lat: number;
  lng: number;
  accuracy?: number | null;
};

export type AccuracyQuality = 'GOOD' | 'MEDIUM' | 'POOR' | 'UNKNOWN';

/**
 * Titik lokasi kantor beserta radius geofencing (dalam meter) yang diizinkan
 * untuk melakukan absen. Diambil dari backend (tabel `offices`).
 */
export type OfficeLocation = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
};

export type AttendanceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // ISO string
  checkOutTime: string | null;
  status: AttendanceStatus;
  workingHours: number | null;
  location?: GeoPoint | null;
  photoUrl?: string | null;
  checkInLocation?: GeoPoint | null;
  checkOutLocation?: GeoPoint | null;
  checkInPhotoUrl?: string | null;
  checkOutPhotoUrl?: string | null;
  checkInDistanceMeters?: number | null;
  checkOutDistanceMeters?: number | null;
};

export type RequestType = 'LEAVE' | 'PERMISSION' | 'SICK' | 'OVERTIME';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type RequestRecord = {
  id: string;
  type: RequestType;
  reason: string;
  date: string;
  status: RequestStatus;
  attachmentUrl?: string;
  createdAt: string;
};

export type Notification = {
  id: string;
  title: string;
  description: string;
  isRead: boolean;
  createdAt: string;
  type: 'SUCCESS' | 'WARNING' | 'INFO';
};
