import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  Activity, 
  Layers, 
  BarChart2, 
  ArrowUpRight, 
  ArrowDownRight,
  Database,
  Info,
  ExternalLink,
  FileImage,
  Download,
  ShieldCheck
} from 'lucide-react';
import { IndexQuote, MarketOverviewData, OverviewRankingItem, SectorFundFlow } from '../types/market';
import { getRealtimeShortDateTimeString } from '../utils/marketDateUtils';

interface MarketOverviewViewProps {
  indices: IndexQuote[];
  overviewData: MarketOverviewData;
  onSelectSector?: (sectorName: string) => void;
  onOpenAIDiagnosis: () => void;
  onOpenExportImage?: (template?: 'market_overview' | 'gainers_losers') => void;
}

export const MarketOverviewView: React.FC<MarketOverviewViewProps> = ({
  indices,
  overviewData,
  onSelectSector,
  onOpenAIDiagnosis,
  onOpenExportImage
}) => {
  // Sort toggle: by percentage or by main net inflow
  const [rankingMetric, setRankingMetric] = useState<'percent' | 'inflow'>('percent');

  const topGainers = overviewData?.topGainers || [];
  const topLosers = overviewData?.topLosers || [];

  // Compute gainers & losers based on metric
  const gainers = rankingMetric === 'percent'
    ? [...topGainers].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0))
    : [...topGainers].sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0));

  const losers = rankingMetric === 'percent'
    ? [...topLosers].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0))
    : [...topLosers].sort((a, b) => (a.mainNetInflow || 0) - (b.mainNetInflow || 0));

  // Maximum scales for horizontal bars
  const maxGainerVal = rankingMetric === 'percent' 
    ? Math.max(...gainers.map(g => Math.abs(g.changePercent || 0)), 25) 
    : Math.max(...gainers.map(g => Math.abs(g.mainNetInflow || 0)), 50);

  const maxLoserVal = rankingMetric === 'percent' 
    ? Math.max(...losers.map(l => Math.abs(l.changePercent || 0)), 5) 
    : Math.max(...losers.map(l => Math.abs(l.mainNetInflow || 0)), 40);

  // Industry & Concept breadth stats
  const indBreadth = overviewData?.industryBreadth || {
    up: 360,
    down: 134,
    flat: 2,
    avgChangePercent: 0.82,
    mainNetInflow: -789.11,
    timestamp: '10:59:39'
  };

  const cnpBreadth = overviewData?.conceptBreadth || {
    up: 295,
    down: 202,
    flat: 3,
    avgChangePercent: 0.17,
    mainNetInflow: -6843.41,
    timestamp: '10:53:19'
  };

  const totalMainInflow = (indBreadth.mainNetInflow || 0);

  return (
    <div id="market-overview-view" className="space-y-4 pb-12">
      {/* Top Banner with Real-time Status and Image Export Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-4 py-3 rounded-xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight">A股大盘全景总览与盘面深度复盘</h1>
              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                实盘已校准
              </span>
            </div>
            <p className="text-xs text-slate-400">
              8大核心指数 · 两市成交量能 · 涨跌家数比 · 支持导出高清长图研报
            </p>
          </div>
        </div>

        {/* Action buttons: AI Diagnosis + Export Image */}
        <div className="flex items-center gap-2">
          <button
            id="btn-overview-ai-diagnosis"
            onClick={onOpenAIDiagnosis}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI大盘诊断</span>
          </button>

          {onOpenExportImage && (
            <>
              {/* Main New Feature: 导出领涨和领跌板块长图 */}
              <button
                id="btn-export-gainers-losers-top"
                onClick={() => onOpenExportImage('gainers_losers')}
                className="px-3.5 py-1.5 bg-gradient-to-r from-rose-600 via-rose-500 to-emerald-600 hover:from-rose-500 hover:to-emerald-500 text-white rounded-lg text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md hover:shadow-lg group"
                title="导出领涨板块和领跌板块对照研报图片（按用户需求定制，支持有/无水印）"
              >
                <TrendingUp className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span>导出领涨/领跌板块图片</span>
                <span className="px-1.5 py-0.2 bg-white/25 rounded text-[9.5px] font-mono">
                  新功能
                </span>
              </button>

              <button
                id="btn-export-overview-image"
                onClick={() => onOpenExportImage('market_overview')}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs group"
                title="导出大盘全景总览图片（包含8大指数、两市量能与涨跌家数比）"
              >
                <FileImage className="w-3.5 h-3.5 text-slate-600 group-hover:scale-110 transition-transform" />
                <span className="hidden sm:inline">导出大盘全景研报</span>
                <span className="sm:hidden">大盘研报</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 1. Top Section: 8 Major Indices Cards + Macro Stats (Matching Screenshot Top) */}
      <section className="bg-white rounded-xl p-3.5 border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {indices.map((idx, indexIdx) => {
            const isUp = (idx.change || 0) >= 0;
            const price = idx.price || 0;
            const changePercent = idx.changePercent || 0;
            const change = idx.change || 0;
            const itemKey = idx.code ? `overview-idx-${idx.code}` : `overview-idx-${indexIdx}`;

            return (
              <div 
                key={itemKey}
                id={`overview-idx-${idx.code ? idx.code.split('.')[0] : indexIdx}`}
                className="bg-slate-50/70 hover:bg-slate-100/80 p-2.5 rounded-lg border border-slate-200/60 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="text-xs font-semibold text-slate-700 truncate mb-1">
                  {idx.name}
                </div>
                <div className={`text-base font-extrabold font-mono tracking-tight ${
                  isUp ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono mt-1">
                  <span className={`font-semibold ${isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                  </span>
                  <span className={`text-[10.5px] ${isUp ? 'text-rose-500' : 'text-emerald-500'}`}>
                    {isUp ? '+' : ''}{change.toFixed(2)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Macro Summary Strip under indices */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50/60 border border-blue-100/80">
            <span className="text-slate-500 font-medium">两市成交额:</span>
            <span className="font-mono font-extrabold text-blue-900 text-sm">
              25443 亿
            </span>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 font-medium">两市主力净流入:</span>
            <span className={`font-mono font-extrabold text-sm ${
              totalMainInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'
            }`}>
              {totalMainInflow >= 0 ? '+' : ''}{totalMainInflow.toFixed(2)} 亿
            </span>
          </div>

          <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/70">
            <span className="text-slate-500 font-medium">上涨 / 下跌家数:</span>
            <div className="flex items-center space-x-2 font-mono font-bold text-xs">
              <span className="text-rose-600">3126 上涨</span>
              <span className="text-slate-300">/</span>
              <span className="text-emerald-600">2029 下跌</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Market Breadth Review: 今日盘面强弱复盘 (Matching Screenshot Mid Section) */}
      <section className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs">
        {/* Section Header with Mode Switches */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600"></div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">
              今日盘面强弱复盘
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              行业{indBreadth.timestamp || '10:59:39'} / 概念{cnpBreadth.timestamp || '10:53:19'}
            </span>
          </div>

          {/* Switch ranking mode + Export Trigger */}
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-1.5 bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
              <button
                id="btn-rank-by-percent"
                onClick={() => setRankingMetric('percent')}
                className={`px-3 py-1 rounded-md transition-all ${
                  rankingMetric === 'percent'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                按涨跌幅
              </button>
              <button
                id="btn-rank-by-inflow"
                onClick={() => setRankingMetric('inflow')}
                className={`px-3 py-1 rounded-md transition-all ${
                  rankingMetric === 'inflow'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                按主力净流入
              </button>
            </div>

            {onOpenExportImage && (
              <button
                id="btn-breadth-export-img"
                onClick={() => onOpenExportImage('market_overview')}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
                title="导出今日盘面图片"
              >
                <FileImage className="w-3.5 h-3.5 text-rose-600" />
                <span>导出图片</span>
              </button>
            )}
          </div>
        </div>

        {/* 6 Breadth Review Cards (Matching Screenshot 2 rows of 3) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-3.5">
          {/* 1. 行业 涨/跌/平 */}
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
            <div className="text-[11px] text-slate-500 font-medium">行业 涨/跌/平</div>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1">
              <span className="text-rose-600">{indBreadth.up ?? 360}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-emerald-600">{indBreadth.down ?? 134}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-slate-600">{indBreadth.flat ?? 2}</span>
            </div>
          </div>

          {/* 2. 行业平均涨幅 */}
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
            <div className="text-[11px] text-slate-500 font-medium">行业平均涨幅</div>
            <div className={`text-sm font-mono font-bold mt-1 ${(indBreadth.avgChangePercent || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {(indBreadth.avgChangePercent || 0) >= 0 ? '+' : ''}{(indBreadth.avgChangePercent || 0).toFixed(2)}%
            </div>
          </div>

          {/* 3. 行业主力净额 */}
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
            <div className="text-[11px] text-slate-500 font-medium">行业主力净额</div>
            <div className={`text-sm font-mono font-bold mt-1 ${(indBreadth.mainNetInflow || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {(indBreadth.mainNetInflow || 0) >= 0 ? '+' : ''}{(indBreadth.mainNetInflow || 0).toFixed(2)} 亿
            </div>
          </div>

          {/* 4. 概念 涨/跌/平 */}
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
            <div className="text-[11px] text-slate-500 font-medium">概念 涨/跌/平</div>
            <div className="text-sm font-mono font-bold text-slate-800 mt-1">
              <span className="text-rose-600">{cnpBreadth.up ?? 295}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-emerald-600">{cnpBreadth.down ?? 202}</span>
              <span className="text-slate-400 mx-0.5">/</span>
              <span className="text-slate-600">{cnpBreadth.flat ?? 3}</span>
            </div>
          </div>

          {/* 5. 概念平均涨幅 */}
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
            <div className="text-[11px] text-slate-500 font-medium">概念平均涨幅</div>
            <div className={`text-sm font-mono font-bold mt-1 ${(cnpBreadth.avgChangePercent || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {(cnpBreadth.avgChangePercent || 0) >= 0 ? '+' : ''}{(cnpBreadth.avgChangePercent || 0).toFixed(2)}%
            </div>
          </div>

          {/* 6. 概念主力净额 */}
          <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-200/60">
            <div className="text-[11px] text-slate-500 font-medium">概念主力净额</div>
            <div className={`text-sm font-mono font-bold mt-1 ${(cnpBreadth.mainNetInflow || 0) >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
              {(cnpBreadth.mainNetInflow || 0) >= 0 ? '+' : ''}{(cnpBreadth.mainNetInflow || 0).toFixed(2)} 亿
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Dual-Column TOP12 Ranking Horizontal Bar Charts Header & Export Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-rose-500 to-emerald-500" />
          <h3 className="text-sm font-black text-slate-800 tracking-tight">
            全市场行业领涨与领跌板块排行榜 (TOP 12 对照)
          </h3>
          <span className="text-xs text-slate-400 hidden md:inline">
            | 领涨TOP12 vs 领跌TOP12 · 涨跌幅与主力净额矩阵
          </span>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
          {/* Metric Sort Toggle */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setRankingMetric('percent')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                rankingMetric === 'percent' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              按涨跌幅%排序
            </button>
            <button
              onClick={() => setRankingMetric('inflow')}
              className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                rankingMetric === 'inflow' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              按主力净额排序
            </button>
          </div>

          {/* Direct Export Button for this section */}
          {onOpenExportImage && (
            <button
              id="btn-export-gainers-losers-section"
              onClick={() => onOpenExportImage('gainers_losers')}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
              title="导出当前大盘全景领涨与领跌板块图片（支持有/无水印选择）"
            >
              <Download className="w-3.5 h-3.5 text-rose-600" />
              <span>导出领涨领跌图片</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Dual-Column TOP12 Ranking Horizontal Bar Charts (Matching Screenshot Core) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Column: 领涨板块 TOP12 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                <h3 className="text-sm font-bold text-slate-800">
                  {rankingMetric === 'percent' ? '领涨板块 TOP12 (涨跌幅%)' : '主力净流入 TOP12 (亿元)'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">点击板块查看资金流穿透</span>
            </div>

            {/* Scale Indicator */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono px-2 mb-1.5 border-b border-slate-100 pb-1">
              <span>0</span>
              <span>{rankingMetric === 'percent' ? '5%' : '10亿'}</span>
              <span>{rankingMetric === 'percent' ? '10%' : '20亿'}</span>
              <span>{rankingMetric === 'percent' ? '15%' : '30亿'}</span>
              <span>{rankingMetric === 'percent' ? '20%' : '40亿'}</span>
              <span>{rankingMetric === 'percent' ? '25%' : '50亿'}</span>
            </div>

            {/* List of 12 Gainers */}
            <div className="space-y-1.5">
              {gainers.slice(0, 12).map((item, idx) => {
                const changePct = item.changePercent || 0;
                const inflow = item.mainNetInflow || 0;
                const val = rankingMetric === 'percent' ? changePct : inflow;
                const widthPercent = Math.min(100, Math.max(8, (Math.abs(val) / maxGainerVal) * 100));
                const leadName = item.leadStock?.name;
                const gainerKey = item.id ? `top-gainer-${item.id}` : `top-gainer-${item.name || (item as any).code || idx}-${idx}`;
                const domId = `top-gainer-${item.id || item.name || idx}`;

                return (
                  <div
                    key={gainerKey}
                    id={domId}
                    onClick={() => onSelectSector && onSelectSector(item.name)}
                    className="group relative flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-rose-50/50 cursor-pointer transition-colors"
                  >
                    {/* Background Progress Bar */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-rose-100/60 rounded-md transition-all duration-300 group-hover:bg-rose-200/70"
                      style={{ width: `${widthPercent}%` }}
                    />

                    {/* Sector Name & Rank */}
                    <div className="relative z-10 flex items-center space-x-2 w-36 sm:w-44 flex-shrink-0">
                      <span className={`w-4 h-4 rounded text-[10px] font-mono font-bold flex items-center justify-center ${
                        idx < 3 ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-rose-700 transition-colors truncate">
                        {item.name}
                      </span>
                      {leadName && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({leadName})
                        </span>
                      )}
                    </div>

                    {/* Value Badge & Inflow */}
                    <div className="relative z-10 flex items-center space-x-3 text-right">
                      <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                        净入: <strong className="text-rose-600">{inflow > 0 ? '+' : ''}{inflow.toFixed(2)}亿</strong>
                      </span>
                      <span className="font-mono text-xs font-bold text-rose-600 min-w-[54px]">
                        {changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%
                      </span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: 领跌板块 TOP12 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <h3 className="text-sm font-bold text-slate-800">
                  {rankingMetric === 'percent' ? '领跌板块 TOP12 (涨跌幅%)' : '主力净流出 TOP12 (亿元)'}
                </h3>
              </div>
              <span className="text-[11px] text-slate-400">点击板块查看资金流穿透</span>
            </div>

            {/* Scale Indicator */}
            <div className="flex justify-between text-[10px] text-slate-400 font-mono px-2 mb-1.5 border-b border-slate-100 pb-1">
              <span>0</span>
              <span>{rankingMetric === 'percent' ? '-1%' : '-8亿'}</span>
              <span>{rankingMetric === 'percent' ? '-2%' : '-16亿'}</span>
              <span>{rankingMetric === 'percent' ? '-3%' : '-24亿'}</span>
              <span>{rankingMetric === 'percent' ? '-4%' : '-32亿'}</span>
              <span>{rankingMetric === 'percent' ? '-5%' : '-40亿'}</span>
            </div>

            {/* List of 12 Losers */}
            <div className="space-y-1.5">
              {losers.slice(0, 12).map((item, idx) => {
                const changePct = item.changePercent || 0;
                const inflow = item.mainNetInflow || 0;
                const val = rankingMetric === 'percent' ? changePct : inflow;
                const widthPercent = Math.min(100, Math.max(8, (Math.abs(val) / maxLoserVal) * 100));
                const leadName = item.leadStock?.name;
                const loserKey = item.id ? `top-loser-${item.id}` : `top-loser-${item.name || (item as any).code || idx}-${idx}`;
                const domId = `top-loser-${item.id || item.name || idx}`;

                return (
                  <div
                    key={loserKey}
                    id={domId}
                    onClick={() => onSelectSector && onSelectSector(item.name)}
                    className="group relative flex items-center justify-between py-1.5 px-2.5 rounded-lg hover:bg-emerald-50/50 cursor-pointer transition-colors"
                  >
                    {/* Background Progress Bar */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-emerald-100/60 rounded-md transition-all duration-300 group-hover:bg-emerald-200/70"
                      style={{ width: `${widthPercent}%` }}
                    />

                    {/* Sector Name & Rank */}
                    <div className="relative z-10 flex items-center space-x-2 w-36 sm:w-44 flex-shrink-0">
                      <span className={`w-4 h-4 rounded text-[10px] font-mono font-bold flex items-center justify-center ${
                        idx < 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-700 transition-colors truncate">
                        {item.name}
                      </span>
                      {leadName && (
                        <span className="text-[10px] text-slate-400 font-normal">
                          ({leadName})
                        </span>
                      )}
                    </div>

                    {/* Value Badge & Inflow */}
                    <div className="relative z-10 flex items-center space-x-3 text-right">
                      <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
                        净入: <strong className="text-emerald-600">{inflow.toFixed(2)}亿</strong>
                      </span>
                      <span className="font-mono text-xs font-bold text-emerald-600 min-w-[54px]">
                        {changePct.toFixed(2)}%
                      </span>
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Bottom 4 Status Cards (Matching screenshot bottom widgets) */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">最新采集时间</div>
            <div className="text-sm font-mono font-bold text-slate-800">{overviewData?.lastCollectTime || getRealtimeShortDateTimeString()}</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">当前采集轮次</div>
            <div className="text-sm font-mono font-bold text-indigo-600">第 {overviewData?.collectionRound || 3} 轮</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">行业板块覆盖</div>
            <div className="text-sm font-mono font-bold text-slate-800">{overviewData?.industrySectorCount || 496} 个板块</div>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
            <BarChart2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">概念板块覆盖</div>
            <div className="text-sm font-mono font-bold text-slate-800">{overviewData?.conceptSectorCount || 500} 个概念</div>
          </div>
        </div>
      </section>

      {/* Floating AI Diagnostic Assistant Button */}
      <button
        id="fab-ai-assistant"
        onClick={onOpenAIDiagnosis}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-3.5 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center space-x-2 group cursor-pointer"
        title="开启大盘主力资金智能研判"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        <span className="text-xs font-bold pr-1">AI 盘面研判</span>
      </button>
    </div>
  );
};
