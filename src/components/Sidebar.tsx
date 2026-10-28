import React from 'react';
import { 
  BarChart3, 
  Target, 
  Star, 
  Database,
  RefreshCw,
  BrainCircuit,
  Coins,
  Trophy,
  Zap,
  Globe,
  Search,
  Server,
  Flame,
  LayoutDashboard,
  Layers,
  LayoutGrid
} from 'lucide-react';
import { ActiveNavigationTab, MarketOverviewData } from '../types/market';

interface SidebarProps {
  activeTab: ActiveNavigationTab;
  onTabChange: (tab: ActiveNavigationTab) => void;
  overviewData: MarketOverviewData;
  watchlistCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  overviewData,
  watchlistCount
}) => {
  const navItems: { key: ActiveNavigationTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { key: 'fundflow', label: '资金流看板', icon: <Target className="w-4 h-4 text-rose-400" />, badge: '主视图' },
    { key: 'heatmap', label: '个股热力图', icon: <LayoutGrid className="w-4 h-4 text-rose-400" />, badge: '高清' },
    { key: 'cb_pre', label: '待发转债', icon: <Layers className="w-4 h-4 text-pink-400" />, badge: '抢权' },
    { key: 'overview', label: '大盘总览', icon: <LayoutDashboard className="w-4 h-4 text-blue-400" /> },
    { key: 'sectors', label: '深度板块资金', icon: <BarChart3 className="w-4 h-4 text-indigo-400" /> },
    { key: 'quant', label: '量化分析', icon: <BrainCircuit className="w-4 h-4 text-cyan-400" /> },
    { key: 'gold', label: '黄金分析', icon: <Coins className="w-4 h-4 text-amber-400" /> },
    { key: 'toptraders', label: '实盘高手', icon: <Trophy className="w-4 h-4 text-yellow-400" /> },
    { key: 'anomalies', label: '短线精灵', icon: <Zap className="w-4 h-4 text-rose-400" /> },
    { key: 'usmarket', label: '美股行情', icon: <Globe className="w-4 h-4 text-blue-400" /> },
    { key: 'stockquery', label: '个股查询', icon: <Search className="w-4 h-4 text-teal-400" /> },
    { key: 'sentiment', label: '市场情绪', icon: <Flame className="w-4 h-4 text-orange-400" /> },
    { key: 'crawler', label: '采集监控', icon: <Server className="w-4 h-4 text-emerald-400" /> },
    { key: 'watchlist', label: '我的自选股', icon: <Star className="w-4 h-4 text-amber-300" />, badge: watchlistCount > 0 ? String(watchlistCount) : undefined },
  ];

  return (
    <aside 
      id="main-sidebar"
      className="w-56 bg-[#0b1329] border-r border-slate-800/80 flex flex-col justify-between flex-shrink-0 min-h-screen text-slate-300 select-none z-30"
    >
      {/* 1. Header Logo & Title */}
      <div>
        <div className="p-4 border-b border-slate-800/70">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-950">
              <BarChart3 className="w-5 h-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base font-extrabold tracking-tight text-white leading-tight">
                A股板块资金流
              </h1>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                实时采集 · 东方财富
              </p>
            </div>
          </div>
        </div>

        {/* 2. Navigation Menu */}
        <div className="px-2 py-3 space-y-0.5 max-h-[calc(100vh-210px)] overflow-y-auto">
          <div className="px-3 py-1 text-[10.5px] font-medium text-slate-500 tracking-wider">
            核心功能导航
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                id={`sidebar-nav-${item.key}`}
                onClick={() => onTabChange(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-950 font-semibold'
                    : 'text-slate-300 hover:bg-slate-900/80 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Collection Status Card */}
      <div className="p-3 m-2 rounded-xl bg-[#070d1e] border border-slate-800/90 text-xs space-y-1.5">
        <div className="flex items-center justify-between text-slate-400 border-b border-slate-800/60 pb-1">
          <span className="flex items-center gap-1.5 font-medium text-slate-300 text-[11.5px]">
            <Database className="w-3.5 h-3.5 text-blue-400" />
            数据入库正常
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="采集服务正常"></span>
        </div>

        <div className="font-mono text-white text-xs font-semibold">
          {overviewData.lastCollectTime}
        </div>

        <div className="text-[10.5px] text-slate-400 font-mono flex items-center justify-between">
          <span>总记录:</span>
          <span className="text-cyan-300 font-semibold">{overviewData.totalRecords.toLocaleString()} 条</span>
        </div>
      </div>
    </aside>
  );
};
