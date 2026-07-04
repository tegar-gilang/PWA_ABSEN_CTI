import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { ApiError } from '../lib/api';
import { classifyAccuracy, accuracyQualityLabel, accuracyQualityColorClasses } from '../lib/geo';
import MiniMap from '../components/MiniMap';
import { MapPin, AlertCircle, Loader2, CheckCircle2, Camera, RefreshCw, X, Upload, Navigation } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'motion/react';

type Step = 'INITIAL' | 'LOCATING' | 'LOCATION_FOUND' | 'CAPTURING' | 'PREVIEW' | 'SUBMITTING' | 'SUCCESS';

// Akurasi GPS (meter) yang ingin dicapai sebelum berhenti memantau lokasi lebih lanjut.
// Jika sudah lebih baik dari ini, kita berhenti lebih awal daripada menunggu penuh.
const TARGET_ACCURACY_METERS = 20;
// Batas waktu maksimum (ms) untuk terus memperbaiki akurasi GPS via watchPosition sebelum lanjut dengan bacaan terbaik.
const MAX_WATCH_DURATION_MS = 8000;

/**
 * Attendance Component
 * Handles the logic for checking in and checking out.
 * Includes GPS geolocation fetching, camera capture, and file upload fallback for verification.
 */
export default function Attendance() {
  const navigate = useNavigate();
  
  // State (Status) untuk mengelola tahapan proses absensi yang memiliki beberapa langkah (multi-step)
  const [step, setStep] = useState<Step>('INITIAL');
  const [location, setLocation] = useState<{lat: number, lng: number, accuracy: number | null} | null>(null);
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
  const office = useAppStore(state => state.office); // titik & radius geofencing kantor, untuk tampilan jarak
  
  // Memeriksa status absensi pengguna untuk hari ini
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysRecord = history.find(r => r.date === today);
  const isCheckedIn = !!todaysRecord?.checkInTime && !todaysRecord?.checkOutTime;
  const isCheckedOut = !!todaysRecord?.checkOutTime;

  const watchIdRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

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
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
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

  // Memulai proses verifikasi dengan mencari titik koordinat lokasi GPS pengguna saat tombol ditekan.
  // Menggunakan watchPosition (bukan hanya getCurrentPosition sekali) agar akurasi GPS terus
  // membaik selama beberapa detik sebelum digunakan - perangkat mobile umumnya butuh waktu
  // untuk beralih dari sinyal jaringan/wifi kasar ke sinyal satelit GPS yang lebih presisi.
  const startProcess = () => {
    setError('');
    setStep('LOCATING');

    if (!('geolocation' in navigator)) {
      const errorMsg = 'Gagal Absen! Browser Anda tidak mendukung fitur lokasi.';
      window.alert(errorMsg);
      setError(errorMsg);
      setStep('INITIAL');
      return;
    }

    const geoOptions: PositionOptions = { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 };
    let bestAccuracySoFar = Infinity;
    let stopped = false;

    const stopWatching = () => {
      if (stopped) return;
      stopped = true;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (fallbackTimerRef.current) {
        clearTimeout(fallbackTimerRef.current);
        fallbackTimerRef.current = null;
      }
    };

    // Callback tiap kali browser mengirimkan pembacaan lokasi baru (bisa terpanggil berkali-kali)
    const onPosition = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;

      // Hanya perbarui state jika pembacaan ini lebih akurat (angka accuracy lebih kecil = lebih presisi)
      if (accuracy <= bestAccuracySoFar) {
        bestAccuracySoFar = accuracy;
        setLocation({ lat: latitude, lng: longitude, accuracy });
      }

      // Jika sudah cukup akurat, tidak perlu menunggu lebih lama lagi
      if (accuracy <= TARGET_ACCURACY_METERS) {
        stopWatching();
        setStep((prev) => (prev === 'LOCATING' ? 'LOCATION_FOUND' : prev));
      }
    };

    const onError = (err: GeolocationPositionError) => {
      console.warn('Geolocation error:', err.message);
      stopWatching();
      const errorMsg = 'Gagal Absen! Anda wajib mengaktifkan GPS dan mengizinkan akses lokasi pada browser ini untuk melakukan absensi.';
      window.alert(errorMsg);
      setError(errorMsg);
      setStep('INITIAL');
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, geoOptions);

    // Jika setelah beberapa detik akurasi belum mencapai target, tetap lanjutkan
    // dengan bacaan terbaik yang berhasil didapat (lebih baik daripada menunggu tanpa batas).
    fallbackTimerRef.current = window.setTimeout(() => {
      stopWatching();
      setStep((prev) => {
        if (prev !== 'LOCATING') return prev;
        if (bestAccuracySoFar === Infinity) {
          const errorMsg = 'Gagal mendapatkan lokasi GPS. Pastikan Anda berada di area terbuka dan coba lagi.';
          window.alert(errorMsg);
          setError(errorMsg);
          return 'INITIAL';
        }
        return 'LOCATION_FOUND';
      });
    }, MAX_WATCH_DURATION_MS);
  };

  // Mengirimkan catatan kehadiran akhir (check-in atau check-out) menuju backend.
  // Backend akan memvalidasi ulang akurasi GPS dan radius kantor (geofencing) demi keamanan data.
  const handleSubmit = async () => {
    if (!location) {
      setError('Lokasi GPS belum tersedia. Silakan ulangi proses absen.');
      setStep('LOCATION_FOUND');
      return;
    }

    try {
      setStep('SUBMITTING');

      const payload = {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy ?? 9999,
        photoUrl: photoUrl || null,
      };

      if (isCheckedIn) {
        await checkOut(payload);
      } else {
        await checkIn(payload);
      }

      setStep('SUCCESS');
    } catch (err) {
      console.error(err);
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Gagal mengirim absensi. Silakan coba lagi.';
      setError(message);
      // Untuk error terkait lokasi (akurasi rendah / di luar radius), kembalikan ke tahap lokasi
      // agar pengguna bisa mencoba mendapatkan sinyal GPS yang lebih baik.
      if (err instanceof ApiError && (err.code === 'LOW_ACCURACY' || err.code === 'OUT_OF_RADIUS')) {
        setStep('LOCATION_FOUND');
      } else {
        setStep('PREVIEW');
      }
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
                {location.accuracy != null && (
                  <div className="flex justify-between items-center text-left">
                    <span className="text-blue-300 text-xs font-bold uppercase tracking-wider w-1/3">Akurasi GPS</span>
                    <span className="font-mono text-xs text-blue-100 text-right">
                      ±{Math.round(location.accuracy)} m
                    </span>
                  </div>
                )}
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
                <div className="space-y-2 mt-2">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Koordinat Saat Ini</span>
                    <span className="font-mono text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded shadow-sm border border-slate-200">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </span>
                  </div>

                  {/* Indikator kualitas akurasi GPS - membantu pengguna tahu apakah perlu pindah ke area terbuka */}
                  {location.accuracy != null && (
                    <div className={`flex items-center justify-between rounded-xl p-3 border ${accuracyQualityColorClasses(classifyAccuracy(location.accuracy))}`}>
                      <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                        <Navigation className="w-3.5 h-3.5" />
                        Akurasi GPS
                      </span>
                      <span className="text-xs font-bold">
                        ±{Math.round(location.accuracy)} m &middot; {accuracyQualityLabel(classifyAccuracy(location.accuracy))}
                      </span>
                    </div>
                  )}

                  {/* Peta lokasi teknisi saat ini - lingkaran putus-putus menunjukkan radius akurasi GPS di titik tersebut.
                      Lokasi disimpan apa adanya (tidak dibatasi ke satu kantor), karena teknisi bekerja berpindah lokasi. */}
                  <MiniMap checkInLocation={location} office={office} />
                  <p className="text-[11px] text-slate-400 font-medium px-1">
                    Titik biru menandai lokasi Anda saat ini. Lingkaran putus-putus adalah radius akurasi GPS (±{location.accuracy ? Math.round(location.accuracy) : '-'} m) - lokasi ini yang akan tersimpan sebagai titik absen.
                  </p>
                </div>
              ) : step === 'LOCATING' ? (
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Menyempurnakan akurasi lokasi Anda, mohon tunggu sebentar...</p>
              ) : (
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Kami akan merekam koordinat lokasi Anda saat ini (latitude & longitude) sebagai titik absen, beserta radius akurasinya.</p>
              )}
              {error && (error.includes('lokasi') || error.includes('GPS') || error.includes('radius') || error.includes('akurasi')) && (
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
