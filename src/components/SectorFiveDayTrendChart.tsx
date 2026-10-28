import React, { useState } from 'react';
import { SectorFundFlow } from '../types/market';
import { getSectorFiveDayTrend, TrendAnalysisResult } from '../utils/sectorTrendAnalyzer';
import { 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  RefreshCw, 
  Shuffle, 
  HelpCircle,
  Activity,
  AlertTriangle,
  Info
} from 'lucide-react';

interface SectorFiveDayTrendChartProps {
  sector: SectorFundFlow;
}

export const SectorFiveDayTrendChart: React.FC<SectorFiveDayTrendChartProps> = ({ sector }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showPatternHelp, setShowPatternHelp] = useState<boolean>(false);

  const analysis: TrendAnalysisResult = getSectorFiveDayTrend(sector);
  const { history, total5dInflow, inflowDaysCount, outflowDaysCount, impulseConcentration } = analysis;

  // Chart Dimensions
  const svgWidth = 620;
  const svgHeight = 150;
  const pad = { top: 25, right: 30, bottom: 35, left: 55 };
  const innerW = svgWidth - pad.left - pad.right;
  const innerH = svgHeight - pad.top - pad.bottom;

  // Find min and max for scaling
  const flows = history.map(h => h.netInflow);
  let minFlow = Math.min(...flows, 0);
  let maxFlow = Math.max(...flows, 0);
  // Add margin so line doesn't hit edge
  const range = maxFlow - minFlow || 10;
  minFlow -= range * 0.15;
  maxFlow += range * 0.15;
  const fullRange = maxFlow - minFlow || 1;

  // Coordinate functions
  const getX = (i: number) => pad.left + (i / (history.length - 1)) * innerW;
  const getY = (val: number) => pad.top + innerH - ((val - minFlow) / fullRange) * innerH;

  const zeroY = getY(0);

  // Generate SVG Points
  const points = history.map((h, i) => `${getX(i)},${getY(h.netInflow)}`).join(' ');

  // Generate Area Path (closing at zero-line)
  const firstX = getX(0);
  const lastX = getX(history.length - 1);
  const areaPath = `M ${firstX},${zeroY} L ${points.split(' ').join(' L ')} L ${lastX},${zeroY} Z`;

  // Determine Icon
  const renderIcon = () => {
    switch (analysis.iconType) {
      case 'zap':
        return <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400/30" />;
      case 'trend-up':
        return <TrendingUp className="w-3.5 h-3.5 text-rose-400" />;
      case 'trend-down':
        return <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />;
      case 'refresh':
        return <RefreshCw className="w-3.5 h-3.5 text-purple-300" />;
      default:
        return <Shuffle className="w-3.5 h-3.5 text-blue-400" />;
    }
  };

  const activePoint = hoveredIdx !== null ? history[hoveredIdx] : history[history.length - 1];
  const activeIdx = hoveredIdx !== null ? hoveredIdx : history.length - 1;

  return (
    <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 mb-4 shadow-sm">
      {/* Top Header & Pattern Verdict */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300">
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-200">
                近5个交易日主力资金趋势
              </span>
              {/* Pattern Badge */}
              <span 
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${analysis.badgeBg} ${analysis.badgeBorder} ${analysis.badgeText}`}
              >
                {renderIcon()}
                <span>{analysis.patternTitle}</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPatternHelp(!showPatternHelp)}
                className="text-slate-400 hover:text-slate-200 text-xs transition-colors"
                title="查看持续流入与脉冲研判规则说明"
              >
                <HelpCircle className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {analysis.patternSubtitle}
            </p>
          </div>
        </div>

        {/* Quantitative Snapshot Badges */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">5日累计净流入:</span>
            <span className={`font-mono font-bold ${total5dInflow >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {total5dInflow >= 0 ? '+' : ''}{total5dInflow.toFixed(2)} 亿
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5">
            <span className="text-slate-400 text-[11px]">进出节奏:</span>
            <span className="font-mono text-slate-200">
              <span className="text-rose-400 font-bold">{inflowDaysCount}红</span>
              <span className="text-slate-500 mx-0.5">/</span>
              <span className="text-emerald-400 font-bold">{outflowDaysCount}绿</span>
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 flex items-center gap-1.5" title="最大单日净流入占全部正向流入的比例。高于65%即具备脉冲特征">
            <span className="text-slate-400 text-[11px]">脉冲集中度:</span>
            <span className={`font-mono font-bold ${impulseConcentration >= 65 ? 'text-amber-400' : 'text-slate-200'}`}>
              {impulseConcentration}%
            </span>
          </div>
        </div>
      </div>

      {/* Pattern Explanation Dropdown / Modal Tip */}
      {showPatternHelp && (
        <div className="mt-3 p-3 rounded-lg bg-slate-900/90 border border-slate-700/70 text-xs text-slate-300 space-y-2 animate-fade-in">
          <div className="flex items-center justify-between font-bold text-slate-100 border-b border-slate-800 pb-1.5">
            <span className="flex items-center gap-1.5">
              <Info className="w-4 h-4 text-blue-400" />
              如何区分「持续流入」与「脉冲式进入」？
            </span>
            <button 
              onClick={() => setShowPatternHelp(false)}
              className="text-slate-400 hover:text-slate-200 text-xs"
            >
              关闭
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] leading-relaxed">
            <div className="p-2 rounded bg-slate-950/60 border border-rose-900/30">
              <div className="font-bold text-rose-400 flex items-center gap-1 mb-1">
                <TrendingUp className="w-3.5 h-3.5" />
                持续净流入 (机构建仓/波段主升)
              </div>
              <p className="text-slate-400">
                特征：5个交易日内至少3~4天主力净买入，单日流入占比适中（集中度≤55%）。表明中长线大资金按计划稳步扫货，趋势惯性强，回踩5日线多为良性机会。
              </p>
            </div>
            <div className="p-2 rounded bg-slate-950/60 border border-amber-900/30">
              <div className="font-bold text-amber-400 flex items-center gap-1 mb-1">
                <Zap className="w-3.5 h-3.5" />
                脉冲式进入 (游资突袭/一日游风险)
              </div>
              <p className="text-slate-400">
                特征：前期平淡甚至净流出，单日资金爆发性猛拉，集中度常超65%。多受突发消息刺激，游资主导，若次日无跟风资金接力容易冲高回落，切忌追高。
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SVG Mini Trend Chart */}
      <div className="relative mt-3 w-full overflow-x-auto">
        <svg 
          className="w-full h-38 min-w-[500px]" 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        >
          <defs>
            {/* Area Gradients */}
            <linearGradient id="flow-up-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="flow-down-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid Baseline Lines */}
          <line
            x1={pad.left}
            y1={zeroY}
            x2={svgWidth - pad.right}
            y2={zeroY}
            stroke="#475569"
            strokeDasharray="3,3"
            strokeWidth="1.2"
          />
          <text 
            x={pad.left - 8} 
            y={zeroY + 3.5} 
            textAnchor="end" 
            fill="#94a3b8" 
            fontSize="10" 
            fontFamily="monospace"
          >
            0 轴
          </text>

          {/* Max & Min Guide Labels */}
          <text 
            x={pad.left - 8} 
            y={pad.top + 5} 
            textAnchor="end" 
            fill="#64748b" 
            fontSize="9" 
            fontFamily="monospace"
          >
            +{Math.max(...flows).toFixed(0)}亿
          </text>
          {Math.min(...flows) < 0 && (
            <text 
              x={pad.left - 8} 
              y={pad.top + innerH} 
              textAnchor="end" 
              fill="#64748b" 
              fontSize="9" 
              fontFamily="monospace"
            >
              {Math.min(...flows).toFixed(0)}亿
            </text>
          )}

          {/* Background Area Fill */}
          <path
            d={areaPath}
            fill={total5dInflow >= 0 ? "url(#flow-up-gradient)" : "url(#flow-down-gradient)"}
          />

          {/* Trend Polyline */}
          <polyline
            fill="none"
            stroke={total5dInflow >= 0 ? '#f43f5e' : '#10b981'}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Vertical Guide & Interactive Points */}
          {history.map((pt, idx) => {
            const cx = getX(idx);
            const cy = getY(pt.netInflow);
            const isPos = pt.netInflow >= 0;
            const isHovered = hoveredIdx === idx;
            const isToday = idx === history.length - 1;

            return (
              <g 
                key={pt.fullDate || idx} 
                className="cursor-pointer transition-all duration-150"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Vertical dash line through each day */}
                <line
                  x1={cx}
                  y1={pad.top}
                  x2={cx}
                  y2={svgHeight - pad.bottom}
                  stroke={isHovered ? '#94a3b8' : '#334155'}
                  strokeDasharray="2,2"
                  strokeWidth={isHovered ? '1.5' : '1'}
                />

                {/* Zero drop line from point to zero line */}
                <line
                  x1={cx}
                  y1={cy}
                  x2={cx}
                  y2={zeroY}
                  stroke={isPos ? '#f43f5e' : '#10b981'}
                  strokeWidth={isHovered ? '2.5' : '1.5'}
                  strokeOpacity={isHovered ? '0.8' : '0.4'}
                />

                {/* Halo for hovered / today */}
                {(isHovered || isToday) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isHovered ? 8 : 6}
                    fill={isPos ? '#f43f5e' : '#10b981'}
                    fillOpacity="0.25"
                  />
                )}

                {/* Main Dot */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 4.5 : 3.5}
                  fill={isPos ? '#f43f5e' : '#10b981'}
                  stroke="#0f172a"
                  strokeWidth="1.5"
                />

                {/* Day Inflow Floating Text */}
                <text
                  x={cx}
                  y={isPos ? cy - 8 : cy + 13}
                  textAnchor="middle"
                  fill={isPos ? '#fb7185' : '#34d399'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight="bold"
                >
                  {isPos ? '+' : ''}{pt.netInflow.toFixed(1)}亿
                </text>

                {/* Bottom Date Label */}
                <text
                  x={cx}
                  y={svgHeight - 18}
                  textAnchor="middle"
                  fill={isHovered ? '#f1f5f9' : isToday ? '#e2e8f0' : '#64748b'}
                  fontSize="10"
                  fontFamily="monospace"
                  fontWeight={isToday || isHovered ? 'bold' : 'normal'}
                >
                  {pt.dayLabel}
                </text>

                {/* Bottom Date / Chg Label */}
                <text
                  x={cx}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fill={pt.changePercent >= 0 ? '#f43f5e' : '#10b981'}
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {pt.changePercent >= 0 ? '+' : ''}{pt.changePercent.toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Floating Inspector Card for Active/Hovered Point */}
        <div className="mt-1 flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-slate-200">
              【{activePoint.dayLabel} • {activePoint.date}】
            </span>
            <span className="text-slate-400">主力净流入:</span>
            <span className={`font-mono font-bold ${activePoint.netInflow >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {activePoint.netInflow >= 0 ? '+' : ''}{activePoint.netInflow.toFixed(2)} 亿元
            </span>
            <span className="text-slate-400 ml-2">涨跌幅:</span>
            <span className={`font-mono font-bold ${activePoint.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {activePoint.changePercent >= 0 ? '+' : ''}{activePoint.changePercent.toFixed(2)}%
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            {activeIdx === 4 ? (
              <span className="px-1.5 py-0.5 rounded bg-rose-950/70 text-rose-400 font-medium">今日最新实盘</span>
            ) : (
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">历史已收盘</span>
            )}
          </div>
        </div>
      </div>

      {/* Quantitative Diagnosis Box (持续流入 vs 脉冲式研判) */}
      <div className={`mt-3 p-3 rounded-lg border text-xs leading-relaxed ${
        analysis.pattern === 'continuous_inflow'
          ? 'bg-rose-950/30 border-rose-900/40 text-rose-200/90'
          : analysis.pattern === 'impulse_inflow'
          ? 'bg-amber-950/30 border-amber-900/40 text-amber-200/90'
          : analysis.pattern === 'impulse_retest'
          ? 'bg-purple-950/30 border-purple-900/40 text-purple-200/90'
          : analysis.pattern === 'continuous_outflow'
          ? 'bg-emerald-950/30 border-emerald-900/40 text-emerald-200/90'
          : 'bg-slate-900/70 border-slate-800 text-slate-300'
      }`}>
        <div className="flex items-start space-x-2">
          <div className="mt-0.5 flex-shrink-0">
            {analysis.pattern === 'impulse_inflow' ? (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            ) : (
              <Info className="w-4 h-4 text-rose-400" />
            )}
          </div>
          <div className="space-y-1 w-full">
            <div className="font-bold flex items-center justify-between text-slate-100">
              <span>【资金形态研判】：{analysis.diagnosisHeadline}</span>
              <span className="text-[10px] font-mono text-slate-400 uppercase">
                {analysis.pattern.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {analysis.institutionalAnalysis}
            </p>
            <div className="pt-1 text-[11px] font-semibold text-amber-300/90 flex items-center gap-1 border-t border-slate-800/60 mt-1">
              <span>💡 操作警示/应对策略：</span>
              <span>{analysis.actionGuidance}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
