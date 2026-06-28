import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, MOCK_USER } from '../store';
import { Briefcase, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const navigate = useNavigate();
  const login = useAppStore(state => state.login);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !password) return;
    
    setLoading(true);
    try {
      await login(MOCK_USER);
      navigate('/home', { replace: true });
    } catch (error) {
      console.error('Login failed', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-full bg-white flex flex-col px-6">
      <div className="flex-1 flex flex-col justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">SmartWork</h1>
          <p className="text-slate-500 font-medium">Masuk ke akun karyawan Anda</p>
        </motion.div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">ID Karyawan</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50"
              placeholder="contoh: EMP-0042"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Kata Sandi</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
              <span className="text-sm text-slate-600 font-medium">Ingat saya</span>
            </label>
            <button type="button" className="text-sm font-bold text-blue-600">
              Lupa kata sandi?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !employeeId || !password}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-xl shadow-blue-100"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Masuk
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>

      <div className="py-6 text-center">
        <button className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">
          Hubungi Bantuan IT
        </button>
      </div>
    </div>
  );
}
