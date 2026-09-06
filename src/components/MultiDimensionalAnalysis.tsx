import React, { useState } from 'react';
import { MarketBreadth, NorthboundFlow, SectorFundFlow } from '../types/market';
import { 
  BarChart2, 
  TrendingUp, 
  TrendingDown, 
  Compass, 
  Globe, 
  Flame, 
  Layers, 
  Award,
  Zap,
  ArrowRight
} from 'lucide-react';

interface MultiDimensionalAnalysisProps {
  breadth: MarketBreadth;
  northbound: NorthboundFlow;
  sectors: SectorFundFlow[];
  onSelectSectorByName?: (name: string) => void;
}

export const MultiDimensionalAnalysis: React.FC<MultiDimensionalAnalysisProps> = ({
  breadth,
  northbound,
  sectors,
  onSelectSectorByName
}) => {
  const [activeTab, setActiveTab] = useState<'sentiment' | 'northbound' | 'capital_structure'>('sentiment');

  const totalStocks = ((breadth?.upCount || 0) + (breadth?.downCount || 0) + (breadth?.flatCount || 0)) || 5200;
  const upPercent = (((breadth?.upCount || 0) / totalStocks) * 100).toFixed(1);
  const downPercent = (((breadth?.downCount || 0) / totalStocks) * 100).toFixed(1);

  // Compute Total Main Inflows from sectors
  const totalSuperLarge = sectors.reduce((acc, s) => acc + s.superLargeInflow, 0);
  const totalLarge = sectors.reduce((acc, s) => acc + s.largeInflow, 0);
  const totalMedium = sectors.reduce((acc, s) => acc + s.mediumInflow, 0);
  const totalSmall = sectors.reduce((acc, s) => acc + s.smallInflow, 0);

  return (
    <div id="multidimensional-analysis-module" className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 shadow-xl">
      {/* Tab Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-slate-950/80 border border-slate-800">
          <button
            id="tab-market-sentiment"
            onClick={() => setActiveTab('sentiment')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'sentiment'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>市场情绪与连板天梯</span>
          </button>

          <button
            id="tab-northbound-flow"
            onClick={() => setActiveTab('northbound')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'northbound'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>北向与陆股通资金</span>
          </button>

          <button
            id="tab-capital-structure"
            onClick={() => setActiveTab('capital_structure')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'capital_structure'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>全市场四维资金博弈</span>
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          两市总成交额: {(breadth?.totalTurnoverAll || 25443).toFixed(1)} 亿 (放量 +{(breadth?.turnoverDiffYesterday || 2130).toFixed(0)}亿)
        </span>
      </div>

      {/* TAB 1: MARKET SENTIMENT & LIMIT-UP LADDER */}
      {activeTab === 'sentiment' && (
        <div className="mt-4 space-y-4">
          {/* Breadth Bar (Up vs Down) */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-2">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-rose-400">上涨 {breadth?.upCount ?? 3126} 家 ({upPercent}%)</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">平盘 {breadth?.flatCount ?? 168} 家</span>
              </div>
              <span className="font-bold text-emerald-400">下跌 {breadth?.downCount ?? 2029} 家 ({downPercent}%)</span>
            </div>

            {/* Ratio Bar */}
            <div className="w-full h-3 rounded-full overflow-hidden flex bg-slate-800">
              <div className="bg-rose-500 transition-all duration-500" style={{ width: `${upPercent}%` }} />
              <div className="bg-slate-600" style={{ width: `${(((breadth?.flatCount || 0) / totalStocks) * 100).toFixed(1)}%` }} />
              <div className="bg-emerald-500 transition-all duration-500" style={{ width: `${downPercent}%` }} />
            </div>

            {/* Key Indicators Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-slate-800/80">
              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">涨停家数</div>
                <div className="text-lg font-bold font-mono text-rose-400 mt-0.5">
                  {breadth?.limitUpCount ?? 76} <span className="text-xs font-normal text-slate-400">家</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">跌停家数</div>
                <div className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                  {breadth?.limitDownCount ?? 8} <span className="text-xs font-normal text-slate-400">家</span>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">炸板率</div>
                <div className="text-lg font-bold font-mono text-amber-400 mt-0.5">
                  {(breadth?.brokenLimitRate || 15.5).toFixed(1)}%
                </div>
              </div>

              <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                <div className="text-[11px] text-slate-400">情绪温度罗盘</div>
                <div className="text-base font-bold text-rose-300 mt-0.5 flex items-center gap-1">
                  <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
                  <span>{breadth?.sentimentLabel || '分化震荡'} ({breadth?.sentimentScore ?? 68}分)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Limit-Up Ladder (连板天梯) */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200 mb-3">
              <div className="flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-400" />
                <span>连板天梯高度榜 (主线空间龙)</span>
              </div>
              <span className="text-[11px] text-slate-400 font-normal">反映市场接力与打板风险偏好</span>
            </div>

            <div className="space-y-2 text-xs">
              {/* 7板+ */}
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-gradient-to-r from-rose-950/60 to-slate-900 border border-rose-800/40">
                <span className="w-16 px-2 py-0.5 rounded bg-rose-600 text-white font-bold font-mono text-center">
                  7连板+
                </span>
                <span className="font-semibold text-rose-300">
                  {breadth.ladder.limit7Plus.stocks.join(', ')}
                </span>
              </div>

              {/* 5-6板 */}
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-16 px-2 py-0.5 rounded bg-rose-900/80 text-rose-200 font-bold font-mono text-center">
                  5-6板
                </span>
                <span className="text-slate-200">
                  {breadth.ladder.limit5To6.stocks.join(', ')}
                </span>
              </div>

              {/* 3-4板 */}
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-16 px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold font-mono text-center">
                  3-4板
                </span>
                <span className="text-slate-300">
                  {breadth.ladder.limit3To4.stocks.join(', ')}
                </span>
              </div>

              {/* 2板 */}
              <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                <span className="w-16 px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-bold font-mono text-center">
                  2连板 ({breadth.ladder.limit2.count}只)
                </span>
                <span className="text-slate-400 truncate">
                  {breadth.ladder.limit2.stocks.join(', ')} 等
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: NORTHBOUND & SOUTHBOUND FLOW */}
      {activeTab === 'northbound' && (
        <div className="mt-4 space-y-4">
          {/* Northbound Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">北向资金合计 (陆股通)</div>
              <div className={`text-lg font-bold font-mono mt-1 ${northbound.totalNetBuy >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {northbound.totalNetBuy >= 0 ? '+' : ''}{northbound.totalNetBuy.toFixed(2)} 亿元
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">沪股通净流入</div>
              <div className={`text-lg font-bold font-mono mt-1 ${northbound.shNetBuy >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {northbound.shNetBuy >= 0 ? '+' : ''}{northbound.shNetBuy.toFixed(2)} 亿元
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">深股通净流入</div>
              <div className={`text-lg font-bold font-mono mt-1 ${northbound.szNetBuy >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {northbound.szNetBuy >= 0 ? '+' : ''}{northbound.szNetBuy.toFixed(2)} 亿元
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs text-slate-400">南向资金 (港股通)</div>
              <div className="text-lg font-bold font-mono text-cyan-400 mt-1">
                +{northbound.southboundTotal.toFixed(2)} 亿元
              </div>
            </div>
          </div>

          {/* Northbound Favorite Stocks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Top Buy */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-bold text-rose-400 mb-2 flex items-center justify-between">
                <span>北向净买入前列个股</span>
                <span className="text-[10px] font-normal text-slate-400">聪明钱做多</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {northbound.topBuyStocks.map((stk) => (
                  <div key={stk.code} className="flex items-center justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-slate-200 font-sans font-medium">{stk.name} ({stk.code})</span>
                    <span className="text-rose-400 font-bold">+{stk.netBuy}亿 (+{stk.changePercent}%)</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Sell */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center justify-between">
                <span>北向净卖出前列个股</span>
                <span className="text-[10px] font-normal text-slate-400">外资减仓</span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                {northbound.topSellStocks.map((stk) => (
                  <div key={stk.code} className="flex items-center justify-between p-1.5 rounded bg-slate-900">
                    <span className="text-slate-200 font-sans font-medium">{stk.name} ({stk.code})</span>
                    <span className="text-emerald-400 font-bold">{stk.netSell}亿 ({stk.changePercent}%)</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 4-TIER CAPITAL DISTRIBUTION */}
      {activeTab === 'capital_structure' && (
        <div className="mt-4 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-xs font-bold text-slate-200 mb-3">
              全市场主力与散户四维资金流向净额汇总 (亿元)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">超大单 (&gt;500万)</div>
                <div className={`text-base font-bold font-mono mt-1 ${totalSuperLarge > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {totalSuperLarge > 0 ? '+' : ''}{totalSuperLarge.toFixed(1)} 亿元
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">机构主力操盘定海神针</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">大单 (100万-500万)</div>
                <div className={`text-base font-bold font-mono mt-1 ${totalLarge > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {totalLarge > 0 ? '+' : ''}{totalLarge.toFixed(1)} 亿元
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">游资大户进攻主力军</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">中单 (20万-100万)</div>
                <div className={`text-base font-bold font-mono mt-1 ${totalMedium > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {totalMedium > 0 ? '+' : ''}{totalMedium.toFixed(1)} 亿元
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">中户跟随性资金</div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-xs text-slate-400">小单 (&lt;20万)</div>
                <div className={`text-base font-bold font-mono mt-1 ${totalSmall > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {totalSmall > 0 ? '+' : ''}{totalSmall.toFixed(1)} 亿元
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">普通散户交易对手盘</div>
              </div>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-slate-900/60 text-xs text-slate-400 leading-relaxed">
              💡 <strong>资金博弈特征解读: </strong> 当“超大单+大单”大幅净流入，而“小单”呈现被动净流出时，表明机构与游资正在集中从散户手中吸收筹码，板块上攻爆发力往往最强。
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
