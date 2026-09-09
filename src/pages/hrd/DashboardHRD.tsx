import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiHrdGetDashboardOverview } from '../../lib/api';
// Import ikon-ikon yang dibutuhkan dari lucide-react
import { 
  Download, 
  Users, 
  CheckCircle2, 
  Clock, 
  FileText 
} from 'lucide-react';

const DashboardHRD: React.FC = () => {
  const [data, setData] = useState<{
    metrics: { totalEmployees: number; presentToday: number; lateToday: number; pendingLeaves: number };
    recentActivities: any[];
    attendanceTrends?: Array<{date: string, on_time: number, late: number, leaves: number}>;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Memanggil endpoint khusus dashboard dari backend
    apiHrdGetDashboardOverview()
      .then((res) => setData(res))
      .catch((err) => console.error("Gagal memuat dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-gray-500 font-medium animate-pulse">Memuat data snapshot HRD...</div>;
  }

  const { metrics, recentActivities, attendanceTrends = [] } = data;

  // Hitung persentase kehadiran dari data backend
  const presentCount = metrics.presentToday + metrics.lateToday;
  const presentPercentage = metrics.totalEmployees > 0 
    ? Math.round((presentCount / metrics.totalEmployees) * 100) 
    : 0;

  return (
    <div className="p-4 md:p-8">
      {/* Judul & Tombol Export */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">Today's HR snapshot.</p>
        </div>
        <button 
          onClick={() => alert("Mengunduh laporan... (Fitur ekspor segera siap)")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm"
        >
          <Download className="w-4 h-4 mr-2" /> Export Report
        </button>
      </div>

      {/* Deretan Kartu Statistik (Stats Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        
        {/* Total Employees Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Total Employees</p>
          <h3 className="text-3xl font-bold text-gray-800">{metrics.totalEmployees}</h3>
        </div>
        
        {/* Present Today Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative">
          <div className="absolute top-6 right-6 bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded">
            {presentPercentage}%
          </div>
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Present Today</p>
          <h3 className="text-3xl font-bold text-gray-800">{presentCount}</h3>
        </div>
        
        {/* Late Today Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mb-4">
            <Clock className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Late Today</p>
          <h3 className="text-3xl font-bold text-gray-800">{metrics.lateToday}</h3>
        </div>
        
        {/* Pending Leave Card */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-5 h-5" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending Leave</p>
          <h3 className="text-3xl font-bold text-gray-800">{metrics.pendingLeaves}</h3>
        </div>
      </div>

      {/* Area Grafik */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 text-lg">Attendance Trends</h3>
          <select className="border border-gray-300 text-gray-700 text-sm rounded-lg px-3 py-1.5 outline-none bg-white">
            <option>Last 7 Days</option>
          </select>
        </div>
        <div className="w-full h-64 bg-gray-50 rounded-lg flex items-end justify-between px-4 sm:px-8 pb-4 pt-8 border border-dashed border-gray-300 gap-2 overflow-x-auto">
          {attendanceTrends.length > 0 ? attendanceTrends.map((trend, i) => {
             // Find max to scale bars
             const maxCount = Math.max(...attendanceTrends.map(t => Math.max(1, (t.on_time || 0) + (t.late || 0) + (t.leaves || 0))));
             const onTimeHeight = `${((trend.on_time || 0) / maxCount) * 100}%`;
             const lateHeight = `${((trend.late || 0) / maxCount) * 100}%`;
             const leavesHeight = `${((trend.leaves || 0) / maxCount) * 100}%`;
             
             const dateObj = new Date(trend.date);
             const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

             return (
               <div key={i} className="flex flex-col items-center justify-end h-full w-12 group relative">
                 {/* Tooltip */}
                 <div className="absolute -top-10 bg-gray-800 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                   On Time: {trend.on_time || 0} <br/> Late: {trend.late || 0}
                 </div>
                 <div className="w-full bg-gray-200 rounded-t flex flex-col justify-end overflow-hidden flex-1 relative">
                    <div style={{ height: onTimeHeight }} className="bg-green-500 w-full transition-all duration-500 rounded-t z-20"></div>
                    <div style={{ height: lateHeight }} className="bg-yellow-400 w-full transition-all duration-500 z-10"></div>
                    <div style={{ height: leavesHeight }} className="bg-purple-500 w-full transition-all duration-500"></div>
                 </div>
                 <span className="text-xs text-gray-500 mt-2 font-medium">{dayName}</span>
               </div>
             );
          }) : (
             <div className="w-full h-full flex items-center justify-center text-gray-400 italic">No attendance data for the last 7 days.</div>
          )}
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center text-xs text-gray-600"><span className="w-3 h-3 bg-green-500 rounded-sm mr-2"></span> On Time</div>
          <div className="flex items-center text-xs text-gray-600"><span className="w-3 h-3 bg-yellow-400 rounded-sm mr-2"></span> Late</div>
          <div className="flex items-center text-xs text-gray-600"><span className="w-3 h-3 bg-purple-500 rounded-sm mr-2"></span> Leaves/Sick</div>
        </div>
      </div>

      {/* Tabel Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-8">
        <div className="flex justify-between items-center p-4 md:p-6 border-b border-gray-200">
          <h3 className="font-bold text-gray-800 text-lg">Recent Activity</h3>
          <Link to="/hrd/kehadiran" className="text-blue-600 text-sm font-medium hover:underline">View All</Link>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                <th className="px-6 py-4 font-semibold">Employee</th>
                <th className="px-6 py-4 font-semibold">Action</th>
                <th className="px-6 py-4 font-semibold">Time</th>
                <th className="px-6 py-4 font-semibold text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {recentActivities.length > 0 ? (
                recentActivities.map((act, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center">
                      <div className="w-8 h-8 bg-gray-800 text-white rounded-full flex items-center justify-center text-xs font-bold mr-3 uppercase">
                        {act.name ? act.name.substring(0, 2) : "US"}
                      </div>
                      <span className="font-semibold text-gray-800">{act.name}</span>
                    </td>
                    <td className="px-6 py-4">{act.action}</td>
                    <td className="px-6 py-4">{act.time || "-"}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        act.status === 'ON_TIME' ? 'bg-blue-600 text-white' : 'bg-red-100 text-red-600 font-bold'
                      }`}>
                        {act.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Belum ada aktivitas hari ini.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DashboardHRD;