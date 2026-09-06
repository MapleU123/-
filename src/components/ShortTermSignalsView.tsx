import React, { useState } from 'react';
import { 
  Zap, 
  Flame, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sparkles, 
  ShieldAlert, 
  Clock, 
  Filter,
  Layers
} from 'lucide-react';
import { AnomalyAlert } from '../types/market';

interface ShortTermSignalsViewProps {
  alerts: AnomalyAlert[];
  onSelectAlert?: (alert: AnomalyAlert) => void;
  onOpenAIDiagnosis?: (title?: string) => void;
}

export const ShortTermSignalsView: React.FC<ShortTermSignalsViewProps> = ({
  alerts,
  onSelectAlert,
  onOpenAIDiagnosis
}) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredAlerts = alerts.filter(a => {
    if (filterType === 'all') return true;
    if (filterType === 'rocket') return a.type === 'rocket_surge';
    if (filterType === 'block_buy') return a.type === 'block_buy';
    if (filterType === 'rapid_limit') return a.type === 'rapid_limit';
    if (filterType === 'broken_limit') return a.type === 'broken_limit';
    return true;
  });

  return (
    <div id="short-term-signals-view" className="space-y-4">
      {/* Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <Zap className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              短线精灵与 Level-2 逐笔异动雷达
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                毫秒级推送
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              实时捕捉全市场火箭发射、万手大单主买扫货、封单突增、尾盘抢筹及炸板异动
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('短线异动精灵与主力挂单意图')}
          className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          <span>AI 盘口大单意图解析</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center flex-wrap gap-1.5 bg-white p-1.5 rounded-xl border border-slate-200/80 text-xs">
        {[
          { key: 'all', label: '全部异动' },
          { key: 'rocket', label: '🚀 火箭发射 (瞬间急拉)' },
          { key: 'block_buy', label: '🔥 巨单扫货 (万手主买)' },
          { key: 'rapid_limit', label: '⚡ 封单剧增 (光速涨停)' },
          { key: 'broken_limit', label: '⚠️ 炸板预警 (开板跳水)' }
        ].map((btn) => (
          <button
            key={btn.key}
            onClick={() => setFilterType(btn.key)}
            className={`px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${
              filterType === btn.key
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Anomaly Stream List */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.id}
            onClick={() => onSelectAlert && onSelectAlert(alert)}
            className="p-3.5 hover:bg-slate-50 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <span className="text-xs font-mono font-bold text-slate-400">{alert.time}</span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                {alert.title}
              </span>
              <div>
                <span className="font-bold text-slate-900 text-sm mr-2">{alert.stockName}</span>
                <span className="text-xs font-mono text-slate-400">({alert.stockCode})</span>
                <span className="text-xs text-slate-500 ml-2 px-1.5 py-0.5 bg-slate-100 rounded">
                  {alert.sectorName}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-4 font-mono text-xs">
              <span className="font-bold text-slate-900">¥{(alert.price || 0).toFixed(2)}</span>
              <span className={`font-bold ${(alert.changePercent || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                {(alert.changePercent || 0) >= 0 ? '+' : ''}{(alert.changePercent || 0).toFixed(2)}%
              </span>
              <span className="text-slate-600 font-bold hidden sm:inline">
                交易额: {((alert.amount || 0) / 100).toFixed(0)}万
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
