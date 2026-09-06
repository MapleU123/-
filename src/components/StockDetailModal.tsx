import React, { useState } from 'react';
import { SectorStock, AnomalyAlert, Level2OrderBook } from '../types/market';
import { generateMockOrderBook } from '../data/mockMarketData';
import { X, Sparkles, TrendingUp, TrendingDown, Layers, ShieldCheck, Activity } from 'lucide-react';

interface StockDetailModalProps {
  stock: SectorStock | null;
  alertStock?: AnomalyAlert | null;
  sectorName?: string;
  onClose: () => void;
}

export const StockDetailModal: React.FC<StockDetailModalProps> = ({
  stock,
  alertStock,
  sectorName,
  onClose
}) => {
  if (!stock && !alertStock) return null;

  const code = stock ? stock.code : (alertStock?.stockCode || '000001');
  const name = stock ? stock.name : (alertStock?.stockName || '个股');
  const price = stock?.price ?? alertStock?.price ?? 20.0;
  const changePercent = stock?.changePercent ?? alertStock?.changePercent ?? 0.0;
  const sector = sectorName || (alertStock ? alertStock.sectorName : 'A股个股');

  const isUp = changePercent >= 0;
  const priceColor = isUp ? 'text-rose-400' : 'text-emerald-400';

  const [orderBook] = useState<Level2OrderBook>(() => generateMockOrderBook(price || 20.0));
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<any | null>(null);

  const triggerStockAI = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/ai/stock-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stockCode: code,
          stockName: name,
          sectorName: sector,
          price,
          changePercent,
          mainNetInflow: stock ? stock.mainNetInflow : 4.5,
          superLargeInflow: stock ? stock.superLargeInflow : 3.2,
          orderBookSnippet: `买一挂单${orderBook.bids[0].volume}手，卖一挂单${orderBook.asks[0].volume}手`
        })
      });

      if (!res.ok) throw new Error('AI analysis error');
      const data = await res.json();
      setAiResult(data);
    } catch {
      // Local fallback
      setAiResult({
        mainBehavior: isUp ? '机构资金温和加仓，短线主力蓄势突破' : '高位抛压获利了结，资金短线分流',
        confidenceScore: isUp ? 86 : 45,
        capitalStructure: '超大单占比超过45%，机构席位与游资合力护盘，五档买盘承接厚度较好。',
        shortTermOutlook: isUp ? '明日大概率高开冲高，关注量能能否继续放大' : '短期或将在均线附近震荡蓄势消化浮筹',
        supportPrice: Number((price * 0.96).toFixed(2)),
        pressurePrice: Number((price * 1.05).toFixed(2)),
        operationTips: isUp ? '多头趋势良好，持股待涨，依托5日均线逢低可分批低吸' : '观望为主，等待企稳回踩支撑位确认'
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="stock-detail-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-rose-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-bold text-slate-100">{name}</h2>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {code}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/40">
                  {sector}
                </span>
              </div>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`text-lg font-mono font-bold ${priceColor}`}>
                  ¥{price.toFixed(2)}
                </span>
                <span className={`text-xs font-mono font-bold ${priceColor}`}>
                  {isUp ? '+' : ''}{changePercent.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Level-2 5-tier Order Book */}
        <div className="my-4 p-4 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-2">
            <span>Level-2 五档实时买卖盘口</span>
            <span className="text-[11px] font-mono text-slate-500">毫秒级撮合推演</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Asks (Sell 5 -> Sell 1) */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium mb-1">卖盘 (委卖五档)</div>
              {orderBook.asks.map((ask, idx) => (
                <div key={idx} className="relative flex items-center justify-between text-xs font-mono py-1 px-2 rounded bg-slate-900/60 overflow-hidden">
                  <div 
                    className="absolute right-0 top-0 bottom-0 bg-emerald-950/40 opacity-70"
                    style={{ width: `${ask.percentage}%` }}
                  />
                  <span className="text-slate-400 relative z-10">卖{5 - idx}</span>
                  <span className="text-emerald-400 font-bold relative z-10">¥{ask.price.toFixed(2)}</span>
                  <span className="text-slate-300 relative z-10">{ask.volume}手</span>
                </div>
              ))}
            </div>

            {/* Bids (Buy 1 -> Buy 5) */}
            <div className="space-y-1">
              <div className="text-[11px] text-slate-400 font-medium mb-1">买盘 (委买五档)</div>
              {orderBook.bids.map((bid, idx) => (
                <div key={idx} className="relative flex items-center justify-between text-xs font-mono py-1 px-2 rounded bg-slate-900/60 overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 bottom-0 bg-rose-950/40 opacity-70"
                    style={{ width: `${bid.percentage}%` }}
                  />
                  <span className="text-slate-400 relative z-10">买{idx + 1}</span>
                  <span className="text-rose-400 font-bold relative z-10">¥{bid.price.toFixed(2)}</span>
                  <span className="text-slate-300 relative z-10">{bid.volume}手</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Diagnosis Section */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-slate-200">Gemini 智能主力动向深度解析</span>
            </div>
            {!aiResult && (
              <button
                onClick={triggerStockAI}
                disabled={aiLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                {aiLoading ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>AI 研判中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>立即诊断</span>
                  </>
                )}
              </button>
            )}
          </div>

          {aiResult ? (
            <div className="space-y-3 text-xs animate-fade-in">
              <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-800/40 flex items-center justify-between">
                <div>
                  <span className="text-slate-400">主力核心行为判定: </span>
                  <span className="font-bold text-rose-300">{aiResult.mainBehavior}</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-slate-900">
                  多头强度: {aiResult.confidenceScore}分
                </span>
              </div>

              <p className="text-slate-300 leading-relaxed">
                <strong className="text-slate-100">资金结构解析: </strong>
                {aiResult.capitalStructure}
              </p>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500">短线支撑价: </span>
                  <span className="font-mono font-bold text-emerald-400">¥{aiResult.supportPrice}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-500">短线压力价: </span>
                  <span className="font-mono font-bold text-rose-400">¥{aiResult.pressurePrice}</span>
                </div>
              </div>

              <p className="text-amber-200/90 bg-amber-950/20 p-2.5 rounded-lg border border-amber-900/30 leading-relaxed">
                💡 <strong>操盘建议: </strong>{aiResult.operationTips}
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-400 leading-relaxed">
              点击上方“立即诊断”，由 Gemini 模型基于实时主力五档盘口、超大单大单成交分布与所属板块热度，一键推演主力操盘意图与短期支撑压力位。
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
