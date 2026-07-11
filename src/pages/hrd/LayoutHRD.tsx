import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const LayoutHRD: React.FC = () => {
  const location = useLocation();

  // Fungsi kecil untuk mengecek apakah menu sedang aktif
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
        <div>
          {/* Logo Brand */}
          <div className="flex items-center p-6 border-b border-gray-200">
            <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-white font-bold mr-3">
              CTI
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">PT CTI</h1>
              <p className="text-xs text-gray-500">HR Admin System</p>
            </div>
          </div>

          {/* Menu Navigasi Dinamis */}
          <nav className="p-4 space-y-2">
            <Link 
              to="/hrd" 
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="mr-3">📊</span> Dashboard
            </Link>
            <Link 
              to="/hrd/kehadiran" 
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/kehadiran') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span className="mr-3">📅</span> Kehadiran
            </Link>
            <Link 
              to="/hrd/karyawan" 
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/karyawan') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
            <span className="mr-3">👥</span> Karyawan
            </Link>
          </nav>
        </div>

        {/* Tombol Logout */}
        <div className="p-4 border-t border-gray-200">
          <button className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 transition-colors w-full">
            <span className="mr-3">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* AREA KANAN */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-end items-center">
          <button className="text-gray-500 mr-6 relative">
            🔔
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          <div className="flex items-center border-l border-gray-300 pl-6">
            <div className="text-right mr-3">
              <p className="text-sm font-bold text-gray-800">Admin User</p>
              <p className="text-xs text-gray-500">Admin</p>
            </div>
            <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
              <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="Profile" />
            </div>
          </div>
        </header>

        {/* OUTLET: Di sinilah konten Dashboard / Kehadiran akan disuntikkan secara dinamis */}
        <Outlet />
        
      </main>
    </div>
  );
};

export default LayoutHRD;