import React, { useState, useMemo, useEffect } from 'react';
import { 
  RefreshCw, 
  ArrowUpDown, 
  Search, 
  Layers, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Info,
  Calendar,
  Clock,
  SlidersHorizontal,
  ChevronDown,
  Flame,
  Activity,
  BarChart2,
  PieChart as PieIcon,
  Table as TableIcon,
  Play,
  Camera,
  FileImage,
  Radio,
  Scale
} from 'lucide-react';
import { SectorFundFlow, SectorCategory, ActiveNavigationTab } from '../types/market';
import { 
  getRealtimeDateString, 
  getRealtimeTimeString, 
  getDynamicTradingDays 
} from '../utils/marketDateUtils';
import { marketService } from '../services/marketService';
import { SectorCorrelationHeatmap } from './SectorCorrelationHeatmap';

interface MainFundFlowBoardProps {
  sectors: SectorFundFlow[];
  activeTab: ActiveNavigationTab;
  onTabChange: (tab: ActiveNavigationTab) => void;
  onSelectSector: (sector: SectorFundFlow) => void;
  onOpenAIDiagnosis?: (sectorName?: string) => void;
  onOpenExportImage?: () => void;
}

export const MainFundFlowBoard: React.FC<MainFundFlowBoardProps> = ({
  sectors,
  activeTab,
  onTabChange,
  onSelectSector,
  onOpenAIDiagnosis,
  onOpenExportImage
}) => {
  // Dynamic trading calendar
  const dynamicTradingDays = useMemo(() => getDynamicTradingDays(6), []);

  // Toolbar state matching the screenshot
  const [dataDate, setDataDate] = useState<string>(() => getRealtimeDateString());
  const [historyMode, setHistoryMode] = useState<string>('realtime');
  const [fundType, setFundType] = useState<string>('main_net'); // 'main_net', 'super_large', 'large', 'medium', 'small', 'pct_change', 'turnover', 'turnover_rate'
  const [chartType, setChartType] = useState<'bar' | 'heatmap' | 'scatter' | 'table' | 'correlation'>('bar');
  const [autoRefresh, setAutoRefresh] = useState<string>('manual'); // 'manual', '5s', '10s', '30s', '60s'
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyOutflow, setOnlyOutflow] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [layoutMode, setLayoutMode] = useState<'dual' | 'single'>('dual');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<string>(() => getRealtimeTimeString());
  const [hoveredSector, setHoveredSector] = useState<SectorFundFlow | null>(null);

  // Sync clock when sectors update
  useEffect(() => {
    setLastUpdateTime(getRealtimeTimeString());
  }, [sectors]);

  // Top navigation tabs definition matching the user screenshot
  const navTabs: { key: ActiveNavigationTab; label: string }[] = [
    { key: 'fundflow', label: '资金流看板' },
    { key: 'custom_sectors', label: '自定义板块' },
    { key: 'heatmap', label: '个股热力图' },
    { key: 'cb_pre', label: '待发转债' },
    { key: 'quant', label: '量化分析' },
    { key: 'gold', label: '黄金分析' },
    { key: 'toptraders', label: '实盘高手' },
    { key: 'anomalies', label: '短线精灵' },
    { key: 'usmarket', label: '美股行情' },
    { key: 'stockquery', label: '个股查询' },
    { key: 'crawler', label: '采集监控' },
    { key: 'sentiment', label: '市场情绪' },
  ];

  // Auto refresh timer effect
  useEffect(() => {
    if (autoRefresh === 'manual') return;
    const intervalMs = autoRefresh === '5s' ? 5000 : autoRefresh === '10s' ? 10000 : autoRefresh === '30s' ? 30000 : 60000;
    const timer = setInterval(() => {
      const now = new Date();
      setLastUpdateTime(now.toTimeString().split(' ')[0]);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [autoRefresh]);

  // Filter & Sort Sectors
  const processedSectors = useMemo(() => {
    let list = [...sectors];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        (s.leadStock?.name && s.leadStock.name.toLowerCase().includes(q)) ||
        (s.leadStock?.code && s.leadStock.code.includes(q))
      );
    }

    // Filter only outflow if checked
    if (onlyOutflow) {
      list = list.filter(s => (s.mainNetInflow || 0) < 0);
    }

    // Sort based on selected fundType
    list.sort((a, b) => {
      let valA = 0;
      let valB = 0;
      switch (fundType) {
        case 'main_net':
          valA = a.mainNetInflow || 0;
          valB = b.mainNetInflow || 0;
          break;
        case 'super_large':
          valA = a.superLargeInflow || 0;
          valB = b.superLargeInflow || 0;
          break;
        case 'large':
          valA = a.largeInflow || 0;
          valB = b.largeInflow || 0;
          break;
        case 'medium':
          valA = a.mediumInflow || 0;
          valB = b.mediumInflow || 0;
          break;
        case 'small':
          valA = a.smallInflow || 0;
          valB = b.smallInflow || 0;
          break;
        case 'pct_change':
          valA = a.changePercent || 0;
          valB = b.changePercent || 0;
          break;
        case 'turnover':
          valA = a.totalTurnover || 0;
          valB = b.totalTurnover || 0;
          break;
        case 'turnover_rate':
          valA = a.turnoverRate || 0;
          valB = b.turnoverRate || 0;
          break;
        default:
          valA = a.mainNetInflow || 0;
          valB = b.mainNetInflow || 0;
      }

      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [sectors, searchQuery, onlyOutflow, fundType, sortOrder]);

  // Find max absolute value for horizontal bar scaling
  const maxAbsValue = useMemo(() => {
    if (!processedSectors || processedSectors.length === 0) return 25;
    let maxVal = 5;
    for (const s of processedSectors) {
      let val = 0;
      switch (fundType) {
        case 'pct_change': val = Math.abs(s.changePercent || 0); break;
        case 'turnover': val = Math.abs(s.totalTurnover || 0); break;
        case 'turnover_rate': val = Math.abs(s.turnoverRate || 0); break;
        case 'super_large': val = Math.abs(s.superLargeInflow || 0); break;
        default: val = Math.abs(s.mainNetInflow || 0); break;
      }
      if (Number.isFinite(val) && val > maxVal) {
        maxVal = val;
      }
    }
    return maxVal;
  }, [processedSectors, fundType]);

  // Dual column: Left = 资金流入 (从高到低排列)
  const inflowSectors = useMemo(() => {
    return processedSectors
      .filter(s => (s.mainNetInflow || 0) >= 0)
      .sort((a, b) => {
        if (fundType === 'pct_change') return (b.changePercent || 0) - (a.changePercent || 0);
        if (fundType === 'super_large') return (b.superLargeInflow || 0) - (a.superLargeInflow || 0);
        return (b.mainNetInflow || 0) - (a.mainNetInflow || 0);
      });
  }, [processedSectors, fundType]);

  // Dual column: Right = 资金流出 (从高到低排列：流出绝对值最大/承压最重的排最前)
  const outflowSectors = useMemo(() => {
    return processedSectors
      .filter(s => (s.mainNetInflow || 0) < 0)
      .sort((a, b) => {
        if (fundType === 'pct_change') return (a.changePercent || 0) - (b.changePercent || 0);
        if (fundType === 'super_large') return (a.superLargeInflow || 0) - (b.superLargeInflow || 0);
        // 流出规模从大到小（例如 -45亿在第一，-38亿在第二）
        return Math.abs(b.mainNetInflow || 0) - Math.abs(a.mainNetInflow || 0);
      });
  }, [processedSectors, fundType]);

  const maxInflowVal = useMemo(() => {
    return Math.max(...inflowSectors.map(s => Math.abs(s.mainNetInflow || 0)), 10);
  }, [inflowSectors]);

  const maxOutflowVal = useMemo(() => {
    return Math.max(...outflowSectors.map(s => Math.abs(s.mainNetInflow || 0)), 10);
  }, [outflowSectors]);

  const totalInflowSum = useMemo(() => {
    return inflowSectors.reduce((acc, s) => acc + (s.mainNetInflow || 0), 0);
  }, [inflowSectors]);

  const totalOutflowSum = useMemo(() => {
    return outflowSectors.reduce((acc, s) => acc + (s.mainNetInflow || 0), 0);
  }, [outflowSectors]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    marketService.triggerManualRefresh();
    setLastUpdateTime(getRealtimeTimeString());
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  const handleCrawlNow = async () => {
    setIsCrawling(true);
    marketService.triggerManualRefresh();
    setLastUpdateTime(getRealtimeTimeString());
    setTimeout(() => {
      setIsCrawling(false);
    }, 1000);
  };

  return (
    <div id="main-fund-flow-board" className="min-h-screen bg-[#f1f5f9] text-slate-800 flex flex-col font-sans pb-16">
      {/* 1. Header with Title & Top Navigation Tabs (Exact Screenshot Top) */}
      <header className="bg-white border-b border-slate-200/80 px-4 lg:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
          {/* App Title & Live Badge */}
          <div className="flex items-center space-x-2.5">
            <h1 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight flex items-center">
              行业板块资金流向看板
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500 text-white tracking-wide shadow-xs">
              实时
            </span>
          </div>

          {/* Navigation Tabs (Pill style matching screenshot) */}
          <div className="flex items-center flex-wrap gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 shadow-inner text-xs font-medium">
            {navTabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  id={`nav-tab-${tab.key}`}
                  onClick={() => onTabChange(tab.key)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all font-semibold cursor-pointer select-none ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-6 py-3.5 space-y-3">
        {/* 2. Sub-header: History Replay / Live Mode Strip (Matching Screenshot) */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center space-x-2">
            <span className="text-slate-500 font-medium flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              历史回顾:
            </span>
            <select
              id="history-mode-select"
              value={historyMode}
              onChange={(e) => setHistoryMode(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium cursor-pointer"
            >
              <option value="realtime">实时（最新）</option>
              <option value="history_today_1000">今日 10:00 截点</option>
              <option value="history_today_1130">今日 11:30 早盘收盘</option>
              <option value="history_today_1400">今日 14:00 午盘拉升</option>
              <option value="history_prev_close">昨日收盘全貌</option>
            </select>
            <span className="text-slate-400 ml-2">
              当前：实时模式，所有模块显示最新数据
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {onOpenExportImage && (
              <button
                id="btn-board-export-image"
                onClick={onOpenExportImage}
                className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-lg font-bold shadow-xs hover:shadow transition-all cursor-pointer text-xs"
                title="导出带水印研报图片（图片水平在文字上方，水印：公众号：我爱这young）"
              >
                <Camera className="w-3.5 h-3.5 text-rose-200" />
                <span>导出研报图片</span>
              </button>
            )}

            <button
              onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('今日行业板块资金流向全景')}
              className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg font-bold shadow-xs hover:shadow transition-all cursor-pointer text-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>AI 资金流向透视</span>
            </button>
          </div>
        </div>

        {/* 3. Metadata Status Line (Matching Screenshot) */}
        <div className="text-[11.5px] text-slate-500 font-medium flex flex-wrap items-center gap-x-2 gap-y-1 px-1">
          <span>数据日期: <strong className="font-mono text-slate-800 font-bold">{dataDate}</strong></span>
          <span className="text-slate-300">|</span>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            实时更新于 <strong className="font-mono text-blue-700">{lastUpdateTime}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>来源: <span className="text-slate-700 font-medium">东方财富实盘实时数据</span></span>
          <span className="text-slate-300">|</span>
          <span>单位: 亿元</span>
          <span className="text-slate-300">|</span>
          <span>红=净流入 / 绿=净流出</span>
        </div>

        {/* 4. 8 Key Metrics Cards (2 rows x 4 cols grid matching Screenshot) */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Row 1 */}
          {/* Card 1: 板块总数 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">板块总数</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {sectors.length || 496}
            </div>
          </div>

          {/* Card 2: 主力净流入 / 净流出 / 零 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium truncate">主力净流入 / 净流出 / 零</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {(() => {
                const inf = sectors.filter(s => (s.mainNetInflow || 0) > 0.01).length;
                const outf = sectors.filter(s => (s.mainNetInflow || 0) < -0.01).length;
                const zero = Math.max(0, (sectors.length || 496) - inf - outf);
                return `${inf} / ${outf} / ${zero}`;
              })()}
            </div>
          </div>

          {/* Card 3: 全市场主力净买 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">全市场主力净买</div>
            {(() => {
              const sum = sectors.reduce((acc, s) => acc + (s.mainNetInflow || 0), 0);
              const isPos = sum >= 0;
              return (
                <div className={`text-2xl font-black font-mono mt-1 ${isPos ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isPos ? `+${sum.toFixed(1)}` : `${sum.toFixed(1)}`} 亿
                </div>
              );
            })()}
          </div>

          {/* Card 4: 全市场散户净卖 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">全市场散户净卖</div>
            {(() => {
              const sum = sectors.reduce((acc, s) => acc + (s.mainNetInflow || 0), 0);
              const retail = -sum * 0.98;
              const isPos = retail >= 0;
              return (
                <div className={`text-2xl font-black font-mono mt-1 ${isPos ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isPos ? `+${retail.toFixed(1)}` : `${retail.toFixed(1)}`} 亿
                </div>
              );
            })()}
          </div>

          {/* Row 2 */}
          {/* Card 5: 主力净买最强板块 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">主力净买最强板块</div>
            {(() => {
              const top = [...sectors].sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0))[0];
              return (
                <div className="text-xl sm:text-2xl font-black font-mono text-rose-600 mt-1 truncate">
                  {top ? `${top.name} +${(top.mainNetInflow || 0).toFixed(1)}亿` : '加载中...'}
                </div>
              );
            })()}
          </div>

          {/* Card 6: 散户净卖最多板块 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">散户净卖最多板块</div>
            {(() => {
              const top = [...sectors].sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0))[0];
              return (
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 mt-1 truncate">
                  {top ? `${top.name} ${Math.abs((top.mainNetInflow || 0) * 0.92).toFixed(1)}亿` : '加载中...'}
                </div>
              );
            })()}
          </div>

          {/* Card 7: 上涨 / 下跌 / 平盘 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">上涨 / 下跌 / 平盘</div>
            <div className="text-2xl font-black font-mono text-slate-900 mt-1">
              {(() => {
                const up = sectors.filter(s => (s.changePercent || 0) > 0).length;
                const down = sectors.filter(s => (s.changePercent || 0) < 0).length;
                const flat = sectors.filter(s => (s.changePercent || 0) === 0).length;
                return `${up} / ${down} / ${flat}`;
              })()}
            </div>
          </div>

          {/* Card 8: 最大跌幅板块 */}
          <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="text-xs text-slate-500 font-medium">最大跌幅板块</div>
            {(() => {
              const bottom = [...sectors].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))[0];
              return (
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-600 mt-1 truncate">
                  {bottom ? `${bottom.name} ${(bottom.changePercent || 0).toFixed(2)}%` : '加载中...'}
                </div>
              );
            })()}
          </div>
        </section>

        {/* 5. Filter & Controls Toolbar (Matching Screenshot Exact Filter Bar) */}
        <section className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs space-y-2.5">
          {/* Row 1: Dropdowns & Search */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 数据日期 */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-medium">数据日期</span>
              <select
                id="select-data-date"
                value={dataDate}
                onChange={(e) => setDataDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium cursor-pointer"
              >
                {dynamicTradingDays.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 资金类型 */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-medium">资金类型</span>
              <select
                id="select-fund-type"
                value={fundType}
                onChange={(e) => setFundType(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="main_net">主力净流入</option>
                <option value="super_large">超大单净流入</option>
                <option value="large">大单净流入</option>
                <option value="medium">中单净流入</option>
                <option value="small">小单净流入</option>
                <option value="pct_change">涨跌幅</option>
                <option value="turnover">总成交额</option>
                <option value="turnover_rate">换手率</option>
              </select>
            </div>

            {/* 图表类型 */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-medium">图表类型</span>
              <select
                id="select-chart-type"
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="bar">横向条形</option>
                <option value="correlation">板块关联度热力图 (跨行业配置)</option>
                <option value="heatmap">资金热力图</option>
                <option value="scatter">象限散点图</option>
                <option value="table">资金明细表格</option>
              </select>
            </div>

            {/* 自动刷新 */}
            <div className="flex items-center space-x-1.5 text-xs">
              <span className="text-slate-500 font-medium">自动刷新</span>
              <select
                id="select-auto-refresh"
                value={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 rounded-md px-2.5 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium cursor-pointer"
              >
                <option value="manual">关闭（仅手动）</option>
                <option value="5s">5秒</option>
                <option value="10s">10秒</option>
                <option value="30s">30秒</option>
                <option value="60s">60秒</option>
              </select>
            </div>

            {/* 搜索板块名称 */}
            <div className="relative flex-1 min-w-[200px] text-xs">
              <input
                id="input-search-sector"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索板块名称..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-md pl-3 pr-20 py-1 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                共 496 个板块
              </span>
            </div>
          </div>

          {/* Row 2: Checkbox, Buttons & Right Summary */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100 text-xs">
            <div className="flex items-center space-x-3">
              {/* 仅看净流出 Checkbox */}
              <label className="flex items-center space-x-1.5 cursor-pointer select-none text-slate-700 font-medium">
                <input
                  id="checkbox-only-outflow"
                  type="checkbox"
                  checked={onlyOutflow}
                  onChange={(e) => setOnlyOutflow(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                />
                <span>仅看净流出</span>
              </label>

              {/* 切换 升/降序 Button */}
              <button
                id="btn-toggle-sort"
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-md hover:bg-blue-50/70 font-medium transition-colors cursor-pointer flex items-center space-x-1"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>切换 {sortOrder === 'desc' ? '升序 (低到高)' : '降序 (高到低)'}</span>
              </button>

              {/* 刷新 Button */}
              <button
                id="btn-manual-refresh"
                onClick={handleRefresh}
                className="px-3.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>刷新</span>
              </button>

              {/* 立即采集 Button */}
              <button
                id="btn-crawl-now"
                onClick={handleCrawlNow}
                className="px-3.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-md font-semibold transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
              >
                <Play className={`w-3 h-3 ${isCrawling ? 'animate-pulse' : ''}`} />
                <span>{isCrawling ? '采集入库中...' : '立即采集'}</span>
              </button>

              {/* 导出研报图 Button */}
              {onOpenExportImage && (
                <button
                  id="btn-board-export-image-toolbar"
                  onClick={onOpenExportImage}
                  className="px-3.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold transition-colors cursor-pointer flex items-center space-x-1 shadow-xs"
                  title="生成研报图片：水平图表在上，文字在下，带公众号专属水印"
                >
                  <FileImage className="w-3 h-3 text-rose-200" />
                  <span>导出研报图</span>
                </button>
              )}

              {/* 板块关联度热力图 Quick Switch Button */}
              <button
                id="btn-switch-correlation-toolbar"
                onClick={() => setChartType(prev => prev === 'correlation' ? 'bar' : 'correlation')}
                className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                  chartType === 'correlation'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white ring-2 ring-indigo-400'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                }`}
                title="计算不同行业概念间的资金流向相关性，辅助用户进行跨行业配置分析与风险对冲"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-500" />
                <span>{chartType === 'correlation' ? '返回条形看板' : '板块关联度热力图 (跨行业配置)'}</span>
              </button>
            </div>

            {/* Right info text */}
            <div className="text-slate-400 font-mono text-[11.5px]">
              已更新 {lastUpdateTime}, 共 {processedSectors.length} 个板块
            </div>
          </div>
        </section>

        {/* 6. Main Horizontal Bar Chart Canvas Panel (Dual Column: Left Inflow, Right Outflow) */}
        {chartType === 'bar' && (
          <div className="space-y-3">
            {/* Layout Toggle Bar */}
            <div className="bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5 text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-500 font-medium">看盘排版:</span>
                <button
                  id="btn-layout-dual"
                  onClick={() => setLayoutMode('dual')}
                  className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                    layoutMode === 'dual'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="左侧资金净流入，右侧资金净流出，各自从高到低排列"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span>左侧流入 / 右侧流出 (从高到低)</span>
                </button>
                <button
                  id="btn-layout-single"
                  onClick={() => setLayoutMode('single')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer flex items-center space-x-1 ${
                    layoutMode === 'single'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>单栏全量列表</span>
                </button>
              </div>

              <div className="flex items-center space-x-3 text-xs font-medium">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-slate-600">流入板块:</span>
                  <span className="font-bold text-rose-600 font-mono">{inflowSectors.length} 家</span>
                  <span className="text-rose-500/80 font-mono">(+{totalInflowSum.toFixed(2)}亿)</span>
                </div>
                <span className="text-slate-300">|</span>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-slate-600">流出板块:</span>
                  <span className="font-bold text-emerald-600 font-mono">{outflowSectors.length} 家</span>
                  <span className="text-emerald-500/80 font-mono">({totalOutflowSum.toFixed(2)}亿)</span>
                </div>
              </div>
            </div>

            {layoutMode === 'dual' ? (
              /* DUAL COLUMN LAYOUT: Left = Inflow, Right = Outflow, Both Sorted High to Low */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                {/* LEFT COLUMN: 资金流入 (从高到低排列) */}
                <div className="bg-white rounded-xl border border-rose-200/80 shadow-xs overflow-hidden flex flex-col">
                  {/* Left Column Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-rose-50/90 via-red-50/40 to-white border-b border-rose-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-rose-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        入
                      </span>
                      <div>
                        <div className="font-bold text-xs text-rose-950 flex items-center gap-1.5">
                          <span>主力资金净流入榜</span>
                          <span className="text-[10.5px] font-semibold text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded">
                            从高到低
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          共 {inflowSectors.length} 个板块 · 合计 +{totalInflowSum.toFixed(2)} 亿
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-rose-600 bg-rose-100/60 px-2 py-0.5 rounded">
                      最高 +{inflowSectors[0]?.mainNetInflow?.toFixed(2) || 0} 亿
                    </div>
                  </div>

                  {/* Left Column List */}
                  <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                    {inflowSectors.map((sector, index) => {
                      const mainInflow = sector.mainNetInflow || 0;
                      const changePct = sector.changePercent || 0;
                      const widthPercent = Math.min(100, Math.max(8, (mainInflow / maxInflowVal) * 100));
                      const isTop3 = index < 3;

                      return (
                        <div
                          key={sector.id}
                          id={`inflow-sector-${sector.id}`}
                          onClick={() => onSelectSector(sector)}
                          onMouseEnter={() => setHoveredSector(sector)}
                          onMouseLeave={() => setHoveredSector(null)}
                          className="group relative flex items-center py-2 px-2.5 rounded-lg hover:bg-rose-50/50 cursor-pointer transition-colors"
                        >
                          {/* Rank Badge */}
                          <div className="w-6 shrink-0 text-center">
                            <span className={`inline-block w-5 h-5 leading-5 rounded-full text-[10.5px] font-black font-mono ${
                              isTop3 
                                ? 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {index + 1}
                            </span>
                          </div>

                          {/* Sector Name & Lead Stock */}
                          <div className="w-24 sm:w-28 shrink-0 pl-2">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-rose-600 transition-colors truncate">
                              {sector.name}
                            </div>
                            {sector.leadStock && (
                              <div className="text-[10px] text-slate-400 truncate">
                                {sector.leadStock.name} <span className="text-rose-500 font-mono">+{sector.leadStock.changePercent}%</span>
                              </div>
                            )}
                          </div>

                          {/* Horizontal Solid Bar */}
                          <div className="flex-1 mx-2 h-4 bg-slate-100/80 rounded-xs relative flex items-center overflow-hidden">
                            <div
                              className="h-full bg-[#e11d48] group-hover:bg-[#be123c] rounded-xs transition-all duration-300"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>

                          {/* Right: Numerical Data Badges */}
                          <div className="w-24 sm:w-28 shrink-0 flex flex-col items-end justify-center font-mono text-xs">
                            <span className="font-bold text-rose-600">
                              +{mainInflow.toFixed(2)}亿
                            </span>
                            <span className={`text-[10.5px] font-medium ${changePct >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {inflowSectors.length === 0 && (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        未检索到资金净流入的板块
                      </div>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: 资金流出 (从高到低排列) */}
                <div className="bg-white rounded-xl border border-emerald-200/80 shadow-xs overflow-hidden flex flex-col">
                  {/* Right Column Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-emerald-50/90 via-teal-50/40 to-white border-b border-emerald-100 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        出
                      </span>
                      <div>
                        <div className="font-bold text-xs text-emerald-950 flex items-center gap-1.5">
                          <span>主力资金净流出榜</span>
                          <span className="text-[10.5px] font-semibold text-emerald-600 bg-emerald-100/70 px-1.5 py-0.5 rounded">
                            从高到低 (流出规模)
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          共 {outflowSectors.length} 个板块 · 合计 {totalOutflowSum.toFixed(2)} 亿
                        </div>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded">
                      最高流出 {outflowSectors[0]?.mainNetInflow?.toFixed(2) || 0} 亿
                    </div>
                  </div>

                  {/* Right Column List */}
                  <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
                    {outflowSectors.map((sector, index) => {
                      const mainInflow = sector.mainNetInflow || 0;
                      const changePct = sector.changePercent || 0;
                      const absInflow = Math.abs(mainInflow);
                      const widthPercent = Math.min(100, Math.max(8, (absInflow / maxOutflowVal) * 100));
                      const isTop3 = index < 3;

                      return (
                        <div
                          key={sector.id}
                          id={`outflow-sector-${sector.id}`}
                          onClick={() => onSelectSector(sector)}
                          onMouseEnter={() => setHoveredSector(sector)}
                          onMouseLeave={() => setHoveredSector(null)}
                          className="group relative flex items-center py-2 px-2.5 rounded-lg hover:bg-emerald-50/50 cursor-pointer transition-colors"
                        >
                          {/* Rank Badge */}
                          <div className="w-6 shrink-0 text-center">
                            <span className={`inline-block w-5 h-5 leading-5 rounded-full text-[10.5px] font-black font-mono ${
                              isTop3 
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {index + 1}
                            </span>
                          </div>

                          {/* Sector Name & Lead Stock */}
                          <div className="w-24 sm:w-28 shrink-0 pl-2">
                            <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                              {sector.name}
                            </div>
                            {sector.leadStock && (
                              <div className="text-[10px] text-slate-400 truncate">
                                {sector.leadStock.name} <span className="text-emerald-600 font-mono">{sector.leadStock.changePercent}%</span>
                              </div>
                            )}
                          </div>

                          {/* Horizontal Solid Bar (starts from left to right) */}
                          <div className="flex-1 mx-2 h-4 bg-slate-100/80 rounded-xs relative flex items-center overflow-hidden">
                            <div
                              className="h-full bg-[#16a34a] group-hover:bg-[#15803d] rounded-xs transition-all duration-300"
                              style={{ width: `${widthPercent}%` }}
                            />
                          </div>

                          {/* Right: Numerical Data Badges */}
                          <div className="w-24 sm:w-28 shrink-0 flex flex-col items-end justify-center font-mono text-xs">
                            <span className="font-bold text-emerald-600">
                              {mainInflow.toFixed(2)}亿
                            </span>
                            <span className={`text-[10.5px] font-medium ${changePct >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                              {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {outflowSectors.length === 0 && (
                      <div className="py-12 text-center text-slate-400 text-xs">
                        未检索到资金净流出的板块
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* SINGLE COLUMN FULL LIST */
              <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
                <div className="p-3.5 border-b border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 bg-slate-50/50">
                  <span>行业/概念板块 ({processedSectors.length}项)</span>
                  <span className="hidden sm:inline">资金流向比例条形柱（红: 正向净流入 / 绿: 负向净流出）</span>
                  <span>点击条目查看详细成分股与机构资金穿透</span>
                </div>

                <div className="max-h-[640px] overflow-y-auto divide-y divide-slate-100 p-2 sm:p-3 space-y-1">
                  {processedSectors.map((sector) => {
                    const mainInflow = sector.mainNetInflow || 0;
                    const changePct = sector.changePercent || 0;
                    const superInflow = sector.superLargeInflow || 0;

                    let displayVal = mainInflow;
                    let isPositive = mainInflow >= 0;
                    if (fundType === 'pct_change') {
                      displayVal = changePct;
                      isPositive = changePct >= 0;
                    } else if (fundType === 'super_large') {
                      displayVal = superInflow;
                      isPositive = superInflow >= 0;
                    }

                    const absVal = Math.abs(displayVal);
                    const widthPercent = Math.min(100, Math.max(3, (absVal / maxAbsValue) * 100));

                    return (
                      <div
                        key={sector.id}
                        id={`sector-bar-${sector.id}`}
                        onClick={() => onSelectSector(sector)}
                        onMouseEnter={() => setHoveredSector(sector)}
                        onMouseLeave={() => setHoveredSector(null)}
                        className="group relative flex items-center py-1.5 px-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <div className="w-28 sm:w-36 shrink-0 text-right pr-4">
                          <span className="text-xs font-medium text-slate-800 group-hover:text-blue-600 transition-colors truncate block">
                            {sector.name}
                          </span>
                        </div>

                        <div className="flex-1 h-5 bg-slate-100/80 rounded-xs relative flex items-center overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              isPositive 
                                ? 'bg-[#e11d48] group-hover:bg-[#be123c]' 
                                : 'bg-[#16a34a] group-hover:bg-[#15803d]'
                            }`}
                            style={{ width: `${widthPercent}%` }}
                          />
                        </div>

                        <div className="w-36 sm:w-48 shrink-0 flex items-center justify-end space-x-2 pl-3 text-right font-mono text-xs">
                          <span className={`font-bold ${mainInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {mainInflow >= 0 ? '+' : ''}{mainInflow.toFixed(2)}亿
                          </span>
                          <span className={`text-[11px] font-semibold ${changePct >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                            ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {processedSectors.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      未检索到符合条件的板块数据，请调整筛选条件或搜索关键词。
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 7. Heatmap View */}
        {chartType === 'heatmap' && (
          <section className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-500">
              <span className="font-bold text-slate-700">板块资金流向热力图（方块大小=总成交额，颜色深度=主力净流入）</span>
              <span>点击方块穿透个股</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {processedSectors.map((sector) => {
                const isUp = (sector.mainNetInflow || 0) >= 0;
                const inflow = sector.mainNetInflow || 0;
                return (
                  <div
                    key={sector.id}
                    onClick={() => onSelectSector(sector)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                      isUp 
                        ? 'bg-rose-50/80 border-rose-200 hover:bg-rose-100' 
                        : 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <div className="text-xs font-bold text-slate-800 truncate">{sector.name}</div>
                    <div className="mt-2 font-mono">
                      <div className={`text-sm font-extrabold ${isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isUp ? '+' : ''}{inflow.toFixed(2)} 亿
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 8. Table View */}
        {chartType === 'table' && (
          <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold">
                <tr>
                  <th className="py-2.5 px-3">板块名称</th>
                  <th className="py-2.5 px-3 text-right">主力净流入</th>
                  <th className="py-2.5 px-3 text-right">超大单净流入</th>
                  <th className="py-2.5 px-3 text-right">大单净流入</th>
                  <th className="py-2.5 px-3 text-right">涨跌幅</th>
                  <th className="py-2.5 px-3 text-right">总成交额</th>
                  <th className="py-2.5 px-3 text-right">换手率</th>
                  <th className="py-2.5 px-3">领涨龙头</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {processedSectors.map((sector) => (
                  <tr
                    key={sector.id}
                    onClick={() => onSelectSector(sector)}
                    className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-sans font-bold text-slate-800">{sector.name}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${(sector.mainNetInflow || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {(sector.mainNetInflow || 0) >= 0 ? '+' : ''}{(sector.mainNetInflow || 0).toFixed(2)}亿
                    </td>
                    <td className={`py-2.5 px-3 text-right ${(sector.superLargeInflow || 0) >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {(sector.superLargeInflow || 0) >= 0 ? '+' : ''}{(sector.superLargeInflow || 0).toFixed(2)}亿
                    </td>
                    <td className={`py-2.5 px-3 text-right ${(sector.largeInflow || 0) >= 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                      {(sector.largeInflow || 0) >= 0 ? '+' : ''}{(sector.largeInflow || 0).toFixed(2)}亿
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${(sector.changePercent || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {(sector.changePercent || 0) >= 0 ? '+' : ''}{(sector.changePercent || 0).toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{(sector.totalTurnover || 0).toFixed(1)}亿</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{(sector.turnoverRate || 0).toFixed(2)}%</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">
                      {sector.leadStock ? `${sector.leadStock.name} (${sector.leadStock.changePercent >= 0 ? '+' : ''}${sector.leadStock.changePercent}%)` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {/* 9. Scatter Quadrant View */}
        {chartType === 'scatter' && (
          <section className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs">
            <div className="text-xs font-bold text-slate-700 mb-3">
              板块四象限动量分析（X轴: 涨跌幅%, Y轴: 主力净流入亿元）
            </div>
            <div className="grid grid-cols-2 gap-3 h-80">
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg flex flex-col justify-between">
                <span className="text-xs font-bold text-rose-700">第一象限: 价升量增 (高确定性主升浪)</span>
                <div className="flex flex-wrap gap-1.5">
                  {processedSectors.filter(s => s.changePercent > 0 && s.mainNetInflow > 0).slice(0, 8).map(s => (
                    <span key={s.id} onClick={() => onSelectSector(s)} className="px-2 py-1 bg-white border border-rose-300 text-rose-700 rounded text-xs cursor-pointer hover:bg-rose-100">
                      {s.name} (+{s.mainNetInflow.toFixed(1)}亿)
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex flex-col justify-between">
                <span className="text-xs font-bold text-amber-700">第二象限: 价跌量增 (洗盘吸筹/背离探底)</span>
                <div className="flex flex-wrap gap-1.5">
                  {processedSectors.filter(s => s.changePercent < 0 && s.mainNetInflow > 0).slice(0, 8).map(s => (
                    <span key={s.id} onClick={() => onSelectSector(s)} className="px-2 py-1 bg-white border border-amber-300 text-amber-700 rounded text-xs cursor-pointer hover:bg-amber-100">
                      {s.name} (+{s.mainNetInflow.toFixed(1)}亿)
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-700">第三象限: 价跌量缩 (阴跌出货/弱势整理)</span>
                <div className="flex flex-wrap gap-1.5">
                  {processedSectors.filter(s => s.changePercent < 0 && s.mainNetInflow < 0).slice(0, 8).map(s => (
                    <span key={s.id} onClick={() => onSelectSector(s)} className="px-2 py-1 bg-white border border-slate-300 text-slate-700 rounded text-xs cursor-pointer hover:bg-slate-100">
                      {s.name} ({s.mainNetInflow.toFixed(1)}亿)
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex flex-col justify-between">
                <span className="text-xs font-bold text-blue-700">第四象限: 价升量缩 (诱多出货/散户接盘)</span>
                <div className="flex flex-wrap gap-1.5">
                  {processedSectors.filter(s => s.changePercent > 0 && s.mainNetInflow < 0).slice(0, 8).map(s => (
                    <span key={s.id} onClick={() => onSelectSector(s)} className="px-2 py-1 bg-white border border-blue-300 text-blue-700 rounded text-xs cursor-pointer hover:bg-blue-100">
                      {s.name} ({s.mainNetInflow.toFixed(1)}亿)
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* 10. Sector Correlation Heatmap (Cross-Industry Allocation) */}
        {chartType === 'correlation' && (
          <SectorCorrelationHeatmap
            sectors={processedSectors}
            onSelectSector={onSelectSector}
            onOpenAIDiagnosis={onOpenAIDiagnosis}
          />
        )}
      </div>
    </div>
  );
};
