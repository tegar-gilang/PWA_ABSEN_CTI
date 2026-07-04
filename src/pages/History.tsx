import { useState, useMemo } from 'react';
import { useAppStore } from '../store';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, ChevronRight, MapPin, Clock, X, Search, Filter } from 'lucide-react';
import { AttendanceRecord } from '../types';
import { AnimatePresence, motion } from 'motion/react';
import MiniMap from '../components/MiniMap';

export default function History() {
  const history = useAppStore(state => state.attendanceHistory);
  const office = useAppStore(state => state.office);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredHistory = useMemo(() => {
    return history.filter(record => {
      const formattedDate = format(parseISO(record.date), 'MMM dd, yyyy', { locale: id }).toLowerCase();
      const matchesSearch = formattedDate.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || record.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [history, searchQuery, statusFilter]);

  const summary = useMemo(() => {
    return {
      total: filteredHistory.length,
      onTime: filteredHistory.filter(r => r.status === 'ON_TIME').length,
      late: filteredHistory.filter(r => r.status === 'LATE').length,
      absent: filteredHistory.filter(r => r.status === 'ABSENT').length,
      avgHours: filteredHistory.reduce((acc, curr) => acc + (curr.workingHours || 0), 0) / (filteredHistory.filter(r => r.workingHours).length || 1)
    };
  }, [filteredHistory]);

  return (
    <div className="min-h-full bg-[#F8FAFC] text-slate-800">
      <div className="bg-white px-6 pt-6 pb-6 border-b border-slate-200 shadow-sm space-y-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Riwayat Kehadiran</h1>
          <p className="text-slate-500 mt-1 text-sm font-medium">Tinjau catatan harian Anda</p>
        </div>

        {/* Summary Recap */}
        <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center justify-between">
            Ringkasan
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">
              {searchQuery ? 'Disaring' : format(new Date(), 'MMMM', { locale: id })}
            </span>
          </h3>
          <div className="flex justify-between items-center gap-1">
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-slate-900">{summary.total}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 whitespace-nowrap">Total</p>
            </div>
            <div className="w-[1px] h-12 bg-slate-300 shrink-0"></div>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-slate-900">{summary.onTime}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 whitespace-nowrap">Tepat Waktu</p>
            </div>
            <div className="w-[1px] h-12 bg-slate-300 shrink-0"></div>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-slate-900">{summary.late}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 whitespace-nowrap">Terlambat</p>
            </div>
            <div className="w-[1px] h-12 bg-slate-300 shrink-0"></div>
            <div className="flex-1 text-center">
              <p className="text-xl font-bold text-slate-900">{summary.absent}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-1 whitespace-nowrap">Absen</p>
            </div>
          </div>
        </section>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari tanggal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium appearance-none"
          >
            <option value="ALL">Semua Status</option>
            <option value="ON_TIME">Tepat Waktu</option>
            <option value="LATE">Terlambat</option>
            <option value="ABSENT">Absen</option>
          </select>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tidak ada data</h3>
            <p className="text-slate-500 mt-1">Coba sesuaikan pencarian Anda</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((record) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={record.id} 
                onClick={() => setSelectedRecord(record)}
                className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm cursor-pointer hover:shadow-md hover:border-blue-200 transition-all active:scale-[0.98] group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border relative overflow-hidden
                      ${record.status === 'ON_TIME' ? 'bg-green-50 text-green-600 border-green-100' : 
                        record.status === 'LATE' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'}`}
                    >
                      <div className={`absolute top-0 w-full h-1 ${record.status === 'ON_TIME' ? 'bg-green-400' : record.status === 'LATE' ? 'bg-amber-400' : 'bg-red-400'}`}></div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold uppercase tracking-wider">{format(parseISO(record.date), 'MMM', { locale: id })}</p>
                        <p className="text-xl font-black leading-none mt-0.5">{format(parseISO(record.date), 'dd')}</p>
                      </div>
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-lg mb-1">{format(parseISO(record.date), 'EEEE', { locale: id })}</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                        record.status === 'ON_TIME' ? 'bg-green-100 text-green-700' : 
                        record.status === 'LATE' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {record.status === 'ON_TIME' ? 'Tepat Waktu' : record.status === 'LATE' ? 'Terlambat' : 'Absen'}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRecord(record);
                    }}
                    className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                  </button>
                </div>
                
                <div className="bg-[#F8FAFC] rounded-2xl p-4 flex items-center justify-between border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Masuk</p>
                      <p className="font-bold text-slate-700 text-sm text-left">{record.checkInTime ? format(parseISO(record.checkInTime), 'HH:mm') : '--:--'}</p>
                    </div>
                  </div>
                  <div className="w-[1px] h-8 bg-slate-200"></div>
                  <div className="flex items-center gap-3">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Pulang</p>
                      <p className="font-bold text-slate-700 text-sm text-left">{record.checkOutTime ? format(parseISO(record.checkOutTime), 'HH:mm') : '--:--'}</p>
                    </div>
                  </div>
                  {record.workingHours && (
                    <>
                      <div className="w-[1px] h-8 bg-slate-200"></div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 text-left">Total</p>
                        <p className="font-black text-slate-700 text-sm text-left">{record.workingHours.toFixed(1)}<span className="text-[10px] text-slate-400 font-bold ml-0.5">j</span></p>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white rounded-t-[2rem] z-[70] flex flex-col max-h-[85vh] border-t border-slate-200 shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 shrink-0 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">
                  {format(parseISO(selectedRecord.date), 'EEEE, dd MMM yyyy', { locale: id })}
                </h3>
                <button onClick={() => setSelectedRecord(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors shrink-0">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto pb-safe flex-1 space-y-6">
                <div className="flex flex-col gap-6">
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Bukti Masuk</p>
                    {(selectedRecord.checkInPhotoUrl || selectedRecord.photoUrl) ? (
                      <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner">
                        <img src={(selectedRecord.checkInPhotoUrl || selectedRecord.photoUrl)!} alt="Check in" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-slate-900/80 backdrop-blur text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg flex items-center w-fit gap-1.5 shadow-sm">
                            {selectedRecord.checkInTime ? format(parseISO(selectedRecord.checkInTime), 'HH:mm:ss') : ''}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex items-center justify-center">
                        <p className="text-xs font-medium text-slate-400">Tidak ada foto</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Bukti Pulang</p>
                    {selectedRecord.checkOutPhotoUrl ? (
                      <div className="w-full h-48 bg-slate-100 rounded-2xl overflow-hidden relative border border-slate-200 shadow-inner">
                        <img src={selectedRecord.checkOutPhotoUrl} alt="Check out" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent"></div>
                        <div className="absolute bottom-3 left-3 right-3">
                          <div className="bg-slate-900/80 backdrop-blur text-white text-[10px] uppercase font-bold tracking-wider px-3 py-1.5 rounded-lg flex items-center w-fit gap-1.5 shadow-sm">
                            {selectedRecord.checkOutTime ? format(parseISO(selectedRecord.checkOutTime), 'HH:mm:ss') : ''}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-slate-50 rounded-2xl border border-slate-200 border-dashed flex items-center justify-center">
                         <p className="text-xs font-medium text-slate-400">Tidak ada foto</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4 pb-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-blue-100 rounded-full opacity-50 blur-xl"></div>
                      <div className="relative z-10">
                        <p className="text-[10px] text-blue-600 uppercase font-bold tracking-wider mb-1">Absen Masuk</p>
                        <p className="font-bold text-slate-900 text-xl">
                          {selectedRecord.checkInTime ? format(parseISO(selectedRecord.checkInTime), 'HH:mm') : '--:--'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 relative overflow-hidden">
                      <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-100 rounded-full opacity-50 blur-xl"></div>
                      <div className="relative z-10">
                        <p className="text-[10px] text-indigo-600 uppercase font-bold tracking-wider mb-1">Absen Pulang</p>
                        <p className="font-bold text-slate-900 text-xl">
                          {selectedRecord.checkOutTime ? format(parseISO(selectedRecord.checkOutTime), 'HH:mm') : '--:--'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <MiniMap 
                      checkInLocation={selectedRecord.checkInLocation || selectedRecord.location} 
                      checkOutLocation={selectedRecord.checkOutLocation} 
                      office={office}
                    />

                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden">
                      <div className="w-10 h-10 bg-white text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 shadow-sm relative z-10">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="relative z-10 flex-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Lokasi Masuk</p>
                        <p className="font-bold text-slate-900 text-sm leading-relaxed">
                          {(selectedRecord.checkInLocation || selectedRecord.location) ? `${(selectedRecord.checkInLocation || selectedRecord.location)!.lat.toFixed(6)}, ${(selectedRecord.checkInLocation || selectedRecord.location)!.lng.toFixed(6)}` : 'Lokasi tidak tersedia'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 relative overflow-hidden">
                      <div className="w-10 h-10 bg-white text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-slate-200 shadow-sm relative z-10">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="relative z-10 flex-1">
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Lokasi Pulang</p>
                        <p className="font-bold text-slate-900 text-sm leading-relaxed">
                          {selectedRecord.checkOutLocation ? `${selectedRecord.checkOutLocation.lat.toFixed(6)}, ${selectedRecord.checkOutLocation.lng.toFixed(6)}` : 'Lokasi tidak tersedia'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-5 bg-slate-900 rounded-2xl border border-slate-800 text-white relative overflow-hidden">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/20 rounded-full opacity-50 blur-2xl translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Status Kehadiran</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          selectedRecord.status === 'ON_TIME' ? 'bg-green-400' : 
                          selectedRecord.status === 'LATE' ? 'bg-amber-400' : 'bg-red-400'
                        }`}></span>
                        <p className="font-bold text-lg">
                           {selectedRecord.status === 'ON_TIME' ? 'Tepat Waktu' : selectedRecord.status === 'LATE' ? 'Terlambat' : 'Absen'}
                        </p>
                      </div>
                    </div>
                    {selectedRecord.workingHours && (
                      <div className="text-right relative z-10">
                         <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Total Jam</p>
                         <p className="font-bold text-xl text-blue-400">{selectedRecord.workingHours.toFixed(1)}<span className="text-sm font-medium text-slate-400 ml-1">jam</span></p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
