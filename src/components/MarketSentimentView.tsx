import React from 'react';
import { 
  Flame, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Layers, 
  Activity, 
  ShieldAlert, 
  Zap,
  Target,
  BarChart2
} from 'lucide-react';
import { MarketBreadth, SectorFundFlow } from '../types/market';

interface MarketSentimentViewProps {
  breadth: MarketBreadth;
  sectors: SectorFundFlow[];
  onOpenAIDiagnosis?: (title?: string) => void;
}

export const MarketSentimentView: React.FC<MarketSentimentViewProps> = ({
  breadth,
  sectors,
  onOpenAIDiagnosis
}) => {
  const totalStocks = ((breadth?.upCount || 0) + (breadth?.downCount || 0) + (breadth?.flatCount || 0)) || 5200;
  const upPercent = (((breadth?.upCount || 0) / totalStocks) * 100).toFixed(1);
  const downPercent = (((breadth?.downCount || 0) / totalStocks) * 100).toFixed(1);

  // Ladder boards
  const ladderData = [
    { board: '7连板及以上 (空间龙头)', count: breadth?.ladder?.limit7Plus?.count ?? 2, stocks: breadth?.ladder?.limit7Plus?.stocks ?? ['中信海直 (7连板)', '华中数控 (7连板)'] },
    { board: '5-6连板 (核心中军)', count: breadth?.ladder?.limit5To6?.count ?? 4, stocks: breadth?.ladder?.limit5To6?.stocks ?? ['新宙邦 (6连板)', '新易盛 (5连板)'] },
    { board: '3-4连板 (主线接力)', count: breadth?.ladder?.limit3To4?.count ?? 9, stocks: breadth?.ladder?.limit3To4?.stocks ?? ['中际旭创', '隆平高科', '丰乐种业'] },
    { board: '2连板 (启动晋级)', count: breadth?.ladder?.limit2?.count ?? 18, stocks: breadth?.ladder?.limit2?.stocks ?? ['中微公司', '海光信息', '万丰奥威'] },
    { board: '首板涨停 (底部爆发)', count: breadth?.ladder?.firstLimit?.count ?? 43, stocks: breadth?.ladder?.firstLimit?.stocks ?? ['小商品城', '荃银高科', '紫金矿业等43家'] },
  ];

  return (
    <div id="market-sentiment-view" className="space-y-4">
      {/* Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              全市场情绪温度罗盘与连板天梯
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                {breadth?.sentimentLabel || '情绪活跃'} ({breadth?.sentimentScore ?? 68}分)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              深度复盘涨跌家数比、首板及高标连板高度、昨日涨停溢价率及炸板率
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('今日大盘情绪周期与打板连板接力分析')}
          className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI 情绪周期拐点预测</span>
        </button>
      </div>

      {/* 4 Key Sentiment Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-sans">涨停家数 (封板硬度)</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{breadth?.limitUpCount ?? 76} 家</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-sans">跌停家数</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{breadth?.limitDownCount ?? 8} 家</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-sans">炸板率</div>
          <div className="text-2xl font-black text-amber-500 mt-1">{(breadth?.brokenLimitRate || 15.5).toFixed(1)}%</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-sans">昨日涨停今日平均溢价</div>
          <div className="text-2xl font-black text-rose-600 mt-1">+3.84%</div>
        </div>
      </div>

      {/* Up/Down Distribution Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
          <span className="text-rose-600 font-bold">上涨 {breadth?.upCount ?? 3126} 家 ({upPercent}%)</span>
          <span className="text-slate-400">平盘 {breadth?.flatCount ?? 168} 家</span>
          <span className="text-emerald-600 font-bold">下跌 {breadth?.downCount ?? 2029} 家 ({downPercent}%)</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden flex bg-slate-100">
          <div className="bg-rose-500 transition-all duration-500" style={{ width: `${upPercent}%` }} />
          <div className="bg-slate-300" style={{ width: `${(((breadth?.flatCount || 0) / totalStocks) * 100).toFixed(1)}%` }} />
          <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${downPercent}%` }} />
        </div>
      </div>

      {/* Limit Up Ladder Cards */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-600" />
          连板高度天梯图 (梯队晋级效应)
        </h3>

        <div className="space-y-2">
          {ladderData.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2"
            >
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-mono font-black text-xs flex items-center justify-center">
                  {5 - idx}
                </span>
                <span className="text-xs font-bold text-slate-900">{item.board}</span>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full font-mono text-xs font-bold">
                  {item.count} 家
                </span>
              </div>

              <div className="flex flex-wrap gap-1 text-xs">
                {item.stocks.map((stk, sIdx) => (
                  <span key={sIdx} className="px-2 py-0.5 bg-white border border-slate-200 rounded font-medium text-slate-700">
                    {stk}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
