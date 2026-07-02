import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { MapPin, AlertCircle, Loader2, CheckCircle2, Camera, RefreshCw, X, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'motion/react';

type Step = 'INITIAL' | 'LOCATING' | 'LOCATION_FOUND' | 'CAPTURING' | 'PREVIEW' | 'SUBMITTING' | 'SUCCESS';

/**
 * Attendance Component
 * Handles the logic for checking in and checking out.
 * Includes GPS geolocation fetching, camera capture, and file upload fallback for verification.
 */
export default function Attendance() {
  const navigate = useNavigate();
  
  // State (Status) untuk mengelola tahapan proses absensi yang memiliki beberapa langkah (multi-step)
  const [step, setStep] = useState<Step>('INITIAL');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  // Refs untuk menyimpan referensi aliran media (kamera) dan input file (unggah foto)
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Aksi-aksi untuk mengubah status global (Zustand Store)
  const checkIn = useAppStore(state => state.checkIn);
  const checkOut = useAppStore(state => state.checkOut);
  const history = useAppStore(state => state.attendanceHistory);
  
  // Memeriksa status absensi pengguna untuk hari ini
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysRecord = history.find(r => r.date === today);
  const isCheckedIn = !!todaysRecord?.checkInTime && !todaysRecord?.checkOutTime;
  const isCheckedOut = !!todaysRecord?.checkOutTime;

  const watchIdRef = useRef<number | null>(null);

  // Menghubungkan aliran gambar kamera (stream) ke elemen video pada saat pengambilan foto (capturing)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, step]);

  // Membersihkan memori dari stream kamera dan layanan GPS saat komponen ditutup/dilepas (unmount)
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [stream]);

  // Menangani pengunggahan foto alternatif dari penyimpanan internal perangkat jika kamera tidak digunakan
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        setStep('PREVIEW'); // Pindah ke tahapan pratinjau (preview) foto
      };
      reader.readAsDataURL(file);
    }
  };

  // Memulai inisialisasi kamera untuk pengambilan foto secara langsung (live)
  const startCamera = async () => {
    try {
      setError('');
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user' }, 
        audio: false 
      });
      setStream(mediaStream);
      setStep('CAPTURING');
    } catch (err: any) {
      setError('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
    }
  };

  // Mengambil gambar dari bingkai video saat ini (current frame) dan menyimpannya sebagai file JPEG terkompresi
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      // Melakukan kompresi ringan dengan membatasi ukuran resolusi maksimum
      let width = videoRef.current.videoWidth;
      let height = videoRef.current.videoHeight;
      const maxWidth = 800;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setPhotoUrl(dataUrl);
        
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
          setStream(null);
        }
        
        setStep('PREVIEW');
      }
    }
  };

  // Menutup akses kamera dan kembali ke tahapan sebelumnya (lokasi ditemukan)
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStep('LOCATION_FOUND');
  };

  // Memulai proses verifikasi dengan mencari titik koordinat lokasi GPS pengguna saat tombol ditekan
  const startProcess = () => {
    setError('');
    // Ubah state ke LOCATING agar indikator loading (teks 'Memproses Lokasi...') muncul
    setStep('LOCATING');
    
    if ('geolocation' in navigator) {
      // Opsi Geolocation sesuai permintaan: akurasi tinggi, batas waktu 10 detik, dan tanpa cache
      const geoOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };

      // Callback jika berhasil mendapatkan lokasi
      const successCallback = (position: GeolocationPosition) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        // Lanjut ke tahap berikutnya setelah lokasi ditemukan
        setStep((prev) => prev === 'LOCATING' ? 'LOCATION_FOUND' : prev);
      };

      // Callback jika gagal mendapatkan lokasi (misal: ditolak pengguna atau timeout)
      const errorCallback = (err: GeolocationPositionError) => {
        console.warn('Geolocation error:', err.message);
        
        // Pesan error spesifik sesuai permintaan
        const errorMsg = 'Gagal Absen! Anda wajib mengaktifkan GPS dan mengizinkan akses lokasi pada browser ini untuk melakukan absensi.';
        
        // Tampilkan peringatan pop-up
        window.alert(errorMsg);
        
        // Tampilkan pesan error di UI dan kembalikan state ke awal (tombol kembali semula)
        setError(errorMsg);
        setStep('INITIAL');
      };

      // Memanggil fungsi Geolocation API browser untuk meminta koordinat saat itu juga
      navigator.geolocation.getCurrentPosition(successCallback, errorCallback, geoOptions);
    } else {
      // Handling jika browser tidak mendukung fitur Geolocation
      const errorMsg = 'Gagal Absen! Browser Anda tidak mendukung fitur lokasi.';
      window.alert(errorMsg);
      setError(errorMsg);
      setStep('INITIAL');
    }
  };

  // Mengirimkan catatan kehadiran akhir (check-in atau check-out) menuju sistem penyimpanan global (store)
  const handleSubmit = async () => {
    try {
      setStep('SUBMITTING');
      
      const recordData = {
        location: location || { lat: 0, lng: 0 },
        photoUrl: photoUrl || '',
        ...(isCheckedIn ? {
          checkOutLocation: location || { lat: 0, lng: 0 },
          checkOutPhotoUrl: photoUrl || '',
        } : {
          checkInLocation: location || { lat: 0, lng: 0 },
          checkInPhotoUrl: photoUrl || '',
        })
      };

      if (isCheckedIn) {
        await checkOut(recordData);
      } else {
        await checkIn(recordData);
      }
      
      setStep('SUCCESS');
    } catch (err) {
      setError('Gagal mengirim absensi. Silakan coba lagi.');
      setStep('PREVIEW');
    }
  };

  // Jika pengguna sudah selesai (check-out) untuk hari ini, tampilkan halaman status sukses/selesai
  if (isCheckedOut) {
    return (
      <div className="flex-1 bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
          <CheckCircle2 className="w-12 h-12 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 mb-2">Shift Selesai</h2>
        <p className="text-slate-500 mb-10 font-medium">Anda telah berhasil melakukan absen pulang untuk hari ini. Kerja bagus!</p>
        <button 
          onClick={() => navigate('/home')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-blue-100 transition-all active:scale-[0.98]"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  // Antarmuka UI khusus untuk kamera saat mengambil foto langsung (live)
  if (step === 'CAPTURING') {
    return (
      <div className="flex-1 bg-black flex flex-col p-6 pt-6 text-white pb-safe relative">
        <button onClick={closeCamera} className="absolute top-16 right-6 p-2 bg-white/20 rounded-full z-20 hover:bg-white/30 transition-colors">
          <X className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-2xl font-bold mb-6 text-center z-10">Ambil Foto</h1>
        <div className="flex-1 relative rounded-3xl overflow-hidden bg-gray-900 mb-8 border border-gray-800 flex items-center justify-center">
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {/* Grid overlay for better framing */}
          <div className="absolute inset-0 border-2 border-white/10 pointer-events-none"></div>
          <div className="absolute inset-0 flex flex-col justify-between opacity-30 pointer-events-none">
            <div className="w-full h-[33%] border-b border-white"></div>
            <div className="w-full h-[33%] border-b border-white"></div>
          </div>
          <div className="absolute inset-0 flex justify-between opacity-30 pointer-events-none">
            <div className="h-full w-[33%] border-r border-white"></div>
            <div className="h-full w-[33%] border-r border-white"></div>
          </div>
        </div>
        
        <div className="flex justify-center pb-8">
          <button
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white/50 flex items-center justify-center bg-white/10 backdrop-blur-md active:scale-95 transition-all"
          >
            <div className="w-16 h-16 bg-white rounded-full shadow-lg"></div>
          </button>
        </div>
      </div>
    );
  }

  // Antarmuka UI untuk tahap sukses/berhasil setelah data absensi terkirim
  if (step === 'SUCCESS') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 bg-blue-900 flex flex-col items-center justify-center p-8 text-center text-white relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-800 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2"></div>
        
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
            className="w-24 h-24 bg-blue-800/50 rounded-full border-2 border-blue-400 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(59,130,246,0.5)] backdrop-blur-sm"
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold mb-3 tracking-tight"
          >
            Sukses!
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-blue-200 text-lg mb-10 font-medium"
          >
            Anda telah berhasil absen {isCheckedIn ? 'pulang' : 'masuk'}.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white/10 rounded-[2rem] p-6 w-full backdrop-blur-md border border-white/10 shadow-2xl mb-12 space-y-4"
          >
            <div className="flex justify-between items-center">
              <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">Waktu Server</span>
              <span className="font-bold text-xl">{format(new Date(), 'HH:mm:ss')}</span>
            </div>
            <div className="w-full h-px bg-white/10"></div>
            <div className="flex justify-between items-center">
              <span className="text-blue-300 text-xs font-bold uppercase tracking-wider">Tanggal</span>
              <span className="font-bold">{format(new Date(), 'dd MMM yyyy', { locale: id })}</span>
            </div>
            {location && (
              <>
                <div className="w-full h-px bg-white/10"></div>
                <div className="flex justify-between items-center text-left">
                  <span className="text-blue-300 text-xs font-bold uppercase tracking-wider w-1/3">Lokasi GPS</span>
                  <span className="font-mono text-xs text-blue-100 truncate w-2/3 text-right">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                </div>
              </>
            )}
          </motion.div>
          
          <motion.button 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={() => navigate('/home')}
            className="w-full bg-white text-blue-900 py-4 rounded-2xl font-bold shadow-xl hover:bg-slate-50 active:scale-95 transition-all text-lg"
          >
            Kembali ke Beranda
          </motion.button>
        </div>
      </motion.div>
    );
  }

  // Antarmuka UI untuk tahap pratinjau (preview) foto sebelum dikonfirmasi pengirimannya
  if (step === 'PREVIEW' && photoUrl) {
    return (
      <div className="flex-1 bg-black flex flex-col p-6 pt-6 text-white pb-safe">
        <h1 className="text-2xl font-bold mb-6">Konfirmasi Foto</h1>
        <div className="flex-1 relative rounded-3xl overflow-hidden bg-gray-900 mb-8 border border-gray-800">
          <img src={photoUrl} alt="Preview" className="w-full h-full object-contain" />
        </div>
        
        {error && (
          <div className="mb-4 text-xs text-red-200 bg-red-900/50 p-3 rounded-xl border border-red-800 flex gap-2 items-start font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={startCamera}
            disabled={step === 'SUBMITTING'}
            className="flex-1 py-4 rounded-2xl font-medium text-white bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Ulangi
          </button>
          <button
            onClick={handleSubmit}
            disabled={step === 'SUBMITTING'}
            className="flex-1 py-4 rounded-2xl font-bold text-gray-900 bg-white hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {step === 'SUBMITTING' ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            Kirim
          </button>
        </div>
      </div>
    );
  }

  // Antarmuka UI default (Entry View) saat baru membuka halaman Absensi
  return (
    <div className="flex-1 bg-[#F8FAFC] p-6 flex flex-col pt-6 text-slate-800 pb-safe">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        {isCheckedIn ? 'Absen Pulang' : 'Absen Masuk'}
      </h1>
      <p className="text-slate-500 mb-8 font-medium">Silakan selesaikan verifikasi kehadiran Anda.</p>

      {/* Kartu Verifikasi Utama */}
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 mb-8 flex-1">
        <div className="space-y-8">
          
          {/* Bagian Lokasi GPS */}
          <div className="flex items-start gap-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${step === 'LOCATING' ? 'bg-blue-50 text-blue-600 border border-blue-100' : location ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
              <MapPin className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-1">Lokasi GPS</h3>
              {location ? (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 mt-2 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Koordinat Saat Ini</span>
                  <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                    {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Kami memerlukan lokasi Anda untuk memverifikasi bahwa Anda berada dalam radius yang diizinkan.</p>
              )}
              {error && error.includes('lokasi') && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-100 flex flex-col gap-2 font-medium">
                  <div className="flex gap-2 items-start">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full h-px bg-slate-100 ml-17"></div>
          
          {/* Bagian Verifikasi Identitas (Foto) */}
          <div className={`flex items-start gap-5 ${step === 'INITIAL' || step === 'LOCATING' ? 'opacity-50' : ''}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${step === 'LOCATION_FOUND' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
              <Camera className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-1">Verifikasi Identitas</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Ambil foto langsung atau unggah foto untuk memvalidasi keberadaan pada lokasi</p>
              {error && error.includes('kamera') && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-100 flex gap-2 items-start font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Aksi (Bawah) */}
      {step === 'LOCATION_FOUND' ? (
        <div className="flex gap-3">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
          />
          <button
            onClick={startCamera}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
          >
            <Camera className="w-6 h-6" />
            Kamera
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-[0.6] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-2xl py-5 font-bold text-lg flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <Upload className="w-6 h-6" />
            Unggah
          </button>
        </div>
      ) : (
        <button
          onClick={startProcess}
          disabled={step === 'LOCATING'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
        >
          {step === 'LOCATING' && <Loader2 className="w-5 h-5 animate-spin" />}
          {step === 'LOCATING' ? 'Memproses Lokasi...' : `Mulai Absen ${isCheckedIn ? 'Pulang' : 'Masuk'}`}
        </button>
      )}
    </div>
  );
}
