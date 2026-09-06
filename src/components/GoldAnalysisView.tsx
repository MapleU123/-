import React, { useState } from 'react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Globe,
  Layers
} from 'lucide-react';

interface GoldAnalysisViewProps {
  onOpenAIDiagnosis?: (title?: string) => void;
  onSelectStockByName?: (name: string) => void;
}

export const GoldAnalysisView: React.FC<GoldAnalysisViewProps> = ({
  onOpenAIDiagnosis,
  onSelectStockByName
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'realtime' | 'mining_stocks' | 'macro'>('realtime');

  // Gold Benchmark Prices
  const goldBenchmarks = [
    { name: '上海金 AU9999', price: '685.40', unit: '元/克', change: '+5.80', changePct: '+0.85%', isUp: true, turnover: '38.5 亿' },
    { name: '伦敦现货黄金 XAU/USD', price: '2,895.50', unit: '美元/盎司', change: '+22.40', changePct: '+0.78%', isUp: true, turnover: '$124 亿' },
    { name: 'COMEX 黄金期货主力', price: '2,920.80', unit: '美元/盎司', change: '+24.10', changePct: '+0.83%', isUp: true, turnover: '$98 亿' },
    { name: '美债10年期实际收益率(TIPS)', price: '1.68%', unit: '基点', change: '-4.2 bp', changePct: '-2.44%', isUp: false, turnover: '避险推升金价' },
  ];

  // Gold Mining A-Shares
  const goldStocks = [
    { code: '601899', name: '紫金矿业', price: '18.20', changePct: '+2.10%', inflow: '+2.60 亿', goldOutput: '68 吨/年', pe: '14.5', desc: '全球铜金矿龙头，黄金开采成本低，抗通胀属性极强' },
    { code: '600547', name: '山东黄金', price: '32.80', changePct: '+3.45%', inflow: '+1.95 亿', goldOutput: '42 吨/年', pe: '22.8', desc: '纯正黄金开采标的，金价弹性系数高达 1.85' },
    { code: '600489', name: '中金黄金', price: '15.60', changePct: '+2.80%', inflow: '+1.40 亿', goldOutput: '28 吨/年', pe: '16.2', desc: '央企黄金龙头，资源储备雄厚，高股息分红' },
    { code: '600988', name: '赤峰黄金', price: '21.40', changePct: '+4.20%', inflow: '+1.15 亿', goldOutput: '16 吨/年', pe: '18.4', desc: '海外高品位金矿扩张迅速，单位克金克利持续上升' },
    { code: '000975', name: '银泰黄金', price: '19.80', changePct: '+2.65%', inflow: '+0.95 亿', goldOutput: '10 吨/年', pe: '17.1', desc: '国内优质高品位金矿，现金流充沛且低负债' },
  ];

  return (
    <div id="gold-analysis-view" className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-4.5 rounded-xl text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-amber-100">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-tight">黄金与贵金属宏观量化分析</h2>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold">
                现货 / 期货 / A股金矿联动
              </span>
            </div>
            <p className="text-xs text-amber-100 mt-1">
              实时跟踪上海金 AU9999、国际现货黄金 XAU、美债实际利率(TIPS)及 A 股黄金采选板块资金流向
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('全球黄金价格周期与A股金矿配置策略')}
          className="px-4 py-2 bg-white text-amber-700 hover:bg-amber-50 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>AI 黄金配置与对冲策略</span>
        </button>
      </div>

      {/* 4 Gold Benchmarks Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {goldBenchmarks.map((b, i) => (
          <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>{b.name}</span>
              <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded font-mono">{b.unit}</span>
            </div>
            <div className="mt-2 font-mono">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{b.price}</div>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-xs font-bold flex items-center ${b.isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {b.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {b.change} ({b.changePct})
                </span>
                <span className="text-[11px] text-slate-400">成交/状态: {b.turnover}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gold Mining Equities Leaderboard */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>A股黄金采选核心龙头资产池</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">金价上涨核心受益标的 (单位: 亿元)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 font-semibold">
              <tr>
                <th className="py-2.5 px-3.5">股票代码</th>
                <th className="py-2.5 px-3">股票名称</th>
                <th className="py-2.5 px-3 text-right">实时现价</th>
                <th className="py-2.5 px-3 text-right">今日涨跌幅</th>
                <th className="py-2.5 px-3 text-right">主力净流入</th>
                <th className="py-2.5 px-3 text-right">年黄金产量</th>
                <th className="py-2.5 px-3 text-right">动态市盈率</th>
                <th className="py-2.5 px-3">核心投资亮点</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {goldStocks.map((stock) => (
                <tr key={stock.code} className="hover:bg-amber-50/40 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-slate-500">{stock.code}</td>
                  <td className="py-3 px-3 font-sans font-bold text-slate-900">{stock.name}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">¥{stock.price}</td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">{stock.changePct}</td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">{stock.inflow}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{stock.goldOutput}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{stock.pe}</td>
                  <td className="py-3 px-3 font-sans text-slate-600 text-[11.5px] max-w-xs truncate">{stock.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
