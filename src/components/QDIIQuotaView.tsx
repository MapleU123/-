import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Calculator,
  ShieldCheck,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
  DollarSign,
  Download,
  Copy,
  Check,
  AlertTriangle,
  Flame,
  CheckCircle2,
  FileSpreadsheet,
  Globe,
  SlidersHorizontal,
  BookmarkPlus,
  Compass,
  Layers
} from 'lucide-react';
import { QDIIFundItem, QDIIIndexCategory, QDIIQuotaStatus, QDIISummaryStats } from '../types/qdii';
import { INITIAL_QDII_FUNDS, calculateQDIISummaryStats } from '../data/qdiiFundsData';
import { marketService } from '../services/marketService';
import { getRealtimeTimeString } from '../utils/marketDateUtils';

interface QDIIQuotaViewProps {
  onOpenAIDiagnosis?: (targetName?: string) => void;
  onSelectStockByName?: (stockName: string) => void;
}

export const QDIIQuotaView: React.FC<QDIIQuotaViewProps> = ({
  onOpenAIDiagnosis,
  onSelectStockByName
}) => {
  // State
  const [funds, setFunds] = useState<QDIIFundItem[]>(INITIAL_QDII_FUNDS);
  const [summaryStats, setSummaryStats] = useState<QDIISummaryStats>(() => calculateQDIISummaryStats(INITIAL_QDII_FUNDS));
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(getRealtimeTimeString());
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<QDIIIndexCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'suspended' | 'ultra_strict' | 'strict' | 'moderate' | 'relaxed'>('all');
  const [fundTypeFilter, setFundTypeFilter] = useState<'all' | 'otc' | 'floor'>('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortBy, setSortBy] = useState<'limit_asc' | 'limit_desc' | 'premium_desc' | 'ytd_desc' | 'nav_desc'>('limit_asc');

  // Selected Fund Details Modal
  const [detailFund, setDetailFund] = useState<QDIIFundItem | null>(null);

  // Quota Maximizer (拼单/额度测算器)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [targetInvestmentAmount, setTargetInvestmentAmount] = useState<number>(5000);
  const [calculatorPreference, setCalculatorPreference] = useState<'both' | 'nasdaq_only' | 'sp500_only'>('both');

  // Copy notification
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // Data Fetching
  const handleFetchData = async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const data = await marketService.fetchQDIIQuotas(isManual);
      if (data && data.funds && Array.isArray(data.funds)) {
        setFunds(data.funds);
        setSummaryStats(data.summary || calculateQDIISummaryStats(data.funds));
        setLastRefreshTime(data.updateTime || getRealtimeTimeString());
        if (isManual) {
          showToast(`已成功同步最新QDII额度与外汇限额数据！共收录 ${data.funds.length} 只标的`);
        }
      }
    } catch {
      if (isManual) {
        showToast('获取在线实时额度失败，已加载本地基准额度库');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    handleFetchData(false);
  }, []);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefreshEnabled) return;
    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          handleFetchData(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [autoRefreshEnabled]);

  // Filtered and Sorted funds
  const filteredFunds = useMemo(() => {
    return funds.filter(fund => {
      // Category
      if (categoryFilter === 'nasdaq' && fund.indexCategory !== 'nasdaq') return false;
      if (categoryFilter === 'sp500' && fund.indexCategory !== 'sp500') return false;
      if (categoryFilter === 'tech' && fund.indexCategory !== 'tech') return false;

      // Status
      if (statusFilter !== 'all') {
        if (fund.quotaStatus !== statusFilter) return false;
      }

      // Fund Type
      if (fundTypeFilter === 'otc') {
        if (!['otc_feeder_a', 'otc_feeder_c', 'direct_otc'].includes(fund.fundType)) return false;
      } else if (fundTypeFilter === 'floor') {
        if (!['etf_floor', 'lof_floor'].includes(fund.fundType)) return false;
      }

      // Search keyword (code, name, shortName, company, targetIndex)
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        const matchCode = fund.code.toLowerCase().includes(kw);
        const matchName = fund.name.toLowerCase().includes(kw);
        const matchShortName = fund.shortName.toLowerCase().includes(kw);
        const matchCompany = fund.company.toLowerCase().includes(kw);
        const matchEtf = fund.etfFloorCode?.toLowerCase().includes(kw);
        if (!matchCode && !matchName && !matchShortName && !matchCompany && !matchEtf) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'limit_asc') {
        return a.dailyLimitAmount - b.dailyLimitAmount;
      }
      if (sortBy === 'limit_desc') {
        return b.dailyLimitAmount - a.dailyLimitAmount;
      }
      if (sortBy === 'premium_desc') {
        return (b.premiumRate || 0) - (a.premiumRate || 0);
      }
      if (sortBy === 'ytd_desc') {
        return b.ytdReturn - a.ytdReturn;
      }
      if (sortBy === 'nav_desc') {
        return b.latestNav - a.latestNav;
      }
      return 0;
    });
  }, [funds, categoryFilter, statusFilter, fundTypeFilter, searchKeyword, sortBy]);

  // Quota Maximizer calculation
  const quotaCalculatorPlan = useMemo(() => {
    // Only pick funds with valid limits (>0 and not unlimited floor ETFs)
    const candidates = funds.filter(f => {
      if (f.dailyLimitAmount <= 0 || f.dailyLimitAmount >= 99999999) return false;
      if (calculatorPreference === 'nasdaq_only') {
        return f.indexCategory === 'nasdaq' || f.indexCategory === 'tech';
      }
      if (calculatorPreference === 'sp500_only') {
        return f.indexCategory === 'sp500';
      }
      return true;
    });

    let remaining = targetInvestmentAmount;
    const plan: { fund: QDIIFundItem; allocateAmount: number }[] = [];

    // Sort candidates by preference: favor A classes and lower fee funds
    const sorted = [...candidates].sort((a, b) => {
      // First sort by limit (use reasonable ones e.g. 1000)
      return b.dailyLimitAmount - a.dailyLimitAmount;
    });

    for (const fund of sorted) {
      if (remaining <= 0) break;
      const alloc = Math.min(fund.dailyLimitAmount, remaining);
      if (alloc > 0) {
        plan.push({ fund, allocateAmount: alloc });
        remaining -= alloc;
      }
    }

    const totalAllocated = targetInvestmentAmount - remaining;
    return {
      plan,
      totalAllocated,
      remainingDeficit: remaining,
      isFullySatisfied: remaining <= 0
    };
  }, [funds, targetInvestmentAmount, calculatorPreference]);

  // Copy code helper
  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`基金代码 ${code} 已成功复制到剪贴板`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = ['基金代码', '基金名称', '基金公司', '跟踪标的', '额度状态', '单日限额(元)', '定投限额', '基金类型', '场内对应', '溢价率(%)', '最新净值', '今年以来收益率(%)', '限额变动公告日', '限购原因'];
    const rows = filteredFunds.map(f => [
      `"${f.code}"`,
      `"${f.name}"`,
      `"${f.company}"`,
      `"${f.indexName}"`,
      `"${f.quotaStatus === 'suspended' ? '暂停申购' : f.dailyLimitText}"`,
      f.dailyLimitAmount >= 99999999 ? '二级市场不限' : f.dailyLimitAmount,
      `"${f.regularInvestText}"`,
      `"${f.fundTypeLabel}"`,
      `"${f.etfFloorCode || '-'}"`,
      f.premiumRate !== undefined ? `${f.premiumRate}%` : '-',
      f.latestNav,
      `${f.ytdReturn}%`,
      f.lastLimitDate,
      `"${f.limitReason || '-'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `QDII纳指与标普500基金额度全景汇总_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('QDII额度数据已成功导出为 CSV 表格！');
  };

  // Quota Status Badge component
  const renderQuotaBadge = (fund: QDIIFundItem) => {
    if (fund.quotaStatus === 'suspended') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          暂停申购 (0元)
        </span>
      );
    }
    if (fund.quotaStatus === 'ultra_strict') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-sm">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          {fund.dailyLimitText}
        </span>
      );
    }
    if (fund.quotaStatus === 'strict') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
          <ShieldCheck className="w-3 h-3 text-amber-600" />
          {fund.dailyLimitText}
        </span>
      );
    }
    if (fund.quotaStatus === 'moderate') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {fund.dailyLimitText}
        </span>
      );
    }
    // relaxed / floor
    if (fund.fundType === 'etf_floor') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          <Zap className="w-3 h-3 text-purple-600" />
          场内自由买卖
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {fund.dailyLimitText}
      </span>
    );
  };

  return (
    <div id="qdii-quota-monitor-view" className="space-y-4 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 text-white px-4 py-2.5 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2.5 text-sm animate-fade-in">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP STATS BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {/* 1. 全市场收录 */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>收录美股QDII标的</span>
            <Globe className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{summaryStats.totalFundsCount}</span>
            <span className="text-xs text-slate-500">只</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-600 flex items-center justify-between">
            <span>纳指系列: <strong className="text-blue-600 font-mono">{summaryStats.nasdaqCount}</strong></span>
            <span>标普系列: <strong className="text-indigo-600 font-mono">{summaryStats.sp500Count}</strong></span>
          </div>
        </div>

        {/* 2. 限额紧俏程度 */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>严格限额 (≤1000元)</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 font-mono">{summaryStats.strictLimitedCount}</span>
            <span className="text-xs text-slate-500">
              ({Math.round((summaryStats.strictLimitedCount / summaryStats.totalFundsCount) * 100)}%)
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>额度平均值:</span>
            <span className="text-slate-700 font-bold font-mono">¥{summaryStats.averageDailyLimit.toLocaleString()} / 日</span>
          </div>
        </div>

        {/* 3. 极严限额 / 暂停申购 */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>极严限额与暂停</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-600 font-mono">
              {funds.filter(f => f.quotaStatus === 'ultra_strict' || f.quotaStatus === 'suspended').length}
            </span>
            <span className="text-xs text-rose-600 font-medium">只告急</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            最严: <span className="text-rose-600 font-bold">100元/日</span> (景顺科技/易方达)
          </div>
        </div>

        {/* 4. 额度充沛/大户配置 */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>宽松额度 (≥5000元)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 font-mono">{summaryStats.openCount}</span>
            <span className="text-xs text-slate-500">只标的</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 truncate">
            大额配置: <span className="text-emerald-600 font-semibold">富国/嘉实/天弘/汇添富</span>
          </div>
        </div>

        {/* 5. 场内高溢价警示 */}
        <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-sm hover:border-slate-300 transition-colors col-span-2 md:col-span-4 lg:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>场内高溢价 (&gt;3%) 警示</span>
            <Flame className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl font-black text-orange-600 font-mono">{summaryStats.etfHighPremiumCount}</span>
            <span className="text-xs text-slate-500">只ETF/LOF</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500 flex items-center justify-between">
            <span>溢价榜首:</span>
            <span className="text-orange-600 font-bold font-mono">纳指科技 +6.85%</span>
          </div>
        </div>
      </div>

      {/* FILTER & TOOLBAR CARD */}
      <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm space-y-3.5">
        {/* Row 1: Category tabs & Quick action buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Index Category Buttons */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              id="qdii-filter-all"
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                categoryFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部美股QDII ({funds.length})
            </button>
            <button
              id="qdii-filter-nasdaq"
              onClick={() => setCategoryFilter('nasdaq')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                categoryFilter === 'nasdaq'
                  ? 'bg-white text-blue-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
              纳斯达克100 ({funds.filter(f => f.indexCategory === 'nasdaq').length})
            </button>
            <button
              id="qdii-filter-sp500"
              onClick={() => setCategoryFilter('sp500')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                categoryFilter === 'sp500'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
              标普500 ({funds.filter(f => f.indexCategory === 'sp500').length})
            </button>
            <button
              id="qdii-filter-tech"
              onClick={() => setCategoryFilter('tech')}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1.5 ${
                categoryFilter === 'tech'
                  ? 'bg-white text-purple-700 shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />
              纳指科技 ({funds.filter(f => f.indexCategory === 'tech').length})
            </button>
          </div>

          {/* Right Action Tools */}
          <div className="flex items-center gap-2">
            {/* 拼单测算器开闭按钮 */}
            <button
              id="qdii-open-calculator-btn"
              onClick={() => setIsCalculatorOpen(!isCalculatorOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold border transition-colors ${
                isCalculatorOpen
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
              }`}
            >
              <Calculator className="w-3.5 h-3.5 text-amber-600" />
              <span>拼单定投测算器</span>
              {isCalculatorOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Export CSV */}
            <button
              id="qdii-export-csv-btn"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition-colors"
              title="导出当前筛选QDII额度清单至CSV表格"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>导出表格</span>
            </button>

            {/* Refresh */}
            <button
              id="qdii-refresh-btn"
              onClick={() => handleFetchData(true)}
              disabled={isRefreshing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? '同步中' : '刷新额度'}</span>
            </button>
          </div>
        </div>

        {/* Row 2: Secondary Filter Conditions & Search */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100 items-center text-xs">
          {/* Search box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="qdii-search-input"
              type="text"
              placeholder="搜索基金代码 (如270042) / 基金名称 / 基金公司..."
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-md border border-slate-200 text-xs bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800"
            />
            {searchKeyword && (
              <button
                onClick={() => setSearchKeyword('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quota Status Selector */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <span className="text-slate-400 shrink-0">额度限制:</span>
            <select
              id="qdii-status-select"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">全部额度状态</option>
              <option value="ultra_strict">极度紧俏 (≤300元/日)</option>
              <option value="strict">严格限额 (301~1000元/日)</option>
              <option value="moderate">适度限购 (1001~5000元/日)</option>
              <option value="relaxed">额度充沛 (&gt;5000元/自由买卖)</option>
              <option value="suspended">暂停申购 (0元/额度耗尽)</option>
            </select>
          </div>

          {/* Fund Type (OTC vs Floor) */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <span className="text-slate-400 shrink-0">场所:</span>
            <select
              id="qdii-type-select"
              value={fundTypeFilter}
              onChange={e => setFundTypeFilter(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="all">场外联接+场内</option>
              <option value="otc">仅场外联接(申购)</option>
              <option value="floor">仅场内交易(ETF/LOF)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="lg:col-span-3 flex items-center gap-1.5">
            <span className="text-slate-400 shrink-0">排序:</span>
            <select
              id="qdii-sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full py-1.5 px-2 bg-white border border-slate-200 rounded-md text-xs text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="limit_asc">单日限额从严到宽 (从小到大)</option>
              <option value="limit_desc">单日限额从宽到严 (从大到小)</option>
              <option value="premium_desc">场内折溢价率从高到低</option>
              <option value="ytd_desc">今年以来收益率最高</option>
              <option value="nav_desc">单位净值从高到低</option>
            </select>
          </div>
        </div>

        {/* Live sync status pill */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            <span>数据源: 国家外汇管理局QDII配额披露、各公募大额申购限额公告与沪深交易所实时行情</span>
            <span>•</span>
            <span>上次同步: <strong className="text-slate-600 font-mono">{lastRefreshTime}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span>当前筛选结果: <strong className="text-blue-600 font-bold">{filteredFunds.length}</strong> 只</span>
            <span>•</span>
            <span className="font-mono text-slate-500">{refreshCountdown}秒后自动复验</span>
          </div>
        </div>
      </div>

      {/* CALCULATOR EXPANDABLE CARD */}
      {isCalculatorOpen && (
        <div className="bg-gradient-to-r from-amber-50/70 via-orange-50/40 to-yellow-50/70 border border-amber-200 rounded-lg p-4 shadow-sm animate-fade-in space-y-4">
          <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-amber-500 text-white flex items-center justify-center font-bold">
                <Calculator className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">QDII 额度拼单 / 定投最优化测算器</h4>
                <p className="text-[11px] text-slate-600">
                  针对纳指与标普QDII基金普遍限额（如单日1000元/300元），输入您的建仓或定投预算，系统自动帮您组合最佳多基金拼单方案！
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCalculatorOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Calculator Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">本次建仓/单期定投预算 (元):</label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">¥</span>
                <input
                  type="number"
                  step="500"
                  min="500"
                  max="100000"
                  value={targetInvestmentAmount}
                  onChange={e => setTargetInvestmentAmount(Math.max(100, Number(e.target.value)))}
                  className="w-full pl-7 pr-3 py-1.5 rounded border border-amber-300 bg-white font-mono font-bold text-slate-900 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
              <div className="flex gap-1.5 mt-1.5">
                {[1000, 3000, 5000, 10000, 20000].map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTargetInvestmentAmount(amt)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                      targetInvestmentAmount === amt
                        ? 'bg-amber-600 text-white border-amber-600 font-bold'
                        : 'bg-white text-slate-600 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    ¥{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">投资标的偏好:</label>
              <select
                value={calculatorPreference}
                onChange={e => setCalculatorPreference(e.target.value as any)}
                className="w-full py-1.5 px-2 bg-white border border-amber-300 rounded text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="both">纳指100 + 标普500 均衡搭配</option>
                <option value="nasdaq_only">仅配置 纳斯达克100 (偏成长激进)</option>
                <option value="sp500_only">仅配置 标普500 (偏稳健大盘)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1.5">
                自动排除已暂停申购和场内高溢价基金，优先选用管理费低且额度合规的A/C类份额。
              </p>
            </div>

            <div className="bg-white/80 border border-amber-200 rounded p-2.5 flex flex-col justify-center">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">测算总可投金额:</span>
                <span className="font-bold text-emerald-600 font-mono text-sm">
                  ¥{quotaCalculatorPlan.totalAllocated.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">所需基金只数:</span>
                <span className="font-bold text-slate-800 font-mono">
                  {quotaCalculatorPlan.plan.length} 只标的
                </span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {quotaCalculatorPlan.isFullySatisfied ? (
                  <span className="text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> 完美覆盖您的全额预算！
                  </span>
                ) : (
                  <span className="text-amber-700">
                    尚差 ¥{quotaCalculatorPlan.remainingDeficit.toLocaleString()} 额度 (建议分批买入或补充宽松标的)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Generated Plan Table */}
          <div className="bg-white rounded border border-amber-200 overflow-hidden">
            <div className="bg-amber-100/60 px-3 py-1.5 text-xs font-bold text-amber-900 flex items-center justify-between">
              <span>推荐多基金拼单清单 (单日/单期可直接下单):</span>
              <span className="text-[11px] font-normal text-amber-800">
                可复制基金代码至任意券商或基金销售APP一键买入
              </span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {quotaCalculatorPlan.plan.map(({ fund, allocateAmount }, idx) => (
                <div key={fund.id} className="px-3 py-2 flex items-center justify-between hover:bg-slate-50">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-mono font-bold text-[11px] flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{fund.name}</span>
                        <span className="font-mono text-slate-500">({fund.code})</span>
                        <button
                          onClick={(e) => handleCopyCode(fund.code, e)}
                          className="text-slate-400 hover:text-blue-600"
                          title="复制基金代码"
                        >
                          {copiedCode === fund.code ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>标的: {fund.indexName}</span>
                        <span>•</span>
                        <span>公司: {fund.company}</span>
                        <span>•</span>
                        <span>该基金单日限额: {fund.dailyLimitText}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-xs font-bold text-amber-700">
                      建议申购 ¥{allocateAmount.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      占总预算 {Math.round((allocateAmount / targetInvestmentAmount) * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CORE DATA TABLE */}
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>市场上纳斯达克与标普500基金QDII额度汇总表</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              共 {filteredFunds.length} 只标的
            </span>
          </div>

          <div className="text-xs text-slate-500">
            提示：点击任意行可查看限额外汇官方公告原因及定投建议
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold select-none">
                <th className="py-2.5 px-3 w-24">基金代码</th>
                <th className="py-2.5 px-3 min-w-[220px]">基金名称</th>
                <th className="py-2.5 px-3 w-28">跟踪标的</th>
                <th className="py-2.5 px-3 w-24">基金公司</th>
                <th className="py-2.5 px-3 min-w-[150px] bg-amber-50/50 text-amber-900 border-x border-amber-100">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    <span>单日申购限额 (核心)</span>
                  </div>
                </th>
                <th className="py-2.5 px-3 w-24">定投限额</th>
                <th className="py-2.5 px-3 w-28">场内对应/溢价率</th>
                <th className="py-2.5 px-3 w-20 text-right">最新净值</th>
                <th className="py-2.5 px-3 w-20 text-right">今年涨幅</th>
                <th className="py-2.5 px-3 w-24">最新公告日</th>
                <th className="py-2.5 px-3 w-20 text-center">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/80">
              {filteredFunds.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Search className="w-6 h-6 text-slate-300" />
                      <span>未找到符合条件的QDII基金，请尝试更换关键词或筛选条件</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredFunds.map((fund, idx) => {
                  const isSuspended = fund.quotaStatus === 'suspended';
                  const isUltraStrict = fund.quotaStatus === 'ultra_strict';
                  const hasHighPremium = (fund.premiumRate || 0) >= 3.0;

                  return (
                    <tr
                      key={fund.id}
                      onClick={() => setDetailFund(fund)}
                      className={`hover:bg-blue-50/40 cursor-pointer transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'
                      } ${isSuspended ? 'opacity-80 bg-rose-50/20' : ''}`}
                    >
                      {/* 1. 基金代码 */}
                      <td className="py-2.5 px-3 font-mono">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-900">{fund.code}</span>
                          <button
                            onClick={(e) => handleCopyCode(fund.code, e)}
                            className="text-slate-300 hover:text-blue-600 p-0.5 rounded"
                            title="复制基金代码"
                          >
                            {copiedCode === fund.code ? (
                              <Check className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* 2. 基金名称 */}
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-900 hover:text-blue-600">
                            {fund.name}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-medium ${
                            fund.fundType.includes('floor') 
                              ? 'bg-purple-100 text-purple-700' 
                              : fund.fundType.includes('c') 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {fund.fundTypeLabel}
                          </span>
                        </div>
                      </td>

                      {/* 3. 跟踪标的 */}
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium ${
                          fund.indexCategory === 'nasdaq'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : fund.indexCategory === 'sp500'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-purple-50 text-purple-700 border border-purple-200'
                        }`}>
                          {fund.indexCategory === 'nasdaq' ? '纳指100' : fund.indexCategory === 'sp500' ? '标普500' : '纳指科技'}
                        </span>
                      </td>

                      {/* 4. 基金公司 */}
                      <td className="py-2.5 px-3 text-slate-600">
                        {fund.company}
                      </td>

                      {/* 5. 单日申购限额 (核心列) */}
                      <td className="py-2.5 px-3 bg-amber-50/20 border-x border-amber-100">
                        {renderQuotaBadge(fund)}
                      </td>

                      {/* 6. 定投限额 */}
                      <td className="py-2.5 px-3 font-mono text-slate-600">
                        {fund.regularInvestLimit === 0 ? (
                          <span className="text-rose-600 font-semibold">暂停定投</span>
                        ) : fund.regularInvestLimit >= 99999999 ? (
                          <span className="text-slate-400">场内定投</span>
                        ) : (
                          <span>¥{fund.regularInvestLimit.toLocaleString()}</span>
                        )}
                      </td>

                      {/* 7. 场内对应/溢价率 */}
                      <td className="py-2.5 px-3 font-mono">
                        {fund.etfFloorCode ? (
                          <div>
                            <div className="text-slate-700 font-medium">
                              {fund.etfFloorCode}
                            </div>
                            {fund.premiumRate !== undefined && (
                              <div className={`text-[11px] font-bold ${
                                hasHighPremium ? 'text-orange-600' : fund.premiumRate > 0 ? 'text-rose-600' : 'text-emerald-600'
                              }`}>
                                {fund.premiumRate > 0 ? `+${fund.premiumRate}%` : `${fund.premiumRate}%`}
                                {hasHighPremium && ' ⚠️高溢价'}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>

                      {/* 8. 最新单位净值 */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-900 font-semibold">
                        {fund.latestNav.toFixed(4)}
                      </td>

                      {/* 9. 今年以来涨幅 */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                        +{fund.ytdReturn.toFixed(2)}%
                      </td>

                      {/* 10. 最新公告日 */}
                      <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                        {fund.lastLimitDate}
                      </td>

                      {/* 11. 操作/详情 */}
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDetailFund(fund);
                          }}
                          className="px-2 py-0.5 rounded text-[11px] text-blue-600 hover:bg-blue-100/60 font-medium transition-colors"
                        >
                          公告
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

      {/* FOOTER TIPS & GUIDELINES */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-600 space-y-2">
        <div className="font-bold text-slate-800 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-blue-600" />
          <span>QDII 美股纳斯达克与标普500基金 额度配置指南与投资常识</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px] leading-relaxed">
          <div className="bg-white p-3 rounded border border-slate-200">
            <h5 className="font-bold text-slate-800 mb-1 text-xs">为什么各大纳指/标普基金纷纷限额？</h5>
            <p className="text-slate-600">
              QDII基金投资境外市场依赖国家外汇管理局批准的投资额度。当国内资金涌入美股资产导致基金公司额度逼近上限时，基金公司必须通过限制单日单账户申购（如100元或1000元）甚至暂停申购来控制规模，保护既有持有人利益。
            </p>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200">
            <h5 className="font-bold text-slate-800 mb-1 text-xs">如何破解限额进行大额建仓或定投？</h5>
            <p className="text-slate-600">
              1. <strong>多公募拼单</strong>：分散在广发、国泰、华夏、博时、富国等不同基金公司，每家申购上限额度（如1000元×5家=5000元/日）；<br />
              2. <strong>选用大额宽松标的</strong>：如富国纳指、嘉实标普等新获额度标的，单日单户可达10,000元；<br />
              3. <strong>场内ETF直接买卖</strong>：二级市场不受QDII申购配额限制，但需注意防范高溢价。
            </p>
          </div>

          <div className="bg-white p-3 rounded border border-slate-200">
            <h5 className="font-bold text-slate-800 mb-1 text-xs">谨防场内高溢价风险（重要提示）</h5>
            <p className="text-slate-600">
              当场外申购暂停或极严限购时，部分资金会转向场内溢价抢筹。例如景顺长城纳指科技(159509)曾出现超10%甚至更高的溢价率。一旦后续额度放开或资金降温，高溢价回落将直接导致大幅本金亏损，切勿盲目高溢价追买！
            </p>
          </div>
        </div>
      </div>

      {/* FUND DETAIL & OFFICIAL NOTICE MODAL */}
      {detailFund && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-base">{detailFund.name}</span>
                  <span className="px-1.5 py-0.2 bg-blue-500 text-white rounded text-[10px] font-mono">
                    {detailFund.code}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  管理人: {detailFund.company} · 标的: {detailFund.indexName}
                </div>
              </div>
              <button
                onClick={() => setDetailFund(null)}
                className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs">
              {/* Quota Highlights Card */}
              <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">当前单日申购限额:</span>
                  <span className="text-sm font-black text-amber-900 font-mono">
                    {detailFund.dailyLimitText}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">定投业务限额:</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {detailFund.regularInvestText}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">限额调整生效日期:</span>
                  <span className="font-mono text-slate-700">
                    {detailFund.lastLimitDate}
                  </span>
                </div>
              </div>

              {/* Notice Title & Limit Reason */}
              <div className="space-y-1.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                  <span>最新官方限购公告与原因说明:</span>
                </h4>
                <div className="bg-slate-50 rounded border border-slate-200 p-3 text-slate-700 leading-relaxed space-y-1">
                  <div className="font-semibold text-slate-900">
                    《{detailFund.noticeTitle || '关于调整基金大额申购及定期定额投资业务限额的公告'}》
                  </div>
                  <p className="text-slate-600 text-[11px]">
                    {detailFund.limitReason || '为保护基金份额持有人利益，根据国家外汇管理局批准的QDII外汇额度上限管理规定，本基金管理人决定对本基金的大额申购及定投业务进行额度管控。'}
                  </p>
                </div>
              </div>

              {/* Fund Stats Overview */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500">最新单位净值</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {detailFund.latestNav.toFixed(4)}
                  </div>
                  <div className="text-[10px] text-slate-400">({detailFund.navDate})</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500">今年以来回报</div>
                  <div className="text-sm font-bold text-rose-600 font-mono mt-0.5">
                    +{detailFund.ytdReturn.toFixed(2)}%
                  </div>
                  <div className="text-[10px] text-slate-400">近1年 +{detailFund.oneYearReturn}%</div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500">基金规模/费用</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {detailFund.fundSize ? `${detailFund.fundSize}亿` : '多亿'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">{detailFund.feeRate}</div>
                </div>
              </div>

              {/* Practical investment tips */}
              {detailFund.tips && (
                <div className="bg-blue-50/70 border border-blue-200 rounded p-2.5 text-[11px] text-blue-900 leading-relaxed">
                  <strong>💡 配置贴士：</strong>{detailFund.tips}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={(e) => handleCopyCode(detailFund.code, e)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>复制基金代码 ({detailFund.code})</span>
              </button>

              <button
                onClick={() => setDetailFund(null)}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
