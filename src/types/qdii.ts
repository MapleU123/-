export type QDIIIndexCategory = 'all' | 'nasdaq' | 'sp500' | 'tech';

export type QDIIQuotaStatus = 
  | 'suspended'      // 暂停申购 (0元)
  | 'ultra_strict'   // 极严限购 (<= 300元)
  | 'strict'         // 严格限额 (301 ~ 1000元)
  | 'moderate'       // 适度限购 (1001 ~ 5000元)
  | 'relaxed';       // 宽松/不限额 (> 5000元 或 无限额)

export type QDIIFundType = 
  | 'otc_feeder_a'   // 场外联接 A类
  | 'otc_feeder_c'   // 场外联接 C类
  | 'etf_floor'      // 场内 ETF
  | 'lof_floor'      // 场内 LOF
  | 'direct_otc';    // 场外普通QDII

export interface QDIIFundItem {
  id: string;
  code: string;                     // 基金代码, e.g. '270042'
  name: string;                     // 基金名称, e.g. '广发纳斯达克100ETF联接A(人民币)'
  shortName: string;                // 简称, e.g. '广发纳指100联接A'
  company: string;                  // 基金管理人, e.g. '广发基金'
  indexCategory: 'nasdaq' | 'sp500' | 'tech'; // 标的分类
  indexName: string;                // 标的指数名称, e.g. '纳斯达克100指数', '标普500指数'
  quotaStatus: QDIIQuotaStatus;     // 额度状态
  dailyLimitAmount: number;         // 单日单账户申购限额 (元), 0 = 暂停申购, 9999999 = 不限额
  dailyLimitText: string;           // 限额展示文本, e.g. '¥1,000', '¥100', '暂停申购', '不限额'
  regularInvestLimit: number;       // 定投单日/单笔限额 (元)
  regularInvestText: string;        // 定投限额展示, e.g. '¥1,000', '暂停定投', '开放定投'
  fundType: QDIIFundType;           // 基金类型
  fundTypeLabel: string;            // 类型标签: '场外联接A' | '场外联接C' | '场内ETF' | '场内LOF'
  shareCurrency: 'RMB' | 'USD';     // 人民币 / 美元份额
  
  // 场内对应与溢价率
  etfFloorCode?: string;            // 场内对应ETF代码, e.g. '159941'
  etfFloorName?: string;            // 场内ETF名称, e.g. '广发纳指100ETF'
  premiumRate?: number;             // 场内折溢价率 (%), e.g. +2.45, -0.32
  floorPrice?: number;              // 场内最新价 (元)
  
  // 净值与行情
  latestNav: number;                // 最新单位净值 (元)
  navDate: string;                  // 净值公布日期, e.g. '2026-09-16'
  dayChangePercent: number;         // 最新公布日净值涨跌幅 (%)
  ytdReturn: number;                // 今年以来收益率 (%)
  oneYearReturn: number;            // 近1年收益率 (%)
  
  // 规模与费用
  fundSize?: number;                // 基金最新规模 (亿元)
  feeRate: string;                  // 管理费+托管费, e.g. '0.50% + 0.15%/年'
  
  // 公告与限购动向
  lastLimitDate: string;            // 最近调整限额日期, e.g. '2026-08-20'
  noticeTitle?: string;             // 公告标题
  limitReason?: string;             // 限购原因, e.g. '外汇局QDII境外投资额度上限紧俏'
  tips?: string;                    // 操作建议/配置贴士
}

export interface QDIISummaryStats {
  totalFundsCount: number;          // 纳入统计的基金总数
  nasdaqCount: number;              // 纳斯达克系列基金数
  sp500Count: number;               // 标普500系列基金数
  suspendedCount: number;           // 暂停申购基金数
  strictLimitedCount: number;       // 严格限购 (<=1000元) 基金数
  openCount: number;                // 宽松/开放申购 (>5000元) 基金数
  etfHighPremiumCount: number;      // 场内高溢价 (>3%) ETF数
  averageDailyLimit: number;        // 平均申购限额 (不含暂停)
  lastUpdated: string;              // 最新统计时间
}
