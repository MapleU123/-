import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Gauge, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown, 
  Filter, 
  Info, 
  Download, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  ShieldCheck, 
  BarChart3, 
  Layers, 
  SlidersHorizontal,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  FileImage,
  Camera,
  Check,
  CheckSquare,
  Square
} from 'lucide-react';
import { 
  IndustryValuationItem, 
  ValuationStatus, 
  getValuationStatusBadgeStyle 
} from '../types/industryValuation';
import { SHENWAN_31_INDUSTRIES_VALUATION } from '../data/industryValuationData';
import { IndustryValuationTrendChart } from './IndustryValuationTrendChart';

interface IndustryValuationViewProps {
  onOpenAIDiagnosis?: (sectorName?: string) => void;
  onOpenReportExport?: (selectedIndustries?: IndustryValuationItem[]) => void;
  onSelectSectorByName?: (sectorName: string) => void;
}

type SortField = 
  | 'pePercentile' 
  | 'pe' 
  | 'pbPercentile' 
  | 'roe' 
  | 'weekChange' 
  | 'monthChange' 
  | 'dividendYield'
  | 'name';

export const IndustryValuationView: React.FC<IndustryValuationViewProps> = ({
  onOpenAIDiagnosis,
  onOpenReportExport,
  onSelectSectorByName
}) => {
  const [data, setData] = useState<IndustryValuationItem[]>(SHENWAN_31_INDUSTRIES_VALUATION);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('全部');
  const [sortField, setSortField] = useState<SortField>('pePercentile');
  const [sortAsc, setSortAsc] = useState<boolean>(true); // 默认升序（低估排前）
  const [selectedItem, setSelectedItem] = useState<IndustryValuationItem>(SHENWAN_31_INDUSTRIES_VALUATION[0]);
  const [isTrendChartExpanded, setIsTrendChartExpanded] = useState<boolean>(true);

  // Multi-selection state for targeted export and analysis (matching ETF Valuation)
  const [selectedIndustryCodes, setSelectedIndustryCodes] = useState<Set<string>>(new Set());

  // List of selected industry objects
  const selectedIndustriesList = useMemo(() => {
    return data.filter(item => selectedIndustryCodes.has(item.code));
  }, [data, selectedIndustryCodes]);

  // Status Summary Stats
  const statusStats = useMemo(() => {
    const stats: Record<ValuationStatus, number> = {
      '极度低估': 0,
      '低估': 0,
      '正常': 0,
      '高估': 0,
      '极度高估': 0
    };
    data.forEach(item => {
      stats[item.status] = (stats[item.status] || 0) + 1;
    });
    return stats;
  }, [data]);

  // Filter & Sort Logic
  const filteredAndSortedData = useMemo(() => {
    return data
      .filter(item => {
        // Status Filter
        if (selectedStatusFilter !== '全部' && item.status !== selectedStatusFilter) {
          return false;
        }
        // Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          const matchName = item.name.toLowerCase().includes(q) || 
            (q.includes('公共') && item.name.includes('公用')) || 
            (q.includes('公用') && item.name.includes('公共'));
          const matchCode = item.code.toLowerCase().includes(q);
          const matchStock = item.leadingStocks.some(s => s.toLowerCase().includes(q));
          return matchName || matchCode || matchStock;
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        if (typeof valA === 'string') {
          return sortAsc ? (valA as string).localeCompare(valB as string) : (valB as string).localeCompare(valA as string);
        }
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      });
  }, [data, selectedStatusFilter, searchQuery, sortField, sortAsc]);

  // Filtered list selection status
  const isAllFilteredSelected = useMemo(() => {
    return filteredAndSortedData.length > 0 && filteredAndSortedData.every(item => selectedIndustryCodes.has(item.code));
  }, [filteredAndSortedData, selectedIndustryCodes]);

  const isSomeFilteredSelected = useMemo(() => {
    return filteredAndSortedData.some(item => selectedIndustryCodes.has(item.code)) && !isAllFilteredSelected;
  }, [filteredAndSortedData, selectedIndustryCodes, isAllFilteredSelected]);

  // Checkbox indeterminate ref for header
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isSomeFilteredSelected;
    }
  }, [isSomeFilteredSelected]);

  // Toggle single selection
  const toggleSelectIndustry = (code: string) => {
    setSelectedIndustryCodes(prev => {
      const next = new Set(prev);
      if (next.has(code)) {
        next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  // Toggle select all filtered
  const toggleSelectAllFiltered = () => {
    setSelectedIndustryCodes(prev => {
      const next = new Set(prev);
      if (isAllFilteredSelected) {
        filteredAndSortedData.forEach(item => next.delete(item.code));
      } else {
        filteredAndSortedData.forEach(item => next.add(item.code));
      }
      return next;
    });
  };

  // Invert selection among filtered items
  const invertSelection = () => {
    setSelectedIndustryCodes(prev => {
      const next = new Set(prev);
      filteredAndSortedData.forEach(item => {
        if (next.has(item.code)) {
          next.delete(item.code);
        } else {
          next.add(item.code);
        }
      });
      return next;
    });
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedIndustryCodes(new Set());
  };

  // Select only undervalued industries in current view (极度低估 + 低估)
  const selectLowValuation = () => {
    setSelectedIndustryCodes(prev => {
      const next = new Set(prev);
      filteredAndSortedData.forEach(item => {
        if (item.status.includes('低估')) {
          next.add(item.code);
        }
      });
      return next;
    });
  };

  // Target items to export: selected items if any; if none selected, but filtered, export filtered; otherwise undefined (all)
  const exportTargetItems = useMemo(() => {
    if (selectedIndustryCodes.size > 0) return selectedIndustriesList;
    if (filteredAndSortedData.length < SHENWAN_31_INDUSTRIES_VALUATION.length) return filteredAndSortedData;
    return undefined;
  }, [selectedIndustryCodes, selectedIndustriesList, filteredAndSortedData]);

  const exportButtonText = useMemo(() => {
    if (selectedIndustryCodes.size > 0) return `📸 导出选中行业图片 (${selectedIndustryCodes.size}个)`;
    if (filteredAndSortedData.length < SHENWAN_31_INDUSTRIES_VALUATION.length) return `📸 导出当前筛选行业图片 (${filteredAndSortedData.length}个)`;
    return `📸 导出31个行业估值全景图 (${SHENWAN_31_INDUSTRIES_VALUATION.length}个)`;
  }, [selectedIndustryCodes, filteredAndSortedData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      // PE percentile/PE default ascending (low PE first), returns default descending
      setSortAsc(field === 'pePercentile' || field === 'pe' || field === 'pbPercentile');
    }
  };

  const handleExportCSV = () => {
    const headers = [
      '指数代码',
      '行业名称',
      '估值状态',
      '最新市盈率(PE)',
      '市盈率历史百分位(%)',
      '市净率历史百分位(%)',
      '最新市净率(PB)',
      '净资产收益率ROE(%)',
      '近一周涨跌幅(%)',
      '当月涨幅(%)',
      '股息率(%)',
      '代表性核心龙头'
    ];
    const rows = filteredAndSortedData.map(item => [
      item.code,
      item.name,
      item.status,
      item.pe.toFixed(2),
      item.pePercentile.toFixed(1) + '%',
      item.pbPercentile.toFixed(1) + '%',
      item.pb.toFixed(2),
      item.roe.toFixed(2) + '%',
      (item.weekChange >= 0 ? '+' : '') + item.weekChange.toFixed(2) + '%',
      (item.monthChange >= 0 ? '+' : '') + item.monthChange.toFixed(2) + '%',
      item.dividendYield.toFixed(2) + '%',
      item.leadingStocks.join(';')
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `A股申万31个行业指数估值全景表_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header Banner & Valuation Rules */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white flex items-center justify-center shadow-xs">
                <Gauge className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  申万31个行业指数最新估值全景
                  <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                    31/31 全行业覆盖
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  基于历史十年滚动分位数计算市盈率(PE-TTM)与市净率(PB)百分位，权威客观划分估值梯队
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>导出估值报表</span>
            </button>

            {onOpenReportExport && (
              <button
                type="button"
                onClick={() => onOpenReportExport(exportTargetItems)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md cursor-pointer ${
                  selectedIndustryCodes.size > 0
                    ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white border border-emerald-400/50 shadow-emerald-950/20 ring-2 ring-emerald-400/40'
                    : 'border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 shadow-2xs'
                }`}
                title="导出当前选定或筛选的申万行业估值高清长图，支持2K/4K/8K极清与水印切换"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{exportButtonText}</span>
              </button>
            )}

            {onOpenAIDiagnosis && (
              <button
                onClick={() => onOpenAIDiagnosis('申万31行业估值梯队')}
                className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>AI 行业估值诊断</span>
              </button>
            )}
          </div>
        </div>

        {/* Valuation Metrics Interpretation Strip */}
        <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300 mb-2">
            <Info className="w-3.5 h-3.5 text-indigo-500" />
            <span>核心估值指标分析指南：</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11.5px] leading-relaxed text-slate-600 dark:text-slate-400">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-indigo-600 dark:text-indigo-400">市盈率 (PE-TTM)：</span>
              反映每单位盈利对应的股价水平。高PE可能意味着高估，低PE可能意味着低估。结合历史百分位可排除周期波动干扰。
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-emerald-600 dark:text-emerald-400">市净率 (PB)：</span>
              反映股价与每股净资产的比值，用于判断重资产或周期行业资产价值是否被高估或低估，破净(PB&lt;1)往往为防守安全边际。
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-amber-600 dark:text-amber-400">股息率 (Dividend Yield)：</span>
              衡量现金分红投资回报率。股息率高通常意味着当前估值具备较强安全垫或企业现金流分红丰厚，是红利避险的核心标尺。
            </div>
          </div>
        </div>

        {/* 2. Five Valuation Status Interactive Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setSelectedStatusFilter('全部')}
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
              selectedStatusFilter === '全部'
                ? 'bg-indigo-50/80 border-indigo-300 dark:bg-indigo-950/60 dark:border-indigo-700 shadow-2xs'
                : 'bg-slate-50/60 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">全部行业</div>
            <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">{data.length} <span className="text-xs font-normal text-slate-400">个</span></div>
            <div className="text-[10px] text-slate-400 mt-0.5">A股全部31类</div>
          </button>

          {(['极度低估', '低估', '正常', '高估', '极度高估'] as ValuationStatus[]).map(st => {
            const style = getValuationStatusBadgeStyle(st);
            const count = statusStats[st] || 0;
            const isSelected = selectedStatusFilter === st;
            return (
              <button
                key={st}
                onClick={() => setSelectedStatusFilter(isSelected ? '全部' : st)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? `${style.bg} ${style.border} ring-2 ring-indigo-500/20 shadow-2xs`
                    : 'bg-slate-50/60 border-slate-200/80 dark:bg-slate-800/40 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${style.text}`}>{st}</span>
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                  {count} <span className="text-xs font-normal text-slate-400">个</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {st === '极度低估' && 'PE分位 < 10%'}
                  {st === '低估' && '10% ≤ PE < 30%'}
                  {st === '正常' && '30% ≤ PE ≤ 70%'}
                  {st === '高估' && '70% < PE < 90%'}
                  {st === '极度高估' && 'PE分位 ≥ 90%'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2.5. Industry PE Historical Percentile Trend & Comparison Visualization */}
      <IndustryValuationTrendChart
        allIndustries={SHENWAN_31_INDUSTRIES_VALUATION}
        selectedIndustry={selectedItem}
        onSelectIndustry={setSelectedItem}
        onOpenAIDiagnosis={onOpenAIDiagnosis}
      />

      {/* 3. Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="搜索行业名称、指数代码、龙头股 (如: 银行 / 801780 / 宁德时代)..."
              className="w-full pl-8.5 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span>共找到 <strong className="text-slate-800 dark:text-slate-200">{filteredAndSortedData.length}</strong> 个行业指数</span>
          <span>•</span>
          <span>点击表头支持任意指标升降排序</span>
        </div>
      </div>

      {/* 3.5. Multi-selection Batch Action Toolbar (Matching ETF Valuation View) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs shadow-2xs">
        <div className="flex items-center flex-wrap gap-2">
          {/* Select all filtered checkbox */}
          <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer transition-colors">
            <input
              type="checkbox"
              ref={selectAllCheckboxRef}
              checked={isAllFilteredSelected}
              onChange={toggleSelectAllFiltered}
              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
            />
            <span>全选当前 ({filteredAndSortedData.length}个)</span>
          </label>

          <button
            type="button"
            onClick={invertSelection}
            className="px-2.5 py-1.5 rounded-lg font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
          >
            反选
          </button>

          <button
            type="button"
            onClick={selectLowValuation}
            className="px-2.5 py-1.5 rounded-lg font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/80 transition-all cursor-pointer flex items-center gap-1"
          >
            <TrendingDown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>选低估行业</span>
          </button>

          {selectedIndustryCodes.size > 0 && (
            <button
              type="button"
              onClick={clearSelection}
              className="px-2.5 py-1.5 rounded-lg font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              清空已选
            </button>
          )}

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

          {/* Selection status badge */}
          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
            <span>已选</span>
            <span className="px-2 py-0.5 rounded-full font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs">
              {selectedIndustryCodes.size}
            </span>
            <span>个行业板块</span>
          </span>
        </div>

        {/* Right side: Fast Export Button */}
        {onOpenReportExport && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => onOpenReportExport(exportTargetItems)}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer ${
                selectedIndustryCodes.size > 0
                  ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white ring-2 ring-emerald-400/50 shadow-emerald-950/20'
                  : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <span>{exportButtonText}</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. 31 Industry Valuation Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 select-none">
                <th className="py-3 px-3 w-10 text-center">
                  <label className="inline-flex items-center justify-center cursor-pointer" title={isAllFilteredSelected ? "取消全选" : "全选当前列表"}>
                    <input
                      type="checkbox"
                      ref={selectAllCheckboxRef}
                      checked={isAllFilteredSelected}
                      onChange={toggleSelectAllFiltered}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                    />
                  </label>
                </th>
                <th className="py-3 px-2 w-10 text-center font-bold">#</th>
                <th className="py-3 px-3 font-bold">
                  <button 
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>行业指数</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </button>
                </th>
                <th className="py-3 px-3 font-bold text-center">估值梯队</th>
                <th className="py-3 px-3 font-bold text-right">
                  <button 
                    onClick={() => handleSort('pe')}
                    className="flex items-center justify-end gap-1 w-full hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>最新市盈率 (PE)</span>
                    {sortField === 'pe' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                  </button>
                </th>
                <th className="py-3 px-3.5 font-bold text-right">
                  <button 
                    onClick={() => handleSort('pePercentile')}
                    className="flex items-center justify-end gap-1 w-full hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>市盈率百分位</span>
                    {sortField === 'pePercentile' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                  </button>
                </th>
                <th className="py-3 px-3.5 font-bold text-right">
                  <button 
                    onClick={() => handleSort('pbPercentile')}
                    className="flex items-center justify-end gap-1 w-full hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>市净率百分位</span>
                    {sortField === 'pbPercentile' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                  </button>
                </th>
                <th className="py-3 px-3 font-bold text-right">
                  <button 
                    onClick={() => handleSort('roe')}
                    className="flex items-center justify-end gap-1 w-full hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>净资产收益率 (ROE)</span>
                    {sortField === 'roe' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                  </button>
                </th>
                <th className="py-3 px-3 font-bold text-right">
                  <button 
                    onClick={() => handleSort('weekChange')}
                    className="flex items-center justify-end gap-1 w-full hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>近一周涨跌幅</span>
                    {sortField === 'weekChange' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                  </button>
                </th>
                <th className="py-3 px-3.5 font-bold text-right">
                  <button 
                    onClick={() => handleSort('monthChange')}
                    className="flex items-center justify-end gap-1 w-full hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>当月涨幅</span>
                    {sortField === 'monthChange' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                  </button>
                </th>
                <th className="py-3 px-3 font-bold text-right">
                  <button 
                    onClick={() => handleSort('dividendYield')}
                    className="flex items-center justify-end gap-1 w-full hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    <span>股息率</span>
                    {sortField === 'dividendYield' && (sortAsc ? <ArrowUp className="w-3 h-3 text-indigo-600" /> : <ArrowDown className="w-3 h-3 text-indigo-600" />)}
                  </button>
                </th>
                <th className="py-3 px-3.5 font-bold">核心龙头权重股</th>
                <th className="py-3 px-3 font-bold text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSortedData.map((item, index) => {
                const badgeStyle = getValuationStatusBadgeStyle(item.status);
                const isDetailSelected = selectedItem?.id === item.id;
                const isChecked = selectedIndustryCodes.has(item.code);

                return (
                  <tr 
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer ${
                      isChecked 
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/50' 
                        : isDetailSelected 
                        ? 'bg-slate-100/70 dark:bg-slate-800/60' 
                        : ''
                    }`}
                  >
                    {/* 复选框勾选 */}
                    <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <label className="inline-flex items-center justify-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectIndustry(item.code)}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer"
                        />
                      </label>
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-slate-400 font-semibold">
                      {index + 1}
                    </td>

                    {/* 指数代码与名称 */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                          {item.code}
                        </span>
                      </div>
                    </td>

                    {/* 估值梯队 (极度低估、低估、正常、高估、极度高估) */}
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${badgeStyle.tagClass}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${badgeStyle.dot}`} />
                        {item.status}
                      </span>
                    </td>

                    {/* 最新市盈率 */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                      {item.pe.toFixed(2)}
                    </td>

                    {/* 市盈率百分位 (可视化进度条) */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full rounded-full ${
                              item.pePercentile < 30 ? 'bg-emerald-500' :
                              item.pePercentile <= 70 ? 'bg-blue-500' :
                              item.pePercentile < 90 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, item.pePercentile))}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                          {item.pePercentile.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* 市净率百分位 */}
                    <td className="py-3 px-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-14 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                          <div 
                            className={`h-full rounded-full ${
                              item.pbPercentile < 30 ? 'bg-emerald-500' :
                              item.pbPercentile <= 70 ? 'bg-blue-500' :
                              item.pbPercentile < 90 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, item.pbPercentile))}%` }}
                          />
                        </div>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                          {item.pbPercentile.toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* 净资产收益率 ROE */}
                    <td className="py-3 px-3 text-right font-mono font-semibold">
                      <span className={item.roe >= 10 ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}>
                        {item.roe.toFixed(2)}%
                      </span>
                    </td>

                    {/* 近一周涨跌幅 */}
                    <td className="py-3 px-3 text-right font-mono font-bold">
                      <span className={item.weekChange >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {item.weekChange >= 0 ? '+' : ''}{item.weekChange.toFixed(2)}%
                      </span>
                    </td>

                    {/* 当月涨幅 */}
                    <td className="py-3 px-3.5 text-right font-mono font-bold">
                      <span className={item.monthChange >= 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {item.monthChange >= 0 ? '+' : ''}{item.monthChange.toFixed(2)}%
                      </span>
                    </td>

                    {/* 股息率 */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                      {item.dividendYield.toFixed(2)}%
                    </td>

                    {/* 代表龙头 */}
                    <td className="py-3 px-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {item.leadingStocks.slice(0, 3).map((stk, sIdx) => (
                          <span
                            key={sIdx}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectSectorByName) onSelectSectorByName(item.name);
                            }}
                            className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 dark:bg-slate-800 dark:hover:bg-indigo-900/40 text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition-colors"
                          >
                            {stk}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* 诊断按钮 */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onOpenAIDiagnosis) onOpenAIDiagnosis(`${item.name}(${item.code})`);
                        }}
                        className="px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        AI诊断
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Selected Industry Valuation Detail Card */}
      {selectedItem && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {selectedItem.name} ({selectedItem.code}) 深度估值画像
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getValuationStatusBadgeStyle(selectedItem.status).tagClass}`}>
                  {selectedItem.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {selectedItem.description}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => toggleSelectIndustry(selectedItem.code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  selectedIndustryCodes.has(selectedItem.code)
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                }`}
              >
                {selectedIndustryCodes.has(selectedItem.code) ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>已加入图片导出 ({selectedIndustryCodes.size}个)</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3.5 h-3.5" />
                    <span>加入图片导出</span>
                  </>
                )}
              </button>
              <button
                onClick={() => onSelectSectorByName && onSelectSectorByName(selectedItem.name)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                查看板块资金流
              </button>
              <button
                onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis(`${selectedItem.name} 估值与基本面投资价值`)}
                className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>一键AI深度研报</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mt-4">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-[11px] text-slate-400">最新市盈率 (PE)</div>
              <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
                {selectedItem.pe.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">历史中位: {selectedItem.historicalPeMedian.toFixed(2)}</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-[11px] text-slate-400">PE历史百分位</div>
              <div className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1 font-mono">
                {selectedItem.pePercentile.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">区间: {selectedItem.historicalPeMin}~{selectedItem.historicalPeMax}</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-[11px] text-slate-400">PB历史百分位</div>
              <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
                {selectedItem.pbPercentile.toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">最新PB: {selectedItem.pb.toFixed(2)}</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-[11px] text-slate-400">净资产收益率 ROE</div>
              <div className="text-base font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
                {selectedItem.roe.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">股东资本回报率</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-[11px] text-slate-400">近一周涨跌幅</div>
              <div className={`text-base font-black mt-1 font-mono ${selectedItem.weekChange >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {selectedItem.weekChange >= 0 ? '+' : ''}{selectedItem.weekChange.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">短期走势</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-[11px] text-slate-400">当月涨幅</div>
              <div className={`text-base font-black mt-1 font-mono ${selectedItem.monthChange >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {selectedItem.monthChange >= 0 ? '+' : ''}{selectedItem.monthChange.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">本月累计回报</div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <div className="text-[11px] text-slate-400">股息率</div>
              <div className="text-base font-black text-emerald-600 mt-1 font-mono">
                {selectedItem.dividendYield.toFixed(2)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">现金分红回报</div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Quick Export Bar for Industry Selections (Matching ETF Valuation View) */}
      {selectedIndustryCodes.size > 0 && onOpenReportExport && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-indigo-500/40 flex items-center gap-4 animate-in slide-in-from-bottom-5 duration-200">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold">
              已选 <span className="text-emerald-400 font-mono text-sm">{selectedIndustryCodes.size}</span> 个行业板块
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700" />
          <button
            type="button"
            onClick={() => onOpenReportExport(selectedIndustriesList)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 cursor-pointer transition-all"
          >
            <Camera className="w-4 h-4" />
            <span>📸 立即导出选中行业图片 ({selectedIndustryCodes.size}个)</span>
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
