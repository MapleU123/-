/**
 * 31 Shenwan Industry Valuation Data Types & Standards
 * 申万一级31个行业指数估值模型
 */

export type ValuationStatus = '极度低估' | '低估' | '正常' | '高估' | '极度高估';

export interface IndustryValuationItem {
  id: string;
  code: string;               // 指数代码 (如 801010.SI / 000814)
  name: string;               // 申万一级行业名称 (31个行业)
  pe: number;                 // 最新市盈率 (PE-TTM)
  pePercentile: number;       // 市盈率历史百分位 (0~100%)
  pbPercentile: number;       // 市净率历史百分位 (0~100%)
  pb: number;                 // 最新市净率 (PB)
  roe: number;                // 净资产收益率 ROE (%)
  weekChange: number;         // 近一周涨跌幅 (%)
  monthChange: number;        // 当月涨跌幅 (%)
  status: ValuationStatus;    // 估值状态划分
  dividendYield: number;      // 股息率 (%)
  historicalPeMedian: number; // 历史中位数 PE
  historicalPeMin: number;    // 历史最低 PE (近10年)
  historicalPeMax: number;    // 历史最高 PE (近10年)
  leadingStocks: string[];    // 代表性龙头权重股
  subSectorCount: number;     // 下辖二级子行业数
  description: string;        // 估值与基本面核心投资点评
}

/**
 * 根据市盈率/估值综合百分位计算估值区间划分
 * - < 10%: 极度低估 (Deep Undervalued)
 * - 10% ~ 30%: 低估 (Undervalued)
 * - 30% ~ 70%: 正常 / 合理 (Fair Value)
 * - 70% ~ 90%: 高估 (Overvalued)
 * - >= 90%: 极度高估 (Deep Overvalued)
 */
export function getValuationStatus(percentile: number): ValuationStatus {
  if (percentile < 10) return '极度低估';
  if (percentile < 30) return '低估';
  if (percentile <= 70) return '正常';
  if (percentile < 90) return '高估';
  return '极度高估';
}

/**
 * 估值状态对应视觉样式与徽章颜色
 */
export function getValuationStatusBadgeStyle(status: ValuationStatus): {
  bg: string;
  text: string;
  border: string;
  dot: string;
  tagClass: string;
} {
  switch (status) {
    case '极度低估':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-500 font-bold',
        border: 'border-emerald-500/30',
        dot: 'bg-emerald-500',
        tagClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
      };
    case '低估':
      return {
        bg: 'bg-teal-500/10',
        text: 'text-teal-500 font-semibold',
        border: 'border-teal-500/30',
        dot: 'bg-teal-400',
        tagClass: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800'
      };
    case '正常':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-500 font-medium',
        border: 'border-blue-500/30',
        dot: 'bg-blue-400',
        tagClass: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
      };
    case '高估':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-500 font-semibold',
        border: 'border-amber-500/30',
        dot: 'bg-amber-400',
        tagClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
      };
    case '极度高估':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-500 font-bold',
        border: 'border-rose-500/30',
        dot: 'bg-rose-500',
        tagClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
      };
  }
}
