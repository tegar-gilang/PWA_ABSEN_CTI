import React, { useEffect, useState, useMemo } from 'react';
import { apiHrdGetRequests, apiHrdUpdateRequestStatus } from '@/src/lib/api';
// Import ikon-ikon dari lucide-react
import { 
  Download, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Check, 
  X,
  AlertTriangle,
  Loader2
} from 'lucide-react';

const CutiHRD: React.FC = () => {
  // Data pengajuan Izin/cuti
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal Penolakan (Reject Modal)
  const [rejectModalItem, setRejectModalItem] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string>('');
  const [isSubmittingReject, setIsSubmittingReject] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Ambil data dari BE
  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiHrdGetRequests();
      setRequests(res.requests || []);
    } catch (err) {
      console.error("Gagal memuat data cuti:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Hitung stat
  const stats = useMemo(() => {
    return {
      pending: requests.filter((r) => r.status === 'PENDING').length,
      approved: requests.filter((r) => r.status === 'APPROVED' || r.status === 'DISETUJUI').length,
      rejected: requests.filter((r) => r.status === 'REJECTED' || r.status === 'DITOLAK').length,
    };
  }, [requests]);

  // Tombol Approve
  const handleApprove = async (reqItem: any) => {
    const isConfirm = window.confirm(`Apakah Anda yakin ingin menyetujui (APPROVE) pengajuan ${reqItem.type || 'cuti'} dari ${reqItem.name || 'karyawan ini'}?`);
    if (!isConfirm) return;

    try {
      await apiHrdUpdateRequestStatus(reqItem.id, "APPROVED");
      setRequests((prev) =>
        prev.map((req) => (req.id === reqItem.id ? { ...req, status: "APPROVED" } : req))
      );
      showToast(`Pengajuan ${reqItem.name} berhasil disetujui.`);
    } catch (error) {
      console.error("Gagal memperbarui status:", error);
      alert("Gagal memperbarui status pengajuan. Silakan coba lagi.");
    }
  };

  // Buka Modal Reject
  const handleOpenRejectModal = (reqItem: any) => {
    setRejectModalItem(reqItem);
    setRejectionReason('');
    setRejectError('');
  };

  // Konfirmasi Penolakan dengan Alasan
  const handleConfirmReject = async () => {
    if (!rejectionReason.trim()) {
      setRejectError("Alasan penolakan wajib diisi.");
      return;
    }

    if (!rejectModalItem) return;

    setIsSubmittingReject(true);
    setRejectError('');

    try {
      await apiHrdUpdateRequestStatus(rejectModalItem.id, "REJECTED", rejectionReason.trim());
      setRequests((prev) =>
        prev.map((req) =>
          req.id === rejectModalItem.id
            ? { ...req, status: "REJECTED", rejection_reason: rejectionReason.trim() }
            : req
        )
      );
      showToast(`Pengajuan ${rejectModalItem.name} telah ditolak.`);
      setRejectModalItem(null);
      setRejectionReason('');
    } catch (error) {
      console.error("Gagal menolak pengajuan:", error);
      setRejectError("Gagal mengirim penolakan ke server. Silakan coba lagi.");
    } finally {
      setIsSubmittingReject(false);
    }
  };

  return (
    <div className="p-4 md:p-8 relative w-full font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 text-sm transition-all duration-300">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Judul & Tombol Export */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Manajemen Cuti</h2>
          <p className="text-gray-500 mt-2 text-sm">Review and manage employee leave requests.</p>
        </div>
        <button 
          onClick={() => alert("Mengunduh laporan cuti...")}
          className="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center shadow-sm w-full sm:w-auto justify-center"
        >
          <Download className="w-4 h-4 mr-2" /> Export to Excel
        </button>
      </div>

      {/* Tiga Kartu Ringkasan (Summary Cards) Dinamis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card: Pending */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-gray-100 text-gray-600 rounded-xl flex items-center justify-center mr-4">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Pending</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.pending}</h3>
          </div>
        </div>

        {/* Card: Approved */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mr-4">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Approved</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.approved}</h3>
          </div>
        </div>

        {/* Card: Rejected */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center">
          <div className="w-14 h-14 bg-red-100 text-red-600 rounded-xl flex items-center justify-center mr-4">
            <XCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Rejected</p>
            <h3 className="text-3xl font-bold text-gray-800">{stats.rejected}</h3>
          </div>
        </div>
      </div>

      {/* Tabel Data Cuti */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs font-semibold tracking-wide border-b border-gray-200">
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Deskripsi</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-400 font-medium animate-pulse">
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

                  let typeLabel = req.type || 'Lainnya';
                  const typeUpper = req.type?.toUpperCase();
                  if (typeUpper === 'LEAVE') typeLabel = 'Cuti';
                  else if (typeUpper === 'PERMISSION') typeLabel = 'Izin';
                  else if (typeUpper === 'SICK') typeLabel = 'Sakit';
                  else if (typeUpper === 'OVERTIME') typeLabel = 'Lembur';

                  return (
                    <tr key={req.id || index} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 flex items-center">
                        <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-semibold mr-3 shadow-sm">
                          {initials}
                        </div>
                        <span className="font-semibold text-gray-800">{req.name || 'Tanpa Nama'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-800 inline-block px-3 py-1 bg-gray-100 rounded-full text-xs">{typeLabel}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-600 max-w-xs truncate" title={req.reason}>
                          {req.reason || '-'}
                        </p>
                        {statusUpper === 'REJECTED' && req.rejection_reason && (
                          <div className="mt-1.5 text-xs text-red-700 bg-red-50 px-2.5 py-1 rounded-md border border-red-200 max-w-xs">
                            <span className="font-semibold">Alasan Ditolak:</span> {req.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-800 font-medium">
                          {req.end_date && req.end_date !== req.date ? `${req.date} s/d ${req.end_date}` : req.date}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {req.end_date && req.end_date !== req.date 
                            ? `${Math.max(1, Math.round((new Date(req.end_date).getTime() - new Date(req.date).getTime()) / (1000 * 60 * 60 * 24)) + 1)} Days`
                            : '1 Day'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`${statusClass} px-3 py-1.5 rounded-full text-xs font-medium inline-flex items-center shadow-sm`}>
                          <span className={`w-2 h-2 rounded-full ${dotClass} mr-2`}></span> {req.status || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isPending ? (
                          <div className="flex justify-end space-x-2">
                            <button 
                              onClick={() => handleApprove(req)}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center shadow-sm cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Approve
                            </button>
                            <button 
                              onClick={() => handleOpenRejectModal(req)}
                              className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-md text-xs font-medium transition-colors inline-flex items-center shadow-sm cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs font-medium italic">
                            Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 font-medium">
                    Belum ada pengajuan cuti saat ini.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PENOLAKAN DENGAN ALASAN */}
      {rejectModalItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-200">
            
            {/* Header Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Tolak Pengajuan Izin/Cuti</h3>
                  <p className="text-xs text-gray-500">Berikan alasan sebelum menolak pengajuan ini</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6 space-y-4">
              {/* Ringkasan Pengajuan */}
              <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Karyawan:</span>
                  <span className="font-semibold text-gray-800">{rejectModalItem.name || 'Tanpa Nama'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Jenis & Tanggal:</span>
                  <span className="font-medium text-gray-800">
                    {rejectModalItem.type || 'Cuti'} • {rejectModalItem.end_date && rejectModalItem.end_date !== rejectModalItem.date ? `${rejectModalItem.date} s/d ${rejectModalItem.end_date}` : rejectModalItem.date}
                  </span>
                </div>
                {rejectModalItem.reason && (
                  <div className="pt-1 border-t border-gray-200/60">
                    <span className="text-gray-500 block mb-0.5">Alasan Karyawan:</span>
                    <p className="text-gray-700 italic bg-white p-2 rounded border border-gray-100">{rejectModalItem.reason}</p>
                  </div>
                )}
              </div>

              {/* Input Alasan Penolakan */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  Alasan Penolakan dari HRD <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectError) setRejectError('');
                  }}
                  placeholder="Contoh: Kuota cuti habis, jadwal mendesak pada shift ini, atau dokumen pendukung belum lengkap..."
                  className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-colors"
                />
                {rejectError && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{rejectError}</p>
                )}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end space-x-3 px-6 py-4 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setRejectModalItem(null)}
                disabled={isSubmittingReject}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={isSubmittingReject}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors inline-flex items-center shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {isSubmittingReject ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-1.5" />
                    Konfirmasi Penolakan
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
      
    </div>
  );
};

export default CutiHRD;