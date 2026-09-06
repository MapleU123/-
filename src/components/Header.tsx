import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  FastForward, 
  Sparkles, 
  Clock, 
  ShieldAlert, 
  Flame,
  Layers
} from 'lucide-react';
import { audioAlertService } from '../utils/audioAlert';
import { marketService } from '../services/marketService';

interface HeaderProps {
  onOpenAIDiagnosis: () => void;
  unreadAlertCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAIDiagnosis, unreadAlertCount }) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = now.toLocaleTimeString('zh-CN', { hour12: false });
      setTimeStr(time);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    audioAlertService.setSoundEnabled(next);
  };

  const toggleSimulation = () => {
    const next = !isRunning;
    setIsRunning(next);
    marketService.toggleSimulation(next);
  };

  const cycleSpeed = () => {
    const speeds = [1, 2, 5];
    const currentIndex = speeds.indexOf(speed);
    const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
    setSpeed(nextSpeed);
    marketService.setSimulationSpeed(nextSpeed);
  };

  return (
    <header className="bg-slate-950/95 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Brand & Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 shadow-md shadow-rose-950/50">
            <TrendingUp className="w-5 h-5 text-white stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span>A股板块资金流与异动预警</span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  PRO
                </span>
              </h1>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                实时行情推演中
              </span>
              <span className="text-slate-600">|</span>
              <span className="flex items-center gap-1 font-mono text-slate-300">
                <Clock className="w-3 h-3 text-slate-400" />
                {timeStr || '14:55:00'} (北京时间)
              </span>
            </div>
          </div>
        </div>

        {/* Right: Controls & AI button */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Sound Toggle */}
          <button
            id="toggle-sound-btn"
            onClick={toggleSound}
            title={soundEnabled ? '异动声音预警：已开启' : '异动声音预警：已静音'}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              soundEnabled
                ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                : 'bg-slate-900/50 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">声音预警</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">已静音</span>
              </>
            )}
          </button>

          {/* Speed Toggle */}
          <button
            id="toggle-speed-btn"
            onClick={cycleSpeed}
            title="调节行情推演刷新频率"
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <FastForward className="w-3.5 h-3.5 text-cyan-400" />
            <span>{speed}x 频速</span>
          </button>

          {/* Simulation Pause / Play */}
          <button
            id="toggle-sim-btn"
            onClick={toggleSimulation}
            title={isRunning ? '暂停行情推演' : '继续行情推演'}
            className={`p-1.5 rounded-lg border transition-colors ${
              isRunning
                ? 'bg-slate-900 border-slate-700 text-emerald-400 hover:bg-slate-800'
                : 'bg-amber-950/40 border-amber-800/60 text-amber-400 hover:bg-amber-900/50'
            }`}
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          {/* AI Advisor Button */}
          <button
            id="open-ai-diagnosis-btn"
            onClick={onOpenAIDiagnosis}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-rose-600 via-amber-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white shadow-md shadow-rose-950/60 border border-rose-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-spin-slow" />
            <span>AI 资金流智能研判</span>
          </button>
        </div>
      </div>
    </header>
  );
};
