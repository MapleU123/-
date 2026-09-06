import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  RefreshCw, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Plus, 
  Check, 
  TrendingUp, 
  TrendingDown,
  Clock,
  Database,
  FileImage,
  Camera
} from 'lucide-react';
import { marketService } from '../services/marketService';
import { audioAlertService } from '../utils/audioAlert';
import { MarketOverviewData } from '../types/market';

interface TopNavBarProps {
  overviewData: MarketOverviewData;
  onOpenAIDiagnosis: () => void;
  onOpenExportImage?: () => void;
  onSelectStock?: (stock: { code: string; name: string }) => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  overviewData,
  onOpenAIDiagnosis,
  onOpenExportImage,
  onSelectStock
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMuted, setIsMuted] = useState(audioAlertService.isAudioMuted());
  const [isSimRunning, setIsSimRunning] = useState(marketService.isRunning());
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const res = marketService.searchStocks(searchQuery);
      setSearchResults(res);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [searchQuery]);

  // Click outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto Refresh countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  // When countdown hits 0, trigger refresh safely after render
  useEffect(() => {
    if (refreshCountdown === 0) {
      handleManualRefresh();
    }
  }, [refreshCountdown]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    marketService.triggerManualRefresh();
    setTimeout(() => {
      setIsRefreshing(false);
      setRefreshCountdown(30);
    }, 400);
  };

  const toggleSound = () => {
    const next = audioAlertService.toggleMute();
    setIsMuted(next);
  };

  const toggleSim = () => {
    marketService.toggleSimulation();
    setIsSimRunning(marketService.isRunning());
  };

  return (
    <header 
      id="top-nav-bar"
      className="bg-[#0e1730] border-b border-slate-800 text-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs select-none sticky top-0 z-40 shadow-sm"
    >
      {/* 1. Left Data Range Info (Matching screenshot top-left) */}
      <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11.5px]">
        <Database className="w-3.5 h-3.5 text-blue-400" />
        <span>
          数据范围: <strong className="text-slate-200">{overviewData.dataRangeStart}</strong> ~ <strong className="text-slate-200">{overviewData.lastCollectTime}</strong>
        </span>
        <span className="text-slate-600">|</span>
        <span>
          共 <strong className="text-cyan-300">{overviewData.totalRecords.toLocaleString()}</strong> 条记录
        </span>
      </div>

      {/* 2. Middle Global Stock Search Bar */}
      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
          <input
            id="global-stock-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
            placeholder="搜索股票代码 / 名称 / 所属概念..."
            className="w-full bg-[#172344] hover:bg-[#1c2c54] focus:bg-[#1a284c] text-slate-100 placeholder-slate-400 text-xs rounded-lg pl-9 pr-8 py-1.5 border border-slate-700/80 focus:border-blue-500 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 text-slate-400 hover:text-white"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchResults.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-[#101b38] border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 max-h-80 overflow-y-auto">
            <div className="p-1.5 bg-[#0b1329] text-[11px] text-slate-400 font-medium border-b border-slate-800">
              匹配股票 ({searchResults.length})
            </div>
            <div className="divide-y divide-slate-800/60">
              {searchResults.map((stk) => {
                const inWatch = marketService.isInWatchlist(stk.code);
                return (
                  <div
                    key={stk.code}
                    className="p-2 hover:bg-[#1a284c] flex items-center justify-between cursor-pointer transition-colors"
                    onClick={() => {
                      if (onSelectStock) onSelectStock(stk);
                      setIsSearchOpen(false);
                    }}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="font-mono text-cyan-300 font-semibold">{stk.code}</span>
                      <span className="font-medium text-white">{stk.name}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {stk.sector}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-slate-200">¥{(stk.price || 0).toFixed(2)}</span>
                      <span className={`font-mono text-[11.5px] font-semibold flex items-center ${
                        (stk.changePercent || 0) >= 0 ? 'text-rose-400' : 'text-emerald-400'
                      }`}>
                        {(stk.changePercent || 0) >= 0 ? '+' : ''}{(stk.changePercent || 0).toFixed(2)}%
                      </span>
                      <button
                        title={inWatch ? '已在自选股' : '加入自选股'}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (inWatch) {
                            marketService.removeFromWatchlist(stk.code);
                          } else {
                            marketService.addToWatchlist(stk);
                          }
                        }}
                        className={`p-1 rounded transition-colors ${
                          inWatch 
                            ? 'text-amber-400 bg-amber-500/10' 
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                      >
                        {inWatch ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 3. Right Status & Controls (Matching screenshot top-right) */}
      <div className="flex items-center space-x-3.5 text-slate-400 text-xs">
        {/* Time Info */}
        <div className="hidden lg:flex items-center space-x-1.5 text-slate-400 text-[11px] font-mono">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>行业数据: <strong className="text-slate-300">{overviewData.lastCollectTime}</strong></span>
          <span className="text-slate-600">|</span>
          <span>页面刷新于 <strong className="text-slate-300">{overviewData.pageRefreshTime}</strong></span>
        </div>

        {/* Auto Refresh Checkbox */}
        <label className="flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
          />
          <span className="text-[11.5px]">自动刷新{autoRefresh ? `(${refreshCountdown}s)` : ''}</span>
        </label>

        {/* Manual Refresh Button */}
        <button
          id="btn-manual-refresh"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-200' : ''}`} />
          <span className="font-medium text-[11.5px]">刷新数据</span>
        </button>

        {/* Live Simulation Play/Pause */}
        <button
          onClick={toggleSim}
          title={isSimRunning ? '暂停实时行情模拟' : '启动实时行情模拟'}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {isSimRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        {/* Mute/Sound Toggle */}
        <button
          onClick={toggleSound}
          title={isMuted ? '取消静音 (开启异动语音警报)' : '静音异动警报'}
          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
        </button>

        {/* Export Image Quick Trigger */}
        {onOpenExportImage && (
          <button
            id="btn-top-export-image"
            onClick={onOpenExportImage}
            className="flex items-center space-x-1.5 px-3 py-1 rounded bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="导出研报图片（带水印：公众号：我爱这young）"
          >
            <Camera className="w-3.5 h-3.5 text-rose-200" />
            <span>导出研报图片</span>
          </button>
        )}

        {/* AI Diagnosis Quick Trigger */}
        <button
          id="btn-top-ai-diagnosis"
          onClick={onOpenAIDiagnosis}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span>AI 盘面研判</span>
        </button>
      </div>
    </header>
  );
};
