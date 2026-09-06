import React, { useState, useEffect } from 'react';
import { AIAnalysisResult } from '../types/market';
import { marketService } from '../services/marketService';
import { 
  X, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  AlertTriangle, 
  Lightbulb, 
  CheckCircle2,
  RefreshCw,
  Layers,
  Compass
} from 'lucide-react';

interface AIMarketAdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSector?: string;
}

export const AIMarketAdvisorModal: React.FC<AIMarketAdvisorModalProps> = ({
  isOpen,
  onClose,
  targetSector
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const data = await marketService.requestAIDiagnosis(targetSector);
      setResult(data);
    } catch {
      // Handled in marketService fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAnalysis();
    }
  }, [isOpen, targetSector]);

  if (!isOpen) return null;

  const outlookColors: Record<string, string> = {
    '看多': 'bg-rose-600 text-white shadow-rose-900/50 shadow-md',
    '谨慎看多': 'bg-amber-600 text-white shadow-amber-900/50 shadow-md',
    '中性震荡': 'bg-slate-700 text-slate-200',
    '防守避险': 'bg-emerald-700 text-white'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        id="ai-market-advisor-modal"
        className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">
                  {targetSector ? `${targetSector} · 资金流AI研判` : 'A股主力资金流向全景智能研判'}
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  Gemini 3.7 Flash
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                基于八大指数、板块超大单净流入、全市场情绪与盘口异动深度推演
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchAnalysis}
              disabled={loading}
              title="重新生成研判"
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-rose-500/30 border-t-rose-500 animate-spin" />
              <Sparkles className="w-5 h-5 text-amber-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <p className="text-xs text-slate-300 font-medium animate-pulse">
              Gemini 正在多维度解析板块超大单、主力筹码分布与大盘支撑压力...
            </p>
          </div>
        ) : result ? (
          <div className="space-y-4.5 my-4">
            {/* Top Outlook Card */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-xs text-slate-400">大盘综合多空研判</div>
                <div className="text-base font-bold text-slate-100 mt-0.5">{result.title}</div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-400">市场倾向:</span>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${outlookColors[result.marketOutlook] || 'bg-rose-600 text-white'}`}>
                  {result.marketOutlook}
                </span>
              </div>
            </div>

            {/* Core Summary */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <strong className="text-rose-400 block mb-1">【全市场资金流总括】</strong>
              {result.summary}
            </div>

            {/* Capital Flow Structure Breakdown */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-center space-x-1.5 text-slate-100 font-semibold mb-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>主力超大单与博弈动向解读</span>
              </div>
              <p>{result.capitalFlowAnalysis}</p>
            </div>

            {/* Hot Sector Insights */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-100 mb-3">
                <TrendingUp className="w-4 h-4 text-rose-400" />
                <span>主力重点介入板块逻辑与持续性</span>
              </div>

              <div className="space-y-2 text-xs">
                {result.hotSectorInsights.map((insight, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-slate-100">{insight.sector}</span>
                      <p className="text-slate-400 text-[11px] mt-0.5">{insight.logic}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold w-fit ${
                      insight.riskLevel === '高' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                      insight.riskLevel === '中' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                      'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    }`}>
                      风险: {insight.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Anomaly Verdict */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-center space-x-1.5 text-slate-100 font-semibold mb-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>异动个股与突发盘口意图研判</span>
              </div>
              <p>{result.anomalyVerdict}</p>
            </div>

            {/* Key Price Levels */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400">上证指数关键支撑位</div>
                <div className="text-base font-bold font-mono text-emerald-400 mt-1">
                  {result.keySupportResistance.shSupport} 点
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400">上证指数关键压力位</div>
                <div className="text-base font-bold font-mono text-rose-400 mt-1">
                  {result.keySupportResistance.shResistance} 点
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-slate-400">成交量动能阈值</div>
                <div className="text-xs font-medium text-slate-200 mt-1 leading-snug">
                  {result.keySupportResistance.turnoverThreshold}
                </div>
              </div>
            </div>

            {/* Tactical Advice List */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-300 mb-2">
                <Lightbulb className="w-4 h-4" />
                <span>实操策略与风控提示</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {result.tacticalAdvice.map((advice, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{advice}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
