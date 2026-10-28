import React, { useState, useEffect, useCallback } from 'react';
import { 
  TrendingUp, 
  Layers, 
  BrainCircuit, 
  Activity, 
  Sliders, 
  Zap, 
  ChevronRight, 
  Target, 
  BarChart, 
  Sparkles,
  PieChart as PieIcon,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Clock,
  Radio,
  SlidersHorizontal,
  Flame,
  CheckCircle2
} from 'lucide-react';
import { SectorFundFlow } from '../types/market';

interface QuantStock {
  code: string;
  name: string;
  sectorName: string;
  price: number;
  changePercent: number;
  turnover: number;
  mainNetInflow: number;
  compositeScore: number;
  signal: string;
  riskLevel: string;
  expectedAlpha: string;
  winRate: string;
  factorScores: {
    momentum: number;
    smartMoney: number;
    volPrice: number;
    sentiment: number;
  };
}

interface QuantSector {
  id: string;
  name: string;
  changePercent: number;
  mainNetInflow: number;
  leadStock: {
    code: string;
    name: string;
    price: number;
    changePercent: number;
  };
  score: number;
  signal: string;
  expectedAlpha: string;
  winRate: string;
  riskLevel: string;
  factorScores: {
    momentum: number;
    smartMoney: number;
    volPrice: number;
    sentiment: number;
  };
}

interface QuantAnalysisViewProps {
  sectors: SectorFundFlow[];
  onSelectSectorByName?: (name: string) => void;
  onSelectStockByName?: (name: string) => void;
  onOpenAIDiagnosis?: (title?: string) => void;
}

export const QuantAnalysisView: React.FC<QuantAnalysisViewProps> = ({
  sectors,
  onSelectSectorByName,
  onSelectStockByName,
  onOpenAIDiagnosis
}) => {
  const [activeTab, setActiveTab] = useState<'stocks' | 'sectors'>('stocks');
  const [selectedFactor, setSelectedFactor] = useState<string>('all');
  const [backtestPeriod, setBacktestPeriod] = useState<string>('20d');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastUpdated, setLastUpdated] = useState<string>('--:--:--');
  const [dataSource, setDataSource] = useState<string>('多因子量化Alpha策略引擎 (毫秒级行情实时驱动)');

  const [quantStocks, setQuantStocks] = useState<QuantStock[]>([]);
  const [quantSectors, setQuantSectors] = useState<QuantSector[]>([]);

  // Fetch real-time quant signals
  const fetchQuantData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/market/quant-realtime');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        if (data.quantStocks && data.quantStocks.length > 0) {
          setQuantStocks(data.quantStocks);
        }
        if (data.quantSectors && data.quantSectors.length > 0) {
          setQuantSectors(data.quantSectors);
        }
        if (data.updateTime) setLastUpdated(data.updateTime);
        if (data.source) setDataSource(data.source);
      }
    } catch (err) {
      console.warn('Fetch quant real-time data failed:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchQuantData();
  }, [fetchQuantData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchQuantData();
    }, 10000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchQuantData]);

  // Quant Alpha Signal Factor definitions
  const factors = [
    { id: 'momentum', name: '动量突破因子 (Momentum)', weight: '35%', ic: '0.084', sharpe: '2.14', desc: '跟踪主力大单连续净流入且突破短中期均线压力的强动量标的' },
    { id: 'smart_money', name: '聪明钱净买因子 (Smart Money)', weight: '25%', ic: '0.092', sharpe: '2.48', desc: '监测机构大单、龙虎榜知名席位合力主买吸筹比例' },
    { id: 'vol_price', name: '量价背离共振因子 (Vol-Price)', weight: '20%', ic: '0.071', sharpe: '1.89', desc: '识别关键支撑位密集换手放量、主力洗盘完毕蓄势爆发品种' },
    { id: 'sentiment_cycle', name: '情绪周期轮动因子 (Sentiment)', weight: '20%', ic: '0.065', sharpe: '1.75', desc: '基于全市场连板晋级率、炸板率与板块轮动梯队预判主线' },
  ];

  // Filter stocks by factor if active
  let displayStocks = [...quantStocks];
  if (selectedFactor === 'momentum') {
    displayStocks.sort((a, b) => b.factorScores.momentum - a.factorScores.momentum);
  } else if (selectedFactor === 'smart_money') {
    displayStocks.sort((a, b) => b.factorScores.smartMoney - a.factorScores.smartMoney);
  } else if (selectedFactor === 'vol_price') {
    displayStocks.sort((a, b) => b.factorScores.volPrice - a.factorScores.volPrice);
  } else if (selectedFactor === 'sentiment_cycle') {
    displayStocks.sort((a, b) => b.factorScores.sentiment - a.factorScores.sentiment);
  }

  let displaySectors = [...quantSectors];
  if (selectedFactor === 'momentum') {
    displaySectors.sort((a, b) => b.factorScores.momentum - a.factorScores.momentum);
  } else if (selectedFactor === 'smart_money') {
    displaySectors.sort((a, b) => b.factorScores.smartMoney - a.factorScores.smartMoney);
  } else if (selectedFactor === 'vol_price') {
    displaySectors.sort((a, b) => b.factorScores.volPrice - a.factorScores.volPrice);
  } else if (selectedFactor === 'sentiment_cycle') {
    displaySectors.sort((a, b) => b.factorScores.sentiment - a.factorScores.sentiment);
  }

  return (
    <div id="quant-analysis-view" className="space-y-4">
      {/* Top Banner with Real-time Status */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                多因子量化选股与Alpha策略引擎
              </h2>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1">
                <Radio className="w-2.5 h-2.5 text-emerald-500 animate-pulse" />
                实盘极速计算
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                Alpha v4.6
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {dataSource} · 实时盘口数据驱动 · 最近刷新：{lastUpdated}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
              autoRefresh 
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-semibold' 
                : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {autoRefresh ? '自动刷新 (10s)' : '已暂停'}
          </button>

          <button
            onClick={() => fetchQuantData(true)}
            disabled={refreshing}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            title="手动刷新"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('多因子量化Alpha策略')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI 量化归因与调仓建议</span>
          </button>
        </div>
      </div>

      {/* 4 Multi-Factor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {factors.map((f) => {
          const isSel = selectedFactor === f.id;
          return (
            <div
              key={f.id}
              onClick={() => setSelectedFactor(selectedFactor === f.id ? 'all' : f.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSel
                  ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-400'
                  : 'bg-white border-slate-200/80 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900">{f.name.split(' ')[0]}</span>
                <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[11px]">
                  权重 {f.weight}
                </span>
              </div>
              <p className="text-[11.5px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                {f.desc}
              </p>
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500">因子IC: <strong className="text-blue-600">{f.ic}</strong></span>
                <span className="text-slate-500">夏普比率: <strong className="text-emerald-600">{f.sharpe}</strong></span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Quant Signals Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="flex bg-slate-200/70 p-0.5 rounded-lg">
              <button
                onClick={() => setActiveTab('stocks')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'stocks'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                🎯 策略优选个股榜 ({displayStocks.length})
              </button>
              <button
                onClick={() => setActiveTab('sectors')}
                className={`px-3 py-1 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  activeTab === 'sectors'
                    ? 'bg-white text-blue-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📊 策略优选板块榜 ({displaySectors.length})
              </button>
            </div>

            {selectedFactor !== 'all' && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                <span>过滤因子: {factors.find(f => f.id === selectedFactor)?.name.split(' ')[0]}</span>
                <button onClick={() => setSelectedFactor('all')} className="hover:font-bold ml-1">×</button>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">回测基准周期:</span>
            <select
              value={backtestPeriod}
              onChange={(e) => setBacktestPeriod(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-0.5 font-medium cursor-pointer"
            >
              <option value="5d">近 5 个交易日 (高频超短)</option>
              <option value="20d">近 20 个交易日 (月度主升)</option>
              <option value="60d">近 60 个交易日 (季度波段)</option>
            </select>
          </div>
        </div>

        {/* View 1: Quant Stocks Table */}
        {activeTab === 'stocks' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5">排名</th>
                  <th className="py-2.5 px-3">代码 / 名称</th>
                  <th className="py-2.5 px-3">所属主线板块</th>
                  <th className="py-2.5 px-3 text-right">最新价 (实时)</th>
                  <th className="py-2.5 px-3 text-right">今日涨跌幅</th>
                  <th className="py-2.5 px-3 text-right">成交额</th>
                  <th className="py-2.5 px-3 text-center">量化综合分</th>
                  <th className="py-2.5 px-3">Alpha评级</th>
                  <th className="py-2.5 px-3 text-right">预期超额收益</th>
                  <th className="py-2.5 px-3 text-right">策略胜率</th>
                  <th className="py-2.5 px-3 text-center">风险评级</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {displayStocks.map((item, idx) => {
                  const isUp = item.changePercent >= 0;
                  const isBull = item.compositeScore >= 80;
                  const isBear = item.compositeScore < 45;
                  return (
                    <tr
                      key={item.code}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3.5 font-sans font-bold">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                          idx === 0 ? 'bg-amber-400 text-white font-black' :
                          idx === 1 ? 'bg-slate-300 text-slate-800 font-bold' :
                          idx === 2 ? 'bg-amber-700 text-white font-bold' : 'text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans font-bold text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span>{item.name}</span>
                          <span className="text-slate-400 font-normal font-mono text-[11px]">{item.code}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-sans text-slate-600">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                          {item.sectorName}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">
                        ¥{item.price.toFixed(2)}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isUp ? `+${item.changePercent.toFixed(2)}%` : `${item.changePercent.toFixed(2)}%`}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-medium">
                        {item.turnover} 亿
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center space-x-1.5">
                          <span className={`font-black text-sm ${isBull ? 'text-rose-600' : isBear ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {item.compositeScore}
                          </span>
                          <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:inline-block">
                            <div
                              className={`h-full ${isBull ? 'bg-rose-500' : isBear ? 'bg-emerald-500' : 'bg-blue-500'}`}
                              style={{ width: `${item.compositeScore}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isBull ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          isBear ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {item.signal}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${item.expectedAlpha.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {item.expectedAlpha}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-semibold">
                        {item.winRate}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium ${
                          item.riskLevel === '高风险' ? 'bg-rose-100 text-rose-800' :
                          item.riskLevel === '中风险' || item.riskLevel === '中高风险' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={() => onSelectStockByName && onSelectStockByName(item.name)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                        >
                          盘口分析
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* View 2: Quant Sectors Table */}
        {activeTab === 'sectors' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 font-semibold">
                <tr>
                  <th className="py-2.5 px-3.5">排名</th>
                  <th className="py-2.5 px-3">板块名称</th>
                  <th className="py-2.5 px-3 text-right">板块涨跌幅</th>
                  <th className="py-2.5 px-3 text-right">主力净流入</th>
                  <th className="py-2.5 px-3">领涨标的 (实时)</th>
                  <th className="py-2.5 px-3 text-center">量化评分</th>
                  <th className="py-2.5 px-3">策略评级</th>
                  <th className="py-2.5 px-3 text-right">预期Alpha</th>
                  <th className="py-2.5 px-3 text-right">历史胜率</th>
                  <th className="py-2.5 px-3 text-center">风险评级</th>
                  <th className="py-2.5 px-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {displaySectors.map((item, idx) => {
                  const isUp = item.changePercent >= 0;
                  const isBull = item.score >= 70;
                  const isBear = item.score < 45;
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-3.5 font-sans font-bold">
                        <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs ${
                          idx === 0 ? 'bg-amber-400 text-white font-black' :
                          idx === 1 ? 'bg-slate-300 text-slate-800 font-bold' :
                          idx === 2 ? 'bg-amber-700 text-white font-bold' : 'text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans font-bold text-slate-900">
                        {item.name}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {isUp ? `+${item.changePercent.toFixed(2)}%` : `${item.changePercent.toFixed(2)}%`}
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${item.mainNetInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {item.mainNetInflow >= 0 ? `+${item.mainNetInflow.toFixed(2)} 亿` : `${item.mainNetInflow.toFixed(2)} 亿`}
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-900">{item.leadStock.name}</span>
                          <span className={`text-[11px] font-mono font-bold ${item.leadStock.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {item.leadStock.changePercent >= 0 ? `+${item.leadStock.changePercent.toFixed(2)}%` : `${item.leadStock.changePercent.toFixed(2)}%`}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-black text-sm ${isBull ? 'text-rose-600' : isBear ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {item.score}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          isBull ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          isBear ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {item.signal}
                        </span>
                      </td>
                      <td className={`py-3 px-3 text-right font-bold ${item.expectedAlpha.startsWith('+') ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {item.expectedAlpha}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-700 font-semibold">
                        {item.winRate}
                      </td>
                      <td className="py-3 px-3 text-center font-sans">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-medium ${
                          item.riskLevel === '高风险' ? 'bg-rose-100 text-rose-800' :
                          item.riskLevel === '中风险' || item.riskLevel === '中高风险' ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <button
                          onClick={() => onSelectSectorByName && onSelectSectorByName(item.name)}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                        >
                          穿透资金
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
