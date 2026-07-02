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
};

export type AttendanceStatus = 'ON_TIME' | 'LATE' | 'ABSENT';

export type AttendanceRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  checkInTime: string | null; // ISO string
  checkOutTime: string | null;
  status: AttendanceStatus;
  workingHours: number | null;
  location?: { lat: number; lng: number } | null;
  photoUrl?: string | null;
  checkInLocation?: { lat: number; lng: number } | null;
  checkOutLocation?: { lat: number; lng: number } | null;
  checkInPhotoUrl?: string | null;
  checkOutPhotoUrl?: string | null;
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
