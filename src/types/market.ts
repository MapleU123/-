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
  fiveDayHistory?: SectorDailyTrendPoint[];
  trendPattern?: SectorTrendPattern;
  description?: string;
}

export interface SectorDailyTrendPoint {
  date: string; // MM-DD
  fullDate: string; // YYYY-MM-DD
  dayLabel: string; // 'T-4', '昨日', '今日'
  netInflow: number; // 亿元
  changePercent: number; // %
  turnover?: number; // 亿元
  mainNetRatio?: number; // %
}

export type SectorTrendPattern = 
  | 'continuous_inflow'   // 持续净流入 (机构建仓/波段主升)
  | 'impulse_inflow'      // 脉冲式进入 (游资突袭/谨防回落)
  | 'impulse_retest'      // 脉冲后蓄势 (良性换手/蓄势吸筹)
  | 'fluctuating'         // 震荡博弈 (多空分歧/拉锯盘整)
  | 'continuous_outflow'; // 持续净流出 (主力减持/避险观望)

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
  | 'fundflow'            // 资金流看板 (Main screenshot view)
  | 'etf_valuation'       // ETF基金估值 (宽基/策略/行业/主题/全球)
  | 'industry_valuation'  // 31个行业指数估值 (申万一级市盈率百分位/极度低估到高估)
  | 'heatmap'             // 市场热力图 (全市场个股涨跌幅热力图与高清导出)
  | 'cb_pre'              // 待发转债 (集思录全流程与抢权配债跟踪)
  | 'qdii'                // QDII额度 (纳指/标普500额度与限购监控)
  | 'quant'               // 量化分析
  | 'gold'                // 黄金分析
  | 'toptraders'          // 实盘高手
  | 'anomalies'           // 短线精灵
  | 'usmarket'            // 美股行情
  | 'stockquery'          // 个股查询
  | 'crawler'             // 采集监控
  | 'sentiment'           // 市场情绪
  | 'custom_sectors'      // 自定义板块 (个性化资金流跟踪与组合分析)
  | 'overview'            // 大盘总览 (兼容)
  | 'sectors'             // 深度板块资金
  | 'watchlist';          // 自选股 (兼容)

export * from './qdii';
export * from './industryValuation';
export * from './etfValuation';
export * from './customSector';

// 待发可转债 6大流程阶段类型定义
export type CBProgressStage = 
  | 'board_plan'            // 1. 董事会预案
  | 'shareholder_approved'  // 2. 股东大会批准
  | 'exchange_accepted'     // 3. 交易所受理
  | 'committee_approved'    // 4. 上市委通过 (发审委/上市委通过)
  | 'csrc_registered'       // 5. 同意注册 (证监会同意注册)
  | 'issue_announced';      // 6. 发行公告 (刊登招募意向/申购就绪)

export interface PendingConvertibleBond {
  id: string;
  stockCode: string;             // 股票代码, e.g. '002997'
  stockName: string;             // 正股名称, e.g. '瑞鹄模具R'
  bondCode: string;              // 转债代码, e.g. '127116' (若未公布则为 '-')
  bondName: string;              // 转债简称, e.g. '瑞鹄转02'
  stage: CBProgressStage;        // 流程阶段标识
  stageName: string;             // 流程名称, e.g. '发行公告'
  stageStep: number;             // 1-6 进度步骤
  stageDate?: string;            // 方案进展具体生效日期, e.g. '2026-09-17'
  stageDateChinese?: string;     // 方案进展中文日期, e.g. '2026年9月17日'
  subscribeDate: string;         // 申购日期, e.g. '2026-09-17' 或 '待定'
  subscribeCode: string;         // 申购代码, e.g. '072997' 或 '-'
  recordDate: string;            // 股权登记日 (抢权配债日), e.g. '2026-09-16' 或 '-'
  issueSize: number;             // 发行规模 (亿元), e.g. 6.86
  securityType: string;          // 证券类型, e.g. '可转债'
  rating: string;                // 信用评级, e.g. 'AA', 'AAA'
  guarantee: string;             // 担保情况, e.g. '-' 或 '无担保'
  convertPrice: number;          // 转股价 (元), e.g. 29.18
  stockPrice: number;            // 最新正股价 (元), e.g. 29.03
  stockChangePercent: number;    // 正股涨跌幅 (%), e.g. -0.72
  convertValue: number;          // 转股价值 (%), e.g. 99.49
  rationPerShare: number;        // 每股配售额 (元/股), e.g. 2.29
  rightsPer100: number;          // 百元股票含权 (元), e.g. 11.29
  coefficient?: number;          // 配售比例/系数, e.g. 3.2772
  sharesPerHand: number;         // 配一手所需股数 (一手党), e.g. 306
  safetyMargin: number;          // 精确安全垫 (%), e.g. 2.82
  estimatedListingPrice?: number; // 预估上市价格 (元/张), e.g. 128.50
  estimatedListingGain?: number;  // 预估上市涨幅 (%), e.g. 28.50
  estimatedPremiumRate?: number;  // 预估转股溢价率 (%), e.g. 25.0
  valuationNote?: string;        // 估值驱动逻辑说明
  valuationDetail?: any;         // 4大估价模型(同行业、评级规模、情绪、集思录中平价)明细
  industry: string;              // 所属行业, e.g. '汽车零部件'
  latestUpdate: string;          // 最新公告更新日期, e.g. '2026-09-16'
  history: {
    boardDate?: string;          // 董事会预案日
    shareholderDate?: string;    // 股东大会批准日
    exchangeDate?: string;       // 交易所受理日
    committeeDate?: string;      // 上市委通过日
    regDate?: string;            // 同意注册日
    announceDate?: string;       // 发行公告日
  };
  remark?: string;               // 关键亮点/备考说明
  pb?: number;                   // 市净率 PB
  rationCode?: string;           // 配售代码
  verifiedSources?: string[];    // 数据核验通道列表
  dataSourceVerification?: string; // 核验说明
  updateTime?: string;           // 数据更新核验时间戳
  isNewIssue?: boolean;          // 是否为近期新发债/新预案
  newIssueDate?: string;         // 新发债日期
  isProgressUpdated?: boolean;   // 是否有最新审核进展推进
  progressChangeDesc?: string;   // 进展推进描述 (如: 上市委通过、批文生效、定档申购)
  updateBadge?: 'new_issue' | 'progress_update' | 'filing_soon' | null;
}

export interface CBRecentEvent {
  id: string;
  type: 'new_issue' | 'progress_advance' | 'filing_announced';
  title: string;
  description: string;
  stockCode: string;
  stockName: string;
  bondName: string;
  stageName: string;
  issueSize: number;
  date: string;
  time?: string;
  isFresh?: boolean;
}

export interface CBProgressSummary {
  totalCount: number;
  totalIssueSize: number;       // 亿元
  announcedCount: number;        // 发行公告 / 待申购
  registeredCount: number;       // 同意注册
  committeeCount: number;        // 上市委通过
  exchangeCount: number;         // 交易所受理
  shareholderCount: number;      // 股东大会
  boardCount: number;            // 董事会预案
  highRightsCount: number;       // 百元含权>10元标的数
  lastSyncTime: string;          // 数据源最新同步时间
  verifiedCount?: number;        // 多通道已交叉核验标的数
  sourceChannels?: string[];     // 来源核验渠道名称列表
  newIssueCount?: number;        // 新发债/新预案数量
  progressUpdatedCount?: number; // 进展推进标的数量
  recentEvents?: CBRecentEvent[]; // 最新异动与新发债事件流
}

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
