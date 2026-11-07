import React, { useEffect, useState, useMemo } from 'react';
import { apiHrdGetEmployees, apiHrdUpdateEmployee, apiHrdDeleteEmployee, apiGetDepartments, apiGetPositions, apiHrdGetHospitals, apiHrdGetOffices, apiHrdCreateEmployee } from '@/src/lib/api';
import { MasterDepartment, MasterPosition, HospitalLocation } from '@/src/types';
import { 
  Download, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  X, 
  Edit, 
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react';
import { exportToExcel, exportToPDF } from '@/src/utils/exportUtils';
import { ClockTimePickerModal } from '@/src/components/ClockTimePicker';

// Daftar 15 Bagian resmi perusahaan CTI

// Helper format tanggal aman agar tidak throw error
const formatDateSafe = (dateVal: any): string => {
  if (!dateVal) return '-';
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: '2-digit', day: '2-digit' });
  } catch {
    return '-';
  }
};

const BAGIAN_LIST = [
  'Teknisi',
  'Helper',
  'Freelance',
  'Manager Marketing',
  'Marketing',
  'Admin Marketing',
  'Manager Teknik',
  'Admin Penjualan',
  'Admin Pembelian',
  'Admin Teknik',
  'Admin Piutang',
  'Manager HRD',
  'Admin Keuangan',
  'Admin Gudang'
];

const KaryawanHRD: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<HospitalLocation[]>([]);
  const [masterDepartments, setMasterDepartments] = useState<MasterDepartment[]>([]);
  const [masterPositions, setMasterPositions] = useState<MasterPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDept, setSelectedDept] = useState<string>('Semua Bagian');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  
  // State form ditambahkan field baru sesuai format Excel
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    nik: '',
    email: '',
    phone: '',
    password: '',
    schedule: '',
    address: '',
    hospital_id: '',
    id_department: '',
    id_position: '',
    role: 'EMPLOYEE',
    // FIELD BARU SESUAI EXCEL
    tempat_tanggal_lahir: '',
    status_pernikahan: '',
    status_karyawan: '',
    wilayah_kerja: '',
    tanggal_masuk: '',
    masa_kerja: ''
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<'start' | 'end' | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, hRes, oRes, deptRes, posRes] = await Promise.all([
        apiHrdGetEmployees().catch(() => ({ employees: [] })),
        apiHrdGetHospitals().catch(() => ({ hospitals: [] })),
        apiHrdGetOffices().catch(() => ({ offices: [] })),
        apiGetDepartments().catch(() => ({ departments: [] })),
        apiGetPositions().catch(() => ({ positions: [] }))
      ]);

      setEmployees(empRes.employees || []);
      setHospitals([...(oRes.offices || []), ...(hRes.hospitals || [])]);
      setMasterDepartments(deptRes.departments || []);
      setMasterPositions(posRes.positions || []);
    } catch (err) {
      console.error("Gagal memuat data karyawan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const name = String(emp?.name || '').toLowerCase();
      const nik = String(emp?.nik || '').toLowerCase();
      const email = String(emp?.email || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchSearch = !q || name.includes(q) || nik.includes(q) || email.includes(q);

      const dept1 = typeof emp?.department === 'string' ? emp.department.toLowerCase().trim() : '';
      const dept2 = typeof emp?.department_name === 'string' ? emp.department_name.toLowerCase().trim() : '';
      const targetDept = selectedDept.toLowerCase().trim();

      const matchDept =
        selectedDept === 'Semua Bagian' ||
        selectedDept === 'Semua Divisi' ||
        dept1 === targetDept ||
        dept2 === targetDept;

      return Boolean(matchSearch && matchDept);
    });
  }, [employees, searchQuery, selectedDept]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const departments = useMemo(() => {
    const depts = new Set(employees.map(e => e.department || e.department_name).filter(Boolean));
    return ['Semua Bagian', ...Array.from(depts)];
  }, [employees]);

  const handleOpenModal = (emp: any) => {
    setSelectedEmployee(emp);
    const scheduleStr = emp.schedule || (emp.jam_masuk && emp.jam_keluar ? `${emp.jam_masuk.slice(0, 5)} - ${emp.jam_keluar.slice(0, 5)}` : '08:00 - 17:00');
    setFormData({
      name: emp.name || '',
      employee_id: emp.employeeId || emp.employee_id || '',
      nik: emp.nik || '',
      email: emp.email || '',
      phone: emp.phone || '',
      password: '',
      schedule: scheduleStr,
      address: emp.address || '',
      hospital_id: emp.hospital_name !== '-' ? (emp.hospital_name || '') : '',
      id_department: (emp.department !== '-' ? emp.department : '') || (emp.department_name !== '-' ? emp.department_name : '') || '',
      id_position: emp.id_position || '',
      role: emp.role || 'EMPLOYEE',
      // FIELD BARU
      tempat_tanggal_lahir: emp.tempat_tanggal_lahir || '',
      status_pernikahan: emp.status_pernikahan || '',
      status_karyawan: emp.status_karyawan || '',
      wilayah_kerja: emp.wilayah_kerja || '',
      tanggal_masuk: emp.tanggal_masuk ? emp.tanggal_masuk.split('T')[0] : '', // Format YYYY-MM-DD untuk input date
      masa_kerja: emp.masa_kerja || ''
    });
    setShowPassword(false);
    setIsModalOpen(true);
  };

  const bagianOptions = useMemo(() => {
    return BAGIAN_LIST.map(bName => {
      const match = masterDepartments.find(d => d.name.toLowerCase() === bName.toLowerCase());
      return {
        id: match ? match.id : bName,
        name: bName
      };
    });
  }, [masterDepartments]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSaving(true);
    try {
      let jam_masuk: string | undefined;
      let jam_keluar: string | undefined;
      if (formData.schedule && formData.schedule.includes('-')) {
        const parts = formData.schedule.split('-').map(s => s.trim());
        if (parts[0]) jam_masuk = parts[0].length === 5 ? `${parts[0]}:00` : parts[0];
        if (parts[1]) jam_keluar = parts[1].length === 5 ? `${parts[1]}:00` : parts[1];
      }

      const payload = {
        name: formData.name,
        employee_id: formData.employee_id,
        nik: formData.nik,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
        address: formData.address,
        id_department: formData.id_department || undefined,
        id_position: formData.id_position || undefined,
        jam_masuk,
        jam_keluar,
        schedule: formData.schedule,
        hospital_id: formData.hospital_id || null,
        role: formData.role,
        // FIELD BARU
        tempat_tanggal_lahir: formData.tempat_tanggal_lahir,
        status_pernikahan: formData.status_pernikahan,
        status_karyawan: formData.status_karyawan,
        wilayah_kerja: formData.wilayah_kerja,
        tanggal_masuk: formData.tanggal_masuk,
        masa_kerja: formData.masa_kerja
      };

      if (selectedEmployee) {
          await apiHrdUpdateEmployee(selectedEmployee.id, payload);
      } else {
          await apiHrdCreateEmployee(payload);
      }
      setIsModalOpen(false);
      fetchData(); 
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menyimpan data karyawan: ${err.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data karyawan ini?')) return;
    try {
      await apiHrdDeleteEmployee(id);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(`Gagal menghapus karyawan: ${err.message || 'Server error'}`);
    }
  };

  const handleExportExcel = () => {
    exportToExcel({
      title: 'Data Karyawan',
      filename: 'Data_Karyawan_Excel_Format',
      columns: [
        { header: 'NO.', dataKey: 'no' },
        { header: 'NAMA KARYAWAN', dataKey: 'name' },
        { header: 'NIK', dataKey: 'nik' },
        { header: 'TEMPAT, TANGGAL LAHIR', dataKey: 'tempat_tanggal_lahir' },
        { header: 'STATUS PERNIKAHAN', dataKey: 'status_pernikahan' },
        { header: 'NO. TELEPON', dataKey: 'phone' },
        { header: 'ALAMAT LENGKAP', dataKey: 'address' },
        { header: 'ID KARYAWAN (NO. INDUK)', dataKey: 'employee_id' },
        { header: 'PEKERJAAN / BAGIAN', dataKey: 'department_name' },
        { header: 'STATUS KARYAWAN', dataKey: 'status_karyawan' },
        { header: 'WILAYAH KERJA', dataKey: 'wilayah_kerja' },
        { header: 'PENEMPATAN (RS)', dataKey: 'hospital_name' },
        { header: 'TANGGAL MASUK', dataKey: 'tanggal_masuk' },
        { header: 'MASA KERJA', dataKey: 'masa_kerja' },
        { header: 'WAKTU SHIFT', dataKey: 'schedule' },
        { header: 'EMAIL', dataKey: 'email' },
      ],
      data: filteredEmployees.map((emp, index) => ({
          ...emp,
          no: index + 1,
          name: emp.name || '-',
          nik: emp.nik || '-',
          tempat_tanggal_lahir: emp.tempat_tanggal_lahir || '-',
          status_pernikahan: emp.status_pernikahan || '-',
          phone: emp.phone || '-',
          address: emp.address || '-',
          employee_id: emp.employee_id || emp.employeeId || '-',
          department_name: emp.department || emp.department_name || '-',
          status_karyawan: emp.status_karyawan || '-',
          wilayah_kerja: emp.wilayah_kerja || '-',
          hospital_name: emp.hospital_name || '-',
          tanggal_masuk: formatDateSafe(emp.tanggal_masuk),
          masa_kerja: emp.masa_kerja || '-',
          schedule: emp.schedule || (emp.jam_masuk && emp.jam_keluar ? `${emp.jam_masuk.slice(0, 5)} - ${emp.jam_keluar.slice(0, 5)}` : '08:00 - 17:00'),
          email: emp.email || '-'
      }))
    });
  };

  const handleExportPDF = () => {
    exportToPDF({
      title: 'Data Karyawan',
      filename: 'Data_Karyawan',
      columns: [
        { header: 'No.', dataKey: 'no' },
        { header: 'Nama Karyawan', dataKey: 'name' },
        { header: 'NIK', dataKey: 'nik' },
        { header: 'Tempat, Tgl Lahir', dataKey: 'tempat_tanggal_lahir' },
        { header: 'Status Pernikahan', dataKey: 'status_pernikahan' },
        { header: 'No. Telepon', dataKey: 'phone' },
        { header: 'Alamat Lengkap', dataKey: 'address' },
        { header: 'ID (No. Induk)', dataKey: 'employee_id' },
        { header: 'Pekerjaan / Bagian', dataKey: 'department_name' },
        { header: 'Status Karyawan', dataKey: 'status_karyawan' },
        { header: 'Wilayah Kerja', dataKey: 'wilayah_kerja' },
        { header: 'Penempatan (RS)', dataKey: 'hospital_name' },
        { header: 'Tgl Masuk', dataKey: 'tanggal_masuk' },
        { header: 'Masa Kerja', dataKey: 'masa_kerja' },
        { header: 'Waktu Shift', dataKey: 'schedule' },
        { header: 'Email', dataKey: 'email' },
      ],
      data: filteredEmployees.map((emp, index) => ({
          ...emp,
          no: index + 1,
          name: emp.name || '-',
          nik: emp.nik || '-',
          tempat_tanggal_lahir: emp.tempat_tanggal_lahir || '-',
          status_pernikahan: emp.status_pernikahan || '-',
          phone: emp.phone || '-',
          address: emp.address || '-',
          employee_id: emp.employee_id || emp.employeeId || '-',
          department_name: emp.department || emp.department_name || '-',
          status_karyawan: emp.status_karyawan || '-',
          wilayah_kerja: emp.wilayah_kerja || '-',
          hospital_name: emp.hospital_name || '-',
          tanggal_masuk: formatDateSafe(emp.tanggal_masuk),
          masa_kerja: emp.masa_kerja || '-',
          schedule: emp.schedule || (emp.jam_masuk && emp.jam_keluar ? `${emp.jam_masuk.slice(0, 5)} - ${emp.jam_keluar.slice(0, 5)}` : '08:00 - 17:00'),
          email: emp.email || '-'
      }))
    });
  };

  return (
    <div className="p-4 md:p-8 relative w-full">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen Karyawan</h2>
          <p className="text-gray-500 mt-2 text-sm">Kelola data Karyawan</p>
        </div>
        <div className="flex gap-2">
            <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 border border-green-600 bg-white hover:bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
            <Download className="w-4 h-4" /> Excel
            </button>
            <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 border border-red-600 bg-white hover:bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
            <Download className="w-4 h-4" /> PDF
            </button>
            <button
            onClick={() => {
                setSelectedEmployee(null);
                setFormData({
                name: '',
                employee_id: '',
                nik: '',
                email: '',
                phone: '',
                password: '',
                schedule: '',
                address: '',
                hospital_id: '',
                id_department: '',
                id_position: '',
                role: 'EMPLOYEE',
                tempat_tanggal_lahir: '',
                status_pernikahan: '',
                status_karyawan: '',
                wilayah_kerja: '',
                tanggal_masuk: '',
                masa_kerja: ''
                });
                setShowPassword(false);
                setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
            + Tambah Karyawan
            </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full">
        
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative w-full md:flex-1 md:max-w-md">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari nama karyawan..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
            />
          </div>
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <Filter className="w-4 h-4 text-gray-400 hidden md:block" />
            <select 
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }} 
            className="w-full md:w-auto border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer">
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
           </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1500px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold tracking-wide border-b border-gray-200">
                <th className="px-6 py-4">Nama</th>
                <th className="px-6 py-4">No. Induk</th>
                <th className="px-6 py-4">NIK</th>
                <th className="px-6 py-4">Tempat, Tgl Lahir</th>
                <th className="px-6 py-4">Pekerjaan</th>
                <th className="px-6 py-4">Status Karyawan</th>
                <th className="px-6 py-4">Wilayah Kerja</th>
                <th className="px-6 py-4">Penempatan RS</th>
                <th className="px-6 py-4">Tgl Masuk</th>
                <th className="px-6 py-4">Masa Kerja</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
             {loading ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">
                    Memuat data karyawan...
                  </td>
                </tr>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp, index) => {
                  const initials = (emp?.name && typeof emp.name === 'string')
                    ? emp.name.trim().split(/\s+/).map((n: string) => n[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'US'
                    : 'US';

                  const avatarColors = [
                    'bg-blue-600 text-white', 'bg-gray-800 text-white', 
                    'bg-red-100 text-red-600', 'bg-gray-500 text-white', 
                    'bg-blue-100 text-blue-700'
                  ];
                  const avatarClass = avatarColors[index % avatarColors.length];

                  return (
                    <tr key={emp.id || index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center">
                        <div className={`w-9 h-9 ${avatarClass} rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm shrink-0`}>
                          {initials}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800 block">{emp.name || 'Tanpa Nama'}</span>
                          <span className="text-xs text-gray-400 block">{emp.email || '-'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {emp.employee_id || emp.employeeId ? (
                          <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-200 font-semibold">{emp.employee_id || emp.employeeId}</span>
                        ) : (<span className="text-gray-400 italic">Belum diisi</span>)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                        {emp.nik ? (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-semibold">{emp.nik}</span>
                        ) : (<span className="text-gray-400 italic">Belum diisi</span>)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{emp.tempat_tanggal_lahir || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{emp.department || emp.department_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">
                        {emp.status_karyawan ? (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${emp.status_karyawan.toLowerCase().includes('tetap') ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {emp.status_karyawan}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{emp.wilayah_kerja || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{emp.hospital_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">
                         {formatDateSafe(emp.tanggal_masuk)}
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-medium">{emp.masa_kerja || '-'}</td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleOpenModal(emp)}
                            className="flex items-center text-blue-600 hover:text-blue-800 bg-white border border-blue-200 hover:bg-blue-50 px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium"
                          >
                            <Edit className="w-4 h-4 mr-1" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(emp.id)}
                            className="flex items-center text-red-600 hover:text-red-800 bg-white border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-md transition-colors shadow-sm font-medium"
                          >
                            <Trash2 className="w-4 h-4 mr-1" /> Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Tidak ada data karyawan yang sesuai dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="px-4 py-4 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between bg-gray-50/30 gap-4">
          <span className="text-sm text-gray-500 text-center md:text-left">
            Menampilkan {filteredEmployees.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} dari {filteredEmployees.length} karyawan
          </span>
          <div className="flex items-center space-x-1 flex-wrap justify-center">
            <button 
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors shadow-sm ${
                  currentPage === page 
                    ? 'bg-gray-800 text-white' 
                    : 'text-gray-600 hover:bg-gray-200'
                }`}
              >
                {page}
              </button>
            ))}

            <button 
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-30 flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      {/* Clock Time Picker Modal */}
      <ClockTimePickerModal
        isOpen={timePickerTarget !== null}
        title={timePickerTarget === 'start' ? 'Pilih Jam Masuk' : 'Pilih Jam Pulang'}
        initialTime={
          timePickerTarget === 'start'
            ? (formData.schedule || '08:00 - 17:00').split('-')[0]?.trim() || '08:00'
            : (formData.schedule || '08:00 - 17:00').split('-')[1]?.trim() || '17:00'
        }
        onClose={() => setTimePickerTarget(null)}
        onSave={(timeStr) => {
          const currentParts = (formData.schedule || '08:00 - 17:00').split('-').map(s => s.trim());
          const start = timePickerTarget === 'start' ? timeStr : (currentParts[0] || '08:00');
          const end = timePickerTarget === 'end' ? timeStr : (currentParts[1] || '17:00');
          setFormData({ ...formData, schedule: `${start} - ${end}` });
          setTimePickerTarget(null);
        }}
      />

      {/* Modal Lihat/Edit/Tambah */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                {selectedEmployee ? 'Detail & Edit Karyawan' : 'Tambah Karyawan Baru'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="overflow-y-auto p-5 flex flex-col gap-6">
              {/* SECTION: DATA PRIBADI */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider border-b pb-1">Data Pribadi</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Karyawan <span className="text-red-500">*</span></label>
                    <input type="text" required className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">NIK <span className="text-xs text-blue-600">(16 Digit)</span></label>
                    <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={20} className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-mono" value={formData.nik} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setFormData({...formData, nik: val}); }} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tempat, Tanggal Lahir</label>
                    <input type="text" placeholder="Cth: Jakarta, 12 Agustus 1995" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.tempat_tanggal_lahir} onChange={(e) => setFormData({...formData, tempat_tanggal_lahir: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Pernikahan</label>
                    <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.status_pernikahan} onChange={(e) => setFormData({...formData, status_pernikahan: e.target.value})}>
                      <option value="">-- Pilih --</option>
                      <option value="Belum Kawin">Belum Menikah</option>
                      <option value="Kawin">Menikah</option>
                      <option value="Cerai Hidup">Cerai Hidup</option>
                      <option value="Cerai Mati">Cerai Mati</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                    <input type="text" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                    <input type="text" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* SECTION: PEKERJAAN & KANTOR */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider border-b pb-1">Data Pekerjaan</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Karyawan (No. Induk)</label>
                    <input type="text" placeholder="Masukkan ID / No. Induk" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800 font-mono" value={formData.employee_id || ''} onChange={(e) => setFormData({...formData, employee_id: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Pekerjaan / Bagian</label>
                    <input list="bagian-list" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" placeholder="Pilih / ketik bagian..." value={formData.id_department} onChange={(e) => setFormData({...formData, id_department: e.target.value})} />
                    <datalist id="bagian-list">{bagianOptions.map((b) => (<option key={b.id || b.name} value={b.name}>{b.name}</option>))}</datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status Karyawan</label>
                    <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.status_karyawan} onChange={(e) => setFormData({...formData, status_karyawan: e.target.value})}>
                      <option value="">-- Pilih Status --</option>
                      <option value="Tetap">Tetap</option>
                      <option value="Kontrak">Kontrak</option>
                      <option value="Freelance">Freelance</option>
                      <option value="Training">Training</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Wilayah Kerja</label>
                    <input type="text" placeholder="Cth: Purwokerto, Cilacap" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.wilayah_kerja} onChange={(e) => setFormData({...formData, wilayah_kerja: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Penempatan (RS)</label>
                    <input list="penugasan-list" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" placeholder="Pilih Rumah Sakit..." value={formData.hospital_id} onChange={(e) => setFormData({...formData, hospital_id: e.target.value})} />
                    <datalist id="penugasan-list">{hospitals.map((h) => (<option key={h.id} value={h.nama_rs || h.name}>{h.nama_rs || h.name}</option>))}</datalist>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Masuk</label>
                    <input type="date" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.tanggal_masuk} onChange={(e) => setFormData({...formData, tanggal_masuk: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Masa Kerja</label>
                    <input type="text" placeholder="Cth: 2 Tahun 3 Bulan" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.masa_kerja} onChange={(e) => setFormData({...formData, masa_kerja: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Shift (Jam Masuk - Pulang)</label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setTimePickerTarget('start')}
                          className="w-full text-left border border-gray-300 rounded-md p-2 text-sm text-gray-800 bg-white hover:bg-gray-50 flex items-center justify-between shadow-sm"
                        >
                          <span>{(formData.schedule || '08:00 - 17:00').split('-')[0]?.trim() || '08:00'}</span>
                          <span className="text-xs text-blue-600 font-semibold uppercase">Pilih</span>
                        </button>
                      </div>
                      <span className="text-gray-400 font-bold">-</span>
                      <div className="relative flex-1">
                        <button
                          type="button"
                          onClick={() => setTimePickerTarget('end')}
                          className="w-full text-left border border-gray-300 rounded-md p-2 text-sm text-gray-800 bg-white hover:bg-gray-50 flex items-center justify-between shadow-sm"
                        >
                          <span>{(formData.schedule || '08:00 - 17:00').split('-')[1]?.trim() || '17:00'}</span>
                          <span className="text-xs text-blue-600 font-semibold uppercase">Pilih</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: AKUN & SISTEM */}
              <div>
                <h3 className="text-sm font-bold text-gray-800 mb-3 uppercase tracking-wider border-b pb-1">Akun Sistem</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input type="email" className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role (Hak Akses)</label>
                    <select className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                      <option value="EMPLOYEE">Karyawan (Employee)</option>
                      <option value="ADMIN">Admin / HRD</option>
                    </select>
                  </div>
                  {!selectedEmployee && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Password <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input type={showPassword ? "text" : "password"} required className="w-full border border-gray-300 rounded-md p-2 pr-10 focus:ring-blue-500 focus:border-blue-500 text-gray-800" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none">
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 mt-2 border-t border-gray-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-3">Batal</button>
                <button type="submit" disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default KaryawanHRD;