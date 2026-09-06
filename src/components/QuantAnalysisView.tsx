import React, { useState } from 'react';
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
  ArrowDownRight
} from 'lucide-react';
import { SectorFundFlow } from '../types/market';

interface QuantAnalysisViewProps {
  sectors: SectorFundFlow[];
  onSelectSectorByName?: (name: string) => void;
  onOpenAIDiagnosis?: (title?: string) => void;
}

export const QuantAnalysisView: React.FC<QuantAnalysisViewProps> = ({
  sectors,
  onSelectSectorByName,
  onOpenAIDiagnosis
}) => {
  const [selectedFactor, setSelectedFactor] = useState<string>('momentum');
  const [backtestPeriod, setBacktestPeriod] = useState<string>('20d');

  // Quant Alpha Signal Factors
  const factors = [
    { id: 'momentum', name: '动量突破因子 (Momentum)', weight: '35%', ic: '0.084', sharpe: '2.14', desc: '跟踪主力大单连续3日净流入且突破20日均线的强动量板块' },
    { id: 'smart_money', name: '聪明钱净买因子 (Smart Money)', weight: '25%', ic: '0.092', sharpe: '2.48', desc: '监测超大单与龙虎榜机构席位合力净买入比例' },
    { id: 'vol_price', name: '量价背离共振因子 (Vol-Price)', weight: '20%', ic: '0.071', sharpe: '1.89', desc: '识别底部放量换手、筹码高度集中未涨品种' },
    { id: 'sentiment_cycle', name: '情绪周期轮动因子 (Sentiment)', weight: '20%', ic: '0.065', sharpe: '1.75', desc: '基于涨停天梯与炸板率预判主线与补涨板块切换' },
  ];

  // Top Quant Picked Sectors
  const quantSignals = [
    {
      code: 'SEC01',
      name: '农林牧渔',
      score: 94.6,
      signal: '强力买入 (Strong Buy)',
      factorScores: { momentum: 96, smart_money: 92, vol_price: 95, sentiment: 94 },
      expectedAlpha: '+4.8%',
      winRate: '82.5%',
      riskLevel: '低风险'
    },
    {
      code: 'SEC02',
      name: '半导体芯片',
      score: 91.2,
      signal: '强力买入 (Strong Buy)',
      factorScores: { momentum: 94, smart_money: 95, vol_price: 88, sentiment: 89 },
      expectedAlpha: '+5.2%',
      winRate: '78.0%',
      riskLevel: '中风险'
    },
    {
      code: 'SEC03',
      name: 'AI算力与服务器',
      score: 89.8,
      signal: '买入 (Buy)',
      factorScores: { momentum: 95, smart_money: 90, vol_price: 84, sentiment: 91 },
      expectedAlpha: '+4.1%',
      winRate: '76.4%',
      riskLevel: '中高风险'
    },
    {
      code: 'SEC04',
      name: '种子与种植业',
      score: 87.5,
      signal: '买入 (Buy)',
      factorScores: { momentum: 89, smart_money: 88, vol_price: 90, sentiment: 83 },
      expectedAlpha: '+3.6%',
      winRate: '75.0%',
      riskLevel: '低风险'
    },
    {
      code: 'SEC05',
      name: '低空经济与eVTOL',
      score: 85.0,
      signal: '偏多 (Overweight)',
      factorScores: { momentum: 90, smart_money: 84, vol_price: 82, sentiment: 86 },
      expectedAlpha: '+3.2%',
      winRate: '71.8%',
      riskLevel: '中风险'
    },
    {
      code: 'SEC06',
      name: '电子化学品Ⅱ',
      score: 28.4,
      signal: '强力规避 (Strong Sell)',
      factorScores: { momentum: 18, smart_money: 22, vol_price: 35, sentiment: 32 },
      expectedAlpha: '-5.6%',
      winRate: '24.0%',
      riskLevel: '高风险'
    }
  ];

  return (
    <div id="quant-analysis-view" className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              多因子量化策略引擎
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                Alpha Signals v4.2
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              基于 496 个行业与概念板块的资金流、量价微观结构与筹码集中度进行多因子评分
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('多因子量化Alpha策略')}
          className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI 量化策略回测与归因</span>
        </button>
      </div>

      {/* 4 Multi-Factor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {factors.map((f) => {
          const isSel = selectedFactor === f.id;
          return (
            <div
              key={f.id}
              onClick={() => setSelectedFactor(f.id)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                isSel
                  ? 'bg-blue-50/70 border-blue-500 shadow-xs'
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
          <div className="flex items-center space-x-2">
            <Target className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold text-slate-800">量化选股/选板块综合评级榜</span>
          </div>

          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-500">回测周期:</span>
            <select
              value={backtestPeriod}
              onChange={(e) => setBacktestPeriod(e.target.value)}
              className="bg-white border border-slate-200 rounded px-2 py-0.5 font-medium cursor-pointer"
            >
              <option value="5d">近 5 个交易日</option>
              <option value="20d">近 20 个交易日 (月度)</option>
              <option value="60d">近 60 个交易日 (季度)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 font-semibold">
              <tr>
                <th className="py-2.5 px-3.5">综合排名</th>
                <th className="py-2.5 px-3">板块名称</th>
                <th className="py-2.5 px-3 text-center">量化综合分 (0-100)</th>
                <th className="py-2.5 px-3">策略评级</th>
                <th className="py-2.5 px-3 text-right">预期超额Alpha</th>
                <th className="py-2.5 px-3 text-right">历史胜率</th>
                <th className="py-2.5 px-3 text-center">风险评级</th>
                <th className="py-2.5 px-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {quantSignals.map((item, idx) => {
                const isBull = item.score >= 80;
                const isBear = item.score < 40;
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
                      {item.name}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="inline-flex items-center space-x-1.5">
                        <span className={`font-black text-sm ${isBull ? 'text-rose-600' : isBear ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {item.score}
                        </span>
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden hidden sm:inline-block">
                          <div
                            className={`h-full ${isBull ? 'bg-rose-500' : isBear ? 'bg-emerald-500' : 'bg-blue-500'}`}
                            style={{ width: `${item.score}%` }}
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
                        onClick={() => onSelectSectorByName && onSelectSectorByName(item.name)}
                        className="px-2.5 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 rounded text-xs transition-colors cursor-pointer"
                      >
                        穿透分析
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
