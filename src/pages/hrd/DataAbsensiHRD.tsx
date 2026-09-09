import React, { useEffect, useState, useMemo } from 'react';
import { apiHrdGetAttendanceSummary, apiHrdGetEmployeeReport } from '../../lib/api';
import { exportSingleEmployeeReport, exportAllEmployeesSummary, EmployeeInfo, AttendanceSummaryCounts, AttendanceDetailItem } from '../../lib/excelExport';
import {
  Download,
  Search,
  Calendar,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle
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
  cuti: number | null;
  telat: number | null;
  hadir: number;
  periode: string;
  periodeSubtext?: string | null;
  hasData: boolean;
}

const DataAbsensiHRD: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [records, setRecords] = useState<EmployeeSummaryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

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

  // Ekspor Laporan Khusus 1 Karyawan (Single-Employee Export dari Backend)
  const handleExportIndividual = async (emp: EmployeeSummaryItem) => {
    if (!emp.hasData) return;
    setExportingId(emp.id);

    try {
      // Ambil detail laporan karyawan langsung dari endpoint backend
      const res = await apiHrdGetEmployeeReport(emp.id, {
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      const employeeInfo: EmployeeInfo = res.employee || {
        id: emp.id,
        name: emp.name,
        employeeId: emp.employeeId,
        department: emp.department,
        position: emp.position || 'Staff',
        email: emp.email,
        phone: emp.phone
      };

      const summaryCounts: AttendanceSummaryCounts = res.summary || {
        totalIzin: emp.izin ?? 0,
        totalCuti: emp.cuti ?? 0,
        totalTelat: emp.telat ?? 0,
        totalHadir: emp.hadir ?? 0,
        totalHariAktif: (emp.hadir ?? 0) + (emp.telat ?? 0) + (emp.izin ?? 0) + (emp.cuti ?? 0)
      };

      const details: AttendanceDetailItem[] = res.details || [];

      const periodeLabel = emp.periode && emp.periode !== '-' 
        ? emp.periode 
        : (startDate && endDate 
            ? (startDate === endDate ? `Tanggal ${startDate}` : `${startDate} s/d ${endDate}`)
            : '08/07/2026 - Sekarang');

      exportSingleEmployeeReport(employeeInfo, summaryCounts, details, periodeLabel);
      showToast(`Laporan absensi ${emp.name} berhasil diekspor ke Spreadsheet!`);
    } catch (err: any) {
      console.error("Gagal mengekspor laporan karyawan:", err);
      alert(`Gagal mengekspor laporan: ${err?.message || 'Server error'}`);
    } finally {
      setExportingId(null);
    }
  };

  // Ekspor Rekap Seluruh Karyawan (Tombol Export to Excel di Kanan Atas)
  const handleExportAll = () => {
    if (records.length === 0) return;
    setExportingAll(true);
    try {
      const periodeLabel = startDate && endDate 
        ? (startDate === endDate ? `Filter Tanggal ${startDate}` : `Rentang Tanggal ${startDate} s/d ${endDate}`)
        : '08/07/2026 - Sekarang';
      exportAllEmployeesSummary(
        records.map(r => ({
          id: r.id,
          name: r.name,
          employeeId: r.employeeId,
          department: r.department,
          izin: r.izin,
          cuti: r.cuti,
          telat: r.telat,
          hadir: r.hadir,
          periode: r.periode
        })),
        periodeLabel
      );
      showToast('Rekap absensi seluruh karyawan berhasil diekspor ke Excel!');
    } catch (err) {
      console.error("Gagal export semua:", err);
      alert("Gagal mengunduh rekap Excel.");
    } finally {
      setExportingAll(false);
    }
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

      {/* HEADER: Judul Halaman & Tombol Export to Excel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Data Absensi Karyawan</h2>
          <p className="text-gray-500 mt-0.5 text-sm">Seluruh Data Absensi Karyawan PT CTI</p>
        </div>
        <button
          onClick={handleExportAll}
          disabled={exportingAll || records.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm w-full sm:w-auto justify-center cursor-pointer"
        >
          {exportingAll ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          Export to Excel
        </button>
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
                <th className="px-6 py-3.5 font-semibold">EMPLOYEE</th>
                <th className="px-6 py-3.5 font-semibold">BAGIAN</th>
                <th className="px-6 py-3.5 font-semibold">IZIN</th>
                <th className="px-6 py-3.5 font-semibold">CUTI</th>
                <th className="px-6 py-3.5 font-semibold">TELAT</th>
                <th className="px-6 py-3.5 font-semibold">PERIODE</th>
                <th className="px-6 py-3.5 font-semibold text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium">
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

                  const isExportingThis = exportingId === rec.id;

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
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {rec.izin !== null && rec.izin !== undefined ? rec.izin : (rec.hasData ? 0 : '-')}
                      </td>

                      {/* Cuti */}
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {rec.cuti !== null && rec.cuti !== undefined ? rec.cuti : (rec.hasData ? 0 : '-')}
                      </td>

                      {/* Telat */}
                      <td className="px-6 py-4 text-gray-700 font-medium">
                        {rec.telat !== null && rec.telat !== undefined ? rec.telat : (rec.hasData ? 0 : '-')}
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

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        {rec.hasData ? (
                          <button
                            onClick={() => handleExportIndividual(rec)}
                            disabled={isExportingThis}
                            className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-3 py-1.5 rounded-md text-xs font-medium shadow-sm transition-colors inline-flex items-center cursor-pointer"
                          >
                            {isExportingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-blue-600" />
                                Mengunduh...
                              </>
                            ) : (
                              'Export Laporan'
                            )}
                          </button>
                        ) : (
                          <button
                            disabled
                            className="border border-gray-200 bg-gray-50 text-gray-400 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed inline-flex items-center"
                          >
                            <EyeOff className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                            N/A
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
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
    </div>
  );
};

export default DataAbsensiHRD;
