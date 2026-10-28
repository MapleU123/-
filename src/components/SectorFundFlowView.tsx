import React, { useState, useMemo } from 'react';
import { SectorFundFlow, SectorCategory, TimeDimension } from '../types/market';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Layers, 
  LayoutGrid, 
  Compass, 
  ArrowUpDown, 
  ChevronRight,
  Flame,
  Zap,
  Info,
  Scale
} from 'lucide-react';
import { SectorCorrelationHeatmap } from './SectorCorrelationHeatmap';

interface SectorFundFlowViewProps {
  sectors: SectorFundFlow[];
  onSelectSector: (sector: SectorFundFlow) => void;
  onOpenAIDiagnosisForSector?: (sectorName: string) => void;
}

type SortField = 'mainNetInflow' | 'mainNetRatio' | 'changePercent' | 'totalTurnover' | 'superLargeInflow';
type ViewMode = 'table' | 'heatmap' | 'quadrant' | 'correlation';

export const SectorFundFlowView: React.FC<SectorFundFlowViewProps> = ({ 
  sectors, 
  onSelectSector,
  onOpenAIDiagnosisForSector 
}) => {
  const [activeCategory, setActiveCategory] = useState<SectorCategory>('industry');
  const [activeTimeDim, setActiveTimeDim] = useState<TimeDimension>('today');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [sortField, setSortField] = useState<SortField>('mainNetInflow');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Filter & Sort
  const filteredSectors = useMemo(() => {
    let list = sectors.filter(s => s.category === activeCategory);
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(term) || 
        s.leadStock.name.toLowerCase().includes(term) ||
        s.leadStock.code.includes(term)
      );
    }

    list.sort((a, b) => {
      let valA = a[sortField] || 0;
      let valB = b[sortField] || 0;
      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    return list;
  }, [sectors, activeCategory, searchTerm, sortField, sortAsc]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  return (
    <div id="sector-fund-flow-module" className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 shadow-xl">
      {/* Top Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 pb-4 border-b border-slate-800">
        {/* Left: Category Tabs */}
        <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-slate-950/80 border border-slate-800/80 w-fit">
          <button
            id="tab-industry-sectors"
            onClick={() => setActiveCategory('industry')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeCategory === 'industry'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            行业板块
          </button>
          <button
            id="tab-concept-sectors"
            onClick={() => setActiveCategory('concept')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeCategory === 'concept'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            概念板块
          </button>
          <button
            id="tab-region-sectors"
            onClick={() => setActiveCategory('region')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeCategory === 'region'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            地域板块
          </button>
        </div>

        {/* Middle: Time Dimension & View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Time Dimension */}
          <div className="flex items-center space-x-1 p-1 rounded-lg bg-slate-950/80 border border-slate-800/80">
            {(['today', '3d', '5d', '10d', '20d'] as TimeDimension[]).map((dim) => {
              const labelMap: Record<TimeDimension, string> = {
                today: '今日实时',
                '3d': '3日',
                '5d': '5日',
                '10d': '10日',
                '20d': '20日'
              };
              return (
                <button
                  key={dim}
                  onClick={() => setActiveTimeDim(dim)}
                  className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                    activeTimeDim === dim
                      ? 'bg-slate-800 text-amber-300 font-bold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {labelMap[dim]}
                </button>
              );
            })}
          </div>

          {/* View Mode */}
          <div className="flex items-center space-x-1 p-1 rounded-lg bg-slate-950/80 border border-slate-800/80">
            <button
              onClick={() => setViewMode('table')}
              title="表格排行榜"
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'table' ? 'bg-slate-800 text-rose-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('heatmap')}
              title="资金热力图"
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'heatmap' ? 'bg-slate-800 text-rose-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('quadrant')}
              title="板块轮动四象限"
              className={`p-1.5 rounded text-xs transition-colors ${
                viewMode === 'quadrant' ? 'bg-slate-800 text-rose-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('correlation')}
              title="板块关联度热力图 (跨行业配置)"
              className={`px-2 py-1 rounded text-xs transition-colors flex items-center space-x-1 ${
                viewMode === 'correlation' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">关联度</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索板块/龙头个股..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500 w-36 sm:w-44"
            />
          </div>
        </div>
      </div>

      {/* VIEW 1: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">板块名称</th>
                <th 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('changePercent')}
                >
                  <div className="flex items-center space-x-1">
                    <span>涨跌幅</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-200"
                  onClick={() => handleSort('mainNetInflow')}
                >
                  <div className="flex items-center space-x-1">
                    <span>主力净流入 (亿)</span>
                    <ArrowUpDown className="w-3 h-3 text-rose-400" />
                  </div>
                </th>
                <th 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-200 hidden md:table-cell"
                  onClick={() => handleSort('mainNetRatio')}
                >
                  <div className="flex items-center space-x-1">
                    <span>主力净占比</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-200 hidden lg:table-cell"
                  onClick={() => handleSort('superLargeInflow')}
                >
                  <div className="flex items-center space-x-1">
                    <span>超大单净流入</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th 
                  className="py-2.5 px-3 cursor-pointer hover:text-slate-200 hidden sm:table-cell"
                  onClick={() => handleSort('totalTurnover')}
                >
                  <div className="flex items-center space-x-1">
                    <span>成交额 (亿)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-2.5 px-3">领涨龙头股票</th>
                <th className="py-2.5 px-2 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredSectors.map((sector, index) => {
                const isInflow = sector.mainNetInflow >= 0;
                const isPriceUp = sector.changePercent >= 0;
                const flowColor = isInflow ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold';
                const priceColor = isPriceUp ? 'text-rose-400' : 'text-emerald-400';

                return (
                  <tr
                    key={sector.id}
                    id={`sector-row-${sector.id}`}
                    onClick={() => onSelectSector(sector)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors group"
                  >
                    {/* Sector Name */}
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center space-x-2">
                        <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold ${
                          index === 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                          index === 1 ? 'bg-slate-700/50 text-slate-300' :
                          index === 2 ? 'bg-amber-900/30 text-amber-600' : 'text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-100 group-hover:text-rose-300 transition-colors flex items-center gap-1.5">
                            {sector.name}
                            {sector.inflowMomentum > 90 && (
                              <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500 animate-pulse" />
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-normal">
                            上涨 {sector.upCount}家 / 下跌 {sector.downCount}家
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Change Percent */}
                    <td className={`py-3 px-3 ${priceColor} font-bold text-xs`}>
                      {isPriceUp ? '+' : ''}{sector.changePercent.toFixed(2)}%
                    </td>

                    {/* Main Net Inflow */}
                    <td className={`py-3 px-3 ${flowColor} text-sm`}>
                      {isInflow ? '+' : ''}{sector.mainNetInflow.toFixed(2)}
                    </td>

                    {/* Main Net Ratio */}
                    <td className="py-3 px-3 text-slate-300 hidden md:table-cell">
                      <span className={`px-2 py-0.5 rounded text-[11px] ${
                        sector.mainNetRatio > 0 ? 'bg-rose-950/40 text-rose-300 border border-rose-800/40' : 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40'
                      }`}>
                        {sector.mainNetRatio > 0 ? '+' : ''}{sector.mainNetRatio.toFixed(1)}%
                      </span>
                    </td>

                    {/* Super Large Order */}
                    <td className="py-3 px-3 text-slate-300 hidden lg:table-cell">
                      <span className={sector.superLargeInflow > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                        {sector.superLargeInflow > 0 ? '+' : ''}{sector.superLargeInflow.toFixed(2)} 亿
                      </span>
                    </td>

                    {/* Total Turnover */}
                    <td className="py-3 px-3 text-slate-400 hidden sm:table-cell">
                      {sector.totalTurnover.toFixed(1)}
                    </td>

                    {/* Leading Stock */}
                    <td className="py-3 px-3 font-sans">
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-semibold text-slate-200">
                            {sector.leadStock.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {sector.leadStock.code}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-mono font-bold ${
                            sector.leadStock.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                          }`}>
                            {sector.leadStock.changePercent >= 0 ? '+' : ''}{sector.leadStock.changePercent.toFixed(2)}%
                          </span>
                          <div className="text-[10px] text-slate-400 font-mono">
                            +{sector.leadStock.mainNetInflow}亿
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3 px-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSector(sector);
                        }}
                        className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-slate-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VIEW 2: HEATMAP TREEMAP */}
      {viewMode === 'heatmap' && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span>区块大小 = 成交总额；颜色深浅 = 主力资金净流入额</span>
            <div className="flex items-center space-x-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-600"></span> 强净流入
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-950/80 border border-rose-800"></span> 轻度流入
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-950/80 border border-emerald-800"></span> 净流出
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredSectors.map((sector) => {
              const isInflow = sector.mainNetInflow >= 0;
              const intensity = Math.min(100, Math.abs(sector.mainNetInflow) * 2);

              return (
                <div
                  key={sector.id}
                  onClick={() => onSelectSector(sector)}
                  className={`p-3.5 rounded-xl border transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg ${
                    isInflow
                      ? 'bg-gradient-to-br from-rose-950/60 to-slate-900 border-rose-800/40 hover:border-rose-500'
                      : 'bg-gradient-to-br from-emerald-950/60 to-slate-900 border-emerald-800/40 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-slate-100 truncate">
                      {sector.name}
                    </span>
                    <span className={`text-xs font-mono font-bold ${
                      sector.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {sector.changePercent >= 0 ? '+' : ''}{sector.changePercent.toFixed(2)}%
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between mb-2">
                    <span className="text-xs text-slate-400">主力净流入</span>
                    <span className={`text-base font-bold font-mono ${
                      isInflow ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {isInflow ? '+' : ''}{sector.mainNetInflow.toFixed(2)} <span className="text-xs font-normal">亿</span>
                    </span>
                  </div>

                  {/* Meter bar */}
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full ${isInflow ? 'bg-rose-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.max(15, intensity)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 border-t border-slate-800/60">
                    <span>龙头: {sector.leadStock.name}</span>
                    <span className="font-mono text-slate-300">
                      +{sector.leadStock.changePercent}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 3: ROTATION QUADRANT RADAR */}
      {viewMode === 'quadrant' && (
        <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-rose-400" />
              <span className="font-semibold text-slate-200">板块资金与动能轮动四象限矩阵</span>
            </div>
            <span className="text-[11px] text-slate-500">
              横轴：主力资金净流入强度 | 纵轴：板块涨跌幅动能
            </span>
          </div>

          <div className="relative w-full h-80 bg-slate-900/90 rounded-lg border border-slate-800 overflow-hidden">
            {/* Quadrant Axis Lines */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-700/80 border-r border-dashed border-slate-600" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-700/80 border-b border-dashed border-slate-600" />

            {/* Quadrant Labels */}
            <div className="absolute top-2 right-2 text-[11px] font-bold text-rose-400/90 bg-rose-950/50 px-2 py-1 rounded border border-rose-800/40">
              🚀 资金主升龙头区 (量价齐升)
            </div>
            <div className="absolute bottom-2 right-2 text-[11px] font-bold text-amber-400/90 bg-amber-950/50 px-2 py-1 rounded border border-amber-800/40">
              🧲 潜伏吸筹区 (资金大幅流入 / 涨幅蓄势)
            </div>
            <div className="absolute top-2 left-2 text-[11px] font-bold text-orange-400/90 bg-orange-950/50 px-2 py-1 rounded border border-orange-800/40">
              ⚠️ 高位出逃区 (价格上涨 / 主力净流出)
            </div>
            <div className="absolute bottom-2 left-2 text-[11px] font-bold text-slate-400 bg-slate-800/80 px-2 py-1 rounded border border-slate-700">
              📉 弱势震荡区 (量价承压)
            </div>

            {/* Scatter Sector Nodes */}
            {filteredSectors.map((sector) => {
              // Map sector.mainNetInflow (-25 to +50) to X% (10% to 90%)
              const minFlow = -25;
              const maxFlow = 50;
              const clampedFlow = Math.max(minFlow, Math.min(maxFlow, sector.mainNetInflow));
              const xPercent = ((clampedFlow - minFlow) / (maxFlow - minFlow)) * 80 + 10;

              // Map sector.changePercent (-3% to +6%) to Y% (90% to 10%)
              const minPrice = -3;
              const maxPrice = 6;
              const clampedPrice = Math.max(minPrice, Math.min(maxPrice, sector.changePercent));
              const yPercent = 90 - ((clampedPrice - minPrice) / (maxPrice - minPrice)) * 80;

              return (
                <div
                  key={sector.id}
                  onClick={() => onSelectSector(sector)}
                  style={{ left: `${xPercent}%`, top: `${yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                >
                  <div className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[11px] font-semibold border shadow-md transition-transform group-hover:scale-110 group-hover:z-30 ${
                    sector.mainNetInflow > 0
                      ? 'bg-rose-900/90 text-rose-100 border-rose-500/80'
                      : 'bg-slate-800/90 text-slate-200 border-slate-700'
                  }`}>
                    <span>{sector.name}</span>
                    <span className="font-mono text-[10px] opacity-90">
                      {sector.mainNetInflow > 0 ? '+' : ''}{sector.mainNetInflow.toFixed(0)}亿
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Correlation Heatmap View */}
      {viewMode === 'correlation' && (
        <div className="mt-4">
          <SectorCorrelationHeatmap
            sectors={filteredSectors}
            onSelectSector={onSelectSector}
            onOpenAIDiagnosis={onOpenAIDiagnosisForSector}
          />
        </div>
      )}
    </div>
  );
};
