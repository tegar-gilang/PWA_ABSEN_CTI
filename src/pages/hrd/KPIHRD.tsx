import React from 'react';

const KPIHRD: React.FC = () => {
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen KPI</h2>
          <p className="text-gray-500 mt-2 text-sm">Pantau dan kelola Key Performance Indicators karyawan.</p>
        </div>
        <div className="flex space-x-3">
          <button className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm">
            <span className="mr-2">📥</span> Export to Excel
          </button>
          <button className="bg-gray-900 hover:bg-black text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm">
            <span className="mr-2">📄</span> Open Satisfaction Form / Benefit Record
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Statistik */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card 1: Total Karyawan */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-4">Total Karyawan Capai Target</h3>
            <div className="flex items-baseline space-x-2 mb-4">
              <span className="text-5xl font-bold text-blue-600">6</span>
              <span className="text-gray-500 text-sm font-medium">/ 8 Karyawan</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          {/* Card 2: Performa Unit */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-base font-bold text-gray-800 mb-6">Performa Unit Wash/Repair</h3>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 border-2 border-blue-600 text-blue-600 rounded-xl flex items-center justify-center text-xl font-bold">
                82%
              </div>
              <p className="text-sm text-gray-500 flex-1 leading-relaxed">
                Rata-rata pencapaian target unit bulan ini menunjukkan tren positif.
              </p>
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Tabel KPI */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          {/* Table Header */}
          <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wider">DATA PENCAPAIAN KPI KARYAWAN</h3>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-400">🔍</span>
              <input type="text" placeholder="Cari karyawan..." className="pl-9 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64 bg-white" />
            </div>
          </div>
          
          {/* Table Content */}
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="text-gray-600 border-b border-gray-200 bg-gray-50/50 font-medium">
                  <th className="px-6 py-4">Employee Name</th>
                  <th className="px-6 py-4">Target Unit (Wash/Repair)</th>
                  <th className="px-6 py-4">Target Rupiah</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-700">
                {[
                  { name: 'Budi Santoso', unit: '120 / 100', rp: 'Rp 15.000.000', status: 'Capai Target', success: true },
                  { name: 'Siti Aminah', unit: '95 / 100', rp: 'Rp 12.500.000', status: 'Tidak Capai', success: false },
                  { name: 'Andi Wijaya', unit: '150 / 120', rp: 'Rp 18.200.000', status: 'Capai Target', success: true },
                  { name: 'Dewi Lestari', unit: '105 / 100', rp: 'Rp 14.800.000', status: 'Capai Target', success: true },
                  { name: 'Rizky Pratama', unit: '80 / 110', rp: 'Rp 10.000.000', status: 'Tidak Capai', success: false },
                  { name: 'Nina Marlina', unit: '110 / 100', rp: 'Rp 15.500.000', status: 'Capai Target', success: true },
                  { name: 'Hendra Gunawan', unit: '130 / 120', rp: 'Rp 17.000.000', status: 'Capai Target', success: true },
                  { name: 'Maya Sari', unit: '100 / 100', rp: 'Rp 13.000.000', status: 'Capai Target', success: true },
                ].map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-6 py-4">{item.unit}</td>
                    <td className="px-6 py-4">{item.rp}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-sm text-xs font-medium border ${item.success ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-500 bg-gray-50/30 flex justify-between items-center">
            <span>Menampilkan 1-8 dari 8 data</span>
            <div className="flex space-x-1">
              <button className="px-2 py-1 border border-gray-300 rounded text-gray-400 hover:text-gray-600 bg-white">❮</button>
              <button className="px-3 py-1 bg-gray-900 text-white rounded font-medium">1</button>
              <button className="px-2 py-1 border border-gray-300 rounded text-gray-400 hover:text-gray-600 bg-white">❯</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KPIHRD;