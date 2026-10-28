import React, { useState } from 'react';
import {
  X,
  Calculator,
  Layers,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Building2,
  Award,
  Flame,
  BarChart3,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  Info,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { PendingConvertibleBond } from '../types/market';
import {
  calculateCBValuation,
  CBValuationResult,
  SingleValuationMethodResult,
  JISILU_MID_PARITY_BENCHMARK,
  INDUSTRY_BENCHMARKS
} from '../utils/cbValuation';

interface CBValuationBreakdownModalProps {
  isOpen: boolean;
  bond: PendingConvertibleBond | null;
  onClose: () => void;
  onApplyToCalculator?: (bond: PendingConvertibleBond, price: number) => void;
}

export const CBValuationBreakdownModal: React.FC<CBValuationBreakdownModalProps> = ({
  isOpen,
  bond,
  onClose,
  onApplyToCalculator
}) => {
  const [sentiment, setSentiment] = useState<'bullish_hot' | 'bullish_active' | 'neutral' | 'bearish_cool'>('bullish_hot');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('blended');

  if (!isOpen || !bond) return null;

  // 动态重新计算多模型结果 (支持实时调节情绪)
  const valuation: CBValuationResult = calculateCBValuation({
    stockPrice: bond.stockPrice,
    convertPrice: bond.convertPrice,
    issueSize: bond.issueSize,
    rating: bond.rating,
    industry: bond.industry,
    rightsPer100: bond.rightsPer100,
    rationPerShare: bond.rationPerShare,
    marketSentiment: sentiment
  });

  const { methods, midParityBenchmark, industryBenchmark } = valuation;

  // 4 大核心方法数组
  const methodList: SingleValuationMethodResult[] = [
    methods.industry,
    methods.ratingScale,
    methods.sentiment,
    methods.midParity,
    methods.blended
  ];

  const currentSelectedMethod = methodList.find(m => m.id === selectedMethodId) || methods.blended;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-4">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-4 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-black tracking-tight">可转债上市价格四大量化估价模型推导</h3>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-mono border border-indigo-400/30">
                  集思录中平价量化标准
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                核心公式：<strong className="text-amber-300 font-mono">预估上市价格 = 转股价值 × (1 + 预估溢价率)</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Bond Banner */}
        <div className="p-3.5 bg-indigo-50/60 border-b border-indigo-100 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-2.5">
            <span className="text-base font-black text-slate-900">{bond.stockName}</span>
            <span className="font-mono text-slate-500 font-semibold">{bond.stockCode}</span>
            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[11px] font-bold">
              {bond.bondName}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
              评级:{bond.rating}
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
              规模:{bond.issueSize}亿
            </span>
            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
              行业:{bond.industry}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-right font-mono">
            <div>
              <span className="text-[10px] text-slate-400 block">正股价 / 转股价</span>
              <span className="text-slate-800 font-bold">¥{bond.stockPrice.toFixed(2)} / ¥{bond.convertPrice.toFixed(2)}</span>
            </div>
            <div className="pl-3 border-l border-indigo-200">
              <span className="text-[10px] text-indigo-700 font-bold block">当前转股价值 (CV)</span>
              <span className="text-base font-black text-indigo-600">¥{valuation.convertValue.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs">

          {/* 4 Models Selector Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>四大预估溢价率模型测算对比 (点击卡片切换查看明细)：</span>
              </span>
              <span className="text-[10px] text-slate-400">
                面值 100 元，上市开盘价按交易所首日停牌与债底约束保护
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              
              {/* 1. 同行业对比法 */}
              <div 
                onClick={() => setSelectedMethodId('industry')}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                  selectedMethodId === 'industry'
                    ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-blue-900 text-xs flex items-center space-x-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>1. 同行业对比法</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-100/80 text-blue-700 font-semibold">
                    行业基准
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1 font-mono">
                  <span className="text-slate-500 text-[11px]">预估溢价率:</span>
                  <span className="font-black text-blue-700 text-sm">+{methods.industry.premiumRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-baseline justify-between font-mono mt-0.5">
                  <span className="text-slate-500 text-[11px]">预估上市价:</span>
                  <span className="font-black text-slate-900 text-base">¥{methods.industry.listingPrice.toFixed(2)}</span>
                </div>
                <div className="mt-1 pt-1 border-t border-blue-100 text-[10px] text-slate-500 leading-tight">
                  对标 {industryBenchmark.industry} 已上市标的 ({industryBenchmark.benchmarkPremium}%)
                </div>
              </div>

              {/* 2. 评级与规模法 */}
              <div 
                onClick={() => setSelectedMethodId('rating_scale')}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                  selectedMethodId === 'rating_scale'
                    ? 'bg-purple-50/80 border-purple-500 ring-2 ring-purple-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-purple-900 text-xs flex items-center space-x-1">
                    <Award className="w-3.5 h-3.5 text-purple-600" />
                    <span>2. 评级与规模法</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-purple-100/80 text-purple-700 font-semibold">
                    资质+小盘
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1 font-mono">
                  <span className="text-slate-500 text-[11px]">预估溢价率:</span>
                  <span className="font-black text-purple-700 text-sm">+{methods.ratingScale.premiumRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-baseline justify-between font-mono mt-0.5">
                  <span className="text-slate-500 text-[11px]">预估上市价:</span>
                  <span className="font-black text-slate-900 text-base">¥{methods.ratingScale.listingPrice.toFixed(2)}</span>
                </div>
                <div className="mt-1 pt-1 border-t border-purple-100 text-[10px] text-slate-500 leading-tight">
                  {bond.rating}评级基准 + {bond.issueSize}亿规模小盘加成
                </div>
              </div>

              {/* 3. 市场情绪法 */}
              <div 
                onClick={() => setSelectedMethodId('sentiment')}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                  selectedMethodId === 'sentiment'
                    ? 'bg-rose-50/80 border-rose-500 ring-2 ring-rose-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-rose-900 text-xs flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>3. 市场情绪法</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100/80 text-rose-700 font-semibold">
                    牛市20~30%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1 font-mono">
                  <span className="text-slate-500 text-[11px]">预估溢价率:</span>
                  <span className="font-black text-rose-700 text-sm">+{methods.sentiment.premiumRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-baseline justify-between font-mono mt-0.5">
                  <span className="text-slate-500 text-[11px]">预估上市价:</span>
                  <span className="font-black text-slate-900 text-base">¥{methods.sentiment.listingPrice.toFixed(2)}</span>
                </div>
                <div className="mt-1 pt-1 border-t border-rose-100 text-[10px] text-slate-500 leading-tight">
                  牛市亢奋溢价高弹性 (当前档: {methods.sentiment.tag})
                </div>
              </div>

              {/* 4. 中平价均值法 (集思录标准) */}
              <div 
                onClick={() => setSelectedMethodId('mid_parity')}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative ${
                  selectedMethodId === 'mid_parity'
                    ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-emerald-900 text-xs flex items-center space-x-1">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>4. 中平价均值法</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-100/80 text-emerald-700 font-semibold">
                    集思录+10%
                  </span>
                </div>
                <div className="flex items-baseline justify-between mt-1 font-mono">
                  <span className="text-slate-500 text-[11px]">预估溢价率:</span>
                  <span className="font-black text-emerald-700 text-sm">+{methods.midParity.premiumRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-baseline justify-between font-mono mt-0.5">
                  <span className="text-slate-500 text-[11px]">预估上市价:</span>
                  <span className="font-black text-slate-900 text-base">¥{methods.midParity.listingPrice.toFixed(2)}</span>
                </div>
                <div className="mt-1 pt-1 border-t border-emerald-100 text-[10px] text-slate-500 leading-tight">
                  90~110元均值{midParityBenchmark.averagePremium}%，新债吃香上浮10%
                </div>
              </div>

              {/* 5. 智能综合推荐模型 */}
              <div 
                onClick={() => setSelectedMethodId('blended')}
                className={`p-3 rounded-xl border transition-all cursor-pointer relative col-span-1 sm:col-span-2 md:col-span-2 ${
                  selectedMethodId === 'blended'
                    ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-slate-50/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-amber-900 text-xs flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>★ 智能综合加权推荐模型 (全面均衡)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-900 font-bold">
                    官方首选推荐
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div>
                    <div className="flex items-baseline justify-between font-mono">
                      <span className="text-slate-500 text-[11px]">推荐溢价率:</span>
                      <span className="font-black text-amber-700 text-base">+{methods.blended.premiumRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-baseline justify-between font-mono mt-0.5">
                      <span className="text-slate-500 text-[11px]">推荐上市价:</span>
                      <span className="font-black text-rose-600 text-lg">¥{methods.blended.listingPrice.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-600 border-l border-amber-200/80 pl-2.5 flex flex-col justify-center">
                    <span>预期涨幅: <strong className="font-mono text-rose-600 font-bold">+{methods.blended.listingGain.toFixed(2)}%</strong></span>
                    <span className="mt-0.5">对应安全垫: <strong className="font-mono text-emerald-700 font-bold">+{methods.blended.safetyMargin.toFixed(2)}%</strong></span>
                    <span className="text-[9px] text-slate-400 mt-0.5">赋权：行业30% + 规模30% + 集思录25% + 情绪15%</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* Selected Method Deep-Dive Panel */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center space-x-2">
                <span className="font-black text-slate-900 text-sm">{currentSelectedMethod.name}</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-white border border-slate-200 text-slate-700">
                  预估溢价率: +{currentSelectedMethod.premiumRate.toFixed(1)}%
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-rose-50 border border-rose-200 text-rose-700">
                  预估上市首日价: ¥{currentSelectedMethod.listingPrice.toFixed(2)}
                </span>
              </div>

              {/* Action: Apply to calculator */}
              {onApplyToCalculator && (
                <button
                  type="button"
                  onClick={() => onApplyToCalculator(bond, currentSelectedMethod.listingPrice)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center space-x-1 cursor-pointer"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>采纳此估价并测算配债</span>
                </button>
              )}
            </div>

            {/* Formula display */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 font-mono text-xs">
              <div className="text-[11px] text-slate-400 mb-0.5">精确数学推导算式:</div>
              <div className="font-bold text-slate-900 flex items-center space-x-2 flex-wrap">
                <span>{currentSelectedMethod.formulaDetail}</span>
                <span className="text-emerald-600 font-normal text-[11px]">
                  (首日理论涨幅: +{currentSelectedMethod.listingGain.toFixed(2)}% · 正股安全垫: +{currentSelectedMethod.safetyMargin.toFixed(2)}%)
                </span>
              </div>
            </div>

            {/* If Sentiment Method, show sentiment switcher */}
            {currentSelectedMethod.id === 'sentiment' && (
              <div className="p-3 bg-rose-50/50 rounded-lg border border-rose-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rose-900 flex items-center space-x-1">
                    <Flame className="w-3.5 h-3.5 text-rose-600" />
                    <span>动态切换市场情绪环境 (观察牛市与熊市溢价率弹性)：</span>
                  </span>
                  <span className="text-[11px] text-rose-700 font-mono">
                    牛市溢价率可达 20%~30%
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'bullish_hot', label: '🔥 牛市大亢奋', rate: '28.0%', desc: '溢价率28%~30%，资金爆炒' },
                    { id: 'bullish_active', label: '📈 偏强多头市', rate: '24.0%', desc: '溢价率22%~25%，新债受捧' },
                    { id: 'neutral', label: '⚖️ 均衡震荡市', rate: '20.0%', desc: '溢价率18%~22%，理性定价' },
                    { id: 'bearish_cool', label: '❄️ 冰点低迷市', rate: '10.0%', desc: '溢价率8%~12%，避险压制' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSentiment(tab.id as any)}
                      className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                        sentiment === tab.id
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                      }`}
                    >
                      <div className="font-bold text-xs">{tab.label}</div>
                      <div className={`font-mono text-[11px] font-bold ${sentiment === tab.id ? 'text-rose-100' : 'text-rose-600'}`}>
                        +{tab.rate}
                      </div>
                      <div className={`text-[9px] mt-0.5 ${sentiment === tab.id ? 'text-rose-100' : 'text-slate-400'}`}>
                        {tab.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Key Factors breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentSelectedMethod.keyFactors.map((factor, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200">
                  <span className="text-slate-500">{factor.label}:</span>
                  <span className="font-bold text-slate-900 font-mono text-right">{factor.value}</span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>估值解析依据：</strong>{currentSelectedMethod.description}
            </p>
          </div>

          {/* Jisilu Mid-Parity Real-time Standard Card */}
          <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 font-bold text-emerald-900 text-xs">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>集思录可转债行情【中平价均值法】基准与新债吃香定律</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-mono bg-emerald-100/70 px-2 py-0.5 rounded">
                数据来源: 集思录实时行情监控
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 font-mono">
                <div className="text-[10px] text-slate-400">90~110元转股价值区间</div>
                <div className="text-sm font-black text-emerald-700 mt-0.5">
                  {midParityBenchmark.sampleCount} 只样本债
                </div>
                <div className="text-[10px] text-slate-500">剔除深度虚值与深度实值干扰</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 font-mono">
                <div className="text-[10px] text-slate-400">市场当前中平价平均溢价率</div>
                <div className="text-sm font-black text-slate-900 mt-0.5">
                  +{midParityBenchmark.averagePremium.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500">已上市中平价转债平均水平</div>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-emerald-200 font-mono">
                <div className="text-[10px] text-emerald-700 font-bold">新债通常吃香 (均值上浮10%)</div>
                <div className="text-sm font-black text-rose-600 mt-0.5">
                  +{midParityBenchmark.finalNewBondPremium.toFixed(1)}% (给 26%~27%)
                </div>
                <div className="text-[10px] text-slate-500">无存量套牢盘，首日博弈受捧</div>
              </div>
            </div>

            <div className="text-[11px] text-emerald-900/80 leading-normal">
              💡 <strong>集思录实战经验法则：</strong> 新上市可转债筹码结构干净、无前期解套抛压，上市首日往往能够享受流动性溢价与首日冲高红利。直接按当前转股价值 90~110 元区间的市场溢价率均值上浮 10% 作为新债上市基准（如均值 24.2% 上浮至 26.6%），具有极高的预测胜率与安全边界。
            </div>
          </div>

          {/* Rating and Size Matrix Reference Table */}
          <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-200/70 space-y-2">
            <div className="font-bold text-purple-900 text-xs flex items-center space-x-1.5">
              <Award className="w-3.5 h-3.5 text-purple-600" />
              <span>评级与规模法对照表 (发债规模越小，溢价率越高)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2 bg-white rounded border border-purple-200">
                <span className="text-[10px] text-slate-500 block">AAA 评级基准</span>
                <span className="font-bold text-purple-700 text-sm">15.0%</span>
              </div>
              <div className="p-2 bg-white rounded border border-purple-200">
                <span className="text-[10px] text-slate-500 block">AA+ / AA 评级基准</span>
                <span className="font-bold text-purple-700 text-sm">10.0%</span>
              </div>
              <div className="p-2 bg-white rounded border border-purple-200">
                <span className="text-[10px] text-slate-500 block">AA- 评级基准</span>
                <span className="font-bold text-purple-700 text-sm">5.0%</span>
              </div>
              <div className="p-2 bg-white rounded border border-purple-200">
                <span className="text-[10px] text-slate-500 block">A+ 评级基准</span>
                <span className="font-bold text-purple-700 text-sm">0.0%</span>
              </div>
            </div>
            <div className="text-[10px] text-purple-800 font-mono">
              ⚡ <strong>规模修正矩阵：</strong> ≤3亿(+12%) · 3~5.5亿(+8%) · 6~12亿(+4%) · 12~25亿(0%) · 25~50亿(-2%) · &gt;50亿(-5%)
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-500 font-mono">
            标的：{bond.stockName} ({bond.stockCode}) · 转股价值 ¥{valuation.convertValue.toFixed(2)}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-200 font-semibold transition-colors cursor-pointer"
            >
              关闭
            </button>
            {onApplyToCalculator && (
              <button
                onClick={() => onApplyToCalculator(bond, currentSelectedMethod.listingPrice)}
                className="px-4 py-1.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-lg font-bold shadow-xs transition-all flex items-center space-x-1 cursor-pointer"
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>采纳 ¥{currentSelectedMethod.listingPrice.toFixed(1)} 测算抢权配债</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
