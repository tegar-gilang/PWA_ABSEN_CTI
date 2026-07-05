import { AttendanceRecord, Notification, OfficeLocation, RequestRecord, User } from "../types";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

const TOKEN_KEY = "employee-pwa-token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Error kustom agar UI bisa membedakan pesan dari server (mis. akurasi GPS
 * rendah, di luar radius kantor) dari error jaringan biasa.
 */
export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(data.message || "Terjadi kesalahan pada server.", res.status, data.code);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function apiRegister(payload: {
  name: string;
  employeeId: string;
  password: string;
  department: string;
}): Promise<{ token: string; user: User }> {
  return request("/auth/register", { method: "POST", body: JSON.stringify(payload) });
}

export async function apiLogin(payload: {
  employeeId: string;
  password: string;
}): Promise<{ token: string; user: User }> {
  return request("/auth/login", { method: "POST", body: JSON.stringify(payload) });
}

export async function apiGetMe(): Promise<{ user: User }> {
  return request("/auth/me");
}

// ---------------------------------------------------------------------------
// Attendance
// ---------------------------------------------------------------------------
export async function apiGetTodayAttendance(): Promise<{ record: AttendanceRecord | null }> {
  return request("/attendance/today");
}

export async function apiGetAttendanceHistory(): Promise<{ records: AttendanceRecord[] }> {
  return request("/attendance/history");
}

export type GeoPayload = { lat: number; lng: number; accuracy: number; photoUrl?: string | null };

export async function apiCheckIn(payload: GeoPayload): Promise<{ record: AttendanceRecord }> {
  return request("/attendance/checkin", { method: "POST", body: JSON.stringify(payload) });
}

export async function apiCheckOut(payload: GeoPayload): Promise<{ record: AttendanceRecord }> {
  return request("/attendance/checkout", { method: "POST", body: JSON.stringify(payload) });
}

// ---------------------------------------------------------------------------
// Requests (Cuti/Izin/Sakit/Lembur)
// ---------------------------------------------------------------------------
export async function apiGetRequests(): Promise<{ requests: RequestRecord[] }> {
  return request("/requests");
}

export async function apiSubmitRequest(payload: {
  type: string;
  reason: string;
  date: string;
}): Promise<{ request: RequestRecord }> {
  return request("/requests", { method: "POST", body: JSON.stringify(payload) });
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------
export async function apiGetNotifications(): Promise<{ notifications: Notification[] }> {
  return request("/notifications");
}

export async function apiMarkNotificationRead(id: string): Promise<{ success: boolean }> {
  return request(`/notifications/${id}/read`, { method: "PATCH" });
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------
export async function apiUpdateProfile(payload: Partial<User>): Promise<{ user: User }> {
  return request("/profile", { method: "PATCH", body: JSON.stringify(payload) });
}

// ---------------------------------------------------------------------------
// Office (untuk geofencing & tampilan radius di peta)
// ---------------------------------------------------------------------------
export async function apiGetOffice(): Promise<{ office: OfficeLocation | null }> {
  return request("/office");
}
