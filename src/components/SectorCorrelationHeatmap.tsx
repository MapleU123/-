import React, { useState, useMemo } from 'react';
import { SectorFundFlow } from '../types/market';
import { 
  buildCorrelationMatrix, 
  classifyCorrelation, 
  assessPortfolioAllocation,
  SectorCorrelationPair,
  PortfolioAllocationAssessment
} from '../utils/sectorCorrelation';
import { 
  Scale, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Shuffle, 
  Layers, 
  Info, 
  Sparkles, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  SlidersHorizontal,
  Check,
  Search,
  CheckCircle2,
  PieChart as PieIcon,
  HelpCircle
} from 'lucide-react';

interface SectorCorrelationHeatmapProps {
  sectors: SectorFundFlow[];
  onSelectSector?: (sector: SectorFundFlow) => void;
  onOpenAIDiagnosis?: (promptTopic: string) => void;
}

type ScopeMode = 'top12' | 'top16' | 'industry' | 'concept' | 'cross' | 'custom';
type TimeframeMode = '5d' | 'intraday' | 'blended';
type MatrixFilterMode = 'all' | 'positive' | 'negative' | 'orthogonal';

export const SectorCorrelationHeatmap: React.FC<SectorCorrelationHeatmapProps> = ({
  sectors,
  onSelectSector,
  onOpenAIDiagnosis
}) => {
  // 1. Controls
  const [scopeMode, setScopeMode] = useState<ScopeMode>('top12');
  const [timeframeMode, setTimeframeMode] = useState<TimeframeMode>('blended');
  const [matrixFilter, setMatrixFilter] = useState<MatrixFilterMode>('all');
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedPair, setSelectedPair] = useState<SectorCorrelationPair | null>(null);

  // Custom portfolio basket for simulator
  const [customSelectedIds, setCustomSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'matrix' | 'portfolio' | 'leaderboards'>('matrix');

  // Filter sectors based on scope
  const activeSectors = useMemo(() => {
    if (!sectors || sectors.length === 0) return [];

    let pool = [...sectors];

    if (scopeMode === 'top12') {
      // Pick top 12 by turnover and inflow activity
      return pool
        .sort((a, b) => (Math.abs(b.mainNetInflow) + b.totalTurnover * 0.1) - (Math.abs(a.mainNetInflow) + a.totalTurnover * 0.1))
        .slice(0, 12);
    }

    if (scopeMode === 'top16') {
      return pool
        .sort((a, b) => (Math.abs(b.mainNetInflow) + b.totalTurnover * 0.1) - (Math.abs(a.mainNetInflow) + a.totalTurnover * 0.1))
        .slice(0, 16);
    }

    if (scopeMode === 'industry') {
      const ind = pool.filter(s => s.category === 'industry');
      return ind
        .sort((a, b) => Math.abs(b.mainNetInflow) - Math.abs(a.mainNetInflow))
        .slice(0, 12);
    }

    if (scopeMode === 'concept') {
      const cpt = pool.filter(s => s.category === 'concept');
      return cpt
        .sort((a, b) => Math.abs(b.mainNetInflow) - Math.abs(a.mainNetInflow))
        .slice(0, 12);
    }

    if (scopeMode === 'cross') {
      // Mix of 6 top industries and 6 top concepts
      const ind = pool.filter(s => s.category === 'industry').slice(0, 6);
      const cpt = pool.filter(s => s.category === 'concept').slice(0, 6);
      return [...ind, ...cpt];
    }

    if (scopeMode === 'custom') {
      if (customSelectedIds.length > 0) {
        const found = pool.filter(s => customSelectedIds.includes(s.id));
        if (found.length >= 2) return found;
      }
      return pool.slice(0, 8);
    }

    return pool.slice(0, 12);
  }, [sectors, scopeMode, customSelectedIds]);

  // Compute correlation matrix
  const matrixData = useMemo(() => {
    return buildCorrelationMatrix(activeSectors, timeframeMode);
  }, [activeSectors, timeframeMode]);

  // Default select first meaningful pair if none selected
  useMemo(() => {
    if (!selectedPair && matrixData.pairs.length > 0) {
      setSelectedPair(matrixData.pairs[0]);
    }
  }, [matrixData, selectedPair]);

  // Multi-sector portfolio basket calculation
  const portfolioAssessment: PortfolioAllocationAssessment = useMemo(() => {
    const listToAssess = scopeMode === 'custom' && customSelectedIds.length >= 2
      ? sectors.filter(s => customSelectedIds.includes(s.id))
      : activeSectors.slice(0, 5);
    return assessPortfolioAllocation(listToAssess);
  }, [scopeMode, customSelectedIds, sectors, activeSectors]);

  // Cell color helper
  const getCorrelationColor = (r: number, isHovered: boolean, isSelected: boolean) => {
    if (r === 1.0) {
      return isSelected 
        ? 'bg-slate-700 text-white font-bold ring-2 ring-blue-400' 
        : 'bg-slate-800/80 text-slate-400';
    }

    let bg = '';
    let text = 'text-white';

    if (r >= 0.7) {
      bg = 'bg-rose-700 hover:bg-rose-600';
    } else if (r >= 0.45) {
      bg = 'bg-rose-800/90 hover:bg-rose-700';
    } else if (r >= 0.2) {
      bg = 'bg-rose-950/70 text-rose-200 hover:bg-rose-900/80';
    } else if (r > -0.2) {
      bg = 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80';
    } else if (r > -0.45) {
      bg = 'bg-teal-950/80 text-teal-200 hover:bg-teal-900/80';
    } else if (r > -0.7) {
      bg = 'bg-emerald-800/90 text-white hover:bg-emerald-700';
    } else {
      bg = 'bg-emerald-600 hover:bg-emerald-500 font-bold';
    }

    const ring = isSelected ? 'ring-2 ring-amber-400 z-10 scale-105 shadow-md' : '';
    const hoverRing = isHovered && !isSelected ? 'ring-1 ring-white/60 z-5' : '';

    return `${bg} ${text} ${ring} ${hoverRing}`;
  };

  const handleCellClick = (rowIdx: number, colIdx: number) => {
    if (rowIdx === colIdx) return;
    const secA = activeSectors[rowIdx];
    const secB = activeSectors[colIdx];
    const r = matrixData.matrix[rowIdx][colIdx];
    const pair = matrixData.pairs.find(
      p => (p.sectorA.id === secA.id && p.sectorB.id === secB.id) ||
           (p.sectorA.id === secB.id && p.sectorB.id === secA.id)
    );
    if (pair) {
      setSelectedPair(pair);
    }
  };

  const toggleCustomSector = (id: string) => {
    setCustomSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(x => x !== id);
      }
      if (prev.length >= 10) return prev; // max 10
      return [...prev, id];
    });
  };

  return (
    <div id="sector-correlation-heatmap-container" className="space-y-4">
      {/* 1. Header Banner & Metric Overview Cards */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-4 border border-indigo-500/30 shadow-sm space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-indigo-300 shrink-0">
              <Scale className="w-5 h-5 text-indigo-400" />
            </span>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  板块资金关联度热力图 & 跨行业配置矩阵
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  Pearson r ∈ [-1.0, +1.0]
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                  资产配置与风险对冲
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                基于资金流向时间序列与流动性相关系数，量化不同行业/概念板块间的**资金共振协同度**与**跷跷板抽血轮动**，辅助构建抗波动、抗回撤的跨行业投资组合。
              </p>
            </div>
          </div>

          {/* Quick AI Diagnosis Entry */}
          {onOpenAIDiagnosis && (
            <button
              onClick={() => onOpenAIDiagnosis('A股跨行业资金关联度与跨板块对冲配置深度分析')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-rose-600 hover:from-indigo-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 self-start md:self-auto cursor-pointer shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
              <span>AI 跨行业配置诊断</span>
            </button>
          )}
        </div>

        {/* 3 Core Quantitative Insight Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-indigo-500/20">
          {/* Card 1: 强共振进攻对子 */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-rose-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Flame className="w-3 h-3 text-rose-400" />
                <span>强共振进攻链 (协同抱团)</span>
              </div>
              <div className="text-xs font-bold text-rose-300 mt-1 truncate">
                {matrixData.topPositivePairs[0] ? (
                  `${matrixData.topPositivePairs[0].sectorA.name} ↔ ${matrixData.topPositivePairs[0].sectorB.name}`
                ) : '半导体 ↔ 人工智能'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                关联度 r = +{matrixData.topPositivePairs[0]?.correlation.toFixed(2) || '0.85'} · 同向进攻合力
              </div>
            </div>
            <span className="text-[11px] font-mono font-black text-rose-400 bg-rose-950/60 px-2 py-1 rounded border border-rose-800">
              +{matrixData.topPositivePairs[0]?.correlation.toFixed(2) || '0.85'}
            </span>
          </div>

          {/* Card 2: 极端跷跷板对冲对子 */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <Shuffle className="w-3 h-3 text-emerald-400" />
                <span>黄金跷跷板对子 (对冲轮动)</span>
              </div>
              <div className="text-xs font-bold text-emerald-300 mt-1 truncate">
                {matrixData.topNegativePairs[0] ? (
                  `${matrixData.topNegativePairs[0].sectorA.name} ↔ ${matrixData.topNegativePairs[0].sectorB.name}`
                ) : '银行/煤炭 ↔ 科技AI'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                关联度 r = {matrixData.topNegativePairs[0]?.correlation.toFixed(2) || '-0.72'} · 存量吸血替换
              </div>
            </div>
            <span className="text-[11px] font-mono font-black text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-800">
              {matrixData.topNegativePairs[0]?.correlation.toFixed(2) || '-0.72'}
            </span>
          </div>

          {/* Card 3: 黄金避险低相关对子 */}
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 text-blue-400" />
                <span>马科维茨有效分散 (低相关)</span>
              </div>
              <div className="text-xs font-bold text-slate-200 mt-1 truncate">
                {matrixData.topOrthogonalPairs[0] ? (
                  `${matrixData.topOrthogonalPairs[0].sectorA.name} ↔ ${matrixData.topOrthogonalPairs[0].sectorB.name}`
                ) : '公用事业 ↔ 影视传媒'}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                关联度 r = {matrixData.topOrthogonalPairs[0]?.correlation >= 0 ? '+' : ''}{matrixData.topOrthogonalPairs[0]?.correlation.toFixed(2) || '0.04'} · 降波动减回撤
              </div>
            </div>
            <span className="text-[11px] font-mono font-black text-blue-300 bg-slate-800 px-2 py-1 rounded border border-slate-700">
              {matrixData.topOrthogonalPairs[0]?.correlation >= 0 ? '+' : ''}{matrixData.topOrthogonalPairs[0]?.correlation.toFixed(2) || '0.04'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Control Toolbar */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Left: Scope Selection */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>板块范围:</span>
          </span>
          <button
            onClick={() => setScopeMode('top12')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              scopeMode === 'top12' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            核心主线 (12标的)
          </button>
          <button
            onClick={() => setScopeMode('top16')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              scopeMode === 'top16' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            全景活跃 (16标的)
          </button>
          <button
            onClick={() => setScopeMode('industry')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              scopeMode === 'industry' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            行业专场
          </button>
          <button
            onClick={() => setScopeMode('concept')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              scopeMode === 'concept' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            概念专场
          </button>
          <button
            onClick={() => setScopeMode('cross')}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              scopeMode === 'cross' ? 'bg-indigo-600 text-white font-bold shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            行业×概念联动
          </button>
        </div>

        {/* Middle: Timeframe Mode */}
        <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-slate-100 border border-slate-200">
          <span className="text-slate-500 font-medium px-1.5 text-[11px]">周期:</span>
          {(['blended', '5d', 'intraday'] as TimeframeMode[]).map((tf) => {
            const labelMap: Record<TimeframeMode, string> = {
              blended: '多周期综合',
              '5d': '5日波段',
              intraday: '分时短线'
            };
            return (
              <button
                key={tf}
                onClick={() => setTimeframeMode(tf)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  timeframeMode === tf
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {labelMap[tf]}
              </button>
            );
          })}
        </div>

        {/* Right: Matrix Filter & View Tabs */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg text-[11px]">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeTab === 'matrix' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              热力矩阵
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer flex items-center space-x-1 ${
                activeTab === 'portfolio' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PieIcon className="w-3 h-3" />
              <span>组合测算器</span>
            </button>
            <button
              onClick={() => setActiveTab('leaderboards')}
              className={`px-2 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeTab === 'leaderboards' ? 'bg-white text-indigo-600 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              典型配对榜
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Heatmap Matrix View */}
      {activeTab === 'matrix' && (
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-4">
          {/* Legend and guidance banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-slate-600">
              <span className="font-bold text-slate-800">关联度色阶图例：</span>
              <span className="text-slate-400">(点击任意交叉单元格，即时呼出跨行业配对分析)</span>
            </div>

            {/* Gradient scale bar */}
            <div className="flex items-center space-x-1.5 text-[11px] font-mono">
              <span className="text-emerald-700 font-bold">-1.0 (极端对冲/跷跷板)</span>
              <div className="flex h-3 w-40 rounded-xs overflow-hidden border border-slate-200 shadow-2xs">
                <span className="flex-1 bg-emerald-600" title="强负相关" />
                <span className="flex-1 bg-teal-800" title="中度负相关" />
                <span className="flex-1 bg-slate-700" title="独立低相关" />
                <span className="flex-1 bg-rose-900" title="中度正相关" />
                <span className="flex-1 bg-rose-600" title="强正相关" />
              </div>
              <span className="text-rose-700 font-bold">+1.0 (强协同进攻)</span>
            </div>
          </div>

          {/* Correlation Matrix Table */}
          <div className="overflow-x-auto select-none">
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left text-xs font-bold text-slate-500 bg-slate-50/80 sticky left-0 z-20 min-w-[110px] border-b border-r border-slate-200">
                    板块 \ 板块
                  </th>
                  {activeSectors.map((sec, colIdx) => (
                    <th 
                      key={sec.id}
                      className={`p-1.5 text-xs font-medium border-b border-slate-200 min-w-[70px] transition-colors ${
                        hoveredCell?.col === colIdx ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 bg-slate-50/50'
                      }`}
                    >
                      <div className="truncate max-w-[85px] mx-auto" title={sec.name}>
                        {sec.name}
                      </div>
                      <div className={`text-[10px] font-mono ${sec.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {sec.changePercent >= 0 ? '+' : ''}{sec.changePercent.toFixed(1)}%
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-xs">
                {activeSectors.map((rowSec, rowIdx) => (
                  <tr key={rowSec.id}>
                    {/* Sticky Row Header */}
                    <td className={`p-2 text-left font-sans font-bold sticky left-0 z-10 border-r border-slate-200 transition-colors ${
                      hoveredCell?.row === rowIdx ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-50 text-slate-800'
                    }`}>
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate max-w-[75px]" title={rowSec.name}>
                          {rowSec.name}
                        </span>
                        <span className={`text-[9.5px] font-normal px-1 py-0.2 rounded ${
                          rowSec.category === 'industry' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {rowSec.category === 'industry' ? '行' : '概'}
                        </span>
                      </div>
                      <div className={`text-[10px] font-mono font-medium ${rowSec.mainNetInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {rowSec.mainNetInflow >= 0 ? '+' : ''}{rowSec.mainNetInflow.toFixed(1)}亿
                      </div>
                    </td>

                    {/* Correlation Matrix Cells */}
                    {activeSectors.map((colSec, colIdx) => {
                      const r = matrixData.matrix[rowIdx][colIdx];
                      const isHovered = (hoveredCell?.row === rowIdx && hoveredCell?.col === colIdx) ||
                                        (hoveredCell?.row === colIdx && hoveredCell?.col === rowIdx);
                      const isSelected = selectedPair && 
                        ((selectedPair.sectorA.id === rowSec.id && selectedPair.sectorB.id === colSec.id) ||
                         (selectedPair.sectorA.id === colSec.id && selectedPair.sectorB.id === rowSec.id));
                      const isDiagonal = rowIdx === colIdx;

                      return (
                        <td
                          key={colSec.id}
                          onClick={() => handleCellClick(rowIdx, colIdx)}
                          onMouseEnter={() => setHoveredCell({ row: rowIdx, col: colIdx })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className="p-1 border border-slate-200/50 cursor-pointer transition-all"
                        >
                          <div 
                            className={`w-full py-2 px-1 rounded-sm text-center font-mono text-[11.5px] transition-all flex flex-col items-center justify-center ${
                              getCorrelationColor(r, !!isHovered, !!isSelected)
                            }`}
                            title={`${rowSec.name} ↔ ${colSec.name}\n资金关联度 r = ${r >= 0 ? '+' : ''}${r.toFixed(2)}\n点击展开跨行业配置与对冲分析`}
                          >
                            <span>
                              {isDiagonal ? '1.00' : (r >= 0 ? `+${r.toFixed(2)}` : r.toFixed(2))}
                            </span>
                            {isDiagonal && (
                              <span className="text-[9px] opacity-70 scale-90">基准</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. Tab: Multi-Sector Portfolio Basket Simulator (组合测算器) */}
      {activeTab === 'portfolio' && (
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <PieIcon className="w-4 h-4 text-indigo-600" />
                <span>多板块持仓组合关联度与分散化测算器</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                模拟您的真实投资持仓篮子，测算多行业间的资金交叉相关性与马科维茨有效分散度。
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">快捷勾选板块 (最多10个):</span>
              <button
                onClick={() => setCustomSelectedIds(activeSectors.slice(0, 5).map(s => s.id))}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs transition-colors cursor-pointer font-medium"
              >
                重置为精选Top5
              </button>
            </div>
          </div>

          {/* Sector selection pills */}
          <div className="flex flex-wrap gap-1.5">
            {sectors.slice(0, 24).map(sec => {
              const isChecked = (scopeMode === 'custom' ? customSelectedIds : activeSectors.slice(0, 5).map(s => s.id)).includes(sec.id);
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    setScopeMode('custom');
                    toggleCustomSector(sec.id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all flex items-center space-x-1 cursor-pointer ${
                    isChecked
                      ? 'bg-indigo-600 border-indigo-700 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 text-white" />}
                  <span>{sec.name}</span>
                </button>
              );
            })}
          </div>

          {/* Assessment Output Card */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white border border-indigo-200/80 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex flex-col items-center justify-center font-mono shrink-0 shadow-sm">
                  <span className="text-lg font-black leading-none">{portfolioAssessment.diversificationScore}</span>
                  <span className="text-[9px] uppercase tracking-tighter">分散分</span>
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-sm">
                      投资篮子综合分散度评级:
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                      portfolioAssessment.diversificationScore >= 75
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : portfolioAssessment.diversificationScore >= 50
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {portfolioAssessment.diversificationLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {portfolioAssessment.riskOverlapDescription}
                  </p>
                </div>
              </div>

              <div className="text-right font-mono text-xs">
                <span className="text-slate-500">组合平均关联系数: </span>
                <span className="text-base font-bold text-indigo-700">
                  {portfolioAssessment.avgCorrelation >= 0 ? '+' : ''}{portfolioAssessment.avgCorrelation}
                </span>
              </div>
            </div>

            {/* Suggested Weightings and Roles */}
            <div className="pt-2 border-t border-slate-200">
              <div className="text-xs font-bold text-slate-700 mb-2">
                智能跨行业配比与角色分工建议：
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                {portfolioAssessment.weightingSuggestions.map(w => (
                  <div key={w.sectorName} className="p-2 rounded-lg bg-white border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-800">{w.sectorName}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        w.role === '进攻矛' 
                          ? 'bg-rose-100 text-rose-700' 
                          : w.role === '防守盾'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {w.role}
                      </span>
                    </div>
                    <div className="mt-1 flex items-baseline justify-between font-mono">
                      <span className="text-[11px] text-slate-500">建议仓位</span>
                      <span className="text-sm font-bold text-indigo-700">{w.weight}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab: Typical Pairs Leaderboards (典型配对榜) */}
      {activeTab === 'leaderboards' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Top 3 Positive Synergy */}
          <div className="bg-white rounded-xl p-4 border border-rose-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-rose-100 pb-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-rose-800">
                <Flame className="w-4 h-4 text-rose-600" />
                <span>进攻共振榜 (同频共振)</span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-mono">r &gt; +0.4</span>
            </div>
            <div className="space-y-2">
              {matrixData.topPositivePairs.slice(0, 4).map((pair, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPair(pair);
                    setActiveTab('matrix');
                  }}
                  className="p-2.5 rounded-lg bg-rose-50/50 hover:bg-rose-100/70 border border-rose-200/60 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{pair.sectorA.name} ↔ {pair.sectorB.name}</span>
                    <span className="font-mono text-rose-600 font-bold">+{pair.correlation.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {pair.coMovementDescription}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Negative Siphon / Hedging */}
          <div className="bg-white rounded-xl p-4 border border-emerald-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-800">
                <Shuffle className="w-4 h-4 text-emerald-600" />
                <span>跷跷板轮动榜 (负相关对冲)</span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-mono">r &lt; -0.2</span>
            </div>
            <div className="space-y-2">
              {matrixData.topNegativePairs.slice(0, 4).map((pair, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPair(pair);
                    setActiveTab('matrix');
                  }}
                  className="p-2.5 rounded-lg bg-emerald-50/50 hover:bg-emerald-100/70 border border-emerald-200/60 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{pair.sectorA.name} ↔ {pair.sectorB.name}</span>
                    <span className="font-mono text-emerald-600 font-bold">{pair.correlation.toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {pair.coMovementDescription}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top 3 Orthogonal Safe Haven */}
          <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>低相关独立池 (平滑波动)</span>
              </div>
              <span className="text-[10.5px] text-slate-400 font-mono">|r| ≈ 0</span>
            </div>
            <div className="space-y-2">
              {matrixData.topOrthogonalPairs.slice(0, 4).map((pair, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setSelectedPair(pair);
                    setActiveTab('matrix');
                  }}
                  className="p-2.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span>{pair.sectorA.name} ↔ {pair.sectorB.name}</span>
                    <span className="font-mono text-blue-600 font-bold">
                      {pair.correlation >= 0 ? '+' : ''}{pair.correlation.toFixed(2)}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    {pair.coMovementDescription}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. Selected Pair Deep Dive Allocation Workbench (跨行业对冲与配比工作台) */}
      {selectedPair && (
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-indigo-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
                <Activity className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>当前选中配对深度分析:</span>
                  <span className="text-indigo-600">{selectedPair.sectorA.name}</span>
                  <span className="text-slate-400">×</span>
                  <span className="text-indigo-600">{selectedPair.sectorB.name}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  资金相关性系数: <span className="font-mono font-bold text-slate-800">{selectedPair.correlation >= 0 ? `+${selectedPair.correlation.toFixed(2)}` : selectedPair.correlation.toFixed(2)}</span> · 判定为【{selectedPair.typeLabel}】
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              {onSelectSector && (
                <>
                  <button
                    onClick={() => onSelectSector(selectedPair.sectorA)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer transition-colors"
                  >
                    查看{selectedPair.sectorA.name}
                  </button>
                  <button
                    onClick={() => onSelectSector(selectedPair.sectorB)}
                    className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-medium cursor-pointer transition-colors"
                  >
                    查看{selectedPair.sectorB.name}
                  </button>
                </>
              )}
              {onOpenAIDiagnosis && (
                <button
                  onClick={() => onOpenAIDiagnosis(`${selectedPair.sectorA.name}与${selectedPair.sectorB.name}的资金相关性与跨行业配置策略`)}
                  className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1"
                >
                  <Sparkles className="w-3 h-3 text-indigo-600" />
                  <span>AI配置建议</span>
                </button>
              )}
            </div>
          </div>

          {/* Pair Comparison Cards & Allocation Guidance */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Sector A Card (4 cols) */}
            <div className="lg:col-span-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-900 text-sm">{selectedPair.sectorA.name}</span>
                  <span className="text-[10px] text-slate-500 px-1 rounded bg-slate-200">
                    {selectedPair.sectorA.category === 'industry' ? '行业' : '概念'}
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold ${
                  selectedPair.sectorA.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {selectedPair.sectorA.changePercent >= 0 ? '+' : ''}{selectedPair.sectorA.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 font-sans">主力净流入:</span>
                <span className={`font-bold ${selectedPair.sectorA.mainNetInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedPair.sectorA.mainNetInflow >= 0 ? '+' : ''}{selectedPair.sectorA.mainNetInflow.toFixed(2)} 亿
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span className="font-sans">成交总额:</span>
                <span>{selectedPair.sectorA.totalTurnover.toFixed(1)} 亿</span>
              </div>
              {selectedPair.sectorA.leadStock && (
                <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-200 flex items-center justify-between">
                  <span>龙头: {selectedPair.sectorA.leadStock.name}</span>
                  <span className={`font-mono ${selectedPair.sectorA.leadStock.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    +{selectedPair.sectorA.leadStock.changePercent}%
                  </span>
                </div>
              )}
            </div>

            {/* Central Allocation Gauge (4 cols) */}
            <div className="lg:col-span-4 p-3.5 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col items-center justify-center space-y-2.5 text-center">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${selectedPair.badgeBg} ${selectedPair.badgeText} border`}>
                {selectedPair.typeLabel}
              </span>

              {/* Correlation Bar meter */}
              <div className="w-full space-y-1">
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>-1.0 (反向对冲)</span>
                  <span className="font-bold text-indigo-700">r = {selectedPair.correlation >= 0 ? `+${selectedPair.correlation.toFixed(2)}` : selectedPair.correlation.toFixed(2)}</span>
                  <span>+1.0 (同频共振)</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full relative overflow-hidden">
                  <div
                    className={`h-full ${selectedPair.correlation >= 0 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{
                      width: `${Math.abs(selectedPair.correlation) * 50}%`,
                      marginLeft: selectedPair.correlation >= 0 ? '50%' : `${(1 + selectedPair.correlation) * 50}%`
                    }}
                  />
                  <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400 -translate-x-1/2" />
                </div>
              </div>

              {/* Recommended ratio banner */}
              <div className="w-full bg-white p-2 rounded-lg border border-indigo-100 text-xs text-slate-700">
                <div className="font-bold text-indigo-900 text-xs mb-0.5">
                  推荐跨行业配置比例:
                </div>
                <div className="flex items-center justify-center space-x-2 font-mono text-sm font-black">
                  <span className="text-slate-800">{selectedPair.sectorA.name} {selectedPair.recommendedRatio.a}%</span>
                  <span className="text-slate-300">:</span>
                  <span className="text-slate-800">{selectedPair.sectorB.name} {selectedPair.recommendedRatio.b}%</span>
                </div>
                <div className="text-[10.5px] text-slate-500 mt-1 font-sans">
                  {selectedPair.recommendedRatio.reason}
                </div>
              </div>
            </div>

            {/* Sector B Card (4 cols) */}
            <div className="lg:col-span-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="font-bold text-slate-900 text-sm">{selectedPair.sectorB.name}</span>
                  <span className="text-[10px] text-slate-500 px-1 rounded bg-slate-200">
                    {selectedPair.sectorB.category === 'industry' ? '行业' : '概念'}
                  </span>
                </div>
                <span className={`text-xs font-mono font-bold ${
                  selectedPair.sectorB.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {selectedPair.sectorB.changePercent >= 0 ? '+' : ''}{selectedPair.sectorB.changePercent.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 font-sans">主力净流入:</span>
                <span className={`font-bold ${selectedPair.sectorB.mainNetInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedPair.sectorB.mainNetInflow >= 0 ? '+' : ''}{selectedPair.sectorB.mainNetInflow.toFixed(2)} 亿
                </span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span className="font-sans">成交总额:</span>
                <span>{selectedPair.sectorB.totalTurnover.toFixed(1)} 亿</span>
              </div>
              {selectedPair.sectorB.leadStock && (
                <div className="text-[11px] text-slate-600 pt-1.5 border-t border-slate-200 flex items-center justify-between">
                  <span>龙头: {selectedPair.sectorB.leadStock.name}</span>
                  <span className={`font-mono ${selectedPair.sectorB.leadStock.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    +{selectedPair.sectorB.leadStock.changePercent}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Allocation & Co-movement Thesis text */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-indigo-600" />
              <span>投资组合策略与协同特征：</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              {selectedPair.allocationAdvice}
            </p>
            <p className="text-slate-500 text-[11px]">
              <strong>资金动力学：</strong>{selectedPair.coMovementDescription}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
