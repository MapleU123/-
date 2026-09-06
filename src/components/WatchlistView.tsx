import React, { useState } from 'react';
import { 
  Star, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Search, 
  Sparkles, 
  AlertTriangle, 
  ExternalLink,
  ShieldCheck,
  Zap,
  BarChart3
} from 'lucide-react';
import { WatchlistStock, AnomalyAlert } from '../types/market';
import { marketService } from '../services/marketService';

interface WatchlistViewProps {
  watchlist: WatchlistStock[];
  alerts: AnomalyAlert[];
  onOpenAIDiagnosis: (stockName?: string) => void;
  onSelectSector?: (sectorName: string) => void;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  watchlist,
  alerts,
  onOpenAIDiagnosis,
  onSelectSector
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStockForAlerts, setSelectedStockForAlerts] = useState<string | null>(null);

  const handleSearchChange = (kw: string) => {
    setSearchKeyword(kw);
    if (kw.trim().length > 0) {
      setSearchResults(marketService.searchStocks(kw));
    } else {
      setSearchResults([]);
    }
  };

  const handleAddStock = (stock: any) => {
    marketService.addToWatchlist(stock);
    setSearchKeyword('');
    setSearchResults([]);
  };

  const handleRemoveStock = (code: string) => {
    marketService.removeFromWatchlist(code);
  };

  // Filter alerts related to watchlist stocks
  const watchlistCodes = new Set(watchlist.map(w => w.code));
  const watchlistAlerts = alerts.filter(a => watchlistCodes.has(a.stockCode));

  return (
    <div id="watchlist-view" className="space-y-4 pb-12">
      {/* 1. Header & Quick Add */}
      <section className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800">
                我的自选股监控池 ({watchlist.length})
              </h2>
              <p className="text-xs text-slate-400">
                实时追踪核心标的主力资金异动、大单净流入与分时量价异动
              </p>
            </div>
          </div>

          {/* Quick Search & Add Form */}
          <div className="relative flex-1 max-w-sm">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="搜索添加股票代码 / 名称..."
                className="w-full bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 text-xs rounded-lg pl-9 pr-8 py-2 border border-slate-200 focus:border-blue-500 focus:outline-none transition-colors"
              />
              {searchKeyword && (
                <button 
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              )}
            </div>

            {/* Dropdown Results */}
            {searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-30 max-h-60 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map(stk => (
                  <div 
                    key={stk.code}
                    onClick={() => handleAddStock(stk)}
                    className="p-2.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-blue-600 font-semibold">{stk.code}</span>
                      <span className="font-medium text-slate-800">{stk.name}</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                        {stk.sector}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-mono font-semibold ${stk.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {stk.changePercent >= 0 ? '+' : ''}{stk.changePercent.toFixed(2)}%
                      </span>
                      <button className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100">
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Batch Diagnosis */}
          <button
            onClick={() => onOpenAIDiagnosis('我的自选股持仓组合')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>自选股 AI 联合体检</span>
          </button>
        </div>
      </section>

      {/* 2. Main Watchlist Table */}
      <section className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        {watchlist.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Star className="w-12 h-12 mx-auto text-slate-300 stroke-1 mb-2" />
            <p className="text-sm font-medium text-slate-600">自选股池暂无股票</p>
            <p className="text-xs text-slate-400 mt-1">可在上方搜索框搜索添加，或在板块资金流列表中点击收藏</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200/80 select-none">
                <tr>
                  <th className="py-2.5 px-4">股票代码 / 名称</th>
                  <th className="py-2.5 px-3 text-right">最新价</th>
                  <th className="py-2.5 px-3 text-right">今日涨跌幅</th>
                  <th className="py-2.5 px-3 text-right">主力净流入</th>
                  <th className="py-2.5 px-3 text-right">超大单净额</th>
                  <th className="py-2.5 px-3 text-right">换手率</th>
                  <th className="py-2.5 px-3 text-right">成交额</th>
                  <th className="py-2.5 px-3">所属板块</th>
                  <th className="py-2.5 px-3">研判备忘</th>
                  <th className="py-2.5 px-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {watchlist.map((stk) => {
                  const isUp = stk.changePercent >= 0;
                  return (
                    <tr 
                      key={stk.code}
                      id={`watchlist-row-${stk.code}`}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      {/* Code & Name */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleRemoveStock(stk.code)}
                            title="取消自选"
                            className="text-amber-500 hover:text-slate-400 transition-colors"
                          >
                            <Star className="w-4 h-4 fill-amber-400" />
                          </button>
                          <div>
                            <div className="font-bold text-slate-900">{stk.name}</div>
                            <div className="font-mono text-[11px] text-slate-400">{stk.code}</div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className={`py-3 px-3 text-right font-mono font-bold text-sm ${
                        isUp ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        ¥{(stk.price || 0).toFixed(2)}
                      </td>

                      {/* Change % */}
                      <td className="py-3 px-3 text-right">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded font-mono font-bold text-xs ${
                          isUp ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {isUp ? '+' : ''}{(stk.changePercent || 0).toFixed(2)}%
                        </span>
                      </td>

                      {/* Main Inflow */}
                      <td className={`py-3 px-3 text-right font-mono font-bold ${
                        (stk.mainNetInflow || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {(stk.mainNetInflow || 0) >= 0 ? '+' : ''}{(stk.mainNetInflow || 0).toFixed(2)} 亿
                      </td>

                      {/* Super Large Inflow */}
                      <td className={`py-3 px-3 text-right font-mono ${
                        (stk.superLargeInflow || 0) >= 0 ? 'text-rose-500' : 'text-emerald-500'
                      }`}>
                        {(stk.superLargeInflow || 0) >= 0 ? '+' : ''}{(stk.superLargeInflow || 0).toFixed(2)} 亿
                      </td>

                      {/* Turnover Rate */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {(stk.turnoverRate || 0).toFixed(2)}%
                      </td>

                      {/* Turnover Amount */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700">
                        {(stk.turnover || 0).toFixed(1)} 亿
                      </td>

                      {/* Sector */}
                      <td className="py-3 px-3">
                        <button
                          onClick={() => onSelectSector && onSelectSector(stk.sectorName)}
                          className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-[11px] transition-colors"
                        >
                          {stk.sectorName}
                        </button>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3 text-slate-500 text-[11px] max-w-[160px] truncate" title={stk.notes}>
                        {stk.notes}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onOpenAIDiagnosis(`${stk.name}(${stk.code})`)}
                            title="个股 AI 深度研判"
                            className="p-1 rounded bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleRemoveStock(stk.code)}
                            title="删除"
                            className="p-1 rounded bg-slate-100 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3. Watchlist Anomaly Alerts Feed */}
      <section className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-800">
              自选股实时异动捕捉 ({watchlistAlerts.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">仅展示自选池标的触发的万手大单与急拉异动</span>
        </div>

        {watchlistAlerts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            暂无自选股触发异常异动，盘口运行平稳
          </div>
        ) : (
          <div className="divide-y divide-slate-100 mt-2">
            {watchlistAlerts.slice(0, 6).map((alert) => (
              <div 
                key={alert.id}
                className="py-2.5 flex items-center justify-between hover:bg-slate-50/70 transition-colors rounded-lg px-2"
              >
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-[11px] text-slate-400">{alert.time}</span>
                  <span className="font-bold text-xs text-slate-900">{alert.stockName}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                    alert.direction === 'bullish' 
                      ? 'bg-rose-50 text-rose-600 border border-rose-200' 
                      : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                  }`}>
                    {alert.title}
                  </span>
                  <span className="text-xs text-slate-500 hidden md:inline">{alert.description}</span>
                </div>

                <div className="flex items-center space-x-3 font-mono text-xs">
                  <span className="font-semibold text-slate-800">¥{(alert.price || 0).toFixed(2)}</span>
                  <span className={`font-bold ${(alert.changePercent || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {(alert.changePercent || 0) >= 0 ? '+' : ''}{(alert.changePercent || 0).toFixed(2)}%
                  </span>
                  <span className="text-slate-500 font-bold hidden sm:inline">
                    {((alert.amount || 0) / 100).toFixed(0)}万
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
