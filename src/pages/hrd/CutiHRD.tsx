import React, { useEffect, useState, useMemo } from 'react';
import { apiGetRequests, apiHrdGetRequests, apiHrdUpdateRequestStatus } from '@/src/lib/api';
import { id } from 'date-fns/locale';
import { set } from 'date-fns';

const CutiHRD: React.FC = () => {
  // Data pengajuan Izin/cuti
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Ambil data dari BE
  const fetchRequests = async () => {
    setLoading(true);
    try{
      const res = await apiHrdGetRequests();
      setRequests(res.requests || []);
    } catch (err){
      console.error("Gagal memuat data cuti:", err);
    }finally{
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Hitung stat
  const stats = useMemo(() => {
    return{
      pending: requests.filter((r) => r.status === 'PENDING').length,
      approved: requests.filter((r) => r.status === 'APPROVED' || r.status === 'DISETUJUI').length,
      rejected: requests.filter((r) => r.status === 'REJECTED' || r.status === 'DITOLAK').length,
    };
  }, [requests]);

  // Fungsi tombol Approve / Reject
  const handleStatusChange = async (id: string, newStatus: "APPROVED" | "REJECTED") => {
    const isConfirm = window.confirm(`Apakah Andaa yakin ingin melakukan ${newStatus} pada pengajuan ini?`);
    if(!isConfirm) return;
    try{
      await apiHrdUpdateRequestStatus(id, newStatus);
      setRequests((prev) =>
      prev.map((req) => (req.id === id ? {...req, status: newStatus} : req)));
    }catch(error){
      console.error("Gagal memperbarui status:", error);
      alert("Gagal memperbarui status pengajuan. Silakan coba lagi.");
    }
  };

  return (
    <div className="p-8">
      
      {/* Judul & Tombol Export */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen Cuti</h2>
          <p className="text-gray-500 mt-2 text-sm">Review and manage employee leave requests.</p>
        </div>
        <button 
          onClick={() => alert("Mengunduh laporan cuti...")}
          className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm"
        >
          <span className="mr-2">📥</span> Export to Excel
        </button>
      </div>

      {/* Tiga Kartu Ringkasan (Summary Cards) Dinamis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card: Pending */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center text-2xl mr-4">
            📋
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.pending}</h3>
          </div>
        </div>

        {/* Card: Approved */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl mr-4">
            ✅
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Approved</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.approved}</h3>
          </div>
        </div>

        {/* Card: Rejected */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center text-2xl mr-4">
            ❌
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rejected</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.rejected}</h3>
          </div>
        </div>
      </div>

      {/* Tabel Data Cuti */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs font-semibold tracking-wide border-b border-gray-200">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Reason (Type & Description)</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">
                    Memuat data pengajuan cuti/izin...
                  </td>
                </tr>
              ) : requests.length > 0 ? (
                requests.map((req, index) => {
                  // Inisial Avatar
                  const initials = req.name
                    ? req.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                    : 'US';

                  // Penentuan Warna Berdasarkan Status
                  const statusUpper = req.status?.toUpperCase() || 'PENDING';
                  let statusClass = "bg-gray-100 text-gray-600 border border-gray-200";
                  let dotClass = "bg-gray-400";
                  let isPending = true;

                  if (statusUpper === 'APPROVED' || statusUpper === 'DISETUJUI') {
                    statusClass = "bg-blue-100 text-blue-700 border border-blue-200";
                    dotClass = "bg-blue-500";
                    isPending = false;
                  } else if (statusUpper === 'REJECTED' || statusUpper === 'DITOLAK') {
                    statusClass = "bg-red-100 text-red-600 border border-red-200";
                    dotClass = "bg-red-500";
                    isPending = false;
                  }

                  return (
                    <tr key={req.id || index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center">
                        <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3">
                          {initials}
                        </div>
                        <span className="font-semibold text-gray-800">{req.name || 'Tanpa Nama'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-800">{req.type || 'Lainnya'}</p>
                        <p className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={req.reason}>
                          {req.reason || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800">{req.date}</p>
                        <p className="text-xs text-gray-500 mt-1">1 Day</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${statusClass} px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center`}>
                          <span className={`w-2 h-2 rounded-full ${dotClass} mr-2`}></span> {req.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleStatusChange(req.id, "APPROVED")}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button 
                              onClick={() => handleStatusChange(req.id, "REJECTED")}
                              className="bg-red-700 hover:bg-red-800 text-white px-4 py-1.5 rounded-md text-xs font-medium transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs font-medium">
                            Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Belum ada pengajuan cuti saat ini.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>
      
    </div>
  );
};

export default CutiHRD;