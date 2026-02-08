import React, { useState, useEffect, useRef } from 'react';
import { RAW_GAME_DATA } from '../constants';
import { GameTrigger } from '../types';

interface Props {
  onTrigger: (trigger: GameTrigger) => void;
}

export const GameSimulator: React.FC<Props> = ({ onTrigger }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [period, setPeriod] = useState(1);
  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [speed, setSpeed] = useState(10); // Default 10x speed for testing
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set());
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const formatClock = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 0) {
            if (period < 4) {
              setPeriod(p => p + 1);
              return 15 * 60;
            }
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000 / speed);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPlaying, speed, period]);

  // Check for triggers every time the clock updates
  useEffect(() => {
    const currentClockStr = formatClock(secondsLeft);
    
    RAW_GAME_DATA.triggers.forEach((trigger, idx) => {
      const triggerId = `${trigger.trigger_type}-${trigger.period}-${trigger.clock}`;
      if (
        !triggeredIds.has(triggerId) &&
        trigger.period === period &&
        trigger.clock === currentClockStr
      ) {
        setTriggeredIds(prev => new Set(prev).add(triggerId));
        onTrigger({ ...trigger, id: triggerId });
      }
    });
  }, [secondsLeft, period, triggeredIds, onTrigger]);

  return (
    <div className="glass rounded-2xl p-6 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quarter</span>
            <span className="text-3xl font-oswald font-bold text-white">{period}</span>
          </div>
          <div className="w-px h-10 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Game Clock</span>
            <span className="text-4xl font-oswald font-bold text-red-500 tabular-nums">
              {formatClock(secondsLeft)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Sim Speed</span>
             <div className="flex gap-2">
               {[1, 10, 50, 100].map(s => (
                 <button 
                  key={s} 
                  onClick={() => setSpeed(s)}
                  className={`px-2 py-1 rounded text-[10px] font-bold border ${speed === s ? 'bg-white text-black border-white' : 'border-white/10 text-slate-500'}`}
                 >
                   {s}x
                 </button>
               ))}
             </div>
          </div>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-8 py-3 rounded-xl font-oswald font-bold text-lg uppercase transition-all ${
              isPlaying ? 'bg-slate-800 text-slate-400' : 'bg-red-600 text-white shadow-lg shadow-red-900/30'
            }`}
          >
            {isPlaying ? 'PAUSE GAME' : 'START SIMULATION'}
          </button>
        </div>
      </div>
    </div>
  );
};
