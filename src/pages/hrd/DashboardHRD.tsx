import React from 'react';

const DashboardHRD: React.FC = () => {
  return (
    <div className="p-8">
      
      {/* Judul & Tombol Export */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">Today's HR snapshot.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
          <span className="mr-2">📥</span> Export Report
        </button>
      </div>

      {/* Deretan Kartu Statistik (Stats Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Card 1 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">👥</div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Employees</p>
          <h3 className="text-3xl font-bold text-gray-800">150</h3>
        </div>
        {/* Card 2 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
          <div className="absolute top-6 right-6 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">94%</div>
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4 text-xl">✅</div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Present Today</p>
          <h3 className="text-3xl font-bold text-gray-800">142</h3>
        </div>
        {/* Card 3 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-red-100 text-red-600 rounded-lg flex items-center justify-center mb-4 text-xl">⏰</div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Late Today</p>
          <h3 className="text-3xl font-bold text-gray-800">5</h3>
        </div>
        {/* Card 4 */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center mb-4 text-xl">📝</div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Leave</p>
          <h3 className="text-3xl font-bold text-gray-800">3</h3>
        </div>
      </div>

      {/* Area Grafik (Placeholder) */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 text-lg">Attendance Trends</h3>
          <select className="border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-1.5 outline-none">
            <option>Last 7 Days</option>
          </select>
        </div>
        <div className="w-full h-64 bg-gray-100 rounded-lg flex items-end justify-between px-8 pb-4">
           {/* Ini area untuk library chart seperti Chart.js atau Recharts nantinya */}
           <span className="text-xs text-gray-500">Mon</span>
           <span className="text-xs text-gray-500">Tue</span>
           <span className="text-xs text-gray-500">Wed</span>
           <span className="text-xs text-gray-500">Thu</span>
           <span className="text-xs text-gray-500">Fri</span>
           <span className="text-xs text-gray-500">Sat</span>
           <span className="text-xs text-gray-500">Sun</span>
        </div>
      </div>

      {/* Tabel Aktivitas Terbaru */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg">Recent Activity</h3>
          <a href="#" className="text-blue-600 text-sm font-medium hover:underline">View All</a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Time</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3">AW</div>
                  <span className="font-semibold text-gray-800">Andi Wijaya</span>
                </td>
                <td className="px-6 py-4">Check In</td>
                <td className="px-6 py-4">08:05 AM</td>
                <td className="px-6 py-4 text-right">
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-medium">On Time</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">BS</div>
                  <span className="font-semibold text-gray-800">Budi Santoso</span>
                </td>
                <td className="px-6 py-4">Leave Request (Annual)</td>
                <td className="px-6 py-4">09:12 AM</td>
                <td className="px-6 py-4 text-right">
                  <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">Pending</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-bold mr-3">CD</div>
                  <span className="font-semibold text-gray-800">Citra Dewi</span>
                </td>
                <td className="px-6 py-4">Check In</td>
                <td className="px-6 py-4">09:45 AM</td>
                <td className="px-6 py-4 text-right">
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold">Late</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default DashboardHRD;
