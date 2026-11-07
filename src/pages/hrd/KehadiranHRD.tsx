import { exportToExcel, exportToPDF } from '@/src/utils/exportUtils';
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  apiHrdGetAttendance, 
  apiHrdGetEmployees, 
  apiHrdGetHospitals, 
  apiHrdGetOffices,
  apiHrdCreateManualAttendance,
  apiHrdGetWorkDaysSettings,
  apiHrdSaveWorkDaysSettings
} from '@/src/lib/api';
import { AttendanceRecord, HospitalLocation } from '@/src/types';
import { ClockTimePickerModal } from '@/src/components/ClockTimePicker';

import { 
  Download, 
  Search, 
  Calendar, 
  Eye, 
  Ban, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Plus,
  Settings,
  Clock,
  Upload,
  Camera,
  Trash2,
  Check
} from 'lucide-react';

const LocationDisplay = ({ lat, lng }: { lat: number, lng: number }) => {
  const [name, setName] = useState<string>('Memuat lokasi...');
  
  useEffect(() => {
    if (!lat || !lng) return;
    fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`)
      .then(res => res.json())
      .then(data => {
        let locName = [data.locality, data.city, data.principalSubdivision].filter(Boolean).join(', ');
        locName = locName.replace(/Jawa\s+(Barat|Tengah|Timur)|Jawa/gi, '').replace(/,\s*$/, '').replace(/,\s*,/g, ', ');
        setName(locName.trim() || 'Lokasi Terdeteksi');
      })
      .catch(() => setName('Lokasi Terdeteksi'));
  }, [lat, lng]);

  return (
    <a 
      href={`https://www.google.com/maps?q=${lat},${lng}`} 
      target="_blank" 
      rel="noreferrer"
      className="text-blue-600 hover:underline text-xs"
    >
      {name}
    </a>
  );
};

const KehadiranHRD: React.FC = () => {
  // Simpan data dari BE 
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [employees, setEmployees] = useState<any[]>([]);
  const [locations, setLocations] = useState<HospitalLocation[]>([]);

  // Filter dan pencarian
  const todayStr = new Date().toISOString().split('T')[0];
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [selectedStatus, setSelectedStatus] = useState<string>('All Status');

  // Modal Foto
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [previewType, setPreviewType] = useState<'checkIn' | 'checkOut'>('checkIn');
  const [zoom, setZoom] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // Modal Tambah Kehadiran Manual
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isSavingManual, setIsSavingManual] = useState(false);
  
  // Opsi jenis input kehadiran: hanya masuk, hanya pulang, atau keduanya
  const [manualType, setManualType] = useState<'both' | 'check_in_only' | 'check_out_only'>('check_in_only');
  const [manualPhotoUrl, setManualPhotoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [manualForm, setManualForm] = useState({
    user_id: '',
    date: todayStr,
    check_in_time: '08:00',
    check_out_time: '17:00',
    status: 'ON_TIME',
    hospital_id: '',
    custom_location_name: 'Input Manual HRD'
  });

  // Modal Pengaturan Hari Kerja (Cron)
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [workDays, setWorkDays] = useState<'1-5' | '1-6'>('1-5');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Time Picker Modal State
  const [timePickerTarget, setTimePickerTarget] = useState<'in' | 'out' | null>(null);

  // Ambil data dari BE
  const fetchAttendance = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const res = await apiHrdGetAttendance({ startDate: start, endDate: end });
      setRecords(res.records || []);
    } catch (err) {
      console.error("Gagal memuat rekap kehadiran:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxData = async () => {
    try {
      const [empRes, hRes, oRes, setRes] = await Promise.all([
        apiHrdGetEmployees().catch(() => ({ employees: [] })),
        apiHrdGetHospitals().catch(() => ({ hospitals: [] })),
        apiHrdGetOffices().catch(() => ({ offices: [] })),
        apiHrdGetWorkDaysSettings().catch(() => ({ workDays: '1-5' }))
      ]);
      setEmployees(empRes.employees || []);
      setLocations([...(oRes.offices || []), ...(hRes.hospitals || [])]);
      if (setRes.workDays === '1-6' || setRes.workDays === '1-5') {
        setWorkDays(setRes.workDays);
      }
    } catch (e) {
      console.error("Gagal mengambil data pembantu:", e);
    }
  };
  
  useEffect(() => {
    fetchAttendance(startDate, endDate);
    setCurrentPage(1);
  }, [startDate, endDate]); 

  useEffect(() => {
    fetchAuxData();
  }, []);

  // Upload foto bukti dan otomatis kompresi via canvas
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxWidth = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setManualPhotoUrl(compressedDataUrl);
        }
      };
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.user_id) {
      alert("Silakan pilih karyawan terlebih dahulu!");
      return;
    }
    setIsSavingManual(true);
    try {
      await apiHrdCreateManualAttendance({
        user_id: manualForm.user_id,
        date: manualForm.date,
        check_in_time: manualType === 'check_out_only' ? null : manualForm.check_in_time,
        check_out_time: manualType === 'check_in_only' ? null : manualForm.check_out_time,
        status: manualForm.status,
        hospital_id: manualForm.hospital_id || undefined,
        custom_location_name: manualForm.custom_location_name || 'Input Manual HRD',
        photo_url: manualPhotoUrl || null
      });

      alert("Kehadiran manual berhasil disimpan!");
      setIsManualModalOpen(false);
      setManualPhotoUrl(null);
      fetchAttendance(startDate, endDate);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan kehadiran: " + (err.message || 'Server error'));
    } finally {
      setIsSavingManual(false);
    }
  };

  const handleSaveWorkDays = async () => {
    setIsSavingSettings(true);
    try {
      await apiHrdSaveWorkDaysSettings(workDays);
      alert(`Pengaturan hari kerja cron berhasil disimpan (${workDays === '1-6' ? 'Senin - Sabtu' : 'Senin - Jumat'}).`);
      setIsSettingsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan pengaturan: " + (err.message || 'Server error'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((rec: any) => {
      const matchSearch = 
        rec.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.employeeId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rec.department?.toLowerCase().includes(searchQuery.toLowerCase());

      let matchStatus = true;
      if (selectedStatus === 'Hadir') matchStatus = rec.status === 'ON_TIME';
      if (selectedStatus === 'Terlambat') matchStatus = rec.status === 'LATE';
    
      return matchSearch && matchStatus;
    });
  }, [records, searchQuery, selectedStatus]);

  const totalPages = Math.ceil(filteredRecords.length / itemsPerPage);
  const paginatedRecords = filteredRecords.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-4 md:p-8 relative w-full">
      
      {/* Judul & Tombol Export / Aksi */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Kehadiran</h2>
          <p className="text-gray-500 mt-1 text-sm">
            Pantau absensi harian dan kelola kehadiran manual karyawan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {/* Tombol Pengaturan Hari Kerja Cron */}
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            title="Atur Hari Kerja Otomatis Cron"
          >
            <Settings className="w-4 h-4 text-gray-500" />
            <span className="hidden md:inline">Jadwal Kerja ({workDays === '1-6' ? 'Senin-Sabtu' : 'Senin-Jumat'})</span>
          </button>

          {/* Tombol Tambah Kehadiran Manual */}
          <button
            onClick={() => {
              setManualForm({
                user_id: employees[0]?.id || '',
                date: todayStr,
                check_in_time: '08:00',
                check_out_time: '17:00',
                status: 'ON_TIME',
                hospital_id: '',
                custom_location_name: 'Input Manual HRD'
              });
              setManualType('check_in_only'); // Default diabsenkan jam masuk
              setManualPhotoUrl(null);
              setIsManualModalOpen(true);
            }}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Kehadiran</span>
          </button>

          {/* Tombol Export Excel */}
          <button 
            onClick={() => {
              exportToExcel({
                title: 'Laporan Kehadiran',
                filename: 'Laporan_Kehadiran',
                columns: [
                  { header: 'Nama Karyawan', dataKey: 'name' },
                  { header: 'ID Karyawan', dataKey: 'employeeId' },
                  { header: 'Bagian', dataKey: 'department' },
                  { header: 'Tanggal', dataKey: 'date' },
                  { header: 'Status', dataKey: 'status' },
                  { header: 'Check In', dataKey: 'checkInTime' },
                  { header: 'Check Out', dataKey: 'checkOutTime' },
                  { header: 'Check In Location', dataKey: 'checkInLocStr' },
                  { header: 'Check Out Location', dataKey: 'checkOutLocStr' },
                ],
                data: filteredRecords.map(r => ({
                  ...r,
                  status: r.status === 'ON_TIME' ? 'Hadir' : r.status === 'LATE' ? 'Terlambat' : (r.status || 'Hadir'),
                  checkInLocStr: (r.check_in_lat && r.check_in_lng) ? `${Number(r.check_in_lat).toFixed(4)}, ${Number(r.check_in_lng).toFixed(4)}` : '-',
                  checkOutLocStr: (r.check_out_lat && r.check_out_lng) ? `${Number(r.check_out_lat).toFixed(4)}, ${Number(r.check_out_lng).toFixed(4)}` : '-'
                }))
              });
            }}
            className="border border-green-600 bg-green-50 hover:bg-green-100 text-green-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" /> Excel
          </button>

          {/* Tombol Export PDF */}
          <button 
            onClick={() => {
              exportToPDF({
                title: 'Laporan Kehadiran',
                filename: 'Laporan_Kehadiran',
                columns: [
                  { header: 'Nama Karyawan', dataKey: 'name' },
                  { header: 'Bagian', dataKey: 'department' },
                  { header: 'Tanggal', dataKey: 'date' },
                  { header: 'Status', dataKey: 'status' },
                  { header: 'Check In', dataKey: 'checkInTime' },
                  { header: 'Check Out', dataKey: 'checkOutTime' },
                  { header: 'Check In Location', dataKey: 'checkInLocStr' },
                  { header: 'Check Out Location', dataKey: 'checkOutLocStr' },
                ],
                data: filteredRecords.map(r => ({
                  ...r,
                  status: r.status === 'ON_TIME' ? 'Hadir' : r.status === 'LATE' ? 'Terlambat' : (r.status || 'Hadir'),
                  checkInLocStr: (r.check_in_lat && r.check_in_lng) ? `${Number(r.check_in_lat).toFixed(4)}, ${Number(r.check_in_lng).toFixed(4)}` : '-',
                  checkOutLocStr: (r.check_out_lat && r.check_out_lng) ? `${Number(r.check_out_lat).toFixed(4)}, ${Number(r.check_out_lng).toFixed(4)}` : '-'
                }))
              });
            }}
            className="border border-red-500 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama, ID, atau bagian..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1 text-sm text-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)} 
              className="bg-transparent focus:outline-none text-xs text-gray-700 cursor-pointer"
            />
            <span className="text-gray-400">-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)} 
              className="bg-transparent focus:outline-none text-xs text-gray-700 cursor-pointer"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer"
          >
            <option value="All Status">Semua Status</option>
            <option value="Hadir">Hadir</option>
            <option value="Terlambat">Terlambat</option>
          </select>
        </div>
      </div>

      {/* Tabel Data Kehadiran */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <th className="p-4">Karyawan</th>
                <th className="p-4">Bagian</th>
                <th className="p-4">Tanggal</th>
                <th className="p-4">Status</th>
                <th className="p-4">Check In</th>
                <th className="p-4">Check Out</th>
                <th className="p-4 text-center">Bukti Foto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400">
                    Memuat catatan kehadiran...
                  </td>
                </tr>
              ) : paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec: any, idx: number) => {
                  const isPresent = rec.status === 'ON_TIME';
                  const isLate = rec.status === 'LATE';

                  return (
                    <tr key={rec.id || idx} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="font-semibold text-gray-900">{rec.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{rec.employeeId || '-'}</div>
                      </td>
                      <td className="p-4">{rec.department || '-'}</td>
                      <td className="p-4 text-gray-600 font-mono text-xs">{rec.date}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          isPresent 
                            ? 'bg-green-100 text-green-700 border border-green-200' 
                            : isLate 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                        }`}>
                          {isPresent ? 'Hadir' : isLate ? 'Terlambat' : rec.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-xs font-semibold text-gray-800">{rec.checkInTime || '-'}</div>
                        {rec.check_in_lat && rec.check_in_lng && (
                          <div className="mt-0.5">
                            <LocationDisplay lat={Number(rec.check_in_lat)} lng={Number(rec.check_in_lng)} />
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-xs font-semibold text-gray-800">{rec.checkOutTime || '-'}</div>
                        {rec.check_out_lat && rec.check_out_lng && (
                          <div className="mt-0.5">
                            <LocationDisplay lat={Number(rec.check_out_lat)} lng={Number(rec.check_out_lng)} />
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {rec.check_in_photo_url || rec.check_out_photo_url ? (
                          <button
                            onClick={() => {
                              setPreviewData(rec);
                              setPreviewType(rec.check_in_photo_url ? 'checkIn' : 'checkOut');
                              setZoom(1);
                            }}
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Lihat Foto
                          </button>
                        ) : (
                          <span className="text-gray-400 italic text-xs flex items-center justify-center gap-1">
                            <Ban className="w-3.5 h-3.5" /> Manual / Tanpa Foto
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-400 font-medium">
                    Tidak ada catatan kehadiran pada rentang tanggal ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between bg-gray-50/50 gap-4">
          <span className="text-sm text-gray-500">
            Menampilkan {filteredRecords.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredRecords.length)} dari {filteredRecords.length} catatan
          </span>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  currentPage === page ? 'bg-gray-800 text-white' : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Clock Time Picker Modal */}
      <ClockTimePickerModal
        isOpen={timePickerTarget !== null}
        title={timePickerTarget === 'in' ? 'Pilih Jam Masuk' : 'Pilih Jam Pulang'}
        initialTime={timePickerTarget === 'in' ? manualForm.check_in_time : (manualForm.check_out_time || '17:00')}
        onClose={() => setTimePickerTarget(null)}
        onSave={(timeStr) => {
          if (timePickerTarget === 'in') {
            setManualForm(prev => ({ ...prev, check_in_time: timeStr }));
          } else {
            setManualForm(prev => ({ ...prev, check_out_time: timeStr }));
          }
          setTimePickerTarget(null);
        }}
      />

      {/* Modal Tambah Kehadiran Manual */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-blue-600" />
                Tambah Kehadiran Manual
              </h3>
              <button 
                onClick={() => setIsManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualAttendance} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Pilih Karyawan <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={manualForm.user_id}
                  onChange={(e) => setManualForm({ ...manualForm, user_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Pilih Karyawan --</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.employee_id || emp.nik || 'No ID'}) - {emp.department || emp.department_name || 'Staff'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilihan Opsi Jam: Masuk Saja / Pulang Saja / Keduanya */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Waktu Yang Diabsenkan Oleh HRD <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2 p-1 bg-gray-100 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setManualType('check_in_only')}
                    className={`py-2 rounded-md transition-all ${
                      manualType === 'check_in_only' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Jam Masuk Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('check_out_only')}
                    className={`py-2 rounded-md transition-all ${
                      manualType === 'check_out_only' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Jam Pulang Saja
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualType('both')}
                    className={`py-2 rounded-md transition-all ${
                      manualType === 'both' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Masuk & Pulang
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 italic">
                  {manualType === 'check_in_only' && '💡 Karyawan nantinya tetap bisa absen pulang secara mandiri lewat aplikasi PWA mereka.'}
                  {manualType === 'check_out_only' && '💡 Hanya mencatat jam keluar/pulang untuk karyawan yang terkendala saat check out.'}
                  {manualType === 'both' && '💡 Mencatat kehadiran lengkap sekaligus untuk hari tersebut.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={manualForm.date}
                    onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Status Kehadiran <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    <option value="ON_TIME">Hadir (Tepat Waktu)</option>
                    <option value="LATE">Terlambat</option>
                  </select>
                </div>
              </div>

              {/* Input Jam Masuk & Keluar Dinamis Sesuai Opsi */}
              <div className="grid grid-cols-2 gap-3">
                {(manualType === 'check_in_only' || manualType === 'both') && (
                  <div className={manualType === 'check_in_only' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Jam Masuk
                    </label>
                    <button
                      type="button"
                      onClick={() => setTimePickerTarget('in')}
                      className="w-full text-left border border-gray-300 rounded-md p-2 text-sm text-gray-800 bg-white hover:bg-gray-50 flex items-center justify-between shadow-sm"
                    >
                      <span>{manualForm.check_in_time || '08:00'}</span>
                      <Clock className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                )}

                {(manualType === 'check_out_only' || manualType === 'both') && (
                  <div className={manualType === 'check_out_only' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">
                      Jam Keluar
                    </label>
                    <button
                      type="button"
                      onClick={() => setTimePickerTarget('out')}
                      className="w-full text-left border border-gray-300 rounded-md p-2 text-sm text-gray-800 bg-white hover:bg-gray-50 flex items-center justify-between shadow-sm"
                    >
                      <span>{manualForm.check_out_time || '17:00'}</span>
                      <Clock className="w-4 h-4 text-blue-600" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Penugasan / Lokasi (RS / Kantor)
                </label>
                <select
                  value={manualForm.hospital_id}
                  onChange={(e) => setManualForm({ ...manualForm, hospital_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Pilih Lokasi (Opsional) --</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.nama_rs || loc.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Foto Bukti Kehadiran */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Upload Foto Bukti Kehadiran (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {manualPhotoUrl ? (
                  <div className="relative border border-gray-200 rounded-lg p-2 bg-gray-50 flex items-center gap-3">
                    <img 
                      src={manualPhotoUrl} 
                      alt="Bukti Kehadiran" 
                      className="w-16 h-16 object-cover rounded-md border border-gray-300"
                    />
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Foto Siap Diupload
                      </span>
                      <p className="text-[11px] text-gray-400 mt-0.5">Otomatis terkompresi</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setManualPhotoUrl(null)}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-lg p-3 text-center flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-blue-50/30 transition-colors"
                  >
                    <Upload className="w-5 h-5 text-gray-400" />
                    <span className="text-xs font-medium text-gray-600">Klik untuk unggah foto (Kamera/Galeri)</span>
                  </button>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={manualForm.custom_location_name}
                  onChange={(e) => setManualForm({ ...manualForm, custom_location_name: e.target.value })}
                  placeholder="Contoh: Input Manual HRD (Kendala HP/Jaringan)"
                  className="w-full border border-gray-300 rounded-md p-2 text-sm text-gray-800 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold disabled:opacity-50"
                >
                  {isSavingManual ? 'Menyimpan...' : 'Simpan Kehadiran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pengaturan Hari Kerja (Cron) */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
                <Settings className="w-5 h-5 text-gray-700" />
                Pengaturan Hari Kerja (Cron Alfa)
              </h3>
              <button 
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">
                Tentukan hari kerja operasional untuk cron otomatis yang mencatat absensi <strong>Alfa (ABSENT)</strong> pada pukul 23:50:
              </p>

              <div className="space-y-3">
                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  workDays === '1-5' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="workDays"
                    value="1-5"
                    checked={workDays === '1-5'}
                    onChange={() => setWorkDays('1-5')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-gray-900 block text-sm">Senin - Jumat (5 Hari Kerja)</span>
                    <span className="text-xs text-gray-500">Sabtu & Minggu libur. Cron Alfa tidak akan dijalankan pada akhir pekan.</span>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  workDays === '1-6' ? 'border-blue-600 bg-blue-50/50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="workDays"
                    value="1-6"
                    checked={workDays === '1-6'}
                    onChange={() => setWorkDays('1-6')}
                    className="mt-1 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-bold text-gray-900 block text-sm">Senin - Sabtu (6 Hari Kerja)</span>
                    <span className="text-xs text-gray-500">Hanya Minggu yang libur. Sabtu tetap dihitung hari kerja dan cron Alfa tetap berjalan.</span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveWorkDays}
                  disabled={isSavingSettings}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold disabled:opacity-50"
                >
                  {isSavingSettings ? 'Menyimpan...' : 'Simpan Pengaturan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Preview Foto */}
      {previewData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white p-5 rounded-xl max-w-lg w-full shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-gray-800 text-base">Bukti Foto Absensi</h4>
              <button 
                onClick={() => setPreviewData(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex space-x-2 mb-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => { setPreviewType('checkIn'); setZoom(1); }}
                disabled={!previewData.check_in_photo_url}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${previewType === 'checkIn' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:hover:text-gray-500'}`}
              >
                Check-In
              </button>
              <button
                onClick={() => { setPreviewType('checkOut'); setZoom(1); }}
                disabled={!previewData.check_out_photo_url}
                className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${previewType === 'checkOut' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700 disabled:opacity-40 disabled:hover:text-gray-500'}`}
              >
                Check-Out
              </button>
            </div>

            <div className="relative flex-1 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 min-h-[300px]">
              <div className="absolute top-2 right-2 z-10 flex flex-col space-y-1 bg-white/80 p-1 rounded-md shadow-sm backdrop-blur-md">
                <button onClick={() => setZoom(z => Math.min(z + 0.5, 3))} className="p-1.5 text-gray-700 hover:bg-gray-200 rounded">
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button onClick={() => setZoom(z => Math.max(z - 0.5, 0.5))} className="p-1.5 text-gray-700 hover:bg-gray-200 rounded">
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
              <div className="w-full h-full flex items-center justify-center overflow-auto">
                <img 
                  src={previewType === 'checkIn' ? previewData.check_in_photo_url : previewData.check_out_photo_url} 
                  alt="Bukti Absen" 
                  style={{ transform: `scale(${zoom})`, transition: 'transform 0.2s ease-in-out', transformOrigin: 'center' }}
                  className="object-contain w-full h-full max-h-[60vh] cursor-move" 
                />
              </div>
            </div>

            <button
              onClick={() => setPreviewData(null)}
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
