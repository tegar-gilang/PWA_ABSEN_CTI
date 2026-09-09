import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { ApiError } from '../lib/api';
import { Briefcase, ArrowRight, Loader2, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

/**
 * Komponen Halaman Pendaftaran (Signup).
 * Mendaftarkan akun karyawan baru ke backend (Express + MySQL), lalu otomatis login.
 */
export default function Signup() {
  const navigate = useNavigate();
  const signup = useAppStore(state => state.signup);
  
  // State untuk penanda pemrosesan (loading)
  const [loading, setLoading] = useState(false);
  // State untuk form input
  const [name, setName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');
  // State untuk menampilkan pesan error dari backend (mis. ID Karyawan sudah terdaftar)
  const [error, setError] = useState('');
  
  // State untuk toggle lihat sandi
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Menangani pengiriman form pendaftaran.
   * Mengirim data ke backend untuk membuat akun baru, lalu otomatis login.
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !employeeId || !password || !department) return;
    
    if (password.length < 6) {
      setError('Kata sandi minimal harus 6 karakter.');
      return;
    }
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasLetter || !hasNumber) {
      setError('Kata sandi harus mengandung kombinasi huruf dan angka.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await signup({ name, employeeId, department, password });
      // Beralih ke halaman Beranda
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('Gagal mendaftar', err);
      setError(err instanceof ApiError ? err.message : 'Gagal terhubung ke server. Periksa koneksi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white flex flex-col px-6 overflow-y-auto no-scrollbar pb-safe">
      <div className="pt-6 pb-4 flex items-center shrink-0">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-slate-50 transition-colors">
          <ArrowLeft className="w-6 h-6 text-slate-900" />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center pb-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Daftar Akun</h1>
          <p className="text-slate-500 font-medium">Buat akun karyawan baru</p>
        </motion.div>

        <form onSubmit={handleSignup} className="space-y-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                e.target.setCustomValidity('');
              }}
              onInvalid={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.validity.valueMissing) {
                  target.setCustomValidity('Nama Lengkap wajib diisi.');
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50"
              placeholder="contoh: Budi Santoso"
              required
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">ID Karyawan</label>
            <input
              type="text"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                e.target.setCustomValidity('');
              }}
              onInvalid={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.validity.valueMissing) {
                  target.setCustomValidity('ID Karyawan wajib diisi.');
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50"
              placeholder="contoh: EMP-0042"
              required
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Divisi</label>
            <input
              type="text"
              value={department}
              onChange={(e) => {
                setDepartment(e.target.value);
                e.target.setCustomValidity('');
              }}
              onInvalid={(e) => {
                const target = e.target as HTMLInputElement;
                if (target.validity.valueMissing) {
                  target.setCustomValidity('Divisi wajib diisi.');
                }
              }}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50"
              placeholder="contoh: Teknisi"
              required
            />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  e.target.setCustomValidity('');
                }}
                onInvalid={(e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.validity.valueMissing) {
                    target.setCustomValidity('Kata sandi wajib diisi.');
                  } else if (target.validity.tooShort) {
                    target.setCustomValidity('Kata sandi minimal harus 6 karakter.');
                  }
                }}
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50"
                placeholder="••••••••"
                required
                minLength={6}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          {error && (
            <div className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-100 font-medium">
              {error}
            </div>
          )}

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <button
              type="submit"
              disabled={loading || !name || !employeeId || !password || !department}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-xl shadow-blue-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Daftar
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }}
          className="mt-8 mb-16 text-center"
        >
          <p className="text-sm text-slate-500 font-medium">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
              Masuk di sini
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
