import React, { useState } from 'react';
import { AnomalyAlert, AnomalyType } from '../types/market';
import { 
  BellRing, 
  Rocket, 
  Coins, 
  Lock, 
  TrendingDown, 
  Zap, 
  Clock, 
  AlertTriangle, 
  Filter,
  Flame,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface AnomalyAlertStreamProps {
  alerts: AnomalyAlert[];
  onSelectAlert: (alert: AnomalyAlert) => void;
}

export const AnomalyAlertStream: React.FC<AnomalyAlertStreamProps> = ({ alerts, onSelectAlert }) => {
  const [activeFilter, setActiveFilter] = useState<AnomalyType | 'all' | 'bullish' | 'bearish'>('all');
  const [minAmount, setMinAmount] = useState<number>(0);

  const filteredAlerts = alerts.filter((alert) => {
    if (activeFilter === 'bullish' && alert.direction !== 'bullish') return false;
    if (activeFilter === 'bearish' && alert.direction !== 'bearish') return false;
    if (activeFilter !== 'all' && activeFilter !== 'bullish' && activeFilter !== 'bearish' && alert.type !== activeFilter) return false;
    if (minAmount > 0 && alert.amount < minAmount) return false;
    return true;
  });

  const getIconForType = (type: AnomalyType) => {
    switch (type) {
      case 'rocket_surge':
        return <Rocket className="w-4 h-4 text-rose-400" />;
      case 'block_buy':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'rapid_limit':
        return <Lock className="w-4 h-4 text-rose-500" />;
      case 'tail_rush':
        return <Flame className="w-4 h-4 text-orange-400" />;
      case 'support_buy':
        return <Zap className="w-4 h-4 text-cyan-400" />;
      case 'block_sell':
        return <TrendingDown className="w-4 h-4 text-emerald-400" />;
      case 'flash_dump':
        return <AlertTriangle className="w-4 h-4 text-emerald-500" />;
      case 'broken_limit':
        return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      default:
        return <BellRing className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div id="anomaly-alert-stream" className="bg-slate-900/80 rounded-xl border border-slate-800 p-4 shadow-xl flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>智能个股异动实时预警</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                LIVE
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">
              毫秒级捕获万手大单、火箭急拉、开板跳水与抢筹异动
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-1.5">
          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value as any)}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value="all">全部异动类型</option>
            <option value="bullish">🔥 仅看多头异动</option>
            <option value="bearish">⚠️ 仅看空头预警</option>
            <option value="block_buy">💰 巨单扫货</option>
            <option value="rocket_surge">🚀 火箭发射</option>
            <option value="rapid_limit">🔒 封单暴增</option>
            <option value="broken_limit">⚡ 炸板预警</option>
            <option value="tail_rush">⏱️ 尾盘抢筹</option>
            <option value="flash_dump">📉 快速跳水</option>
          </select>

          <select
            value={minAmount}
            onChange={(e) => setMinAmount(Number(e.target.value))}
            className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-rose-500"
          >
            <option value={0}>金额不限</option>
            <option value={5000}>&gt; 5,000万</option>
            <option value={10000}>&gt; 1亿元</option>
          </select>
        </div>
      </div>

      {/* Stream List */}
      <div className="mt-3 space-y-2 overflow-y-auto max-h-[520px] pr-1 scrollbar-thin">
        {filteredAlerts.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            暂无符合筛选条件的异动事件
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isBullish = alert.direction === 'bullish';
            const cardBorder = alert.severity === 'high'
              ? (isBullish ? 'border-rose-700/60 bg-rose-950/20' : 'border-emerald-700/60 bg-emerald-950/20')
              : 'border-slate-800/80 bg-slate-950/50 hover:bg-slate-800/60';

            return (
              <div
                key={alert.id}
                id={`alert-item-${alert.id}`}
                onClick={() => onSelectAlert(alert)}
                className={`p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md ${cardBorder} group`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center space-x-2">
                    <div className="p-1 rounded bg-slate-900 border border-slate-800">
                      {getIconForType(alert.type)}
                    </div>
                    <div>
                      <span className="font-bold text-xs text-slate-100 group-hover:text-rose-300">
                        {alert.stockName}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 ml-1.5">
                        {alert.stockCode}
                      </span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {alert.sectorName}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-right">
                    <span className={`text-xs font-mono font-bold ${
                      alert.changePercent >= 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {alert.changePercent >= 0 ? '+' : ''}{alert.changePercent.toFixed(2)}%
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {alert.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1">
                  <span className={`text-xs font-semibold ${
                    isBullish ? 'text-rose-300' : 'text-emerald-300'
                  }`}>
                    {alert.title}
                  </span>
                  <span className="text-[11px] font-mono text-amber-300/90 font-medium">
                    交易额: {(alert.amount / 100).toFixed(1)}万
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  {alert.description}
                </p>

                <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t border-slate-800/40 text-[10px] text-slate-500">
                  <span>点击查看5档盘口与个股AI诊断</span>
                  <ChevronRight className="w-3 h-3 text-slate-500 group-hover:text-slate-300 group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
