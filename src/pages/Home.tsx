import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { Bell, ChevronRight, Clock, MapPin, Calendar as CalendarIcon, Briefcase } from 'lucide-react';
import { useInterval } from 'react-use';
import { useState, useEffect } from 'react';
import { Skeleton } from '../components/Skeleton';

export default function Home() {
  const user = useAppStore(state => state.user);
  const unreadCount = useAppStore(state => state.notifications.filter(n => !n.isRead).length);
  const attendanceHistory = useAppStore(state => state.attendanceHistory);
  const navigate = useNavigate();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial data fetch
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useInterval(() => {
    setCurrentTime(new Date());
  }, 1000);

  const today = format(currentTime, 'yyyy-MM-dd');
  const todaysAttendance = attendanceHistory.find(r => r.date === today);
  const isCheckedIn = !!todaysAttendance?.checkInTime && !todaysAttendance?.checkOutTime;
  const isCheckedOut = !!todaysAttendance?.checkOutTime;

  if (isLoading) {
    return (
      <div className="bg-[#F8FAFC] min-h-full text-slate-800 space-y-6 px-6 pt-16">
        <Skeleton className="h-20 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-3xl" />
        <Skeleton className="h-32 w-full rounded-3xl" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8FAFC] min-h-full text-slate-800">
      {/* Header section */}
      <header className="pt-16 pb-4 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Briefcase className="w-6 h-6 text-white" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-none">SmartWork</h1>
            <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider mt-1">Operasi SDM</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/notifications')}
            className="w-10 h-10 rounded-full flex items-center justify-center relative hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-slate-600" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-blue-600 border-2 border-white rounded-full"></span>
            )}
          </button>
          <div className="relative cursor-pointer" onClick={() => navigate('/profile')}>
            <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-white shadow-sm overflow-hidden">
              {user?.photoUrl ? (
                <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-slate-300 flex items-center justify-center text-slate-500 font-bold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="px-6 py-6 space-y-6">
        
        {/* Date and Time Header */}
        <div className="flex justify-between items-end">
          <div>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Selamat {currentTime.getHours() < 12 ? 'Pagi' : currentTime.getHours() < 18 ? 'Sore' : 'Malam'}, {user?.name?.split(' ')[0]}
            </p>
            <h2 className="text-2xl font-bold text-slate-900">{format(currentTime, 'EEEE, dd MMM', { locale: id })}</h2>
          </div>
        </div>

        {/* Core Attendance Card */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Status Saat Ini</p>
              {isCheckedOut ? (
                <span className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-200 uppercase">Selesai</span>
              ) : isCheckedIn ? (
                <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold border border-blue-200 uppercase">Sudah Masuk</span>
              ) : (
                <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-bold border border-amber-200 uppercase">Belum Masuk</span>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{format(currentTime, 'HH:mm')}</p>
              <p className="text-xs text-slate-500 uppercase font-bold tracking-wider">Waktu Server</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Masuk</p>
              <p className="text-lg font-bold text-slate-900">
                {todaysAttendance?.checkInTime ? format(new Date(todaysAttendance.checkInTime), 'HH:mm') : '--:--'}
              </p>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <p className="text-[10px] text-slate-500 uppercase font-bold mb-1 tracking-wider">Pulang</p>
              <p className="text-lg font-bold text-slate-900">
                {todaysAttendance?.checkOutTime ? format(new Date(todaysAttendance.checkOutTime), 'HH:mm') : '--:--'}
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/attendance')}
            disabled={isCheckedOut}
            className={`w-full py-4 rounded-2xl font-bold text-lg shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2
              ${isCheckedOut 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : isCheckedIn 
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 shadow-none'
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100'
              }`}
          >
            <span>{isCheckedOut ? 'Selesai' : isCheckedIn ? 'Pulang Sekarang' : 'Masuk Sekarang'}</span>
            {!isCheckedOut && <ChevronRight className="w-5 h-5" />}
          </button>
          {!isCheckedOut && (
            <p className="text-center text-[10px] text-slate-400 mt-4 uppercase tracking-[0.2em] font-semibold">Memerlukan Verifikasi GPS</p>
          )}
        </section>

        {/* Shift Detail / Holiday */}
        <div className="bg-blue-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-sm">
          <div className="relative z-10">
            <p className="text-blue-300 text-xs font-bold mb-1 uppercase tracking-widest">Shift Hari Ini</p>
            <h3 className="text-xl font-bold mb-1">{user?.schedule}</h3>
            <p className="text-sm text-blue-100 opacity-80 flex items-center gap-1.5 mt-2">
              <MapPin className="w-4 h-4" /> Kantor Pusat
            </p>
          </div>
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-blue-800 rounded-full blur-2xl opacity-50"></div>
        </div>

        {/* Quick Actions / Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:border-blue-200 transition-colors group" onClick={() => navigate('/request')}>
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1 truncate whitespace-nowrap">Cuti / Izin</h4>
            <p className="text-xs text-slate-500 font-medium truncate whitespace-nowrap">Pengajuan Surat</p>
          </div>
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 cursor-pointer hover:border-blue-200 transition-colors group" onClick={() => navigate('/history')}>
            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-slate-100 transition-colors">
              <Briefcase className="w-5 h-5 text-slate-600" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1 truncate whitespace-nowrap">Riwayat</h4>
            <p className="text-xs text-slate-500 font-medium truncate whitespace-nowrap">Lihat kehadiran</p>
          </div>
        </div>

        {/* Announcement */}
        <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-200 flex items-center">
          <div className="bg-blue-50 text-blue-600 px-4 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider flex-shrink-0">
            Info
          </div>
          <p className="text-sm text-slate-600 px-4 truncate flex-1 font-medium">
            Rapat umum besok jam 10 pagi...
          </p>
          <button className="pr-4 text-slate-400 hover:text-slate-600" onClick={() => navigate('/notifications')}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
