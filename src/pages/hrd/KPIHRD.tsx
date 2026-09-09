import React, { useEffect, useState } from 'react';
import { apiHrdGetKpi, apiHrdUpdateKpi } from '@/src/lib/api';
import { Download, Search, Loader2, Edit3, X } from 'lucide-react';

const KPIHRD: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Format YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().substring(0,7));

  // State untuk modal
  const [modalData, setModalData] = useState<any | null>(null);

  const fetchKpi = async () => {
    setLoading(true);
    try {
      const res = await apiHrdGetKpi(selectedMonth);
      setRecords(res.kpi || []);
    } catch (err) {
      console.error("Gagal memuat KPI:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKpi();
  }, [selectedMonth]);

  const handleOpenModal = (item: any) => {
    setModalData({ ...item });
  };

  const handleModalChange = (field: string, value: any) => {
    setModalData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSaveModal = async () => {
    if (!modalData) return;
    setSavingId(modalData.user_id);
    try {
      await apiHrdUpdateKpi({
        user_id: modalData.user_id,
        month_year: selectedMonth,
        terlambat_laporan: parseInt(modalData.terlambat_laporan) || 0,
        laporan_tidak_sesuai: parseInt(modalData.laporan_tidak_sesuai) || 0,
        komplain: parseInt(modalData.komplain) || 0,
        target_persen: parseInt(modalData.target_persen) || 0,
        pelanggaran_sop: modalData.pelanggaran_sop
      });
      setModalData(null);
      await fetchKpi();
    } catch (err) {
      console.error("Gagal menyimpan KPI:", err);
    } finally {
      setSavingId(null);
    }
  };

  const handleExport = () => {
    if (filteredRecords.length === 0) {
      alert("Tidak ada data KPI untuk diekspor.");
      return;
    }
    const headers = [
      "No", "Nama", "Bagian", 
      "Izin (x)", "Izin Mendadak", "Alfa (x)", "Terlambat (x)",
      "Terlambat Laporan", "Laporan Tidak Sesuai", "Komplain", "Target (%)", "Pelanggaran SOP",
      "Skor Disiplin", "Skor Terlambat", "Skor Kinerja", "Skor SOP", "Total Skor", "Kategori"
    ];
    const rows = filteredRecords.map((item, idx) => [
      idx + 1,
      `"${(item.name || '').replace(/"/g, '""')}"`,
      `"${(item.department || '-').replace(/"/g, '""')}"`,
      item.izin || 0,
      item.izin_mendadak || 0,
      item.alfa || 0,
      item.terlambat || 0,
      item.terlambat_laporan || 0,
      item.laporan_tidak_sesuai || 0,
      item.komplain || 0,
      `${item.target_persen || 0}%`,
      item.pelanggaran_sop || 'T',
      item.skor_disiplin ?? 0,
      item.skor_terlambat ?? 0,
      item.skor_kinerja ?? 0,
      item.skor_sop ?? 0,
      item.total_skor ?? 0,
      `"${(item.kategori || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KPI_Karyawan_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.department && r.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-4 md:p-8 relative w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen KPI</h2>
          <p className="text-gray-500 mt-2 text-sm">Hitung dan kelola Key Performance Indicators karyawan bulanan.</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
          <input 
            type="month" 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
          />
          <button 
            onClick={handleExport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm w-full sm:w-auto justify-center"
          >
            <Download className="w-4 h-4 mr-2" /> Export to Excel
          </button>
        </div>
      </div>

      {/* Tabel KPI Utama */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider w-full sm:w-auto text-center sm:text-left">Tabel Evaluasi KPI</h3>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari karyawan..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-full sm:w-64 bg-white" 
            />
          </div>
        </div>
        
        {/* Table Data */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap min-w-[1200px]">
            <thead>
              <tr className="bg-[#d9ead3] text-gray-800 border-b border-gray-300 text-center text-xs font-bold divide-x divide-gray-300">
                <th className="px-3 py-3" rowSpan={2}>No</th>
                <th className="px-4 py-3 text-left" rowSpan={2}>Nama</th>
                <th className="px-4 py-3" rowSpan={2}>Bagian</th>
                <th className="px-2 py-3" colSpan={4}>Data Kehadiran (Otomatis)</th>
                <th className="px-2 py-3" colSpan={5}>Data Evaluasi (Manual)</th>
                <th className="px-2 py-3" colSpan={5}>Skoring</th>
                <th className="px-4 py-3" rowSpan={2}>Kategori</th>
                <th className="px-4 py-3" rowSpan={2}>Aksi</th>
              </tr>
              <tr className="bg-[#d9ead3] text-gray-800 border-b border-gray-300 text-center text-xs divide-x divide-gray-300">
                {/* Kehadiran */}
                <th className="px-2 py-2 font-medium">Izin (x)</th>
                <th className="px-2 py-2 font-medium">Izin<br/>mendadak</th>
                <th className="px-2 py-2 font-medium">Alfa (x)</th>
                <th className="px-2 py-2 font-medium">Terlambat (x)</th>
                {/* Evaluasi */}
                <th className="px-2 py-2 font-medium">Terlambat<br/>Laporan</th>
                <th className="px-2 py-2 font-medium">Laporan<br/>Tidak Sesuai</th>
                <th className="px-2 py-2 font-medium">Komplain</th>
                <th className="px-2 py-2 font-medium">Target (%)</th>
                <th className="px-2 py-2 font-medium">Pelanggaran<br/>SOP (Y/T)</th>
                {/* Skor */}
                <th className="px-2 py-2 font-medium">Skor<br/>Disiplin</th>
                <th className="px-2 py-2 font-medium">Skor<br/>Terlambat</th>
                <th className="px-2 py-2 font-medium">Skor<br/>Kinerja</th>
                <th className="px-2 py-2 font-medium">Skor<br/>SOP</th>
                <th className="px-3 py-2 font-bold">Total<br/>Skor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={19} className="px-6 py-12 text-center text-gray-500 font-medium">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data KPI...
                  </td>
                </tr>
              ) : filteredRecords.length > 0 ? (
                filteredRecords.map((item, idx) => (
                  <tr key={item.user_id} className={`hover:bg-gray-50/50 transition-colors text-center divide-x divide-gray-200 ${savingId === item.user_id ? 'bg-blue-50/30' : ''}`}>
                    <td className="px-3 py-2">{idx + 1}</td>
                    <td className="px-4 py-2 text-left font-semibold text-gray-800">{item.name}</td>
                    <td className="px-4 py-2">{item.department || '-'}</td>
                    
                    {/* Kehadiran */}
                    <td className="px-2 py-2 bg-gray-50">{item.izin || ''}</td>
                    <td className="px-2 py-2 bg-gray-50">{item.izin_mendadak || ''}</td>
                    <td className="px-2 py-2 bg-gray-50">{item.alfa || ''}</td>
                    <td className="px-2 py-2 bg-gray-50">{item.terlambat || ''}</td>
                    
                    {/* Manual Inputs - Tampilan saja */}
                    <td className="px-2 py-2">{item.terlambat_laporan || 0}</td>
                    <td className="px-2 py-2">{item.laporan_tidak_sesuai || 0}</td>
                    <td className="px-2 py-2">{item.komplain || 0}</td>
                    <td className="px-2 py-2">{item.target_persen || 0}%</td>
                    <td className="px-2 py-2">{item.pelanggaran_sop || 'T'}</td>

                    {/* Skor */}
                    <td className="px-2 py-2 bg-blue-50/30">{item.skor_disiplin}</td>
                    <td className="px-2 py-2 bg-blue-50/30">{item.skor_terlambat}</td>
                    <td className="px-2 py-2 bg-blue-50/30">{item.skor_kinerja}</td>
                    <td className="px-2 py-2 bg-blue-50/30">{item.skor_sop}</td>
                    <td className="px-3 py-2 bg-blue-100/50 font-bold text-base">{item.total_skor}</td>
                    
                    {/* Kategori */}
                    <td className="px-4 py-2 font-bold">
                      <span className={`px-2 py-1 rounded text-xs ${
                        item.kategori === 'BERKUALITAS' ? 'text-green-700 bg-green-100' :
                        item.kategori === 'CUKUP' ? 'text-yellow-700 bg-yellow-100' :
                        'text-red-700 bg-red-100'
                      }`}>
                        {item.kategori}
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => handleOpenModal(item)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-md transition-colors text-xs font-semibold mx-auto"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Evaluasi</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={19} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada data karyawan ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form Evaluasi KPI */}
      {modalData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-20">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col my-auto relative">
            <div className="flex justify-between items-center p-4 border-b border-gray-200">
              <h3 className="font-bold text-lg text-gray-800">Evaluasi Manual KPI</h3>
              <button onClick={() => setModalData(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="mb-2">
                <p className="text-sm text-gray-500">Nama Karyawan</p>
                <p className="font-bold text-gray-800">{modalData.name}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Terlambat Laporan (x)</label>
                <input 
                  type="number" min="0" 
                  value={modalData.terlambat_laporan} 
                  onChange={(e) => handleModalChange('terlambat_laporan', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Laporan Tidak Sesuai (x)</label>
                <input 
                  type="number" min="0" 
                  value={modalData.laporan_tidak_sesuai} 
                  onChange={(e) => handleModalChange('laporan_tidak_sesuai', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Komplain (x)</label>
                <input 
                  type="number" min="0" 
                  value={modalData.komplain} 
                  onChange={(e) => handleModalChange('komplain', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Target (%)</label>
                <input 
                  type="number" min="0" max="100" 
                  value={modalData.target_persen} 
                  onChange={(e) => handleModalChange('target_persen', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Pelanggaran SOP</label>
                <select 
                  value={modalData.pelanggaran_sop}
                  onChange={(e) => handleModalChange('pelanggaran_sop', e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-white"
                >
                  <option value="T">Tidak (T)</option>
                  <option value="Y">Ya (Y)</option>
                </select>
              </div>
            </div>
            
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setModalData(null)}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-md font-medium text-sm hover:bg-white transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleSaveModal}
                disabled={savingId === modalData.user_id}
                className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm hover:bg-blue-700 transition-colors flex items-center"
              >
                {savingId === modalData.user_id ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KPIHRD;