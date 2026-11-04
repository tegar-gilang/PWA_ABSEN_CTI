import React from 'react';
import { LogOut } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  role?: 'EMPLOYEE' | 'ADMIN';
}

export const LogoutConfirmModal: React.FC<LogoutConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  role = 'EMPLOYEE'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-0">
      {/* Backdrop with blur animation - covering full screen including bottom navbar */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={isLoading ? undefined : onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-sm sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 transform transition-all duration-300 scale-100 animate-in fade-in zoom-in-95">
        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-red-50/80 via-red-50/30 to-transparent pointer-events-none" />

        <div className="p-6 sm:p-8 flex flex-col items-center text-center relative z-10">
          {/* Animated Icon Circle */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-red-500 to-rose-400 text-white flex items-center justify-center shadow-lg shadow-red-500/25 mb-5 ring-8 ring-red-50">
            <LogOut className="w-8 h-8 sm:w-10 sm:h-10 ml-1" />
          </div>

          {/* Title & Subtitle */}
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
            Konfirmasi Keluar
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed max-w-xs mb-6">
            {role === 'ADMIN'
              ? 'Anda akan keluar dari sesi Admin HRD. Pastikan semua perubahan data telah tersimpan.'
              : 'Apakah Anda yakin ingin keluar dari akun? Anda perlu masuk kembali untuk mengakses fitur absensi.'}
          </p>

          {/* Action Buttons */}
          <div className="w-full flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200/80 text-slate-700 font-bold rounded-xl transition-all duration-150 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl shadow-md shadow-red-500/30 transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  <span>Ya, Keluar</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogoutConfirmModal;
