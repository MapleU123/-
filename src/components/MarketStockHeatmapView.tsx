import React, { useState, useMemo } from 'react';
import {
  FileImage,
  Search,
  Filter,
  Sliders,
  Scale,
  Sparkles,
  TrendingUp,
  TrendingDown,
  LayoutGrid,
  Layers,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Info,
  Maximize2
} from 'lucide-react';
import { SectorFundFlow, SectorStock, MarketOverviewData } from '../types/market';
import {
  HeatmapStockItem,
  getMergedHeatmapStocks,
  groupStocksBySector,
  getStockHeatColor
} from '../data/marketStockHeatmapData';
import { StockHeatmapExportModal } from './StockHeatmapExportModal';
import { getRealtimeDateString, getRealtimeTimeString } from '../utils/marketDateUtils';

interface MarketStockHeatmapViewProps {
  sectors: SectorFundFlow[];
  overviewData?: MarketOverviewData;
  onSelectStock?: (stock: SectorStock, sectorName: string) => void;
  onOpenAIDiagnosis?: (title?: string) => void;
  onOpenReportExport?: () => void;
}

export const MarketStockHeatmapView: React.FC<MarketStockHeatmapViewProps> = ({
  sectors,
  overviewData,
  onSelectStock,
  onOpenAIDiagnosis,
  onOpenReportExport
}) => {
  // Filters & State
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [changeFilter, setChangeFilter] = useState<'all' | 'up' | 'down' | 'limitUp' | 'bigDrop'>('all');
  const [sizeMetric, setSizeMetric] = useState<'marketCap' | 'turnover'>('marketCap');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [hoveredStock, setHoveredStock] = useState<HeatmapStockItem | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Merge live sector data
  const allStocks = useMemo(() => {
    return getMergedHeatmapStocks(sectors);
  }, [sectors]);

  // Filter stocks
  const filteredStocks = useMemo(() => {
    return allStocks.filter(stk => {
      // 1. Group filter
      if (selectedGroup !== 'all' && stk.sectorGroup !== selectedGroup && stk.sector !== selectedGroup) {
        return false;
      }
      // 2. Change filter
      if (changeFilter === 'up' && stk.changePercent <= 0) return false;
      if (changeFilter === 'down' && stk.changePercent >= 0) return false;
      if (changeFilter === 'limitUp' && stk.changePercent < 9.5) return false;
      if (changeFilter === 'bigDrop' && stk.changePercent > -3.0) return false;

      // 3. Search query
      if (searchTerm.trim()) {
        const query = searchTerm.trim().toLowerCase();
        const matchName = stk.name.toLowerCase().includes(query);
        const matchCode = stk.code.includes(query);
        const matchSector = stk.sector.toLowerCase().includes(query);
        if (!matchName && !matchCode && !matchSector) return false;
      }

      return true;
    });
  }, [allStocks, selectedGroup, changeFilter, searchTerm]);

  // Group by sector
  const sectorClusters = useMemo(() => {
    return groupStocksBySector(filteredStocks);
  }, [filteredStocks]);

  // Breadth statistics for the filtered pool
  const stats = useMemo(() => {
    let up = 0;
    let down = 0;
    let flat = 0;
    let limitUp = 0;
    let limitDown = 0;
    let totalCap = 0;
    let totalTurnover = 0;
    let sumChange = 0;

    filteredStocks.forEach(s => {
      if (s.changePercent >= 9.5) limitUp++;
      if (s.changePercent <= -9.5) limitDown++;
      if (s.changePercent > 0.05) up++;
      else if (s.changePercent < -0.05) down++;
      else flat++;

      totalCap += s.marketCap;
      totalTurnover += s.turnover;
      sumChange += s.changePercent;
    });

    const avgChange = filteredStocks.length > 0 ? (sumChange / filteredStocks.length).toFixed(2) : '0.00';

    return {
      up,
      down,
      flat,
      limitUp,
      limitDown,
      totalCap,
      totalTurnover,
      avgChange
    };
  }, [filteredStocks]);

  // Click on stock
  const handleStockClick = (stk: HeatmapStockItem) => {
    if (onSelectStock) {
      onSelectStock(
        {
          code: stk.code,
          name: stk.name,
          price: stk.price,
          changePercent: stk.changePercent,
          mainNetInflow: stk.mainNetInflow,
          mainNetRatio: 12.5,
          turnover: stk.turnover,
          turnoverRate: stk.turnoverRate,
          superLargeInflow: stk.mainNetInflow * 0.7,
          largeInflow: stk.mainNetInflow * 0.3,
          mediumInflow: -stk.mainNetInflow * 0.4,
          smallInflow: -stk.mainNetInflow * 0.6,
          peRatio: stk.peRatio,
          marketCap: stk.marketCap
        },
        stk.sector
      );
    } else if (onOpenAIDiagnosis) {
      onOpenAIDiagnosis(`${stk.name}(${stk.code}) 资金量化深度诊断`);
    }
  };

  return (
    <div id="market-stock-heatmap-view" className="space-y-4">
      
      {/* 1. Header & Breadth Statistics Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg text-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-rose-950">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  A股全市场个股涨跌幅全景热力图
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  实时动态
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                  {getRealtimeTimeString()}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                按行业赛道聚合全市场核心个股，方块尺寸映射市值/成交额，色阶深度反映涨跌强弱
              </p>
            </div>
          </div>
        </div>

        {/* Action Button: Export High-Definition Image */}
        <div className="flex items-center space-x-3 flex-shrink-0">
          {onOpenReportExport && (
            <button
              id="btn-open-report-heatmap-export"
              onClick={onOpenReportExport}
              className="px-4 py-2 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold flex items-center space-x-2 shadow-lg shadow-rose-950/40 hover:shadow-rose-900/60 transition-all cursor-pointer border border-rose-400/30"
              title="在导出研报图片选项中查看并生成高清树状热力图（支持4K/8K母版、纯净/水印、四大主题风格）"
            >
              <FileImage className="w-4 h-4 text-rose-100" />
              <span>导出研报热力图 (4K/8K/多主题)</span>
            </button>
          )}
          <button
            id="btn-open-stock-heatmap-export"
            onClick={() => setIsExportModalOpen(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer"
            title="查看所见即所得的单屏热力图卡片导出"
          >
            <FileImage className="w-4 h-4 text-slate-400" />
            <span>极速长图导出</span>
          </button>
        </div>
      </div>

      {/* 2. Market Breadth Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-xs">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-slate-400 font-medium">上涨家数</span>
          <div className="flex items-center space-x-1 font-bold text-red-400 font-mono text-sm">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats.up} 家</span>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-slate-400 font-medium">下跌家数</span>
          <div className="flex items-center space-x-1 font-bold text-emerald-400 font-mono text-sm">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{stats.down} 家</span>
          </div>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-slate-400 font-medium">涨停板 (≥9.5%)</span>
          <span className="font-bold text-red-500 font-mono text-sm">{stats.limitUp} 只</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-slate-400 font-medium">样本平均涨幅</span>
          <span className={`font-bold font-mono text-sm ${Number(stats.avgChange) >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {Number(stats.avgChange) >= 0 ? '+' : ''}{stats.avgChange}%
          </span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-slate-400 font-medium">样本总成交额</span>
          <span className="font-bold text-slate-200 font-mono text-sm">{stats.totalTurnover.toFixed(0)} 亿元</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
          <span className="text-slate-400 font-medium">样本总市值</span>
          <span className="font-bold text-amber-300 font-mono text-sm">{(stats.totalCap / 10000).toFixed(1)} 万亿元</span>
        </div>
      </div>

      {/* 3. Toolbar: Category Filters, Metric Toggles, Search Box */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Sector Group Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-slate-500 font-semibold flex items-center space-x-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>板块分类:</span>
          </span>
          {[
            { id: 'all', label: '全部行业' },
            { id: '科技成长', label: '科技成长 (芯片/算力/AI)' },
            { id: '高端制造', label: '高端制造 (新能源/汽车/军工)' },
            { id: '大消费', label: '核心大消费 (白酒/医药/免税)' },
            { id: '大金融', label: '大金融 (银行/券商/保险)' },
            { id: '周期资源', label: '周期资源 (有色/煤炭/化工)' },
          ].map((grp) => {
            const isSel = selectedGroup === grp.id;
            return (
              <button
                key={grp.id}
                onClick={() => setSelectedGroup(grp.id)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                  isSel
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {grp.label}
              </button>
            );
          })}
        </div>

        {/* Right: Dimension Toggle & Search */}
        <div className="flex items-center space-x-2.5 flex-wrap">
          
          {/* Change Filter */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setChangeFilter('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                changeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
              }`}
            >
              全部涨跌
            </button>
            <button
              onClick={() => setChangeFilter('up')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                changeFilter === 'up' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              仅看上涨
            </button>
            <button
              onClick={() => setChangeFilter('down')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                changeFilter === 'down' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              仅看下跌
            </button>
            <button
              onClick={() => setChangeFilter('limitUp')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                changeFilter === 'limitUp' ? 'bg-rose-700 text-white shadow-xs' : 'text-slate-600'
              }`}
            >
              涨停 (≥9.5%)
            </button>
          </div>

          {/* Size Metric */}
          <div className="flex items-center space-x-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setSizeMetric('marketCap')}
              title="方块按总市值权重"
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                sizeMetric === 'marketCap' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              按总市值加权
            </button>
            <button
              onClick={() => setSizeMetric('turnover')}
              title="方块按今日成交额权重"
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
                sizeMetric === 'turnover' ? 'bg-white text-indigo-700 shadow-xs font-bold' : 'text-slate-600'
              }`}
            >
              按成交额加权
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="搜索股票/代码 (如 宁德时代)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 w-36 sm:w-48 font-medium"
            />
          </div>

        </div>

      </div>

      {/* 4. Heatmap Main Canvas Viewport */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl text-slate-100 min-h-[580px]">
        
        {/* Sector Clusters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {sectorClusters.map((cluster) => {
            return (
              <div
                key={cluster.name}
                className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm hover:border-slate-700 transition-all"
              >
                {/* Cluster Header */}
                <div className="px-3 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-white tracking-tight">{cluster.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">({cluster.stocks.length}只)</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {(cluster.totalMarketCap / 10000).toFixed(1)}万亿
                    </span>
                    <span
                      className={`font-mono font-bold text-xs ${
                        cluster.avgChangePercent >= 0 ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {cluster.avgChangePercent >= 0 ? '+' : ''}{cluster.avgChangePercent.toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* Stocks Tiles Matrix inside Cluster */}
                <div className="p-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1 content-start">
                  {cluster.stocks.map((stk) => {
                    const colorStyle = getStockHeatColor(stk.changePercent);
                    const isHovered = hoveredStock?.code === stk.code;
                    const isSearchMatch = searchTerm.trim() 
                      ? (stk.name.includes(searchTerm) || stk.code.includes(searchTerm))
                      : true;

                    return (
                      <div
                        key={stk.code}
                        onClick={() => handleStockClick(stk)}
                        onMouseEnter={() => setHoveredStock(stk)}
                        onMouseLeave={() => setHoveredStock(null)}
                        className={`relative rounded-lg p-2.5 transition-all duration-150 cursor-pointer border flex flex-col justify-between select-none ${
                          colorStyle.bg
                        } ${colorStyle.borderColor} ${
                          isHovered ? 'scale-105 z-20 shadow-lg ring-2 ring-white/60' : 'shadow-xs'
                        } ${!isSearchMatch ? 'opacity-30' : 'opacity-100'}`}
                        style={{
                          minHeight: '74px'
                        }}
                      >
                        {/* Top: Name & Code */}
                        <div className="flex items-start justify-between">
                          <span className="font-bold text-xs text-white tracking-tight drop-shadow-xs truncate max-w-[85px]">
                            {stk.name}
                          </span>
                          <span className="text-[10px] font-mono text-white/75">
                            {stk.code}
                          </span>
                        </div>

                        {/* Middle: Change Percent */}
                        <div className="mt-1 flex items-baseline justify-between">
                          <span className="font-mono font-black text-sm text-white drop-shadow-xs">
                            {stk.changePercent >= 0 ? '+' : ''}{stk.changePercent.toFixed(2)}%
                          </span>
                          <span className="font-mono text-[11px] text-white/90">
                            ¥{stk.price.toFixed(1)}
                          </span>
                        </div>

                        {/* Bottom: Cap or Turnover */}
                        <div className="mt-1 text-[10px] font-mono text-white/80 flex items-center justify-between border-t border-white/10 pt-1">
                          <span>
                            {sizeMetric === 'marketCap'
                              ? `${stk.marketCap > 10000 ? (stk.marketCap / 10000).toFixed(1) + '万亿' : stk.marketCap.toFixed(0) + '亿'}`
                              : `成交 ${stk.turnover.toFixed(0)}亿`}
                          </span>
                          {stk.changePercent >= 9.5 && (
                            <span className="px-1 rounded text-[9px] font-bold bg-amber-400 text-red-950">
                              涨停
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {sectorClusters.length === 0 && (
          <div className="py-24 text-center space-y-3">
            <Info className="w-8 h-8 text-slate-500 mx-auto" />
            <p className="text-sm text-slate-400">没有符合筛选条件的个股标的</p>
            <button
              onClick={() => {
                setSelectedGroup('all');
                setChangeFilter('all');
                setSearchTerm('');
              }}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
            >
              重置筛选条件
            </button>
          </div>
        )}

        {/* Floating Stock Details Tooltip on Hover */}
        {hoveredStock && (
          <div className="fixed bottom-6 right-6 z-40 bg-slate-900/95 border border-slate-700 text-slate-100 p-4 rounded-xl shadow-2xl backdrop-blur-md w-72 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="font-bold text-sm text-white">{hoveredStock.name}</span>
                <span className="font-mono text-xs text-slate-400 ml-1.5">{hoveredStock.code}</span>
              </div>
              <span className={`font-mono font-bold text-sm ${hoveredStock.changePercent >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {hoveredStock.changePercent >= 0 ? '+' : ''}{hoveredStock.changePercent.toFixed(2)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
              <div>
                <span className="text-slate-400 text-[11px]">最新价:</span>
                <span className="font-mono font-bold ml-1 text-white">¥{hoveredStock.price.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">主力净流:</span>
                <span className={`font-mono font-bold ml-1 ${hoveredStock.mainNetInflow >= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {hoveredStock.mainNetInflow >= 0 ? '+' : ''}{hoveredStock.mainNetInflow.toFixed(1)}亿
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">总市值:</span>
                <span className="font-mono ml-1 text-slate-200">
                  {hoveredStock.marketCap > 10000 ? (hoveredStock.marketCap / 10000).toFixed(1) + '万亿' : hoveredStock.marketCap.toFixed(0) + '亿'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">今日成交:</span>
                <span className="font-mono ml-1 text-slate-200">{hoveredStock.turnover.toFixed(1)}亿</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">换手率:</span>
                <span className="font-mono ml-1 text-slate-200">{hoveredStock.turnoverRate.toFixed(2)}%</span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px]">所属板块:</span>
                <span className="ml-1 text-indigo-300">{hoveredStock.sector}</span>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">点击查看深度诊断</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAIDiagnosis && onOpenAIDiagnosis(`${hoveredStock.name}(${hoveredStock.code}) 深度量化诊断`);
                }}
                className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>AI诊断</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 5. Bottom Color Scale Legend */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-300">涨跌色阶参照:</span>
          <div className="flex items-center space-x-1">
            <span className="px-2 py-0.5 rounded bg-emerald-800 text-white font-mono text-[10px]">≤-7% 跌停</span>
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-mono text-[10px]">-3%</span>
            <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-[10px]">0% 平盘</span>
            <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[10px]">+3%</span>
            <span className="px-2 py-0.5 rounded bg-red-700 text-white font-mono text-[10px]">≥+7% 涨停</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-[11.5px]">
          <span>提示: 点击任意个股方块即可进入个股分时与量化资金分析</span>
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="text-rose-400 hover:text-rose-300 underline font-semibold cursor-pointer"
          >
            导出高清图片
          </button>
        </div>
      </div>

      {/* 6. High Definition Image Export Modal */}
      <StockHeatmapExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        stocks={filteredStocks}
        overviewData={overviewData}
        initialTheme="dark"
        initialResolution="4k"
      />

    </div>
  );
};
