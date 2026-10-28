import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ReferenceArea
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  SlidersHorizontal,
  ChevronDown,
  Check,
  X,
  Sparkles,
  Info,
  Calendar,
  BarChart2,
  Maximize2,
  Minimize2,
  RefreshCw,
  Plus
} from 'lucide-react';
import { IndustryValuationItem, ValuationStatus, getValuationStatusBadgeStyle } from '../types/industryValuation';
import {
  HISTORICAL_PERIODS,
  getCachedIndustrySeries,
  COMPARISON_COLORS
} from '../utils/industryTrendDataGenerator';

interface IndustryValuationTrendChartProps {
  allIndustries: IndustryValuationItem[];
  selectedIndustry: IndustryValuationItem;
  onSelectIndustry: (item: IndustryValuationItem) => void;
  onOpenAIDiagnosis?: (sectorName: string) => void;
}

type TimeframeOption = '1y' | '3y' | 'all';
type MetricViewMode = 'percentile' | 'pe';

export const IndustryValuationTrendChart: React.FC<IndustryValuationTrendChartProps> = ({
  allIndustries,
  selectedIndustry,
  onSelectIndustry,
  onOpenAIDiagnosis
}) => {
  // State
  const [comparisonIds, setComparisonIds] = useState<string[]>(['sw_foodbev']); // 默认对比食品饮料
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all');
  const [metricMode, setMetricMode] = useState<MetricViewMode>('percentile');
  const [isPrimaryDropdownOpen, setIsPrimaryDropdownOpen] = useState(false);
  const [isCompareDropdownOpen, setIsCompareDropdownOpen] = useState(false);
  const [compareSearch, setCompareSearch] = useState('');
  const [primarySearch, setPrimarySearch] = useState('');
  const [showReferenceBands, setShowReferenceBands] = useState(true);

  // Active comparison items
  const comparisonIndustries = useMemo(() => {
    return comparisonIds
      .map(id => allIndustries.find(item => item.id === id))
      .filter((item): item is IndustryValuationItem => Boolean(item) && item?.id !== selectedIndustry.id);
  }, [comparisonIds, allIndustries, selectedIndustry]);

  // Filter historical periods based on timeframe
  const filteredPeriods = useMemo(() => {
    if (timeframe === '1y') {
      return HISTORICAL_PERIODS.slice(-5); // 近5个季度 (1年)
    }
    if (timeframe === '3y') {
      return HISTORICAL_PERIODS.slice(-13); // 近13个季度 (3年)
    }
    return HISTORICAL_PERIODS; // 全量 (近5年全景)
  }, [timeframe]);

  // Recharts formatted chart data
  const chartData = useMemo(() => {
    // 收集所有需要展示的行业: 主行业 + 对比行业
    const activeList = [selectedIndustry, ...comparisonIndustries];
    const seriesMap = new Map<string, { percentileSeries: number[]; peSeries: number[] }>();

    activeList.forEach(item => {
      seriesMap.set(item.id, getCachedIndustrySeries(item));
    });

    const totalPeriodsCount = HISTORICAL_PERIODS.length;
    const startIndex = totalPeriodsCount - filteredPeriods.length;

    return filteredPeriods.map((period, pIdx) => {
      const globalIdx = startIndex + pIdx;
      const point: any = {
        date: period.label,
        key: period.key
      };

      // 主选行业数值
      const primarySeries = seriesMap.get(selectedIndustry.id);
      if (primarySeries) {
        point[`${selectedIndustry.id}_percentile`] = primarySeries.percentileSeries[globalIdx];
        point[`${selectedIndustry.id}_pe`] = primarySeries.peSeries[globalIdx];
      }

      // 对比行业数值
      comparisonIndustries.forEach(cItem => {
        const cSeries = seriesMap.get(cItem.id);
        if (cSeries) {
          point[`${cItem.id}_percentile`] = cSeries.percentileSeries[globalIdx];
          point[`${cItem.id}_pe`] = cSeries.peSeries[globalIdx];
        }
      });

      return point;
    });
  }, [filteredPeriods, selectedIndustry, comparisonIndustries]);

  // Pre-configured comparison shortcuts
  const handleApplyPreset = (ids: string[]) => {
    // 排除当前主选行业自身
    const validIds = ids.filter(id => id !== selectedIndustry.id).slice(0, 3);
    setComparisonIds(validIds);
  };

  const toggleComparisonIndustry = (industry: IndustryValuationItem) => {
    if (industry.id === selectedIndustry.id) return;

    if (comparisonIds.includes(industry.id)) {
      setComparisonIds(prev => prev.filter(id => id !== industry.id));
    } else {
      if (comparisonIds.length >= 3) {
        // 最多同时对比3只行业，保持图表清晰利落
        setComparisonIds(prev => [...prev.slice(1), industry.id]);
      } else {
        setComparisonIds(prev => [...prev, industry.id]);
      }
    }
  };

  // Rank in 31 industries
  const industryRankInfo = useMemo(() => {
    const sorted = [...allIndustries].sort((a, b) => a.pePercentile - b.pePercentile);
    const rank = sorted.findIndex(i => i.id === selectedIndustry.id) + 1;
    return {
      rank,
      total: allIndustries.length,
      cheaperThan: (((allIndustries.length - rank) / allIndustries.length) * 100).toFixed(0)
    };
  }, [allIndustries, selectedIndustry]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all">
      {/* 1. Header & Interactive Control Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100">
                  行业市盈率历史百分位趋势对比
                </h2>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                  基于近5年滚动周期
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                利用百分位消除行业间绝对市盈率差异，直观对比不同板块当前所处历史估值相对高低位置
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls: Primary Selector + Compare Selector + Timeframe */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* A. 主选行业下拉切换 */}
          <div className="relative">
            <button
              onClick={() => {
                setIsPrimaryDropdownOpen(!isPrimaryDropdownOpen);
                setIsCompareDropdownOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              <span>主选: <strong>{selectedIndustry.name}</strong></span>
              <span className="text-[11px] text-indigo-500">({selectedIndustry.pePercentile.toFixed(1)}%)</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isPrimaryDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPrimaryDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-72 max-h-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-2 overflow-hidden flex flex-col">
                <div className="p-1.5 border-b border-slate-100 dark:border-slate-800">
                  <input
                    type="text"
                    value={primarySearch}
                    onChange={e => setPrimarySearch(e.target.value)}
                    placeholder="输入行业名称搜索..."
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                    autoFocus
                  />
                </div>
                <div className="overflow-y-auto max-h-60 space-y-1 p-1">
                  {allIndustries
                    .filter(item => !primarySearch || item.name.includes(primarySearch) || item.code.includes(primarySearch))
                    .map(item => {
                      const isCur = item.id === selectedIndustry.id;
                      const badgeStyle = getValuationStatusBadgeStyle(item.status);
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onSelectIndustry(item);
                            setIsPrimaryDropdownOpen(false);
                            setPrimarySearch('');
                          }}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isCur
                              ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 font-bold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{item.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{item.code.slice(0, 6)}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[11px] font-bold">{item.pePercentile.toFixed(1)}%</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${badgeStyle.tagClass}`}>
                              {item.status}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* B. 对比行业下拉添加 */}
          <div className="relative">
            <button
              onClick={() => {
                setIsCompareDropdownOpen(!isCompareDropdownOpen);
                setIsPrimaryDropdownOpen(false);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              <span>添加对比行业</span>
              {comparisonIndustries.length > 0 && (
                <span className="w-4.5 h-4.5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {comparisonIndustries.length}
                </span>
              )}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isCompareDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCompareDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-76 max-h-84 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-30 p-2 overflow-hidden flex flex-col">
                <div className="p-1.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    勾选对比板块 (最多3个)
                  </span>
                  {comparisonIds.length > 0 && (
                    <button
                      onClick={() => setComparisonIds([])}
                      className="text-[11px] text-rose-500 hover:text-rose-600 cursor-pointer"
                    >
                      清空对比
                    </button>
                  )}
                </div>
                <div className="p-1.5">
                  <input
                    type="text"
                    value={compareSearch}
                    onChange={e => setCompareSearch(e.target.value)}
                    placeholder="搜索行业快速添加..."
                    className="w-full px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="overflow-y-auto max-h-56 space-y-1 p-1">
                  {allIndustries
                    .filter(item => item.id !== selectedIndustry.id)
                    .filter(item => !compareSearch || item.name.includes(compareSearch) || item.code.includes(compareSearch))
                    .map(item => {
                      const isChecked = comparisonIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleComparisonIndustry(item)}
                          className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center justify-between transition-colors cursor-pointer ${
                            isChecked
                              ? 'bg-amber-50/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] ${
                              isChecked
                                ? 'bg-amber-500 border-amber-500 text-white font-bold'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}>
                              {isChecked && <Check className="w-2.5 h-2.5" />}
                            </span>
                            <span>{item.name}</span>
                          </div>
                          <span className="font-mono text-[11px] text-slate-500">{item.pePercentile.toFixed(1)}%</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* C. 指标模式: 百分位(%) vs 绝对PE */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setMetricMode('percentile')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                metricMode === 'percentile'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              百分位 (%)
            </button>
            <button
              onClick={() => setMetricMode('pe')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                metricMode === 'pe'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              市盈率 (PE)
            </button>
          </div>

          {/* D. 时间周期切换 */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setTimeframe('1y')}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeframe === '1y'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              近1年
            </button>
            <button
              onClick={() => setTimeframe('3y')}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeframe === '3y'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              近3年
            </button>
            <button
              onClick={() => setTimeframe('all')}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                timeframe === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-2xs font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              近5年全景
            </button>
          </div>
        </div>
      </div>

      {/* 2. Active Comparison Chips & Quick Presets Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 py-2.5 border-b border-slate-100 dark:border-slate-800 text-xs">
        {/* Left: Active Industry Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 text-[11px] font-medium mr-1">当前展示对比:</span>
          
          {/* 主选行业 */}
          <div className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600" />
            <span>{selectedIndustry.name} (主)</span>
            <span className="font-mono text-[11px]">{selectedIndustry.pePercentile.toFixed(1)}%</span>
          </div>

          {/* 对比行业标签 */}
          {comparisonIndustries.map((cItem, idx) => {
            const colorCfg = COMPARISON_COLORS[idx + 1] || COMPARISON_COLORS[1];
            return (
              <div
                key={cItem.id}
                className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 group"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colorCfg.stroke }} />
                <span className="font-semibold">{cItem.name}</span>
                <span className="font-mono text-[11px] text-slate-500">{cItem.pePercentile.toFixed(1)}%</span>
                <button
                  onClick={() => toggleComparisonIndustry(cItem)}
                  className="text-slate-400 hover:text-rose-500 ml-0.5 cursor-pointer"
                  title="移除此对比"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {comparisonIndustries.length === 0 && (
            <span className="text-[11px] text-slate-400 italic">尚未选择对比行业，点击上方「添加对比行业」或右侧预设</span>
          )}
        </div>

        {/* Right: Quick Industry Comparison Presets */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-slate-400 text-[11px]">快捷对比组:</span>
          <button
            onClick={() => handleApplyPreset(['sw_bank', 'sw_coal', 'sw_petrochem'])}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] transition-colors cursor-pointer"
          >
            高股息避险
          </button>
          <button
            onClick={() => handleApplyPreset(['sw_elec', 'sw_computer', 'sw_telecom'])}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] transition-colors cursor-pointer"
          >
            科技算力
          </button>
          <button
            onClick={() => handleApplyPreset(['sw_foodbev', 'sw_homeappl', 'sw_pharma'])}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] transition-colors cursor-pointer"
          >
            大消费赛道
          </button>
          <button
            onClick={() => handleApplyPreset(['sw_realestate', 'sw_bank', 'sw_buildmat'])}
            className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[11px] transition-colors cursor-pointer"
          >
            破净/极低估组
          </button>
        </div>
      </div>

      {/* 3. Recharts Trend Chart Canvas */}
      <div className="mt-4 pt-1">
        <div className="w-full h-[360px] min-h-[360px] min-w-0 select-none">
          <ResponsiveContainer width="100%" height={360} minWidth={0} minHeight={360}>
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 35, left: 10, bottom: 5 }}
            >
              <defs>
                {/* 主选行业渐变 Area */}
                <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
                {/* 机会安全垫背景渐变 */}
                <linearGradient id="safetyBandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.06} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
                strokeOpacity={0.7}
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                tick={{ fontSize: 11, fill: '#64748b' }}
                dy={6}
              />

              <YAxis
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
                domain={metricMode === 'percentile' ? [0, 100] : ['auto', 'auto']}
                tickFormatter={(val: number) => metricMode === 'percentile' ? `${val}%` : `${val}x`}
                tick={{ fontSize: 11, fill: '#64748b' }}
                dx={-4}
              />

              {/* 百分比模式下的估值安全垫与风险警戒带 */}
              {metricMode === 'percentile' && showReferenceBands && (
                <>
                  {/* 0% ~ 30% 机会低估区域 */}
                  <ReferenceArea
                    y1={0}
                    y2={30}
                    fill="#10b981"
                    fillOpacity={0.05}
                  />
                  {/* 70% ~ 100% 高估风险区域 */}
                  <ReferenceArea
                    y1={70}
                    y2={100}
                    fill="#ef4444"
                    fillOpacity={0.04}
                  />
                  {/* 30% 机会安全线 */}
                  <ReferenceLine
                    y={30}
                    stroke="#10b981"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: '30% 低估安全线',
                      position: 'insideBottomRight',
                      fill: '#10b981',
                      fontSize: 10,
                      fontWeight: 600
                    }}
                  />
                  {/* 50% 历史中位线 */}
                  <ReferenceLine
                    y={50}
                    stroke="#94a3b8"
                    strokeDasharray="3 3"
                    strokeWidth={1}
                    label={{
                      value: '50% 历史中位',
                      position: 'insideTopRight',
                      fill: '#94a3b8',
                      fontSize: 10
                    }}
                  />
                  {/* 70% 风险警戒线 */}
                  <ReferenceLine
                    y={70}
                    stroke="#f43f5e"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    label={{
                      value: '70% 高估警戒线',
                      position: 'insideTopRight',
                      fill: '#f43f5e',
                      fontSize: 10,
                      fontWeight: 600
                    }}
                  />
                </>
              )}

              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload || !payload.length) return null;
                  return (
                    <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-xl text-xs space-y-2 min-w-[210px]">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <span>周期节点: {label}</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {metricMode === 'percentile' ? '市盈率历史百分位' : 'PE(TTM)估值'}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        {payload.map((item: any, idx: number) => {
                          const val = item.value;
                          return (
                            <div key={idx} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                  {item.name}
                                </span>
                              </div>
                              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                {metricMode === 'percentile' ? `${val}%` : `${val}x`}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }}
              />

              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
                iconType="circle"
              />

              {/* 主选行业 Area / Line (高亮加粗) */}
              <Area
                type="monotone"
                dataKey={`${selectedIndustry.id}_${metricMode}`}
                name={`${selectedIndustry.name} (主选)`}
                stroke="#4f46e5"
                strokeWidth={3}
                fill="url(#primaryAreaGrad)"
                activeDot={{ r: 6, stroke: '#ffffff', strokeWidth: 2 }}
              />

              {/* 对比行业 Line */}
              {comparisonIndustries.map((cItem, idx) => {
                const colorCfg = COMPARISON_COLORS[idx + 1] || COMPARISON_COLORS[1];
                return (
                  <Line
                    key={cItem.id}
                    type="monotone"
                    dataKey={`${cItem.id}_${metricMode}`}
                    name={cItem.name}
                    stroke={colorCfg.stroke}
                    strokeWidth={2}
                    strokeDasharray={idx === 1 ? '5 5' : undefined}
                    dot={{ r: 3, fill: colorCfg.stroke }}
                    activeDot={{ r: 5, stroke: '#ffffff', strokeWidth: 1.5 }}
                  />
                );
              })}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Bottom Quantitative Insights & Status Strip */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
        {/* 指标卡 1 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">当前主选行业估值位置</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 font-mono">
              {selectedIndustry.pePercentile.toFixed(1)}%
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${getValuationStatusBadgeStyle(selectedIndustry.status).tagClass}`}>
              {selectedIndustry.status}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">
            最新PE: {selectedIndustry.pe.toFixed(2)} (中位数: {selectedIndustry.historicalPeMedian.toFixed(2)})
          </div>
        </div>

        {/* 指标卡 2 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">全市场 31 个行业便宜度排位</div>
          <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1 font-mono">
            第 {industryRankInfo.rank} / 31 名
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
            比全市场 {industryRankInfo.cheaperThan}% 的行业更便宜
          </div>
        </div>

        {/* 指标卡 3 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
          <div className="text-[11px] text-slate-400 font-medium">对比行业估值利差</div>
          {comparisonIndustries.length > 0 ? (
            <div>
              <div className="text-lg font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
                {(selectedIndustry.pePercentile - comparisonIndustries[0].pePercentile).toFixed(1)}%
              </div>
              <div className="text-[10px] text-slate-400 mt-1 truncate">
                相较于【{comparisonIndustries[0].name}】
                {selectedIndustry.pePercentile <= comparisonIndustries[0].pePercentile ? '更低估安全' : '估值更高'}
              </div>
            </div>
          ) : (
            <div className="text-slate-400 mt-2 text-[11px]">未添加对比行业</div>
          )}
        </div>

        {/* 指标卡 4: AI 快速诊断入口 */}
        <div className="p-3 bg-gradient-to-br from-indigo-50/70 to-purple-50/70 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-xl border border-indigo-100/80 dark:border-indigo-900/40 flex flex-col justify-between">
          <div>
            <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>智能估值推演</span>
            </div>
            <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
              {selectedIndustry.description}
            </p>
          </div>
          {onOpenAIDiagnosis && (
            <button
              onClick={() => onOpenAIDiagnosis(`${selectedIndustry.name}市盈率历史百分位趋势研判`)}
              className="mt-2 w-full py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold text-center transition-colors cursor-pointer"
            >
              一键AI估值推演报告
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
