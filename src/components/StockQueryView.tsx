import React, { useState } from 'react';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Layers, 
  Activity, 
  ShieldCheck, 
  BarChart2,
  PieChart as PieIcon,
  Zap
} from 'lucide-react';
import { SectorFundFlow, SectorStock } from '../types/market';

interface StockQueryViewProps {
  sectors: SectorFundFlow[];
  onSelectStock: (stock: SectorStock, sectorName: string) => void;
  onOpenAIDiagnosis?: (title?: string) => void;
}

export const StockQueryView: React.FC<StockQueryViewProps> = ({
  sectors,
  onSelectStock,
  onOpenAIDiagnosis
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('隆平高科');

  // Flatten all stocks from sectors
  const allStocks = sectors.flatMap(s => 
    s.topStocks.map(stk => ({
      ...stk,
      sectorName: s.name
    }))
  );

  const matchedStocks = allStocks.filter(stk => 
    stk.name.includes(searchTerm) || stk.code.includes(searchTerm) || stk.sectorName.includes(searchTerm)
  );

  const activeStock = matchedStocks[0] || allStocks[0];

  return (
    <div id="stock-query-view" className="space-y-4">
      {/* Search Input Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="输入股票代码 (如 000998) 或名称 (如 隆平高科、中芯国际)..."
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden font-medium"
          />
        </div>

        <button
          onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis(`${activeStock?.name || '个股'}(${activeStock?.code || ''}) 深度诊断`)}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI 个股六维健康体检</span>
        </button>
      </div>

      {activeStock && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Stock Card & Quote */}
          <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900">{activeStock.name}</h3>
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono mt-0.5">
                  <span>{activeStock.code}</span>
                  <span>|</span>
                  <span className="text-blue-600 font-medium">{activeStock.sectorName}</span>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className={`text-2xl font-black ${(activeStock.changePercent || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  ¥{(activeStock.price || 0).toFixed(2)}
                </div>
                <div className={`text-xs font-bold ${(activeStock.changePercent || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {(activeStock.changePercent || 0) >= 0 ? '+' : ''}{(activeStock.changePercent || 0).toFixed(2)}%
                </div>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-50 p-3 rounded-lg">
              <div>
                <span className="text-slate-400">主力净流入:</span>
                <div className={`font-bold mt-0.5 ${(activeStock.mainNetInflow || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {(activeStock.mainNetInflow || 0) >= 0 ? '+' : ''}{(activeStock.mainNetInflow || 0).toFixed(2)} 亿
                </div>
              </div>
              <div>
                <span className="text-slate-400">换手率:</span>
                <div className="font-bold text-slate-800 mt-0.5">
                  {(activeStock.turnoverRate || 0).toFixed(2)}%
                </div>
              </div>
              <div>
                <span className="text-slate-400">总成交额:</span>
                <div className="font-bold text-slate-800 mt-0.5">
                  {(activeStock.turnover || 0).toFixed(1)} 亿
                </div>
              </div>
              <div>
                <span className="text-slate-400">动态市盈率:</span>
                <div className="font-bold text-slate-800 mt-0.5">
                  {activeStock.peRatio ? `${activeStock.peRatio.toFixed(1)} 倍` : '28.4 倍'}
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectStock(activeStock, activeStock.sectorName)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
            >
              打开 Level-2 逐笔五档买卖明细
            </button>
          </div>

          {/* Right: Search results list */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-3 border-b border-slate-100 text-xs font-bold text-slate-700 bg-slate-50/50">
              全市场匹配个股 ({matchedStocks.length}只)
            </div>
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
              {matchedStocks.map((stk) => (
                <div
                  key={stk.code}
                  onClick={() => onSelectStock(stk, stk.sectorName)}
                  className="p-3 hover:bg-blue-50/50 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-xs font-bold text-slate-400">{stk.code}</span>
                    <span className="font-bold text-slate-900 text-xs">{stk.name}</span>
                    <span className="text-[11px] text-blue-600 px-1.5 py-0.5 bg-blue-50 rounded">
                      {stk.sectorName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 font-mono text-xs">
                    <span className="font-bold text-slate-900">¥{(stk.price || 0).toFixed(2)}</span>
                    <span className={`font-bold ${(stk.changePercent || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {(stk.changePercent || 0) >= 0 ? '+' : ''}{(stk.changePercent || 0).toFixed(2)}%
                    </span>
                    <span className={`font-bold hidden sm:inline ${(stk.mainNetInflow || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {(stk.mainNetInflow || 0) >= 0 ? '+' : ''}{(stk.mainNetInflow || 0).toFixed(2)} 亿
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
