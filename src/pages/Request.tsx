import React, { useState } from 'react';
import { useAppStore } from '../store';
import { FileText, Send, CheckCircle2, FileClock, Clock, Loader2 } from 'lucide-react';
import { RequestType } from '../types';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';

export default function Request() {
  const submitRequest = useAppStore(state => state.submitRequest);
  const requests = useAppStore(state => state.requests);
  
  const [activeTab, setActiveTab] = useState<'NEW' | 'HISTORY'>('NEW');
  const [type, setType] = useState<RequestType>('LEAVE');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await submitRequest({
        type,
        date,
        reason,
      });
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setDate('');
        setReason('');
        setActiveTab('HISTORY');
      }, 2000);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'APPROVED': return 'bg-green-50 text-green-700 border-green-200';
      case 'REJECTED': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="min-h-full bg-[#F8FAFC] text-slate-800">
      <div className="bg-white px-6 pt-16 pb-4 sticky top-0 z-10 border-b border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Permohonan</h1>
        
        <div className="flex p-1 bg-slate-100 rounded-xl">
          <button 
            onClick={() => setActiveTab('NEW')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'NEW' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Permohonan Baru
          </button>
          <button 
            onClick={() => setActiveTab('HISTORY')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === 'HISTORY' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
          >
            Riwayat
          </button>
        </div>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'NEW' ? (
            <motion.div 
              key="new"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {submitted ? (
                <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-200">
                  <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Permohonan Terkirim</h3>
                  <p className="text-slate-500 font-medium text-sm">Permohonan Anda telah dikirim untuk persetujuan.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Jenis Permohonan</label>
                    <div className="grid grid-cols-2 gap-3">
                      {(['LEAVE', 'SICK', 'PERMISSION', 'OVERTIME'] as RequestType[]).map(t => (
                        <div 
                          key={t}
                          onClick={() => setType(t)}
                          className={`px-4 py-3 rounded-xl border text-center font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors ${type === t ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-200'}`}
                        >
                          {t === 'LEAVE' ? 'Cuti' : t === 'SICK' ? 'Sakit' : t === 'PERMISSION' ? 'Izin' : 'Lembur'}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Tanggal</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 bg-slate-50 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-wider">Alasan</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      required
                      rows={3}
                      placeholder="Sebutkan alasan..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 resize-none bg-slate-50 font-medium"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={!date || !reason || isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all mt-4 shadow-xl shadow-blue-100 disabled:opacity-70 disabled:shadow-none"
                  >
                    {isLoading ? 'Mengirim...' : 'Kirim Permohonan'}
                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </form>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {requests.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileClock className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-slate-900 font-bold mb-1">Belum ada permohonan</h3>
                  <p className="text-slate-500 text-sm font-medium">Permohonan Anda yang terkirim akan muncul di sini.</p>
                </div>
              ) : (
                requests.map(req => (
                  <div key={req.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 border ${getStatusColor(req.status)}`}>
                          {req.status === 'APPROVED' ? 'Disetujui' : req.status === 'REJECTED' ? 'Ditolak' : 'Menunggu'}
                        </span>
                        <h4 className="font-bold text-slate-900 text-lg uppercase tracking-wide">
                          {req.type === 'LEAVE' ? 'Cuti' : req.type === 'SICK' ? 'Sakit' : req.type === 'PERMISSION' ? 'Izin' : 'Lembur'}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">{format(new Date(req.date), 'dd MMM yyyy', { locale: id })}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-100 font-medium leading-relaxed">{req.reason}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-4 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Dikirim {format(new Date(req.createdAt), 'dd MMM, HH:mm', { locale: id })}
                    </p>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
