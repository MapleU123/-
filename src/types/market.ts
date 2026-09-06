export interface IndexQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  turnover: number; // in 100M RMB (亿元)
  volume: number; // in 10K lots (万手)
  sparkline: number[];
  timeSeries: { time: string; price: number; volume: number; avgPrice: number }[];
}

export type SectorCategory = 'industry' | 'concept' | 'region';
export type TimeDimension = 'today' | '3d' | '5d' | '10d' | '20d';

export interface SectorStock {
  code: string;
  name: string;
  price: number;
  changePercent: number;
  mainNetInflow: number; // 亿元
  mainNetRatio: number; // %
  turnover: number; // 亿元
  turnoverRate: number; // %
  superLargeInflow: number; // 亿元
  largeInflow: number;
  mediumInflow: number;
  smallInflow: number;
  peRatio?: number;
  marketCap?: number; // 亿元
}

export interface SectorFundFlow {
  id: string;
  name: string;
  category: SectorCategory;
  changePercent: number;
  mainNetInflow: number; // 亿元 (positive = inflow, negative = outflow)
  mainNetRatio: number; // %
  superLargeInflow: number; // 亿元
  largeInflow: number; // 亿元
  mediumInflow: number; // 亿元
  smallInflow: number; // 亿元
  totalTurnover: number; // 亿元
  turnoverRate: number; // %
  leadStock: {
    code: string;
    name: string;
    price: number;
    changePercent: number;
    mainNetInflow: number; // 亿元
  };
  dragStock?: {
    code: string;
    name: string;
    price: number;
    changePercent: number;
  };
  inflowMomentum: number; // 0-100
  priceMomentum: number; // -10 to +10
  stocksCount: number;
  upCount: number;
  downCount: number;
  flatCount: number;
  topStocks: SectorStock[];
  intradayInflowHistory: { time: string; netInflow: number; indexPrice: number }[];
  description?: string;
}

export type AnomalyType = 
  | 'rocket_surge' // 火箭发射 (短线急拉)
  | 'block_buy' // 巨单扫货 (万手大单买入)
  | 'block_sell' // 巨量砸盘 (万手大单卖出)
  | 'flash_dump' // 高位跳水 (快速跳水)
  | 'rapid_limit' // 封单剧增 (封单快速增加)
  | 'broken_limit' // 炸板异动 (打开涨停)
  | 'tail_rush' // 尾盘抢筹
  | 'support_buy'; // 压盘吸筹

export interface AnomalyAlert {
  id: string;
  time: string;
  stockCode: string;
  stockName: string;
  sectorName: string;
  type: AnomalyType;
  title: string;
  description: string;
  price: number;
  changePercent: number;
  amount: number; // 交易额 (万元/亿元)
  volumeLots: number; // 手
  severity: 'high' | 'medium' | 'normal';
  direction: 'bullish' | 'bearish' | 'neutral';
  orderDetail?: {
    type: 'buy' | 'sell';
    price: number;
    lots: number;
  };
}

export interface MarketBreadth {
  upCount: number;
  downCount: number;
  flatCount: number;
  limitUpCount: number;
  limitDownCount: number;
  brokenLimitUpCount: number;
  brokenLimitRate: number; // %
  totalTurnoverSH: number; // 亿元
  totalTurnoverSZ: number; // 亿元
  totalTurnoverBJ: number; // 亿元
  totalTurnoverAll: number; // 亿元
  turnoverDiffYesterday: number; // 亿元 (+放量, -缩量)
  sentimentScore: number; // 0-100
  sentimentLabel: '极度亢奋' | '情绪活跃' | '分化震荡' | '谨慎观望' | '市场冰点';
  ladder: {
    limit7Plus: { count: number; stocks: string[] };
    limit5To6: { count: number; stocks: string[] };
    limit3To4: { count: number; stocks: string[] };
    limit2: { count: number; stocks: string[] };
    firstLimit: { count: number; stocks: string[] };
  };
}

export interface NorthboundFlow {
  shNetBuy: number; // 沪股通 (亿元)
  szNetBuy: number; // 深股通 (亿元)
  totalNetBuy: number; // 北向合计 (亿元)
  southboundTotal: number; // 南向资金 (亿元)
  history: { time: string; shFlow: number; szFlow: number; total: number }[];
  topBuyStocks: { code: string; name: string; netBuy: number; changePercent: number }[];
  topSellStocks: { code: string; name: string; netSell: number; changePercent: number }[];
}

export interface Level2OrderBook {
  bids: { price: number; volume: number; percentage: number }[]; // 买一到买五
  asks: { price: number; volume: number; percentage: number }[]; // 卖一到卖五
}

export type ActiveNavigationTab = 
  | 'fundflow'    // 资金流看板 (Main screenshot view)
  | 'quant'       // 量化分析
  | 'gold'        // 黄金分析
  | 'toptraders'  // 实盘高手
  | 'anomalies'   // 短线精灵
  | 'usmarket'    // 美股行情
  | 'stockquery'  // 个股查询
  | 'crawler'     // 采集监控
  | 'sentiment'   // 市场情绪
  | 'overview'    // 大盘总览 (兼容)
  | 'sectors'     // 深度板块资金
  | 'watchlist';  // 自选股 (兼容)

export interface OverviewRankingItem {
  id: string;
  name: string;
  categoryName: '行业' | '概念' | '地域';
  changePercent: number;
  mainNetInflow: number; // 亿元
  totalTurnover: number; // 亿元
  leadStock?: {
    code: string;
    name: string;
    changePercent: number;
  };
}

export interface MarketOverviewData {
  industryBreadth: {
    up: number;
    down: number;
    flat: number;
    avgChangePercent: number;
    mainNetInflow: number; // 亿元
    timestamp: string;
  };
  conceptBreadth: {
    up: number;
    down: number;
    flat: number;
    avgChangePercent: number;
    mainNetInflow: number; // 亿元
    timestamp: string;
  };
  dataRangeStart: string;
  dataRangeEnd: string;
  totalRecords: number;
  collectionRound: number;
  industrySectorCount: number;
  conceptSectorCount: number;
  lastCollectTime: string;
  pageRefreshTime: string;
  topGainers: OverviewRankingItem[];
  topLosers: OverviewRankingItem[];
  topInflow: OverviewRankingItem[];
  topOutflow: OverviewRankingItem[];
}

export interface WatchlistStock {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  mainNetInflow: number; // 亿元
  superLargeInflow: number; // 亿元
  turnoverRate: number; // %
  turnover: number; // 亿元
  sectorName: string;
  addedAt: string;
  notes?: string;
  sparkline: number[];
}

export interface AIAnalysisResult {
  title: string;
  summary: string;
  marketOutlook: '看多' | '谨慎看多' | '中性震荡' | '防守避险';
  capitalFlowAnalysis: string;
  hotSectorInsights: { sector: string; logic: string; riskLevel: '低' | '中' | '高' }[];
  anomalyVerdict: string;
  tacticalAdvice: string[];
  keySupportResistance: {
    shSupport: number;
    shResistance: number;
    turnoverThreshold: string;
  };
}
