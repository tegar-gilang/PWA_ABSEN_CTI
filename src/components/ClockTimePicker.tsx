import React, { useState } from 'react';
import { Clock, X, Check } from 'lucide-react';

interface ClockTimePickerModalProps {
  isOpen: boolean;
  title?: string;
  initialTime?: string; // HH:mm
  onClose: () => void;
  onSave: (time: string) => void;
}

export const ClockTimePickerModal: React.FC<ClockTimePickerModalProps> = ({
  isOpen,
  title = 'Pilih Waktu',
  initialTime = '08:00',
  onClose,
  onSave
}) => {
  const parts = (initialTime || '08:00').split(':');
  const initHour = parseInt(parts[0], 10) || 8;
  const initMinute = parseInt(parts[1], 10) || 0;

  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [selectedHour, setSelectedHour] = useState<number>(initHour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initMinute);

  if (!isOpen) return null;

  // 12 outer hours (1..12), 12 inner hours (13..23, 00)
  const outerHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const innerHours = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const formattedHour = String(selectedHour).padStart(2, '0');
  const formattedMinute = String(selectedMinute).padStart(2, '0');

  // Calculate pointer angle
  const getHourAngle = () => {
    return (selectedHour % 12) * 30; // 360 / 12 = 30 deg
  };

  const getMinuteAngle = () => {
    return selectedMinute * 6; // 360 / 60 = 6 deg
  };

  const isInnerHour = selectedHour === 0 || selectedHour > 12;

  const handleHourClick = (h: number) => {
    setSelectedHour(h);
    setMode('minute'); // Auto switch to minute mode like standard Material clock
  };

  const handleMinuteClick = (m: number) => {
    setSelectedMinute(m);
  };

  const handleSave = () => {
    onSave(`${formattedHour}:${formattedMinute}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-[320px] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header Display: like Material Time Picker */}
        <div className="bg-[#4169E1] text-white p-5 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-wider font-semibold text-blue-100 mb-1">
            {title}
          </div>
          <div className="flex items-center text-4xl font-bold tracking-tight">
            <button
              type="button"
              onClick={() => setMode('hour')}
              className={`px-2 py-1 rounded transition-colors ${
                mode === 'hour' ? 'bg-white/20 text-white' : 'text-blue-200 hover:text-white'
              }`}
            >
              {formattedHour}
            </button>
            <span className="text-blue-200 mx-1">:</span>
            <button
              type="button"
              onClick={() => setMode('minute')}
              className={`px-2 py-1 rounded transition-colors ${
                mode === 'minute' ? 'bg-white/20 text-white' : 'text-blue-200 hover:text-white'
              }`}
            >
              {formattedMinute}
            </button>
          </div>
        </div>

        {/* Clock Dial */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#F8FAFC]">
          <div className="relative w-60 h-60 rounded-full bg-[#E2E8F0]/60 flex items-center justify-center select-none shadow-inner">
            {/* Center Pin */}
            <div className="w-2.5 h-2.5 rounded-full bg-[#4169E1] z-20" />

            {/* Pointer Hand */}
            {mode === 'hour' ? (
              <div
                className="absolute top-1/2 left-1/2 origin-top -translate-x-1/2 z-10 pointer-events-none transition-transform duration-200"
                style={{
                  height: isInnerHour ? '65px' : '92px',
                  transform: `rotate(${getHourAngle() + 180}deg)`
                }}
              >
                <div className="w-0.5 h-full bg-[#4169E1] mx-auto" />
                <div className="w-8 h-8 rounded-full bg-[#4169E1] text-white flex items-center justify-center text-xs font-bold absolute bottom-0 left-1/2 -translate-x-1/2 shadow-md">
                  {selectedHour}
                </div>
              </div>
            ) : (
              <div
                className="absolute top-1/2 left-1/2 origin-top -translate-x-1/2 z-10 pointer-events-none transition-transform duration-200"
                style={{
                  height: '92px',
                  transform: `rotate(${getMinuteAngle() + 180}deg)`
                }}
              >
                <div className="w-0.5 h-full bg-[#4169E1] mx-auto" />
                <div className="w-8 h-8 rounded-full bg-[#4169E1] text-white flex items-center justify-center text-xs font-bold absolute bottom-0 left-1/2 -translate-x-1/2 shadow-md">
                  {selectedMinute}
                </div>
              </div>
            )}

            {/* Hour Dial Numbers */}
            {mode === 'hour' && (
              <>
                {/* Outer Ring: 1 to 12 */}
                {outerHours.map((h, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const radius = 92;
                  const x = Math.round(radius * Math.cos(angle));
                  const y = Math.round(radius * Math.sin(angle));
                  const isSelected = selectedHour === h;
                  return (
                    <button
                      key={`outer-${h}`}
                      type="button"
                      onClick={() => handleHourClick(h)}
                      style={{
                        transform: `translate(${x}px, ${y}px)`
                      }}
                      className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-colors z-10 ${
                        isSelected ? 'text-transparent' : 'text-gray-700 hover:bg-blue-100'
                      }`}
                    >
                      {h}
                    </button>
                  );
                })}

                {/* Inner Ring: 13 to 23, 00 */}
                {innerHours.map((h, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const radius = 62;
                  const x = Math.round(radius * Math.cos(angle));
                  const y = Math.round(radius * Math.sin(angle));
                  const isSelected = selectedHour === h;
                  return (
                    <button
                      key={`inner-${h}`}
                      type="button"
                      onClick={() => handleHourClick(h)}
                      style={{
                        transform: `translate(${x}px, ${y}px)`
                      }}
                      className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold cursor-pointer transition-colors z-10 ${
                        isSelected ? 'text-transparent' : 'text-gray-500 hover:bg-blue-100'
                      }`}
                    >
                      {h === 0 ? '00' : h}
                    </button>
                  );
                })}
              </>
            )}

            {/* Minute Dial Numbers */}
            {mode === 'minute' && (
              <>
                {minutes.map((m, i) => {
                  const angle = (i * 30 - 90) * (Math.PI / 180);
                  const radius = 92;
                  const x = Math.round(radius * Math.cos(angle));
                  const y = Math.round(radius * Math.sin(angle));
                  const isSelected = selectedMinute === m;
                  return (
                    <button
                      key={`min-${m}`}
                      type="button"
                      onClick={() => handleMinuteClick(m)}
                      style={{
                        transform: `translate(${x}px, ${y}px)`
                      }}
                      className={`absolute w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer transition-colors z-10 ${
                        isSelected ? 'text-transparent' : 'text-gray-700 hover:bg-blue-100'
                      }`}
                    >
                      {String(m).padStart(2, '0')}
                    </button>
                  );
                })}
              </>
            )}
          </div>

          {/* Quick preset buttons */}
          <div className="flex gap-2 mt-4 w-full justify-center">
            {['08:00', '09:00', '17:00', '18:00'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => {
                  const [h, m] = preset.split(':').map(Number);
                  setSelectedHour(h);
                  setSelectedMinute(m);
                }}
                className="px-2 py-1 text-xs rounded bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-white border-t border-gray-200 flex justify-between items-center text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setSelectedHour(0);
              setSelectedMinute(0);
            }}
            className="text-gray-500 hover:text-gray-800 uppercase px-2 py-1"
          >
            Clear
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-600 hover:text-gray-800 uppercase px-3 py-1.5 rounded hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="bg-[#4169E1] text-white uppercase px-4 py-1.5 rounded-lg hover:bg-blue-700 shadow-sm"
            >
              Set
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

