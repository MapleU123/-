import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  Sparkles, 
  Camera, 
  ArrowUpDown, 
  ExternalLink, 
  X, 
  BarChart2, 
  PieChart, 
  Globe, 
  Sliders, 
  Flame, 
  Check, 
  HelpCircle,
  LayoutGrid,
  List,
  ChevronRight,
  Info,
  CheckSquare,
  Square,
  CheckCircle2
} from 'lucide-react';
import { 
  ETFValuationItem, 
  ETFCategory, 
  ETFValuationStatus, 
  ETF_CATEGORY_NAMES, 
  ETF_STATUS_COLORS 
} from '../types/etfValuation';
import { ALL_ETF_VALUATION_LIST } from '../data/etfValuationData';

interface ETFValuationViewProps {
  onOpenReportExport?: (selectedItems?: ETFValuationItem[]) => void;
  onOpenAIDiagnosis?: (targetName?: string) => void;
}

type SortField = 'pePercentile' | 'pePercentile5y' | 'pePercentile10y' | 'pe' | 'pb' | 'dividendYield' | 'changePercent' | 'premiumRate' | 'aum';
type SortOrder = 'asc' | 'desc';

export const ETFValuationView: React.FC<ETFValuationViewProps> = ({
  onOpenReportExport,
  onOpenAIDiagnosis
}) => {
  // Category filter state: 'all' | 'broad' | 'strategy' | 'industry' | 'theme' | 'global'
  const [selectedCategory, setSelectedCategory] = useState<ETFCategory | 'all'>('all');
  
  // Status filter state
  const [selectedStatus, setSelectedStatus] = useState<ETFValuationStatus | 'all' | 'high_dividend' | 'discount'>('all');
  
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Sort state
  const [sortField, setSortField] = useState<SortField>('pePercentile');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc'); // default lowest PE percentile first
  
  // View mode: 'table' or 'card'
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
  
  // Selected ETF for Detail Modal
  const [detailETF, setDetailETF] = useState<ETFValuationItem | null>(null);

  // Category counts and statistics
  const categoryStats = useMemo(() => {
    const counts: Record<ETFCategory, number> = {
      broad: 0,
      strategy: 0,
      industry: 0,
      theme: 0,
      global: 0
    };
    ALL_ETF_VALUATION_LIST.forEach(item => {
      counts[item.category]++;
    });
    return counts;
  }, []);

  // Filter and sort items
  const filteredList = useMemo(() => {
    return ALL_ETF_VALUATION_LIST.filter(item => {
      // 1. Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // 2. Status filter
      if (selectedStatus === 'high_dividend') {
        if (item.dividendYield < 3.0) return false;
      } else if (selectedStatus === 'discount') {
        if (item.premiumRate >= 0) return false;
      } else if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const rawQ = searchQuery.toLowerCase().trim();
        const normalizedQ = rawQ
          .replace(/男方/g, '南方')
          .replace(/eft/g, 'etf')
          .replace(/a5005/g, 'a500')
          .replace(/华泰败退/g, '华泰柏瑞')
          .replace(/标普00/g, '标普500')
          .replace(/hft/g, '海富通')
          .replace(/invesco/g, '景顺长城');

        const matchesCode = item.code.toLowerCase().includes(rawQ) || item.code.toLowerCase().includes(normalizedQ);
        const matchesName = item.name.toLowerCase().includes(rawQ) || item.name.toLowerCase().includes(normalizedQ);
        const matchesIndex = item.indexName.toLowerCase().includes(rawQ) || item.indexName.toLowerCase().includes(normalizedQ);
        const matchesHoldings = item.topHoldings.some(h => h.name.toLowerCase().includes(rawQ) || h.name.toLowerCase().includes(normalizedQ));
        const matchesDesc = item.description?.toLowerCase().includes(rawQ) || item.description?.toLowerCase().includes(normalizedQ);
        
        if (!matchesCode && !matchesName && !matchesIndex && !matchesHoldings && !matchesDesc) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (sortOrder === 'asc') {
        return valA > valB ? 1 : -1;
      } else {
        return valA < valB ? 1 : -1;
      }
    });
  }, [selectedCategory, selectedStatus, searchQuery, sortField, sortOrder]);

  // Multi-selection state for targeted export and analysis
  const [selectedETFIds, setSelectedETFIds] = useState<Set<string>>(new Set());

  // List of selected ETF objects
  const selectedETFsList = useMemo(() => {
    return ALL_ETF_VALUATION_LIST.filter(item => selectedETFIds.has(item.id));
  }, [selectedETFIds]);

  // Filtered list selection status
  const isAllFilteredSelected = useMemo(() => {
    return filteredList.length > 0 && filteredList.every(item => selectedETFIds.has(item.id));
  }, [filteredList, selectedETFIds]);

  const isSomeFilteredSelected = useMemo(() => {
    return filteredList.some(item => selectedETFIds.has(item.id)) && !isAllFilteredSelected;
  }, [filteredList, selectedETFIds, isAllFilteredSelected]);

  // Checkbox indeterminate ref for header
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeFilteredSelected;
    }
  }, [isSomeFilteredSelected]);

  // Toggle single selection
  const toggleSelectETF = (id: string) => {
    setSelectedETFIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all filtered
  const toggleSelectAllFiltered = () => {
    setSelectedETFIds(prev => {
      const next = new Set(prev);
      if (isAllFilteredSelected) {
        filteredList.forEach(item => next.delete(item.id));
      } else {
        filteredList.forEach(item => next.add(item.id));
      }
      return next;
    });
  };

  // Invert selection among filtered items
  const invertSelection = () => {
    setSelectedETFIds(prev => {
      const next = new Set(prev);
      filteredList.forEach(item => {
        if (next.has(item.id)) {
          next.delete(item.id);
        } else {
          next.add(item.id);
        }
      });
      return next;
    });
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedETFIds(new Set());
  };

  // Select only undervalued funds in current view
  const selectLowValuation = () => {
    setSelectedETFIds(prev => {
      const next = new Set(prev);
      filteredList.forEach(item => {
        if (item.status.includes('低估')) {
          next.add(item.id);
        }
      });
      return next;
    });
  };

  // Target items to export: selected items if any; if none selected, but filtered by category/status/search, export the filtered items; otherwise undefined (all)
  const exportTargetItems = useMemo(() => {
    if (selectedETFIds.size > 0) return selectedETFsList;
    if (filteredList.length < ALL_ETF_VALUATION_LIST.length) return filteredList;
    return undefined;
  }, [selectedETFIds, selectedETFsList, filteredList]);

  const exportButtonText = useMemo(() => {
    if (selectedETFIds.size > 0) return `📸 导出选中基金图片 (${selectedETFIds.size}只)`;
    if (filteredList.length < ALL_ETF_VALUATION_LIST.length) return `📸 导出当前分类基金图片 (${filteredList.length}只)`;
    return `📸 导出全市场ETF全景图 (${ALL_ETF_VALUATION_LIST.length}只)`;
  }, [selectedETFIds, filteredList]);

  // Overall KPI statistics
  const stats = useMemo(() => {
    const total = ALL_ETF_VALUATION_LIST.length;
    const extremeLow = ALL_ETF_VALUATION_LIST.filter(i => i.status === '极度低估').length;
    const low = ALL_ETF_VALUATION_LIST.filter(i => i.status === '低估').length;
    const normal = ALL_ETF_VALUATION_LIST.filter(i => i.status === '正常').length;
    const high = ALL_ETF_VALUATION_LIST.filter(i => i.status === '高估').length;
    const extremeHigh = ALL_ETF_VALUATION_LIST.filter(i => i.status === '极度高估').length;
    const highDividendCount = ALL_ETF_VALUATION_LIST.filter(i => i.dividendYield >= 3.0).length;
    const discountCount = ALL_ETF_VALUATION_LIST.filter(i => i.premiumRate < 0).length;

    // Average PE percentile by category
    const calcAvgPercentile = (cat: ETFCategory) => {
      const items = ALL_ETF_VALUATION_LIST.filter(i => i.category === cat);
      if (items.length === 0) return 0;
      const sum = items.reduce((acc, i) => acc + i.pePercentile, 0);
      return Math.round(sum / items.length);
    };

    return {
      total,
      extremeLow,
      low,
      normal,
      high,
      extremeHigh,
      highDividendCount,
      discountCount,
      avgBroad: calcAvgPercentile('broad'),
      avgStrategy: calcAvgPercentile('strategy'),
      avgIndustry: calcAvgPercentile('industry'),
      avgTheme: calcAvgPercentile('theme'),
      avgGlobal: calcAvgPercentile('global')
    };
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      // Sensible defaults: pe/pePercentile lowest first, dividend highest first
      if (field === 'dividendYield' || field === 'aum' || field === 'changePercent') {
        setSortOrder('desc');
      } else {
        setSortOrder('asc');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Action Bar */}
      <div className="bg-gradient-to-r from-[#0b1329] via-[#101b3d] to-[#0f172a] rounded-2xl p-5 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-600 flex items-center justify-center font-black text-white text-lg shadow-md border border-indigo-400/30">
                ETF
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tight text-white">
                    全市场 ETF 基金最新估值与十年分位数罗盘
                  </h1>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    5大分类·实时校准
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  基于PE-TTM历史十年分位数权威划分低估黄金坑 · 涵盖 <strong>宽基、策略、行业、主题、全球</strong> 核心品种
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {onOpenReportExport && (
              <button
                type="button"
                onClick={() => onOpenReportExport(exportTargetItems)}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs shadow-md transition-all cursor-pointer ${
                  selectedETFIds.size > 0
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 border border-emerald-400/50 shadow-emerald-950/30 ring-2 ring-emerald-400/40'
                    : 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 border border-red-400/40'
                }`}
                title="导出当前选定或筛选的ETF估值高清长图"
              >
                <Camera className="w-4 h-4 text-white" />
                <span>{exportButtonText}</span>
              </button>
            )}

            {onOpenAIDiagnosis && (
              <button
                type="button"
                onClick={() => onOpenAIDiagnosis('ETF估值与大类资产配置建议')}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-sm border border-indigo-400/40 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>AI ETF定投诊断</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Top Summary KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-4 pt-4 border-t border-slate-800/80">
          <div className="bg-[#131f42] p-2.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400">低估机会标的</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
              {stats.extremeLow + stats.low} <span className="text-xs text-slate-400 font-normal">只</span>
            </div>
            <div className="text-[10px] text-emerald-300/80 font-mono mt-0.5">
              极度低估 {stats.extremeLow} + 低估 {stats.low}
            </div>
          </div>

          <div className="bg-[#131f42] p-2.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400">高股息红利ETF (≥3%)</div>
            <div className="text-lg font-black text-amber-400 font-mono mt-0.5">
              {stats.highDividendCount} <span className="text-xs text-slate-400 font-normal">只</span>
            </div>
            <div className="text-[10px] text-amber-300/80 mt-0.5">
              最高股息达 6.25%
            </div>
          </div>

          <div className="bg-[#131f42] p-2.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400">宽基均PE分位</div>
            <div className="text-lg font-black text-cyan-400 font-mono mt-0.5">
              {stats.avgBroad}%
            </div>
            <div className="text-[10px] text-cyan-300/80 mt-0.5">
              A500/创业板处偏低位
            </div>
          </div>

          <div className="bg-[#131f42] p-2.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400">策略/红利均PE分位</div>
            <div className="text-lg font-black text-emerald-400 font-mono mt-0.5">
              {stats.avgStrategy}%
            </div>
            <div className="text-[10px] text-emerald-300/80 mt-0.5">
              红利低波防守价值显著
            </div>
          </div>

          <div className="bg-[#131f42] p-2.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400">行业/主题均PE分位</div>
            <div className="text-lg font-black text-blue-400 font-mono mt-0.5">
              {Math.round((stats.avgIndustry + stats.avgTheme) / 2)}%
            </div>
            <div className="text-[10px] text-blue-300/80 mt-0.5">
              医药/光伏/新能车极度低估
            </div>
          </div>

          <div className="bg-[#131f42] p-2.5 rounded-xl border border-slate-700/60">
            <div className="text-[11px] text-slate-400">全球跨境均PE分位</div>
            <div className="text-lg font-black text-rose-400 font-mono mt-0.5">
              {stats.avgGlobal}%
            </div>
            <div className="text-[10px] text-rose-300/80 mt-0.5">
              美股高估 / 恒生科技低估
            </div>
          </div>
        </div>
      </div>

      {/* 3. Category Filter Tabs (宽基、策略、行业、主题、全球) */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'all', label: '全部 ETF', icon: LayoutGrid, count: ALL_ETF_VALUATION_LIST.length },
            { id: 'broad', label: '宽基 ETF', icon: Layers, count: categoryStats.broad, badge: '沪深300/恒生/800/500/1000' },
            { id: 'strategy', label: '策略 ETF', icon: Sliders, count: categoryStats.strategy, badge: '红利/基本面/A50/A100/A500' },
            { id: 'industry', label: '行业 ETF', icon: BarChart2, count: categoryStats.industry, badge: '券商/消费/医药' },
            { id: 'theme', label: '主题 ETF', icon: Flame, count: categoryStats.theme, badge: '半导体/光伏/AI' },
            { id: 'global', label: '全球 ETF', icon: Globe, count: categoryStats.global, badge: '纳指/标普/港股' }
          ].map(tab => {
            const Icon = tab.icon;
            const isCur = selectedCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`etf-cat-tab-${tab.id}`}
                onClick={() => setSelectedCategory(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  isCur
                    ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isCur ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isCur ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                }`}>
                  {tab.count}
                </span>
                {tab.badge && !isCur && (
                  <span className="hidden md:inline text-[9.5px] text-slate-400 font-normal">
                    ({tab.badge})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center space-x-1 border border-slate-200 bg-slate-50 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setViewMode('table')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewMode === 'table' ? 'bg-white shadow-xs text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="表格视图"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('card')}
            className={`p-1.5 rounded-md text-xs transition-colors ${
              viewMode === 'card' ? 'bg-white shadow-xs text-rose-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
            title="卡片视图"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Secondary Filter & Search Bar */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Status quick filters */}
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1.5">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>估值状态筛选:</span>
          </span>
          {[
            { id: 'all', label: '全部' },
            { id: '极度低估', label: '极度低估 (PE分位<10%)', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            { id: '低估', label: '低估 (10%~30%)', color: 'text-green-700 bg-green-50 border-green-200' },
            { id: '正常', label: '正常 (30%~70%)', color: 'text-blue-700 bg-blue-50 border-blue-200' },
            { id: '高估', label: '高估 (70%~90%)', color: 'text-orange-700 bg-orange-50 border-orange-200' },
            { id: '极度高估', label: '极度高估 (≥90%)', color: 'text-red-700 bg-red-50 border-red-200' },
            { id: 'high_dividend', label: '高股息 (≥3%)', color: 'text-amber-800 bg-amber-50 border-amber-300' },
            { id: 'discount', label: '折价洼地 (溢价率<0)', color: 'text-indigo-800 bg-indigo-50 border-indigo-200' }
          ].map(st => {
            const isCur = selectedStatus === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => setSelectedStatus(st.id as any)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all cursor-pointer ${
                  isCur 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                    : (st.color || 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100')
                }`}
              >
                {st.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索代码 / 名称 / 追踪指数 / 成分股..."
            className="w-full bg-slate-50 hover:bg-white focus:bg-white text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-8 pr-7 py-1.5 border border-slate-200 focus:border-rose-500 focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 4.5. ETF Selection & Batch Export Toolbar */}
      <div className="bg-white rounded-xl p-3 shadow-xs border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
          {/* Quick select buttons */}
          <button
            type="button"
            onClick={toggleSelectAllFiltered}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs ${
              isAllFilteredSelected
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {isAllFilteredSelected ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5 text-slate-400" />}
            <span>全选当前 ({filteredList.length})</span>
          </button>

          <button
            type="button"
            onClick={invertSelection}
            className="px-2.5 py-1.5 rounded-lg font-semibold bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer"
          >
            反选
          </button>

          <button
            type="button"
            onClick={selectLowValuation}
            className="px-2.5 py-1.5 rounded-lg font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all cursor-pointer flex items-center gap-1"
          >
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>选低估标的</span>
          </button>

          {selectedETFIds.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="px-2.5 py-1.5 rounded-lg font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
            >
              清空
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          {/* Selection status badge */}
          <span className="text-slate-600 flex items-center gap-1.5 font-medium">
            <span>已选</span>
            <span className="px-2 py-0.5 rounded-full font-mono font-black text-rose-600 bg-rose-50 border border-rose-200 text-xs">
              {selectedETFIds.size}
            </span>
            <span>只基金</span>
          </span>
        </div>

        {/* Right side: Prominent Export and Diagnosis buttons */}
        <div className="flex items-center space-x-2">
          {onOpenReportExport && (
            <button
              type="button"
              onClick={() => onOpenReportExport(exportTargetItems)}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                (selectedETFIds.size > 0 || (filteredList.length < ALL_ETF_VALUATION_LIST.length))
                  ? 'bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white ring-2 ring-rose-400/50 shadow-rose-950/20'
                  : 'bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>{exportButtonText}</span>
            </button>
          )}
        </div>
      </div>

      {/* 5. Main Content: Table or Card View */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">
                    <label className="inline-flex items-center justify-center cursor-pointer" title={isAllFilteredSelected ? "取消全选" : "全选当前列表"}>
                      <input
                        type="checkbox"
                        ref={selectAllCheckboxRef}
                        checked={isAllFilteredSelected}
                        onChange={toggleSelectAllFiltered}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                      />
                    </label>
                  </th>
                  <th className="py-2.5 px-2 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">ETF名称与代码</th>
                  <th className="py-2.5 px-3 text-center">分类</th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('changePercent')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>最新价 / 涨跌</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('pe')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>市盈率PE</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'pe' ? 'text-rose-500' : 'text-slate-400'}`} />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('pePercentile5y')}>
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-bold text-slate-800">近五年市盈率分位数</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'pePercentile5y' ? 'text-rose-500' : 'text-slate-400'}`} />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('pePercentile10y')}>
                    <div className="flex items-center justify-end gap-1">
                      <span className="font-bold text-slate-800">近十年市盈率分位数</span>
                      <ArrowUpDown className={`w-3 h-3 ${sortField === 'pePercentile10y' || sortField === 'pePercentile' ? 'text-rose-500' : 'text-slate-400'}`} />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">估值状态</th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('pb')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>市净率PB</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('dividendYield')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>股息率</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('premiumRate')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>折溢价率</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('aum')}>
                    <div className="flex items-center justify-end gap-1">
                      <span>规模</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 text-center">量化建议</th>
                  <th className="py-2.5 px-3 text-center w-20">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-12 text-center text-slate-400">
                      没有匹配到符合筛选条件的 ETF 基金，请切换分类或清除搜索词
                    </td>
                  </tr>
                ) : (
                  filteredList.map((item, index) => {
                    const isUp = item.changePercent >= 0;
                    const statusCfg = ETF_STATUS_COLORS[item.status];
                    const isSelected = selectedETFIds.has(item.id);
                    return (
                      <tr 
                        key={item.id}
                        className={`transition-colors group cursor-pointer ${
                          isSelected 
                            ? 'bg-rose-50/70 hover:bg-rose-50 border-l-4 border-l-rose-500' 
                            : 'hover:bg-slate-50/80'
                        }`}
                        onClick={() => setDetailETF(item)}
                      >
                        {/* Checkbox column */}
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <label className="inline-flex items-center justify-center cursor-pointer p-0.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectETF(item.id)}
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                            />
                          </label>
                        </td>

                        {/* Number */}
                        <td className="py-2.5 px-2 text-center font-mono text-slate-400 text-[11px]">
                          {index + 1}
                        </td>

                        {/* Name & Code */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="font-bold text-slate-900 group-hover:text-rose-600 transition-colors flex items-center gap-1.5">
                                <span>{item.name}</span>
                                <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                                  {item.code}
                                </span>
                              </div>
                              <div className="text-[10.5px] text-slate-400 font-normal mt-0.5">
                                追踪: {item.indexName} ({item.indexCode})
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            item.category === 'broad' ? 'bg-cyan-50 text-cyan-700 border border-cyan-200' :
                            item.category === 'strategy' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                            item.category === 'industry' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            item.category === 'theme' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {item.categoryName}
                          </span>
                        </td>

                        {/* Price & Change */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-mono font-bold text-slate-800">
                            ¥{item.price.toFixed(3)}
                          </div>
                          <div className={`font-mono text-[11px] font-bold ${
                            isUp ? 'text-rose-600' : 'text-emerald-600'
                          }`}>
                            {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                          </div>
                        </td>

                        {/* PE */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-mono font-bold text-slate-800">
                            {item.pe.toFixed(1)}
                            <span className="text-[10px] text-slate-400 font-normal ml-0.5">倍</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">TTM</div>
                        </td>

                        {/* 5-Year PE Percentile */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className={`font-mono font-black text-xs ${
                              item.pePercentile5y < 20 ? 'text-emerald-600' :
                              item.pePercentile5y <= 70 ? 'text-blue-600' :
                              'text-rose-600'
                            }`}>
                              {item.pePercentile5y.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-20 ml-auto bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 flex" title={`近5年市盈率历史分位: ${item.pePercentile5y.toFixed(1)}%`}>
                            <div 
                              className={`h-full rounded-full ${
                                item.pePercentile5y < 10 ? 'bg-emerald-500' :
                                item.pePercentile5y < 30 ? 'bg-green-500' :
                                item.pePercentile5y <= 70 ? 'bg-blue-500' :
                                item.pePercentile5y < 90 ? 'bg-orange-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${Math.min(100, Math.max(5, item.pePercentile5y))}%` }} 
                            />
                          </div>
                        </td>

                        {/* 10-Year PE Percentile */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <span className={`font-mono font-black text-xs ${
                              item.pePercentile10y < 20 ? 'text-emerald-600' :
                              item.pePercentile10y <= 70 ? 'text-blue-600' :
                              'text-rose-600'
                            }`}>
                              {item.pePercentile10y.toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-20 ml-auto bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1 flex" title={`近10年市盈率历史分位: ${item.pePercentile10y.toFixed(1)}%`}>
                            <div 
                              className={`h-full rounded-full ${
                                item.pePercentile10y < 10 ? 'bg-emerald-500' :
                                item.pePercentile10y < 30 ? 'bg-green-500' :
                                item.pePercentile10y <= 70 ? 'bg-blue-500' :
                                item.pePercentile10y < 90 ? 'bg-orange-500' : 'bg-red-500'
                              }`} 
                              style={{ width: `${Math.min(100, Math.max(5, item.pePercentile10y))}%` }} 
                            />
                          </div>
                        </td>

                        {/* Valuation Status */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                            {item.status}
                          </span>
                        </td>

                        {/* PB */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className={`font-bold ${item.pb < 1.0 ? 'text-indigo-600' : 'text-slate-700'}`}>
                            {item.pb.toFixed(2)}
                          </span>
                          {item.pb < 1.0 && (
                            <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-indigo-100 text-indigo-700 font-bold">
                              破净
                            </span>
                          )}
                        </td>

                        {/* Dividend Yield */}
                        <td className="py-2.5 px-3 text-right font-mono">
                          <span className={`font-bold ${item.dividendYield >= 3.0 ? 'text-amber-600 font-black' : 'text-slate-600'}`}>
                            {item.dividendYield.toFixed(2)}%
                          </span>
                        </td>

                        {/* Premium Rate */}
                        <td className="py-2.5 px-3 text-right font-mono text-[11.5px]">
                          <span className={`font-semibold ${
                            item.premiumRate > 1.0 ? 'text-rose-600 font-bold' :
                            item.premiumRate < 0 ? 'text-indigo-600 font-bold' : 'text-slate-600'
                          }`}>
                            {item.premiumRate > 0 ? '+' : ''}{item.premiumRate.toFixed(2)}%
                          </span>
                        </td>

                        {/* AUM */}
                        <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                          {item.aum >= 1000 ? `${(item.aum / 1000).toFixed(1)}k亿` : `${item.aum.toFixed(1)}亿`}
                        </td>

                        {/* Quant Rating */}
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                            item.quantRating === '积极定投' ? 'bg-emerald-100 text-emerald-800' :
                            item.quantRating === '适度配置' ? 'bg-blue-100 text-blue-800' :
                            item.quantRating === '持有观望' ? 'bg-slate-100 text-slate-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.quantRating}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDetailETF(item);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors"
                            title="查看详细估值罗盘与成分股"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Card View Mode */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredList.map((item) => {
            const isUp = item.changePercent >= 0;
            const statusCfg = ETF_STATUS_COLORS[item.status];
            const isSelected = selectedETFIds.has(item.id);
            return (
              <div
                key={item.id}
                onClick={() => setDetailETF(item)}
                className={`bg-white rounded-xl p-4 shadow-xs border transition-all cursor-pointer space-y-3 ${
                  isSelected 
                    ? 'border-rose-400 ring-2 ring-rose-500/30 bg-rose-50/20 shadow-md' 
                    : 'border-slate-200 hover:border-rose-300 hover:shadow-md'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2.5">
                    <div onClick={(e) => e.stopPropagation()} className="pt-0.5">
                      <label className="cursor-pointer inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectETF(item.id)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer"
                        />
                      </label>
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-slate-900">{item.name}</span>
                        <span className="font-mono text-xs text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                          {item.code}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        追踪: {item.indexName}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold border ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                      {item.status}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                      {item.categoryName}
                    </span>
                  </div>
                </div>

                {/* Price and Key Metrics Row */}
                <div className="grid grid-cols-4 gap-1.5 bg-slate-50 p-2.5 rounded-lg text-center border border-slate-100">
                  <div>
                    <div className="text-[10px] text-slate-400">最新价</div>
                    <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                      ¥{item.price.toFixed(3)}
                    </div>
                    <div className={`text-[10px] font-bold font-mono ${isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isUp ? '+' : ''}{item.changePercent.toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">PE-TTM</div>
                    <div className="font-mono font-bold text-slate-800 text-xs mt-0.5">
                      {item.pe.toFixed(1)}倍
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      PB {item.pb.toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">近5年分位</div>
                    <div className={`text-xs font-bold font-mono mt-0.5 ${item.pePercentile5y < 20 ? 'text-emerald-600' : item.pePercentile5y <= 70 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {item.pePercentile5y.toFixed(1)}%
                    </div>
                    <div className="text-[9.5px] text-slate-400">5年水位</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-400">近10年分位</div>
                    <div className={`text-xs font-bold font-mono mt-0.5 ${item.pePercentile10y < 20 ? 'text-emerald-600' : item.pePercentile10y <= 70 ? 'text-blue-600' : 'text-rose-600'}`}>
                      {item.pePercentile10y.toFixed(1)}%
                    </div>
                    <div className="text-[9.5px] text-slate-400">10年水位</div>
                  </div>
                </div>

                {/* 10y Percentile Range Bar */}
                <div>
                  <div className="flex items-center justify-between text-[10.5px] text-slate-500 mb-1">
                    <span>10年最低 {item.pe10yMin}</span>
                    <span className="font-bold text-slate-700">中位 {item.pe10yMedian}</span>
                    <span>最高 {item.pe10yMax}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                    <div 
                      className={`h-full rounded-full ${
                        item.pePercentile10y < 10 ? 'bg-emerald-500' :
                        item.pePercentile10y < 30 ? 'bg-green-500' :
                        item.pePercentile10y <= 70 ? 'bg-blue-500' :
                        item.pePercentile10y < 90 ? 'bg-orange-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${Math.min(100, Math.max(5, item.pePercentile10y))}%` }} 
                    />
                  </div>
                </div>

                {/* Top Holdings preview */}
                <div className="text-[11px] text-slate-500 pt-1 border-t border-slate-100 flex items-center justify-between">
                  <span className="truncate max-w-[200px]">
                    成分股: {item.topHoldings.slice(0, 3).map(h => h.name).join('、')}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    item.quantRating === '积极定投' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {item.quantRating}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 6. ETF Detail Modal */}
      {detailETF && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-5 py-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-rose-600 flex items-center justify-center font-black text-white text-sm">
                  {detailETF.categoryName.slice(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base tracking-tight">{detailETF.name}</h3>
                    <span className="font-mono text-xs text-indigo-300 font-semibold bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-700/60">
                      {detailETF.code}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    追踪指数：{detailETF.indexName} ({detailETF.indexCode}) · 分类：{detailETF.categoryName}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setDetailETF(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {/* Status and Rating Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">当前估值分位状态：</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${ETF_STATUS_COLORS[detailETF.status].bg} ${ETF_STATUS_COLORS[detailETF.status].text} ${ETF_STATUS_COLORS[detailETF.status].border}`}>
                    {detailETF.status} (PE分位 {detailETF.pePercentile.toFixed(1)}%)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 font-medium">配置指引：</span>
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 text-indigo-800">
                    {detailETF.quantRating}
                  </span>
                </div>
              </div>

              {/* 4-Box Valuation Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                  <div className="text-slate-400 text-[11px]">最新价 / 涨跌幅</div>
                  <div className="text-base font-bold font-mono text-slate-800 mt-1">
                    ¥{detailETF.price.toFixed(3)}
                  </div>
                  <div className={`text-xs font-bold font-mono ${detailETF.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {detailETF.changePercent >= 0 ? '+' : ''}{detailETF.changePercent.toFixed(2)}%
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                  <div className="text-slate-400 text-[11px]">市盈率 PE-TTM</div>
                  <div className="text-base font-bold font-mono text-slate-800 mt-1">
                    {detailETF.pe.toFixed(2)} 倍
                  </div>
                  <div className="text-[11px] font-bold font-mono text-slate-600 mt-0.5 flex items-center justify-center gap-1.5">
                    <span className="text-indigo-600">5年分位 {detailETF.pePercentile5y.toFixed(1)}%</span>
                    <span className="text-slate-300">|</span>
                    <span className="text-rose-600">10年分位 {detailETF.pePercentile10y.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                  <div className="text-slate-400 text-[11px]">市净率 PB</div>
                  <div className="text-base font-bold font-mono text-slate-800 mt-1">
                    {detailETF.pb.toFixed(2)}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    PB分位 {detailETF.pbPercentile.toFixed(1)}%
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 text-center">
                  <div className="text-slate-400 text-[11px]">股息率 / 规模</div>
                  <div className="text-base font-bold font-mono text-amber-600 mt-1">
                    {detailETF.dividendYield.toFixed(2)}%
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    规模 {detailETF.aum.toFixed(1)} 亿元
                  </div>
                </div>
              </div>

              {/* 5-Year and 10-Year PE Distribution Visual Bars */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-3.5 bg-slate-50/40">
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <span>近五年与近十年市盈率(PE)历史分位数对比</span>
                  <span className="text-rose-600 font-mono text-sm">当前PE: {detailETF.pe.toFixed(2)}倍</span>
                </div>

                {/* 5-Year Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">近五年PE分位数 (2021-2026周期)</span>
                    <span className="font-mono font-bold text-indigo-600">{detailETF.pePercentile5y.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex relative">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        detailETF.pePercentile5y < 10 ? 'bg-emerald-500' :
                        detailETF.pePercentile5y < 30 ? 'bg-green-500' :
                        detailETF.pePercentile5y <= 70 ? 'bg-indigo-500' :
                        detailETF.pePercentile5y < 90 ? 'bg-orange-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${Math.min(100, Math.max(5, detailETF.pePercentile5y))}%` }} 
                    />
                  </div>
                </div>

                {/* 10-Year Bar with Min / Median / Max */}
                <div className="space-y-1 pt-1 border-t border-slate-200/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">近十年PE分位数 (跨完整宏观周期)</span>
                    <span className="font-mono font-bold text-rose-600">{detailETF.pePercentile10y.toFixed(1)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-[10.5px] text-slate-400 font-mono">
                    <span>10年最低: {detailETF.pe10yMin.toFixed(2)}</span>
                    <span className="font-bold text-slate-600">十年中位: {detailETF.pe10yMedian.toFixed(2)}</span>
                    <span>10年最高: {detailETF.pe10yMax.toFixed(2)}</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex relative">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        detailETF.pePercentile10y < 10 ? 'bg-emerald-500' :
                        detailETF.pePercentile10y < 30 ? 'bg-green-500' :
                        detailETF.pePercentile10y <= 70 ? 'bg-blue-500' :
                        detailETF.pePercentile10y < 90 ? 'bg-orange-500' : 'bg-red-500'
                      }`} 
                      style={{ width: `${Math.min(100, Math.max(5, detailETF.pePercentile10y))}%` }} 
                    />
                  </div>
                </div>
              </div>

              {/* Top Holdings */}
              <div className="p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-700">指数核心重仓成分股 (Top 4)</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {detailETF.topHoldings.map(h => (
                    <div key={h.name} className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                      <span className="font-medium text-slate-800 truncate">{h.name}</span>
                      <span className="font-mono text-slate-500 font-bold">{h.weight.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analysis Comments */}
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100 text-slate-700 leading-relaxed space-y-1">
                <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>投研配置与量化研判策略</span>
                </div>
                <p className="text-slate-600">
                  {detailETF.description}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleSelectETF(detailETF.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                    selectedETFIds.has(detailETF.id)
                      ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {selectedETFIds.has(detailETF.id) ? (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
                      <span>已加入图片导出 ({selectedETFIds.size})</span>
                    </>
                  ) : (
                    <>
                      <Square className="w-3.5 h-3.5 text-slate-400" />
                      <span>勾选加入图片导出</span>
                    </>
                  )}
                </button>

                {onOpenReportExport && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenReportExport([detailETF]);
                      setDetailETF(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>导出单只基金图片</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onOpenAIDiagnosis && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAIDiagnosis(`${detailETF.name}(${detailETF.code})估值与定投建议`);
                      setDetailETF(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI 深度诊断</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDetailETF(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Quick Export Bar for ETF Selections */}
      {selectedETFIds.size > 0 && onOpenReportExport && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-rose-500/40 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-bold">
              已选 <span className="text-rose-400 font-mono text-sm">{selectedETFIds.size}</span> 只 ETF 基金
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={() => onOpenReportExport(selectedETFsList)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-950/40 cursor-pointer transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>📸 立即导出选中基金图片 ({selectedETFIds.size}只)</span>
          </button>
          <button
            type="button"
            onClick={clearSelection}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            清空
          </button>
        </div>
      )}
    </div>
  );
};
