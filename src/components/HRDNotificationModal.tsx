import React, { useState, useEffect } from 'react';
import { X, Plus, Users, User, Clock, Loader2, Trash2 } from 'lucide-react';
import { getToken } from '../lib/api';

interface HRDNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationLog {
  title: string;
  description: string;
  type: string;
  is_global: boolean;
  created_at: string;
  target_user_id: string;
}

interface Employee {
  id: string;
  name: string;
  nik: string;
}

const HRDNotificationModal: React.FC<HRDNotificationModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetUserId: 'ALL'
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/hrd/notifications', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch('http://localhost:4000/api/hrd/employees', {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      setEmployees(data.employees || data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('http://localhost:4000/api/hrd/notifications', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Gagal mengirim informasi.');
      
      setIsCreating(false);
      setFormData({ title: '', description: '', targetUserId: 'ALL' });
      fetchLogs();
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim informasi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (title: string, description: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus informasi ini?')) return;
    try {
      const res = await fetch('http://localhost:4000/api/hrd/notifications', {
        method: 'DELETE',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getToken()}` 
        },
        body: JSON.stringify({ title, description })
      });
      if (res.ok) {
        fetchLogs();
      } else {
        alert('Gagal menghapus informasi.');
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menghapus informasi.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Pusat Informasi HRD</h2>
            <p className="text-sm text-slate-500 mt-1">Kelola dan kirim pengumuman ke karyawan.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {isCreating ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Judul Informasi</label>
                <input 
                  type="text" 
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Misal: Rapat Umum"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Penerima</label>
                <select 
                  value={formData.targetUserId}
                  onChange={e => setFormData({ ...formData, targetUserId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="ALL">Semua Karyawan (Broadcast)</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.nik})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Isi Pesan / Deskripsi</label>
                <textarea 
                  required
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Ketik isi pengumuman..."
                ></textarea>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsCreating(false)}
                  className="flex-1 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Kirim Informasi'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => setIsCreating(true)}
                className="w-full py-4 border-2 border-dashed border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center gap-2 font-bold transition-colors"
              >
                <Plus className="w-5 h-5" /> Buat Informasi Baru
              </button>

              <div className="mt-6">
                <h3 className="font-bold text-slate-800 mb-3">Riwayat Terkirim</h3>
                {loading ? (
                  <div className="text-center py-8 text-slate-400"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
                ) : logs.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 bg-white rounded-2xl border border-slate-100">
                    Belum ada informasi yang dikirim.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {logs.map((log, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex gap-4 items-start">
                        <div className={`p-2 rounded-xl shrink-0 ${log.is_global ? 'bg-indigo-100 text-indigo-600' : 'bg-orange-100 text-orange-600'}`}>
                          {log.is_global ? <Users className="w-6 h-6" /> : <User className="w-6 h-6" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2 pr-2 overflow-hidden">
                              <h4 className="font-bold text-slate-800 truncate">{log.title}</h4>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${log.is_global ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                {log.is_global ? 'ALL' : 'SPESIFIK'}
                              </span>
                            </div>
                            <button 
                              onClick={() => handleDelete(log.title, log.description)}
                              className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition-colors shrink-0"
                              title="Hapus Informasi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-sm text-slate-600 line-clamp-2">{log.description}</p>
                          <div className="flex items-center gap-1 mt-2 text-[11px] text-slate-400 font-medium">
                            <Clock className="w-3 h-3" /> {log.created_at}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRDNotificationModal;
