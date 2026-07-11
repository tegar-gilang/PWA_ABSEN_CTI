import React from 'react';

const KaryawanHRD: React.FC = () => {
  return (
    <div className="p-8">
      
      {/* Judul & Tombol Export */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen Karyawan</h2>
          <p className="text-gray-500 mt-2 text-sm">Kelola data, status, dan performa tim Anda.</p>
        </div>
        <button className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm">
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
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
            />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-gray-400">⚡</span>
            <select className="border border-gray-300 rounded-md px-4 py-2 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white cursor-pointer">
              <option>Semua Divisi</option>
              <option>Teknisi</option>
              <option>Admin</option>
              <option>Sales</option>
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
              
              {/* Baris 1: Budi Prakoso */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">BP</div>
                  <span className="font-semibold text-gray-800">Budi Prakoso</span>
                </td>
                <td className="px-6 py-4 text-gray-600">Teknisi</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Aktif</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-600 font-medium inline-flex items-center">
                    <span className="mr-1">👍</span> Baik
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-8">85%</span>
                  </div>
                </td>
              </tr>

              {/* Baris 2: Siti Wijaya */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-9 h-9 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">SW</div>
                  <span className="font-semibold text-gray-800">Siti Wijaya</span>
                </td>
                <td className="px-6 py-4 text-gray-600">Admin</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Aktif</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-600 font-medium inline-flex items-center">
                    <span className="mr-1">👍</span> Baik
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-8">92%</span>
                  </div>
                </td>
              </tr>

              {/* Baris 3: Agus Hermawan */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-9 h-9 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">AH</div>
                  <span className="font-semibold text-gray-800">Agus Hermawan</span>
                </td>
                <td className="px-6 py-4 text-gray-600">Sales</td>
                <td className="px-6 py-4">
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-medium">Tidak Aktif</span>
                </td>
                <td className="px-6 py-4 text-gray-400">
                  — —
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gray-400 h-1.5 rounded-full" style={{ width: '0%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-8">0%</span>
                  </div>
                </td>
              </tr>

              {/* Baris 4: Dewi Novita */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-9 h-9 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">DN</div>
                  <span className="font-semibold text-gray-800">Dewi Novita</span>
                </td>
                <td className="px-6 py-4 text-gray-600">Sales</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Aktif</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-red-600 font-medium inline-flex items-center">
                    <span className="mr-1">⚠️</span> Perlu Coaching
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-red-600 h-1.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-red-600 w-8">45%</span>
                  </div>
                </td>
              </tr>

              {/* Baris 5: Rizky Fauzi */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-9 h-9 bg-gray-500 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">RF</div>
                  <span className="font-semibold text-gray-800">Rizky Fauzi</span>
                </td>
                <td className="px-6 py-4 text-gray-600">Teknisi</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Aktif</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-600 font-medium inline-flex items-center">
                    <span className="mr-1">👍</span> Baik
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-8">78%</span>
                  </div>
                </td>
              </tr>

              {/* Baris 6: Lestari Mulya */}
              <tr className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold mr-3 shadow-sm">LM</div>
                  <span className="font-semibold text-gray-800">Lestari Mulya</span>
                </td>
                <td className="px-6 py-4 text-gray-600">Admin</td>
                <td className="px-6 py-4">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-medium">Aktif</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-blue-600 font-medium inline-flex items-center">
                    <span className="mr-1">👍</span> Baik
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-32 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: '100%' }}></div>
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-8">100%</span>
                  </div>
                </td>
              </tr>

            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50/30">
          <span className="text-sm text-gray-500">Menampilkan 1-6 dari 24 karyawan</span>
          <div className="flex items-center space-x-1">
            <button className="px-2 py-1 text-gray-400 hover:text-gray-600 transition-colors">❮</button>
            <button className="px-3 py-1 bg-gray-800 text-white rounded-md text-sm font-medium shadow-sm">1</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors">2</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors">3</button>
            <button className="px-2 py-1 text-gray-600 hover:text-gray-800 transition-colors">❯</button>
          </div>
        </div>

      </div>
      
    </div>
  );
};

export default KaryawanHRD;