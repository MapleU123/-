import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Edit3, 
  Trash2, 
  Plus, 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  Coins, 
  ArrowUpDown, 
  BarChart2, 
  Share2, 
  Camera, 
  Check, 
  AlertTriangle,
  Search,
  ExternalLink,
  BrainCircuit,
  PieChart,
  Activity
} from 'lucide-react';
import { CustomSector, CustomSectorFundFlow } from '../types/customSector';
import { SectorStock } from '../types/market';
import { customSectorService } from '../services/customSectorService';
import { CustomSectorModal } from './CustomSectorModal';

interface CustomSectorsViewProps {
  onOpenAIDiagnosis?: (stockName?: string) => void;
  onSelectStock?: (stock: { code: string; name: string }) => void;
  onOpenExportImage?: (context?: string, template?: any) => void;
}

type SortField = 'mainNetInflow' | 'changePercent' | 'price' | 'mainNetRatio' | 'turnover' | 'turnoverRate';

export const CustomSectorsView: React.FC<CustomSectorsViewProps> = ({
  onOpenAIDiagnosis,
  onSelectStock,
  onOpenExportImage
}) => {
  const [sectors, setSectors] = useState<CustomSector[]>([]);
  const [activeSectorId, setActiveSectorId] = useState<string>('');
  const [activeFundFlow, setActiveFundFlow] = useState<CustomSectorFundFlow | null>(null);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sectorToEdit, setSectorToEdit] = useState<CustomSector | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Sorting state for constituent stocks table
  const [sortField, setSortField] = useState<SortField>('mainNetInflow');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Load custom sectors
  const refreshSectors = () => {
    const list = customSectorService.getCustomSectors();
    setSectors(list);
    if (list.length > 0) {
      if (!activeSectorId || !list.some(s => s.id === activeSectorId)) {
        setActiveSectorId(list[0].id);
      }
    } else {
      setActiveSectorId('');
      setActiveFundFlow(null);
    }
  };

  useEffect(() => {
    refreshSectors();
  }, []);

  // Update fund flow when active sector changes
  useEffect(() => {
    if (activeSectorId) {
      const sec = customSectorService.getCustomSectorById(activeSectorId);
      if (sec) {
        const flow = customSectorService.calculateFundFlow(sec);
        setActiveFundFlow(flow);
      }
    }
  }, [activeSectorId, sectors]);

  const activeSector = sectors.find(s => s.id === activeSectorId);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDeleteSector = (id: string) => {
    customSectorService.deleteCustomSector(id);
    setDeleteConfirmId(null);
    refreshSectors();
  };

  const handleRemoveStock = (code: string) => {
    if (!activeSectorId) return;
    customSectorService.removeStockFromSector(activeSectorId, code);
    refreshSectors();
  };

  // Sorted constituent stocks
  const sortedStocks = activeFundFlow ? [...activeFundFlow.stocks].sort((a, b) => {
    let diff = 0;
    if (sortField === 'mainNetInflow') diff = b.mainNetInflow - a.mainNetInflow;
    else if (sortField === 'changePercent') diff = b.changePercent - a.changePercent;
    else if (sortField === 'price') diff = b.price - a.price;
    else if (sortField === 'mainNetRatio') diff = b.mainNetRatio - a.mainNetRatio;
    else if (sortField === 'turnover') diff = b.turnover - a.turnover;
    else if (sortField === 'turnoverRate') diff = b.turnoverRate - a.turnoverRate;
    return sortOrder === 'desc' ? diff : -diff;
  }) : [];

  // Global aggregate stats across all custom sectors
  const totalCustomStocksCount = new Set(sectors.flatMap(s => s.stocks.map(st => st.code))).size;
  const allFlows = sectors.map(s => customSectorService.calculateFundFlow(s));
  const topInflowSector = [...allFlows].sort((a, b) => b.mainNetInflow - a.mainNetInflow)[0];
  const topGainSector = [...allFlows].sort((a, b) => b.changePercent - a.changePercent)[0];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* 1. Header Banner & High-Level Summary */}
      <div className="bg-gradient-to-r from-[#0b1329] via-[#111e40] to-[#182654] p-5 rounded-2xl border border-slate-800 text-white shadow-xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>个性化自定义板块</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono font-bold">
                  CUSTOM SECTOR
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              自由创建专属投资板块，纳入力度股票，一站式穿透统计主力超大单与大单资金流入、板块加权涨跌幅与日内资金动向。
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setSectorToEdit(null);
                setIsModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <FolderPlus className="w-4 h-4" />
              <span>新建自定义板块</span>
            </button>
            {activeFundFlow && (
              <button
                onClick={() => onOpenExportImage?.('custom_sectors', 'fundflow_panorama')}
                className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all cursor-pointer flex items-center gap-1.5"
                title="导出当前自定义板块研报长图"
              >
                <Camera className="w-4 h-4 text-rose-400" />
                <span>导出研报</span>
              </button>
            )}
          </div>
        </div>

        {/* 4 Key Global KPI Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80 text-xs">
          <div className="bg-[#0e1733]/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">自定义板块总数</div>
            <div className="text-lg font-black font-mono text-white mt-0.5">
              {sectors.length} <span className="text-[10px] font-normal text-slate-400">个</span>
            </div>
          </div>
          <div className="bg-[#0e1733]/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">全板块监控股票数</div>
            <div className="text-lg font-black font-mono text-cyan-400 mt-0.5">
              {totalCustomStocksCount} <span className="text-[10px] font-normal text-slate-400">只去重</span>
            </div>
          </div>
          <div className="bg-[#0e1733]/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">今日主力吸金榜首</div>
            <div className="text-sm font-black text-rose-400 mt-1 truncate">
              {topInflowSector ? `${topInflowSector.name} (+${topInflowSector.mainNetInflow}亿)` : '-'}
            </div>
          </div>
          <div className="bg-[#0e1733]/80 p-3 rounded-xl border border-slate-800">
            <div className="text-slate-400 text-[11px]">今日收益最佳板块</div>
            <div className="text-sm font-black text-amber-400 mt-1 truncate">
              {topGainSector ? `${topGainSector.name} (${topGainSector.changePercent > 0 ? '+' : ''}${topGainSector.changePercent}%)` : '-'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Custom Sector Capsule Tabs Selector */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200/90 shadow-2xs space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-rose-500" />
            <span>我的自定义板块列表</span>
          </span>
          <button
            onClick={() => {
              setSectorToEdit(null);
              setIsModalOpen(true);
            }}
            className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>创建新板块</span>
          </button>
        </div>

        {sectors.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
            暂无自定义板块，点击上方「新建自定义板块」快速创建
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {sectors.map(sec => {
              const isActive = sec.id === activeSectorId;
              const flow = customSectorService.calculateFundFlow(sec);
              const isUp = flow.changePercent >= 0;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSectorId(sec.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                    isActive
                      ? 'bg-gradient-to-r from-slate-900 to-slate-800 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    sec.tagColor === 'rose' ? 'bg-rose-500' :
                    sec.tagColor === 'emerald' ? 'bg-emerald-500' :
                    sec.tagColor === 'indigo' ? 'bg-indigo-500' :
                    sec.tagColor === 'amber' ? 'bg-amber-500' :
                    sec.tagColor === 'purple' ? 'bg-purple-500' : 'bg-cyan-500'
                  }`} />
                  <span>{sec.name}</span>
                  <span className={`text-[10.5px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-600'
                  }`}>
                    {sec.stocks.length}只
                  </span>
                  <span className={`font-mono text-[11px] font-bold ${
                    isUp ? (isActive ? 'text-rose-300' : 'text-rose-600') : (isActive ? 'text-emerald-300' : 'text-emerald-600')
                  }`}>
                    {isUp ? '+' : ''}{flow.changePercent.toFixed(2)}%
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Active Sector Detail & Fund Flow Dashboard */}
      {activeSector && activeFundFlow && (
        <div className="space-y-4">
          {/* Active Sector Action Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900">{activeSector.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                  创建于 {activeSector.createdAt}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{activeSector.description || '个性化自选跟踪板块'}</p>
            </div>

            {/* Edit / Add Stock / Delete Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSectorToEdit(activeSector);
                  setIsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="编辑板块名称与成分股"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                <span>编辑 / 增减股票</span>
              </button>

              {deleteConfirmId === activeSector.id ? (
                <div className="flex items-center gap-1 bg-red-50 p-1 rounded-lg border border-red-200 animate-in fade-in">
                  <span className="text-[11px] text-red-700 font-bold px-1">确认删除?</span>
                  <button
                    onClick={() => handleDeleteSector(activeSector.id)}
                    className="px-2 py-0.5 bg-red-600 text-white rounded text-[11px] font-bold cursor-pointer"
                  >
                    确定
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(null)}
                    className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded text-[11px] cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirmId(activeSector.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                  title="删除该自定义板块"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除板块</span>
                </button>
              )}
            </div>
          </div>

          {/* Fund Flow Real-time Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {/* 1. Main Inflow */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="text-slate-400 text-[11px] font-medium">主力净流入</div>
              <div className={`text-xl font-black font-mono mt-1 ${
                activeFundFlow.mainNetInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {activeFundFlow.mainNetInflow >= 0 ? '+' : ''}{activeFundFlow.mainNetInflow.toFixed(2)}
                <span className="text-xs font-normal text-slate-400 ml-1">亿元</span>
              </div>
            </div>

            {/* 2. Change Percent */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="text-slate-400 text-[11px] font-medium">综合涨跌幅</div>
              <div className={`text-xl font-black font-mono mt-1 ${
                activeFundFlow.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {activeFundFlow.changePercent >= 0 ? '+' : ''}{activeFundFlow.changePercent.toFixed(2)}%
              </div>
            </div>

            {/* 3. Main Net Ratio */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="text-slate-400 text-[11px] font-medium">主力净占比</div>
              <div className={`text-xl font-black font-mono mt-1 ${
                activeFundFlow.mainNetRatio >= 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}>
                {activeFundFlow.mainNetRatio >= 0 ? '+' : ''}{activeFundFlow.mainNetRatio.toFixed(2)}%
              </div>
            </div>

            {/* 4. Total Turnover */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="text-slate-400 text-[11px] font-medium">总成交额</div>
              <div className="text-xl font-black font-mono text-slate-800 mt-1">
                {activeFundFlow.totalTurnover.toFixed(1)}
                <span className="text-xs font-normal text-slate-400 ml-1">亿元</span>
              </div>
            </div>

            {/* 5. Turnover Rate */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="text-slate-400 text-[11px] font-medium">平均换手率</div>
              <div className="text-xl font-black font-mono text-slate-800 mt-1">
                {activeFundFlow.turnoverRate.toFixed(2)}%
              </div>
            </div>

            {/* 6. Up/Down Breadth */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-2xs">
              <div className="text-slate-400 text-[11px] font-medium">成分股涨跌分布</div>
              <div className="flex items-center gap-1.5 mt-1 font-mono text-sm font-bold">
                <span className="text-rose-600">{activeFundFlow.upCount} 涨</span>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">{activeFundFlow.flatCount} 平</span>
                <span className="text-slate-400">•</span>
                <span className="text-emerald-600">{activeFundFlow.downCount} 跌</span>
              </div>
            </div>
          </div>

          {/* 4-Tier Order Breakdown Strip & Champions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* Left: 4-Tier Order Breakdown */}
            <div className="lg:col-span-2 bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>主力与散户四单流向拆解</span>
                </span>
                <span className="text-[11px] font-normal text-slate-400">单位: 亿元</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-100">
                  <div className="text-[11px] text-rose-700 font-bold">超大单 (&gt;100万)</div>
                  <div className={`font-mono font-black text-sm mt-1 ${activeFundFlow.superLargeInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {activeFundFlow.superLargeInflow >= 0 ? '+' : ''}{activeFundFlow.superLargeInflow.toFixed(2)}亿
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-red-50/50 border border-red-100">
                  <div className="text-[11px] text-red-700 font-bold">大单 (20-100万)</div>
                  <div className={`font-mono font-black text-sm mt-1 ${activeFundFlow.largeInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {activeFundFlow.largeInflow >= 0 ? '+' : ''}{activeFundFlow.largeInflow.toFixed(2)}亿
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/50 border border-blue-100">
                  <div className="text-[11px] text-blue-700 font-bold">中单 (4-20万)</div>
                  <div className={`font-mono font-black text-sm mt-1 ${activeFundFlow.mediumInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {activeFundFlow.mediumInflow >= 0 ? '+' : ''}{activeFundFlow.mediumInflow.toFixed(2)}亿
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-600 font-bold">小单 (&lt;4万)</div>
                  <div className={`font-mono font-black text-sm mt-1 ${activeFundFlow.smallInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {activeFundFlow.smallInflow >= 0 ? '+' : ''}{activeFundFlow.smallInflow.toFixed(2)}亿
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Lead & Top Inflow Stocks */}
            <div className="bg-white p-4 rounded-xl border border-slate-200/90 shadow-2xs space-y-2.5">
              <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>板块核心标杆</span>
              </div>
              <div className="space-y-2 text-xs">
                {activeFundFlow.leadStock && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/60 border border-rose-100">
                    <div>
                      <span className="text-[10px] font-bold text-rose-700 uppercase">领涨先锋</span>
                      <div className="font-bold text-slate-900 mt-0.5">{activeFundFlow.leadStock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600">+{activeFundFlow.leadStock.changePercent.toFixed(2)}%</div>
                      <div className="font-mono text-[10.5px] text-slate-500">¥{activeFundFlow.leadStock.price.toFixed(2)}</div>
                    </div>
                  </div>
                )}
                {activeFundFlow.topInflowStock && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-100">
                    <div>
                      <span className="text-[10px] font-bold text-amber-700 uppercase">吸金龙头</span>
                      <div className="font-bold text-slate-900 mt-0.5">{activeFundFlow.topInflowStock.name}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-rose-600">+{activeFundFlow.topInflowStock.mainNetInflow.toFixed(2)}亿</div>
                      <div className="font-mono text-[10.5px] text-slate-500">主力净比 {activeFundFlow.topInflowStock.mainNetRatio.toFixed(1)}%</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 4. Constituent Stocks Table */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
              <div className="flex items-center space-x-2">
                <BarChart2 className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  成分股资金流穿透监测表
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-bold">
                  共 {sortedStocks.length} 只
                </span>
              </div>
              <div className="text-xs text-slate-400">
                点击表头即可快速对股票涨跌幅或主力资金净流入排序
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3">代码 / 名称</th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('price')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>最新价</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('changePercent')}>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-800">今日涨跌幅</span>
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'changePercent' ? 'text-rose-500' : 'text-slate-400'}`} />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('mainNetInflow')}>
                      <div className="flex items-center justify-end gap-1">
                        <span className="text-slate-800">主力净流入</span>
                        <ArrowUpDown className={`w-3 h-3 ${sortField === 'mainNetInflow' ? 'text-rose-500' : 'text-slate-400'}`} />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('mainNetRatio')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>主力净占比</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-right">超大单</th>
                    <th className="py-2.5 px-3 text-right">大单</th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('turnover')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>成交额</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('turnoverRate')}>
                      <div className="flex items-center justify-end gap-1">
                        <span>换手率</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-2.5 px-3 text-center w-28">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sortedStocks.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-8 text-center text-slate-400">
                        当前板块尚未添加任何股票，请点击上方「编辑 / 增减股票」添加
                      </td>
                    </tr>
                  ) : (
                    sortedStocks.map((stock, idx) => {
                      const isUp = stock.changePercent >= 0;
                      const isInflow = stock.mainNetInflow >= 0;
                      return (
                        <tr key={stock.code} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3">
                            <button
                              onClick={() => onSelectStock?.({ code: stock.code, name: stock.name })}
                              className="text-left group cursor-pointer"
                            >
                              <div className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors">
                                {stock.name}
                              </div>
                              <div className="font-mono text-[10.5px] text-slate-400">
                                {stock.code}
                              </div>
                            </button>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                            ¥{stock.price.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-xs">
                            <span className={isUp ? 'text-rose-600' : 'text-emerald-600'}>
                              {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-black text-xs">
                            <span className={isInflow ? 'text-rose-600' : 'text-emerald-600'}>
                              {isInflow ? '+' : ''}{stock.mainNetInflow.toFixed(2)}亿
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold">
                            <span className={stock.mainNetRatio >= 0 ? 'text-rose-600' : 'text-emerald-600'}>
                              {stock.mainNetRatio >= 0 ? '+' : ''}{stock.mainNetRatio.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            <span className={stock.superLargeInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}>
                              {stock.superLargeInflow >= 0 ? '+' : ''}{stock.superLargeInflow.toFixed(2)}亿
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            <span className={stock.largeInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}>
                              {stock.largeInflow >= 0 ? '+' : ''}{stock.largeInflow.toFixed(2)}亿
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {stock.turnover.toFixed(1)}亿
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                            {stock.turnoverRate.toFixed(2)}%
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => onOpenAIDiagnosis?.(`${stock.name}(${stock.code})`)}
                                className="p-1 rounded hover:bg-slate-100 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                                title="AI量化诊断"
                              >
                                <BrainCircuit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleRemoveStock(stock.code)}
                                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                                title="从当前板块移出"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Comparative Multi-Sector Fund Flow Overview Table */}
      {sectors.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800">全部自定义板块横向对比</h3>
            </div>
            <div className="text-xs text-slate-400">
              各板块资金流向横向排位，快速锁定资金聚焦点
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 w-10 text-center">#</th>
                  <th className="py-2.5 px-3">板块名称</th>
                  <th className="py-2.5 px-3 text-center">成分股数</th>
                  <th className="py-2.5 px-3 text-right">综合涨跌幅</th>
                  <th className="py-2.5 px-3 text-right">主力净流入</th>
                  <th className="py-2.5 px-3 text-right">主力净占比</th>
                  <th className="py-2.5 px-3 text-right">总成交额</th>
                  <th className="py-2.5 px-3">领涨标杆</th>
                  <th className="py-2.5 px-3 text-center w-20">快捷进入</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allFlows.map((flow, idx) => {
                  const isUp = flow.changePercent >= 0;
                  const isInflow = flow.mainNetInflow >= 0;
                  const isCurrent = flow.sectorId === activeSectorId;
                  return (
                    <tr key={flow.sectorId} className={`hover:bg-slate-50 transition-colors ${isCurrent ? 'bg-indigo-50/30' : ''}`}>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-800 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          flow.tagColor === 'rose' ? 'bg-rose-500' :
                          flow.tagColor === 'emerald' ? 'bg-emerald-500' :
                          flow.tagColor === 'indigo' ? 'bg-indigo-500' :
                          flow.tagColor === 'amber' ? 'bg-amber-500' :
                          flow.tagColor === 'purple' ? 'bg-purple-500' : 'bg-cyan-500'
                        }`} />
                        <span>{flow.name}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">{flow.stocksCount} 只</td>
                      <td className="py-2.5 px-3 text-right font-mono font-black">
                        <span className={isUp ? 'text-rose-600' : 'text-emerald-600'}>
                          {isUp ? '+' : ''}{flow.changePercent.toFixed(2)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black">
                        <span className={isInflow ? 'text-rose-600' : 'text-emerald-600'}>
                          {isInflow ? '+' : ''}{flow.mainNetInflow.toFixed(2)}亿
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        <span className={flow.mainNetRatio >= 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {flow.mainNetRatio >= 0 ? '+' : ''}{flow.mainNetRatio.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{flow.totalTurnover.toFixed(1)}亿</td>
                      <td className="py-2.5 px-3">
                        {flow.leadStock ? (
                          <span className="font-medium text-slate-800">
                            {flow.leadStock.name} <span className="text-rose-600 font-mono font-bold">+{flow.leadStock.changePercent.toFixed(2)}%</span>
                          </span>
                        ) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => setActiveSectorId(flow.sectorId)}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for creating or editing sector */}
      <CustomSectorModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSectorToEdit(null);
        }}
        sectorToEdit={sectorToEdit}
        onSaved={(savedSector) => {
          refreshSectors();
          setActiveSectorId(savedSector.id);
        }}
      />
    </div>
  );
};
