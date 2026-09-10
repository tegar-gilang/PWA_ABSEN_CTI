// import React from 'react';
// import { Outlet, Link, useLocation } from 'react-router-dom';
// import { useAppStore } from '../../store';
// import { useNavigate } from 'react-router-dom';

// const LayoutHRD: React.FC = () => {
//   const location = useLocation();
//   const logout = useAppStore(state => state.logout);
//   const navigate = useNavigate();

//   const handleLogout = async () => {
//     await logout();
//     navigate('/login');
//   }

//   // Fungsi kecil untuk mengecek apakah menu sedang aktif
//   const isActive = (path: string) => location.pathname === path;

//   return (
//     <div className="flex h-screen bg-gray-50 font-sans">
      
//       {/* SIDEBAR */}
//       <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between">
//         <div>
//           {/* Logo Brand */}
//           <div className="flex items-center p-6 border-b border-gray-200">
//             <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-white font-bold mr-3">
//               CTI
//             </div>
//             <div>
//               <h1 className="text-lg font-bold text-gray-800 leading-tight">PT CTI</h1>
//               <p className="text-xs text-gray-500">HR Admin System</p>
//             </div>
//           </div>

//           {/* Menu Navigasi Dinamis */}
//           <nav className="p-4 space-y-2">
//             <Link 
//               to="/hrd" 
//               className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
//             >
//               <span className="mr-3">📊</span> Dashboard
//             </Link>
//             <Link 
//               to="/hrd/kehadiran" 
//               className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/kehadiran') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
//             >
//               <span className="mr-3">📅</span> Kehadiran
//             </Link>
//             <Link 
//               to="/hrd/karyawan" 
//               className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/karyawan') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
//             >
//             <span className="mr-3">👥</span> Karyawan
//             </Link>
//             <Link 
//               to="/hrd/cuti" 
//               className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/cuti') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
//             >
//             <span className="mr-3">🗓️</span> Cuti
//             </Link>
//             <Link 
//               to="/hrd/kpi" 
//               className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/kpi') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
//             >
//             <span className="mr-3">📈</span> KPI
//             </Link>
//             <Link 
//               to="/hrd/rekrutmen" 
//               className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/rekrutmen') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
//             >
//             <span className="mr-3">💼</span> Rekrutmen
//             </Link>
//           </nav>
//         </div>

//         {/* Tombol Logout */}
//         <div className="p-4 border-t border-gray-200">
//           <button 
//             className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 transition-colors w-full"
//             onClick={handleLogout}
//           >
//             <span className="mr-3">🚪</span> Logout
//           </button>
//         </div>
//       </aside>

//       {/* AREA KANAN */}
//       <main className="flex-1 flex flex-col overflow-y-auto">
        
//         {/* HEADER */}
//         <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-end items-center">
//           <button className="text-gray-500 mr-6 relative">
//             🔔
//             <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
//           </button>
//           <div className="flex items-center border-l border-gray-300 pl-6">
//             <div className="text-right mr-3">
//               <p className="text-sm font-bold text-gray-800">Admin User</p>
//               <p className="text-xs text-gray-500">Admin</p>
//             </div>
//             <div className="w-10 h-10 bg-gray-300 rounded-full overflow-hidden">
//               <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="Profile" />
//             </div>
//           </div>
//         </header>

//         {/* OUTLET: Di sinilah konten Dashboard / Kehadiran akan disuntikkan secara dinamis */}
//         <Outlet />
        
//       </main>
//     </div>
//   );
// };

// export default LayoutHRD;
import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import { useNavigate } from 'react-router-dom';
// Import ikon-ikon dari lucide-react
import { 
  LayoutDashboard, 
  CalendarCheck, 
  Users, 
  CalendarOff, 
  TrendingUp, 
  Briefcase, 
  LogOut, 
  Bell,
  Menu,
  X,
  FileSpreadsheet,
  Hospital,
  ChevronDown,
  UserCheck
} from 'lucide-react';

const LayoutHRD: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const logout = useAppStore(state => state.logout);
  const navigate = useNavigate();

  const isKaryawanRoute = location.pathname.startsWith('/hrd/karyawan') || location.pathname.startsWith('/hrd/data-absensi');
  const [isKaryawanOpen, setIsKaryawanOpen] = useState(isKaryawanRoute);

  useEffect(() => {
    if (isKaryawanRoute) {
      setIsKaryawanOpen(true);
    }
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  }

  // Fungsi kecil untuk mengecek apakah menu sedang aktif
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
      
      {/* OVERLAY UNTUK MOBILE */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-64 bg-white border-r border-gray-200 flex flex-col justify-between
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div>
          {/* Logo Brand */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gray-800 rounded flex items-center justify-center text-white font-bold mr-3">
                CTI
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800 leading-tight">PT CTI</h1>
                <p className="text-xs text-gray-500">HR Admin System</p>
              </div>
            </div>
            {/* Tombol Tutup Sidebar Khusus Mobile */}
            <button 
              className="lg:hidden text-gray-500 hover:text-gray-800"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Menu Navigasi Dinamis */}
          <nav className="p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-200px)]">
            <Link 
              to="/hrd" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <LayoutDashboard className="w-5 h-5 mr-3" /> Dashboard
            </Link>
            <Link 
              to="/hrd/kehadiran" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/kehadiran') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <CalendarCheck className="w-5 h-5 mr-3" /> Kehadiran
            </Link>
            {/* Dropdown Menu Karyawan */}
            <div className="space-y-1">
              <button 
                type="button"
                onClick={() => setIsKaryawanOpen(!isKaryawanOpen)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  isKaryawanRoute
                    ? 'bg-blue-50 text-blue-700 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <Users className={`w-5 h-5 mr-3 ${isKaryawanRoute ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span>Karyawan</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                  isKaryawanOpen ? 'rotate-180 text-blue-600' : 'text-gray-400'
                }`} />
              </button>

              {isKaryawanOpen && (
                <div className="ml-4 pl-3 border-l-2 border-slate-200 space-y-1 py-1">
                  <Link 
                    to="/hrd/karyawan" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive('/hrd/karyawan') 
                        ? 'bg-blue-600 text-white font-medium shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 mr-2.5" /> Data Karyawan
                  </Link>
                  <Link 
                    to="/hrd/data-absensi" 
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive('/hrd/data-absensi') 
                        ? 'bg-blue-600 text-white font-medium shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2.5" /> Data Absensi
                  </Link>
                </div>
              )}
            </div>
            <Link 
              to="/hrd/data-rumah-sakit" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/data-rumah-sakit') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Hospital className="w-5 h-5 mr-3" /> Data Rumah Sakit
            </Link>
            <Link 
              to="/hrd/cuti" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/cuti') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <CalendarOff className="w-5 h-5 mr-3" /> Cuti
            </Link>
            <Link 
              to="/hrd/kpi" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/kpi') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <TrendingUp className="w-5 h-5 mr-3" /> KPI
            </Link>
            <Link 
              to="/hrd/rekrutmen" 
              onClick={() => setIsSidebarOpen(false)}
              className={`flex items-center px-4 py-3 rounded-lg transition-colors ${isActive('/hrd/rekrutmen') ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Briefcase className="w-5 h-5 mr-3" /> Rekrutmen
            </Link>
          </nav>
        </div>

        {/* Tombol Logout */}
        <div className="p-4 border-t border-gray-200">
          <button 
            className="flex items-center px-4 py-2 text-gray-600 hover:text-red-600 transition-colors w-full"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" /> Logout
          </button>
        </div>
      </aside>

      {/* AREA KANAN */}
      <main className="flex-1 flex flex-col w-full min-w-0 overflow-y-auto">
        
        {/* HEADER */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-8 py-4 flex justify-between lg:justify-end items-center sticky top-0 z-30">
          
          {/* Tombol Hamburger (Hanya Mobile) */}
          <button 
            className="lg:hidden text-gray-500 hover:text-gray-800 p-2 -ml-2"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* User & Notif Area */}
          <div className="flex items-center">
            <button className="text-gray-500 mr-4 md:mr-6 relative hover:text-gray-700 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
            <div className="flex items-center border-l border-gray-300 pl-4 md:pl-6">
              <div className="text-right mr-3 hidden sm:block">
                <p className="text-sm font-bold text-gray-800">Admin User</p>
                <p className="text-xs text-gray-500">Admin</p>
              </div>
              <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-300 rounded-full overflow-hidden border border-gray-200 shrink-0">
                <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="Profile" />
              </div>
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