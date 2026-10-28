import { IndustryValuationItem } from '../types/industryValuation';
import { SHENWAN_31_INDUSTRIES_VALUATION } from '../data/industryValuationData';

export interface ValuationTrendDataPoint {
  date: string;              // 如 '2022-Q1', '2023-Q4', '2026-Q3'
  timestamp: number;
  label: string;             // 显示标签
  [industryKey: string]: any; // 主行业与对比行业的百分位及PE值，例如 bank_percentile, bank_pe
}

// 预设的历史时间轴 (从 2021Q1 至 2026Q3，共 23 个关键季度节点)
export const HISTORICAL_PERIODS = [
  { key: '2021Q1', label: '2021 Q1' },
  { key: '2021Q2', label: '2021 Q2' },
  { key: '2021Q3', label: '2021 Q3' },
  { key: '2021Q4', label: '2021 Q4' },
  { key: '2022Q1', label: '2022 Q1' },
  { key: '2022Q2', label: '2022 Q2' },
  { key: '2022Q3', label: '2022 Q3' },
  { key: '2022Q4', label: '2022 Q4' },
  { key: '2023Q1', label: '2023 Q1' },
  { key: '2023Q2', label: '2023 Q2' },
  { key: '2023Q3', label: '2023 Q3' },
  { key: '2023Q4', label: '2023 Q4' },
  { key: '2024Q1', label: '2024 Q1' },
  { key: '2024Q2', label: '2024 Q2' },
  { key: '2024Q3', label: '2024 Q3' },
  { key: '2024Q4', label: '2024 Q4' },
  { key: '2025Q1', label: '2025 Q1' },
  { key: '2025Q2', label: '2025 Q2' },
  { key: '2025Q3', label: '2025 Q3' },
  { key: '2025Q4', label: '2025 Q4' },
  { key: '2026Q1', label: '2026 Q1' },
  { key: '2026Q2', label: '2026 Q2' },
  { key: '2026Q3', label: '2026 最新' }
];

// 为各行业生成确定性且符合A股历史周期特征的走势曲线
// 保证最后一个点(2026最新)严格等于 item.pePercentile 与 item.pe
export function generateIndustryHistoricalSeries(
  item: IndustryValuationItem
): { percentileSeries: number[]; peSeries: number[] } {
  const n = HISTORICAL_PERIODS.length;
  const currentPercentile = item.pePercentile;
  const currentPe = item.pe;
  const medianPe = item.historicalPeMedian;
  const minPe = item.historicalPeMin;
  const maxPe = item.historicalPeMax;

  // 使用基于行业ID的确定性伪随机种子，保证每次渲染结果一致且自然
  let seed = 0;
  for (let i = 0; i < item.id.length; i++) {
    seed = (seed * 31 + item.id.charCodeAt(i)) % 10000;
  }
  const pseudoRand = (idx: number) => {
    const val = Math.sin(seed + idx * 13.37) * 10000;
    return val - Math.floor(val);
  };

  // 根据不同行业的宏观属性设置历史周期形态
  // 1. 消费/医药: 2021高点(85%~95%) -> 持续回落筑底 -> 2026底部
  // 2. 科技/电子/通信: 2021中高 -> 2022回踩 -> 2023-2026受AI算力半导体景气推动上升
  // 3. 银行/煤炭/石油: 2021-2023底部震荡 -> 2024-2026高股息配置受青睐
  // 4. 新能源/电力设备: 2021-2022顶峰(90%+) -> 2023-2024深度去库存探底 -> 2025-2026企稳回升
  // 5. 房地产/建材: 2021高位 -> 2022-2026出清探底至历史低位
  const industryCategory = getIndustryMacroType(item.name);

  const percentileSeries: number[] = [];
  const peSeries: number[] = [];

  for (let i = 0; i < n; i++) {
    const progress = i / (n - 1); // 0 到 1

    if (i === n - 1) {
      // 最后一个点必须严格精确匹配当前真实数据
      percentileSeries.push(currentPercentile);
      peSeries.push(currentPe);
      continue;
    }

    let basePercentile = 50;

    switch (industryCategory) {
      case 'consumption': {
        // 2021高分位(80%~90%) -> 逐步下行至当前
        const decay = Math.cos(progress * Math.PI * 0.5);
        basePercentile = currentPercentile + (88 - currentPercentile) * Math.pow(decay, 1.2);
        break;
      }
      case 'tech': {
        // 2021高 -> 2022探底 -> 2023-2026爆发回升
        const curve = Math.sin((progress - 0.25) * Math.PI);
        basePercentile = 45 + curve * 30 + (progress * (currentPercentile - 50));
        break;
      }
      case 'dividend': {
        // 银行、石油、煤炭：低位筑底与高股息重估
        const wave = Math.sin(progress * Math.PI * 1.5) * 12;
        basePercentile = 15 + (currentPercentile - 15) * progress + wave;
        break;
      }
      case 'new_energy': {
        // 2021峰值(92%) -> 2023探底(20%) -> 2026回升至当前
        if (progress < 0.3) {
          basePercentile = 85 + (pseudoRand(i) - 0.5) * 10;
        } else if (progress < 0.7) {
          basePercentile = 25 + (pseudoRand(i) - 0.5) * 15;
        } else {
          basePercentile = 30 + (currentPercentile - 30) * ((progress - 0.7) / 0.3);
        }
        break;
      }
      case 'cyclical': {
        // 周期波动
        const wave = Math.sin(progress * Math.PI * 2.5) * 22;
        basePercentile = 50 + wave + (currentPercentile - 50) * progress;
        break;
      }
      case 'real_estate': {
        // 持续去杠杆探底
        basePercentile = 70 * Math.exp(-progress * 2.2) + currentPercentile * progress;
        break;
      }
      default: {
        // 平滑过渡加上温和随机波动
        const trend = 50 + (currentPercentile - 50) * Math.pow(progress, 0.8);
        basePercentile = trend + (pseudoRand(i) - 0.5) * 10;
        break;
      }
    }

    // 加入少量温和噪点，使折线自然起伏
    const noise = (pseudoRand(i) - 0.5) * 6;
    let finalPercentile = Math.max(1, Math.min(99, basePercentile + noise));

    // 平滑向终点收敛
    if (i >= n - 4) {
      const alpha = (n - 1 - i) / 4;
      finalPercentile = currentPercentile * (1 - alpha) + finalPercentile * alpha;
    }

    finalPercentile = parseFloat(finalPercentile.toFixed(1));
    percentileSeries.push(finalPercentile);

    // 计算对应的估值 PE
    const peRange = maxPe - minPe;
    const estimatedPe = minPe + (peRange * (finalPercentile / 100));
    peSeries.push(parseFloat(estimatedPe.toFixed(2)));
  }

  return { percentileSeries, peSeries };
}

function getIndustryMacroType(name: string): string {
  if (['食品饮料', '医药生物', '美容护理', '商贸零售', '社会服务'].includes(name)) return 'consumption';
  if (['电子', '通信', '计算机', '传媒'].includes(name)) return 'tech';
  if (['银行', '煤炭', '石油石化', '公用事业', '交通运输'].includes(name)) return 'dividend';
  if (['电力设备', '汽车', '国防军工'].includes(name)) return 'new_energy';
  if (['房地产', '建筑材料', '建筑装饰'].includes(name)) return 'real_estate';
  if (['钢铁', '基础化工', '有色金属'].includes(name)) return 'cyclical';
  return 'general';
}

// 缓存所有31个行业的历史序列
const industrySeriesCache = new Map<string, { percentileSeries: number[]; peSeries: number[] }>();

export function getCachedIndustrySeries(item: IndustryValuationItem) {
  if (!industrySeriesCache.has(item.id)) {
    industrySeriesCache.set(item.id, generateIndustryHistoricalSeries(item));
  }
  return industrySeriesCache.get(item.id)!;
}

// 行业对比色彩盘 (清晰区分、对比强烈、符合金融严谨审美)
export const COMPARISON_COLORS = [
  { stroke: '#4f46e5', fill: 'rgba(79, 70, 229, 0.15)', name: '主选行业 (靛蓝)' },
  { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.12)', name: '对比行业 1 (琥珀橙)' },
  { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.12)', name: '对比行业 2 (翡翠绿)' },
  { stroke: '#ec4899', fill: 'rgba(236, 72, 153, 0.12)', name: '对比行业 3 (玫瑰粉)' },
  { stroke: '#06b6d4', fill: 'rgba(6, 182, 212, 0.12)', name: '对比行业 4 (青碧蓝)' }
];
