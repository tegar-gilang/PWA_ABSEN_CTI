import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppStore } from '../store';
import { ApiError, apiGetDepartments, apiGetPositions } from '../lib/api';
import { MasterDepartment, MasterPosition } from '../types';
import { Briefcase, ArrowRight, Loader2, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

// Daftar 15 Bagian resmi perusahaan CTI
const BAGIAN_LIST = [
  'Teknisi',
  'Helper',
  'Freelance',
  'Manager Marketing',
  'Marketing',
  'Admin Marketing',
  'Manager Teknik',
  'Admin Penjualan',
  'Admin Pembelian',
  'Admin Teknik',
  'Admin Piutang',
  'Manager HRD',
  'Admin HRD',
  'Admin Keuangan',
  'Admin Gudang'
];

/**
 * Komponen Halaman Pendaftaran (Signup).
 * Mendaftarkan akun karyawan baru ke backend (Express + MySQL), lalu otomatis login.
 */
export default function Signup() {
  const navigate = useNavigate();
  const signup = useAppStore(state => state.signup);
  
  // State untuk penanda pemrosesan (loading)
  const [loading, setLoading] = useState(false);
  const [loadingMasters, setLoadingMasters] = useState(false);

  // Master data
  const [departments, setDepartments] = useState<MasterDepartment[]>([]);
  const [positions, setPositions] = useState<MasterPosition[]>([]);

  // State untuk form input
  const [name, setName] = useState('');
  const [nik, setNik] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [idDepartment, setIdDepartment] = useState('');
  // Posisi/Jabatan di-hide dulu untuk registrasi
  const [idPosition, setIdPosition] = useState('');
  const [password, setPassword] = useState('');

  // State untuk menampilkan pesan error dari backend
  const [error, setError] = useState('');
  
  // State untuk toggle lihat sandi
  const [showPassword, setShowPassword] = useState(false);

  // Susun daftar pilihan bagian berdasarkan BAGIAN_LIST
  const bagianOptions = React.useMemo(() => {
    return BAGIAN_LIST.map(bName => {
      const match = departments.find(d => d.name.toLowerCase() === bName.toLowerCase());
      return {
        id: match ? match.id : bName,
        name: bName
      };
    });
  }, [departments]);

  // Ambil data master departemen dan posisi saat komponen dimuat
  useEffect(() => {
    let isMounted = true;
    setLoadingMasters(true);
    Promise.all([
      apiGetDepartments().catch(() => ({ departments: [] })),
      apiGetPositions().catch(() => ({ positions: [] }))
    ]).then(([deptRes, posRes]) => {
      if (!isMounted) return;
      const fetchedDepts = deptRes.departments || [];
      setDepartments(fetchedDepts);
      setPositions(posRes.positions || []);

      // Pilih default bagian pertama (Teknisi)
      const firstBagian = fetchedDepts.find(d => d.name.toLowerCase() === BAGIAN_LIST[0].toLowerCase());
      if (firstBagian) {
        setIdDepartment(firstBagian.id);
      } else if (fetchedDepts.length > 0) {
        setIdDepartment(fetchedDepts[0].id);
      } else {
        setIdDepartment(BAGIAN_LIST[0]);
      }

      if (posRes.positions && posRes.positions.length > 0) {
        setIdPosition(posRes.positions[0].id);
      }
    }).finally(() => {
      if (isMounted) setLoadingMasters(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Menangani pengiriman form pendaftaran.
   */
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !nik || !email || !password) return;

    if (!/^\d+$/.test(nik)) {
      setError('NIK hanya boleh berisi angka.');
      return;
    }
    
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
      const selectedBagian = bagianOptions.find(b => b.id === idDepartment || b.name === idDepartment);

      await signup({ 
        name, 
        nik, 
        email,
        phone: phone || undefined,
        id_department: selectedBagian?.id !== selectedBagian?.name ? selectedBagian?.id : undefined,
        department: selectedBagian?.name || undefined,
        // Posisi di-hide: kirim default atau biarkan backend menentukan posisi default
        id_position: idPosition || undefined,
        password 
      });
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
          className="mb-8"
        >
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mb-5 shadow-lg shadow-blue-200">
            <UserPlus className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-1">Daftar Akun</h1>
          <p className="text-slate-500 font-medium text-sm">Buat akun karyawan baru</p>
        </motion.div>

        <form onSubmit={handleSignup} className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Nama Lengkap</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50 text-sm"
              placeholder="contoh: Budi Santoso"
              required
            />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">NIK</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={16}
                value={nik}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setNik(val);
                }}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50 text-sm font-mono"
                placeholder="contoh: 3201012345670001"
                required
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Nomor HP / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50 text-sm"
                placeholder="contoh: 08123456789"
                required
              />
            </motion.div>
          </div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50 text-sm"
              placeholder="contoh: budi@cti.co.id"
              required
            />
          </motion.div>

          {/* Field Bagian (Menggantikan Divisi, Posisi/Jabatan di-hide sesuai permintaan) */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Bagian</label>
            {bagianOptions.length > 0 ? (
              <select
                value={idDepartment}
                onChange={(e) => setIdDepartment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 bg-slate-50 text-sm cursor-pointer"
              >
                {bagianOptions.map((b) => (
                  <option key={b.id || b.name} value={b.id || b.name}>{b.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={idDepartment}
                onChange={(e) => setIdDepartment(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50 text-sm"
                placeholder="contoh: Teknisi"
                required
              />
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">Kata Sandi</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-slate-900 placeholder-slate-400 bg-slate-50 text-sm"
                placeholder="•••••••• (minimal 6 karakter)"
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

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <button
              type="submit"
              disabled={loading || !name || !nik || !password}
              className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-2xl py-3.5 font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-3 shadow-xl shadow-blue-100"
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
          className="mt-6 mb-8 text-center"
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
