import { SectorFundFlow, SectorStock } from '../types/market';

export interface HeatmapStockItem {
  code: string;
  name: string;
  sector: string;
  sectorGroup: string; // e.g., '科技成长', '高端制造', '大消费', '大金融', '周期资源'
  price: number;
  changePercent: number;
  turnover: number; // 亿元
  turnoverRate: number; // %
  marketCap: number; // 亿元 (总市值)
  mainNetInflow: number; // 亿元
  peRatio: number;
  high: number;
  low: number;
  open: number;
}

export interface SectorCluster {
  name: string;
  group: string;
  totalMarketCap: number;
  totalTurnover: number;
  avgChangePercent: number;
  risingCount: number;
  fallingCount: number;
  flatCount: number;
  stocks: HeatmapStockItem[];
}

export const INITIAL_HEATMAP_STOCKS: HeatmapStockItem[] = [
  // 1. 半导体与芯片 (科技成长)
  { code: '688981', name: '中芯国际', sector: '半导体芯片', sectorGroup: '科技成长', price: 82.50, changePercent: -4.85, turnover: 84.5, turnoverRate: 5.2, marketCap: 1650, mainNetInflow: -15.4, peRatio: 75.0, high: 86.80, low: 81.20, open: 86.00 },
  { code: '688041', name: '海光信息', sector: '半导体芯片', sectorGroup: '科技成长', price: 118.00, changePercent: -3.80, turnover: 52.8, turnoverRate: 4.8, marketCap: 2740, mainNetInflow: -7.5, peRatio: 68.0, high: 122.50, low: 116.50, open: 121.00 },
  { code: '688256', name: '寒武纪', sector: '半导体芯片', sectorGroup: '科技成长', price: 428.50, changePercent: 7.65, turnover: 78.2, turnoverRate: 7.9, marketCap: 1785, mainNetInflow: 12.8, peRatio: 140.0, high: 435.00, low: 395.00, open: 398.00 },
  { code: '002371', name: '北方华创', sector: '半导体芯片', sectorGroup: '科技成长', price: 386.00, changePercent: 3.42, turnover: 62.0, turnoverRate: 3.5, marketCap: 2050, mainNetInflow: 6.8, peRatio: 42.0, high: 392.00, low: 372.00, open: 375.00 },
  { code: '688012', name: '中微公司', sector: '半导体芯片', sectorGroup: '科技成长', price: 215.00, changePercent: 2.18, turnover: 41.5, turnoverRate: 3.8, marketCap: 1330, mainNetInflow: 3.2, peRatio: 52.0, high: 219.00, low: 208.00, open: 210.00 },
  { code: '603501', name: '韦尔股份', sector: '半导体芯片', sectorGroup: '科技成长', price: 104.80, changePercent: -1.25, turnover: 38.6, turnoverRate: 3.1, marketCap: 1270, mainNetInflow: -2.8, peRatio: 36.0, high: 107.50, low: 103.20, open: 106.00 },
  { code: '688008', name: '澜起科技', sector: '半导体芯片', sectorGroup: '科技成长', price: 68.50, changePercent: 4.80, turnover: 45.0, turnoverRate: 5.6, marketCap: 782, mainNetInflow: 5.4, peRatio: 55.0, high: 70.20, low: 65.00, open: 65.80 },
  { code: '600584', name: '长电科技', sector: '半导体芯片', sectorGroup: '科技成长', price: 39.20, changePercent: 1.55, turnover: 32.0, turnoverRate: 4.6, marketCap: 701, mainNetInflow: 1.8, peRatio: 32.0, high: 40.10, low: 38.50, open: 38.90 },
  { code: '603986', name: '兆易创新', sector: '半导体芯片', sectorGroup: '科技成长', price: 92.40, changePercent: 3.15, turnover: 36.4, turnoverRate: 5.8, marketCap: 616, mainNetInflow: 4.1, peRatio: 48.0, high: 94.00, low: 89.20, open: 89.50 },
  { code: '002049', name: '紫光国微', sector: '半导体芯片', sectorGroup: '科技成长', price: 65.80, changePercent: -0.90, turnover: 26.5, turnoverRate: 3.2, marketCap: 559, mainNetInflow: -1.5, peRatio: 28.0, high: 67.20, low: 64.90, open: 66.50 },

  // 2. 算力通信与人工智能 (科技成长)
  { code: '300308', name: '中际旭创', sector: '算力与AI通信', sectorGroup: '科技成长', price: 186.50, changePercent: 6.80, turnover: 110.0, turnoverRate: 6.8, marketCap: 1490, mainNetInflow: 18.2, peRatio: 38.0, high: 191.00, low: 174.50, open: 175.00 },
  { code: '601138', name: '工业富联', sector: '算力与AI通信', sectorGroup: '科技成长', price: 23.40, changePercent: 4.25, turnover: 92.5, turnoverRate: 3.2, marketCap: 4650, mainNetInflow: 14.5, peRatio: 21.0, high: 24.10, low: 22.30, open: 22.50 },
  { code: '300502', name: '新易盛', sector: '算力与AI通信', sectorGroup: '科技成长', price: 124.60, changePercent: 8.90, turnover: 88.0, turnoverRate: 8.5, marketCap: 882, mainNetInflow: 15.6, peRatio: 45.0, high: 126.80, low: 114.00, open: 115.00 },
  { code: '300394', name: '天孚通信', sector: '算力与AI通信', sectorGroup: '科技成长', price: 112.00, changePercent: 5.60, turnover: 48.5, turnoverRate: 7.2, marketCap: 442, mainNetInflow: 6.8, peRatio: 40.0, high: 114.50, low: 105.80, open: 106.00 },
  { code: '000977', name: '浪潮信息', sector: '算力与AI通信', sectorGroup: '科技成长', price: 46.20, changePercent: 3.82, turnover: 72.0, turnoverRate: 6.5, marketCap: 680, mainNetInflow: 7.4, peRatio: 32.0, high: 47.50, low: 44.10, open: 44.50 },
  { code: '300418', name: '昆仑万维', sector: '算力与AI通信', sectorGroup: '科技成长', price: 42.80, changePercent: 10.02, turnover: 85.0, turnoverRate: 11.2, marketCap: 526, mainNetInflow: 19.8, peRatio: 65.0, high: 42.80, low: 38.60, open: 39.00 },
  { code: '002230', name: '科大讯飞', sector: '算力与AI通信', sectorGroup: '科技成长', price: 48.60, changePercent: 2.85, turnover: 58.0, turnoverRate: 4.8, marketCap: 1125, mainNetInflow: 4.5, peRatio: 88.0, high: 49.80, low: 47.00, open: 47.20 },
  { code: '603019', name: '中科曙光', sector: '算力与AI通信', sectorGroup: '科技成长', price: 74.20, changePercent: 5.60, turnover: 64.0, turnoverRate: 5.8, marketCap: 1086, mainNetInflow: 9.2, peRatio: 46.0, high: 76.00, low: 70.00, open: 70.50 },
  { code: '000938', name: '紫光股份', sector: '算力与AI通信', sectorGroup: '科技成长', price: 26.50, changePercent: 1.92, turnover: 34.0, turnoverRate: 4.2, marketCap: 758, mainNetInflow: 2.1, peRatio: 35.0, high: 27.20, low: 25.80, open: 26.00 },

  // 3. 计算机软件与互联网应用 (科技成长)
  { code: '688111', name: '金山办公', sector: '计算机软件', sectorGroup: '科技成长', price: 298.00, changePercent: 4.90, turnover: 52.0, turnoverRate: 2.5, marketCap: 1378, mainNetInflow: 7.8, peRatio: 72.0, high: 304.00, low: 284.00, open: 285.00 },
  { code: '300033', name: '同花顺', sector: '计算机软件', sectorGroup: '科技成长', price: 285.00, changePercent: 6.45, turnover: 96.0, turnoverRate: 6.4, marketCap: 1530, mainNetInflow: 13.5, peRatio: 62.0, high: 292.00, low: 268.00, open: 270.00 },
  { code: '600570', name: '恒生电子', sector: '计算机软件', sectorGroup: '科技成长', price: 31.80, changePercent: 3.25, turnover: 42.0, turnoverRate: 3.8, marketCap: 604, mainNetInflow: 4.2, peRatio: 38.0, high: 32.50, low: 30.60, open: 30.80 },
  { code: '600588', name: '用友网络', sector: '计算机软件', sectorGroup: '科技成长', price: 14.20, changePercent: 6.80, turnover: 48.0, turnoverRate: 4.2, marketCap: 485, mainNetInflow: 6.5, peRatio: 52.0, high: 14.60, low: 13.20, open: 13.30 },
  { code: '601360', name: '三六零', sector: '计算机软件', sectorGroup: '科技成长', price: 12.80, changePercent: 9.98, turnover: 68.0, turnoverRate: 7.2, marketCap: 914, mainNetInflow: 14.2, peRatio: 90.0, high: 12.80, low: 11.60, open: 11.70 },
  { code: '300803', name: '指南针', sector: '计算机软件', sectorGroup: '科技成长', price: 98.50, changePercent: 5.12, turnover: 38.0, turnoverRate: 6.8, marketCap: 403, mainNetInflow: 4.8, peRatio: 85.0, high: 101.00, low: 93.00, open: 93.80 },
  { code: '300339', name: '润和软件', sector: '计算机软件', sectorGroup: '科技成长', price: 62.40, changePercent: 4.18, turnover: 56.0, turnoverRate: 9.1, marketCap: 497, mainNetInflow: 5.1, peRatio: 110.0, high: 64.50, low: 59.20, open: 60.00 },

  // 4. 新能源与电力设备 (高端制造)
  { code: '300750', name: '宁德时代', sector: '新能源电力', sectorGroup: '高端制造', price: 268.00, changePercent: 3.88, turnover: 125.0, turnoverRate: 2.1, marketCap: 11780, mainNetInflow: 22.4, peRatio: 22.5, high: 272.00, low: 257.00, open: 258.00 },
  { code: '002594', name: '比亚迪', sector: '新能源汽车', sectorGroup: '高端制造', price: 298.50, changePercent: 2.65, turnover: 88.0, turnoverRate: 1.8, marketCap: 8690, mainNetInflow: 11.8, peRatio: 24.0, high: 302.00, low: 290.00, open: 291.00 },
  { code: '601012', name: '隆基绿能', sector: '新能源电力', sectorGroup: '高端制造', price: 18.90, changePercent: -1.82, turnover: 52.0, turnoverRate: 3.5, marketCap: 1432, mainNetInflow: -6.4, peRatio: 19.5, high: 19.60, low: 18.70, open: 19.40 },
  { code: '600438', name: '通威股份', sector: '新能源电力', sectorGroup: '高端制造', price: 27.60, changePercent: -0.72, turnover: 41.0, turnoverRate: 2.8, marketCap: 1242, mainNetInflow: -2.1, peRatio: 16.0, high: 28.20, low: 27.30, open: 28.00 },
  { code: '300274', name: '阳光电源', sector: '新能源电力', sectorGroup: '高端制造', price: 92.50, changePercent: 4.15, turnover: 68.0, turnoverRate: 4.1, marketCap: 1918, mainNetInflow: 9.8, peRatio: 18.0, high: 94.50, low: 88.20, open: 88.50 },
  { code: '300014', name: '亿纬锂能', sector: '新能源电力', sectorGroup: '高端制造', price: 48.20, changePercent: 1.45, turnover: 36.0, turnoverRate: 3.2, marketCap: 986, mainNetInflow: 2.4, peRatio: 23.0, high: 49.30, low: 47.10, open: 47.50 },
  { code: '600089', name: '特变电工', sector: '新能源电力', sectorGroup: '高端制造', price: 14.65, changePercent: 0.85, turnover: 25.0, turnoverRate: 1.7, marketCap: 740, mainNetInflow: 1.2, peRatio: 9.5, high: 14.85, low: 14.45, open: 14.50 },
  { code: '600406', name: '国电南瑞', sector: '新能源电力', sectorGroup: '高端制造', price: 26.80, changePercent: 1.12, turnover: 29.0, turnoverRate: 1.3, marketCap: 2153, mainNetInflow: 3.1, peRatio: 26.0, high: 27.20, low: 26.40, open: 26.50 },
  { code: '002460', name: '赣锋锂业', sector: '新能源电力', sectorGroup: '高端制造', price: 38.50, changePercent: -2.55, turnover: 39.0, turnoverRate: 4.5, marketCap: 776, mainNetInflow: -4.8, peRatio: 30.0, high: 39.80, low: 38.10, open: 39.50 },
  { code: '002466', name: '天齐锂业', sector: '新能源电力', sectorGroup: '高端制造', price: 37.20, changePercent: -2.85, turnover: 36.5, turnoverRate: 4.2, marketCap: 610, mainNetInflow: -4.2, peRatio: 28.0, high: 38.60, low: 36.90, open: 38.30 },

  // 5. 汽车制造与智能化零部件 (高端制造)
  { code: '601127', name: '赛力斯', sector: '新能源汽车', sectorGroup: '高端制造', price: 136.00, changePercent: 5.85, turnover: 98.0, turnoverRate: 5.6, marketCap: 2053, mainNetInflow: 16.4, peRatio: 48.0, high: 139.50, low: 128.00, open: 128.50 },
  { code: '000625', name: '长安汽车', sector: '新能源汽车', sectorGroup: '高端制造', price: 13.85, changePercent: 1.84, turnover: 42.0, turnoverRate: 3.2, marketCap: 1374, mainNetInflow: 3.8, peRatio: 12.5, high: 14.20, low: 13.50, open: 13.60 },
  { code: '601633', name: '长城汽车', sector: '新能源汽车', sectorGroup: '高端制造', price: 26.50, changePercent: 0.95, turnover: 28.0, turnoverRate: 1.4, marketCap: 2260, mainNetInflow: 1.9, peRatio: 19.0, high: 27.00, low: 26.10, open: 26.20 },
  { code: '600104', name: '上汽集团', sector: '新能源汽车', sectorGroup: '高端制造', price: 15.20, changePercent: 0.40, turnover: 22.0, turnoverRate: 1.1, marketCap: 1775, mainNetInflow: 0.8, peRatio: 11.0, high: 15.45, low: 15.05, open: 15.10 },
  { code: '601689', name: '拓普集团', sector: '新能源汽车', sectorGroup: '高端制造', price: 54.80, changePercent: 3.40, turnover: 32.0, turnoverRate: 3.8, marketCap: 924, mainNetInflow: 4.1, peRatio: 28.0, high: 56.20, low: 52.80, open: 53.00 },
  { code: '002050', name: '三花智控', sector: '新能源汽车', sectorGroup: '高端制造', price: 23.60, changePercent: 2.15, turnover: 35.0, turnoverRate: 3.6, marketCap: 881, mainNetInflow: 3.5, peRatio: 26.0, high: 24.20, low: 22.90, open: 23.10 },
  { code: '002920', name: '德赛西威', sector: '新能源汽车', sectorGroup: '高端制造', price: 118.00, changePercent: 4.60, turnover: 38.0, turnoverRate: 4.5, marketCap: 655, mainNetInflow: 5.2, peRatio: 33.0, high: 121.00, low: 112.50, open: 113.00 },
  { code: '600660', name: '福耀玻璃', sector: '新能源汽车', sectorGroup: '高端制造', price: 56.40, changePercent: 1.25, turnover: 26.0, turnoverRate: 1.3, marketCap: 1471, mainNetInflow: 2.6, peRatio: 21.0, high: 57.20, low: 55.60, open: 55.80 },

  // 6. 白酒与核心食品饮料 (大消费)
  { code: '600519', name: '贵州茅台', sector: '白酒消费', sectorGroup: '大消费', price: 1680.00, changePercent: 2.10, turnover: 105.0, turnoverRate: 0.8, marketCap: 21100, mainNetInflow: 8.5, peRatio: 24.5, high: 1698.00, low: 1642.00, open: 1645.00 },
  { code: '000858', name: '五粮液', sector: '白酒消费', sectorGroup: '大消费', price: 142.50, changePercent: 2.15, turnover: 52.0, turnoverRate: 1.2, marketCap: 5530, mainNetInflow: 5.1, peRatio: 17.5, high: 145.00, low: 139.20, open: 139.50 },
  { code: '000568', name: '泸州老窖', sector: '白酒消费', sectorGroup: '大消费', price: 148.00, changePercent: 1.75, turnover: 49.0, turnoverRate: 1.5, marketCap: 2170, mainNetInflow: 4.6, peRatio: 18.0, high: 151.20, low: 145.50, open: 146.00 },
  { code: '600809', name: '山西汾酒', sector: '白酒消费', sectorGroup: '大消费', price: 218.00, changePercent: 2.80, turnover: 38.0, turnoverRate: 1.4, marketCap: 2659, mainNetInflow: 4.2, peRatio: 22.0, high: 222.00, low: 211.50, open: 212.00 },
  { code: '002304', name: '洋河股份', sector: '白酒消费', sectorGroup: '大消费', price: 86.50, changePercent: 0.82, turnover: 18.0, turnoverRate: 1.1, marketCap: 1303, mainNetInflow: 1.1, peRatio: 13.5, high: 87.80, low: 85.60, open: 85.80 },
  { code: '603288', name: '海天味业', sector: '食品饮料', sectorGroup: '大消费', price: 44.20, changePercent: 0.65, turnover: 16.0, turnoverRate: 0.9, marketCap: 2457, mainNetInflow: 0.9, peRatio: 36.0, high: 44.90, low: 43.80, open: 43.90 },
  { code: '600887', name: '伊利股份', sector: '食品饮料', sectorGroup: '大消费', price: 28.50, changePercent: 1.05, turnover: 24.0, turnoverRate: 1.2, marketCap: 1814, mainNetInflow: 2.2, peRatio: 16.5, high: 28.90, low: 28.10, open: 28.20 },
  { code: '601888', name: '中国中免', sector: '商贸免税', sectorGroup: '大消费', price: 68.20, changePercent: -1.45, turnover: 32.0, turnoverRate: 2.3, marketCap: 1410, mainNetInflow: -3.5, peRatio: 25.0, high: 70.50, low: 67.50, open: 69.80 },

  // 7. 医药生物与医疗健康 (大消费)
  { code: '603259', name: '药明康德', sector: '医药生物', sectorGroup: '大消费', price: 54.20, changePercent: -2.35, turnover: 46.0, turnoverRate: 2.8, marketCap: 1570, mainNetInflow: -5.8, peRatio: 16.0, high: 56.50, low: 53.60, open: 55.80 },
  { code: '600276', name: '恒瑞医药', sector: '医药生物', sectorGroup: '大消费', price: 48.60, changePercent: 1.88, turnover: 38.0, turnoverRate: 1.2, marketCap: 3100, mainNetInflow: 4.5, peRatio: 45.0, high: 49.50, low: 47.60, open: 47.80 },
  { code: '300760', name: '迈瑞医疗', sector: '医药生物', sectorGroup: '大消费', price: 272.00, changePercent: 1.12, turnover: 28.0, turnoverRate: 0.9, marketCap: 3297, mainNetInflow: 3.2, peRatio: 26.0, high: 276.00, low: 268.00, open: 269.00 },
  { code: '600436', name: '片仔癀', sector: '医药生物', sectorGroup: '大消费', price: 236.00, changePercent: 0.85, turnover: 19.0, turnoverRate: 1.1, marketCap: 1423, mainNetInflow: 1.4, peRatio: 42.0, high: 239.50, low: 233.00, open: 234.00 },
  { code: '300015', name: '爱尔眼科', sector: '医药生物', sectorGroup: '大消费', price: 14.80, changePercent: 0.45, turnover: 25.0, turnoverRate: 1.8, marketCap: 1380, mainNetInflow: 0.7, peRatio: 35.0, high: 15.20, low: 14.60, open: 14.70 },
  { code: '688271', name: '联影医疗', sector: '医药生物', sectorGroup: '大消费', price: 132.00, changePercent: 2.45, turnover: 21.0, turnoverRate: 1.8, marketCap: 1087, mainNetInflow: 2.8, peRatio: 48.0, high: 135.00, low: 128.50, open: 129.00 },

  // 8. 银行金融与高股息 (大金融)
  { code: '601398', name: '工商银行', sector: '银行金融', sectorGroup: '大金融', price: 6.20, changePercent: 0.65, turnover: 42.0, turnoverRate: 0.2, marketCap: 22100, mainNetInflow: 5.2, peRatio: 5.8, high: 6.25, low: 6.14, open: 6.15 },
  { code: '601939', name: '建设银行', sector: '银行金融', sectorGroup: '大金融', price: 8.10, changePercent: 0.75, turnover: 36.0, turnoverRate: 0.2, marketCap: 20250, mainNetInflow: 4.8, peRatio: 5.5, high: 8.16, low: 8.02, open: 8.04 },
  { code: '601288', name: '农业银行', sector: '银行金融', sectorGroup: '大金融', price: 4.85, changePercent: 0.83, turnover: 38.0, turnoverRate: 0.3, marketCap: 16970, mainNetInflow: 5.0, peRatio: 5.6, high: 4.89, low: 4.79, open: 4.80 },
  { code: '601988', name: '中国银行', sector: '银行金融', sectorGroup: '大金融', price: 5.12, changePercent: 0.59, turnover: 28.0, turnoverRate: 0.2, marketCap: 15070, mainNetInflow: 3.4, peRatio: 5.9, high: 5.16, low: 5.08, open: 5.09 },
  { code: '600036', name: '招商银行', sector: '银行金融', sectorGroup: '大金融', price: 39.50, changePercent: 1.80, turnover: 58.0, turnoverRate: 0.7, marketCap: 9960, mainNetInflow: 7.9, peRatio: 6.8, high: 40.10, low: 38.60, open: 38.80 },
  { code: '601166', name: '兴业银行', sector: '银行金融', sectorGroup: '大金融', price: 18.90, changePercent: 1.15, turnover: 32.0, turnoverRate: 0.6, marketCap: 3926, mainNetInflow: 3.8, peRatio: 4.9, high: 19.20, low: 18.60, open: 18.70 },
  { code: '000001', name: '平安银行', sector: '银行金融', sectorGroup: '大金融', price: 11.85, changePercent: 0.95, turnover: 26.0, turnoverRate: 0.9, marketCap: 2299, mainNetInflow: 2.6, peRatio: 4.8, high: 12.05, low: 11.68, open: 11.75 },
  { code: '002142', name: '宁波银行', sector: '银行金融', sectorGroup: '大金融', price: 26.40, changePercent: 2.10, turnover: 24.0, turnoverRate: 1.2, marketCap: 1743, mainNetInflow: 3.2, peRatio: 6.2, high: 26.90, low: 25.80, open: 25.90 },

  // 9. 证券与非银保险 (大金融)
  { code: '600030', name: '中信证券', sector: '证券保险', sectorGroup: '大金融', price: 29.80, changePercent: 2.45, turnover: 75.0, turnoverRate: 2.2, marketCap: 4416, mainNetInflow: 9.8, peRatio: 16.5, high: 30.60, low: 28.90, open: 29.00 },
  { code: '300059', name: '东方财富', sector: '证券保险', sectorGroup: '大金融', price: 24.50, changePercent: 4.80, turnover: 168.0, turnoverRate: 5.8, marketCap: 3880, mainNetInflow: 28.5, peRatio: 38.0, high: 25.40, low: 23.20, open: 23.40 },
  { code: '601318', name: '中国平安', sector: '证券保险', sectorGroup: '大金融', price: 56.80, changePercent: 2.35, turnover: 72.0, turnoverRate: 1.1, marketCap: 10350, mainNetInflow: 8.5, peRatio: 10.5, high: 57.80, low: 55.20, open: 55.50 },
  { code: '601628', name: '中国人寿', sector: '证券保险', sectorGroup: '大金融', price: 42.50, changePercent: 1.95, turnover: 28.0, turnoverRate: 0.3, marketCap: 12010, mainNetInflow: 3.8, peRatio: 15.0, high: 43.20, low: 41.50, open: 41.70 },
  { code: '601688', name: '华泰证券', sector: '证券保险', sectorGroup: '大金融', price: 18.20, changePercent: 2.15, turnover: 36.0, turnoverRate: 2.5, marketCap: 1650, mainNetInflow: 4.2, peRatio: 13.0, high: 18.65, low: 17.75, open: 17.80 },
  { code: '601788', name: '光大证券', sector: '证券保险', sectorGroup: '大金融', price: 18.50, changePercent: 3.10, turnover: 36.5, turnoverRate: 4.2, marketCap: 853, mainNetInflow: 4.2, peRatio: 18.0, high: 19.10, low: 17.85, open: 17.90 },

  // 10. 通信网络与消费电子 (科技成长)
  { code: '002475', name: '立讯精密', sector: '消费电子通信', sectorGroup: '科技成长', price: 38.50, changePercent: -4.12, turnover: 110.0, turnoverRate: 4.2, marketCap: 2780, mainNetInflow: -18.2, peRatio: 21.0, high: 40.50, low: 37.80, open: 40.10 },
  { code: '002241', name: '歌尔股份', sector: '消费电子通信', sectorGroup: '科技成长', price: 24.20, changePercent: 4.30, turnover: 48.0, turnoverRate: 5.6, marketCap: 830, mainNetInflow: 6.2, peRatio: 26.0, high: 24.90, low: 23.00, open: 23.20 },
  { code: '688036', name: '传音控股', sector: '消费电子通信', sectorGroup: '科技成长', price: 96.50, changePercent: 1.85, turnover: 22.0, turnoverRate: 2.5, marketCap: 1098, mainNetInflow: 2.5, peRatio: 18.0, high: 98.80, low: 94.20, open: 94.80 },
  { code: '600941', name: '中国移动', sector: '通信运营商', sectorGroup: '科技成长', price: 104.50, changePercent: 1.05, turnover: 35.0, turnoverRate: 0.2, marketCap: 22350, mainNetInflow: 4.5, peRatio: 15.0, high: 105.80, low: 103.20, open: 103.50 },
  { code: '601728', name: '中国电信', sector: '通信运营商', sectorGroup: '科技成长', price: 6.45, changePercent: 0.94, turnover: 26.0, turnoverRate: 0.5, marketCap: 5900, mainNetInflow: 3.1, peRatio: 16.5, high: 6.55, low: 6.38, open: 6.40 },
  { code: '600050', name: '中国联通', sector: '通信运营商', sectorGroup: '科技成长', price: 5.25, changePercent: 1.55, turnover: 32.0, turnoverRate: 1.8, marketCap: 1670, mainNetInflow: 4.2, peRatio: 19.0, high: 5.38, low: 5.15, open: 5.16 },
  { code: '000063', name: '中兴通讯', sector: '消费电子通信', sectorGroup: '科技成长', price: 32.40, changePercent: 2.85, turnover: 54.0, turnoverRate: 3.8, marketCap: 1550, mainNetInflow: 6.8, peRatio: 15.5, high: 33.20, low: 31.40, open: 31.50 },

  // 11. 机械装备与军工重器 (高端制造)
  { code: '600031', name: '三一重工', sector: '工程机械', sectorGroup: '高端制造', price: 16.80, changePercent: -2.10, turnover: 51.0, turnoverRate: 1.8, marketCap: 1425, mainNetInflow: -5.2, peRatio: 18.0, high: 17.30, low: 16.60, open: 17.15 },
  { code: '000768', name: '中航西飞', sector: '国防军工', sectorGroup: '高端制造', price: 28.50, changePercent: 3.65, turnover: 38.0, turnoverRate: 3.2, marketCap: 792, mainNetInflow: 4.9, peRatio: 65.0, high: 29.20, low: 27.30, open: 27.50 },
  { code: '600893', name: '航发动力', sector: '国防军工', sectorGroup: '高端制造', price: 39.80, changePercent: 2.85, turnover: 29.0, turnoverRate: 2.4, marketCap: 1060, mainNetInflow: 3.5, peRatio: 82.0, high: 40.60, low: 38.60, open: 38.80 },
  { code: '600760', name: '中航沈飞', sector: '国防军工', sectorGroup: '高端制造', price: 46.20, changePercent: 3.12, turnover: 32.0, turnoverRate: 2.5, marketCap: 1272, mainNetInflow: 4.1, peRatio: 42.0, high: 47.40, low: 44.60, open: 44.80 },
  { code: '600150', name: '中国船舶', sector: '国防军工', sectorGroup: '高端制造', price: 38.20, changePercent: 4.95, turnover: 62.0, turnoverRate: 4.1, marketCap: 1708, mainNetInflow: 8.8, peRatio: 45.0, high: 39.20, low: 36.20, open: 36.50 },
  { code: '000338', name: '潍柴动力', sector: '工程机械', sectorGroup: '高端制造', price: 14.20, changePercent: 1.45, turnover: 25.0, turnoverRate: 1.8, marketCap: 1239, mainNetInflow: 2.1, peRatio: 11.5, high: 14.50, low: 13.95, open: 14.00 },

  // 12. 有色金属与周期资源 (周期资源)
  { code: '601899', name: '紫金矿业', sector: '有色资源', sectorGroup: '周期资源', price: 17.65, changePercent: -2.48, turnover: 59.0, turnoverRate: 2.1, marketCap: 4650, mainNetInflow: -6.8, peRatio: 14.2, high: 18.25, low: 17.40, open: 18.10 },
  { code: '601600', name: '中国铝业', sector: '有色资源', sectorGroup: '周期资源', price: 7.85, changePercent: 1.15, turnover: 31.0, turnoverRate: 2.5, marketCap: 1346, mainNetInflow: 2.5, peRatio: 15.0, high: 8.05, low: 7.72, open: 7.75 },
  { code: '600362', name: '江西铜业', sector: '有色资源', sectorGroup: '周期资源', price: 23.40, changePercent: -1.25, turnover: 28.0, turnoverRate: 2.2, marketCap: 810, mainNetInflow: -2.4, peRatio: 12.5, high: 24.10, low: 23.10, open: 23.70 },
  { code: '603993', name: '洛阳钼业', sector: '有色资源', sectorGroup: '周期资源', price: 7.42, changePercent: 0.82, turnover: 34.0, turnoverRate: 2.8, marketCap: 1602, mainNetInflow: 1.8, peRatio: 13.0, high: 7.60, low: 7.32, open: 7.35 },
  { code: '601088', name: '中国神华', sector: '能源煤炭', sectorGroup: '周期资源', price: 41.50, changePercent: 0.48, turnover: 26.0, turnoverRate: 0.4, marketCap: 8245, mainNetInflow: 2.1, peRatio: 12.0, high: 42.00, low: 41.10, open: 41.20 },
  { code: '601225', name: '陕西煤业', sector: '能源煤炭', sectorGroup: '周期资源', price: 23.80, changePercent: 0.65, turnover: 22.0, turnoverRate: 0.9, marketCap: 2307, mainNetInflow: 1.8, peRatio: 9.8, high: 24.20, low: 23.40, open: 23.50 },
  { code: '601857', name: '中国石油', sector: '石油石化', sectorGroup: '周期资源', price: 8.45, changePercent: 0.60, turnover: 32.0, turnoverRate: 0.2, marketCap: 15460, mainNetInflow: 3.5, peRatio: 9.2, high: 8.55, low: 8.38, open: 8.40 },
  { code: '600309', name: '万华化学', sector: '化工新材', sectorGroup: '周期资源', price: 78.50, changePercent: -1.65, turnover: 33.0, turnoverRate: 1.4, marketCap: 2464, mainNetInflow: -3.8, peRatio: 14.5, high: 80.20, low: 77.80, open: 79.90 },
];

/**
 * Merge live simulation sector topStocks with INITIAL_HEATMAP_STOCKS
 * to make sure prices and changePercents update live!
 */
export function getMergedHeatmapStocks(sectors: SectorFundFlow[]): HeatmapStockItem[] {
  const stockMap = new Map<string, Partial<SectorStock>>();

  sectors.forEach(s => {
    s.topStocks.forEach(stk => {
      stockMap.set(stk.code, stk);
    });
  });

  return INITIAL_HEATMAP_STOCKS.map(base => {
    const live = stockMap.get(base.code);
    if (!live) return base;

    return {
      ...base,
      price: live.price ?? base.price,
      changePercent: live.changePercent ?? base.changePercent,
      turnover: live.turnover ?? base.turnover,
      turnoverRate: live.turnoverRate ?? base.turnoverRate,
      marketCap: live.marketCap ?? base.marketCap,
      mainNetInflow: live.mainNetInflow ?? base.mainNetInflow,
      peRatio: live.peRatio ?? base.peRatio
    };
  });
}

/**
 * Group stocks into Sector Clusters for hierarchical visualization
 */
export function groupStocksBySector(stocks: HeatmapStockItem[]): SectorCluster[] {
  const clusters = new Map<string, SectorCluster>();

  stocks.forEach(stock => {
    if (!clusters.has(stock.sector)) {
      clusters.set(stock.sector, {
        name: stock.sector,
        group: stock.sectorGroup,
        totalMarketCap: 0,
        totalTurnover: 0,
        avgChangePercent: 0,
        risingCount: 0,
        fallingCount: 0,
        flatCount: 0,
        stocks: []
      });
    }

    const cluster = clusters.get(stock.sector)!;
    cluster.stocks.push(stock);
    cluster.totalMarketCap += stock.marketCap;
    cluster.totalTurnover += stock.turnover;

    if (stock.changePercent > 0.05) cluster.risingCount++;
    else if (stock.changePercent < -0.05) cluster.fallingCount++;
    else cluster.flatCount++;
  });

  // Calculate averages and sort stocks within cluster
  const result: SectorCluster[] = [];
  clusters.forEach(c => {
    if (c.stocks.length > 0) {
      const sumChange = c.stocks.reduce((acc, s) => acc + s.changePercent, 0);
      c.avgChangePercent = sumChange / c.stocks.length;
      // Sort stocks by marketCap desc
      c.stocks.sort((a, b) => b.marketCap - a.marketCap);
      result.push(c);
    }
  });

  // Sort clusters by totalMarketCap desc
  result.sort((a, b) => b.totalMarketCap - a.totalMarketCap);

  return result;
}

/**
 * Return CSS background and text color based on changePercent in A-Share convention:
 * Red = Up, Green = Down
 */
export function getStockHeatColor(changePercent: number): {
  bg: string;
  text: string;
  badgeBg: string;
  borderColor: string;
  intensity: number;
} {
  if (changePercent >= 9.5) {
    // 涨停板
    return {
      bg: 'bg-red-700 hover:bg-red-800',
      text: 'text-white',
      badgeBg: 'bg-red-900/60 text-red-200 border-red-400',
      borderColor: 'border-red-400',
      intensity: 1.0
    };
  }
  if (changePercent >= 5.0) {
    return {
      bg: 'bg-red-600 hover:bg-red-700',
      text: 'text-white',
      badgeBg: 'bg-red-900/50 text-red-100 border-red-500',
      borderColor: 'border-red-500/80',
      intensity: 0.8
    };
  }
  if (changePercent >= 2.0) {
    return {
      bg: 'bg-rose-500 hover:bg-rose-600',
      text: 'text-white',
      badgeBg: 'bg-rose-900/40 text-rose-100 border-rose-400',
      borderColor: 'border-rose-400/60',
      intensity: 0.6
    };
  }
  if (changePercent >= 0.2) {
    return {
      bg: 'bg-rose-500/80 hover:bg-rose-500',
      text: 'text-white',
      badgeBg: 'bg-rose-900/30 text-rose-100 border-rose-400/50',
      borderColor: 'border-rose-300/40',
      intensity: 0.3
    };
  }
  if (changePercent > -0.2 && changePercent < 0.2) {
    return {
      bg: 'bg-slate-700 hover:bg-slate-600',
      text: 'text-slate-200',
      badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
      borderColor: 'border-slate-600',
      intensity: 0
    };
  }
  if (changePercent > -2.0) {
    return {
      bg: 'bg-emerald-600/80 hover:bg-emerald-600',
      text: 'text-white',
      badgeBg: 'bg-emerald-900/40 text-emerald-100 border-emerald-400/50',
      borderColor: 'border-emerald-300/40',
      intensity: -0.3
    };
  }
  if (changePercent > -5.0) {
    return {
      bg: 'bg-emerald-600 hover:bg-emerald-700',
      text: 'text-white',
      badgeBg: 'bg-emerald-900/50 text-emerald-100 border-emerald-500',
      borderColor: 'border-emerald-400/80',
      intensity: -0.6
    };
  }
  // 跌幅 >= 5% 或 跌停板
  return {
    bg: 'bg-emerald-800 hover:bg-emerald-900',
    text: 'text-white',
    badgeBg: 'bg-emerald-950 text-emerald-200 border-emerald-500',
    borderColor: 'border-emerald-500',
    intensity: -1.0
  };
}
