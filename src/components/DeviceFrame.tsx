import React from 'react';

export default function DeviceFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4 sm:p-8">
      <style>{`
        .min-h-screen { min-height: 100% !important; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
      {/* iPhone 16 Pro Frame */}
      <div className="relative w-full max-w-[393px] max-h-[852px] h-full aspect-[393/852] bg-black rounded-[3.5rem] shadow-2xl p-[14px] ring-1 ring-white/10 m-auto flex-shrink-0">
        
        {/* Hardware Buttons */}
        {/* Action Button */}
        <div className="absolute left-[-2px] top-[180px] w-1 h-8 bg-slate-800 rounded-l-md"></div>
        {/* Volume Up */}
        <div className="absolute left-[-2px] top-[230px] w-1 h-14 bg-slate-800 rounded-l-md"></div>
        {/* Volume Down */}
        <div className="absolute left-[-2px] top-[300px] w-1 h-14 bg-slate-800 rounded-l-md"></div>
        {/* Power Button */}
        <div className="absolute right-[-2px] top-[250px] w-1 h-20 bg-slate-800 rounded-r-md"></div>

        {/* Screen Content Area */}
        <div className="relative w-full h-full bg-white rounded-[2.75rem] overflow-hidden" style={{ transform: 'translateZ(0)' }}>
          {/* Dynamic Island */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[120px] h-[32px] bg-black rounded-full z-50 flex items-center justify-between px-3">
             {/* Camera and sensor simulated with subtle dots inside dynamic island, or leave it solid black */}
             <div className="w-2.5 h-2.5 rounded-full bg-slate-800/80 absolute right-3"></div>
             <div className="w-2.5 h-2.5 rounded-full bg-slate-800/80 absolute right-7"></div>
          </div>
          
          {/* Status Bar background for the time/battery/signal (simulated layout placeholder or just rely on app design) */}
          {/* It's better to let the app handle the space, or add some padding-top in the app components if needed. 
              Since our app already uses min-h-screen, if we wrap it, it will fill this screen height. */}
          <div className="w-full h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
