import React from 'react';
import { SectorFundFlow, SectorStock } from '../types/market';
import { X, TrendingUp, TrendingDown, PieChart, Sparkles, Activity, Layers } from 'lucide-react';

interface SectorDetailModalProps {
  sector: SectorFundFlow | null;
  onClose: () => void;
  onSelectStock?: (stock: SectorStock, sectorName: string) => void;
  onOpenAIDiagnosis?: (sectorName: string) => void;
}

export const SectorDetailModal: React.FC<SectorDetailModalProps> = ({
  sector,
  onClose,
  onSelectStock,
  onOpenAIDiagnosis
}) => {
  if (!sector) return null;

  const isInflow = sector.mainNetInflow >= 0;
  const isUp = sector.changePercent >= 0;
  const flowColor = isInflow ? 'text-rose-400' : 'text-emerald-400';
  const priceColor = isUp ? 'text-rose-400' : 'text-emerald-400';

  // SVG Chart for Intraday Capital Inflow
  const chartWidth = 520;
  const chartHeight = 160;
  const padding = { top: 15, right: 15, bottom: 25, left: 45 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const inflows = sector.intradayInflowHistory.map(h => h.netInflow);
  const minFlow = Math.min(...inflows, 0);
  const maxFlow = Math.max(...inflows, 5);
  const flowRange = maxFlow - minFlow || 1;

  const points = sector.intradayInflowHistory.map((h, i) => {
    const x = padding.left + (i / (sector.intradayInflowHistory.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((h.netInflow - minFlow) / flowRange) * innerHeight;
    return `${x},${y}`;
  }).join(' ');

  const zeroY = padding.top + innerHeight - ((0 - minFlow) / flowRange) * innerHeight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="sector-detail-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-5 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-rose-950/50 border border-rose-800/40 text-rose-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-100">{sector.name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {sector.category === 'industry' ? '行业板块' : sector.category === 'concept' ? '概念板块' : '地域板块'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {sector.description || '主力资金深度追踪与成分股流向分析'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400">板块涨跌幅</div>
            <div className={`text-xl font-bold font-mono mt-1 ${priceColor}`}>
              {isUp ? '+' : ''}{sector.changePercent.toFixed(2)}%
            </div>
            <div className="text-[11px] text-slate-400">
              上涨 {sector.upCount} / 下跌 {sector.downCount}
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400">主力净流入</div>
            <div className={`text-xl font-bold font-mono mt-1 ${flowColor}`}>
              {isInflow ? '+' : ''}{sector.mainNetInflow.toFixed(2)} <span className="text-xs font-normal">亿元</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              净占比: {sector.mainNetRatio > 0 ? '+' : ''}{sector.mainNetRatio.toFixed(1)}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400">总成交额 / 换手率</div>
            <div className="text-lg font-bold font-mono text-slate-100 mt-1">
              {sector.totalTurnover.toFixed(1)} <span className="text-xs font-normal text-slate-400">亿元</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              换手率: {sector.turnoverRate.toFixed(2)}%
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="text-xs text-slate-400">资金强度评分</div>
            <div className="text-lg font-bold font-mono text-amber-400 mt-1 flex items-center gap-1">
              {sector.inflowMomentum} <span className="text-xs text-slate-500">/ 100</span>
            </div>
            <div className="text-[11px] text-slate-400">
              领涨: {sector.leadStock.name} (+{sector.leadStock.changePercent}%)
            </div>
          </div>
        </div>

        {/* 4-Tier Capital Breakdown Cards */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-3">
            <div className="flex items-center space-x-1.5">
              <PieChart className="w-4 h-4 text-rose-400" />
              <span>主力与散户四维资金流向拆解</span>
            </div>
            <span className="text-[11px] text-slate-500">单位：亿元</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400">超大单 (机构主力)</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${sector.superLargeInflow > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {sector.superLargeInflow > 0 ? '+' : ''}{sector.superLargeInflow.toFixed(2)} 亿
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400">大单 (游资/大户)</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${sector.largeInflow > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {sector.largeInflow > 0 ? '+' : ''}{sector.largeInflow.toFixed(2)} 亿
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400">中单 (中户资金)</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${sector.mediumInflow > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {sector.mediumInflow > 0 ? '+' : ''}{sector.mediumInflow.toFixed(2)} 亿
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
              <div className="text-[11px] text-slate-400">小单 (散户跟随)</div>
              <div className={`text-sm font-bold font-mono mt-0.5 ${sector.smallInflow > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {sector.smallInflow > 0 ? '+' : ''}{sector.smallInflow.toFixed(2)} 亿
              </div>
            </div>
          </div>
        </div>

        {/* Intraday Inflow Chart */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 mb-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>分时主力累计净流入轨迹 (亿元)</span>
            <span className="font-mono">实时推演</span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg className="w-full h-36 min-w-[460px]" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {/* Zero Reference Line */}
              <line
                x1={padding.left}
                y1={zeroY}
                x2={chartWidth - padding.right}
                y2={zeroY}
                stroke="#475569"
                strokeDasharray="3,3"
              />
              <text x={padding.left - 6} y={zeroY + 4} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                0
              </text>

              <polyline
                fill="none"
                stroke={isInflow ? '#f43f5e' : '#10b981'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />

              {['09:30', '10:30', '11:30', '14:00', '15:00'].map((label, idx) => {
                const x = padding.left + (idx / 4) * innerWidth;
                return (
                  <text key={label} x={x} y={chartHeight - 6} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                    {label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Constituent Stocks Flow Table */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-200 mb-2">
            <span>板块核心成分股资金流向榜</span>
            <span className="text-[11px] text-slate-400">点击个股可查看五档买卖盘与AI诊断</span>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-800">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950/80 text-slate-400 font-sans border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">代码 / 名称</th>
                  <th className="py-2 px-3">最新价</th>
                  <th className="py-2 px-3">涨跌幅</th>
                  <th className="py-2 px-3">主力净流入</th>
                  <th className="py-2 px-3">超大单流入</th>
                  <th className="py-2 px-3">成交额</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {sector.topStocks.map((stock) => (
                  <tr
                    key={stock.code}
                    onClick={() => onSelectStock && onSelectStock(stock, sector.name)}
                    className="hover:bg-slate-800/80 cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-bold text-slate-100 hover:text-rose-400">
                        {stock.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {stock.code}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-200 font-bold">
                      ¥{stock.price.toFixed(2)}
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${
                      stock.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                    </td>
                    <td className={`py-2.5 px-3 font-bold ${
                      stock.mainNetInflow >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {stock.mainNetInflow >= 0 ? '+' : ''}{stock.mainNetInflow.toFixed(2)} 亿
                    </td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {stock.superLargeInflow > 0 ? '+' : ''}{stock.superLargeInflow.toFixed(2)} 亿
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      {stock.turnover.toFixed(1)} 亿
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <button
            onClick={() => {
              onClose();
              if (onOpenAIDiagnosis) onOpenAIDiagnosis(sector.name);
            }}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-md transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>AI 对该板块进行深度研判</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
