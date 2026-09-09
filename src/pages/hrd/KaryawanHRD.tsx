import React, { useEffect, useState, useMemo } from 'react';
import { apiHrdGetEmployees, apiHrdUpdateEmployee, apiHrdDeleteEmployee, getToken } from '@/src/lib/api';
import { 
  Download, 
  Search, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  X,
  Edit,
  Trash2
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const KaryawanHRD: React.FC = () => {
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchQuery,setSearchQuery] = useState<string>('');
  const [selectedDept,setSelectedDept] = useState<string>('Semua Divisi');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [formData, setFormData] = useState({
    employeeId: '',
    nik: '',
    email: '',
    phone: '',
    schedule: '',
    address: '',
    hospital_id: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiHrdGetEmployees();
      setEmployees(res.employees || []);

      // Fetch hospitals
      const hRes = await fetch(`${API_URL}/hrd/hospitals`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (hRes.ok) {
        const hData = await hRes.json();
        setHospitals(hData.hospitals || []);
      }
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch = emp.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === 'Semua Divisi' ||
      emp.department?.toLowerCase() === selectedDept.toLowerCase();
      return matchSearch && matchDept;
    });
  }, [employees, searchQuery, selectedDept]);

  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const departments = useMemo(() =>{
    const depts = new Set(employees.map(e => e.department).filter(Boolean));
    return ['Semua Divisi', ...Array.from(depts)];
  }, [employees]);

  const handleOpenModal = (emp: any) => {
    setSelectedEmployee(emp);
    setFormData({
      employeeId: emp.employeeId || '',
      nik: emp.nik || '',
      email: emp.email || '',
      phone: emp.phone || '',
      schedule: emp.schedule || '',
      address: emp.address || '',
      hospital_id: emp.hospital_id || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        hospital_id: formData.hospital_id || null
      };
      await apiHrdUpdateEmployee(selectedEmployee.id, payload);
      setIsModalOpen(false);
      fetchData(); // Refresh data
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

  return (
    <div className="p-4 md:p-8 relative w-full">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen Karyawan</h2>
          <p className="text-gray-500 mt-2 text-sm">Kelola data Karyawan</p>
        </div>
        <button onClick={() => alert("Mengunduh data karyawan...")} className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm w-full sm:w-auto justify-center">
          <Download className="w-4 h-4 mr-2" /> Export to Excel
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-4">
        Gunakan tombol aksi untuk mengedit atau menghapus data karyawan
      </p>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
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

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold tracking-wide border-b border-gray-200">
                <th className="px-6 py-4">Nama Karyawan</th>
                <th className="px-6 py-4">NIK</th>
                <th className="px-6 py-4">Divisi</th>
                <th className="px-6 py-4">No. Telepon</th>
                <th className="px-6 py-4">Penempatan</th>
                <th className="px-6 py-4">Waktu Shift</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
             {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">
                    Memuat data karyawan...
                  </td>
                </tr>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp, index) => {
                  const initials = emp.name
                    ? emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
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
                        <div className={`w-9 h-9 ${avatarClass} rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm`}>
                          {initials}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800 block">{emp.name || 'Tanpa Nama'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{emp.nik || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{emp.department || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{emp.phone || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 truncate max-w-[200px]">{emp.hospital_name || '-'}</td>
                      <td className="px-6 py-4 text-gray-600">{emp.schedule || '-'}</td>
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
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium">
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

      {/* Modal Lihat/Edit */}
      {isModalOpen && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-5 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-800">
                Detail & Edit Karyawan
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="overflow-y-auto p-5 flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Karyawan (Read-only)</label>
                  <input 
                    type="text" 
                    readOnly
                    className="w-full border border-gray-200 bg-gray-50 rounded-md p-2 text-gray-500"
                    value={selectedEmployee.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Divisi (Read-only)</label>
                  <input 
                    type="text" 
                    readOnly
                    className="w-full border border-gray-200 bg-gray-50 rounded-md p-2 text-gray-500"
                    value={selectedEmployee.department || '-'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Karyawan</label>
                  <input 
                    type="text" 
                    required
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">NIK</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.nik}
                    onChange={(e) => setFormData({...formData, nik: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">No. Telepon</label>
                  <input 
                    type="text" 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Waktu Shift</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: 08:00 - 17:00"
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.schedule}
                    onChange={(e) => setFormData({...formData, schedule: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Penugasan Rumah Sakit</label>
                  <select 
                    className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.hospital_id}
                    onChange={(e) => setFormData({...formData, hospital_id: e.target.value})}
                  >
                    <option value="">-- Pilih Rumah Sakit --</option>
                    {hospitals.map((h) => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
                <textarea 
                  rows={3}
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                ></textarea>
              </div>

              <div className="flex justify-end pt-4 mt-2 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-3"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
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