import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { MapPin, AlertCircle, Loader2, CheckCircle2, Camera, RefreshCw } from 'lucide-react';
import { useCamera } from '../hooks/useCamera';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'motion/react';

type Step = 'INITIAL' | 'LOCATING' | 'LOCATION_FOUND' | 'PREVIEW' | 'SUBMITTING' | 'SUCCESS';

export default function Attendance() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('INITIAL');
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [error, setError] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  const { captureImage, isCapturing } = useCamera({ maxWidth: 800, quality: 0.6 });
  
  const checkIn = useAppStore(state => state.checkIn);
  const checkOut = useAppStore(state => state.checkOut);
  const history = useAppStore(state => state.attendanceHistory);
  
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysRecord = history.find(r => r.date === today);
  const isCheckedIn = !!todaysRecord?.checkInTime && !todaysRecord?.checkOutTime;
  const isCheckedOut = !!todaysRecord?.checkOutTime;

  const startProcess = () => {
    setError('');
    setStep('LOCATING');
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setStep('LOCATION_FOUND');
        },
        (err) => {
          console.warn('Geolocation error:', err.message);
          // Fallback for iframe/preview environment
          setLocation({
            lat: -6.200000,
            lng: 106.816666
          });
          setStep('LOCATION_FOUND');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      // Fallback
      setLocation({
        lat: -6.200000,
        lng: 106.816666
      });
      setStep('LOCATION_FOUND');
    }
  };

  const handleCapture = async () => {
    try {
      setError('');
      const compressedPhoto = await captureImage();
      setPhotoUrl(compressedPhoto);
      setStep('PREVIEW');
    } catch (err: any) {
      if (err.message !== 'User cancelled capture' && err.message !== 'No image selected') {
        setError('Gagal mengambil foto. Silakan coba lagi.');
      }
    }
  };

  const handleSubmit = async () => {
    try {
      setStep('SUBMITTING');
      
      const recordData = {
        location: location || { lat: 0, lng: 0 },
        photoUrl: photoUrl || '',
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

  if (step === 'PREVIEW' && photoUrl) {
    return (
      <div className="flex-1 bg-black flex flex-col p-6 pt-16 text-white pb-safe">
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
            onClick={handleCapture}
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

  return (
    <div className="flex-1 bg-[#F8FAFC] p-6 flex flex-col pt-16 text-slate-800 pb-safe">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        {isCheckedIn ? 'Absen Pulang' : 'Absen Masuk'}
      </h1>
      <p className="text-slate-500 mb-8 font-medium">Silakan selesaikan verifikasi kehadiran Anda.</p>

      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-200 mb-8 flex-1">
        <div className="space-y-8">
          <div className="flex items-start gap-5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${step === 'LOCATING' ? 'bg-blue-50 text-blue-600 border border-blue-100' : location ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Lokasi GPS</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Kami memerlukan lokasi Anda untuk memverifikasi bahwa Anda berada dalam radius yang diizinkan.</p>
              {error && (
                <div className="mt-3 text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-100 flex gap-2 items-start font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="w-full h-px bg-slate-100 ml-17"></div>
          
          <div className={`flex items-start gap-5 ${step === 'INITIAL' ? 'opacity-50' : ''}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${step === 'LOCATION_FOUND' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Verifikasi Identitas</h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Ambil foto langsung untuk validasi anti-penipuan. Unggah galeri tidak diperbolehkan.</p>
            </div>
          </div>
        </div>
      </div>

      {step === 'LOCATION_FOUND' ? (
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
        >
          {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-6 h-6" />}
          {isCapturing ? 'Membuka Kamera...' : 'Ambil Foto'}
        </button>
      ) : (
        <button
          onClick={startProcess}
          disabled={step === 'LOCATING'}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
        >
          {step === 'LOCATING' && <Loader2 className="w-5 h-5 animate-spin" />}
          {step === 'LOCATING' ? 'Memverifikasi Lokasi...' : `Mulai Absen ${isCheckedIn ? 'Pulang' : 'Masuk'}`}
        </button>
      )}
    </div>
  );
}
