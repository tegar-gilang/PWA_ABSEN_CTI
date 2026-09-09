export type User = {
  id: string;
  name: string;
  employeeId: string;
  nik?: string;
  department: string;
  position: string;
  phone: string;
  email: string;
  address?: string;
  schedule: string;
  jamMasuk?: string;
  jamKeluar?: string;
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

export type HospitalLocation = {
  id: string;
  nama_rs: string;
  name?: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
};

export type MasterDepartment = {
  id: string;
  name: string;
};

export type MasterPosition = {
  id: string;
  name: string;
};

export type JobOpening = {
  id: string;
  title: string;
  role: string;
  status: 'OPEN' | 'CLOSED';
  total_candidates?: number;
  interview_count?: number;
  created_at?: string;
  updated_at?: string;
};


export type AttendanceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // ISO string
  checkOutTime: string | null;
  status: AttendanceStatus;
  workingHours: number | null;
  hospitalId?: string | null;
  customLocationName?: string | null;
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
  endDate?: string;
  status: RequestStatus;
  attachmentUrl?: string;
  rejectionReason?: string;
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

export type Candidate = {
  id: string;
  job_opening_id: string;
  job_title?: string;
  job_role?: string;
  name: string;
  stage: 'SCREENING' | 'INTERVIEW' | 'HIRED' | 'REJECTED';
  created_at?: string;
  updated_at?: string;
};

