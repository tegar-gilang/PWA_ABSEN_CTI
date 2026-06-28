import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, AttendanceRecord, RequestRecord, Notification } from './types';
import { format } from 'date-fns';
import { addToSyncQueue, getSyncQueue, removeFromSyncQueue } from './lib/offlineQueue';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  attendanceHistory: AttendanceRecord[];
  requests: RequestRecord[];
  notifications: Notification[];
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  checkIn: (record: Partial<AttendanceRecord>) => Promise<void>;
  checkOut: (record: Partial<AttendanceRecord>) => Promise<void>;
  submitRequest: (request: Omit<RequestRecord, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  addNotification: (notification: Notification) => void;
}

const MOCK_USER: User = {
  id: '1',
  name: 'Alex Johnson',
  employeeId: 'EMP-0042',
  department: 'Engineering',
  position: 'Frontend Developer',
  phone: '+1 (555) 123-4567',
  email: 'alex.j@company.com',
  schedule: 'Senin - Jumat, 09:00 - 17:00',
  photoUrl: 'https://i.pravatar.cc/150?u=alex',
  emergencyContact: '+1 (555) 987-6543',
};

const MOCK_HISTORY: AttendanceRecord[] = [
  {
    id: '1',
    date: '2026-06-26',
    checkInTime: '2026-06-26T08:55:00Z',
    checkOutTime: '2026-06-26T17:05:00Z',
    status: 'ON_TIME',
    workingHours: 8.16,
    location: { lat: 37.7749, lng: -122.4194 },
    photoUrl: null,
  },
  {
    id: '2',
    date: '2026-06-25',
    checkInTime: '2026-06-25T09:15:00Z',
    checkOutTime: '2026-06-25T17:30:00Z',
    status: 'LATE',
    workingHours: 8.25,
    location: { lat: 37.7749, lng: -122.4194 },
    photoUrl: null,
  }
];

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Cuti Disetujui',
    description: 'Permohonan cuti Anda untuk tanggal 4 Juli telah disetujui.',
    isRead: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    type: 'SUCCESS',
  },
  {
    id: '2',
    title: 'Pengumuman Perusahaan',
    description: 'Rapat umum besok jam 10 pagi di lobi utama.',
    isRead: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    type: 'INFO',
  }
];

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      attendanceHistory: MOCK_HISTORY,
      requests: [],
      notifications: MOCK_NOTIFICATIONS,

      login: async (user) => {
        await delay(1000);
        set({ user, isAuthenticated: true });
      },
      logout: async () => {
        await delay(500);
        set({ user: null, isAuthenticated: false });
      },
      
      checkIn: async (record) => {
        if (!navigator.onLine) {
          await addToSyncQueue('CHECK_IN', record);
        } else {
          await delay(1500);
        }
        set((state) => {
          const newRecord: AttendanceRecord = {
            id: Math.random().toString(36).substring(7),
            date: format(new Date(), 'yyyy-MM-dd'),
            checkInTime: new Date().toISOString(),
            checkOutTime: null,
            status: 'ON_TIME',
            workingHours: null,
            location: record.location || null,
            photoUrl: record.photoUrl || null,
          };
          return { attendanceHistory: [newRecord, ...state.attendanceHistory] };
        });
      },
      
      checkOut: async (record) => {
        if (!navigator.onLine) {
          await addToSyncQueue('CHECK_OUT', record);
        } else {
          await delay(1500);
        }
        set((state) => {
          const today = format(new Date(), 'yyyy-MM-dd');
          const updatedHistory = state.attendanceHistory.map(item => {
            if (item.date === today && !item.checkOutTime) {
              const checkOutTime = new Date().toISOString();
              const checkIn = new Date(item.checkInTime!);
              const checkOut = new Date(checkOutTime);
              const workingHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
              
              return {
                ...item,
                checkOutTime,
                workingHours,
              };
            }
            return item;
          });
          return { attendanceHistory: updatedHistory };
        });
      },

      submitRequest: async (request) => {
        await delay(1000);
        set((state) => ({
          requests: [
            {
              ...request,
              id: Math.random().toString(36).substring(7),
              status: 'PENDING',
              createdAt: new Date().toISOString(),
            },
            ...state.requests
          ]
        }));
        
        // Simulate an approval push notification after a short delay
        setTimeout(() => {
          import('./lib/fcm').then(({ simulatePushNotification }) => {
            simulatePushNotification(
              'Permohonan Disetujui', 
              `Permohonan Anda untuk ${request.type === 'LEAVE' ? 'Cuti' : request.type === 'SICK' ? 'Sakit' : request.type === 'PERMISSION' ? 'Izin' : 'Lembur'} telah disetujui.`, 
              'SUCCESS'
            );
          });
        }, 5000);
      },

      markNotificationRead: async (id) => {
        await delay(300);
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, isRead: true } : n
          )
        }));
      },

      updateProfile: async (data) => {
        await delay(1000);
        set((state) => ({
          user: state.user ? { ...state.user, ...data } : null
        }));
      },

      addNotification: (notification) => {
        set((state) => ({
          notifications: [notification, ...state.notifications]
        }));
      },
    }),
    {
      name: 'employee-pwa-storage-v2',
    }
  )
);

export { MOCK_USER };

export const processSyncQueue = async () => {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;
  
  // Process queue sequentially
  for (const item of queue) {
    try {
      // Simulate API call for sync
      await delay(500); 
      // If successful, remove from queue
      await removeFromSyncQueue(item.id);
    } catch (e) {
      console.error('Failed to sync item', item, e);
    }
  }
};
