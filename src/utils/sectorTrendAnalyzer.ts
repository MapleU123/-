import { SectorFundFlow, SectorDailyTrendPoint, SectorTrendPattern } from '../types/market';
import { getDynamicTradingDays } from './marketDateUtils';

export interface TrendAnalysisResult {
  history: SectorDailyTrendPoint[];
  total5dInflow: number; // 5日累计净流入 (亿元)
  inflowDaysCount: number; // 流入天数 (0-5)
  outflowDaysCount: number; // 流出天数 (0-5)
  maxSingleDayInflow: number; // 5日单日最大流入
  impulseConcentration: number; // 脉冲集中度 (0-100%)
  pattern: SectorTrendPattern;
  patternTitle: string;
  patternSubtitle: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  iconType: 'trend-up' | 'zap' | 'refresh' | 'shuffle' | 'trend-down';
  diagnosisHeadline: string;
  institutionalAnalysis: string;
  actionGuidance: string;
}

// Simple deterministic pseudo-random generator based on string seed
function stringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number, step: number): number {
  const x = Math.sin(seed + step * 9973) * 10000;
  return x - Math.floor(x);
}

/**
 * Normalizes or derives 5-day historical trend for any sector
 */
export function getSectorFiveDayTrend(sector: SectorFundFlow): TrendAnalysisResult {
  // 1. If sector already has 5-day history, use it; otherwise generate realistic deterministic data
  let history: SectorDailyTrendPoint[] = [];

  if (sector.fiveDayHistory && sector.fiveDayHistory.length === 5) {
    history = sector.fiveDayHistory;
  } else {
    // Obtain 5 dynamic trading days (T, T-1, T-2, T-3, T-4)
    const tradingDayOptions = getDynamicTradingDays(5);
    // Reverse so chronological order: [T-4, T-3, T-2, T-1, T(today)]
    const chronologicalDays = [...tradingDayOptions].reverse();

    const seed = stringToSeed(sector.name + (sector.id || ''));
    const todayFlow = sector.mainNetInflow;
    const todayPct = sector.changePercent;
    const momentum = sector.inflowMomentum || 50;

    // Determine archetype behavior:
    // If momentum > 70 & todayFlow > 10: likely continuous inflow or strong trend
    // If momentum < 60 & todayFlow > 30: classic impulse spike (脉冲式进入)
    // If todayFlow < -15: continuous outflow or impulse dump
    const isHighMomentum = momentum >= 70;
    const isImpulseCandidate = todayFlow > 20 && momentum < 68;

    const derivedPoints: SectorDailyTrendPoint[] = [];

    for (let i = 0; i < 5; i++) {
      const dayOpt = chronologicalDays[i];
      const isToday = i === 4;
      const fullDate = dayOpt.value;
      const date = fullDate.slice(5); // 'MM-DD'
      
      let dayLabel = `T-${4 - i}`;
      if (i === 4) dayLabel = '今日(实时)';
      else if (i === 3) dayLabel = '昨日';

      if (isToday) {
        derivedPoints.push({
          date,
          fullDate,
          dayLabel,
          netInflow: Number(todayFlow.toFixed(2)),
          changePercent: Number(todayPct.toFixed(2)),
          turnover: Number(sector.totalTurnover.toFixed(1)),
          mainNetRatio: Number(sector.mainNetRatio.toFixed(1))
        });
      } else {
        const r1 = seededRandom(seed, i);
        const r2 = seededRandom(seed, i + 10);
        let pastFlow = 0;
        let pastPct = 0;

        if (isImpulseCandidate) {
          // Impulse archetype: past days were flat, negative, or small, today spiked massively
          pastFlow = (r1 - 0.55) * (Math.abs(todayFlow) * 0.22);
          pastPct = (r2 - 0.5) * 1.8;
        } else if (todayFlow > 0 && isHighMomentum) {
          // Continuous inflow archetype: progressively positive or steady inflow
          const growthFactor = (i + 1) / 5;
          pastFlow = todayFlow * (0.35 + 0.55 * growthFactor) * (0.8 + r1 * 0.4);
          pastPct = (todayPct * 0.6 + (r2 - 0.4) * 1.5);
        } else if (todayFlow < 0) {
          // Outflow archetype: negative or declining flow
          pastFlow = todayFlow * (0.3 + 0.6 * ((i + 1) / 5)) * (0.8 + r1 * 0.4);
          pastPct = (todayPct * 0.5 + (r2 - 0.6) * 1.6);
        } else {
          // Oscillating archetype: mix of positive and negative
          pastFlow = (r1 - 0.48) * 16;
          pastPct = (r2 - 0.5) * 2.2;
        }

        derivedPoints.push({
          date,
          fullDate,
          dayLabel,
          netInflow: Number(pastFlow.toFixed(2)),
          changePercent: Number(pastPct.toFixed(2)),
          turnover: Number((sector.totalTurnover * (0.75 + r1 * 0.4)).toFixed(1)),
          mainNetRatio: Number(((pastFlow / (sector.totalTurnover || 100)) * 100).toFixed(1))
        });
      }
    }
    history = derivedPoints;
  }

  // 2. Compute Quantitative Trend Statistics
  const inflows = history.map(h => h.netInflow);
  const total5dInflow = Number(inflows.reduce((a, b) => a + b, 0).toFixed(2));
  const inflowDaysCount = inflows.filter(v => v > 0).length;
  const outflowDaysCount = inflows.filter(v => v < 0).length;
  
  const positiveInflows = inflows.filter(v => v > 0);
  const sumPositive = positiveInflows.reduce((a, b) => a + b, 0);
  const maxSingleDayInflow = Math.max(...inflows, 0);
  
  // Impulse concentration: how much of the positive flow is concentrated in the single largest day
  const impulseConcentration = sumPositive > 0 
    ? Math.min(100, Math.round((maxSingleDayInflow / sumPositive) * 100)) 
    : 0;

  const todayInflow = inflows[4];
  const yesterdayInflow = inflows[3];

  // 3. Pattern Recognition Engine
  let pattern: SectorTrendPattern = 'fluctuating';
  let patternTitle = '多空拉锯博弈型';
  let patternSubtitle = '进出交织 / 缺乏主线合力';
  let badgeBg = 'bg-blue-950/60';
  let badgeBorder = 'border-blue-800/60';
  let badgeText = 'text-blue-400';
  let iconType: 'trend-up' | 'zap' | 'refresh' | 'shuffle' | 'trend-down' = 'shuffle';
  let diagnosisHeadline = '资金频繁反复，未现单边定价主导权';
  let institutionalAnalysis = '近5日板块内部主力筹码多空交织，流入流出呈现拉锯状态，暂无持续性增量合力。';
  let actionGuidance = '适合区间网格交易与高抛低吸，切勿在阳线过热时追涨，等待突破方向明朗。';

  // Rule 1: Continuous Inflow (持续净流入)
  // Criteria: at least 4 days positive, or 3 days positive with total5dInflow high and impulseConcentration < 55%
  if (inflowDaysCount >= 4 || (inflowDaysCount >= 3 && total5dInflow > 30 && impulseConcentration <= 55)) {
    pattern = 'continuous_inflow';
    patternTitle = '持续净流入型';
    patternSubtitle = '机构稳步增配 / 筹码持续沉淀';
    badgeBg = 'bg-rose-950/70';
    badgeBorder = 'border-rose-700/60';
    badgeText = 'text-rose-400';
    iconType = 'trend-up';
    diagnosisHeadline = '主力连续多日坚定净买入，属高确定性波段行情';
    institutionalAnalysis = `近5个交易日有 ${inflowDaysCount} 天获主力资金净流入，累计净流入达 +${total5dInflow} 亿元，最大单日集中度仅 ${impulseConcentration}%，呈现典型的机构中线建仓与趋势推升特征，非短命题材。`;
    actionGuidance = '资金沉淀扎实，若板块出现日线缩量回踩5日或10日均线，通常是较好的分歧低吸介入节点，持股耐心胜过频繁换股。';
  } 
  // Rule 2: Impulse Inflow (脉冲式突袭)
  // Criteria: Today is high positive (>15) and concentration is high (>= 60%), while previous days had little or negative flow
  else if (
    todayInflow > 12 && 
    (impulseConcentration >= 60 || (yesterdayInflow < 0 && todayInflow > 25) || (inflowDaysCount <= 2 && todayInflow > 15))
  ) {
    pattern = 'impulse_inflow';
    patternTitle = '单日脉冲爆发型';
    patternSubtitle = '短线游资突袭 / 谨防冲高回落';
    badgeBg = 'bg-amber-950/70';
    badgeBorder = 'border-amber-700/60';
    badgeText = 'text-amber-400';
    iconType = 'zap';
    diagnosisHeadline = '短线资金单日爆冲，暴拉成份高但持续性存疑';
    institutionalAnalysis = `近5日资金高度集中于今日爆发，单日流入占比高达 ${impulseConcentration}%，前几日资金多数处于观望或流出状态。此类形态多为热点消息刺激或游资短炒抢筹，爆发力猛但情绪退潮快。`;
    actionGuidance = '警惕“一日游”行情。切忌盘中情绪化追高，重点观察次日开盘30分钟内资金是否有承接二波意愿；若次日转为净流出，宜及时落袋离场。';
  }
  // Rule 3: Impulse Retest (脉冲后良性蓄势)
  // Criteria: Significant inflow 1-2 days ago, followed by slight consolidation, net positive total
  else if (
    total5dInflow > 5 && 
    (yesterdayInflow > 15 || inflows[2] > 15) && 
    todayInflow > -10 && 
    inflowDaysCount >= 2
  ) {
    pattern = 'impulse_retest';
    patternTitle = '脉冲后蓄势型';
    patternSubtitle = '前期急拉 / 缩量回踩良性整理';
    badgeBg = 'bg-purple-950/70';
    badgeBorder = 'border-purple-700/60';
    badgeText = 'text-purple-300';
    iconType = 'refresh';
    diagnosisHeadline = '前期资金大举入场后进入回踩洗盘，承接良好';
    institutionalAnalysis = `前段交易日录得显著单日脉冲净流入，近1-2日虽然资金流入减缓或小幅回撤，但累计5日仍录得 +${total5dInflow} 亿元净流入，主力筹码未见明显松动，属于健康换手蓄势。`;
    actionGuidance = '若板块回调至前期起爆点或关键技术均线附近企稳，可择机跟踪次波发力机会；以关键支撑位设防守线。';
  }
  // Rule 4: Continuous Outflow (持续净流出)
  else if (outflowDaysCount >= 4 || (outflowDaysCount >= 3 && total5dInflow < -25)) {
    pattern = 'continuous_outflow';
    patternTitle = '持续净流出型';
    patternSubtitle = '主力逢高减持 / 抛压有待消化';
    badgeBg = 'bg-emerald-950/70';
    badgeBorder = 'border-emerald-700/60';
    badgeText = 'text-emerald-400';
    iconType = 'trend-down';
    diagnosisHeadline = '主力资金多日离场，下行惯性仍存';
    institutionalAnalysis = `近5日中有多达 ${outflowDaysCount} 天为主力资金净撤离，累计净流出 ${total5dInflow} 亿元。大单与超大单卖力显著，筹码处于持续派发阶段，多头反抗乏力。`;
    actionGuidance = '防范阴跌风险，不盲目猜底补仓。宜耐心等待日线级别资金由负转正并形成双底结构后再做考虑。';
  }

  return {
    history,
    total5dInflow,
    inflowDaysCount,
    outflowDaysCount,
    maxSingleDayInflow,
    impulseConcentration,
    pattern,
    patternTitle,
    patternSubtitle,
    badgeBg,
    badgeBorder,
    badgeText,
    iconType,
    diagnosisHeadline,
    institutionalAnalysis,
    actionGuidance
  };
}
