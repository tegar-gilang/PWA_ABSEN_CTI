import { Outlet, useLocation } from 'react-router-dom';
import BottomNav from './BottomNav';
import { motion, AnimatePresence } from 'motion/react';
import { useNetworkState } from 'react-use';
import { AlertCircle } from 'lucide-react';

export default function Layout() {
  const location = useLocation();
  const noNavRoutes = ['/', '/login'];
  const showNav = !noNavRoutes.includes(location.pathname);
  const { online } = useNetworkState();

  return (
    <div className="h-full bg-[#F8FAFC] max-w-md mx-auto relative overflow-hidden flex flex-col font-sans">
      {!online && (
        <div className="bg-red-500 text-white text-xs font-bold text-center py-2 flex items-center justify-center gap-2 z-50 sticky top-0 uppercase tracking-wider">
          <AlertCircle className="w-4 h-4" />
          Anda sedang offline
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
