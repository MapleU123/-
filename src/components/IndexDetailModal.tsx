import React from 'react';
import { IndexQuote } from '../types/market';
import { X, TrendingUp, TrendingDown, Clock, BarChart3 } from 'lucide-react';

interface IndexDetailModalProps {
  index: IndexQuote | null;
  onClose: () => void;
}

export const IndexDetailModal: React.FC<IndexDetailModalProps> = ({ index, onClose }) => {
  if (!index) return null;

  const isUp = index.change >= 0;
  const colorClass = isUp ? 'text-rose-400' : 'text-emerald-400';
  const strokeColor = isUp ? '#f43f5e' : '#10b981';

  // SVG Chart Dimensions
  const chartWidth = 560;
  const chartHeight = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 55 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const prices = index.timeSeries.map(p => p.price);
  const minPrice = Math.min(...prices, index.prevClose * 0.985);
  const maxPrice = Math.max(...prices, index.prevClose * 1.015);
  const priceRange = maxPrice - minPrice || 1;

  const points = index.timeSeries.map((p, i) => {
    const x = padding.left + (i / (index.timeSeries.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((p.price - minPrice) / priceRange) * innerHeight;
    return `${x},${y}`;
  }).join(' ');

  const prevCloseY = padding.top + innerHeight - ((index.prevClose - minPrice) / priceRange) * innerHeight;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div 
        id="index-detail-modal"
        className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-5 shadow-2xl overflow-hidden relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700">
              <BarChart3 className="w-5 h-5 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-slate-100">{index.name}</h3>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                  {index.code}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-3 h-3" />
                分时交易走势图 (9:30 - 15:00)
              </p>
            </div>
          </div>
          <button
            id="close-index-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Stat Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">当前点位</div>
            <div className={`text-xl font-bold font-mono ${colorClass}`}>
              {index.price.toFixed(2)}
            </div>
            <div className="flex items-center space-x-1 text-xs font-mono">
              {isUp ? <TrendingUp className="w-3 h-3 text-rose-400" /> : <TrendingDown className="w-3 h-3 text-emerald-400" />}
              <span className={colorClass}>
                {isUp ? '+' : ''}{index.change.toFixed(2)} ({isUp ? '+' : ''}{index.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">成交总额</div>
            <div className="text-base font-bold font-mono text-slate-100 mt-1">
              {index.turnover.toFixed(1)} <span className="text-xs font-normal text-slate-400">亿元</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              成交量: {index.volume.toFixed(0)}万手
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">最高 / 最低</div>
            <div className="text-xs font-mono text-rose-400 mt-1">
              高: {index.high.toFixed(2)}
            </div>
            <div className="text-xs font-mono text-emerald-400">
              低: {index.low.toFixed(2)}
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="text-[11px] text-slate-400">今开 / 昨收</div>
            <div className="text-xs font-mono text-slate-200 mt-1">
              开: {index.open.toFixed(2)}
            </div>
            <div className="text-xs font-mono text-slate-400">
              昨: {index.prevClose.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Intraday SVG Chart */}
        <div className="bg-slate-950/90 rounded-lg p-3 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1 px-2">
            <span>分时曲线 (黄色虚线为昨收盘价)</span>
            <span className="font-mono">{index.name} · 实时推演</span>
          </div>

          <div className="w-full overflow-x-auto">
            <svg className="w-full h-48 min-w-[480px]" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
              {/* Y Axis Grid Lines */}
              <line
                x1={padding.left}
                y1={padding.top}
                x2={chartWidth - padding.right}
                y2={padding.top}
                stroke="#334155"
                strokeDasharray="2,2"
              />
              <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                {maxPrice.toFixed(1)}
              </text>

              {/* Prev Close Line */}
              <line
                x1={padding.left}
                y1={prevCloseY}
                x2={chartWidth - padding.right}
                y2={prevCloseY}
                stroke="#eab308"
                strokeWidth="1.2"
                strokeDasharray="4,4"
              />
              <text x={padding.left - 8} y={prevCloseY + 3} textAnchor="end" fill="#eab308" fontSize="10" fontFamily="monospace">
                {index.prevClose.toFixed(1)}
              </text>

              <line
                x1={padding.left}
                y1={padding.top + innerHeight}
                x2={chartWidth - padding.right}
                y2={padding.top + innerHeight}
                stroke="#334155"
                strokeDasharray="2,2"
              />
              <text x={padding.left - 8} y={padding.top + innerHeight} textAnchor="end" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                {minPrice.toFixed(1)}
              </text>

              {/* Price Line */}
              <polyline
                fill="none"
                stroke={strokeColor}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                points={points}
              />

              {/* Gradient Area under curve */}
              <linearGradient id="indexGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
              </linearGradient>
              <polygon
                points={`${padding.left},${padding.top + innerHeight} ${points} ${chartWidth - padding.right},${padding.top + innerHeight}`}
                fill="url(#indexGrad)"
              />

              {/* Time X Labels */}
              {['09:30', '10:30', '11:30/13:00', '14:00', '15:00'].map((label, idx) => {
                const x = padding.left + (idx / 4) * innerWidth;
                return (
                  <text key={label} x={x} y={chartHeight - 8} textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">
                    {label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            关闭返回
          </button>
        </div>
      </div>
    </div>
  );
};
