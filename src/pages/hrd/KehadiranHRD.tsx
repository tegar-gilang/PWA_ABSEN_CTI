import React from 'react';

const KehadiranHRD: React.FC = () => {
  return (
    <div className="p-8">
      
      {/* Judul & Tombol Export */}
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Manajemen Kehadiran</h2>
          <p className="text-gray-500 mt-1 text-sm">Monitor and manage daily employee attendance records.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm">
          <span className="mr-2">📥</span> Export to Excel
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Search Record</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400">🔍</span>
            <input type="text" placeholder="Name or ID..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
          <div className="relative">
            <span className="absolute left-3 top-2 text-gray-400">📅</span>
            <input type="text" defaultValue="10/24/2023" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </div>
        </div>
        <div className="w-48">
          <label className="block text-xs font-semibold text-gray-600 mb-1">Status</label>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
            <option>All Status</option>
            <option>Hadir</option>
            <option>Terlambat</option>
            <option>Cuti</option>
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
              
              {/* Baris 1: Hadir */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">BS</div>
                  <div>
                    <p className="font-semibold text-gray-800">Budi Santoso</p>
                    <p className="text-xs text-gray-500">EMP-001 • IT Dept</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-medium">Hadir</span>
                </td>
                <td className="px-6 py-4 font-medium">08:45 AM</td>
                <td className="px-6 py-4 text-gray-400">--:--</td>
                <td className="px-6 py-4">
                  <p className="text-gray-700">-6.2088, 106.8456</p>
                  <p className="text-xs text-gray-500">Jakarta</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 text-xs font-medium inline-flex items-center">
                    <span className="mr-1">👁️</span> Photo
                  </button>
                </td>
              </tr>

              {/* Baris 2: Terlambat */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">AW</div>
                  <div>
                    <p className="font-semibold text-gray-800">Ani Wijaya</p>
                    <p className="text-xs text-gray-500">EMP-042 • Finance</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-md text-xs font-medium">Terlambat</span>
                </td>
                <td className="px-6 py-4 font-medium">09:15 AM</td>
                <td className="px-6 py-4 text-gray-400">--:--</td>
                <td className="px-6 py-4">
                  <p className="text-gray-700">-6.1751, 106.8272</p>
                  <p className="text-xs text-gray-500">Jakarta</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 text-xs font-medium inline-flex items-center">
                    <span className="mr-1">👁️</span> Photo
                  </button>
                </td>
              </tr>

              {/* Baris 3: Cuti */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">DP</div>
                  <div>
                    <p className="font-semibold text-gray-800">Dian Pertiwi</p>
                    <p className="text-xs text-gray-500">EMP-088 • HR</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-md text-xs font-medium">Cuti</span>
                </td>
                <td className="px-6 py-4 text-gray-400">-</td>
                <td className="px-6 py-4 text-gray-400">-</td>
                <td className="px-6 py-4 text-gray-400">-</td>
                <td className="px-6 py-4 text-right">
                  <button className="border border-gray-200 text-gray-400 bg-gray-50 px-3 py-1.5 rounded-md text-xs font-medium cursor-not-allowed inline-flex items-center" disabled>
                    <span className="mr-1">🚫</span> N/A
                  </button>
                </td>
              </tr>

              {/* Baris 4: Hadir */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">RK</div>
                  <div>
                    <p className="font-semibold text-gray-800">Rizky Kurniawan</p>
                    <p className="text-xs text-gray-500">EMP-102 • Sales</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-medium">Hadir</span>
                </td>
                <td className="px-6 py-4 font-medium">08:30 AM</td>
                <td className="px-6 py-4 text-gray-400">--:--</td>
                <td className="px-6 py-4">
                  <p className="text-gray-700">-6.2341, 106.8221</p>
                  <p className="text-xs text-gray-500">Jakarta</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 text-xs font-medium inline-flex items-center">
                    <span className="mr-1">👁️</span> Photo
                  </button>
                </td>
              </tr>

              {/* Baris 5: Hadir */}
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold mr-3">SF</div>
                  <div>
                    <p className="font-semibold text-gray-800">Siti Fatimah</p>
                    <p className="text-xs text-gray-500">EMP-055 • Marketing</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-xs font-medium">Hadir</span>
                </td>
                <td className="px-6 py-4 font-medium">08:55 AM</td>
                <td className="px-6 py-4 text-gray-400">--:--</td>
                <td className="px-6 py-4">
                  <p className="text-gray-700">-6.9147, 107.6098</p>
                  <p className="text-xs text-gray-500">Bandung</p>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md hover:bg-gray-100 text-xs font-medium inline-flex items-center">
                    <span className="mr-1">👁️</span> Photo
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <span className="text-sm text-gray-500">Showing 1 to 5 of 142 entries</span>
          <div className="flex items-center space-x-1">
            <button className="px-2 py-1 text-gray-500 hover:text-gray-700">❮</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium">1</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium">2</button>
            <button className="px-3 py-1 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium">3</button>
            <button className="px-2 py-1 text-gray-500 hover:text-gray-700">❯</button>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default KehadiranHRD;