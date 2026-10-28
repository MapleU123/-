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
  Camera,
  BarChart2,
  PieChart,
  Activity,
  Layers,
  Flame,
  Globe,
  Star,
  Cpu,
  ShieldCheck,
  Building2,
  ExternalLink,
  DollarSign,
  LayoutGrid,
  Gauge,
  ChevronDown,
  BellRing,
  FolderKanban
} from 'lucide-react';
import { marketService } from '../services/marketService';
import { audioAlertService } from '../utils/audioAlert';
import { MarketOverviewData, ActiveNavigationTab } from '../types/market';
import { getRealtimeDateString, getRealtimeTimeString } from '../utils/marketDateUtils';

interface WebsiteHeaderProps {
  overviewData: MarketOverviewData;
  activeTab: ActiveNavigationTab;
  onTabChange: (tab: ActiveNavigationTab) => void;
  watchlistCount: number;
  onOpenAIDiagnosis: () => void;
  onOpenExportImage: (context?: string, template?: any) => void;
  onSelectStock?: (stock: { code: string; name: string }) => void;
  isRightSidebarCollapsed?: boolean;
  onToggleRightSidebar?: () => void;
}

export const WebsiteHeader: React.FC<WebsiteHeaderProps> = ({
  overviewData,
  activeTab,
  onTabChange,
  watchlistCount,
  onOpenAIDiagnosis,
  onOpenExportImage,
  onSelectStock,
  isRightSidebarCollapsed,
  onToggleRightSidebar
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [liveDate, setLiveDate] = useState(() => getRealtimeDateString());
  const [liveTime, setLiveTime] = useState(() => getRealtimeTimeString());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMuted, setIsMuted] = useState(audioAlertService.isAudioMuted());
  const [isSimRunning, setIsSimRunning] = useState(marketService.isRunning());
  
  const searchRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const getTabShortName = (tab: ActiveNavigationTab) => {
    switch (tab) {
      case 'etf_valuation': return 'ETF基金估值';
      case 'custom_sectors': return '自定义板块';
      case 'industry_valuation': return '31行业估值';
      case 'heatmap': return '个股热力图';
      case 'fundflow': return '资金流看板';
      case 'overview': return '大盘全景';
      case 'sentiment': return '市场情绪';
      case 'gold': return '黄金大宗';
      case 'quant': return '量化选股';
      case 'cb_pre': return '待发转债';
      case 'qdii': return 'QDII额度';
      default: return '研报';
    }
  };

  // Live ticking clock
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setLiveTime(getRealtimeTimeString());
      setLiveDate(getRealtimeDateString());
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

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

  // Click outside to close search and export menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto Refresh countdown
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      setRefreshCountdown(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  // Trigger silent background refresh when countdown hits 0
  useEffect(() => {
    if (refreshCountdown === 0) {
      setRefreshCountdown(30);
      try {
        marketService.triggerManualRefresh();
      } catch {
        // ignore
      }
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

  // Nav items definition for professional website
  const navItems = [
    { id: 'fundflow' as ActiveNavigationTab, label: '资金流看板 (核心)', icon: BarChart2, badge: '热' },
    { id: 'custom_sectors' as ActiveNavigationTab, label: '自定义板块', icon: FolderKanban, badge: '个性化' },
    { id: 'etf_valuation' as ActiveNavigationTab, label: 'ETF基金估值', icon: Layers, badge: '5大类' },
    { id: 'industry_valuation' as ActiveNavigationTab, label: '31行业估值', icon: Gauge, badge: '新' },
    { id: 'heatmap' as ActiveNavigationTab, label: '个股热力图', icon: LayoutGrid, badge: '高清' },
    { id: 'cb_pre' as ActiveNavigationTab, label: '待发转债', icon: Layers, badge: '抢权' },
    { id: 'qdii' as ActiveNavigationTab, label: 'QDII额度', icon: DollarSign, badge: '纳指/标普' },
    { id: 'overview' as ActiveNavigationTab, label: '大盘全景', icon: Activity },
    { id: 'quant' as ActiveNavigationTab, label: '量化选股', icon: Cpu },
    { id: 'gold' as ActiveNavigationTab, label: '黄金大宗', icon: TrendingUp },
    { id: 'toptraders' as ActiveNavigationTab, label: '实盘高手', icon: Building2 },
    { id: 'anomalies' as ActiveNavigationTab, label: '短线精灵', icon: Flame },
    { id: 'usmarket' as ActiveNavigationTab, label: '美股行情', icon: Globe },
    { id: 'watchlist' as ActiveNavigationTab, label: `自选股 (${watchlistCount})`, icon: Star },
    { id: 'stockquery' as ActiveNavigationTab, label: '个股速查', icon: Search },
    { id: 'crawler' as ActiveNavigationTab, label: '采集监控', icon: Database },
    { id: 'sentiment' as ActiveNavigationTab, label: '市场情绪', icon: PieChart },
  ];

  return (
    <header id="website-portal-header" className="bg-[#0b1329] border-b border-slate-800 text-slate-100 sticky top-0 z-40 shadow-lg select-none">
      {/* 1. TOP BRAND & UTILITY ROW */}
      <div className="max-w-[1780px] mx-auto px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80">
        
        {/* Left: Website Branding & Live Market Pulse */}
        <div className="flex items-center space-x-3.5">
          {/* Brand Logo Box */}
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-amber-600 flex items-center justify-center font-black text-white text-base shadow-sm border border-red-400/40">
              东
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-black text-sm tracking-tight text-white">
                  东方财富 <span className="text-red-500 font-medium">|</span> A股主力资金流向全景门户
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-600/30 text-red-300 border border-red-500/40">
                  专业Web版
                </span>
              </div>
              <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-mono mt-0.5">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse inline-block" />
                  实盘实时直连
                </span>
                <span>•</span>
                <span className="text-slate-300 font-bold bg-slate-800/80 px-1.5 py-0.2 rounded border border-slate-700/60">
                  {liveDate} {liveTime}
                </span>
                <span>•</span>
                <span>采集轮次: <strong className="text-cyan-400">第 {overviewData?.collectionRound || 1} 轮</strong></span>
                <span>•</span>
                <span>全市场板块: <strong className="text-slate-200">{overviewData?.industrySectorCount || 496} 个</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle: Global Stock / Sector Search Bar */}
        <div className="relative flex-1 max-w-md hidden md:block" ref={searchRef}>
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              id="website-global-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim() && setIsSearchOpen(true)}
              placeholder="搜索股票代码 / 行业板块 / 题材概念..."
              className="w-full bg-[#131f3f] hover:bg-[#18274d] focus:bg-[#162347] text-slate-100 placeholder-slate-400 text-xs rounded-lg pl-8 pr-7 py-1.5 border border-slate-700 focus:border-red-500 focus:outline-none transition-all"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-slate-400 hover:text-white"
              >
                ×
              </button>
            )}
          </div>

          {/* Search Dropdown */}
          {isSearchOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#101b38] border border-slate-700 rounded-lg shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto">
              <div className="p-1.5 bg-[#0b1329] text-[11px] text-slate-400 font-medium border-b border-slate-800">
                匹配结果 ({searchResults.length})
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
                        <span className="text-[10.5px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {stk.sector}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-slate-200">¥{(stk.price || 0).toFixed(2)}</span>
                        <span className={`font-mono text-xs font-semibold ${
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
                            inWatch ? 'text-amber-400' : 'text-slate-400 hover:text-white'
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

        {/* Right: Quick Action Buttons & Real-Time Sync Controls */}
        <div className="flex items-center space-x-2.5 text-xs">
          
          {/* Auto Refresh Toggle */}
          <label className="hidden sm:flex items-center space-x-1.5 cursor-pointer text-slate-300 hover:text-white bg-[#131f3f] px-2.5 py-1 rounded-md border border-slate-700/60">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-red-600 focus:ring-0 w-3 h-3 cursor-pointer"
            />
            <span className="text-[11px] font-mono">自动刷新{autoRefresh ? `(${refreshCountdown}s)` : ''}</span>
          </label>

          {/* Manual Refresh */}
          <button
            id="website-btn-refresh"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#162347] hover:bg-[#1d2f5e] text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="立即拉取最新盘口数据"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-red-400' : ''}`} />
            <span className="text-[11.5px]">刷新</span>
          </button>

          {/* Audio Alarm Sound Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? '取消静音 (开启异动语音警报)' : '静音异动警报'}
            className="p-1.5 rounded-md bg-[#162347] hover:bg-[#1d2f5e] text-slate-300 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          </button>

          {/* Simulation Toggle */}
          <button
            onClick={toggleSim}
            title={isSimRunning ? '暂停实时模拟' : '启动实时模拟'}
            className="p-1.5 rounded-md bg-[#162347] hover:bg-[#1d2f5e] text-slate-300 transition-colors cursor-pointer"
          >
            {isSimRunning ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
          </button>

          {/* Right Sidebar Anomaly Alert Stream Toggle */}
          {onToggleRightSidebar && (
            <button
              id="website-btn-toggle-right-sidebar"
              onClick={onToggleRightSidebar}
              title={isRightSidebarCollapsed ? '点击展开右侧智能异动预警栏' : '点击收起右侧智能异动预警栏'}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer border ${
                !isRightSidebarCollapsed
                  ? 'bg-rose-950/80 text-rose-300 border-rose-700/80 hover:bg-rose-900 shadow-2xs'
                  : 'bg-[#162347] text-slate-300 border-slate-700 hover:bg-[#1d2f5e] hover:text-white'
              }`}
            >
              <BellRing className={`w-3.5 h-3.5 ${!isRightSidebarCollapsed ? 'text-rose-400 animate-bounce' : 'text-slate-400'}`} />
              <span className="flex items-center gap-1.5">
                <span>预警雷达</span>
                <span className={`text-[10px] px-1 py-0.2 rounded font-normal ${
                  !isRightSidebarCollapsed ? 'bg-rose-900/80 text-rose-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {!isRightSidebarCollapsed ? '已显示' : '展开'}
                </span>
              </span>
            </button>
          )}

          {/* 📸 Prominent Export Image Button with Sector Options Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <div className="flex items-center shadow-xs">
              <button
                id="website-btn-export-image"
                onClick={() => onOpenExportImage(activeTab)}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-l-lg bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs border border-r-0 border-red-400/40 transition-all cursor-pointer"
                title={`快速导出当前【${getTabShortName(activeTab)}】板块研报图片`}
              >
                <Camera className="w-3.5 h-3.5 text-red-100" />
                <span>📸 导出研报图片</span>
                <span className="hidden xl:inline text-[10px] bg-red-800/60 px-1 rounded font-normal text-red-200">
                  {getTabShortName(activeTab)}
                </span>
              </button>
              <button
                id="website-btn-export-menu"
                type="button"
                onClick={() => setIsExportMenuOpen(v => !v)}
                className="px-1.5 py-1.5 rounded-r-lg bg-red-700 hover:bg-red-600 text-white border border-red-400/40 transition-all cursor-pointer flex items-center justify-center"
                title="展开各个板块研报图片导出选项"
              >
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExportMenuOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Dropdown Menu for each sector */}
            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 bg-[#0f172a] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2.5 bg-[#0b1329] flex items-center justify-between text-[11px] text-slate-300 font-bold border-b border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-rose-400" />
                    <span>各个板块导出研报图片选项</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 font-normal">独立数据源</span>
                </div>

                {/* Current Tab Quick Export */}
                <div className="p-1 bg-slate-900/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportMenuOpen(false);
                      onOpenExportImage(activeTab);
                    }}
                    className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-rose-300 hover:text-white transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-bold flex items-center gap-1">
                          <span>快速导出当前视图</span>
                          <span className="text-[9.5px] bg-rose-500/20 text-rose-300 px-1.5 py-0.2 rounded font-semibold border border-rose-500/30">
                            {getTabShortName(activeTab)}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">基于当前所处视图特定数据源快照</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Specific Sector Options */}
                <div className="p-1 space-y-0.5 max-h-72 overflow-y-auto">
                  {[
                    { id: 'etf_valuation', tpl: 'etf_valuation', label: '全市场ETF基金估值全景图', desc: '宽基/策略/行业/主题/全球估值与分位', icon: Layers, color: 'text-violet-400' },
                    { id: 'industry_valuation', tpl: 'industry_valuation', label: '31个行业估值全景图', desc: '申万一级PE/PB/ROE与历史十年分位', icon: Gauge, color: 'text-indigo-400' },
                    { id: 'heatmap', tpl: 'market_treemap', label: '全市场板块个股热力图', desc: '52etf同款·等比矩形树状热力图', icon: LayoutGrid, color: 'text-rose-400' },
                    { id: 'fundflow', tpl: 'fundflow_panorama', label: '行业主力资金全景图', desc: '资金流看板·TOP10多空对峙榜', icon: BarChart2, color: 'text-blue-400' },
                    { id: 'overview', tpl: 'gainers_losers', label: '大盘全景 · 领涨与领跌榜', desc: '行业与概念领涨领跌梯队对照', icon: TrendingUp, color: 'text-emerald-400' },
                    { id: 'overview', tpl: 'market_overview', label: 'A股大盘全景总览图', desc: '8大核心指数+两市成交量能', icon: Activity, color: 'text-cyan-400' },
                    { id: 'sentiment', tpl: 'sentiment_ladder', label: '市场情绪与连板天梯复盘', desc: '涨跌停分布+短线情绪罗盘', icon: Flame, color: 'text-amber-400' },
                    { id: 'gold', tpl: 'gold_macro', label: '黄金大宗与金矿联动研报', desc: '外盘现货金+A股金矿龙头联动', icon: Sparkles, color: 'text-yellow-400' },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={`${opt.id}-${opt.tpl}`}
                        type="button"
                        onClick={() => {
                          setIsExportMenuOpen(false);
                          onOpenExportImage(opt.id, opt.tpl);
                        }}
                        className="w-full text-left p-2 rounded-lg hover:bg-slate-800 flex items-center justify-between text-slate-200 hover:text-white transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2">
                          <Icon className={`w-3.5 h-3.5 ${opt.color} group-hover:scale-110 transition-transform`} />
                          <div>
                            <div className="font-semibold text-slate-200">{opt.label}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{opt.desc}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="p-2 bg-[#0b1329] text-[10px] text-slate-500 text-center font-mono">
                  🔒 各板块数据源严格隔离 · 禁止交叉串联
                </div>
              </div>
            )}
          </div>

          {/* AI Advisor Button */}
          <button
            id="website-btn-ai-advisor"
            onClick={onOpenAIDiagnosis}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-sm border border-indigo-400/40 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
            <span>AI 投研分析</span>
          </button>
        </div>
      </div>

      {/* 2. SECONDARY ROW: PROFESSIONAL WEBSITE HORIZONTAL NAVIGATION BAR */}
      <div className="bg-[#0e1836] border-b border-slate-800/80 px-4">
        <div className="max-w-[1780px] mx-auto flex items-center justify-between overflow-x-auto no-scrollbar py-0.5">
          <nav className="flex items-center space-x-1 sm:space-x-1.5 text-xs font-semibold py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`web-nav-tab-${item.id}`}
                  onClick={() => onTabChange(item.id)}
                  className={`px-3 py-1.5 rounded-md flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-red-600 text-white font-bold shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1 rounded-xs uppercase">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Meta Tag: Current Portal Mode */}
          <div className="hidden xl:flex items-center space-x-3 text-[11px] text-slate-400 font-mono shrink-0 pl-4">
            <span className="text-slate-500">|</span>
            <span>数据更新时效: <strong>实时毫秒级</strong></span>
            <span className="text-slate-500">|</span>
            <span>采集记录: <strong className="text-cyan-400">{overviewData.totalRecords.toLocaleString()}</strong> 条</span>
          </div>
        </div>
      </div>
    </header>
  );
};
