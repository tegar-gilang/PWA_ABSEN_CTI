import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AttendanceRecord, RequestRecord, Notification, OfficeLocation } from "./types";
import {
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
} from "./lib/offlineQueue";
import {
  apiLogin,
  apiRegister,
  apiCheckIn,
  apiCheckOut,
  apiGetAttendanceHistory,
  apiGetNotifications,
  apiGetOffice,
  apiGetRequests,
  apiMarkNotificationRead,
  apiSubmitRequest,
  apiUpdateProfile,
  apiGetMe,
  setToken,
  clearToken,
  getToken,
  GeoPayload,
} from "./lib/api";

/**
 * Antarmuka (Interface) yang mendefinisikan status global (global state) untuk keseluruhan aplikasi.
 * Semua data kini bersumber dari backend Express + MySQL, bukan lagi data tiruan (mock).
 */
interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  attendanceHistory: AttendanceRecord[];
  requests: RequestRecord[];
  notifications: Notification[];
  office: OfficeLocation | null; // titik & radius geofencing kantor, untuk validasi & tampilan peta
  isHydrating: boolean; // true saat sedang memuat ulang sesi & data awal

  login: (employeeId: string, password: string) => Promise<void>;
  signup: (payload: { name: string; employeeId: string; password: string; department: string }) => Promise<void>;
  logout: () => Promise<void>;
  hydrateSession: () => Promise<void>; // memuat ulang sesi & data awal saat aplikasi dibuka
  checkIn: (payload: GeoPayload) => Promise<void>;
  checkOut: (payload: GeoPayload) => Promise<void>;
  submitRequest: (request: { type: string; reason: string; date: string }) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

/**
 * Memuat data riwayat absensi, pengajuan, notifikasi, dan lokasi kantor
 * dari backend sekaligus - dipanggil setelah login berhasil atau saat sesi dipulihkan.
 */
async function fetchAllUserData() {
  const [historyRes, requestsRes, notifRes, officeRes] = await Promise.all([
    apiGetAttendanceHistory(),
    apiGetRequests(),
    apiGetNotifications(),
    apiGetOffice(),
  ]);
  return {
    attendanceHistory: historyRes.records,
    requests: requestsRes.requests,
    notifications: notifRes.notifications,
    office: officeRes.office,
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      attendanceHistory: [],
      requests: [],
      notifications: [],
      office: null,
      isHydrating: false,

      /**
       * Login ke backend menggunakan ID Karyawan & kata sandi, lalu memuat data awal pengguna.
       */
      login: async (employeeId, password) => {
        const { token, user } = await apiLogin({ employeeId, password });
        setToken(token);
        const data = await fetchAllUserData();
        set({ user, isAuthenticated: true, ...data });
      },

      /**
       * Mendaftarkan akun baru ke backend lalu otomatis login.
       */
      signup: async (payload) => {
        const { token, user } = await apiRegister(payload);
        setToken(token);
        const data = await fetchAllUserData();
        set({ user, isAuthenticated: true, ...data });
      },

      /**
       * Logout: menghapus token JWT dan mengosongkan state lokal.
       */
      logout: async () => {
        clearToken();
        set({
          user: null,
          isAuthenticated: false,
          attendanceHistory: [],
          requests: [],
          notifications: [],
          office: null,
        });
      },

      /**
       * Dipanggil saat aplikasi pertama kali dibuka untuk memulihkan sesi
       * dari token JWT yang tersimpan (jika ada & masih valid).
       */
      hydrateSession: async () => {
        const token = getToken();
        if (!token) return;
        set({ isHydrating: true });
        try {
          const { user } = await apiGetMe();
          const data = await fetchAllUserData();
          set({ user, isAuthenticated: true, ...data });
        } catch (err) {
          // Token tidak valid/kedaluwarsa - bersihkan sesi
          clearToken();
          set({ user: null, isAuthenticated: false });
        } finally {
          set({ isHydrating: false });
        }
      },

      /**
       * Mencatat absen masuk (check-in) ke backend, termasuk koordinat GPS,
       * akurasi (meter), dan foto verifikasi. Jika perangkat offline, data
       * dimasukkan ke antrean sinkronisasi (IndexedDB) untuk dikirim nanti.
       */
      checkIn: async (payload) => {
        if (!navigator.onLine) {
          await addToSyncQueue("CHECK_IN", payload);
          throw new Error(
            "Anda sedang offline. Absen masuk disimpan dan akan dikirim otomatis saat koneksi tersedia.",
          );
        }
        const { record } = await apiCheckIn(payload);
        set((state) => ({ attendanceHistory: [record, ...state.attendanceHistory] }));
      },

      /**
       * Mencatat absen keluar (check-out) ke backend, menghitung jam kerja otomatis di server.
       */
      checkOut: async (payload) => {
        if (!navigator.onLine) {
          await addToSyncQueue("CHECK_OUT", payload);
          throw new Error(
            "Anda sedang offline. Absen pulang disimpan dan akan dikirim otomatis saat koneksi tersedia.",
          );
        }
        const { record } = await apiCheckOut(payload);
        set((state) => ({
          attendanceHistory: state.attendanceHistory.map((item) => (item.id === record.id ? record : item)),
        }));
      },

      /**
       * Mengirimkan pengajuan (Cuti/Izin/Sakit/Lembur) ke backend.
       */
      submitRequest: async (request) => {
        const { request: created } = await apiSubmitRequest(request);
        set((state) => ({ requests: [created, ...state.requests] }));
      },

      /**
       * Menandai notifikasi sebagai telah dibaca, baik di backend maupun state lokal.
       */
      markNotificationRead: async (id) => {
        await apiMarkNotificationRead(id);
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        }));
      },

      /**
       * Memperbarui profil pengguna di backend.
       */
      updateProfile: async (data) => {
        const { user } = await apiUpdateProfile(data);
        set({ user });
      },

      /**
       * Menambahkan notifikasi secara lokal (mis. dari simulasi push notification).
       */
      addNotification: (notification) => {
        set((state) => ({ notifications: [notification, ...state.notifications] }));
      },
    }),
    {
      name: "employee-pwa-storage-v4",
      // Hanya menyimpan sedikit state di localStorage sebagai cache tampilan awal;
      // sumber data utama tetap backend (dipulihkan lewat hydrateSession).
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

/**
 * Memproses seluruh isi antrean sinkronisasi latar belakang (absen masuk/keluar)
 * yang tertunda karena perangkat sempat tidak memiliki koneksi internet.
 */
export const processSyncQueue = async () => {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  for (const item of queue) {
    try {
      if (item.type === "CHECK_IN") {
        await apiCheckIn(item.payload as GeoPayload);
      } else if (item.type === "CHECK_OUT") {
        await apiCheckOut(item.payload as GeoPayload);
      }
      await removeFromSyncQueue(item.id);
    } catch (e) {
      console.error("Gagal menyinkronkan item", item, e);
    }
  }
};
