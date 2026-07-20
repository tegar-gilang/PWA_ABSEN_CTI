import React, {useEffect, useState, useMemo} from 'react';
import { apiHrdGetEmployees } from '@/src/lib/api';

const KaryawanHRD: React.FC = () => {
  
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [searchQuery,setSearchQuery] = useState<string>('');
  const [selectedDept,setSelectedDept] = useState<string>('Semua Divisi');

  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await apiHrdGetEmployees();
        setEmployees(res.employees || []);
      }catch (err){
        console.error("Gagal memuat karyawan:", err);
      }finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchSearch = emp.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = selectedDept === 'Semua Divisi' ||
      emp.department?.toLowerCase() === selectedDept.toLowerCase();
      return matchSearch && matchDept;
    });
  }, [employees, searchQuery, selectedDept]);

  // Pagination states
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const paginatedEmployees = filteredEmployees.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  //Division unique for select option
  const departments = useMemo(() =>{
    const depts = new Set(employees.map(e => e.department).filter(Boolean));
    return ['Semua Divisi', ...Array.from(depts)];
  }, [employees]);


  return (
    <div className="p-8">
      
      {/* Judul & Tombol Export */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen Karyawan</h2>
          <p className="text-gray-500 mt-2 text-sm">Kelola data, status, dan performa tim Anda.</p>
        </div>
        <button onClick={() => alert("Mengunduh data karyawan...")} className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm">
          <span className="mr-2">📥</span> Export to Excel
        </button>
      </div>

      {/* Kontainer Utama */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {/* Toolbar (Pencarian & Filter) */}
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
          <div className="relative flex-1 max-w-md">
            <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
            <input 
              type="text" 
              placeholder="Cari nama karyawan..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">⚡</span>
            <select 
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setCurrentPage(1); }} 
            className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer">
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
           </div>
        </div>

        {/* Tabel Data Karyawan */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs font-semibold tracking-wide border-b border-gray-200">
                <th className="px-6 py-4">Nama Karyawan</th>
                <th className="px-6 py-4">Divisi</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Performa</th>
                <th className="px-6 py-4">Target Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
             {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">
                    Memuat data karyawan...
                  </td>
                </tr>
              ) : paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((emp, index) => {
                  // Avatar
                  const initials = emp.name
                    ? emp.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'US';

                  //  Warna Avatar
                  const avatarColors = [
                    'bg-blue-600 text-white', 'bg-gray-800 text-white', 
                    'bg-red-100 text-red-600', 'bg-gray-500 text-white', 
                    'bg-blue-100 text-blue-700'
                  ];
                  const avatarClass = avatarColors[index % avatarColors.length];

                  
                  const rawStatus = emp.status_karyawan || emp.status || 'Aktif';
                  const isActive = rawStatus.toUpperCase() === 'ACTIVE' || rawStatus.toLowerCase() === 'aktif';
                  const statusLabel = isActive ? 'Aktif' : rawStatus;
                  const statusClass = isActive ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-600';

                  
                 const rawPerformance = emp.performance_status || 'Baik';
                 const isPerluCoaching = rawPerformance.toLowerCase().includes('coaching') || (emp.targetProgress || 0) < 50;
                 const performanceLabel = rawPerformance;
                 const performanceIcon = isPerluCoaching ? '⚠️' : rawPerformance.toLowerCase().includes('sangat') ? '🌟' : '👍';
                 const performanceClass = isPerluCoaching ? 'text-red-600' : 'text-blue-600';

                 const progressBarColor = (emp.targetProgress || 0) === 0 ? 'bg-gray-400' : isPerluCoaching ? 'bg-red-600' : 'bg-blue-600';
                 const progressTextColor = isPerluCoaching ? 'text-red-600' : 'text-gray-500';

                  return (
                    <tr key={emp.id || index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center">
                        <div className={`w-9 h-9 ${avatarClass} rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm`}>
                          {initials}
                        </div>
                        <div>
                          <span className="font-semibold text-gray-800 block">{emp.name || 'Tanpa Nama'}</span>
                          {emp.email && <span className="text-xs text-gray-400 block">{emp.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{emp.department || 'General'}</td>
                      <td className="px-6 py-4">
                        <span className={`${statusClass} px-3 py-1 rounded-full text-xs font-medium inline-block`}>
                          {statusLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${performanceClass} font-medium inline-flex items-center`}>
                          {emp.targetProgress === 0 && !emp.performance ? (
                            <span className="text-gray-400">— —</span>
                          ) : (
                            <>
                              <span className="mr-1">{performanceIcon}</span> {performanceLabel}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                            <div className={`${progressBarColor} h-1.5 rounded-full transition-all duration-500`} style={{ width: `${emp.targetProgress || 0}%` }}></div>
                          </div>
                          <span className={`text-xs font-medium ${progressTextColor} w-8`}>{emp.targetProgress || 0}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Tidak ada data karyawan yang sesuai dengan pencarian Anda.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/30">
          <span className="text-sm text-gray-500">
            Menampilkan {filteredEmployees.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-{Math.min(currentPage * itemsPerPage, filteredEmployees.length)} dari {filteredEmployees.length} karyawan
          </span>
          <div className="flex items-center space-x-1">
            <button 
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1 || totalPages === 0}
              className="px-2 py-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30"
            >
              ❮
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
              className="px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-30"
            >
              ❯
            </button>
          </div>
        </div>

      </div>  
    </div>
  );
};

export default KaryawanHRD;