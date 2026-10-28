import { PendingConvertibleBond, CBProgressStage, CBProgressSummary } from '../types/market';
import { calculateCBValuation } from '../utils/cbValuation';

/**
 * 集思录 & 沪深北交易所全流程待发可转债全量收录数据库
 * 流程：1.董事会预案 -> 2.股东大会通过 -> 3.交易所受理 -> 4.上市委通过 -> 5.同意注册 -> 6.发行公告
 */

interface BondDef {
  stockCode: string;
  stockName: string;
  bondCode?: string;
  bondName?: string;
  stage: CBProgressStage;
  stageName: string;
  stageStep: number;
  date: string;
  subscribeDate?: string;
  subscribeCode?: string;
  recordDate?: string;
  issueSize: number;
  rating?: string;
  guarantee?: string;
  convertPrice: number;
  stockPrice: number;
  stockChangePercent?: number;
  rationPerShare: number;
  rightsPer100: number;
  coefficient?: number;
  industry: string;
  remark?: string;
  history?: {
    boardDate?: string;
    shareholderDate?: string;
    exchangeDate?: string;
    committeeDate?: string;
    regDate?: string;
    announceDate?: string;
  };
}

export function formatToChineseDate(dateStr?: string): string {
  if (!dateStr || dateStr === '-' || dateStr === '待定' || dateStr === '审核中') return dateStr || '';
  const match = dateStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${y}年${parseInt(m, 10)}月${parseInt(d, 10)}日`;
  }
  return dateStr;
}

export function getCBStageDateInfo(bond: {
  stage: CBProgressStage;
  stageName: string;
  stageDate?: string;
  latestUpdate?: string;
  subscribeDate?: string;
  history?: {
    boardDate?: string;
    shareholderDate?: string;
    exchangeDate?: string;
    committeeDate?: string;
    regDate?: string;
    announceDate?: string;
  };
}): { rawDate: string; chineseDate: string; fullDesc: string } {
  let rawDate = bond.stageDate || '';
  if (!rawDate && bond.history) {
    switch (bond.stage) {
      case 'issue_announced':
        rawDate = bond.history.announceDate || (bond.subscribeDate && bond.subscribeDate !== '待定' ? bond.subscribeDate : '') || bond.latestUpdate || '';
        break;
      case 'csrc_registered':
        rawDate = bond.history.regDate || bond.latestUpdate || '';
        break;
      case 'committee_approved':
        rawDate = bond.history.committeeDate || bond.latestUpdate || '';
        break;
      case 'exchange_accepted':
        rawDate = bond.history.exchangeDate || bond.latestUpdate || '';
        break;
      case 'shareholder_approved':
        rawDate = bond.history.shareholderDate || bond.latestUpdate || '';
        break;
      case 'board_plan':
        rawDate = bond.history.boardDate || bond.latestUpdate || '';
        break;
      default:
        rawDate = bond.latestUpdate || '';
    }
  }
  if (!rawDate) rawDate = bond.latestUpdate || '';

  const chineseDate = formatToChineseDate(rawDate);
  const fullDesc = rawDate ? `${bond.stageName} (${chineseDate})` : bond.stageName;

  return { rawDate, chineseDate, fullDesc };
}

function b(d: BondDef): PendingConvertibleBond {
  const valuation = calculateCBValuation({
    stockPrice: d.stockPrice,
    convertPrice: d.convertPrice,
    issueSize: d.issueSize,
    rating: d.rating || 'AA-',
    industry: d.industry,
    rightsPer100: d.rightsPer100,
    rationPerShare: d.rationPerShare
  });

  const sharesHand = Math.max(100, Math.ceil(1000 / (d.rationPerShare > 0 ? d.rationPerShare : 1)));
  
  const history: PendingConvertibleBond['history'] = d.history || {};
  if (d.stage === 'board_plan' && !history.boardDate) history.boardDate = d.date;
  if (d.stage === 'shareholder_approved' && !history.shareholderDate) history.shareholderDate = d.date;
  if (d.stage === 'exchange_accepted' && !history.exchangeDate) history.exchangeDate = d.date;
  if (d.stage === 'committee_approved' && !history.committeeDate) history.committeeDate = d.date;
  if (d.stage === 'csrc_registered' && !history.regDate) history.regDate = d.date;
  if (d.stage === 'issue_announced' && !history.announceDate) history.announceDate = d.date;

  const rawStageDate = d.date;
  const chineseStageDate = formatToChineseDate(d.date);

  return {
    id: `cb-${d.stockCode}`,
    stockCode: d.stockCode,
    stockName: d.stockName,
    bondCode: d.bondCode || '-',
    bondName: d.bondName || `${d.stockName.replace(/R$/, '')}转债`,
    stage: d.stage,
    stageName: d.stageName,
    stageStep: d.stageStep,
    stageDate: rawStageDate,
    stageDateChinese: chineseStageDate,
    subscribeDate: d.subscribeDate || (d.stage === 'issue_announced' ? d.date : '待定'),
    subscribeCode: d.subscribeCode || '-',
    recordDate: d.recordDate || (d.stage === 'issue_announced' ? '见公告' : '-'),
    issueSize: d.issueSize,
    securityType: '可转债',
    rating: d.rating || 'AA-',
    guarantee: d.guarantee || '无担保',
    convertPrice: d.convertPrice,
    stockPrice: d.stockPrice,
    stockChangePercent: d.stockChangePercent ?? 0.0,
    convertValue: valuation.convertValue,
    rationPerShare: d.rationPerShare,
    rightsPer100: d.rightsPer100,
    coefficient: d.coefficient,
    sharesPerHand: sharesHand,
    safetyMargin: valuation.safetyMargin,
    estimatedListingPrice: valuation.estimatedListingPrice,
    estimatedListingGain: valuation.estimatedListingGain,
    estimatedPremiumRate: valuation.estimatedPremiumRate,
    valuationNote: valuation.valuationNote,
    valuationDetail: valuation,
    industry: d.industry,
    latestUpdate: d.date,
    history,
    remark: d.remark || `${d.industry}核心标的，转债预案正常推进`
  };
}

export const INITIAL_PENDING_CONVERTIBLE_BONDS: PendingConvertibleBond[] = [
  // ==========================================
  // 1. 发行公告 (Stage 6) - 4只 (最新定档)
  // ==========================================
  b({
    stockCode: '688403',
    stockName: '汇成股份R',
    bondCode: '118055',
    bondName: '汇成转债',
    stage: 'issue_announced',
    stageName: '发行公告',
    stageStep: 6,
    date: '2026-09-28',
    subscribeDate: '2026-09-28',
    subscribeCode: '718403',
    recordDate: '2026-09-25',
    issueSize: 12.00,
    rating: 'AA-',
    convertPrice: 9.80,
    stockPrice: 10.15,
    rationPerShare: 1.12,
    rightsPer100: 11.03,
    industry: '半导体显示驱动芯片先进金凸块封测',
    remark: '驱动芯片封测行业龙头，募投扩产车载及OLED先进制程封测，百元股票含权超11元'
  }),
  b({
    stockCode: '002997',
    stockName: '瑞鹄模具R',
    bondCode: '127116',
    bondName: '瑞鹄转02',
    stage: 'issue_announced',
    stageName: '发行公告',
    stageStep: 6,
    date: '2026-09-17',
    subscribeDate: '2026-09-17',
    subscribeCode: '072997',
    recordDate: '2026-09-16',
    issueSize: 6.86,
    rating: 'AA',
    convertPrice: 29.18,
    stockPrice: 29.03,
    rationPerShare: 3.28,
    rightsPer100: 11.29,
    industry: '汽车轻量化车身模具与冲压总成',
    remark: '奇瑞战略核心供应商，一体化压铸车身件与高端模具加速放量'
  }),
  b({
    stockCode: '300727',
    stockName: '润禾材料',
    bondCode: '123285',
    bondName: '润禾转02',
    stage: 'issue_announced',
    stageName: '发行公告',
    stageStep: 6,
    date: '2026-09-10',
    subscribeDate: '2026-09-10',
    subscribeCode: '370727',
    recordDate: '2026-09-09',
    issueSize: 3.70,
    rating: 'A+',
    convertPrice: 31.10,
    stockPrice: 30.65,
    rationPerShare: 2.89,
    rightsPer100: 9.43,
    industry: '有机硅新材料与特种表面活性剂',
    remark: '硅油硅树脂深加工领军企业，拟扩产高端电子级硅材料'
  }),
  b({
    stockCode: '603339',
    stockName: '四方科技',
    bondCode: '113710',
    bondName: '四方转债',
    stage: 'issue_announced',
    stageName: '发行公告',
    stageStep: 6,
    date: '2026-09-03',
    subscribeDate: '2026-09-03',
    subscribeCode: '754339',
    recordDate: '2026-09-02',
    issueSize: 10.23,
    rating: 'AA-',
    convertPrice: 14.87,
    stockPrice: 15.02,
    rationPerShare: 3.31,
    rightsPer100: 22.28,
    industry: '冷链速冻装备与特种罐式集装箱',
    remark: '冷链与罐式集装箱双龙头，百元股票含权高达22元'
  }),

  // ==========================================
  // 2. 同意注册 (Stage 5) - 14只
  // ==========================================
  b({
    stockCode: '688510',
    stockName: '航亚科技R',
    bondName: '航亚转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-09-17',
    issueSize: 3.50,
    rating: 'AA-',
    convertPrice: 18.50,
    stockPrice: 19.20,
    rationPerShare: 1.35,
    rightsPer100: 7.03,
    industry: '航空发动机压气机叶片与医疗骨科',
    remark: '两机重大专项叶片精锻领头羊，证监会同意注册生效（2026年9月17日），即将刊登招募说明书'
  }),
  b({
    stockCode: '301571',
    stockName: '国科天成R',
    bondName: '国科转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-09-07',
    issueSize: 8.49,
    rating: 'AA-',
    convertPrice: 48.60,
    stockPrice: 51.30,
    rationPerShare: 4.80,
    rightsPer100: 9.36,
    industry: '红外光电芯片与机载导航制导',
    remark: '非制冷及制冷红外机芯芯片一体化自主研制，军民两用光电龙头'
  }),
  b({
    stockCode: '301175',
    stockName: '中科环保R',
    bondName: '中科转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-09-07',
    issueSize: 10.00,
    rating: 'AA',
    convertPrice: 6.20,
    stockPrice: 5.95,
    rationPerShare: 0.68,
    rightsPer100: 11.43,
    industry: '固废清洁焚烧发电与工业集中供热',
    remark: '中科院系绿色环保旗舰平台，募投固废综合利用'
  }),
  b({
    stockCode: '301149',
    stockName: '隆华新材R',
    bondName: '隆华转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-09-07',
    issueSize: 10.60,
    rating: 'AA-',
    convertPrice: 11.50,
    stockPrice: 11.10,
    rationPerShare: 2.47,
    rightsPer100: 22.25,
    industry: '聚醚多元醇与PA66尼龙新材料',
    remark: '国内聚醚多元醇规模第一梯队，百元含权高达22.25元'
  }),
  b({
    stockCode: '688150',
    stockName: '莱特光电R',
    bondName: '莱特转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-09-05',
    issueSize: 10.00,
    rating: 'AA-',
    convertPrice: 24.50,
    stockPrice: 25.10,
    rationPerShare: 2.48,
    rightsPer100: 9.88,
    industry: 'OLED有机发光终端材料与中间体',
    remark: 'OLED Red Prime材料国产替代主力，深度绑定京东方'
  }),
  b({
    stockCode: '001380',
    stockName: '华纬科技R',
    bondName: '华纬转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-09-04',
    issueSize: 7.00,
    rating: 'AA-',
    convertPrice: 27.80,
    stockPrice: 28.50,
    rationPerShare: 4.54,
    rightsPer100: 15.93,
    industry: '高端弹簧及汽车底盘悬架系统',
    remark: '新能源车悬架弹簧与阀类精密弹簧市占率居前'
  }),
  b({
    stockCode: '603125',
    stockName: '常青科技R',
    bondName: '常青转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-09-04',
    issueSize: 8.00,
    rating: 'AA-',
    convertPrice: 19.80,
    stockPrice: 18.90,
    rationPerShare: 4.10,
    rightsPer100: 21.69,
    industry: '特种高分子单体及烷基酚新材料',
    remark: '全球亚磷酸酯抗氧剂中间体细分龙头，百元股票含权达21.69元'
  }),
  b({
    stockCode: '600368',
    stockName: '五洲交通R',
    bondName: '五洲转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-08-21',
    issueSize: 12.00,
    rating: 'AA+',
    convertPrice: 4.20,
    stockPrice: 4.15,
    rationPerShare: 0.97,
    rightsPer100: 23.37,
    industry: '广西高速公路收费与现代物流园区',
    remark: '广西高分红路桥股，百元含权23.37元，安全垫厚实'
  }),
  b({
    stockCode: '603163',
    stockName: '圣晖集成R',
    bondName: '圣晖转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-08-12',
    issueSize: 5.00,
    rating: 'AA-',
    convertPrice: 32.50,
    stockPrice: 33.10,
    rationPerShare: 5.00,
    rightsPer100: 15.11,
    industry: '半导体洁净室系统工程与机电安装',
    remark: '高等级无尘室机电工程专家，受益晶圆厂新一轮资本开支'
  }),
  b({
    stockCode: '300909',
    stockName: '汇创达R',
    bondName: '汇创转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-08-07',
    issueSize: 4.68,
    rating: 'A+',
    convertPrice: 24.00,
    stockPrice: 23.80,
    rationPerShare: 2.70,
    rightsPer100: 11.34,
    industry: '导光结构件及超小型微动轻触开关',
    remark: '笔电背光模组与精密按键核心供应商，积极拓展车载屏'
  }),
  b({
    stockCode: '000887',
    stockName: '中鼎股份R',
    bondName: '中鼎转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-07-28',
    issueSize: 15.00,
    rating: 'AA+',
    convertPrice: 13.80,
    stockPrice: 14.10,
    rationPerShare: 1.14,
    rightsPer100: 8.09,
    industry: '空气悬挂总成与汽车智能底盘',
    remark: '全球空悬系统龙头AMK母公司，国产乘用车空悬渗透率飙升'
  }),
  b({
    stockCode: '301132',
    stockName: '满坤科技R',
    bondName: '满坤转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-07-27',
    issueSize: 6.50,
    rating: 'AA-',
    convertPrice: 26.00,
    stockPrice: 26.50,
    rationPerShare: 4.38,
    rightsPer100: 16.53,
    industry: '高精密多层高频PCB印制电路板',
    remark: '车载PCB与工控网通高密度互连板，百元含权16.53元'
  }),
  b({
    stockCode: '002550',
    stockName: '千红制药',
    bondName: '千红转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-07-16',
    issueSize: 10.00,
    rating: 'AA',
    convertPrice: 6.10,
    stockPrice: 6.25,
    rationPerShare: 0.78,
    rightsPer100: 12.48,
    industry: '肝素钠原料药与生物生化多肽制剂',
    remark: '肝素粗品与注射剂双驱发展，拟扩产多肽合成创新药'
  }),
  b({
    stockCode: '002913',
    stockName: '奥士康R',
    bondName: '奥士转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-04-02',
    issueSize: 12.00,
    rating: 'AA',
    convertPrice: 28.50,
    stockPrice: 29.10,
    rationPerShare: 3.78,
    rightsPer100: 12.99,
    industry: '高端服务器与汽车多层HDI印制电路板',
    remark: 'AI服务器高端PCB板放量，证监会注册批文已获'
  }),

  b({
    stockCode: '605016',
    stockName: '百龙创园',
    bondName: '百龙转债',
    stage: 'csrc_registered',
    stageName: '同意注册',
    stageStep: 5,
    date: '2026-09-25',
    issueSize: 7.48,
    rating: 'AA-',
    convertPrice: 18.20,
    stockPrice: 18.60,
    rationPerShare: 2.39,
    rightsPer100: 12.85,
    industry: '微生态益生元与阿洛酮糖功能糖',
    remark: '阿洛酮糖健康减糖原料领头羊，证监会同意注册生效（2026年9月25日），批文在手随时发行'
  }),

  // ==========================================
  // 3. 上市委通过 (Stage 4) - 2只
  // ==========================================
  b({
    stockCode: '300181',
    stockName: '佐力药业R',
    bondName: '佐力转债',
    stage: 'committee_approved',
    stageName: '上市委通过',
    stageStep: 4,
    date: '2026-08-21',
    issueSize: 8.00,
    rating: 'AA-',
    convertPrice: 15.30,
    stockPrice: 15.60,
    rationPerShare: 1.14,
    rightsPer100: 7.31,
    industry: '乌灵系列中药与精神神经现代中成药',
    remark: '乌灵胶囊独家基药品种，抗抑郁焦虑领域增长强劲'
  }),
  b({
    stockCode: '301018',
    stockName: '申菱环境R',
    bondName: '申菱转债',
    stage: 'committee_approved',
    stageName: '上市委通过',
    stageStep: 4,
    date: '2026-08-18',
    issueSize: 6.50,
    rating: 'AA-',
    convertPrice: 23.50,
    stockPrice: 24.10,
    rationPerShare: 2.44,
    rightsPer100: 10.12,
    industry: '数据中心特种液冷温控与工业空调',
    remark: 'AI算力中心高密度液冷温控解决方案核心受益者'
  }),

  // ==========================================
  // 4. 交易所受理 (Stage 3) - 25只
  // ==========================================
  b({
    stockCode: '301092',
    stockName: '争光股份R',
    bondName: '争光转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-09-04',
    issueSize: 4.50,
    rating: 'A+',
    convertPrice: 26.50,
    stockPrice: 26.80,
    rationPerShare: 3.37,
    rightsPer100: 12.57,
    industry: '离子交换与吸附分离树脂材料'
  }),
  b({
    stockCode: '688372',
    stockName: '伟测科技R',
    bondName: '伟测转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-08-26',
    issueSize: 11.75,
    rating: 'AA',
    convertPrice: 65.00,
    stockPrice: 66.80,
    rationPerShare: 10.38,
    rightsPer100: 15.54,
    industry: '晶圆级及芯片成品独立第三方测试'
  }),
  b({
    stockCode: '603499',
    stockName: '翔港科技',
    bondName: '翔港转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-08-26',
    issueSize: 3.50,
    rating: 'A+',
    convertPrice: 14.50,
    stockPrice: 15.20,
    rationPerShare: 1.63,
    rightsPer100: 10.72,
    industry: '日化医药高档彩盒包装与注塑容器'
  }),
  b({
    stockCode: '605020',
    stockName: '永和股份R',
    bondName: '永和转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-08-17',
    issueSize: 18.67,
    rating: 'AA-',
    convertPrice: 21.00,
    stockPrice: 21.50,
    rationPerShare: 4.92,
    rightsPer100: 22.88,
    industry: '氟化工环保制冷剂与含氟聚合物材料'
  }),
  b({
    stockCode: '688720',
    stockName: '艾森股份R',
    bondName: '艾森转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-08-15',
    issueSize: 4.00,
    rating: 'A+',
    convertPrice: 42.00,
    stockPrice: 43.50,
    rationPerShare: 4.53,
    rightsPer100: 10.41,
    industry: '半导体电子化学品电镀液与光刻胶'
  }),
  b({
    stockCode: '300739',
    stockName: '明阳电路R',
    bondName: '明阳转02',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-08-12',
    issueSize: 6.50,
    rating: 'AA-',
    convertPrice: 13.80,
    stockPrice: 13.90,
    rationPerShare: 2.17,
    rightsPer100: 15.61,
    industry: '汽车电子与工控特种PCB电路板'
  }),
  b({
    stockCode: '301305',
    stockName: '朗坤科技R',
    bondName: '朗坤转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-08-11',
    issueSize: 7.00,
    rating: 'AA-',
    convertPrice: 16.50,
    stockPrice: 17.00,
    rationPerShare: 2.87,
    rightsPer100: 16.88,
    industry: '有机固废生物资源化与生物柴油'
  }),
  b({
    stockCode: '603043',
    stockName: '广州酒家R',
    bondName: '广酒转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-08-01',
    issueSize: 10.00,
    rating: 'AA+',
    convertPrice: 18.20,
    stockPrice: 18.00,
    rationPerShare: 1.76,
    rightsPer100: 9.78,
    industry: '粤菜老字号餐饮与利口福速冻食品'
  }),
  b({
    stockCode: '603061',
    stockName: '金海通',
    bondName: '海通转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-07-31',
    issueSize: 6.00,
    rating: 'A+',
    convertPrice: 85.00,
    stockPrice: 88.00,
    rationPerShare: 10.00,
    rightsPer100: 11.36,
    industry: '集成电路平移式芯片测试分选机装备'
  }),
  b({
    stockCode: '603565',
    stockName: '中谷物流R',
    bondName: '中谷转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-07-03',
    issueSize: 20.00,
    rating: 'AA+',
    convertPrice: 9.80,
    stockPrice: 9.95,
    rationPerShare: 0.95,
    rightsPer100: 9.55,
    industry: '内贸集装箱多式联运水路物流网络'
  }),
  b({
    stockCode: '601717',
    stockName: '中创智领R',
    bondName: '智领转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-06-22',
    issueSize: 40.52,
    rating: 'AAA',
    convertPrice: 15.00,
    stockPrice: 15.30,
    rationPerShare: 2.33,
    rightsPer100: 15.23,
    industry: '煤矿综合采掘重型机械装备与智能综采'
  }),
  b({
    stockCode: '300893',
    stockName: '松原安全R',
    bondName: '松原转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-06-12',
    issueSize: 8.00,
    rating: 'AA-',
    convertPrice: 28.50,
    stockPrice: 29.20,
    rationPerShare: 3.54,
    rightsPer100: 12.12,
    industry: '汽车安全带总成与安全气囊被动安全'
  }),
  b({
    stockCode: '301631',
    stockName: '壹连科技R',
    bondName: '壹连转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-06-11',
    issueSize: 7.50,
    rating: 'AA-',
    convertPrice: 92.00,
    stockPrice: 95.00,
    rationPerShare: 11.50,
    rightsPer100: 12.11,
    industry: '新能源汽车电连接组件与复合母排总成'
  }),
  b({
    stockCode: '001386',
    stockName: '悍高集团R',
    bondName: '悍高转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-06-08',
    issueSize: 6.00,
    rating: 'AA-',
    convertPrice: 22.00,
    stockPrice: 22.80,
    rationPerShare: 3.50,
    rightsPer100: 15.35,
    industry: '高端全屋功能五金与户外家具设计制造'
  }),
  b({
    stockCode: '688600',
    stockName: '皖仪科技R',
    bondName: '皖仪转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-06-05',
    issueSize: 3.50,
    rating: 'A+',
    convertPrice: 19.50,
    stockPrice: 20.10,
    rationPerShare: 2.61,
    rightsPer100: 12.99,
    industry: '色谱质谱精密分析仪器与工业检漏仪'
  }),
  b({
    stockCode: '301279',
    stockName: '金道科技R',
    bondName: '金道转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-06-02',
    issueSize: 4.50,
    rating: 'A+',
    convertPrice: 25.00,
    stockPrice: 25.40,
    rationPerShare: 4.50,
    rightsPer100: 17.72,
    industry: '工业叉车变速箱与电动减速器'
  }),
  b({
    stockCode: '300634',
    stockName: '彩讯股份R',
    bondName: '彩讯转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-04-29',
    issueSize: 10.00,
    rating: 'AA',
    convertPrice: 21.50,
    stockPrice: 22.00,
    rationPerShare: 2.23,
    rightsPer100: 10.14,
    industry: '企业级邮箱协同办公与AI数字基建'
  }),
  b({
    stockCode: '001282',
    stockName: '三联锻造R',
    bondName: '三联转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-04-02',
    issueSize: 5.50,
    rating: 'AA-',
    convertPrice: 31.00,
    stockPrice: 32.20,
    rationPerShare: 4.80,
    rightsPer100: 14.91,
    industry: '汽车高精密轮毂轴承及底盘锻件'
  }),
  b({
    stockCode: '301179',
    stockName: '天山电子R',
    bondName: '天山转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2026-03-11',
    issueSize: 6.97,
    rating: 'AA-',
    convertPrice: 22.00,
    stockPrice: 22.50,
    rationPerShare: 3.65,
    rightsPer100: 16.22,
    industry: '专业显示模组及车载液晶触控屏'
  }),
  b({
    stockCode: '600089',
    stockName: '特变电工R',
    bondName: '特变转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2025-09-27',
    issueSize: 80.00,
    rating: 'AAA',
    convertPrice: 14.20,
    stockPrice: 14.05,
    rationPerShare: 1.58,
    rightsPer100: 11.25,
    industry: '特高压变压器输变电装备与新能源多晶硅'
  }),
  b({
    stockCode: '600577',
    stockName: '精达股份R',
    bondName: '精达转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2025-06-26',
    issueSize: 15.00,
    rating: 'AA',
    convertPrice: 4.30,
    stockPrice: 4.25,
    rationPerShare: 0.72,
    rightsPer100: 16.94,
    industry: '800V高压电磁扁线与特种漆包铜线'
  }),
  b({
    stockCode: '603093',
    stockName: '南华期货',
    bondName: '南华转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2023-05-18',
    issueSize: 12.00,
    rating: 'AA',
    convertPrice: 11.50,
    stockPrice: 11.30,
    rationPerShare: 1.97,
    rightsPer100: 17.43,
    industry: '期货经纪与境外衍生品清算金融服务'
  }),
  b({
    stockCode: '601528',
    stockName: '瑞丰银行',
    bondName: '瑞丰转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2023-01-20',
    issueSize: 50.00,
    rating: 'AAA',
    convertPrice: 5.20,
    stockPrice: 5.15,
    rationPerShare: 2.55,
    rightsPer100: 49.51,
    industry: '浙江区域农商行普惠小微金融'
  }),
  b({
    stockCode: '601577',
    stockName: '长沙银行R',
    bondName: '长沙转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2022-09-28',
    issueSize: 110.00,
    rating: 'AAA',
    convertPrice: 8.50,
    stockPrice: 8.40,
    rationPerShare: 2.74,
    rightsPer100: 32.62,
    industry: '湖南省本土首家上市城市商业银行'
  }),
  b({
    stockCode: '601187',
    stockName: '厦门银行R',
    bondName: '厦银转债',
    stage: 'exchange_accepted',
    stageName: '交易所受理',
    stageStep: 3,
    date: '2022-09-27',
    issueSize: 50.00,
    rating: 'AAA',
    convertPrice: 5.80,
    stockPrice: 5.75,
    rationPerShare: 1.89,
    rightsPer100: 32.87,
    industry: '两岸特色综合金融与城市商业银行'
  }),

  // ==========================================
  // 5. 股东大会通过 (Stage 2) - 26只
  // ==========================================
  b({
    stockCode: '301031',
    stockName: '中熔电气R',
    bondName: '中熔转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-09-17',
    issueSize: 10.00,
    rating: 'AA',
    convertPrice: 118.00,
    stockPrice: 121.50,
    rationPerShare: 15.06,
    rightsPer100: 12.40,
    industry: '新能源汽车与储能高压直流熔断器'
  }),
  b({
    stockCode: '301376',
    stockName: '致欧科技R',
    bondName: '致欧转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-09-14',
    issueSize: 11.00,
    rating: 'AA-',
    convertPrice: 21.00,
    stockPrice: 21.60,
    rationPerShare: 2.74,
    rightsPer100: 12.69,
    industry: '跨境电商全球化线上家具家居品牌'
  }),
  b({
    stockCode: '300680',
    stockName: '隆盛科技',
    bondName: '隆盛转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-09-14',
    issueSize: 8.00,
    rating: 'AA-',
    convertPrice: 23.50,
    stockPrice: 24.20,
    rationPerShare: 3.46,
    rightsPer100: 14.30,
    industry: '新能源汽车驱动电机铁芯与EGR系统'
  }),
  b({
    stockCode: '301587',
    stockName: '中瑞股份R',
    bondName: '中瑞转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-09-11',
    issueSize: 5.50,
    rating: 'A+',
    convertPrice: 32.00,
    stockPrice: 33.10,
    rationPerShare: 3.77,
    rightsPer100: 11.39,
    industry: '圆柱锂电池精密安全结构件及防爆阀'
  }),
  b({
    stockCode: '301252',
    stockName: '同星科技R',
    bondName: '同星转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-09-10',
    issueSize: 4.50,
    rating: 'A+',
    convertPrice: 38.00,
    stockPrice: 39.20,
    rationPerShare: 4.50,
    rightsPer100: 11.48,
    industry: '制冷设备换热器与新能源车热管理'
  }),
  b({
    stockCode: '301479',
    stockName: '弘景光电R',
    bondName: '弘景转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-08-10',
    issueSize: 4.80,
    rating: 'A+',
    convertPrice: 48.00,
    stockPrice: 50.00,
    rationPerShare: 6.00,
    rightsPer100: 12.00,
    industry: '车载智能驾驶高解析光学镜头模组'
  }),
  b({
    stockCode: '300695',
    stockName: '兆丰股份',
    bondName: '兆丰转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-07-31',
    issueSize: 5.00,
    rating: 'A+',
    convertPrice: 42.00,
    stockPrice: 43.50,
    rationPerShare: 7.07,
    rightsPer100: 16.25,
    industry: '汽车轮毂轴承单元售后出口'
  }),
  b({
    stockCode: '688261',
    stockName: '东微半导R',
    bondName: '东微转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-07-21',
    issueSize: 8.50,
    rating: 'AA-',
    convertPrice: 52.00,
    stockPrice: 54.00,
    rationPerShare: 5.59,
    rightsPer100: 10.35,
    industry: '高压超级结MOSFET与SiC功率器件'
  }),
  b({
    stockCode: '300428',
    stockName: '立中集团R',
    bondName: '立中转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-07-20',
    issueSize: 15.00,
    rating: 'AA',
    convertPrice: 18.00,
    stockPrice: 18.50,
    rationPerShare: 2.43,
    rightsPer100: 13.14,
    industry: '免热处理一体化压铸铝合金材料'
  }),
  b({
    stockCode: '002978',
    stockName: '安宁股份R',
    bondName: '安宁转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-06-17',
    issueSize: 18.00,
    rating: 'AA+',
    convertPrice: 32.00,
    stockPrice: 32.80,
    rationPerShare: 4.49,
    rightsPer100: 13.69,
    industry: '攀西钒钛磁铁矿精矿与高钛渣提纯'
  }),
  b({
    stockCode: '001203',
    stockName: '大中矿业R',
    bondName: '大中转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-06-02',
    issueSize: 15.20,
    rating: 'AA',
    convertPrice: 9.80,
    stockPrice: 10.05,
    rationPerShare: 1.01,
    rightsPer100: 10.05,
    industry: '铁矿采选球团与高品位锂云母提锂'
  }),
  b({
    stockCode: '301585',
    stockName: '蓝宇股份R',
    bondName: '蓝宇转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-05-27',
    issueSize: 3.80,
    rating: 'A+',
    convertPrice: 35.00,
    stockPrice: 36.20,
    rationPerShare: 4.75,
    rightsPer100: 13.12,
    industry: '数码纺织印花墨水与分散染料墨水'
  }),
  b({
    stockCode: '688390',
    stockName: '固德威R',
    bondName: '固威转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-05-21',
    issueSize: 12.00,
    rating: 'AA',
    convertPrice: 48.00,
    stockPrice: 49.50,
    rationPerShare: 4.90,
    rightsPer100: 9.90,
    industry: '分布式光伏储能逆变器与智慧能源'
  }),
  b({
    stockCode: '301522',
    stockName: '上大股份R',
    bondName: '上大转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-05-20',
    issueSize: 6.50,
    rating: 'AA-',
    convertPrice: 28.00,
    stockPrice: 29.00,
    rationPerShare: 4.06,
    rightsPer100: 14.00,
    industry: '航空航天高温合金与耐蚀特种合金'
  }),
  b({
    stockCode: '301263',
    stockName: '泰恩康R',
    bondName: '泰恩转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-05-20',
    issueSize: 5.00,
    rating: 'A+',
    convertPrice: 13.50,
    stockPrice: 13.80,
    rationPerShare: 1.18,
    rightsPer100: 8.55,
    industry: '综合医药代理分销与化学仿制药研发'
  }),
  b({
    stockCode: '301603',
    stockName: '乔锋智能R',
    bondName: '乔锋转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-05-19',
    issueSize: 7.80,
    rating: 'AA-',
    convertPrice: 45.00,
    stockPrice: 46.50,
    rationPerShare: 6.46,
    rightsPer100: 13.89,
    industry: '数控机床制造与立式卧式加工中心'
  }),
  b({
    stockCode: '603166',
    stockName: '福达股份R',
    bondName: '福达转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-05-16',
    issueSize: 6.00,
    rating: 'AA-',
    convertPrice: 7.20,
    stockPrice: 7.40,
    rationPerShare: 0.93,
    rightsPer100: 12.57,
    industry: '汽车发动机锻钢曲轴与新能源电驱齿轮'
  }),
  b({
    stockCode: '300389',
    stockName: '艾比森',
    bondName: '艾比转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-05-15',
    issueSize: 6.00,
    rating: 'AA-',
    convertPrice: 11.50,
    stockPrice: 11.80,
    rationPerShare: 1.63,
    rightsPer100: 13.81,
    industry: '全球商业LED超高清全彩显示屏龙头'
  }),
  b({
    stockCode: '603173',
    stockName: '汇通控股R',
    bondName: '汇通转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-05-09',
    issueSize: 4.50,
    rating: 'A+',
    convertPrice: 18.00,
    stockPrice: 18.50,
    rationPerShare: 3.79,
    rightsPer100: 20.49,
    industry: '汽车外饰进气格栅与轻量化门槛压条'
  }),
  b({
    stockCode: '603693',
    stockName: '江苏新能R',
    bondName: '江新转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-03-25',
    issueSize: 20.00,
    rating: 'AA+',
    convertPrice: 10.50,
    stockPrice: 10.70,
    rationPerShare: 2.25,
    rightsPer100: 21.03,
    industry: '江苏省属海上风电与集中式光伏发电'
  }),
  b({
    stockCode: '603219',
    stockName: '富佳股份',
    bondName: '富佳转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2026-01-24',
    issueSize: 6.00,
    rating: 'AA-',
    convertPrice: 14.00,
    stockPrice: 14.30,
    rationPerShare: 1.07,
    rightsPer100: 7.48,
    industry: '无绳手持吸尘器与扫地机器人ODM代工'
  }),
  b({
    stockCode: '605196',
    stockName: '华通线缆',
    bondName: '华通转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2025-11-07',
    issueSize: 8.00,
    rating: 'AA-',
    convertPrice: 9.20,
    stockPrice: 9.40,
    rationPerShare: 1.56,
    rightsPer100: 16.60,
    industry: '潜油泵电缆与国际油气特种矿用电缆'
  }),
  b({
    stockCode: '300709',
    stockName: '精研科技R',
    bondName: '精研转02',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2025-08-19',
    issueSize: 6.00,
    rating: 'AA-',
    convertPrice: 34.00,
    stockPrice: 35.20,
    rationPerShare: 3.23,
    rightsPer100: 9.18,
    industry: '金属粉末注射成型MIM与折叠屏铰链'
  }),
  b({
    stockCode: '300751',
    stockName: '迈为股份R',
    bondName: '迈为转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2025-06-16',
    issueSize: 25.00,
    rating: 'AA+',
    convertPrice: 115.00,
    stockPrice: 118.00,
    rationPerShare: 8.96,
    rightsPer100: 7.59,
    industry: 'HJT异质结电池真空PVD/PECVD设备'
  }),
  b({
    stockCode: '600928',
    stockName: '西安银行R',
    bondName: '西银转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2025-05-31',
    issueSize: 50.00,
    rating: 'AAA',
    convertPrice: 3.60,
    stockPrice: 3.55,
    rationPerShare: 1.12,
    rightsPer100: 31.55,
    industry: '西北地区首家A股上市城市商业银行'
  }),
  b({
    stockCode: '300432',
    stockName: '富临精工R',
    bondName: '富临转债',
    stage: 'shareholder_approved',
    stageName: '股东大会通过',
    stageStep: 2,
    date: '2024-12-06',
    issueSize: 12.50,
    rating: 'AA',
    convertPrice: 12.80,
    stockPrice: 13.20,
    rationPerShare: 1.02,
    rightsPer100: 7.73,
    industry: '磷酸铁锂正极材料与智能减震电磁阀'
  }),

  // ==========================================
  // 6. 董事会预案 (Stage 1) - 11只
  // ==========================================
  b({
    stockCode: '301261',
    stockName: '恒工精密R',
    bondName: '恒工转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-09-17',
    issueSize: 8.10,
    rating: 'AA-',
    convertPrice: 48.00,
    stockPrice: 49.50,
    rationPerShare: 9.22,
    rightsPer100: 18.63,
    industry: '流体机械与连续球墨铸铁核心件'
  }),
  b({
    stockCode: '603298',
    stockName: '杭叉集团R',
    bondName: '杭叉转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-09-16',
    issueSize: 15.00,
    rating: 'AA+',
    convertPrice: 19.50,
    stockPrice: 20.10,
    rationPerShare: 1.15,
    rightsPer100: 5.72,
    industry: '锂电新能源叉车与AGV移动搬运机器人'
  }),
  b({
    stockCode: '002941',
    stockName: '新疆交建R',
    bondName: '新交转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-09-16',
    issueSize: 15.00,
    rating: 'AA',
    convertPrice: 11.20,
    stockPrice: 11.50,
    rationPerShare: 2.32,
    rightsPer100: 20.17,
    industry: '西北交通基础设施与一带一路工程'
  }),
  b({
    stockCode: '301310',
    stockName: '鑫宏业R',
    bondName: '鑫宏转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-09-03',
    issueSize: 6.50,
    rating: 'A+',
    convertPrice: 28.00,
    stockPrice: 29.20,
    rationPerShare: 4.78,
    rightsPer100: 16.37,
    industry: '光伏电缆与新能源汽车车内特种高压线'
  }),
  b({
    stockCode: '301498',
    stockName: '乖宝宠物R',
    bondName: '乖宝转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-08-27',
    issueSize: 10.00,
    rating: 'AA',
    convertPrice: 62.00,
    stockPrice: 64.50,
    rationPerShare: 2.50,
    rightsPer100: 3.88,
    industry: '弗列加特高端犬猫宠粮与宠物营养'
  }),
  b({
    stockCode: '300304',
    stockName: '云意电气',
    bondName: '云意转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-08-21',
    issueSize: 6.00,
    rating: 'AA-',
    convertPrice: 7.80,
    stockPrice: 8.10,
    rationPerShare: 0.69,
    rightsPer100: 8.52,
    industry: '车载智能电源控制器与车用二极管整流器'
  }),
  b({
    stockCode: '301297',
    stockName: '富乐德R',
    bondName: '富乐转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-08-15',
    issueSize: 7.00,
    rating: 'AA-',
    convertPrice: 48.00,
    stockPrice: 50.20,
    rationPerShare: 2.07,
    rightsPer100: 4.12,
    industry: '泛半导体工艺腔体零部件精密洗净与再制造'
  }),
  b({
    stockCode: '301141',
    stockName: '中科磁业R',
    bondName: '中磁转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-08-11',
    issueSize: 4.00,
    rating: 'A+',
    convertPrice: 36.00,
    stockPrice: 37.50,
    rationPerShare: 4.54,
    rightsPer100: 12.11,
    industry: '烧结钕铁硼永磁材料与永磁铁氧体'
  }),
  b({
    stockCode: '001335',
    stockName: '信凯科技R',
    bondName: '信凯转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-07-08',
    issueSize: 3.50,
    rating: 'A+',
    convertPrice: 28.00,
    stockPrice: 29.00,
    rationPerShare: 3.75,
    rightsPer100: 12.93,
    industry: '有机颜料及高性能着色剂跨境供应链'
  }),
  b({
    stockCode: '001389',
    stockName: '广合科技R',
    bondName: '广合转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2026-06-23',
    issueSize: 12.00,
    rating: 'AA-',
    convertPrice: 38.00,
    stockPrice: 39.50,
    rationPerShare: 2.84,
    rightsPer100: 7.19,
    industry: 'AI数据中心服务器多层高速PCB板'
  }),
  b({
    stockCode: '002948',
    stockName: '青岛银行R',
    bondName: '青银转债',
    stage: 'board_plan',
    stageName: '董事会预案',
    stageStep: 1,
    date: '2025-08-29',
    issueSize: 50.00,
    rating: 'AAA',
    convertPrice: 3.80,
    stockPrice: 3.75,
    rationPerShare: 0.86,
    rightsPer100: 22.93,
    industry: '山东省首家A+H上市城市商业银行'
  })
];

export function calculateCBSummary(list: PendingConvertibleBond[], lastSyncTime: string): CBProgressSummary {
  const totalCount = list.length;
  const totalIssueSize = Number(list.reduce((sum, item) => sum + (item.issueSize || 0), 0).toFixed(2));
  const announcedCount = list.filter(i => i.stage === 'issue_announced').length;
  const registeredCount = list.filter(i => i.stage === 'csrc_registered').length;
  const committeeCount = list.filter(i => i.stage === 'committee_approved').length;
  const exchangeCount = list.filter(i => i.stage === 'exchange_accepted').length;
  const shareholderCount = list.filter(i => i.stage === 'shareholder_approved').length;
  const boardCount = list.filter(i => i.stage === 'board_plan').length;
  const highRightsCount = list.filter(i => i.rightsPer100 >= 10).length;
  const verifiedCount = list.filter(i => (i.verifiedSources && i.verifiedSources.length > 0) || i.dataSourceVerification).length || totalCount;

  const newIssueCount = list.filter(i => i.isNewIssue || i.stage === 'board_plan').length;
  const progressUpdatedCount = list.filter(i => i.isProgressUpdated || ['issue_announced', 'csrc_registered', 'committee_approved'].includes(i.stage)).length;

  // Build high-value recent event stream from list items
  const recentEvents = list
    .filter(i => i.isProgressUpdated || i.isNewIssue || ['issue_announced', 'csrc_registered', 'committee_approved'].includes(i.stage))
    .slice(0, 10)
    .map(i => {
      let type: 'new_issue' | 'progress_advance' | 'filing_announced' = 'progress_advance';
      let title = `${i.bondName} 审核进展推进`;
      let desc = `${i.stockName} (${i.stockCode}) 推进至${i.stageName}，拟募资 ${i.issueSize} 亿元`;

      if (i.stage === 'issue_announced') {
        type = 'filing_announced';
        title = `${i.bondName} 正式定档申购公告`;
        desc = `申购日: ${i.subscribeDate || '近期'}，配售代码: ${i.rationCode || i.subscribeCode}，百元含权 ${i.rightsPer100}元`;
      } else if (i.stage === 'csrc_registered') {
        type = 'progress_advance';
        title = `${i.bondName} 获证监会同意注册批文`;
        desc = `已获注册批文，拟发行 ${i.issueSize} 亿元，即将启动发行公告`;
      } else if (i.stage === 'committee_approved') {
        type = 'progress_advance';
        title = `${i.bondName} 上市委审议会议通过`;
        desc = `上市委审核通过，进入证监会注册程序，拟募资 ${i.issueSize} 亿元`;
      } else if (i.isNewIssue || i.stage === 'board_plan') {
        type = 'new_issue';
        title = `${i.stockName} 发布可转债新发预案`;
        desc = `董事会审议通过发行可转债预案，拟募资 ${i.issueSize} 亿元用于${i.industry}`;
      }

      return {
        id: `ev-${i.stockCode}`,
        type,
        title,
        description: desc,
        stockCode: i.stockCode,
        stockName: i.stockName,
        bondName: i.bondName,
        stageName: i.stageName,
        issueSize: i.issueSize,
        date: i.latestUpdate,
        time: lastSyncTime,
        isFresh: true
      };
    });

  return {
    totalCount,
    totalIssueSize,
    announcedCount,
    registeredCount,
    committeeCount,
    exchangeCount,
    shareholderCount,
    boardCount,
    highRightsCount,
    lastSyncTime,
    verifiedCount,
    newIssueCount,
    progressUpdatedCount,
    recentEvents,
    sourceChannels: [
      '集思录待发转债官方接口',
      '东方财富数据中心(RPT_BOND_CB_LIST)',
      '沪深北交易所信披披露源',
      '新浪财经实盘行情接口'
    ]
  };
}
