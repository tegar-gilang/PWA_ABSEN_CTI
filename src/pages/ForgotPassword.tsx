import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, Loader2, KeyRound, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

export default function ForgotPassword() {
  const navigate = useNavigate();
  
  // State untuk mengontrol alur: 1 = Input Email, 2 = Input OTP & Password Baru
  const [step, setStep] = useState<1 | 2>(1);
  
  // State Form
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // State Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Handler Langkah 1: Kirim Email OTP
  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Sesuaikan URL ini jika port backend-mu berbeda (misal 4000 atau 5000)
      const res = await fetch('http://localhost:4000/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengirim email.');
      }

      setSuccess('Kode OTP berhasil dikirim ke email Anda!');
      setStep(2); // Lanjut ke langkah 2
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan pada server.');
    } finally {
      setLoading(false);
    }
  };

  // Handler Langkah 2: Verifikasi OTP & Ubah Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || newPassword.length < 6) {
      setError('Harap isi OTP dan pastikan kata sandi minimal 6 karakter.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch('http://localhost:4000/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Gagal mengubah kata sandi.');
      }

      setSuccess('Kata sandi berhasil diubah! Mengalihkan ke halaman login...');
      
      // Tunggu 2 detik agar user sempat membaca pesan sukses, lalu pindah ke login
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan pada server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full max-w-md md:max-w-2xl lg:max-w-4xl mx-auto bg-white flex flex-col px-6 overflow-y-auto no-scrollbar pb-safe">
      <div className="flex-1 flex flex-col justify-center py-6">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <button 
            onClick={() => step === 2 ? setStep(1) : navigate('/login')}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center mb-6 hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">
            {step === 1 ? 'Lupa Kata Sandi?' : 'Buat Sandi Baru'}
          </h1>
          <p className="text-slate-500 font-medium">
            {step === 1 
              ? 'Masukkan email Anda dan kami akan mengirimkan kode 6 digit untuk memulihkan akun.'
              : `Masukkan kode yang kami kirimkan ke ${email}`
            }
          </p>
        </motion.div>

        {/* Notifikasi Error / Sukses */}
        {error && (
          <div className="mb-6 text-sm text-red-700 bg-red-50 p-4 rounded-xl border border-red-100 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 text-sm text-green-700 bg-green-50 p-4 rounded-xl border border-green-100 font-medium">
            {success}
          </div>
        )}

        {/* Form Berdasarkan Langkah */}
        {step === 1 ? (
          // LANGKAH 1: FORM EMAIL
          <form onSubmit={handleRequestOTP} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Email Akun</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50"
                  placeholder="budi@cti.co.id"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-xl shadow-blue-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Kirim Kode OTP <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>
        ) : (
          // LANGKAH 2: FORM OTP DAN PASSWORD BARU
          <form onSubmit={handleResetPassword} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Kode OTP 6 Digit</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <KeyRound className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full pl-11 pr-4 py-3 text-center tracking-[0.5em] text-xl font-bold rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-300 bg-slate-50"
                  placeholder="000000"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Kata Sandi Baru</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50"
                  placeholder="Minimal 6 karakter"
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
            </div>

            <button
              type="submit"
              disabled={loading || otp.length < 6 || newPassword.length < 6}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl py-4 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-xl shadow-blue-100"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Simpan Kata Sandi Baru'
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}