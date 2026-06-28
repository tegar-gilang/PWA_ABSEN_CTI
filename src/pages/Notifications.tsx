import { useState } from 'react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { AnimatePresence, motion } from 'motion/react';
import { Notification } from '../types';

export default function Notifications() {
  const navigate = useNavigate();
  const notifications = useAppStore(state => state.notifications);
  const markAsRead = useAppStore(state => state.markNotificationRead);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const getIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'WARNING': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      default: return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'SUCCESS': return 'bg-green-50 border-green-100';
      case 'WARNING': return 'bg-orange-50 border-orange-100';
      default: return 'bg-blue-50 border-blue-100';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setSelectedNotification(notification);
  };

  return (
    <div className="min-h-full bg-[#F8FAFC]">
      <div className="px-4 pt-16 pb-4 flex items-center gap-4 border-b border-slate-200 sticky top-0 bg-white z-10">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
        <h1 className="text-xl font-bold text-slate-900">Notifikasi</h1>
      </div>

      <div className="divide-y divide-slate-100 bg-white min-h-full pb-24">
        {notifications.length === 0 ? (
          <div className="text-center py-24 px-6">
            <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
              <Bell className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-slate-900 font-bold mb-2">Belum ada notifikasi</h3>
            <p className="text-slate-500 text-sm font-medium">Anda sudah melihat semuanya!</p>
          </div>
        ) : (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              onClick={() => handleNotificationClick(notification)}
              className={`p-6 flex gap-4 cursor-pointer transition-colors ${!notification.isRead ? 'bg-blue-50/50' : 'hover:bg-slate-50'}`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${getBgColor(notification.type)}`}>
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex justify-between items-start mb-1.5">
                  <h4 className={`text-sm ${!notification.isRead ? 'font-bold text-slate-900' : 'font-bold text-slate-700'}`}>
                    {notification.title}
                  </h4>
                  {!notification.isRead && (
                    <div className="w-2.5 h-2.5 bg-blue-600 rounded-full mt-1.5 shrink-0 shadow-sm shadow-blue-200"></div>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-3 leading-relaxed font-medium line-clamp-2">{notification.description}</p>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2rem] z-[70] flex flex-col max-h-[85vh] border-t border-slate-200 shadow-2xl"
            >
              <div className="flex justify-between items-center p-6 shrink-0 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">
                  Detail Notifikasi
                </h3>
                <button onClick={() => setSelectedNotification(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors shrink-0">
                  <X className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto pb-safe flex-1">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className={`w-20 h-20 rounded-3xl flex items-center justify-center shrink-0 border mb-6 ${getBgColor(selectedNotification.type)}`}>
                    {getIcon(selectedNotification.type)}
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">{selectedNotification.title}</h2>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {format(new Date(selectedNotification.createdAt), 'dd MMM yyyy, HH:mm')}
                  </p>
                </div>
                
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="text-slate-700 leading-relaxed font-medium">
                    {selectedNotification.description}
                  </p>
                </div>
                
                <div className="mt-8 pb-4">
                  <button
                    onClick={() => setSelectedNotification(null)}
                    className="w-full py-4 rounded-2xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition-colors"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
