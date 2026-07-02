import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User, AttendanceRecord, RequestRecord, Notification } from "./types";
import { format } from "date-fns";
import {
  addToSyncQueue,
  getSyncQueue,
  removeFromSyncQueue,
} from "./lib/offlineQueue";

/**
 * Antarmuka (Interface) yang mendefinisikan status global (global state) untuk keseluruhan aplikasi.
 */
interface AppState {
  user: User | null; // Detail dari pengguna yang saat ini terotentikasi/login
  isAuthenticated: boolean; // Bendera penanda (flag) untuk mengetahui apakah pengguna sudah masuk ke sistem
  attendanceHistory: AttendanceRecord[]; // Daftar catatan absensi/kehadiran pengguna di masa lalu
  requests: RequestRecord[]; // Daftar pengajuan cuti, izin, atau sakit milik pengguna
  notifications: Notification[]; // Daftar notifikasi di dalam aplikasi (in-app notifications) untuk pengguna
  login: (user: User) => Promise<void>; // Fungsi untuk memproses login pengguna
  logout: () => Promise<void>; // Fungsi untuk memproses keluar/logout pengguna dari aplikasi
  checkIn: (record: Partial<AttendanceRecord>) => Promise<void>; // Menangani logika untuk melakukan absen masuk (check-in)
  checkOut: (record: Partial<AttendanceRecord>) => Promise<void>; // Menangani logika untuk melakukan absen keluar (check-out)
  submitRequest: (
    request: Omit<RequestRecord, "id" | "status" | "createdAt">,
  ) => Promise<void>; // Mengirimkan form pengajuan baru (seperti izin/cuti)
  markNotificationRead: (id: string) => Promise<void>; // Menandai suatu notifikasi tertentu bahwa sudah dibaca
  updateProfile: (data: Partial<User>) => Promise<void>; // Memperbarui data detail dari profil pengguna
  addNotification: (notification: Notification) => void; // Menambahkan notifikasi baru ke dalam daftar
}

/**
 * Data tiruan (mock data) untuk pengguna saat ini.
 */
const MOCK_USER: User = {
  id: "1",
  name: "Budi Santoso",
  employeeId: "EMP-0042",
  department: "Engineering",
  position: "Frontend Developer",
  phone: "0812-2712-5050",
  email: "ptcti@gamil.com",
  schedule: "Senin - Jumat, 09:00 - 17:00",
  photoUrl: "https://i.pravatar.cc/150?u=alex",
  emergencyContact: "+1 (555) 987-6543",
};

/**
 * Data tiruan (mock data) untuk riwayat absen/kehadiran pengguna.
 */
const MOCK_HISTORY: AttendanceRecord[] = [];

/**
 * Data tiruan (mock data) untuk daftar notifikasi awal di dalam aplikasi.
 */
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    title: "Cuti Disetujui",
    description: "Permohonan cuti Anda untuk tanggal 4 Juli telah disetujui.",
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    type: "SUCCESS",
  },
  {
    id: "2",
    title: "Pengumuman Perusahaan",
    description: "Rapat umum besok jam 10 pagi di lobi utama.",
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    type: "INFO",
  },
];

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

/**
 * Penyimpanan (store) status global menggunakan Zustand untuk mengelola data dan logika aplikasi.
 * Store ini memanfaatkan middleware 'persist' untuk menyimpan sebagian dari status (state) ke dalam localStorage.
 */
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      attendanceHistory: MOCK_HISTORY,
      requests: [],
      notifications: MOCK_NOTIFICATIONS,

      /**
       * Mensimulasikan proses masuk (login) oleh pengguna.
       */
      login: async (user) => {
        await delay(1000);
        set({ user, isAuthenticated: true });
      },

      /**
       * Mensimulasikan proses keluar (logout) oleh pengguna.
       */
      logout: async () => {
        await delay(500);
        set({ user: null, isAuthenticated: false });
      },

      /**
       * Mencatat data saat pengguna melakukan absen masuk (check-in).
       * Memanfaatkan antrean latar belakang (background queue) jika perangkat tidak terhubung internet (offline).
       */
      checkIn: async (record) => {
        if (!navigator.onLine) {
          await addToSyncQueue("CHECK_IN", record); // Simpan data absen ke antrean sinkronisasi IndexedDB saat offline
        } else {
          await delay(1500); // Simulasikan jeda respons API
        }
        set((state) => {
          const newRecord: AttendanceRecord = {
            id: Math.random().toString(36).substring(7),
            date: format(new Date(), "yyyy-MM-dd"),
            checkInTime: new Date().toISOString(),
            checkOutTime: null,
            status: "ON_TIME",
            workingHours: null,
            location: record.location || null,
            photoUrl: record.photoUrl || null,
            checkInLocation: record.checkInLocation || record.location || null,
            checkInPhotoUrl: record.checkInPhotoUrl || record.photoUrl || null,
          };
          return { attendanceHistory: [newRecord, ...state.attendanceHistory] };
        });
      },

      /**
       * Mencatat data saat pengguna melakukan absen keluar (check-out).
       * Menghitung total jam kerja dan memanfaatkan antrean latar belakang (background queue) saat offline.
       */
      checkOut: async (record) => {
        if (!navigator.onLine) {
          await addToSyncQueue("CHECK_OUT", record); // Simpan data offline ke IndexedDB
        } else {
          await delay(1500); // Simulasikan jeda API
        }
        set((state) => {
          const today = format(new Date(), "yyyy-MM-dd");
          const updatedHistory = state.attendanceHistory.map((item) => {
            if (item.date === today && !item.checkOutTime) {
              const checkOutTime = new Date().toISOString();
              const checkIn = new Date(item.checkInTime!);
              const checkOut = new Date(checkOutTime);
              const workingHours =
                (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

              return {
                ...item,
                checkOutTime,
                workingHours,
                checkOutLocation:
                  record.checkOutLocation || record.location || null,
                checkOutPhotoUrl:
                  record.checkOutPhotoUrl || record.photoUrl || null,
              };
            }
            return item;
          });
          return { attendanceHistory: updatedHistory };
        });
      },

      /**
       * Mengirimkan sebuah form permohonan (seperti Cuti, Sakit, atau Izin) untuk meminta persetujuan atasan.
       */
      submitRequest: async (request) => {
        await delay(1000);
        set((state) => ({
          requests: [
            {
              ...request,
              id: Math.random().toString(36).substring(7),
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
            ...state.requests,
          ],
        }));

        // Mensimulasikan datangnya notifikasi push (Push Notification) persetujuan setelah jeda singkat
        setTimeout(() => {
          import("./lib/fcm").then(({ simulatePushNotification }) => {
            simulatePushNotification(
              "Permohonan Disetujui",
              `Permohonan Anda untuk ${request.type === "LEAVE" ? "Cuti" : request.type === "SICK" ? "Sakit" : request.type === "PERMISSION" ? "Izin" : "Lembur"} telah disetujui.`,
              "SUCCESS",
            );
          });
        }, 5000);
      },

      /**
       * Menandai notifikasi tertentu di dalam store (penyimpanan state) sebagai telah dibaca.
       */
      markNotificationRead: async (id) => {
        await delay(300);
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, isRead: true } : n,
          ),
        }));
      },

      /**
       * Memperbarui informasi detail profil milik pengguna saat ini.
       */
      updateProfile: async (data) => {
        await delay(1000);
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null,
        }));
      },

      /**
       * Fungsi pembantu (helper) untuk menambahkan notifikasi secara cepat ke dalam daftar lokal di store.
       */
      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications],
        }));
      },
    }),
    {
      name: "employee-pwa-storage-v3", // Kunci (key) unik untuk menyimpan data di localStorage
      // Menentukan variabel status (state) apa saja yang harus dipertahankan di localStorage
      partialize: (state) => ({
        attendanceHistory: state.attendanceHistory,
        requests: state.requests,
        notifications: state.notifications,
      }),
    },
  ),
);

export { MOCK_USER };

/**
 * Memproses seluruh isi antrean sinkronisasi latar belakang yang berkaitan dengan absen masuk/keluar
 * yang mungkin dilakukan oleh pengguna pada saat perangkat tidak memiliki koneksi internet.
 */
export const processSyncQueue = async () => {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  // Memproses antrean satu per satu secara berurutan
  for (const item of queue) {
    try {
      // Mensimulasikan pemanggilan API untuk proses sinkronisasi ke server
      await delay(500);
      // Jika sinkronisasi berhasil, hapus item tersebut dari daftar antrean IndexedDB
      await removeFromSyncQueue(item.id);
    } catch (e) {
      console.error("Gagal menyinkronkan item", item, e);
    }
  }
};
