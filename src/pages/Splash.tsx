import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { Briefcase } from 'lucide-react';
import { motion } from 'motion/react';

export default function Splash() {
  const navigate = useNavigate();
  const isAuthenticated = useAppStore(state => state.isAuthenticated);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        navigate('/home', { replace: true });
      } else {
        navigate('/login', { replace: true });
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-full bg-white">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col items-center"
      >
        <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-6 shadow-xl shadow-blue-200">
          <Briefcase className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">SmartWork</h1>
        <p className="text-xs text-slate-500 mt-2 font-bold uppercase tracking-wider">Operasi SDM Terintegrasi</p>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-16 w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      />
    </div>
  );
}
