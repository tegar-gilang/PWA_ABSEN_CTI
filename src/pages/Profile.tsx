import { useState } from 'react';
import { useAppStore } from '../store';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon, Phone, Mail, Building, Briefcase, Clock, ChevronRight, Save, X, Loader2 } from 'lucide-react';

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

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateProfile(formData);
      setIsEditing(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-full bg-[#F8FAFC] text-slate-800">
      <div className="bg-white px-6 pt-16 pb-8 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Profil</h1>
        
        <div className="flex items-center gap-5">
          <div className="relative">
            <div className="w-20 h-20 bg-slate-100 rounded-full border-4 border-white shadow-sm overflow-hidden flex-shrink-0">
              <img src={user.photoUrl} alt={user.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{user.name}</h2>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{user.position}</p>
            <p className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">ID: {user.employeeId}</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
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
