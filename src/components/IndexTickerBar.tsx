import React from 'react';
import { IndexQuote } from '../types/market';
import { TrendingUp, TrendingDown, ChevronRight, Activity } from 'lucide-react';

interface IndexTickerBarProps {
  indices: IndexQuote[];
  onSelectIndex: (index: IndexQuote) => void;
}

export const IndexTickerBar: React.FC<IndexTickerBarProps> = ({ indices, onSelectIndex }) => {
  return (
    <div id="index-ticker-section" className="bg-slate-900/90 border-y border-slate-800/80 px-3 py-2.5 shadow-inner backdrop-blur-md">
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center space-x-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-300 tracking-wide flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-rose-400" />
            核心大盘指数实时行情
          </span>
        </div>
        <span className="text-[11px] text-slate-400 hidden sm:inline">
          点击指数卡片查看分时走势及权重贡献
        </span>
      </div>

      {/* Grid of 8 Indices */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {indices.map((idx) => {
          const isUp = idx.change >= 0;
          const colorClass = isUp ? 'text-rose-400' : 'text-emerald-400';
          const bgClass = isUp ? 'bg-rose-950/20 border-rose-900/30 hover:border-rose-700/50' : 'bg-emerald-950/20 border-emerald-900/30 hover:border-emerald-700/50';
          const sparkColor = isUp ? '#f43f5e' : '#10b981';

          // SVG Sparkline path
          const minVal = Math.min(...idx.sparkline);
          const maxVal = Math.max(...idx.sparkline);
          const range = maxVal - minVal || 1;
          const points = idx.sparkline
            .map((val, i) => {
              const x = (i / (idx.sparkline.length - 1)) * 64;
              const y = 22 - ((val - minVal) / range) * 18;
              return `${x},${y}`;
            })
            .join(' ');

          return (
            <div
              key={idx.code}
              id={`index-card-${idx.code}`}
              onClick={() => onSelectIndex(idx)}
              className={`group relative p-2.5 rounded-lg border transition-all duration-200 cursor-pointer ${bgClass} hover:shadow-lg hover:shadow-slate-950/50`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-200 group-hover:text-white truncate">
                  {idx.name}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {idx.code.split('.')[0]}
                </span>
              </div>

              <div className="flex items-baseline justify-between mb-1">
                <span className={`text-sm sm:text-base font-bold font-mono tracking-tight ${colorClass}`}>
                  {idx.price.toFixed(2)}
                </span>
                <div className="flex items-center space-x-0.5 text-xs font-semibold font-mono">
                  {isUp ? (
                    <TrendingUp className={`w-3 h-3 ${colorClass}`} />
                  ) : (
                    <TrendingDown className={`w-3 h-3 ${colorClass}`} />
                  )}
                  <span className={colorClass}>
                    {isUp ? '+' : ''}{idx.changePercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* Sparkline & Turnover */}
              <div className="flex items-center justify-between pt-1 border-t border-slate-800/40">
                <span className="text-[10px] text-slate-400 font-mono">
                  {(idx.turnover).toFixed(0)}亿
                </span>
                <svg className="w-14 h-5 overflow-visible" viewBox="0 0 64 24">
                  <polyline
                    fill="none"
                    stroke={sparkColor}
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={points}
                  />
                </svg>
              </div>

              <div className="absolute right-1.5 bottom-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
