import React, { useState, useEffect, useRef } from 'react';
import { Settings, Play, Pause, RotateCcw, ShoppingBag, Zap, ChevronRight, X, Gift } from 'lucide-react';

const SheinTimer = () => {
  // --- Configuration State (Persisted) ---
  const [goal, setGoal] = useState(() => parseInt(localStorage.getItem('st_goal')) || 20);
  const [intervalMin, setIntervalMin] = useState(() => parseInt(localStorage.getItem('st_min')) || 4);
  const [intervalSec, setIntervalSec] = useState(() => parseInt(localStorage.getItem('st_sec')) || 0);
  const [rate, setRate] = useState(() => parseFloat(localStorage.getItem('st_rate')) || 1.00);

  // --- Timer State (Persisted) ---
  // We store the timestamp of when the timer started. 
  // If null, the timer is stopped.
  const [startTime, setStartTime] = useState(() => {
    const saved = localStorage.getItem('st_startTime');
    return saved ? parseInt(saved) : null;
  });

  // We store accumulated counts from previous "sessions" if we ever wanted to support pausing without resetting
  // For this logic, we keep it simple: strictly time-based since start.
  // However, to handle "pausing", we need to offset the start time.
  const [offsetTime, setOffsetTime] = useState(() => parseInt(localStorage.getItem('st_offset')) || 0);

  // --- UI State ---
  const [count, setCount] = useState(0);
  const [earnings, setEarnings] = useState(0);
  const [timeLeftStr, setTimeLeftStr] = useState("00:00");
  const [progressPercent, setProgressPercent] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // --- Helpers ---
  const getTotalIntervalMs = () => (intervalMin * 60 + intervalSec) * 1000;

  // --- Persistence Effects ---
  useEffect(() => localStorage.setItem('st_goal', goal), [goal]);
  useEffect(() => localStorage.setItem('st_min', intervalMin), [intervalMin]);
  useEffect(() => localStorage.setItem('st_sec', intervalSec), [intervalSec]);
  useEffect(() => localStorage.setItem('st_rate', rate), [rate]);
  useEffect(() => {
    if (startTime) localStorage.setItem('st_startTime', startTime);
    else localStorage.removeItem('st_startTime');
  }, [startTime]);
  useEffect(() => localStorage.setItem('st_offset', offsetTime), [offsetTime]);

  // --- The Core Loop ---
  useEffect(() => {
    let animationFrameId;

    const updateTimer = () => {
      if (!startTime) {
        // If stopped, just display current static state
        return;
      }

      const now = Date.now();
      const intervalMs = getTotalIntervalMs();
      
      if (intervalMs === 0) return; // Prevent divide by zero

      // Calculate total time elapsed including any previous offsets
      const totalElapsed = now - startTime + offsetTime;
      
      // Calculate how many full cycles have passed
      const currentCount = Math.floor(totalElapsed / intervalMs);
      
      // Calculate progress into the NEXT count
      const msIntoCurrent = totalElapsed % intervalMs;
      const msRemaining = intervalMs - msIntoCurrent;
      
      // Update UI
      setCount(currentCount);
      setEarnings(currentCount * rate);
      
      // Format MM:SS
      const m = Math.floor(msRemaining / 60000);
      const s = Math.floor((msRemaining % 60000) / 1000);
      setTimeLeftStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
      
      // Progress Bar (0 to 100%)
      setProgressPercent((msIntoCurrent / intervalMs) * 100);

      animationFrameId = requestAnimationFrame(updateTimer);
    };

    if (startTime) {
      updateTimer();
    } else {
      setTimeLeftStr(`${intervalMin.toString().padStart(2, '0')}:${intervalSec.toString().padStart(2, '0')}`);
      setProgressPercent(0);
    }

    return () => cancelAnimationFrame(animationFrameId);
  }, [startTime, offsetTime, intervalMin, intervalSec, rate]);

  // --- Handlers ---

  const handleStart = () => {
    if (!startTime) {
      setStartTime(Date.now());
    }
  };

  const handleStop = () => {
    if (startTime) {
      // Calculate how much time passed and add it to offset, then clear start time
      const now = Date.now();
      const sessionElapsed = now - startTime;
      setOffsetTime(prev => prev + sessionElapsed);
      setStartTime(null);
    }
  };

  const handleReset = () => {
    setStartTime(null);
    setOffsetTime(0);
    setCount(0);
    setEarnings(0);
    setProgressPercent(0);
    setTimeLeftStr(`${intervalMin.toString().padStart(2, '0')}:${intervalSec.toString().padStart(2, '0')}`);
  };

  const goalPercentage = Math.min((count / goal) * 100, 100);

  // --- Components ---

  const StatBox = ({ title, value, sub, isMoney, highlight }) => (
    <div className={`flex flex-col p-4 bg-white border border-gray-100 shadow-sm relative overflow-hidden ${highlight ? 'border-b-2 border-black' : ''}`}>
      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</span>
      <div className="flex items-baseline gap-1">
        {isMoney && <span className="text-sm font-bold mt-1">₱</span>}
        <span className={`text-2xl font-black tracking-tighter ${highlight ? 'text-[#ff4545]' : 'text-black'}`}>
          {isMoney ? value.toFixed(2) : value}
        </span>
      </div>
      {sub && <span className="text-[10px] text-gray-400 font-medium">{sub}</span>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f2f2f2] font-sans text-gray-900 pb-20 select-none overflow-x-hidden">
      
      {/* Top Banner */}
      <div className="bg-black text-white px-4 py-2 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <ShoppingBag size={18} />
          <span className="font-black text-lg tracking-tighter italic">EARN<span className="text-[#ff4545]">NOW</span></span>
        </div>
        <button onClick={() => setIsSettingsOpen(true)} className="p-1 hover:bg-gray-800 rounded">
          <Settings size={20} />
        </button>
      </div>

      {/* Flash Sale Banner */}
      <div className="bg-[#ff4545] text-white text-xs font-bold py-1 px-2 flex justify-center items-center gap-2 animate-pulse">
        <Zap size={12} fill="white" />
        <span>LIMITED TIME EARNING EVENT</span>
        <Zap size={12} fill="white" />
      </div>

      <div className="max-w-md mx-auto w-full pt-4 px-4 space-y-4">

        {/* Main Timer Display */}
        <div className="bg-white p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 left-0 bg-black text-white text-[10px] font-bold px-2 py-1 uppercase">
            Next Drop In
          </div>
          
          <div className="text-center mt-4">
            <div className="text-6xl font-black tracking-tighter text-black tabular-nums">
              {timeLeftStr}
            </div>
            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
              {startTime ? 'Mining Rewards...' : 'Timer Paused'}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 h-3 bg-gray-100 w-full overflow-hidden skew-x-[-10deg]">
            <div 
              className="h-full bg-black transition-all duration-300 ease-linear"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatBox 
            title="Total Count" 
            value={count} 
            sub="Items Collected"
          />
          <StatBox 
            title="Wallet" 
            value={earnings} 
            isMoney={true} 
            highlight={true}
            sub={`Rate: ₱${rate.toFixed(2)}/unit`}
          />
        </div>

        {/* Goal Tracker (Coupon Style) */}
        <div className="bg-white relative shadow-sm border border-dashed border-gray-300 p-4">
          <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#f2f2f2] rounded-full"></div>
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#f2f2f2] rounded-full"></div>
          
          <div className="flex justify-between items-end mb-2">
            <div>
              <h3 className="font-black text-lg uppercase italic">Daily Goal</h3>
              <p className="text-xs text-gray-500">Reach {goal} to complete</p>
            </div>
            <div className="bg-black text-white text-xs font-bold px-2 py-1">
              {Math.floor(goalPercentage)}%
            </div>
          </div>
          
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#ff4545]"
              style={{ width: `${goalPercentage}%` }}
            />
          </div>
          
          {count >= goal && (
            <div className="mt-3 bg-[#ffeff0] text-[#ff4545] text-center py-2 text-xs font-bold border border-[#ff4545] flex justify-center items-center gap-2">
              <Gift size={14} /> GOAL REACHED!
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-3 gap-3 pt-2">
           {!startTime ? (
            <button 
              onClick={handleStart}
              className="col-span-2 bg-black text-white py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg"
            >
              <Play size={18} fill="white" /> Start Mining
            </button>
           ) : (
            <button 
              onClick={handleStop}
              className="col-span-2 bg-white border-2 border-black text-black py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-sm"
            >
              <Pause size={18} fill="black" /> Pause
            </button>
           )}
           
           <button 
             onClick={handleReset}
             className="col-span-1 bg-gray-200 text-gray-600 py-4 font-bold text-sm uppercase tracking-wider flex items-center justify-center active:scale-95 transition-transform"
           >
             <RotateCcw size={18} />
           </button>
        </div>

      </div>

      {/* Settings Drawer (Bottom Sheet) */}
      {isSettingsOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={() => setIsSettingsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-2xl p-6 transform transition-transform duration-300 ease-out shadow-[0_-5px_30px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black uppercase tracking-tighter">Configuration</h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-2 bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              {/* Interval Settings */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Timer Interval</label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <input 
                        type="number" 
                        value={intervalMin}
                        onChange={(e) => setIntervalMin(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-gray-50 border-b-2 border-gray-200 focus:border-black outline-none p-3 text-lg font-bold"
                      />
                      <span className="absolute right-3 top-4 text-xs font-bold text-gray-400">MIN</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="relative">
                      <input 
                        type="number" 
                        value={intervalSec}
                        onChange={(e) => setIntervalSec(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-full bg-gray-50 border-b-2 border-gray-200 focus:border-black outline-none p-3 text-lg font-bold"
                      />
                      <span className="absolute right-3 top-4 text-xs font-bold text-gray-400">SEC</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Earnings Rate */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Earnings per Count (₱)</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-lg font-bold text-gray-900">₱</span>
                  <input 
                    type="number" 
                    step="0.01"
                    value={rate}
                    onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-gray-50 border-b-2 border-gray-200 focus:border-black outline-none p-3 pl-8 text-lg font-bold"
                  />
                </div>
              </div>

              {/* Goals */}
              <div>
                <label className="block text-xs font-bold uppercase text-gray-400 mb-2">Target Goal</label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {[20, 50, 100, 500].map((g) => (
                    <button
                      key={g}
                      onClick={() => setGoal(g)}
                      className={`flex-shrink-0 px-6 py-3 font-bold border-2 ${
                        goal === g 
                          ? 'border-black bg-black text-white' 
                          : 'border-gray-200 text-gray-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                  <input 
                    type="number"
                    value={goal}
                    onChange={(e) => setGoal(parseInt(e.target.value))}
                    className="w-20 flex-shrink-0 bg-gray-50 border-2 border-gray-200 p-3 font-bold text-center outline-none focus:border-black"
                    placeholder="Custom"
                  />
                </div>
              </div>

              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full bg-[#ff4545] text-white py-4 font-black uppercase tracking-wider text-sm mt-4 active:bg-red-600"
              >
                Save Changes
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
};

export default SheinTimer;

          
