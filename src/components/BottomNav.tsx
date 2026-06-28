import { NavLink } from 'react-router-dom';
import { Home, Clock, FileText, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export default function BottomNav() {
  const navItems = [
    { icon: Home, label: 'Beranda', path: '/home' },
    { icon: Clock, label: 'Absen', path: '/attendance' },
    { icon: FileText, label: 'Izin', path: '/request' },
    { icon: User, label: 'Profil', path: '/profile' },
  ];

  return (
    <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50">
      <div className="flex justify-around items-center h-24 pb-6 max-w-md mx-auto px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1.5 transition-colors relative w-full h-full justify-center',
                isActive ? 'text-blue-600 group' : 'text-slate-400 hover:text-slate-600'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                  {isActive && (
                    <motion.div
                      layoutId="nav-dot"
                      className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
