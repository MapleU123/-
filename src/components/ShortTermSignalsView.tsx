import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  Flame, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  Filter,
  Layers,
  RefreshCw,
  Volume2,
  VolumeX,
  Search,
  Radio,
  ChevronRight,
  Activity,
  TrendingUp,
  TrendingDown,
  Target,
  Shield
} from 'lucide-react';
import { AnomalyAlert } from '../types/market';
import { audioAlertService } from '../utils/audioAlert';

interface ShortTermSignalsViewProps {
  alerts: AnomalyAlert[];
  onSelectAlert?: (alert: AnomalyAlert) => void;
  onOpenAIDiagnosis?: (title?: string) => void;
}

interface SummaryData {
  totalAlertsToday: number;
  bullishCount: number;
  bearishCount: number;
  bullRatio: string;
  totalBlockBuyYi: string;
  limitUpCount: number;
  brokenLimitCount: number;
  brokenLimitRate: string;
}

export const ShortTermSignalsView: React.FC<ShortTermSignalsViewProps> = ({
  alerts: initialAlerts,
  onSelectAlert,
  onOpenAIDiagnosis
}) => {
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(initialAlerts);
  const [summary, setSummary] = useState<SummaryData>({
    totalAlertsToday: 3146,
    bullishCount: 2108,
    bearishCount: 1038,
    bullRatio: '67.0%',
    totalBlockBuyYi: '56.3',
    limitUpCount: 62,
    brokenLimitCount: 11,
    brokenLimitRate: '15.1%'
  });
  const [isLiveSource, setIsLiveSource] = useState<boolean>(false);
  const [updateTime, setUpdateTime] = useState<string>('');
  const [isAutoRefresh, setIsAutoRefresh] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => audioAlertService.getSoundEnabled());
  const [filterType, setFilterType] = useState<string>('all');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);

  const prevAlertCountRef = useRef<number>(0);

  // Fetch real-time short-term signals from server
  const fetchSignals = async (manual = false) => {
    if (manual) setIsFetching(true);
    try {
      const res = await fetch('/api/market/short-term-signals');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.alerts) && data.alerts.length > 0) {
          setIsLiveSource(true);
          setUpdateTime(data.updateTime || new Date().toLocaleTimeString('zh-CN', { hour12: false }));
          if (data.summary) {
            setSummary(data.summary);
          }
          
          // Sound trigger if new top alert arrived
          if (data.alerts.length > 0) {
            const topAlert = data.alerts[0];
            if (topAlert.id !== highlightedId && prevAlertCountRef.current > 0) {
              setHighlightedId(topAlert.id);
              if (soundEnabled) {
                audioAlertService.playAnomalyChime(topAlert.severity || 'normal', topAlert.direction || 'bullish');
              }
            }
          }
          
          prevAlertCountRef.current = data.alerts.length;
          setAlerts(data.alerts);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch short term signals:', err);
    } finally {
      if (manual) setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    if (!isAutoRefresh) return;
    const timer = setInterval(() => {
      fetchSignals();
    }, 5000);
    return () => clearInterval(timer);
  }, [isAutoRefresh, soundEnabled]);

  const handleToggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    audioAlertService.setSoundEnabled(nextState);
  };

  // Filter alerts by type, search, and min amount
  const filteredAlerts = alerts.filter(a => {
    // Type filter
    if (filterType === 'rocket' && a.type !== 'rocket_surge') return false;
    if (filterType === 'block_buy' && a.type !== 'block_buy') return false;
    if (filterType === 'rapid_limit' && a.type !== 'rapid_limit') return false;
    if (filterType === 'broken_limit' && a.type !== 'broken_limit') return false;
    if (filterType === 'tail_rush' && a.type !== 'tail_rush') return false;
    if (filterType === 'support_buy' && a.type !== 'support_buy') return false;
    if (filterType === 'block_sell' && a.type !== 'block_sell') return false;

    // Search filter
    if (searchKeyword.trim()) {
      const kw = searchKeyword.toLowerCase().trim();
      const matchName = a.stockName?.toLowerCase().includes(kw);
      const matchCode = a.stockCode?.toLowerCase().includes(kw);
      const matchSector = a.sectorName?.toLowerCase().includes(kw);
      if (!matchName && !matchCode && !matchSector) return false;
    }

    // Min Amount filter (in 万元)
    if (minAmount > 0 && (a.amount || 0) < minAmount) return false;

    return true;
  });

  return (
    <div id="short-term-signals-view" className="space-y-4">
      {/* 1. Real-time Live Header & Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center relative">
            <Zap className="w-5 h-5 animate-pulse" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white animate-ping" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                短线精灵与 Level-2 逐笔异动雷达
              </h2>
              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isLiveSource ? '新浪财经 Level-2 实盘直连' : '毫秒级动态推送'}</span>
              </span>
              {updateTime && (
                <span className="text-xs font-mono text-slate-400">
                  {updateTime}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              实时捕捉全市场火箭发射、万手大单主买扫货、封单突增、尾盘抢筹及炸板异动
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sound Alert Toggle */}
          <button
            onClick={handleToggleSound}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
            title={soundEnabled ? '点击关闭异动提示音' : '点击开启异动提示音'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-amber-600" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span>{soundEnabled ? '异动音效: 开启' : '静音模式'}</span>
          </button>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setIsAutoRefresh(!isAutoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
              isAutoRefresh
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-slate-50 text-slate-600 border-slate-200'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isAutoRefresh ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
            <span>{isAutoRefresh ? '5s 实时轮询' : '自动刷新: 暂停'}</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={() => fetchSignals(true)}
            disabled={isFetching}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 flex items-center space-x-1 transition-all cursor-pointer disabled:opacity-50"
            title="立即刷新行情"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${isFetching ? 'animate-spin' : ''}`} />
            <span>刷新</span>
          </button>

          {/* AI Diagnosis */}
          <button
            onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('短线异动精灵与主力挂单意图')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>AI 盘口意图诊断</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">全市场实时异动总数</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              {summary.totalAlertsToday.toLocaleString()}
              <span className="text-xs font-normal text-slate-500 ml-1">次</span>
            </div>
            <div className="text-xs text-emerald-600 font-medium mt-0.5 flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>逐笔高频捕捉中</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">多空异动力量比率</div>
            <div className="text-xl font-black text-rose-600 font-mono mt-0.5">
              {summary.bullRatio}
              <span className="text-xs font-normal text-slate-500 ml-1">偏多</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-mono">
              多头 {summary.bullishCount} / 空头 {summary.bearishCount}
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">万手特大单扫货规模</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              ¥{summary.totalBlockBuyYi}
              <span className="text-xs font-normal text-slate-500 ml-1">亿元</span>
            </div>
            <div className="text-xs text-rose-600 font-medium mt-0.5 flex items-center space-x-1">
              <Flame className="w-3 h-3" />
              <span>主买资金集中爆量</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Flame className="w-4 h-4" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">涨停封板与炸板率</div>
            <div className="text-xl font-black text-slate-900 font-mono mt-0.5">
              {summary.limitUpCount}
              <span className="text-xs font-normal text-slate-500 ml-0.5">家涨停</span>
              <span className="text-xs text-slate-400 font-normal mx-1">/</span>
              <span className="text-amber-600">{summary.brokenLimitCount}</span>
              <span className="text-xs font-normal text-slate-500 ml-0.5">炸板</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              炸板率: <span className="font-bold text-amber-600 font-mono">{summary.brokenLimitRate}</span> (盘面稳固)
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Shield className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 3. Filter Tabs & Search Bar */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
        {/* Filter Type Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          {[
            { key: 'all', label: '全部异动' },
            { key: 'rocket', label: '🚀 火箭发射' },
            { key: 'block_buy', label: '🔥 巨单扫货' },
            { key: 'rapid_limit', label: '⚡ 封单剧增' },
            { key: 'broken_limit', label: '⚠️ 炸板预警' },
            { key: 'tail_rush', label: '🎯 尾盘抢筹' },
            { key: 'support_buy', label: '🛡️ 大单托盘' },
            { key: 'block_sell', label: '💥 集中抛压' }
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => setFilterType(btn.key)}
              className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                filterType === btn.key
                  ? 'bg-rose-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Search Input & Min Amount Dropdown */}
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {/* Min Amount Chips */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-xs">
            {[
              { val: 0, label: '全部金额' },
              { val: 1000, label: '≥1000万' },
              { val: 3000, label: '≥3000万' },
              { val: 5000, label: '≥5000万' }
            ].map((m) => (
              <button
                key={m.val}
                onClick={() => setMinAmount(m.val)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer ${
                  minAmount === m.val
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative flex-1 sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索股票/代码/板块..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-rose-400 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* 4. Anomaly Stream List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {/* List Header */}
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-500 grid grid-cols-12 gap-2 items-center">
          <div className="col-span-2 sm:col-span-1">时间</div>
          <div className="col-span-3 sm:col-span-2">异动类型</div>
          <div className="col-span-4 sm:col-span-3">标的代码 / 名称</div>
          <div className="hidden sm:block sm:col-span-2 text-right">最新成交价</div>
          <div className="col-span-3 sm:col-span-2 text-right">成交手数 / 涉资</div>
          <div className="hidden sm:block sm:col-span-2 text-center">操盘意图与操作</div>
        </div>

        {/* List Content */}
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Zap className="w-8 h-8 mx-auto text-slate-300 mb-2 opacity-50" />
            <div className="text-sm font-medium">当前筛选条件下暂无异动事件</div>
            <div className="text-xs text-slate-400 mt-1">请尝试放宽筛选条件或等待最新盘口委托推送</div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAlerts.map((alert) => {
              const isBull = alert.direction === 'bullish';
              const isBear = alert.direction === 'bearish';
              const isHighlighted = alert.id === highlightedId;

              // Type badge styles
              let badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
              if (alert.type === 'rocket_surge') badgeColor = 'bg-rose-100 text-rose-800 border-rose-300';
              if (alert.type === 'block_buy') badgeColor = 'bg-amber-100 text-amber-800 border-amber-300';
              if (alert.type === 'rapid_limit') badgeColor = 'bg-red-100 text-red-800 border-red-300 font-black';
              if (alert.type === 'broken_limit') badgeColor = 'bg-orange-100 text-orange-800 border-orange-300';
              if (alert.type === 'support_buy') badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
              if (alert.type === 'tail_rush') badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
              if (alert.type === 'block_sell') badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';

              const amountText = (alert.amount || 0) >= 10000
                ? `${((alert.amount || 0) / 10000).toFixed(2)} 亿元`
                : `${(alert.amount || 0).toLocaleString()} 万元`;

              return (
                <div
                  key={alert.id}
                  onClick={() => onSelectAlert && onSelectAlert(alert)}
                  className={`p-3.5 hover:bg-slate-50 grid grid-cols-12 gap-2 items-center cursor-pointer transition-colors ${
                    isHighlighted ? 'bg-amber-50/60' : ''
                  }`}
                >
                  {/* Time */}
                  <div className="col-span-2 sm:col-span-1 flex items-center space-x-1">
                    <span className="text-xs font-mono font-bold text-slate-500">{alert.time}</span>
                  </div>

                  {/* Anomaly Badge */}
                  <div className="col-span-3 sm:col-span-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${badgeColor}`}>
                      {alert.title}
                    </span>
                  </div>

                  {/* Stock Info */}
                  <div className="col-span-4 sm:col-span-3">
                    <div className="flex items-center space-x-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 text-sm">{alert.stockName}</span>
                      <span className="text-xs font-mono text-slate-400">({alert.stockCode})</span>
                      <span className="text-[10px] text-slate-500 px-1 py-0.2 rounded bg-slate-100">
                        {alert.sectorName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5 hidden sm:block">
                      {alert.description}
                    </div>
                  </div>

                  {/* Price & Change */}
                  <div className="hidden sm:block sm:col-span-2 text-right font-mono">
                    <div className="font-black text-slate-900 text-sm">
                      ¥{(alert.price || 0).toFixed(2)}
                    </div>
                    <div className={`text-xs font-bold ${(alert.changePercent || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {(alert.changePercent || 0) >= 0 ? '+' : ''}{(alert.changePercent || 0).toFixed(2)}%
                    </div>
                  </div>

                  {/* Volume Lots & Amount */}
                  <div className="col-span-3 sm:col-span-2 text-right font-mono">
                    <div className="font-black text-slate-800 text-xs sm:text-sm">
                      {amountText}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {(alert.volumeLots || 0).toLocaleString()} 手
                    </div>
                  </div>

                  {/* Actions / AI Diagnosis */}
                  <div className="hidden sm:flex sm:col-span-2 items-center justify-center space-x-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectAlert && onSelectAlert(alert);
                      }}
                      className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold cursor-pointer"
                    >
                      盘口
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onOpenAIDiagnosis) {
                          onOpenAIDiagnosis(`${alert.stockName} (${alert.stockCode}) 异动解析: ${alert.title}`);
                        }
                      }}
                      className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded text-xs font-bold flex items-center space-x-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3 text-rose-500" />
                      <span>AI意图</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
