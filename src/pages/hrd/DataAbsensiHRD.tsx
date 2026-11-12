import { exportToExcel, exportToPDF } from '@/src/utils/exportUtils';
import React, { useEffect, useState, useMemo } from 'react';
import { apiHrdGetAttendanceSummary, apiHrdGetEmployeeReport, apiHrdExportDailyReport, apiHrdUpdateAttendanceSummaryOverride } from '../../lib/api';
import {
  Download,
  Search,
  Calendar,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit,
  X,
  Save
} from 'lucide-react';

interface EmployeeSummaryItem {
  id: string;
  employeeId: string;
  name: string;
  department: string;
  email?: string;
  phone?: string;
  position?: string;
  izin: number | null;
  sakit: number | null;
  cuti: number | null;
  alpa: number | null;
  telat: number | null;
  telatMenit?: number | null;
  hadir: number;
  periode: string;
  periodeSubtext?: string | null;
  periodKey?: string;
  isOverridden?: boolean;
  hasData: boolean;
}

// Fungsi bantu untuk memformat menit terlambat menjadi "X jam Y menit"
const formatLateMinutes = (mins: number | null | undefined, hasData: boolean = true): string => {
  if (mins === null || mins === undefined) {
    return hasData ? '0 menit' : '-';
  }
  const total = Number(mins);
  if (isNaN(total) || total <= 0) {
    return hasData ? '0 menit' : '-';
  }
  const hours = Math.floor(total / 60);
  const remainingMins = total % 60;
  if (hours > 0 && remainingMins > 0) {
    return `${hours} jam ${remainingMins} menit`;
  } else if (hours > 0) {
    return `${hours} jam`;
  } else {
    return `${remainingMins} menit`;
  }
};

const DataAbsensiHRD: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [records, setRecords] = useState<EmployeeSummaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  // State Modal Edit Rekap Absensi
  const [editingItem, setEditingItem] = useState<EmployeeSummaryItem | null>(null);
  const [editFormData, setEditFormData] = useState({
    izin: 0,
    sakit: 0,
    cuti: 0,
    alpa: 0,
    telat: 0,
    telatMenit: 0,
    notes: ''
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState<boolean>(false);

  const handleOpenEdit = (item: EmployeeSummaryItem) => {
    setEditingItem(item);
    setEditFormData({
      izin: item.izin ?? 0,
      sakit: item.sakit ?? 0,
      cuti: item.cuti ?? 0,
      alpa: item.alpa ?? 0,
      telat: item.telat ?? 0,
      telatMenit: item.telatMenit ?? 0,
      notes: ''
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    setIsSubmittingEdit(true);
    try {
      const periodKey = editingItem.periodKey || (startDate && endDate ? `${startDate}_${endDate}` : (startDate ? `from_${startDate}` : 'all'));
      await apiHrdUpdateAttendanceSummaryOverride({
        user_id: editingItem.id,
        period_key: periodKey,
        izin: Number(editFormData.izin),
        sakit: Number(editFormData.sakit),
        cuti: Number(editFormData.cuti),
        alpa: Number(editFormData.alpa),
        telat: Number(editFormData.telat),
        telat_menit: Number(editFormData.telatMenit),
        notes: editFormData.notes
      });

      showToast(`Data absensi ${editingItem.name} berhasil diperbarui.`);
      setEditingItem(null);
      // Refresh data dari backend
      fetchSummaryFromBackend(searchQuery, startDate, endDate);
    } catch (err: any) {
      console.error("Gagal menyimpan perubahan absensi:", err);
      alert(err.message || "Gagal menyimpan perubahan rekap absensi.");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Fungsi fetch data absensi karyawan langsung dari backend MySQL
  const fetchSummaryFromBackend = async (querySearch?: string, start?: string, end?: string) => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiHrdGetAttendanceSummary({
        startDate: start || undefined,
        endDate: end || undefined,
        search: querySearch || undefined
      });
      if (res && Array.isArray(res.summary)) {
        setRecords(res.summary);
      } else {
        setRecords([]);
      }
    } catch (err: any) {
      console.error("Gagal memuat data karyawan dari backend:", err);
      setErrorMessage(err?.message || "Terjadi kesalahan saat memuat data karyawan dari server.");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounce pemanggilan API saat pengguna mengetik nama atau memilih tanggal
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchSummaryFromBackend(searchQuery, startDate, endDate);
    }, 300);

    return () => clearTimeout(handler);
  }, [searchQuery, startDate, endDate]);

  const totalPages = Math.ceil(records.length / itemsPerPage) || 1;
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return records.slice(start, start + itemsPerPage);
  }, [records, currentPage]);

  const showToast = (message: string) => {
    setSuccessToast(message);
    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);
  };

  return (
    <div className="p-4 md:p-8 relative w-full font-sans">
      
      {/* Toast Notifikasi Sukses */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 transition-all duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* HEADER: Judul Halaman */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Data Absensi</h2>
          <p className="text-gray-500 mt-0.5 text-sm">Seluruh Data Absensi Karyawan PT CTI</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
            <button 
            onClick={() => {
                const exportData = records.map(r => ({
                    ...r,
                    telatFormatted: formatLateMinutes(r.telatMenit, r.hasData)
                }));
                exportToExcel({
                    title: 'Laporan Rekap Absensi',
                    filename: 'Laporan_Rekap_Absensi',
                    columns: [
                    { header: 'Nama Karyawan', dataKey: 'name' },
                    { header: 'Bagian', dataKey: 'department' },
                    { header: 'Izin', dataKey: 'izin' },
                    { header: 'Sakit', dataKey: 'sakit' },
                    { header: 'Cuti', dataKey: 'cuti' },
                    { header: 'Alpa', dataKey: 'alpa' },
                    { header: 'Telat (Kali)', dataKey: 'telat' },
                    { header: 'Telat (Durasi)', dataKey: 'telatFormatted' },
                    { header: 'Hadir', dataKey: 'hadir' },
                    { header: 'Periode', dataKey: 'periode' },
                    ],
                    data: exportData
                });
            }}
            className="flex-1 sm:flex-none border border-green-600 bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center shadow-sm justify-center"
            >
            <Download className="w-4 h-4 mr-2" /> Excel
            </button>
            <button 
            onClick={() => {
                exportToPDF({
                    title: 'Laporan Rekap Absensi',
                    filename: 'Laporan_Rekap_Absensi',
                    columns: [
                    { header: 'Nama Karyawan', dataKey: 'name' },
                    { header: 'Bagian', dataKey: 'department' },
                    { header: 'Izin', dataKey: 'izin' },
                    { header: 'Sakit', dataKey: 'sakit' },
                    { header: 'Cuti', dataKey: 'cuti' },
                    { header: 'Alpa', dataKey: 'alpa' },
                    { header: 'Hadir', dataKey: 'hadir' },
                    ],
                    data: records,
                    dateRange: `${startDate || 'Awal'} - ${endDate || 'Sekarang'}`
                });
            }}
            className="flex-1 sm:flex-none border border-red-600 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center shadow-sm justify-center"
            >
            <Download className="w-4 h-4 mr-2" /> PDF
            </button>
            <button 
            onClick={async () => {
                try {
                    const reportDate = endDate || startDate || todayStr;
                    showToast("Sedang menyiapkan Laporan Harian...");
                    await apiHrdExportDailyReport(reportDate);
                } catch (err: any) {
                    setErrorMessage(err.message || "Gagal mengunduh laporan.");
                }
            }}
            className="flex-1 sm:flex-none border border-blue-600 bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-md text-sm font-semibold transition-colors flex items-center shadow-sm justify-center"
            >
            <Download className="w-4 h-4 mr-2" /> Excel Harian
            </button>
        </div>
      </div>

      {/* FILTER BAR: Pencarian Nama & Pilihan Rentang Tanggal */}
      <div className="bg-white p-4 md:p-5 rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
          
          {/* Cari Nama Karyawan */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Cari Nama Karyawan</label>
            <div className="relative">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="cari berdasarkan nama..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>

          {/* Filter Rentang Tanggal */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
            <div className="w-full sm:w-44">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-600">Dari Tanggal</label>
                {(startDate || endDate) && (
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setCurrentPage(1);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                    title="Tampilkan seluruh rekap kumulatif"
                  >
                    Semua Waktu
                  </button>
                )}
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (endDate && val > endDate) setEndDate(val);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            <span className="hidden sm:inline-block text-gray-400 pb-2.5 font-bold">-</span>

            <div className="w-full sm:w-44">
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-600">Sampai Tanggal</label>
                {(!startDate && !endDate) && (
                  <button
                    onClick={() => {
                      setStartDate(todayStr);
                      setEndDate(todayStr);
                      setCurrentPage(1);
                    }}
                    className="text-xs text-blue-600 hover:underline"
                    title="Filter untuk hari ini"
                  >
                    Hari Ini
                  </button>
                )}
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full pl-9 pr-2 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                />
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Pesan Error jika koneksi backend bermasalah */}
      {errorMessage && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* TABEL DATA REKAP ABSENSI */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-gray-50/75 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th rowSpan={2} className="px-6 py-3.5 font-semibold align-middle">Nama Karyawan</th>
                <th rowSpan={2} className="px-6 py-3.5 font-semibold align-middle">Bagian</th>
                <th rowSpan={2} className="px-6 py-3.5 font-semibold align-middle text-center">Izin</th>
                <th rowSpan={2} className="px-6 py-3.5 font-semibold align-middle text-center">Sakit</th>
                <th rowSpan={2} className="px-6 py-3.5 font-semibold align-middle text-center">Cuti</th>
                <th rowSpan={2} className="px-6 py-3.5 font-semibold align-middle text-center">Alpa</th>
                <th colSpan={2} className="px-6 py-2 font-semibold text-center border-b border-gray-200">Terlambat</th>
                <th rowSpan={2} className="px-6 py-3.5 font-semibold align-middle">Periode</th>
                <th rowSpan={2} className="px-6 py-3.5 font-semibold align-middle text-center">Aksi</th>
              </tr>
              <tr className="bg-gray-50/75 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="px-3 py-2 font-semibold text-center border-r border-gray-200">Kali</th>
                <th className="px-3 py-2 font-semibold text-center">Durasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-400 font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                      <span>Mengambil data karyawan dari server...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedRecords.length > 0 ? (
                paginatedRecords.map((rec) => {
                  // Inisial avatar (misal: "Budi Santoso" -> "BS")
                  const initials = rec.name
                    ? rec.name
                        .split(' ')
                        .filter(Boolean)
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase()
                    : 'US';

                  return (
                    <tr key={rec.id} className="hover:bg-gray-50/80 transition-colors">
                      {/* Employee Avatar & Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-9 h-9 bg-gray-200 text-gray-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 shrink-0">
                            {initials}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-tight">{rec.name}</p>
                          </div>
                        </div>
                      </td>

                      {/* Divisi */}
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800">{rec.department || '-'}</span>
                      </td>

                      {/* Izin */}
                      <td className="px-6 py-4 text-gray-700 font-medium text-center">
                        {rec.izin !== null && rec.izin !== undefined ? rec.izin : (rec.hasData ? 0 : '-')}
                      </td>

                      {/* Sakit */}
                      <td className="px-6 py-4 text-gray-700 font-medium text-center">
                        {rec.sakit !== null && rec.sakit !== undefined ? rec.sakit : (rec.hasData ? 0 : '-')}
                      </td>

                      {/* Cuti */}
                      <td className="px-6 py-4 text-gray-700 font-medium text-center">
                        {rec.cuti !== null && rec.cuti !== undefined ? rec.cuti : (rec.hasData ? 0 : '-')}
                      </td>

                      {/* Alpa */}
                      <td className="px-6 py-4 text-gray-700 font-medium text-center">
                        {rec.alpa !== null && rec.alpa !== undefined ? rec.alpa : (rec.hasData ? 0 : '-')}
                      </td>

                      {/* Telat Kali */}
                      <td className="px-3 py-4 text-gray-700 font-medium text-center border-r border-gray-50">
                        {rec.telat !== null && rec.telat !== undefined ? rec.telat : (rec.hasData ? 0 : '-')}
                      </td>

                      {/* Telat Durasi (Jam & Menit) */}
                      <td className="px-3 py-4 text-gray-700 font-medium text-center whitespace-nowrap text-xs">
                        {formatLateMinutes(rec.telatMenit, rec.hasData)}
                      </td>

                      {/* Periode */}
                      <td className="px-6 py-4">
                        {rec.periode && rec.periode !== '-' ? (
                          <div>
                            <p className="text-gray-800 text-xs font-medium">{rec.periode}</p>
                            {rec.periodeSubtext && (
                              <p className="text-[11px] text-gray-400 mt-0.5">{rec.periodeSubtext}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button 
                            onClick={() => handleOpenEdit(rec)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 hover:border-blue-300 rounded-md transition-colors inline-flex items-center"
                            title={`Edit Rekap Absensi - ${rec.name}`}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              try {
                                  const reportDate = endDate || startDate || todayStr;
                                  showToast(`Menyiapkan Laporan ${rec.name}...`);
                                  await apiHrdExportDailyReport(reportDate, rec.id);
                              } catch (err: any) {
                                  setErrorMessage(err.message || "Gagal mengunduh laporan.");
                              }
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 border border-emerald-200 hover:border-emerald-300 rounded-md transition-colors inline-flex items-center"
                            title={`Download Excel Harian - ${rec.name}`}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Tidak ada data karyawan yang ditemukan dari backend.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-gray-500">
            Showing {records.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
            {Math.min(currentPage * itemsPerPage, records.length)} of {records.length} entries
          </span>
          
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`min-w-[28px] h-7 px-2 rounded text-xs font-medium transition-colors cursor-pointer ${
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
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              aria-label="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Edit Rekap Absensi */}
      {editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-gray-200 bg-gray-50/50">
              <div>
                <h3 className="text-base font-bold text-gray-800">Edit Rekap Absensi</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingItem.name} ({editingItem.department}) — Periode: {editingItem.periode}
                </p>
              </div>
              <button 
                onClick={() => setEditingItem(null)} 
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Izin */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Izin (Hari)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={editFormData.izin}
                    onChange={(e) => setEditFormData({ ...editFormData, izin: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Sakit */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Sakit (Hari)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={editFormData.sakit}
                    onChange={(e) => setEditFormData({ ...editFormData, sakit: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Cuti */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Cuti (Hari)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={editFormData.cuti}
                    onChange={(e) => setEditFormData({ ...editFormData, cuti: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Alpa */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Total Alpa (Hari)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={editFormData.alpa}
                    onChange={(e) => setEditFormData({ ...editFormData, alpa: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Terlambat Kali */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Terlambat (Berapa Kali)</label>
                  <input 
                    type="number" 
                    min={0}
                    value={editFormData.telat}
                    onChange={(e) => setEditFormData({ ...editFormData, telat: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                {/* Terlambat Menit */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-semibold text-gray-700">Terlambat (Total Menit)</label>
                    <span className="text-[11px] font-medium text-blue-600">
                      = {formatLateMinutes(editFormData.telatMenit)}
                    </span>
                  </div>
                  <input 
                    type="number" 
                    min={0}
                    value={editFormData.telatMenit}
                    onChange={(e) => setEditFormData({ ...editFormData, telatMenit: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Contoh: 130"
                    required
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Ketik menit (misal: 130 menit otomatis tampil sebagai 2 jam 10 menit)
                  </p>
                </div>
              </div>

              {/* Catatan Perubahan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Catatan Koreksi (Opsional)</label>
                <textarea 
                  rows={2}
                  placeholder="Contoh: Koreksi izin dinas luar kota atau surat dokter susulan..."
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingEdit}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow-sm flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  {isSubmittingEdit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAbsensiHRD;
