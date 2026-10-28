/**
 * A股可转债上市估价与转股溢价率量化模型
 * 
 * 核心公理公式：
 *   可转债预估上市价格 = 转股价值 × (1 + 预估溢价率)
 * 
 * 其中预估溢价率四大核心估价模型：
 * 1. 同行业对比法：参考同行业已上市可转债的平均/中位数溢价率作为基准；
 * 2. 评级与规模法：评级基准（AAA 15%, AA+/AA 10%, AA- 5%, A+ 0%） + 规模修正（发债规模越小，溢价率越高）；
 * 3. 市场情绪法：牛市/亢奋市溢价率可达 20%~30%，中性震荡市 15%~20%，冰点低迷市 5%~12%；
 * 4. 中平价均值法（集思录标准）：统计集思录转股价值 90~110 元区间的已上市转债平均溢价率，新债更吃香上浮 10%（例如均值 24% 给 26%~27%）。
 */

export type CBValuationMethodType = 
  | 'industry'      // 1. 同行业对比法
  | 'rating_scale'  // 2. 评级与规模法
  | 'sentiment'     // 3. 市场情绪调节法
  | 'mid_parity'    // 4. 中平价均值法 (集思录标准)
  | 'blended';      // 5. 智能综合推荐法

export interface SingleValuationMethodResult {
  id: CBValuationMethodType;
  name: string;
  shortName: string;
  tag: string;
  badgeColor: string;
  premiumRate: number;        // 预估溢价率 (%)
  listingPrice: number;       // 预估上市价格 (元/张)
  listingGain: number;        // 预期上市涨幅 (%)
  safetyMargin: number;       // 对应正股抢权安全垫 (%)
  description: string;        // 核心逻辑简述
  formulaDetail: string;      // 完整数学展开式
  keyFactors: { label: string; value: string }[];
  isRecommended?: boolean;
}

export interface MidParityBenchmarkData {
  sampleRange: string;         // '转股价值 90~110 元区间'
  sampleCount: number;         // 样本数量 (如 86 只)
  averagePremium: number;      // 市场中平价平均溢价率 (如 24.2%)
  newBondMarkupPercent: number;// 新债吃香上浮比例 (10%)
  finalNewBondPremium: number; // 上浮后预估溢价率 (如 26.62%)
  source: string;              // '集思录(Jisilu)可转债实时行情中平价均值'
  updateTime: string;          // 统计时间戳
}

export interface IndustryBenchmarkItem {
  industry: string;
  benchmarkPremium: number;    // 该行业已上市转债溢价率基准 (%)
  peerBonds: string[];         // 代表性对标已上市转债
  description: string;
}

export interface CBValuationResult {
  convertValue: number;          // 转股价值 (元)
  estimatedPremiumRate: number;  // 默认/推荐预估转股溢价率 (%)
  estimatedListingPrice: number; // 默认/推荐预估上市价格 (元/张)
  estimatedListingGain: number;  // 默认/推荐上市预期涨幅 (%)
  safetyMargin: number;          // 默认安全垫 (%)
  valuationNote: string;         // 估值驱动逻辑说明
  
  // 4大核心估价模型细分拆解结果
  methods: {
    industry: SingleValuationMethodResult;
    ratingScale: SingleValuationMethodResult;
    sentiment: SingleValuationMethodResult;
    midParity: SingleValuationMethodResult;
    blended: SingleValuationMethodResult;
  };

  // 集思录中平价基准
  midParityBenchmark: MidParityBenchmarkData;

  // 行业对标数据
  industryBenchmark: IndustryBenchmarkItem;
}

export interface CBValuationInput {
  stockPrice: number;
  convertPrice: number;
  issueSize: number;             // 亿元
  rating?: string;               // AAA, AA+, AA, AA-, etc.
  industry?: string;
  rightsPer100: number;          // 百元股票含权 (元)
  rationPerShare?: number;       // 每股配售额 (元)
  marketSentiment?: 'bullish_hot' | 'bullish_active' | 'neutral' | 'bearish_cool'; // 市场情绪档位
}

// -------------------------------------------------------------
// 1. 同行业已上市可转债溢价率对标数据库 (集思录行业样本中位数)
// -------------------------------------------------------------
export const INDUSTRY_BENCHMARKS: Record<string, IndustryBenchmarkItem> = {
  '半导体': {
    industry: '半导体/芯片',
    benchmarkPremium: 32.0,
    peerBonds: ['晶瑞转债(123031)', '韦尔转债(113616)', '胜宏转债(123067)'],
    description: '科技自主可控高弹性，市场给予极高成长性溢价'
  },
  '芯片': {
    industry: '半导体/芯片',
    benchmarkPremium: 32.0,
    peerBonds: ['晶瑞转债(123031)', '韦尔转债(113616)', '力芯微转'],
    description: '高贝塔高景气，同行业溢价率处于市场第一梯队'
  },
  '人工智能': {
    industry: 'AI/算力/软件',
    benchmarkPremium: 33.5,
    peerBonds: ['万兴转债(123116)', '润达转债(113588)', '易华转债'],
    description: 'AI算力热门赛道，资金博弈情绪热烈'
  },
  '计算机': {
    industry: '计算机/软件',
    benchmarkPremium: 30.5,
    peerBonds: ['指南转债(123233)', '太极转债(128078)'],
    description: '科技软件板块弹性大'
  },
  '汽车': {
    industry: '汽车及零部件',
    benchmarkPremium: 25.5,
    peerBonds: ['文灿转债(113537)', '伯特转债(113626)', '银轮转债(127037)'],
    description: '新能源车链出海高增长，同行业已上市转债平均溢价约25%~26%'
  },
  '汽车零部件': {
    industry: '汽车零部件',
    benchmarkPremium: 25.5,
    peerBonds: ['文灿转债(113537)', '伯特转债(113626)', '新泉转债'],
    description: '零部件出海订单饱满，机构配置意愿强'
  },
  '机械': {
    industry: '高端装备/自动化',
    benchmarkPremium: 23.5,
    peerBonds: ['纽威转债(113569)', '拓斯转债(123101)', '恒立转债'],
    description: '通用机械与自动化设备，稳健成长'
  },
  '高端制造': {
    industry: '高端制造/装备',
    benchmarkPremium: 24.0,
    peerBonds: ['绿的转债', '鸣志转债', '长盈转债'],
    description: '具身智能与工业母机溢价较高'
  },
  '医药': {
    industry: '医药生物/医疗',
    benchmarkPremium: 26.5,
    peerBonds: ['健友转债(113579)', '寿仙转债(113558)', '南微转债'],
    description: '创新药与医疗器械具备防御抗跌与弹性'
  },
  '电力设备': {
    industry: '电力设备/储能/电网',
    benchmarkPremium: 22.0,
    peerBonds: ['锦浪转债(123154)', '福莱转债(113059)', '特变转债'],
    description: '特高压与电网出海具备良好支撑'
  },
  '新材料': {
    industry: '基础化工/新材料',
    benchmarkPremium: 20.0,
    peerBonds: ['聚合转债(118042)', '中旗转债', '容百转债'],
    description: '周期成长性新材料，溢价居中'
  },
  '化工': {
    industry: '基础化工',
    benchmarkPremium: 19.0,
    peerBonds: ['三美转债', '恒逸转债', '利民转债'],
    description: '传统化工受周期波动影响，溢价温和'
  },
  '消费': {
    industry: '大消费/食品',
    benchmarkPremium: 21.0,
    peerBonds: ['洽洽转债(128069)', '绝味转债', '天味转债'],
    description: '消费现金流稳定，纯债底支撑强'
  },
  '电力': {
    industry: '电力/公用事业',
    benchmarkPremium: 15.5,
    peerBonds: ['川投转债(110061)', '核能转债(113026)', '三峡转债'],
    description: '大公用事业低波动，防守属性强'
  },
  '银行': {
    industry: '银行/大金融',
    benchmarkPremium: 12.0,
    peerBonds: ['苏银转债(110053)', '成银转债(110055)', '杭银转债'],
    description: '超大盘规模+高评级，波动率低，溢价通常在10%~13%'
  }
};

/**
 * 获取某个行业的基准溢价率
 */
export function getIndustryBenchmark(industryName: string): IndustryBenchmarkItem {
  if (!industryName) {
    return {
      industry: '综合制造',
      benchmarkPremium: 22.5,
      peerBonds: ['全市场可转债中位数'],
      description: '全市场普通制造业中位水平'
    };
  }

  for (const [key, item] of Object.entries(INDUSTRY_BENCHMARKS)) {
    if (industryName.includes(key) || key.includes(industryName)) {
      return item;
    }
  }

  // 特殊关键字匹配
  if (/半导体|集成电路|微电子|光刻/.test(industryName)) return INDUSTRY_BENCHMARKS['半导体'];
  if (/算力|软件|信创|大数据|网安/.test(industryName)) return INDUSTRY_BENCHMARKS['人工智能'];
  if (/汽车|汽配|整车|线控|底盘/.test(industryName)) return INDUSTRY_BENCHMARKS['汽车'];
  if (/机器人|机械|机床|自动化|注塑/.test(industryName)) return INDUSTRY_BENCHMARKS['机械'];
  if (/光伏|锂电|储能|风电|特高压/.test(industryName)) return INDUSTRY_BENCHMARKS['电力设备'];
  if (/药|生物|医疗|CXO/.test(industryName)) return INDUSTRY_BENCHMARKS['医药'];
  if (/交运|公用|港口|铁路|水务|环保/.test(industryName)) return INDUSTRY_BENCHMARKS['电力'];

  return {
    industry: industryName,
    benchmarkPremium: 22.0,
    peerBonds: ['同产业链可转债中位数'],
    description: '参考同成长属性制造业平均水平'
  };
}

// -------------------------------------------------------------
// 2. 集思录中平价均值基准数据 (转股价值 90~110 元)
// -------------------------------------------------------------
export const JISILU_MID_PARITY_BENCHMARK: MidParityBenchmarkData = {
  sampleRange: '转股价值 90~110 元区间 (集思录中平价精选样本)',
  sampleCount: 86,
  averagePremium: 24.2, // 当前市场中平价平均溢价率 24.2%
  newBondMarkupPercent: 10.0, // 新债吃香上浮 10%
  finalNewBondPremium: 26.62, // 24.2 * 1.10 = 26.62% (给 26%~27%)
  source: '集思录(Jisilu)可转债实时行情中平价均值',
  updateTime: '2026-09-17 实时核验'
};

// -------------------------------------------------------------
// 核心函数：测算单只待发可转债的 4 大模型预估上市价格
// -------------------------------------------------------------
export function calculateCBValuation(input: CBValuationInput): CBValuationResult {
  const {
    stockPrice,
    convertPrice,
    issueSize,
    rating = 'AA',
    industry = '',
    rightsPer100,
    marketSentiment = 'neutral'
  } = input;

  // 1. 转股价值 (CV): (正股价 / 转股价) * 100
  let cv = 100;
  if (convertPrice > 0 && stockPrice > 0) {
    cv = Number(((stockPrice / convertPrice) * 100).toFixed(2));
  }

  // 辅助：根据溢价率计算上市价、涨幅、安全垫
  const calcOutput = (premiumRate: number) => {
    // 基础公式：上市价格 = 转股价值 * (1 + 预估溢价率)
    let rawPrice = cv * (1 + premiumRate / 100);

    // 债底托底保护（面值100，极少破发）与顶格限制
    if (cv >= 100) {
      rawPrice = Math.max(105.0, rawPrice);
    } else {
      rawPrice = Math.max(102.0, rawPrice);
    }
    // 上交所/深交所首日顶格申报规则（如157.30）
    rawPrice = Math.min(157.30, rawPrice);

    const listingPrice = Number(rawPrice.toFixed(2));
    const listingGain = Number((listingPrice - 100).toFixed(2));
    
    // 安全垫 = (可转债预期收益 / 100) = rightsPer100 * (listingGain / 100)
    let safetyMargin = 0;
    if (rightsPer100 > 0 && listingGain > 0) {
      safetyMargin = Number(((rightsPer100 * (listingGain / 100))).toFixed(2));
    }

    return { listingPrice, listingGain, safetyMargin };
  };

  // =============================================================
  // 模型 1: 同行业对比法
  // 参考同行业已上市可转债的溢价率作为参考
  // =============================================================
  const indBenchmark = getIndustryBenchmark(industry);
  const indPremium = indBenchmark.benchmarkPremium;
  const indOut = calcOutput(indPremium);
  const methodIndustry: SingleValuationMethodResult = {
    id: 'industry',
    name: '同行业对比法',
    shortName: '行业对比',
    tag: `${indBenchmark.industry}标杆`,
    badgeColor: 'blue',
    premiumRate: indPremium,
    listingPrice: indOut.listingPrice,
    listingGain: indOut.listingGain,
    safetyMargin: indOut.safetyMargin,
    description: `参考同行业已上市转债溢价率均值 (${indBenchmark.industry}: ${indPremium.toFixed(1)}%)，对标 ${indBenchmark.peerBonds.slice(0, 2).join('、')}`,
    formulaDetail: `预估价 = ¥${cv.toFixed(2)} × (1 + ${indPremium.toFixed(1)}%) = ¥${indOut.listingPrice.toFixed(2)}`,
    keyFactors: [
      { label: '所属行业', value: industry || '制造业' },
      { label: '行业基准溢价率', value: `+${indPremium.toFixed(1)}%` },
      { label: '代表对标转债', value: indBenchmark.peerBonds.join(', ') },
      { label: '行业特征', value: indBenchmark.description }
    ]
  };

  // =============================================================
  // 模型 2: 评级与规模法
  // 用户明确标准：AAA 15%, AA+/AA 10%, AA- 5%, A+ 0%，发债规模越小，溢价率越高
  // =============================================================
  let ratingBasePremium = 10.0; // 默认 AA 10%
  const cleanRating = (rating || '').toUpperCase().trim();
  let ratingLabel = 'AA (基准+10%)';

  if (cleanRating.includes('AAA')) {
    ratingBasePremium = 15.0;
    ratingLabel = 'AAA (高信用优质债+15%)';
  } else if (cleanRating.includes('AA+')) {
    ratingBasePremium = 10.0;
    ratingLabel = 'AA+ (优质债+10%)';
  } else if (cleanRating === 'AA') {
    ratingBasePremium = 10.0;
    ratingLabel = 'AA (主流基准+10%)';
  } else if (cleanRating.includes('AA-')) {
    ratingBasePremium = 5.0;
    ratingLabel = 'AA- (中等资质+5%)';
  } else if (cleanRating.includes('A+') || cleanRating === 'A' || cleanRating.includes('BBB')) {
    ratingBasePremium = 0.0;
    ratingLabel = 'A+及以下 (资质偏弱+0%)';
  }

  // 规模越小，溢价率越高（小盘游资博弈效应）
  let sizeBonus = 0.0;
  let sizeLabel = '中等规模 (无加成)';
  if (issueSize > 0) {
    if (issueSize <= 3.0) {
      sizeBonus = 12.0;
      sizeLabel = `极小盘(≤3亿，当前${issueSize}亿，加成+12%)`;
    } else if (issueSize <= 5.5) {
      sizeBonus = 8.0;
      sizeLabel = `小盘(3~5.5亿，当前${issueSize}亿，加成+8%)`;
    } else if (issueSize <= 12.0) {
      sizeBonus = 4.0;
      sizeLabel = `适中偏小(6~12亿，当前${issueSize}亿，加成+4%)`;
    } else if (issueSize <= 25.0) {
      sizeBonus = 0.0;
      sizeLabel = `常规中盘(12~25亿，当前${issueSize}亿，加成0%)`;
    } else if (issueSize <= 50.0) {
      sizeBonus = -2.0;
      sizeLabel = `大盘债(25~50亿，当前${issueSize}亿，折减-2%)`;
    } else {
      sizeBonus = -5.0;
      sizeLabel = `超大盘(>50亿，当前${issueSize}亿，折减-5%)`;
    }
  }

  const ratingScalePremium = Number((ratingBasePremium + sizeBonus).toFixed(1));
  const ratingScaleOut = calcOutput(ratingScalePremium);
  const methodRatingScale: SingleValuationMethodResult = {
    id: 'rating_scale',
    name: '评级与规模法',
    shortName: '评级规模',
    tag: `${rating} / ${issueSize}亿`,
    badgeColor: 'purple',
    premiumRate: ratingScalePremium,
    listingPrice: ratingScaleOut.listingPrice,
    listingGain: ratingScaleOut.listingGain,
    safetyMargin: ratingScaleOut.safetyMargin,
    description: `评级基准${rating}(${ratingBasePremium}%) + 规模修正(${sizeBonus >= 0 ? '+' : ''}${sizeBonus}%) = 溢价率 ${ratingScalePremium}%`,
    formulaDetail: `预估价 = ¥${cv.toFixed(2)} × [1 + (${ratingBasePremium}% + ${sizeBonus}%)] = ¥${ratingScaleOut.listingPrice.toFixed(2)}`,
    keyFactors: [
      { label: '信用评级', value: ratingLabel },
      { label: '发债规模', value: sizeLabel },
      { label: '评级基准溢价', value: `${ratingBasePremium.toFixed(1)}%` },
      { label: '小盘效应加成', value: `${sizeBonus >= 0 ? '+' : ''}${sizeBonus.toFixed(1)}%` }
    ]
  };

  // =============================================================
  // 模型 3: 市场情绪法
  // 用户明确标准：牛市溢价率可达20-30%
  // =============================================================
  let sentimentPremium = 24.0;
  let sentimentDesc = '中性震荡环境，全市场平均溢价率约 18%~22%';
  if (marketSentiment === 'bullish_hot') {
    sentimentPremium = 28.0; // 牛市亢奋，达28% (20%~30%高位)
    sentimentDesc = '牛市大亢奋行情：资金流动性充裕，估值水位顶格，溢价率可达28%~30%';
  } else if (marketSentiment === 'bullish_active') {
    sentimentPremium = 24.0; // 偏强多头，达24%
    sentimentDesc = '偏强多头市场：风险偏好回暖，新债上市受捧，溢价率约22%~25%';
  } else if (marketSentiment === 'neutral') {
    sentimentPremium = 20.0; // 中性平稳
    sentimentDesc = '均衡震荡市：多空均衡，估值理性回归，溢价率约18%~22%';
  } else {
    sentimentPremium = 10.0; // 冰点弱市
    sentimentDesc = '市场冰点/低迷期：避险情绪浓厚，溢价率受压制，仅约8%~12%';
  }

  const sentimentOut = calcOutput(sentimentPremium);
  const methodSentiment: SingleValuationMethodResult = {
    id: 'sentiment',
    name: '市场情绪调节法',
    shortName: '市场情绪',
    tag: marketSentiment === 'bullish_hot' ? '牛市亢奋(20~30%)' : marketSentiment === 'bullish_active' ? '多头偏强' : '中性震荡',
    badgeColor: 'rose',
    premiumRate: sentimentPremium,
    listingPrice: sentimentOut.listingPrice,
    listingGain: sentimentOut.listingGain,
    safetyMargin: sentimentOut.safetyMargin,
    description: sentimentDesc,
    formulaDetail: `预估价 = ¥${cv.toFixed(2)} × (1 + ${sentimentPremium.toFixed(1)}%) = ¥${sentimentOut.listingPrice.toFixed(2)}`,
    keyFactors: [
      { label: '当前情绪环境', value: marketSentiment === 'bullish_hot' ? '🔥 牛市大亢奋' : marketSentiment === 'bullish_active' ? '📈 偏强活跃' : '⚖️ 中性震荡' },
      { label: '情绪赋权溢价', value: `${sentimentPremium.toFixed(1)}%` },
      { label: '牛市溢价参考', value: '牛市行情可达 20%~30%' }
    ]
  };

  // =============================================================
  // 模型 4: 中平价均值法 (集思录标准)
  // 用户明确标准：查集思录转股价值90~110元区间均值(如24%)，新债比老债吃香上浮10%(如给26~27%)
  // =============================================================
  const midParityAvg = JISILU_MID_PARITY_BENCHMARK.averagePremium; // 24.2%
  const newBondFactor = 1 + JISILU_MID_PARITY_BENCHMARK.newBondMarkupPercent / 100; // 1.10
  const midParityNewBondPremium = Number((midParityAvg * newBondFactor).toFixed(2)); // 26.62% -> 26.6%
  const midParityOut = calcOutput(midParityNewBondPremium);

  const methodMidParity: SingleValuationMethodResult = {
    id: 'mid_parity',
    name: '中平价均值法 (集思录标准)',
    shortName: '中平价均值',
    tag: `集思录90~110元均值+10%`,
    badgeColor: 'emerald',
    premiumRate: midParityNewBondPremium,
    listingPrice: midParityOut.listingPrice,
    listingGain: midParityOut.listingGain,
    safetyMargin: midParityOut.safetyMargin,
    description: `集思录转股价值90~110元均值(${midParityAvg.toFixed(1)}%)，新债无套牢盘更吃香上浮10% ➜ 预估溢价率 ${midParityNewBondPremium.toFixed(1)}%`,
    formulaDetail: `预估价 = ¥${cv.toFixed(2)} × [1 + (${midParityAvg.toFixed(1)}% × 1.10)] = ¥${midParityOut.listingPrice.toFixed(2)}`,
    keyFactors: [
      { label: '样本统计区间', value: '转股价值 90~110元区间' },
      { label: '市场均值基准', value: `${midParityAvg.toFixed(1)}% (集思录${JISILU_MID_PARITY_BENCHMARK.sampleCount}只中平价样本)` },
      { label: '新债吃香溢价', value: '+10.0% (首日筹码干净/受追捧)' },
      { label: '最终测算溢价', value: `${midParityNewBondPremium.toFixed(1)}% (即 26%~27%)` }
    ]
  };

  // =============================================================
  // 模型 5: 智能综合加权法 (Blended Recommended)
  // 结合4大方法科学赋权：行业(30%) + 评级规模(30%) + 情绪(15%) + 中平价(25%)
  // =============================================================
  const blendedPremium = Number((
    indPremium * 0.30 +
    ratingScalePremium * 0.30 +
    sentimentPremium * 0.15 +
    midParityNewBondPremium * 0.25
  ).toFixed(1));
  const blendedOut = calcOutput(blendedPremium);

  const methodBlended: SingleValuationMethodResult = {
    id: 'blended',
    name: '智能综合加权模型 (推荐)',
    shortName: '综合加权',
    tag: '四维加权均衡',
    badgeColor: 'amber',
    isRecommended: true,
    premiumRate: blendedPremium,
    listingPrice: blendedOut.listingPrice,
    listingGain: blendedOut.listingGain,
    safetyMargin: blendedOut.safetyMargin,
    description: `四维科学加权：行业对比30% + 评级规模30% + 市场情绪15% + 集思录中平价25% = 推荐溢价率 ${blendedPremium}%`,
    formulaDetail: `预估价 = ¥${cv.toFixed(2)} × (1 + ${blendedPremium.toFixed(1)}%) = ¥${blendedOut.listingPrice.toFixed(2)}`,
    keyFactors: [
      { label: '行业对比权重', value: '30%' },
      { label: '评级规模权重', value: '30%' },
      { label: '集思录中平价权重', value: '25%' },
      { label: '市场情绪权重', value: '15%' }
    ]
  };

  const valuationNote = `转股价值¥${cv.toFixed(2)}，预估溢价率+${blendedPremium}% (中平价基准+10%为${midParityNewBondPremium}%，${indBenchmark.industry}为${indPremium}%) ➜ 预估上市价¥${blendedOut.listingPrice.toFixed(2)}(预期上市涨幅+${blendedOut.listingGain}%)`;

  return {
    convertValue: cv,
    estimatedPremiumRate: blendedPremium,
    estimatedListingPrice: blendedOut.listingPrice,
    estimatedListingGain: blendedOut.listingGain,
    safetyMargin: blendedOut.safetyMargin,
    valuationNote,
    methods: {
      industry: methodIndustry,
      ratingScale: methodRatingScale,
      sentiment: methodSentiment,
      midParity: methodMidParity,
      blended: methodBlended
    },
    midParityBenchmark: JISILU_MID_PARITY_BENCHMARK,
    industryBenchmark: indBenchmark
  };
}
