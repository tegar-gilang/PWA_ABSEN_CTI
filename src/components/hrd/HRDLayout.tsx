import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, Users, CalendarCheck, FileText, 
    Target, Briefcase, Settings, LogOut, Search, Bell,
} from 'lucide-react';
import { useAppStore } from '../../store';

export default function HRDLayout() {
    const location = useLocation();
    const user = useAppStore(state => state.user);
    const logout = useAppStore(state => state.logout);

    const menuItems = [
        { name: 'Dashboard', path: '/hrd/dashboard', icon: LayoutDashboard },
        { name: 'Kehadiran', path: '/hrd/attendance', icon: CalendarCheck },
        { name: 'Karyawan', path: '/hrd/employees', icon: Users},
        { name: 'Cuti', path: '/hrd/leaves', icon: FileText},
        { name: 'KPI', path: '/hrd/kpi', icon: Target },
        { name: 'Rekrutmen', path: '/hrd/recruitment', icon: Briefcase },
    ];

    return (
        <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-slate-200">
                    <div className="flex items-center gap-2 text-blue-600 font-bold text-xl tracking-tight">
                        <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                            CTI
                        </div>
                        HRD
                    </div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.name}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isActive 
                                    ? 'bg-blue-50 text-blue-700' 
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-700' : 'text-slate-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-slate-200 space-y-1">
                    <button onClick={logout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="w-5 h-5 text-red-400" />
                        Keluar
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-end-safe px-8 shrink-0">
                    
                    <div className="flex items-center gap-4">
                        <button className="relative p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                            <Bell className="w-5 h-5" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                        </button>
                        <div className="h-8 w-px bg-slate-200"></div>
                        <div className="flex items-center gap-3">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-semibold text-slate-700">{user?.name || 'Admin HRD'}</p>
                                <p className="text-xs text-slate-500">Administrator</p>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold overflow-hidden">
                                {user?.photoUrl ? (
                                <img src={user.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : 'A'}
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8 bg-slate-50">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}