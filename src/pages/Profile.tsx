import { useState, useRef, ChangeEvent } from 'react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Phone, Mail, Building, Briefcase, Clock, ChevronRight, Save, X, Loader2, Camera } from 'lucide-react';

/**
 * Komponen Halaman Profil (Profile Component)
 * Menampilkan informasi data diri pengguna serta menyediakan fungsi untuk mengubah detail kontak dan mengunggah foto profil baru.
 */
export default function Profile() {
  const user = useAppStore(state => state.user);
  const updateProfile = useAppStore(state => state.updateProfile);
  const logout = useAppStore(state => state.logout);
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: user?.phone || '',
    emergencyContact: user?.emergencyContact || '',
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mengeluarkan (Sign Out) pengguna saat ini dan menavigasikan kembali ke halaman login
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Menyimpan informasi kontak yang baru saja diperbarui
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Menangani proses pengunggahan file dan pembaruan foto profil pengguna
  const handlePhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        setIsLoading(true);
        try {
          await updateProfile({ photoUrl: reader.result as string });
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-full bg-[#F8FAFC] text-slate-800">
      {/* Bagian Header yang berisi Avatar pengguna dan tombol/fitur unggah foto */}
      <div className="bg-white px-6 pt-6 pb-8 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Profil</h1>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-20 h-20 bg-slate-100 rounded-full border-4 border-white shadow-sm overflow-hidden flex-shrink-0 relative group">
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 text-white rounded-full border-2 border-white shadow-sm flex items-center justify-center transition-transform active:scale-95"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef} 
              onChange={handlePhotoUpload} 
              className="hidden" 
            />
          </div>
          <div>
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">{user.name}</h2>
            <p className="text-[13px] text-slate-400 font-bold tracking-wider mt-px">ID: {user.employeeId}</p>
          </div>
        </div>
      </div>

      {/* Area Konten Utama */}
      <div className="px-6 py-6 space-y-6">
        {/* Bagian Informasi Pekerjaan (Hanya-Baca / Read-only) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <span className="w-1 h-3 bg-blue-600 rounded-full"></span>
            Informasi Pekerjaan
          </h3>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                <Building className="w-5 h-5" />
              </div>
              <div className="flex-1 border-b border-slate-100 pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Departemen</p>
                <p className="font-bold text-slate-900">{user.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                <Briefcase className="w-5 h-5" />
              </div>
              <div className="flex-1 border-b border-slate-100 pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Posisi</p>
                <p className="font-bold text-slate-900">{user.position}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jadwal Kerja</p>
                <p className="font-bold text-slate-900">{user.schedule}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bagian Detail Kontak (Bisa Diedit / Editable) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-1 h-3 bg-blue-600 rounded-full"></span>
              Detail Kontak
            </h3>
            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="text-blue-600 text-[10px] font-bold uppercase tracking-wider hover:text-blue-700"
              >
                Ubah
              </button>
            ) : (
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-slate-500 hover:text-slate-700"
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleSave}
                  className="text-blue-600 hover:text-blue-700 flex items-center"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 border-b border-slate-100 pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                <p className="font-bold text-slate-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-slate-50 text-slate-500 rounded-xl flex items-center justify-center shrink-0 border border-slate-100">
                <Phone className="w-5 h-5" />
              </div>
              <div className="flex-1 border-b border-slate-100 pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Telepon</p>
                {isEditing ? (
                  <input 
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-bold text-slate-900">{user.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
                <UserIcon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kontak Darurat</p>
                {isEditing ? (
                  <input 
                    type="tel"
                    value={formData.emergencyContact}
                    onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <p className="font-bold text-slate-900">{user.emergencyContact}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Aksi: Keluar / Sign Out */}
        <button 
          onClick={handleLogout}
          className="w-full bg-white text-red-600 rounded-2xl p-4 font-bold shadow-sm border border-slate-200 flex items-center justify-center gap-2 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Keluar
        </button>
      </div>
    </div>
  );
}
