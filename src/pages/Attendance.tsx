import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store';
import { ApiError, apiGetAttendanceLocations } from '../lib/api';
import { classifyAccuracy, accuracyQualityLabel, accuracyQualityColorClasses, haversineDistanceMeters } from '../lib/geo';
import { HospitalLocation } from '../types';
import MiniMap from '../components/MiniMap';
import { MapPin, AlertCircle, Loader2, CheckCircle2, Camera, RefreshCw, X, Navigation, Building2, Hospital } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'motion/react';

type Step = 'INITIAL' | 'LOCATING' | 'LOCATION_FOUND' | 'CAPTURING' | 'PREVIEW' | 'SUBMITTING' | 'SUCCESS';

// Akurasi GPS (meter) yang ingin dicapai sebelum berhenti memantau lokasi lebih lanjut.
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
  
  // State (Status) untuk mengelola tahapan proses absensi
  const [step, setStep] = useState<Step>('INITIAL');
  const [location, setLocation] = useState<{lat: number, lng: number, accuracy: number | null} | null>(null);
  const [error, setError] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  
  // Lokasi penugasan yang dipisah state-nya
  const [officesList, setOfficesList] = useState<HospitalLocation[]>([]);
  const [hospitalsList, setHospitalsList] = useState<HospitalLocation[]>([]);
  
  const [locationMode, setLocationMode] = useState<'OFFICE' | 'HOSPITAL' | 'CUSTOM'>('OFFICE');
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>('');
  const [customLocationName, setCustomLocationName] = useState<string>('');

  // Pilihan aktif tergantung mode yang dipilih
  const activeSelectedId = locationMode === 'OFFICE' ? selectedOfficeId : selectedHospitalId;
  const activeList = locationMode === 'OFFICE' ? officesList : hospitalsList;
  const selectedLocationItem = activeList.find(item => item.id === activeSelectedId);

  const locationDistance = (location && selectedLocationItem) 
    ? Math.round(haversineDistanceMeters(location.lat, location.lng, selectedLocationItem.latitude, selectedLocationItem.longitude))
    : null;
  const isWithinRadius = (locationDistance != null && selectedLocationItem)
    ? locationDistance <= selectedLocationItem.radius_meters
    : null;

  // Ref untuk mengumpulkan semua sampel lokasi (Jitter Analysis)
  const locationHistoryRef = useRef<{lat: number, lng: number}[]>([]);
  
  // Refs untuk menyimpan referensi aliran media (kamera) dan input file
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Aksi-aksi untuk mengubah status global (Zustand Store)
  const checkIn = useAppStore(state => state.checkIn);
  const checkOut = useAppStore(state => state.checkOut);
  const history = useAppStore(state => state.attendanceHistory);
  const office = useAppStore(state => state.office); 
  
  // Memeriksa status absensi pengguna untuk hari ini
  const today = format(new Date(), 'yyyy-MM-dd');
  const todaysRecord = history.find(r => r.date === today);
  const isCheckedIn = !!todaysRecord?.checkInTime && !todaysRecord?.checkOutTime;
  const isCheckedOut = !!todaysRecord?.checkOutTime;

  // Memuat daftar Kantor dan Rumah Sakit secara terpisah dari API dengan filter type
  useEffect(() => {
    // Ambil data Kantor
    apiGetAttendanceLocations('kantor' as any)
      .then(res => {
        if (res && res.locations) {
          setOfficesList(res.locations);
          if (res.locations.length > 0) {
            setSelectedOfficeId(res.locations[0].id);
          }
        }
      })
      .catch(err => console.error("Gagal memuat lokasi kantor:", err));

    // Ambil data Rumah Sakit
    apiGetAttendanceLocations('rumah_sakit' as any)
      .then(res => {
        if (res && res.locations) {
          setHospitalsList(res.locations);
          if (res.locations.length > 0) {
            setSelectedHospitalId(res.locations[0].id);
          }
        }
      })
      .catch(err => console.error("Gagal memuat lokasi rumah sakit:", err));
  }, []);

  const watchIdRef = useRef<number | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);

  // Menghubungkan aliran gambar kamera (stream) ke elemen video
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream, step]);

  // Membersihkan memori dari stream kamera dan layanan GPS saat komponen ditutup
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

  // Memulai inisialisasi kamera
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

  // Mengambil gambar dari bingkai video saat ini
  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
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

  // Menutup akses kamera
  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setStep('LOCATION_FOUND');
  };

  // Memulai proses verifikasi dengan mencari titik koordinat GPS
  const startProcess = async () => {
    setError('');
    setStep('LOCATING');
    locationHistoryRef.current = [];

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

    const onPosition = (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      locationHistoryRef.current.push({ lat: latitude, lng: longitude });

      if (accuracy <= bestAccuracySoFar) {
        bestAccuracySoFar = accuracy;
        setLocation({ lat: latitude, lng: longitude, accuracy });
      }
    };

    const onError = (err: GeolocationPositionError) => {
      console.warn('Geolocation error:', err.message);
      stopWatching();
      const errorMsg = 'Gagal Absen! Anda wajib mengaktifkan GPS dan mengizinkan akses lokasi pada browser ini.';
      window.alert(errorMsg);
      setError(errorMsg);
      setStep('INITIAL');
    };

    watchIdRef.current = navigator.geolocation.watchPosition(onPosition, onError, geoOptions);

    const SAMPLING_DURATION_MS = 4000;
    
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
    }, SAMPLING_DURATION_MS);
  };

  // Mengirimkan catatan kehadiran akhir ke backend
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
        history: locationHistoryRef.current,
        // Kirim ID Rumah Sakit jika mode HOSPITAL, atau ID Kantor jika mode OFFICE (jika BE mendukung, atau sesuaikan parameter)
        hospitalId: !isCheckedIn && locationMode === 'HOSPITAL' ? selectedHospitalId : (!isCheckedIn && locationMode === 'OFFICE' ? selectedOfficeId : null),
        customLocationName: !isCheckedIn 
          ? (locationMode === 'CUSTOM' ? (customLocationName.trim() || 'Lokasi Khusus') : (locationMode === 'OFFICE' ? (selectedLocationItem?.nama_rs || selectedLocationItem?.name || 'Kantor') : (selectedLocationItem?.nama_rs || selectedLocationItem?.name || 'Rumah Sakit'))) 
          : null,
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
      if (err instanceof ApiError && (err.code === 'LOW_ACCURACY' || err.code === 'OUT_OF_RADIUS')) {
        setStep('LOCATION_FOUND');
      } else {
        setStep('PREVIEW');
      }
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

  if (step === 'SUCCESS') {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 bg-blue-900 flex flex-col items-center justify-center p-8 text-center text-white relative overflow-hidden"
      >
        <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
          <div className="w-24 h-24 bg-blue-800/50 rounded-full border-2 border-blue-400 flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(59,130,246,0.5)] backdrop-blur-sm">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-4xl font-bold mb-3 tracking-tight">Sukses!</h2>
          <p className="text-blue-200 text-lg mb-10 font-medium">
            Anda telah berhasil absen {isCheckedIn ? 'pulang' : 'masuk'}.
          </p>
          <button 
            onClick={() => navigate('/home')}
            className="w-full bg-white text-blue-900 py-4 rounded-2xl font-bold shadow-xl hover:bg-slate-50 active:scale-95 transition-all text-lg"
          >
            Kembali ke Beranda
          </button>
        </div>
      </motion.div>
    );
  }

  if ((step === 'PREVIEW' || step === 'SUBMITTING') && photoUrl) {
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

  return (
    <div className="flex-1 bg-[#F8FAFC] p-6 flex flex-col pt-6 text-slate-800 pb-safe">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">
        {isCheckedIn ? 'Absen Pulang' : 'Absen Masuk'}
      </h1>
      <p className="text-slate-500 mb-6 font-medium">Silakan selesaikan verifikasi kehadiran Anda.</p>

      {/* Kartu Verifikasi Utama */}
      <div className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm border border-slate-200 mb-8 flex-1 space-y-7">
        
        {/* Pilihan Penugasan Lokasi */}
        {!isCheckedIn && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Lokasi Penugasan Kerja</h3>
            </div>

            {/* Opsi Tab Lokasi */}
            <div className="grid grid-cols-3 gap-2 mb-3 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setLocationMode('OFFICE')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  locationMode === 'OFFICE' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                Kantor
              </button>

              <button
                type="button"
                onClick={() => setLocationMode('HOSPITAL')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  locationMode === 'HOSPITAL' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Hospital className="w-3.5 h-3.5" />
                Rumah Sakit
              </button>

              <button
                type="button"
                onClick={() => setLocationMode('CUSTOM')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  locationMode === 'CUSTOM' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                Khusus
              </button>
            </div>

            {/* Dropdown Khusus KANTOR */}
            {locationMode === 'OFFICE' && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-bold text-blue-900">Pilih Kantor Tujuan:</label>
                <select
                  value={selectedOfficeId}
                  onChange={(e) => setSelectedOfficeId(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {officesList.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nama_rs || o.name}
                    </option>
                  ))}
                </select>

                {selectedLocationItem && (
                  <div className="text-xs space-y-1 text-slate-600">
                    <p className="text-slate-500">{selectedLocationItem.address || 'Alamat Kantor'}</p>
                    {locationDistance !== null && (
                      <div className="pt-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          isWithinRadius ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isWithinRadius ? '✓ Dalam Radius' : '⚠️ Di Luar Radius Kantor'} (Jarak: {locationDistance} m / Maks: {selectedLocationItem.radius_meters} m)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dropdown Khusus RUMAH SAKIT */}
            {locationMode === 'HOSPITAL' && (
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-bold text-blue-900">Pilih Rumah Sakit Tujuan:</label>
                <select
                  value={selectedHospitalId}
                  onChange={(e) => setSelectedHospitalId(e.target.value)}
                  className="w-full bg-white border border-blue-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {hospitalsList.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.nama_rs || h.name}
                    </option>
                  ))}
                </select>

                {selectedLocationItem && (
                  <div className="text-xs space-y-1 text-slate-600">
                    <p className="text-slate-500">{selectedLocationItem.address || 'Alamat RS'}</p>
                    {locationDistance !== null && (
                      <div className="pt-1">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg font-bold text-[11px] ${
                          isWithinRadius ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {isWithinRadius ? '✓ Dalam Radius' : '⚠️ Di Luar Radius RS'} (Jarak: {locationDistance} m / Maks: {selectedLocationItem.radius_meters} m)
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Input Lokasi CUSTOM */}
            {locationMode === 'CUSTOM' && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-700">Nama Lokasi Penugasan Lapangan:</label>
                <input
                  type="text"
                  value={customLocationName}
                  onChange={(e) => setCustomLocationName(e.target.value)}
                  placeholder="contoh: Puskesmas Gambir / Lab Medika"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            <div className="w-full h-px bg-slate-100 mt-6"></div>
          </div>
        )}

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

                  <MiniMap checkInLocation={location} office={office} />
                </div>
              ) : step === 'LOCATING' ? (
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Menyempurnakan akurasi lokasi Anda, mohon tunggu sebentar...</p>
              ) : (
                <p className="text-xs text-slate-500 font-medium leading-relaxed">Kami akan merekam koordinat lokasi Anda saat ini sebagai titik absen.</p>
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
              <p className="text-xs text-slate-500 font-medium leading-relaxed">Ambil foto langsung untuk memvalidasi keberadaan pada lokasi</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tombol Aksi (Bawah) */}
      {step === 'LOCATION_FOUND' ? (
        <div className="flex gap-3">
          <button
            onClick={startCamera}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-5 font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98]"
          >
            <Camera className="w-6 h-6" />
            Kamera
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