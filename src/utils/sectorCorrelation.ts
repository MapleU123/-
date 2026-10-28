import { SectorFundFlow } from '../types/market';
import { getSectorFiveDayTrend } from './sectorTrendAnalyzer';

export interface SectorCorrelationPair {
  sectorA: SectorFundFlow;
  sectorB: SectorFundFlow;
  correlation: number; // -1.0 to 1.0
  correlationType: 'strong_positive' | 'mild_positive' | 'neutral' | 'mild_negative' | 'strong_negative';
  typeLabel: string;
  badgeBg: string;
  badgeText: string;
  allocationAdvice: string;
  hedgingEffectiveness: number; // 0-100%
  synergyLevel: number; // 0-100%
  coMovementDescription: string;
  recommendedRatio: { a: number; b: number; reason: string };
}

export interface CorrelationMatrixData {
  sectors: SectorFundFlow[];
  matrix: number[][]; // size N x N
  pairs: SectorCorrelationPair[];
  topPositivePairs: SectorCorrelationPair[];
  topNegativePairs: SectorCorrelationPair[];
  topOrthogonalPairs: SectorCorrelationPair[];
}

export interface PortfolioAllocationAssessment {
  selectedSectors: SectorFundFlow[];
  avgCorrelation: number;
  diversificationScore: number; // 0-100
  diversificationLevel: '极高分散' | '良好分散' | '中等分散' | '集中度偏高' | '同质化严重';
  riskOverlapDescription: string;
  weightingSuggestions: { sectorName: string; weight: number; role: '进攻矛' | '防守盾' | '平衡器' }[];
}

/**
 * Computes Pearson correlation coefficient between two numeric series
 */
export function calculatePearsonCorrelation(seriesA: number[], seriesB: number[]): number {
  const n = Math.min(seriesA.length, seriesB.length);
  if (n < 2) return 0;

  let sumA = 0;
  let sumB = 0;
  for (let i = 0; i < n; i++) {
    sumA += seriesA[i];
    sumB += seriesB[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;

  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < n; i++) {
    const diffA = seriesA[i] - meanA;
    const diffB = seriesB[i] - meanB;
    numerator += diffA * diffB;
    denomA += diffA * diffA;
    denomB += diffB * diffB;
  }

  const denominator = Math.sqrt(denomA * denomB);
  if (denominator === 0 || isNaN(denominator)) return 0;

  const r = numerator / denominator;
  // Clamp between -1.0 and 1.0
  return Math.max(-1, Math.min(1, Number(r.toFixed(3))));
}

/**
 * Extracts a normalized capital flow time series vector for a sector.
 * Combines 5-day daily net flows with intraday velocity to form a comprehensive series.
 */
export function getSectorFlowVector(sector: SectorFundFlow, mode: '5d' | 'intraday' | 'blended' = 'blended'): number[] {
  const trend = getSectorFiveDayTrend(sector);
  const fiveDayFlows = trend.history.map(h => h.netInflow);

  if (mode === '5d') {
    return fiveDayFlows;
  }

  // Intraday points
  const intradayFlows = (sector.intradayInflowHistory || []).map(p => p.netInflow);

  if (mode === 'intraday' && intradayFlows.length >= 4) {
    return intradayFlows;
  }

  // Blended: concatenate scaled 5-day flows with sampled intraday flows
  if (intradayFlows.length > 0) {
    // sample 5 points from intraday
    const step = Math.max(1, Math.floor(intradayFlows.length / 5));
    const sampledIntraday: number[] = [];
    for (let i = 0; i < intradayFlows.length; i += step) {
      sampledIntraday.push(intradayFlows[i]);
      if (sampledIntraday.length >= 5) break;
    }
    return [...fiveDayFlows, ...sampledIntraday];
  }

  return fiveDayFlows;
}

/**
 * Classifies correlation value into descriptive financial types
 */
export function classifyCorrelation(r: number): {
  type: SectorCorrelationPair['correlationType'];
  label: string;
  badgeBg: string;
  badgeText: string;
} {
  if (r >= 0.65) {
    return {
      type: 'strong_positive',
      label: '强共振进攻',
      badgeBg: 'bg-rose-950/80 border-rose-800/80',
      badgeText: 'text-rose-300'
    };
  }
  if (r >= 0.25) {
    return {
      type: 'mild_positive',
      label: '温和协同',
      badgeBg: 'bg-orange-950/60 border-orange-800/60',
      badgeText: 'text-orange-300'
    };
  }
  if (r > -0.25) {
    return {
      type: 'neutral',
      label: '独立/低相关',
      badgeBg: 'bg-slate-800 border-slate-700',
      badgeText: 'text-slate-300'
    };
  }
  if (r > -0.65) {
    return {
      type: 'mild_negative',
      label: '轻度跷跷板',
      badgeBg: 'bg-teal-950/60 border-teal-800/60',
      badgeText: 'text-teal-300'
    };
  }
  return {
    type: 'strong_negative',
    label: '极端负相关对冲',
    badgeBg: 'bg-emerald-950/80 border-emerald-800/80',
    badgeText: 'text-emerald-300'
  };
}

/**
 * Analyzes pair allocation dynamics
 */
export function analyzePairAllocation(sectorA: SectorFundFlow, sectorB: SectorFundFlow, r: number): SectorCorrelationPair {
  const meta = classifyCorrelation(r);

  let advice = '';
  let coMovement = '';
  let recommendedRatio = { a: 50, b: 50, reason: '等权中性配置' };
  let hedgingScore = 0;
  let synergyScore = 0;

  if (r >= 0.65) {
    synergyScore = Math.min(100, Math.round(r * 100));
    hedgingScore = Math.max(5, Math.round((1 - r) * 30));
    advice = '⚠️ 同向风险重叠度高！主力资金高度同频联动，同时重仓将加剧组合单一方向波动。建议作为主攻梯队，配置时优选最强龙头，避免同质化分散。';
    coMovement = '资金呈强协同共进退特征，当行情启动时进攻动量放大，但遇板块调整时易双双承压。';
    recommendedRatio = {
      a: 70,
      b: 30,
      reason: '精选主线龙头占70%，辅线30%跟进，防范同质化踩踏'
    };
  } else if (r >= 0.25) {
    synergyScore = Math.round(r * 90);
    hedgingScore = Math.round((1 - r) * 45);
    advice = '📈 适度协同联动。具备一定的产业链或风格联动基础，可作为中线组合中的多头协同进攻线，适度平滑短期波动。';
    coMovement = '受大盘宏观风险偏好共性驱动，走势大方向相近，但具体轮动节点有先后次序。';
    recommendedRatio = {
      a: 60,
      b: 40,
      reason: '主攻板块适度超配，兼顾跟风梯队'
    };
  } else if (r > -0.25) {
    synergyScore = 20;
    hedgingScore = Math.round(85 - Math.abs(r) * 80);
    advice = '🛡️ 绝佳的跨行业风险分散对子！资金逻辑彼此独立，互不抽血，同时配置可显著平滑组合净值波动，降低最大回撤。';
    coMovement = '资金流向近乎非线性相关，一个板块的资金增减基本不影响另一个板块的独立节奏。';
    recommendedRatio = {
      a: 50,
      b: 50,
      reason: '马科维茨有效分散组合，等权重底仓配置平滑夏普率'
    };
  } else if (r > -0.65) {
    synergyScore = 10;
    hedgingScore = Math.round(Math.abs(r) * 90);
    advice = '⚖️ 明显的跷跷板轮动对子。存量博弈下两板块资金存在吸血替换效应，适合根据量价背离点进行波段高抛低吸轮动。';
    coMovement = '呈现交替活跃特征：一方主力加速净流入时，另一方往往缩量休整；反之亦然。';
    recommendedRatio = {
      a: 60,
      b: 40,
      reason: '低吸回踩整理方，适度止盈高位加速方，实施动态再平衡'
    };
  } else {
    synergyScore = 5;
    hedgingScore = Math.min(100, Math.round(Math.abs(r) * 110));
    advice = '🎯 极佳的避险对冲配对！资金呈现极端排斥/跷跷板关系，在市场风格剧烈切换时能起到强大的抗跌减震效果。';
    coMovement = '典型的两极反转：市场风险偏好激进时科技成长虹吸资金，防御低估值承压；市场恐慌时防御板块逆势吸金，科技成长重挫。';
    recommendedRatio = {
      a: 55,
      b: 45,
      reason: '构建全天候攻守对冲篮子，攻守兼备'
    };
  }

  return {
    sectorA,
    sectorB,
    correlation: r,
    correlationType: meta.type,
    typeLabel: meta.label,
    badgeBg: meta.badgeBg,
    badgeText: meta.badgeText,
    allocationAdvice: advice,
    hedgingEffectiveness: hedgingScore,
    synergyLevel: synergyScore,
    coMovementDescription: coMovement,
    recommendedRatio
  };
}

/**
 * Computes full pairwise correlation matrix for an array of sectors
 */
export function buildCorrelationMatrix(
  sectors: SectorFundFlow[],
  mode: '5d' | 'intraday' | 'blended' = 'blended'
): CorrelationMatrixData {
  const n = sectors.length;
  const vectors = sectors.map(s => getSectorFlowVector(s, mode));
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(1));
  const pairs: SectorCorrelationPair[] = [];

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else if (i < j) {
        const r = calculatePearsonCorrelation(vectors[i], vectors[j]);
        matrix[i][j] = r;
        matrix[j][i] = r;

        pairs.push(analyzePairAllocation(sectors[i], sectors[j], r));
      }
    }
  }

  // Sort pairs for rapid discovery
  const topPositivePairs = [...pairs]
    .filter(p => p.correlation > 0.3)
    .sort((a, b) => b.correlation - a.correlation);

  const topNegativePairs = [...pairs]
    .filter(p => p.correlation < -0.2)
    .sort((a, b) => a.correlation - b.correlation);

  const topOrthogonalPairs = [...pairs]
    .sort((a, b) => Math.abs(a.correlation) - Math.abs(b.correlation));

  return {
    sectors,
    matrix,
    pairs,
    topPositivePairs,
    topNegativePairs,
    topOrthogonalPairs
  };
}

/**
 * Assesses an arbitrary custom user portfolio basket of sectors
 */
export function assessPortfolioAllocation(selectedSectors: SectorFundFlow[]): PortfolioAllocationAssessment {
  if (selectedSectors.length <= 1) {
    return {
      selectedSectors,
      avgCorrelation: 1.0,
      diversificationScore: 20,
      diversificationLevel: '同质化严重',
      riskOverlapDescription: '当前仅选中单一行业，缺乏跨行业风险分散机制，组合将承受该单一赛道的完全系统性与特异性风险。',
      weightingSuggestions: selectedSectors.map(s => ({ sectorName: s.name, weight: 100, role: '进攻矛' }))
    };
  }

  const k = selectedSectors.length;
  const vectors = selectedSectors.map(s => getSectorFlowVector(s, 'blended'));
  let totalCorr = 0;
  let count = 0;

  for (let i = 0; i < k; i++) {
    for (let j = i + 1; j < k; j++) {
      const r = calculatePearsonCorrelation(vectors[i], vectors[j]);
      totalCorr += r;
      count++;
    }
  }

  const avgCorr = count > 0 ? Number((totalCorr / count).toFixed(3)) : 0;
  
  // Diversification score: 100 when avg correlation is negative or near 0, decreasing as avgCorr approaches 1.0
  let divScore = 50;
  if (avgCorr <= 0) {
    divScore = Math.min(98, Math.round(85 + Math.abs(avgCorr) * 20));
  } else {
    divScore = Math.max(15, Math.round(85 - avgCorr * 75));
  }

  let level: PortfolioAllocationAssessment['diversificationLevel'] = '中等分散';
  let desc = '';

  if (divScore >= 80) {
    level = '极高分散';
    desc = `所选板块平均相关度仅为 ${avgCorr >= 0 ? '+' : ''}${avgCorr}，各行业资金逻辑差异显著、互补性极强，马科维茨有效前沿分散效果卓越。`;
  } else if (divScore >= 65) {
    level = '良好分散';
    desc = `所选板块平均相关度为 ${avgCorr >= 0 ? '+' : ''}${avgCorr}，整体呈现温和独立或轻度轮动，具备较好的抗震能力。`;
  } else if (divScore >= 45) {
    level = '中等分散';
    desc = `所选板块平均相关度为 ${avgCorr >= 0 ? '+' : ''}${avgCorr}，部分板块存在协同抱团倾向，遇到系统性市场调整时可能出现联动承压。`;
  } else if (divScore >= 30) {
    level = '集中度偏高';
    desc = `所选板块平均相关度达到 ${avgCorr >= 0 ? '+' : ''}${avgCorr}，重仓风格高度趋同，实质上属于同一宏观驱动因子下的同质资产。`;
  } else {
    level = '同质化严重';
    desc = `所选板块平均相关度高达 ${avgCorr >= 0 ? '+' : ''}${avgCorr}，主力资金高度同进同退，风险敞口高度重叠，极易放大净值回撤。`;
  }

  // Suggest weights based on momentum and inflow
  const baseWeight = Math.floor(100 / k);
  const remaining = 100 - baseWeight * k;
  const weightingSuggestions = selectedSectors.map((s, idx) => {
    let role: '进攻矛' | '防守盾' | '平衡器' = '平衡器';
    if (s.mainNetInflow > 15 || s.changePercent > 3) {
      role = '进攻矛';
    } else if (s.mainNetInflow < -5 || s.changePercent < 0) {
      role = '防守盾';
    }
    return {
      sectorName: s.name,
      weight: idx === 0 ? baseWeight + remaining : baseWeight,
      role
    };
  });

  return {
    selectedSectors,
    avgCorrelation: avgCorr,
    diversificationScore: divScore,
    diversificationLevel: level,
    riskOverlapDescription: desc,
    weightingSuggestions
  };
}
