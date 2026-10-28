export type ETFCategory = 'broad' | 'strategy' | 'industry' | 'theme' | 'global';

export type ETFValuationStatus = '极度低估' | '低估' | '正常' | '高估' | '极度高估';

export type ETFQuantRating = '积极定投' | '适度配置' | '持有观望' | '逢高止盈' | '谨慎防守';

export interface ETFTopHolding {
  name: string;
  weight: number; // %
}

export interface ETFValuationItem {
  id: string;
  code: string;                 // ETF代码 e.g. "510300"
  name: string;                 // ETF名称 e.g. "沪深300ETF"
  indexCode: string;            // 追踪指数代码 e.g. "000300.SH"
  indexName: string;            // 追踪指数名称 e.g. "沪深300"
  category: ETFCategory;        // 'broad' | 'strategy' | 'industry' | 'theme' | 'global'
  categoryName: string;         // '宽基' | '策略' | '行业' | '主题' | '全球'
  price: number;                // 最新净值/交易价格
  changePercent: number;        // 当日涨跌幅 %
  pe: number;                   // 市盈率 PE-TTM
  pePercentile: number;         // 兼容字段: 近10年PE历史分位数 % (0-100)
  pePercentile5y: number;       // 近5年PE历史分位数 % (0-100)
  pePercentile10y: number;      // 近10年PE历史分位数 % (0-100)
  pe10yMin: number;             // 10年PE最低值
  pe10yMax: number;             // 10年PE最高值
  pe10yMedian: number;          // 10年PE中位数
  pb: number;                   // 市净率 PB
  pbPercentile: number;         // 近10年PB历史分位数 %
  dividendYield: number;        // 股息率 %
  premiumRate: number;          // 折溢价率 % (正为溢价，负为折价)
  aum: number;                  // 基金总规模 (亿元)
  turnover: number;             // 当日成交金额 (亿元)
  status: ETFValuationStatus;   // 极度低估 | 低估 | 正常 | 高估 | 极度高估
  quantRating: ETFQuantRating;  // 量化投资建议
  topHoldings: ETFTopHolding[]; // 核心重仓成分股 Top 4
  description: string;          // 投研配置评述
}

export const ETF_CATEGORY_NAMES: Record<ETFCategory, string> = {
  broad: '宽基',
  strategy: '策略',
  industry: '行业',
  theme: '主题',
  global: '全球'
};

export const ETF_STATUS_COLORS: Record<ETFValuationStatus, { text: string; bg: string; border: string }> = {
  '极度低估': { text: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/60', border: 'border-emerald-200 dark:border-emerald-800' },
  '低估': { text: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/60', border: 'border-green-200 dark:border-green-800' },
  '正常': { text: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/60', border: 'border-blue-200 dark:border-blue-800' },
  '高估': { text: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/60', border: 'border-orange-200 dark:border-orange-800' },
  '极度高估': { text: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950/60', border: 'border-red-200 dark:border-red-800' }
};
