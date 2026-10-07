import { exportToExcel, exportToPDF } from '@/src/utils/exportUtils';
import React, { useEffect, useState, useCallback } from 'react';
import {
  apiHrdGetKpi, apiHrdUpdateKpi,
  apiHrdGetKpiTemplates, apiHrdCreateKpiTemplate, apiHrdUpdateKpiTemplate, apiHrdDeleteKpiTemplate,
  apiHrdGetKpiDynamic, apiHrdSaveKpiDynamic,
  apiGetDepartments
} from '@/src/lib/api';
import { Download, Search, Loader2, Edit3, X, Plus, Trash2, Save, ChevronRight, LayoutGrid, AlertCircle, CheckCircle2 } from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================
interface SkemaKolom {
  id_kolom: string;
  nama: string;
  tipe: 'number' | 'formula';
  rumus?: string;
}

interface KpiTemplate {
  id: string;
  nama_halaman: string;
  target_bagian: string;
  skema_kolom: SkemaKolom[] | any[];
}

interface DynamicEvaluation {
  id_karyawan: string;
  nama: string;
  department: string;
  position: string;
  absensi: {
    izin: number;
    alfa: number;
    terlambat: number;
  };
  nilai_custom: Record<string, any>;
}

// =============================================================================
// BULAN HELPER
// =============================================================================
const BULAN_LIST = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

function getCurrentPeriode(): string {
  const now = new Date();
  return `${BULAN_LIST[now.getMonth()]} ${now.getFullYear()}`;
}

function getYearOptions(): number[] {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear - 2; y <= currentYear + 2; y++) {
    years.push(y);
  }
  return years;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const KPIHRD: React.FC = () => {
  // ---- TAB "KPI Lama" state (tab index 0) ----
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const todayStr = new Date().toISOString().split('T')[0];
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(firstDayOfMonth);
  const [endDate, setEndDate] = useState(todayStr);

  const [modalData, setModalData] = useState<any | null>(null);

  // ---- Dynamic KPI state ----
  const [templates, setTemplates] = useState<KpiTemplate[]>([]);
  const [activeTabIndex, setActiveTabIndex] = useState(0); // 0 = KPI Lama, 1+ = dynamic templates
  const [loadingTemplates, setLoadingTemplates] = useState(true);

  // ---- Modal "Setup Halaman KPI" ----
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [formNamaHalaman, setFormNamaHalaman] = useState('');
  const [formTargetBagian, setFormTargetBagian] = useState('');
  const [formKolom, setFormKolom] = useState<any[]>([{ id_kolom: 'col_1', nama: '', tipe: 'number', rumus: '' }]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [creatingTemplate, setCreatingTemplate] = useState(false);

  // ---- Dynamic Evaluation state ----
  const [dynamicEvals, setDynamicEvals] = useState<DynamicEvaluation[]>([]);
  const [dynamicTemplate, setDynamicTemplate] = useState<KpiTemplate | null>(null);
  const [dynamicStartDate, setDynamicStartDate] = useState(firstDayOfMonth);
  const [dynamicEndDate, setDynamicEndDate] = useState(todayStr);
  const dynamicPeriode = `${dynamicStartDate} s/d ${dynamicEndDate}`;
  
  const [loadingDynamic, setLoadingDynamic] = useState(false);
  const [savingDynamic, setSavingDynamic] = useState(false);
  const [dynamicSearch, setDynamicSearch] = useState('');

  // ---- Toast ----
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // ---- Confirm Delete ----
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  // ===========================================================================
  // FETCH FUNCTIONS
  // ===========================================================================
  const fetchKpi = async () => {
    setLoading(true);
    try {
      const res = await apiHrdGetKpi(`${startDate} s/d ${endDate}`);
      setRecords(res.kpi || []);
    } catch (err) {
      console.error("Gagal memuat KPI:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = useCallback(async () => {
    setLoadingTemplates(true);
    try {
      const res = await apiHrdGetKpiTemplates();
      setTemplates(res.templates || []);
    } catch (err) {
      console.error("Gagal memuat templates:", err);
    } finally {
      setLoadingTemplates(false);
    }
  }, []);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await apiGetDepartments();
      setDepartments(res.departments || []);
    } catch (err) {
      console.error("Gagal memuat departments:", err);
    }
  }, []);

  const fetchDynamicEvals = useCallback(async (templateId: string, periode: string) => {
    setLoadingDynamic(true);
    try {
      const res = await apiHrdGetKpiDynamic(templateId, periode);
      const template = res.template;
      let evals = res.evaluations || [];
      
      if (template?.skema_kolom) {
        const formulaCols = template.skema_kolom.filter((s: any) => typeof s === 'object' && s.tipe === 'formula');
        if (formulaCols.length > 0) {
          evals = evals.map((ev: any) => {
            const newNilai = { ...ev.nilai_custom };
            formulaCols.forEach((fc: any) => {
                if (fc.rumus && fc.id_kolom) {
                    let tokens = fc.rumus.split(' + ');
                    let total = 0;
                    for (const t of tokens) {
                        total += parseFloat(newNilai[t]) || 0;
                    }
                    newNilai[fc.id_kolom] = total;
                }
            });
            return { ...ev, nilai_custom: newNilai };
          });
        }
      }
      
      setDynamicTemplate(template);
      setDynamicEvals(evals);
    } catch (err) {
      console.error("Gagal memuat evaluasi dinamis:", err);
      setDynamicEvals([]);
    } finally {
      setLoadingDynamic(false);
    }
  }, []);

  // ===========================================================================
  // EFFECTS
  // ===========================================================================
  useEffect(() => {
    fetchTemplates();
    fetchDepartments();
  }, [fetchTemplates, fetchDepartments]);

  useEffect(() => {
    if (activeTabIndex === 0) {
      fetchKpi();
    }
  }, [startDate, endDate, activeTabIndex]);

  useEffect(() => {
    if (activeTabIndex > 0 && templates.length > 0) {
      const template = templates[activeTabIndex - 1];
      if (template) {
        fetchDynamicEvals(template.id, dynamicPeriode);
      }
    }
  }, [activeTabIndex, templates, dynamicPeriode, fetchDynamicEvals]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ===========================================================================
  // HANDLERS - OLD KPI
  // ===========================================================================
  const handleOpenModal = (item: any) => {
    setModalData({
      ...item,
      // Populate edit fields: if manual override exists use it, else empty (auto)
      edit_skor_disiplin: item.skor_manual?.disiplin ? String(item.skor_disiplin) : '',
      edit_skor_terlambat: item.skor_manual?.terlambat ? String(item.skor_terlambat) : '',
      edit_skor_kinerja: item.skor_manual?.kinerja ? String(item.skor_kinerja) : '',
      edit_skor_sop: item.skor_manual?.sop ? String(item.skor_sop) : '',
    });
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
        month_year: `${startDate} s/d ${endDate}`,
        terlambat_laporan: parseInt(modalData.terlambat_laporan) || 0,
        laporan_tidak_sesuai: parseInt(modalData.laporan_tidak_sesuai) || 0,
        komplain: parseInt(modalData.komplain) || 0,
        target_persen: parseInt(modalData.target_persen) || 0,
        pelanggaran_sop: modalData.pelanggaran_sop,
        // Scoring override — empty string = auto, angka = manual
        skor_disiplin: modalData.edit_skor_disiplin,
        skor_terlambat: modalData.edit_skor_terlambat,
        skor_kinerja: modalData.edit_skor_kinerja,
        skor_sop: modalData.edit_skor_sop
      });
      setModalData(null);
      await fetchKpi();
    } catch (err) {
      console.error("Gagal menyimpan KPI:", err);
    } finally {
      setSavingId(null);
    }
  };

  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert("Tidak ada data KPI untuk diekspor.");
      return;
    }
    exportToExcel({
        title: `KPI Karyawan`,
        filename: `KPI_Karyawan_${startDate}_${endDate}`,
        columns: [
          { header: 'Nama', dataKey: 'name' },
          { header: 'Bagian', dataKey: 'department' },
          { header: 'Izin (x)', dataKey: 'izin' },
          { header: 'Sakit (x)', dataKey: 'sakit' },
          { header: 'Cuti (x)', dataKey: 'cuti' },
          { header: 'Alfa (x)', dataKey: 'alfa' },
          { header: 'Terlambat (x)', dataKey: 'terlambat' },
          { header: 'Skor Disiplin', dataKey: 'skor_disiplin' },
          { header: 'Skor Terlambat', dataKey: 'skor_terlambat' },
          { header: 'Skor Kinerja', dataKey: 'skor_kinerja' },
          { header: 'Skor SOP', dataKey: 'skor_sop' },
          { header: 'Total Skor', dataKey: 'total_skor' },
          { header: 'Kategori', dataKey: 'kategori' },
        ],
        data: filteredRecords
      });
  };

  const handleExportPDF = () => {
    if (filteredRecords.length === 0) {
      alert("Tidak ada data KPI untuk diekspor.");
      return;
    }
    exportToPDF({
        title: `KPI Karyawan`,
        filename: `KPI_Karyawan_${startDate}_${endDate}`,
        columns: [
          { header: 'Nama', dataKey: 'name' },
          { header: 'Bagian', dataKey: 'department' },
          { header: 'Total Skor', dataKey: 'total_skor' },
          { header: 'Kategori', dataKey: 'kategori' },
        ],
        data: filteredRecords,
        dateRange: `${startDate} s/d ${endDate}`
      });
  };

  // ===========================================================================
  // HANDLERS - DYNAMIC KPI
  // ===========================================================================
  const handleSaveTemplate = async () => {
    const kolomFiltered = formKolom.filter(k => {
        if (typeof k === 'string') return k.trim() !== '';
        return k.nama && k.nama.trim() !== '';
    });
    
    if (!formNamaHalaman.trim() || !formTargetBagian || kolomFiltered.length === 0) {
      setToast({ message: 'Mohon lengkapi semua field dan minimal 1 kolom metrik.', type: 'error' });
      return;
    }

    const processedKolom = kolomFiltered.map((k, i) => {
        if (typeof k === 'string') {
            return { id_kolom: `col_${i+1}`, nama: k, tipe: 'number', rumus: '' };
        }
        return { ...k, id_kolom: k.id_kolom || `col_${i+1}` };
    });

    setCreatingTemplate(true);
    try {
      if (editingTemplateId) {
        await apiHrdUpdateKpiTemplate(editingTemplateId, {
          nama_halaman: formNamaHalaman.trim(),
          target_bagian: formTargetBagian,
          skema_kolom: processedKolom
        });
        setToast({ message: 'Halaman KPI berhasil diperbarui!', type: 'success' });
      } else {
        await apiHrdCreateKpiTemplate({
          nama_halaman: formNamaHalaman.trim(),
          target_bagian: formTargetBagian,
          skema_kolom: processedKolom
        });
        setToast({ message: 'Halaman KPI berhasil dibuat!', type: 'success' });
      }
      setShowCreateModal(false);
      setFormNamaHalaman('');
      setFormTargetBagian('');
      setFormKolom([{ id_kolom: 'col_1', nama: '', tipe: 'number', rumus: '' }]);
      setEditingTemplateId(null);
      await fetchTemplates();
    } catch (err: any) {
      setToast({ message: err?.message || 'Gagal menyimpan template.', type: 'error' });
    } finally {
      setCreatingTemplate(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    setDeletingTemplate(true);
    try {
      await apiHrdDeleteKpiTemplate(id);
      setToast({ message: 'Halaman KPI berhasil dihapus.', type: 'success' });
      setDeleteConfirm(null);
      if (activeTabIndex > 0) {
        setActiveTabIndex(0);
      }
      await fetchTemplates();
    } catch (err: any) {
      setToast({ message: err?.message || 'Gagal menghapus template.', type: 'error' });
    } finally {
      setDeletingTemplate(false);
    }
  };

  const handleDynamicValueChange = (karyawanId: string, kolom: string, value: string) => {
    setDynamicEvals(prev =>
      prev.map(ev => {
        if (ev.id_karyawan === karyawanId) {
          const newNilai = { ...ev.nilai_custom, [kolom]: value };
          
          if (dynamicTemplate?.skema_kolom) {
              const formulaCols = dynamicTemplate.skema_kolom.filter((s: any) => typeof s === 'object' && s.tipe === 'formula');
              formulaCols.forEach((fc: any) => {
                  if (fc.rumus && fc.id_kolom) {
                      let tokens = fc.rumus.split(' + ');
                      let total = 0;
                      for (const t of tokens) {
                          total += parseFloat(newNilai[t]) || 0;
                      }
                      newNilai[fc.id_kolom] = total;
                  }
              });
          }

          return {
            ...ev,
            nilai_custom: newNilai
          };
        }
        return ev;
      })
    );
  };

  const handleSaveDynamic = async () => {
    if (!dynamicTemplate) return;
    setSavingDynamic(true);
    try {
      const payload = dynamicEvals.map(ev => ({
        id_karyawan: ev.id_karyawan,
        nilai_custom: ev.nilai_custom
      }));
      const res = await apiHrdSaveKpiDynamic(dynamicTemplate.id, {
        periode: dynamicPeriode,
        evaluations: payload
      });
      setToast({ message: res.message || 'Data KPI berhasil disimpan!', type: 'success' });
    } catch (err: any) {
      setToast({ message: err?.message || 'Gagal menyimpan data KPI.', type: 'error' });
    } finally {
      setSavingDynamic(false);
    }
  };

  const handleExportDynamicExcel = () => {
    if (!dynamicTemplate || filteredDynamicEvals.length === 0) {
      setToast({ message: 'Tidak ada data untuk diekspor.', type: 'error' });
      return;
    }

    const skema = dynamicTemplate.skema_kolom;
    
    const dynamicColumns = skema.map((k: any) => {
      const colKey = typeof k === 'string' ? k : k.id_kolom;
      const header = typeof k === 'string' ? k : k.nama;
      return { header, dataKey: colKey };
    });

    const columns = [
      { header: 'Nama Karyawan', dataKey: 'nama' },
      { header: 'Bagian', dataKey: 'department' },
      { header: 'Jabatan', dataKey: 'position' },
      { header: 'Izin', dataKey: 'izin' },
      { header: 'Alfa', dataKey: 'alfa' },
      { header: 'Terlambat', dataKey: 'terlambat' },
      ...dynamicColumns
    ];

    const data = filteredDynamicEvals.map(ev => {
      const rowData: any = {
          nama: ev.nama,
          department: ev.department,
          position: ev.position,
          izin: ev.absensi.izin,
          alfa: ev.absensi.alfa,
          terlambat: ev.absensi.terlambat
      };
      skema.forEach((k: any) => {
          const colKey = typeof k === 'string' ? k : k.id_kolom;
          rowData[colKey] = ev.nilai_custom[colKey] !== undefined && ev.nilai_custom[colKey] !== '' ? ev.nilai_custom[colKey] : 0;
      });
      return rowData;
    });

    exportToExcel({
      title: `${dynamicTemplate.nama_halaman} - ${dynamicPeriode}`,
      filename: `${dynamicTemplate.nama_halaman.replace(/\s+/g, '_')}_${dynamicPeriode.replace(/\s+/g, '_')}`,
      columns,
      data
    });
  };

  const handleExportDynamicPDF = () => {
    if (!dynamicTemplate || filteredDynamicEvals.length === 0) {
      setToast({ message: 'Tidak ada data untuk diekspor.', type: 'error' });
      return;
    }

    const skema = dynamicTemplate.skema_kolom;
    
    const dynamicColumns = skema.map((k: any) => {
      const colKey = typeof k === 'string' ? k : k.id_kolom;
      const header = typeof k === 'string' ? k : k.nama;
      return { header, dataKey: colKey };
    });

    const columns = [
      { header: 'Nama Karyawan', dataKey: 'nama' },
      { header: 'Bagian', dataKey: 'department' },
      ...dynamicColumns
    ];

    const data = filteredDynamicEvals.map(ev => {
      const rowData: any = {
          nama: ev.nama,
          department: ev.department,
      };
      skema.forEach((k: any) => {
          const colKey = typeof k === 'string' ? k : k.id_kolom;
          rowData[colKey] = ev.nilai_custom[colKey] !== undefined && ev.nilai_custom[colKey] !== '' ? ev.nilai_custom[colKey] : 0;
      });
      return rowData;
    });

    exportToPDF({
      title: `${dynamicTemplate.nama_halaman} - ${dynamicPeriode}`,
      filename: `${dynamicTemplate.nama_halaman.replace(/\s+/g, '_')}_${dynamicPeriode.replace(/\s+/g, '_')}`,
      columns,
      data,
      dateRange: dynamicPeriode
    });
  };

  // ===========================================================================
  // FILTERED DATA
  // ===========================================================================
  const filteredRecords = records.filter(r =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (r.department && r.department.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredDynamicEvals = dynamicEvals.filter(ev =>
    ev.nama.toLowerCase().includes(dynamicSearch.toLowerCase()) ||
    ev.department.toLowerCase().includes(dynamicSearch.toLowerCase())
  );

  // ===========================================================================
  // RENDER
  // ===========================================================================
  return (
    <div className="p-4 md:p-8 relative w-full">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl text-sm font-medium transition-all duration-300 animate-slide-in-right ${
          toast.type === 'success'
            ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
            : 'bg-gradient-to-r from-red-500 to-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : <AlertCircle className="w-5 h-5 flex-shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen KPI</h2>
          <p className="text-gray-500 mt-2 text-sm">Evaluasi KPI karyawan per divisi dengan kolom penilaian dinamis.</p>
        </div>
      </div>

      {/* ===== TABS ===== */}
      <div className="mb-6">
        <div className="flex items-end gap-0 overflow-x-auto pb-0 border-b border-gray-200">
          {/* Tab KPI Lama */}
          <button
            onClick={() => setActiveTabIndex(0)}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all duration-200 whitespace-nowrap border-x border-t ${
              activeTabIndex === 0
                ? 'bg-white text-blue-700 border-gray-200 shadow-sm -mb-px z-10'
                : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            KPI Umum
          </button>

          {/* Tab Dynamic Templates */}
          {templates.map((tmpl, idx) => (
            <button
              key={tmpl.id}
              onClick={() => setActiveTabIndex(idx + 1)}
              className={`group relative flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-t-xl transition-all duration-200 whitespace-nowrap border-x border-t ${
                activeTabIndex === idx + 1
                  ? 'bg-white text-blue-700 border-gray-200 shadow-sm -mb-px z-10'
                  : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100 hover:text-gray-700'
              }`}
            >
              {tmpl.nama_halaman}
              {/* Delete button on hover */}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirm(tmpl.id);
                }}
                className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 hover:text-red-600"
              >
                <X className="w-3.5 h-3.5" />
              </span>
            </button>
          ))}

          {/* Tab "+ Buat Halaman" */}
          <button
            onClick={() => {
              setEditingTemplateId(null);
              setShowCreateModal(true);
              setFormNamaHalaman('');
              setFormTargetBagian('');
              setFormKolom([{ id_kolom: 'col_1', nama: '', tipe: 'number', rumus: '' }]);
            }}
            className="flex items-center gap-1.5 px-4 py-3 text-sm font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-t-xl transition-all duration-200 whitespace-nowrap border-x border-t border-transparent"
          >
            <Plus className="w-4 h-4" />
            Buat Halaman
          </button>
        </div>
      </div>

      {/* ===== TAB CONTENT: KPI LAMA ===== */}
      {activeTabIndex === 0 && (
        <>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 bg-white"
                />
                <span className="text-gray-500 text-sm">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 bg-white"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto mt-3 sm:mt-0">
                <button
                  onClick={handleExportExcel}
                  className="bg-green-50 border border-green-600 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center shadow-sm w-full sm:w-auto justify-center"
                >
                  <Download className="w-4 h-4 mr-1.5" /> Excel
                </button>
                <button
                  onClick={handleExportPDF}
                  className="bg-red-50 border border-red-600 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center shadow-sm w-full sm:w-auto justify-center"
                >
                  <Download className="w-4 h-4 mr-1.5" /> PDF
                </button>
              </div>
            </div>
          </div>

          {/* Table KPI Lama */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
              <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider w-full sm:w-auto text-center sm:text-left">Tabel Evaluasi KPI</h3>
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Cari karyawan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-full sm:w-64 bg-white"
                />
              </div>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-sm border-collapse whitespace-nowrap min-w-[1200px]">
                <thead>
                  <tr className="bg-[#d9ead3] text-gray-800 border-b border-gray-300 text-center text-xs font-bold divide-x divide-gray-300">
                    <th className="px-3 py-3" rowSpan={2}>No</th>
                    <th className="px-4 py-3 text-left" rowSpan={2}>Nama</th>
                    <th className="px-4 py-3" rowSpan={2}>Bagian</th>
                    <th className="px-2 py-3" colSpan={5}>Data Kehadiran (Otomatis)</th>
                    <th className="px-2 py-3" colSpan={5}>Data Evaluasi (Manual)</th>
                    <th className="px-2 py-3" colSpan={5}>Skoring</th>
                    <th className="px-4 py-3" rowSpan={2}>Kategori</th>
                    <th className="px-4 py-3" rowSpan={2}>Aksi</th>
                  </tr>
                  <tr className="bg-[#d9ead3] text-gray-800 border-b border-gray-300 text-center text-xs divide-x divide-gray-300">
                    {/* Kehadiran */}
                    <th className="px-2 py-2 font-medium">Izin</th>
                    <th className="px-2 py-2 font-medium">Sakit</th>
                    <th className="px-2 py-2 font-medium">Cuti</th>
                    <th className="px-2 py-2 font-medium">Alfa</th>
                    <th className="px-2 py-2 font-medium">Telat</th>
                    {/* Evaluasi */}
                    <th className="px-2 py-2 font-medium">Terlambat<br />Laporan</th>
                    <th className="px-2 py-2 font-medium">Laporan<br />Tidak Sesuai</th>
                    <th className="px-2 py-2 font-medium">Komplain</th>
                    <th className="px-2 py-2 font-medium">Target (%)</th>
                    <th className="px-2 py-2 font-medium">Pelanggaran<br />SOP (Y/T)</th>
                    {/* Skor */}
                    <th className="px-2 py-2 font-medium">Skor<br />Disiplin</th>
                    <th className="px-2 py-2 font-medium">Skor<br />Terlambat</th>
                    <th className="px-2 py-2 font-medium">Skor<br />Kinerja</th>
                    <th className="px-2 py-2 font-medium">Skor<br />SOP</th>
                    <th className="px-3 py-2 font-bold">Total<br />Skor</th>
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
                        <td className="px-2 py-2 bg-gray-50">{item.sakit || ''}</td>
                        <td className="px-2 py-2 bg-gray-50">{item.cuti || ''}</td>
                        <td className="px-2 py-2 bg-gray-50">{item.alfa || ''}</td>
                        <td className="px-2 py-2 bg-gray-50">{item.terlambat || ''}</td>
                        {/* Manual Inputs */}
                        <td className="px-2 py-2">{item.terlambat_laporan || 0}</td>
                        <td className="px-2 py-2">{item.laporan_tidak_sesuai || 0}</td>
                        <td className="px-2 py-2">{item.komplain || 0}</td>
                        <td className="px-2 py-2">{item.target_persen || 0}%</td>
                        <td className="px-2 py-2">{item.pelanggaran_sop || 'T'}</td>
                        {/* Skor — titik biru kecil jika manual override */}
                        <td className="px-2 py-2 bg-blue-50/30">
                          <span className="relative">
                            {item.skor_disiplin}
                            {item.skor_manual?.disiplin && <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-blue-500" title="Manual override"></span>}
                          </span>
                        </td>
                        <td className="px-2 py-2 bg-blue-50/30">
                          <span className="relative">
                            {item.skor_terlambat}
                            {item.skor_manual?.terlambat && <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-blue-500" title="Manual override"></span>}
                          </span>
                        </td>
                        <td className="px-2 py-2 bg-blue-50/30">
                          <span className="relative">
                            {item.skor_kinerja}
                            {item.skor_manual?.kinerja && <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-blue-500" title="Manual override"></span>}
                          </span>
                        </td>
                        <td className="px-2 py-2 bg-blue-50/30">
                          <span className="relative">
                            {item.skor_sop}
                            {item.skor_manual?.sop && <span className="absolute -top-1 -right-2 w-1.5 h-1.5 rounded-full bg-blue-500" title="Manual override"></span>}
                          </span>
                        </td>
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
        </>
      )}

      {/* ===== TAB CONTENT: DYNAMIC KPI ===== */}
      {activeTabIndex > 0 && templates[activeTabIndex - 1] && (
        <DynamicKpiTab
          template={dynamicTemplate || templates[activeTabIndex - 1]}
          evaluations={filteredDynamicEvals}
          loading={loadingDynamic}
          saving={savingDynamic}
          startDate={dynamicStartDate}
          endDate={dynamicEndDate}
          searchQuery={dynamicSearch}
          onSearchChange={setDynamicSearch}
          onStartDateChange={(d) => setDynamicStartDate(d)}
          onEndDateChange={(d) => setDynamicEndDate(d)}
          onValueChange={handleDynamicValueChange}
          onSave={handleSaveDynamic}
          onExportExcel={handleExportDynamicExcel}
          onExportPDF={handleExportDynamicPDF}
          onEditTemplate={() => {
            const tmpl = templates[activeTabIndex - 1];
            setEditingTemplateId(tmpl.id);
            setFormNamaHalaman(tmpl.nama_halaman);
            setFormTargetBagian(tmpl.target_bagian);
            setFormKolom(tmpl.skema_kolom.length > 0 ? [...tmpl.skema_kolom] : ['']);
            setShowCreateModal(true);
          }}
        />
      )}

      {/* ===== MODAL: SETUP HALAMAN KPI ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto pt-20 pb-20">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col my-auto relative animate-modal-in">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <div>
                <h3 className="font-bold text-lg text-gray-800">{editingTemplateId ? 'Edit Halaman KPI' : 'Setup Halaman KPI'}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{editingTemplateId ? 'Perbarui template evaluasi' : 'Buat template evaluasi baru untuk divisi tertentu'}</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              {/* Nama Halaman */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Halaman</label>
                <input
                  type="text"
                  placeholder="Contoh: KPI Keuangan"
                  value={formNamaHalaman}
                  onChange={(e) => setFormNamaHalaman(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none text-sm"
                />
              </div>

              {/* Target Divisi */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Target Divisi</label>
                <select
                  value={formTargetBagian}
                  onChange={(e) => setFormTargetBagian(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">-- Pilih Divisi --</option>
                  <option value="Seluruh Karyawan">Seluruh Karyawan</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Kolom Metrik Dinamis */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Kolom Metrik Penilaian</label>
                <p className="text-xs text-gray-400 mb-2">Tentukan nama-nama kolom metrik evaluasi yang ingin digunakan.</p>
                <div className="space-y-3">
                  {formKolom.map((kolom, idx) => (
                    <div key={idx} className="flex flex-col gap-2 p-3 border border-gray-200 rounded-lg bg-gray-50/50">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <input
                          type="text"
                          placeholder={`Nama Kolom ${idx + 1}, misal: Efisiensi`}
                          value={typeof kolom === 'string' ? kolom : (kolom.nama || '')}
                          onChange={(e) => {
                            const newKolom = [...formKolom];
                            const val = newKolom[idx];
                            if (typeof val === 'string') {
                                newKolom[idx] = { id_kolom: `col_${idx+1}`, nama: e.target.value, tipe: 'number', rumus: '' };
                            } else {
                                newKolom[idx] = { ...val, nama: e.target.value };
                            }
                            setFormKolom(newKolom);
                          }}
                          className="flex-1 border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none text-sm bg-white"
                        />
                        <select
                          value={typeof kolom === 'string' ? 'number' : (kolom.tipe || 'number')}
                          onChange={(e) => {
                            const newKolom = [...formKolom];
                            const val = newKolom[idx];
                            if (typeof val === 'string') {
                                newKolom[idx] = { id_kolom: `col_${idx+1}`, nama: val, tipe: e.target.value, rumus: '' };
                            } else {
                                newKolom[idx] = { ...val, tipe: e.target.value };
                                if (e.target.value !== 'formula') {
                                    newKolom[idx].rumus = '';
                                }
                            }
                            setFormKolom(newKolom);
                          }}
                          className="border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none text-sm bg-white min-w-[140px]"
                        >
                          <option value="number">Input Angka</option>
                          <option value="formula">Rumus (Total)</option>
                        </select>
                        {formKolom.length > 1 && (
                          <button
                            onClick={() => setFormKolom(formKolom.filter((_, i) => i !== idx))}
                            className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Kolom"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Sub-UI for Formula */}
                      {typeof kolom !== 'string' && kolom.tipe === 'formula' && (
                        <div className="pl-8 pt-1">
                          <p className="text-xs text-gray-500 font-medium mb-2">Pilih kolom untuk dijumlahkan secara otomatis:</p>
                          <div className="flex flex-wrap gap-2">
                              {formKolom.map((otherKolom, otherIdx) => {
                                  if (otherIdx === idx) return null; // Can't sum itself
                                  const oId = typeof otherKolom === 'string' ? `col_${otherIdx+1}` : (otherKolom.id_kolom || `col_${otherIdx+1}`);
                                  const oName = typeof otherKolom === 'string' ? otherKolom : otherKolom.nama;
                                  if (!oName) return null;
                                  
                                  const currentRumus = kolom.rumus || '';
                                  const isChecked = currentRumus.includes(oId);
                                  
                                  return (
                                      <label key={otherIdx} className="flex items-center gap-1.5 text-xs bg-white border border-gray-200 px-2 py-1 rounded cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-colors">
                                          <input 
                                              type="checkbox" 
                                              checked={isChecked}
                                              onChange={(e) => {
                                                  const newKolom = [...formKolom];
                                                  let currentTokens = (newKolom[idx].rumus || '').split(' + ').filter(Boolean);
                                                  if (e.target.checked) {
                                                      if (!currentTokens.includes(oId)) currentTokens.push(oId);
                                                  } else {
                                                      currentTokens = currentTokens.filter((t: string) => t !== oId);
                                                  }
                                                  newKolom[idx].rumus = currentTokens.join(' + ');
                                                  setFormKolom(newKolom);
                                              }}
                                              className="w-3 h-3 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                          />
                                          <span className="text-gray-700 font-medium">{oName}</span>
                                      </label>
                                  );
                              })}
                          </div>
                          {(!kolom.rumus || kolom.rumus.trim() === '') && (
                              <p className="text-[10px] text-amber-600 mt-1.5">*Belum ada kolom yang dipilih.</p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setFormKolom([...formKolom, { id_kolom: `col_${formKolom.length + 1}`, nama: '', tipe: 'number', rumus: '' }])}
                  className="mt-3 flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Tambah Kolom
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl flex justify-end space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium text-sm hover:bg-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={creatingTemplate}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-medium text-sm hover:from-blue-700 hover:to-indigo-700 transition-all flex items-center shadow-sm hover:shadow-md disabled:opacity-60"
              >
                {creatingTemplate ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menyimpan...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" /> {editingTemplateId ? 'Simpan Perubahan' : 'Buat Halaman'}</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: CONFIRM DELETE ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col relative animate-modal-in">
            <div className="p-6 text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">Hapus Halaman KPI?</h3>
              <p className="text-sm text-gray-500">Semua data evaluasi yang terkait halaman ini juga akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>
            </div>
            <div className="p-4 border-t border-gray-200 bg-gray-50/50 rounded-b-2xl flex justify-center space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 border border-gray-300 text-gray-600 rounded-lg font-medium text-sm hover:bg-white transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDeleteTemplate(deleteConfirm)}
                disabled={deletingTemplate}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-lg font-medium text-sm hover:from-red-700 hover:to-rose-700 transition-all flex items-center shadow-sm disabled:opacity-60"
              >
                {deletingTemplate ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Menghapus...</>
                ) : (
                  <><Trash2 className="w-4 h-4 mr-2" /> Hapus</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT KPI LAMA ===== */}
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

              {/* Divider: Skoring Override */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-px flex-1 bg-gray-200"></div>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Override Skoring</span>
                  <div className="h-px flex-1 bg-gray-200"></div>
                </div>
                <p className="text-xs text-gray-400">Kosongkan untuk menggunakan skor otomatis. Isi angka untuk override manual.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Skor Disiplin
                    <span className="text-gray-400 font-normal ml-1">(auto: {modalData.auto_skor_disiplin ?? '—'})</span>
                  </label>
                  <input
                    type="number" min="0"
                    value={modalData.edit_skor_disiplin}
                    onChange={(e) => handleModalChange('edit_skor_disiplin', e.target.value)}
                    placeholder="Auto"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Skor Terlambat
                    <span className="text-gray-400 font-normal ml-1">(auto: {modalData.auto_skor_terlambat ?? '—'})</span>
                  </label>
                  <input
                    type="number" min="0"
                    value={modalData.edit_skor_terlambat}
                    onChange={(e) => handleModalChange('edit_skor_terlambat', e.target.value)}
                    placeholder="Auto"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Skor Kinerja
                    <span className="text-gray-400 font-normal ml-1">(auto: {modalData.auto_skor_kinerja ?? '—'})</span>
                  </label>
                  <input
                    type="number" min="0"
                    value={modalData.edit_skor_kinerja}
                    onChange={(e) => handleModalChange('edit_skor_kinerja', e.target.value)}
                    placeholder="Auto"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder:text-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Skor SOP
                    <span className="text-gray-400 font-normal ml-1">(auto: {modalData.auto_skor_sop ?? '—'})</span>
                  </label>
                  <input
                    type="number" min="0"
                    value={modalData.edit_skor_sop}
                    onChange={(e) => handleModalChange('edit_skor_sop', e.target.value)}
                    placeholder="Auto"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-1 focus:ring-blue-500 outline-none text-sm placeholder:text-gray-300"
                  />
                </div>
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

      {/* CSS Animations */}
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in {
          animation: modalIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// =============================================================================
// SUB-COMPONENT: DYNAMIC KPI TAB
// =============================================================================
interface DynamicKpiTabProps {
  template: KpiTemplate;
  evaluations: DynamicEvaluation[];
  loading: boolean;
  saving: boolean;
  startDate: string;
  endDate: string;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onStartDateChange: (d: string) => void;
  onEndDateChange: (d: string) => void;
  onValueChange: (karyawanId: string, kolom: string, value: string) => void;
  onSave: () => void;
  onExportExcel: () => void;
  onExportPDF: () => void;
  onEditTemplate: () => void;
}

const DynamicKpiTab: React.FC<DynamicKpiTabProps> = ({
  template, evaluations, loading, saving,
  startDate, endDate, searchQuery,
  onSearchChange, onStartDateChange, onEndDateChange,
  onValueChange, onSave, onExportExcel, onExportPDF, onEditTemplate
}) => {
  const skema = template.skema_kolom || [];

  return (
    <div>
      {/* Info Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="font-medium text-gray-700">Target Divisi:</span>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
              {template.target_bagian}
            </span>
          </div>
          <ChevronRight className="w-3 h-3 text-gray-300" />
          <div className="flex items-center gap-1 text-xs text-gray-500 flex-wrap">
            <span className="font-medium text-gray-700">Metrik:</span>
            {skema.map((k: any, i: number) => (
              <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                {typeof k === 'string' ? k : k.nama}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Periode Selector */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 bg-white"
            />
            <span className="text-gray-500 text-sm">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 bg-white"
            />
          </div>
          <button
            onClick={onExportExcel}
            className="bg-green-50 border border-green-600 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" /> Excel
          </button>
          <button
            onClick={onExportPDF}
            className="bg-red-50 border border-red-600 hover:bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center shadow-sm"
          >
            <Download className="w-4 h-4 mr-1.5" /> PDF
          </button>
          <button
            onClick={onEditTemplate}
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center shadow-sm"
          >
            <Edit3 className="w-4 h-4 mr-1.5" /> Edit Template
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center shadow-sm hover:shadow-md disabled:opacity-60"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Menyimpan...</>
            ) : (
              <><Save className="w-4 h-4 mr-1.5" /> Simpan Data KPI</>
            )}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">
            {template.nama_halaman} — <span className="text-blue-600">{startDate} s/d {endDate}</span>
          </h3>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari karyawan..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 w-full sm:w-64 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-sm border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#d9ead3] text-gray-800 border-b border-gray-300 text-center text-xs font-bold divide-x divide-gray-300">
                <th className="px-3 py-3" rowSpan={2}>No</th>
                <th className="px-4 py-3 text-left" rowSpan={2}>Karyawan</th>
                <th className="px-2 py-3" colSpan={3}>Data Absensi (Otomatis)</th>
                <th className="px-2 py-3" colSpan={skema.length}>Penilaian Kustom (Manual)</th>
              </tr>
              <tr className="bg-[#d9ead3] text-gray-800 border-b border-gray-300 text-center text-xs divide-x divide-gray-300">
                {/* Absensi */}
                <th className="px-3 py-2 font-medium">Izin</th>
                <th className="px-3 py-2 font-medium">Alfa</th>
                <th className="px-3 py-2 font-medium">Terlambat</th>
                {/* Dynamic Columns */}
                {skema.map((kolom: any, i) => (
                  <th key={i} className="px-3 py-2 font-medium">
                    {typeof kolom === 'string' ? kolom : kolom.nama}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={4 + skema.length} className="px-6 py-12 text-center text-gray-500 font-medium">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat data evaluasi...
                  </td>
                </tr>
              ) : evaluations.length > 0 ? (
                evaluations.map((ev, idx) => (
                  <tr key={ev.id_karyawan} className="hover:bg-gray-50/50 transition-colors text-center divide-x divide-gray-200">
                    <td className="px-3 py-2.5 text-gray-500 font-medium">{idx + 1}</td>
                    <td className="px-4 py-2.5 text-left">
                      <div className="font-semibold text-gray-800">{ev.nama}</div>
                      <div className="text-xs text-gray-400">{ev.position}</div>
                    </td>
                    {/* Absensi (read-only, explicitly showing 0) */}
                    <td className="px-3 py-2.5 bg-gray-50 font-medium">
                      <span className={ev.absensi.izin > 0 ? 'text-amber-600' : 'text-gray-400'}>{ev.absensi.izin}</span>
                    </td>
                    <td className="px-3 py-2.5 bg-gray-50 font-medium">
                      <span className={ev.absensi.alfa > 0 ? 'text-red-600' : 'text-gray-400'}>{ev.absensi.alfa}</span>
                    </td>
                    <td className="px-3 py-2.5 bg-gray-50 font-medium">
                      <span className={ev.absensi.terlambat > 0 ? 'text-orange-600' : 'text-gray-400'}>{ev.absensi.terlambat}</span>
                    </td>
                    {/* Dynamic Custom Columns */}
                    {skema.map((kolom: any, i) => {
                      const colKey = typeof kolom === 'string' ? kolom : kolom.id_kolom;
                      const colType = typeof kolom === 'string' ? 'number' : kolom.tipe;
                      return (
                        <td key={i} className="px-2 py-1.5">
                          <input
                            type="text"
                            value={ev.nilai_custom[colKey] !== undefined ? ev.nilai_custom[colKey] : ''}
                            onChange={(e) => onValueChange(ev.id_karyawan, colKey, e.target.value)}
                            disabled={colType === 'formula'}
                            readOnly={colType === 'formula'}
                            className={`w-full min-w-[70px] border border-gray-200 rounded-md px-2 py-1.5 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors ${colType === 'formula' ? 'bg-gray-100 text-gray-700 font-bold' : 'bg-white hover:border-gray-300'}`}
                            placeholder="—"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4 + skema.length} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <AlertCircle className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium mb-1">Tidak ada karyawan ditemukan</p>
                      <p className="text-gray-400 text-xs">Pastikan divisi "{template.target_bagian}" memiliki karyawan yang terdaftar.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        {!loading && evaluations.length > 0 && (
          <div className="p-3 border-t border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <span className="text-xs text-gray-500">
              Menampilkan <span className="font-semibold text-gray-700">{evaluations.length}</span> karyawan dari divisi{' '}
              <span className="font-semibold text-indigo-600">{template.target_bagian}</span>
            </span>
            <span className="text-xs text-gray-400">
              {skema.length} kolom metrik
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default KPIHRD;
