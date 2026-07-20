import React, {useEffect, useState, useMemo} from 'react';
import { apiHrdGetAttendance } from '@/src/lib/api';
import { AttendanceRecord } from '@/src/types';

const KehadiranHRD: React.FC = () => {
  // simpan data dari be 
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // filter dan pencarian
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');

  // Modal Foto
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // ambil data dari be
  const fetchAttendnce = async (dateFilter?: string) => {
    setLoading(true);
    try {
      const res = await apiHrdGetAttendance(dateFilter);
      setRecords(res.records || []);
    }catch (err){
      console.error("Gagal memuat rekap kehadiran:", err);
    }finally{
      setLoading(false);
    }
  };
  
  useEffect(() =>{
    fetchAttendnce(selectedDate);
    setCurrentPage(1);
  }, [selectedDate]); 

  const filteredRecords = useMemo(() => {
    return records.filter((rec: any) => {
      // filter pencarian
      const matchSearch = 
      rec.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.department?.toLowerCase().includes(searchQuery.toLowerCase());

      // filter Status
      let matchStatus = true;
      if (selectedStatus === 'Hadir') matchStatus = rec.status === 'ON_TIME';
      if (selectedStatus === 'Hadir') matchStatus = rec.status === 'late';
      if (selectedStatus === 'Hadir') matchStatus = ['LEAVE', 'SAKIT', 'IZIN'].includes(rec.status);
    
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, selectedStatus]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-8 relative">
      
      {/* Judul & Tombol Export */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Kehadiran</h2>
          <p className="text-gray-500 mt-1 text-sm">Monitor and manage daily employee attendance records.</p>
        </div>
        <button onClick={() => alert("Mengunduh laporan .. (fitur segera siap)")} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm">
          <span className="mr-2">📥</span> Export to Excel
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Search Record</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400">🔍</span>
            <input type="text" placeholder="Name, ID, or Dept..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400">📅</span>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
          <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option value="All Status">All Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Terlambat">Terlambat</option>
            <option value="Cuti">Cuti</option>
          </select>
        </div>
      </div>

      {/* Tabel Data Kehadiran */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Status</th>
                <th className="px-6 py-4 font-semibold">Check-In</th>
                <th className="px-6 py-4 font-semibold">Check-Out</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">
                    Memuat data kehadiran...
                  </td>
                </tr>
              ) : paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec: any, index: number) => {
                  // Avatar
                  const initials = rec.name
                    ? rec.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'US';

                  // Warna & Label Status
                  let statusLabel = rec.status || 'Hadir';
                  let statusClass = 'bg-gray-100 text-gray-700';

                  if (rec.status === 'ON_TIME') {
                    statusLabel = 'Hadir';
                    statusClass = 'bg-green-100 text-green-700';
                  } else if (rec.status === 'LATE') {
                    statusLabel = 'Terlambat';
                    statusClass = 'bg-yellow-100 text-yellow-700';
                  } else if (['LEAVE', 'SICK', 'CUTI'].includes(rec.status)) {
                    statusLabel = 'Cuti';
                    statusClass = 'bg-red-100 text-red-600';
                  }

                  const isCuti = statusLabel === 'Cuti';

                  return (
                    <tr key={rec.id || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 flex items-center">
                        <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">
                          {initials}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{rec.name || 'Tanpa Nama'}</p>
                          <p className="text-xs text-gray-500">
                            {rec.employeeId || `EMP-${rec.user_id || rec.id || '000'}`} • {rec.department || 'Staff'}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${statusClass} px-3 py-1 rounded-md text-xs font-medium inline-block`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {isCuti ? <span className="text-gray-400">-</span> : (rec.checkInTime || '--:--')}
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {isCuti ? '-' : (rec.checkOutTime || '--:--')}
                      </td>
                      <td className="px-6 py-4">
                        {isCuti || (!rec.check_in_lat && !rec.check_in_lng) ? (
                          <span className="text-gray-400">-</span>
                        ) : (
                          <>
                            <p className="text-gray-700">{Number(rec.check_in_lat).toFixed(4)}, {Number(rec.check_in_lng).toFixed(4)}</p>
                            <p className="text-xs text-gray-500">{rec.locationName || 'Lokasi Terdeteksi'}</p>
                          </>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {rec.check_in_photo_url ? (
                          <button 
                            onClick={() => setPreviewPhoto(rec.check_in_photo_url)}
                            className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 text-xs font-medium inline-flex items-center"
                          >
                            <span className="mr-1">👁️</span> Photo
                          </button>
                        ) : (
                          <button className="border border-gray-200 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed inline-flex items-center" disabled>
                            <span className="mr-1">🚫</span> N/A
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Tidak ada data kehadiran yang sesuai dengan filter Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Showing {filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredRecords.length)} of {filteredRecords.length} entries
          </span>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-500"
            >
              ❮
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentPage === page 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2 py-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:hover:text-gray-500"
            >
              ❯
            </button>
          </div>
        </div>
      </div>
      {/* Modal Preview Foto */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-5 rounded-xl max-w-md w-full shadow-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-800 text-base">Bukti Foto Check-In</h4>
              <button 
                onClick={() => setPreviewPhoto(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <div className="bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center max-h-96 border border-gray-200">
              <img src={previewPhoto} alt="Bukti Absen" className="object-contain w-full h-full max-h-80" />
            </div>
            <button
              onClick={() => setPreviewPhoto(null)}
              className="mt-4 w-full bg-gray-800 hover:bg-gray-900 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default KehadiranHRD;