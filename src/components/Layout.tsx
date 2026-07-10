import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import { useNetworkState } from 'react-use';
import { AlertCircle } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const noNavRoutes = ['/', '/login', '/hrd/dashboard'];
  const showNav = !noNavRoutes.includes(location.pathname);
  const { online } = useNetworkState();

  return (
    <div className="h-full bg-[#F8FAFC] w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto relative overflow-hidden flex flex-col font-sans">
      {!online && (
        <div className="absolute left-0 right-0 z-50 flex justify-center pointer-events-none px-4" style={{ top: 'calc(0.5rem + env(safe-area-inset-top))' }}>
          <div className="bg-slate-800/95 backdrop-blur-md text-white text-[10px] py-2 px-4 rounded-2xl flex flex-col items-center justify-center shadow-xl shadow-slate-900/20 border border-slate-700 pointer-events-auto w-fit max-w-[90%]">
            <div className="flex items-center gap-1.5 uppercase tracking-wider font-bold mb-0.5 text-amber-400">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Offline Mode</span>
            </div>
            <span className="font-medium text-slate-300 text-center leading-tight">Absensi Anda masuk antrean sinkronisasi</span>
          </div>
        </div>
      )}
      <main className="flex-1 overflow-y-auto pb-24 relative no-scrollbar">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="min-h-full flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      {showNav && <BottomNav />}
    </div>
  );
}
