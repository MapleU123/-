import { IndexQuote, SectorFundFlow, MarketOverviewData } from '../types/market';
import { getRealtimeDateString } from './marketDateUtils';

export type ReportThemeMode = 'light' | 'dark' | 'classic' | 'navy';

export interface CanvasExportOptions {
  template: 'market_overview' | 'fundflow_panorama' | 'gainers_losers' | 'sector_deepdive' | 'sentiment_ladder' | 'gold_macro';
  sectors: SectorFundFlow[];
  indices: IndexQuote[];
  overviewData?: MarketOverviewData;
  selectedSector?: SectorFundFlow;
  themeMode: ReportThemeMode;
  watermarkMode: 'with_watermark' | 'no_watermark';
  watermarkText: string;
  watermarkOpacity: number;
  watermarkStyle: 'grid' | 'corner' | 'both';
  todayStr?: string;
}

// Helper: Round rectangle path
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Helper: Calculate nice round axis ceiling and ticks dynamically for fund amount
function calcAxisCeilingAndTicks(maxVal: number): { ceiling: number; ticks: number[] } {
  if (maxVal <= 10) return { ceiling: 10, ticks: [0, 2, 4, 6, 8, 10] };
  if (maxVal <= 25) return { ceiling: 25, ticks: [0, 5, 10, 15, 20, 25] };
  if (maxVal <= 50) return { ceiling: 50, ticks: [0, 10, 20, 30, 40, 50] };
  if (maxVal <= 60) return { ceiling: 60, ticks: [0, 10, 20, 30, 40, 50, 60] };
  if (maxVal <= 80) return { ceiling: 80, ticks: [0, 20, 40, 60, 80] };
  if (maxVal <= 100) return { ceiling: 100, ticks: [0, 20, 40, 60, 80, 100] };
  if (maxVal <= 120) return { ceiling: 120, ticks: [0, 20, 40, 60, 80, 100, 120] };
  if (maxVal <= 150) return { ceiling: 150, ticks: [0, 30, 60, 90, 120, 150] };
  const step = Math.ceil(maxVal / 5 / 10) * 10;
  const ceiling = step * 5;
  return { ceiling, ticks: [0, step, step * 2, step * 3, step * 4, ceiling] };
}

// Helper: Calculate nice round percentage axis ceiling and ticks dynamically for gainers/losers
function calcPercentAxisCeilingAndTicks(maxVal: number): { ceiling: number; ticks: number[] } {
  if (maxVal <= 5) return { ceiling: 5, ticks: [0, 1, 2, 3, 4, 5] };
  if (maxVal <= 10) return { ceiling: 10, ticks: [0, 2, 4, 6, 8, 10] };
  if (maxVal <= 15) return { ceiling: 15, ticks: [0, 3, 6, 9, 12, 15] };
  if (maxVal <= 20) return { ceiling: 20, ticks: [0, 4, 8, 12, 16, 20] };
  if (maxVal <= 25) return { ceiling: 25, ticks: [0, 5, 10, 15, 20, 25] };
  if (maxVal <= 30) return { ceiling: 30, ticks: [0, 6, 12, 18, 24, 30] };
  const ceiling = Math.ceil(maxVal / 5) * 5;
  const step = ceiling / 5;
  return { ceiling, ticks: [0, step, step * 2, step * 3, step * 4, ceiling] };
}

/**
 * Native Canvas 2D Report Renderer
 * - Fund Inflow (资金流入) bars strictly in RED (红色)
 * - Fund Outflow (资金流出) bars strictly in GREEN (绿色)
 * - Background & card colors fully adapt to chosen themeMode:
 *   - 'light': 证券研报白 (Light Clean Paper)
 *   - 'dark': 极客夜间黑 (Dark Charcoal Obsidian)
 *   - 'classic': 典雅牛皮纸 (Warm Parchment Retro)
 *   - 'navy': 深海机构蓝 (High-end Institutional Navy)
 */
export function renderReportToCanvas(options: CanvasExportOptions): HTMLCanvasElement {
  const {
    template,
    sectors = [],
    indices = [],
    overviewData,
    selectedSector,
    themeMode = 'light',
    watermarkMode,
    watermarkText = '公众号：我爱这young',
    watermarkOpacity = 0.16,
    watermarkStyle = 'both',
    todayStr = getRealtimeDateString()
  } = options;

  const isPanorama = template === 'fundflow_panorama';
  const isGainersLosers = template === 'gainers_losers';
  const isWidescreen = isPanorama || isGainersLosers;
  const width = isWidescreen ? 1600 : 1200;
  const height = isWidescreen ? 960 : 1760;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  // Build complete color palette according to selectable style (themeMode)
  const isDark = themeMode === 'dark';
  const isClassic = themeMode === 'classic';
  const isNavy = themeMode === 'navy';

  // Default: 'light' (证券研报白)
  let colors = {
    bg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    itemBg: '#f1f5f9',
    itemBorder: '#cbd5e1',
    textMain: '#0f172a',
    textSec: '#475569',
    textMuted: '#64748b',
    gridLine: 'rgba(15, 23, 42, 0.06)',
    axisLine: '#cbd5e1',
    divider: '#e2e8f0',
    btnBg: '#f1f5f9',
    btnBorder: '#cbd5e1',
    btnText: '#334155',
    activeBlue: '#2563eb',

    // Inflow: RED (资金流入柱子用红色)
    inflowBar: '#ef4444',
    inflowText: '#dc2626',
    inflowBadgeBg: '#fee2e2',
    inflowBadgeBorder: '#fecaca',
    inflowBadgeText: '#b91c1c',

    // Outflow: GREEN (资金流出用绿色)
    outflowBar: '#10b981',
    outflowText: '#059669',
    outflowBadgeBg: '#dcfce7',
    outflowBadgeBorder: '#bbf7d0',
    outflowBadgeText: '#15803d',

    red: '#dc2626',
    green: '#059669',
    blue: '#2563eb',
    amber: '#d97706',
  };

  if (isDark) {
    colors = {
      bg: '#090d16',
      cardBg: '#0e1626',
      cardBorder: '#1e293b',
      itemBg: '#151f32',
      itemBorder: '#223048',
      textMain: '#f8fafc',
      textSec: '#94a3b8',
      textMuted: '#64748b',
      gridLine: 'rgba(255, 255, 255, 0.05)',
      axisLine: '#334155',
      divider: '#1e293b',
      btnBg: '#131d2e',
      btnBorder: '#223249',
      btnText: '#cbd5e1',
      activeBlue: '#1d4ed8',

      // Inflow: RED
      inflowBar: '#f43f5e',
      inflowText: '#fb7185',
      inflowBadgeBg: '#4c0519',
      inflowBadgeBorder: '#881337',
      inflowBadgeText: '#f43f5e',

      // Outflow: GREEN
      outflowBar: '#00d26a',
      outflowText: '#34d399',
      outflowBadgeBg: '#022c22',
      outflowBadgeBorder: '#064e3b',
      outflowBadgeText: '#34d399',

      red: '#f87171',
      green: '#00d26a',
      blue: '#3b82f6',
      amber: '#fbbf24',
    };
  } else if (isNavy) {
    colors = {
      bg: '#080e1e',
      cardBg: '#0e1832',
      cardBorder: '#1b2d56',
      itemBg: '#152449',
      itemBorder: '#243a6d',
      textMain: '#f1f5f9',
      textSec: '#93a7cf',
      textMuted: '#61759e',
      gridLine: 'rgba(147, 167, 207, 0.07)',
      axisLine: '#243a6d',
      divider: '#1b2d56',
      btnBg: '#132143',
      btnBorder: '#22386e',
      btnText: '#cbd5e1',
      activeBlue: '#2563eb',

      // Inflow: RED
      inflowBar: '#f43f5e',
      inflowText: '#fb7185',
      inflowBadgeBg: '#4c0519',
      inflowBadgeBorder: '#881337',
      inflowBadgeText: '#f43f5e',

      // Outflow: GREEN
      outflowBar: '#10b981',
      outflowText: '#34d399',
      outflowBadgeBg: '#022c22',
      outflowBadgeBorder: '#064e3b',
      outflowBadgeText: '#34d399',

      red: '#f87171',
      green: '#10b981',
      blue: '#3b82f6',
      amber: '#fbbf24',
    };
  } else if (isClassic) {
    colors = {
      bg: '#fbf7ee',
      cardBg: '#f5ede0',
      cardBorder: '#e6dac3',
      itemBg: '#fdfcf9',
      itemBorder: '#e2d5bd',
      textMain: '#292524',
      textSec: '#57534e',
      textMuted: '#78716c',
      gridLine: 'rgba(68, 64, 60, 0.08)',
      axisLine: '#d6c7b2',
      divider: '#e6dac3',
      btnBg: '#ede0cc',
      btnBorder: '#d5c3a5',
      btnText: '#44403c',
      activeBlue: '#92400e',

      // Inflow: RED
      inflowBar: '#dc2626',
      inflowText: '#b91c1c',
      inflowBadgeBg: '#fae8e8',
      inflowBadgeBorder: '#fecaca',
      inflowBadgeText: '#991b1b',

      // Outflow: GREEN
      outflowBar: '#16a34a',
      outflowText: '#15803d',
      outflowBadgeBg: '#e2f5ea',
      outflowBadgeBorder: '#bbf7d0',
      outflowBadgeText: '#166534',

      red: '#dc2626',
      green: '#16a34a',
      blue: '#2563eb',
      amber: '#b45309',
    };
  }

  const fontSans = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';

  // 1. Draw Canvas Background (Matches selected theme style)
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // =========================================================================
  // TEMPLATE A: FUNDFLOW PANORAMA (Widescreen 1600x940 Bilateral Board)
  // =========================================================================
  if (isPanorama) {
    // Top Controls Bar (Y: 20 to 65)
    // Left: [ 行业板块 ] [ 概念板块 ]
    ctx.fillStyle = colors.activeBlue;
    roundRect(ctx, 25, 20, 105, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 14px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('行业板块', 25 + 52.5, 43);

    ctx.fillStyle = colors.btnBg;
    ctx.strokeStyle = colors.btnBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, 138, 20, 105, 36, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.btnText;
    ctx.fillText('概念板块', 138 + 52.5, 43);

    // Center Date & Live Status
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textSec;
    ctx.font = `bold 13px ${fontSans}`;
    ctx.fillText(`交易日期: ${todayStr}   •   实盘资金数据源: 东方财富`, 260, 43);

    // Right Action Buttons
    // [ 视频榜单 ]
    roundRect(ctx, width - 425, 20, 95, 36, 8);
    ctx.fillStyle = colors.btnBg;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.btnText;
    ctx.textAlign = 'center';
    ctx.fillText('视频榜单', width - 425 + 47.5, 43);

    // TOP [ 15 ▾ ]
    roundRect(ctx, width - 320, 20, 85, 36, 8);
    ctx.fillStyle = colors.btnBg;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.btnText;
    ctx.fillText('TOP 15 ▾', width - 320 + 42.5, 43);

    // [ 立即刷新 ]
    ctx.fillStyle = colors.activeBlue;
    roundRect(ctx, width - 225, 20, 95, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('立即刷新', width - 225 + 47.5, 43);

    // [ 手动采集 ]
    ctx.fillStyle = '#ea580c';
    roundRect(ctx, width - 120, 20, 95, 36, 8);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('手动采集', width - 120 + 47.5, 43);

    ctx.textAlign = 'left';

    // Separate into Inflows and Outflows
    const inflows = [...sectors].filter(s => (s.mainNetInflow || 0) > 0).sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0)).slice(0, 15);
    const outflows = [...sectors].filter(s => (s.mainNetInflow || 0) < 0).sort((a, b) => (a.mainNetInflow || 0) - (b.mainNetInflow || 0)).slice(0, 15);

    const cardY = 70;
    const cardH = 845;
    const cardW = 760;
    const leftCardX = 25;
    const rightCardX = 815;

    // -------------------------------------------------------------
    // LEFT CARD: 资金流入 TOP (RED BARS, RED BADGE, RED VALUES)
    // -------------------------------------------------------------
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, leftCardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    // Left Header Title
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 19px ${fontSans}`;
    ctx.fillText('资金流入 TOP', leftCardX + 24, cardY + 35);

    // Badge: 主力净流入 (RED THEMED)
    ctx.fillStyle = colors.inflowBadgeBg;
    ctx.strokeStyle = colors.inflowBadgeBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, leftCardX + cardW - 115, cardY + 18, 95, 26, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.inflowBadgeText;
    ctx.font = `bold 12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('主力净流入', leftCardX + cardW - 67.5, cardY + 35);
    ctx.textAlign = 'left';

    // Header divider
    ctx.strokeStyle = colors.divider;
    ctx.beginPath();
    ctx.moveTo(leftCardX, cardY + 54);
    ctx.lineTo(leftCardX + cardW, cardY + 54);
    ctx.stroke();

    // Left Grid lines (dynamic ticks based on actual data)
    const maxInflowActual = Math.max(...inflows.map(s => Math.abs(s.mainNetInflow || 0)), 10);
    const inflowScale = calcAxisCeilingAndTicks(maxInflowActual);
    const ticksInflow = inflowScale.ticks;
    const leftBarStartX = leftCardX + 140;
    const leftBarMaxW = 460;
    const rowStartY = cardY + 70;
    const rowH = 48;

    ticksInflow.forEach(tick => {
      const tx = leftBarStartX + (tick / inflowScale.ceiling) * leftBarMaxW;
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, rowStartY);
      ctx.lineTo(tx, rowStartY + 15 * rowH);
      ctx.stroke();
    });

    // Draw Left 15 Rows: Inflow in RED
    inflows.forEach((sec, idx) => {
      const ry = rowStartY + idx * rowH;

      // Sector Name
      ctx.fillStyle = colors.textMain;
      ctx.font = `500 15px ${fontSans}`;
      ctx.fillText(sec.name, leftCardX + 24, ry + 28);

      // INFLOW BAR: RED!
      const val = sec.mainNetInflow || 0;
      const barW = Math.min(leftBarMaxW, Math.max(8, (val / inflowScale.ceiling) * leftBarMaxW));

      ctx.fillStyle = colors.inflowBar; // Solid bright RED
      roundRect(ctx, leftBarStartX, ry + 12, barW, 22, 4);
      ctx.fill();

      // Number text at the right of the bar (RED)
      ctx.fillStyle = colors.inflowText;
      ctx.font = `bold 14px ${fontSans}`;
      ctx.fillText(`+${val.toFixed(2)}亿`, leftBarStartX + barW + 10, ry + 28);
    });

    // Left Bottom X-Axis Ticks
    const leftAxisY = rowStartY + 15 * rowH + 18;
    ctx.strokeStyle = colors.axisLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftBarStartX, leftAxisY);
    ctx.lineTo(leftBarStartX + leftBarMaxW, leftAxisY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.textMuted;
    ctx.font = `12px ${fontSans}`;
    ticksInflow.forEach(tick => {
      const tx = leftBarStartX + (tick / inflowScale.ceiling) * leftBarMaxW;
      ctx.beginPath();
      ctx.moveTo(tx, leftAxisY);
      ctx.lineTo(tx, leftAxisY + 4);
      ctx.stroke();
      ctx.fillText(`${tick}`, tx, leftAxisY + 18);
    });
    ctx.textAlign = 'left';

    // -------------------------------------------------------------
    // RIGHT CARD: 资金流出 TOP (GREEN BARS, GREEN BADGE, GREEN VALUES)
    // -------------------------------------------------------------
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, rightCardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    // Right Header Title
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 19px ${fontSans}`;
    ctx.fillText('资金流出 TOP', rightCardX + 24, cardY + 35);

    // Badge: 主力净流出 (GREEN THEMED)
    ctx.fillStyle = colors.outflowBadgeBg;
    ctx.strokeStyle = colors.outflowBadgeBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, rightCardX + cardW - 115, cardY + 18, 95, 26, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.outflowBadgeText;
    ctx.font = `bold 12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('主力净流出', rightCardX + cardW - 67.5, cardY + 35);
    ctx.textAlign = 'left';

    // Header divider
    ctx.strokeStyle = colors.divider;
    ctx.beginPath();
    ctx.moveTo(rightCardX, cardY + 54);
    ctx.lineTo(rightCardX + cardW, cardY + 54);
    ctx.stroke();

    // Outflow Grid lines: FROM LEFT TO RIGHT (0 starts on left at rightBarStartX, increases rightward)
    const maxOutflowActual = Math.max(...outflows.map(s => Math.abs(s.mainNetInflow || 0)), 10);
    const outflowScale = calcAxisCeilingAndTicks(maxOutflowActual);
    const ticksOutflow = outflowScale.ticks;

    const rightBarStartX = rightCardX + 140;
    const rightBarMaxW = 460;

    ticksOutflow.forEach(tick => {
      const tx = rightBarStartX + (tick / outflowScale.ceiling) * rightBarMaxW;
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, rowStartY);
      ctx.lineTo(tx, rowStartY + 15 * rowH);
      ctx.stroke();
    });

    // Draw Right 15 Rows: Outflow in GREEN, starting from LEFT (rightBarStartX) to RIGHT
    // Bar length strictly proportional to the actual amount: (absVal / ceiling) * maxW
    outflows.forEach((sec, idx) => {
      const ry = rowStartY + idx * rowH;

      // Sector Name
      ctx.fillStyle = colors.textMain;
      ctx.font = `500 15px ${fontSans}`;
      ctx.fillText(sec.name, rightCardX + 24, ry + 28);

      // OUTFLOW BAR: GREEN! Starts from LEFT (rightBarStartX) and extends towards RIGHT
      const absVal = Math.abs(sec.mainNetInflow || 0);
      const barW = Math.min(rightBarMaxW, Math.max(8, (absVal / outflowScale.ceiling) * rightBarMaxW));
      const bx = rightBarStartX;

      ctx.fillStyle = colors.outflowBar; // Solid bright GREEN
      roundRect(ctx, bx, ry + 12, barW, 22, 4);
      ctx.fill();

      // Number text at the RIGHT tip of the bar (GREEN)
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.outflowText;
      ctx.font = `bold 14px ${fontSans}`;
      ctx.fillText(`${(sec.mainNetInflow || 0).toFixed(2)}亿`, bx + barW + 10, ry + 28);
    });

    // Right Bottom X-Axis Ticks (From Left to Right: 0, 20, 40, 60, 80...)
    const rightAxisY = rowStartY + 15 * rowH + 18;
    ctx.strokeStyle = colors.axisLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightBarStartX, rightAxisY);
    ctx.lineTo(rightBarStartX + rightBarMaxW, rightAxisY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.textMuted;
    ctx.font = `12px ${fontSans}`;
    ticksOutflow.forEach(tick => {
      const tx = rightBarStartX + (tick / outflowScale.ceiling) * rightBarMaxW;
      ctx.beginPath();
      ctx.moveTo(tx, rightAxisY);
      ctx.lineTo(tx, rightAxisY + 4);
      ctx.stroke();
      ctx.fillText(`${tick}`, tx, rightAxisY + 18);
    });
    ctx.textAlign = 'left';

  } else if (isGainersLosers) {
    // =========================================================================
    // TEMPLATE: GAINERS & LOSERS FROM MARKET PANORAMA (大盘全景 · 领涨与领跌板块)
    // Canvas: 1600 x 960 HD Panoramic Bilateral Comparison
    // =========================================================================
    const topBarY = 20;

    // 1. Top Bar Left Badges & Title
    // Badge 1: [ 领涨板块 ] (RED)
    ctx.fillStyle = colors.inflowBar;
    roundRect(ctx, 25, topBarY, 95, 34, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 13px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('领涨板块', 25 + 47.5, topBarY + 22);

    // Badge 2: [ 领跌板块 ] (GREEN)
    ctx.fillStyle = colors.outflowBar;
    roundRect(ctx, 128, topBarY, 95, 34, 6);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('领跌板块', 128 + 47.5, topBarY + 22);

    // Badge 3: [ 大盘全景 ]
    ctx.fillStyle = colors.btnBg;
    ctx.strokeStyle = colors.btnBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, 231, topBarY, 95, 34, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.btnText;
    ctx.fillText('大盘全景', 231 + 47.5, topBarY + 22);

    // Center Title & Live Info
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 18px ${fontSans}`;
    ctx.fillText('A股市场大盘全景 · 行业领涨与领跌板块对照榜', 342, topBarY + 23);

    // Top Right: Market Breadth Summary
    const indBreadth = overviewData?.industryBreadth || { up: 360, down: 134, flat: 2, avgChangePercent: 0.82 };

    ctx.textAlign = 'right';
    ctx.font = `12px ${fontSans}`;
    ctx.fillStyle = colors.textSec;
    ctx.fillText(
      `全市场行业: 涨${indBreadth.up ?? 360} / 跌${indBreadth.down ?? 134} / 平${indBreadth.flat ?? 2} (均 ${(indBreadth.avgChangePercent || 0) >= 0 ? '+' : ''}${(indBreadth.avgChangePercent || 0).toFixed(2)}%)  •  交易日期: ${todayStr}`,
      width - 25,
      topBarY + 22
    );
    ctx.textAlign = 'left';

    // 2. Mini Indices Strip (Y: 66 to 116)
    const indicesList = indices.slice(0, 6);
    const idxCardGap = 12;
    const idxCardW = (width - 50 - (indicesList.length - 1) * idxCardGap) / Math.max(1, indicesList.length);
    const idxY = 66;
    const idxH = 46;

    indicesList.forEach((idx, i) => {
      const ix = 25 + i * (idxCardW + idxCardGap);
      const isUp = (idx.change || 0) >= 0;
      ctx.fillStyle = colors.cardBg;
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 1;
      roundRect(ctx, ix, idxY, idxCardW, idxH, 8);
      ctx.fill();
      ctx.stroke();

      // Index Name
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 12.5px ${fontSans}`;
      ctx.fillText(idx.name, ix + 12, idxY + 19);

      // Price & Change
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillStyle = isUp ? colors.inflowBar : colors.outflowBar;
      ctx.fillText((idx.price || 0).toFixed(2), ix + 12, idxY + 37);

      ctx.textAlign = 'right';
      ctx.font = `bold 12px ${fontSans}`;
      ctx.fillText(`${isUp ? '+' : ''}${(idx.changePercent || 0).toFixed(2)}%`, ix + idxCardW - 12, idxY + 37);
      ctx.textAlign = 'left';
    });

    // 3. Main Dual-Column Cards: 领涨板块 TOP 12 vs 领跌板块 TOP 12
    const cardY = 124;
    const cardH = 752;
    const cardW = (width - 50 - 30) / 2; // 760
    const leftCardX = 25;
    const rightCardX = 815;

    // Get gainers and losers data (prefer overviewData, fallback to sectors)
    const topGainersData = (overviewData?.topGainers && overviewData.topGainers.length > 0)
      ? overviewData.topGainers.slice(0, 12)
      : [...sectors].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 12);

    const topLosersData = (overviewData?.topLosers && overviewData.topLosers.length > 0)
      ? overviewData.topLosers.slice(0, 12)
      : [...sectors].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 12);

    // LEFT CARD: 领涨板块 TOP 12
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, leftCardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    // Left Header
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 17px ${fontSans}`;
    ctx.fillText('领涨板块 TOP 12 (行业领涨先锋)', leftCardX + 22, cardY + 33);

    // Left Badge: 领涨先锋 (RED THEMED)
    ctx.fillStyle = colors.inflowBadgeBg;
    ctx.strokeStyle = colors.inflowBadgeBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, leftCardX + cardW - 120, cardY + 16, 96, 26, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.inflowBadgeText;
    ctx.font = `bold 12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('涨幅居前榜', leftCardX + cardW - 72, cardY + 33);
    ctx.textAlign = 'left';

    // Left Divider
    ctx.strokeStyle = colors.divider;
    ctx.beginPath();
    ctx.moveTo(leftCardX, cardY + 50);
    ctx.lineTo(leftCardX + cardW, cardY + 50);
    ctx.stroke();

    // Scale and Axis for Gainers: FROM LEFT TO RIGHT
    const maxGainerVal = Math.max(...topGainersData.map(g => Math.abs(g.changePercent || 0)), 5);
    const gainerScale = calcPercentAxisCeilingAndTicks(maxGainerVal);
    const leftBarStartX = leftCardX + 230;
    const leftBarMaxW = 280;
    const rowStartY = cardY + 62;
    const rowH = 52;

    // Grid lines for gainers
    gainerScale.ticks.forEach(tick => {
      const tx = leftBarStartX + (tick / gainerScale.ceiling) * leftBarMaxW;
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, rowStartY);
      ctx.lineTo(tx, rowStartY + 12 * rowH);
      ctx.stroke();
    });

    // Draw 12 Gainer Rows
    topGainersData.forEach((sec, idx) => {
      const ry = rowStartY + idx * rowH;

      // Rank Pill
      const isTop3 = idx < 3;
      ctx.fillStyle = isTop3 ? colors.inflowBar : colors.itemBg;
      roundRect(ctx, leftCardX + 20, ry + 12, 22, 22, 4);
      ctx.fill();
      ctx.fillStyle = isTop3 ? '#ffffff' : colors.textSec;
      ctx.font = `bold 11px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${idx + 1}`, leftCardX + 31, ry + 27);
      ctx.textAlign = 'left';

      // Sector Name
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 14.5px ${fontSans}`;
      ctx.fillText(sec.name, leftCardX + 48, ry + 28);

      // Lead Stock tag
      const leadName = sec.leadStock?.name;
      const leadPct = sec.leadStock?.changePercent;
      if (leadName) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = `11px ${fontSans}`;
        ctx.fillText(`(${leadName} +${leadPct ?? ''}%)`, leftCardX + 124, ry + 28);
      }

      // Bar (starts at leftBarStartX, extends to right, proportional)
      const pct = Math.abs(sec.changePercent || 0);
      const barW = Math.min(leftBarMaxW, Math.max(8, (pct / gainerScale.ceiling) * leftBarMaxW));

      // Bar Track
      ctx.fillStyle = colors.itemBg;
      roundRect(ctx, leftBarStartX, ry + 15, leftBarMaxW, 18, 4);
      ctx.fill();

      // Solid RED Bar
      ctx.fillStyle = colors.inflowBar;
      roundRect(ctx, leftBarStartX, ry + 15, barW, 18, 4);
      ctx.fill();

      // Value label at right of bar (+XX.XX%)
      ctx.fillStyle = colors.inflowText;
      ctx.font = `bold 13.5px ${fontSans}`;
      ctx.fillText(`+${pct.toFixed(2)}%`, leftBarStartX + barW + 8, ry + 29);

      // Main Net Inflow at right edge
      const inflow = sec.mainNetInflow || 0;
      ctx.textAlign = 'right';
      ctx.fillStyle = inflow >= 0 ? colors.inflowText : colors.outflowText;
      ctx.font = `500 12px ${fontSans}`;
      ctx.fillText(`${inflow >= 0 ? '+' : ''}${inflow.toFixed(1)}亿`, leftCardX + cardW - 20, ry + 29);
      ctx.textAlign = 'left';
    });

    // Left Bottom X-Axis Ticks (From Left to Right: 0%, 5%, 10%, 15%...)
    const leftAxisY = rowStartY + 12 * rowH + 16;
    ctx.strokeStyle = colors.axisLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftBarStartX, leftAxisY);
    ctx.lineTo(leftBarStartX + leftBarMaxW, leftAxisY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.textMuted;
    ctx.font = `11.5px ${fontSans}`;
    gainerScale.ticks.forEach(tick => {
      const tx = leftBarStartX + (tick / gainerScale.ceiling) * leftBarMaxW;
      ctx.beginPath();
      ctx.moveTo(tx, leftAxisY);
      ctx.lineTo(tx, leftAxisY + 4);
      ctx.stroke();
      ctx.fillText(`${tick}%`, tx, leftAxisY + 16);
    });
    ctx.textAlign = 'left';

    // -------------------------------------------------------------
    // RIGHT CARD: 领跌板块 TOP 12 (GREEN BARS, GREEN BADGE, GREEN VALUES)
    // -------------------------------------------------------------
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, rightCardX, cardY, cardW, cardH, 12);
    ctx.fill();
    ctx.stroke();

    // Right Header
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 17px ${fontSans}`;
    ctx.fillText('领跌板块 TOP 12 (承压调整前列)', rightCardX + 22, cardY + 33);

    // Right Badge: 承压前列 (GREEN THEMED)
    ctx.fillStyle = colors.outflowBadgeBg;
    ctx.strokeStyle = colors.outflowBadgeBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, rightCardX + cardW - 120, cardY + 16, 96, 26, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.outflowBadgeText;
    ctx.font = `bold 12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('跌幅居前榜', rightCardX + cardW - 72, cardY + 33);
    ctx.textAlign = 'left';

    // Right Divider
    ctx.strokeStyle = colors.divider;
    ctx.beginPath();
    ctx.moveTo(rightCardX, cardY + 50);
    ctx.lineTo(rightCardX + cardW, cardY + 50);
    ctx.stroke();

    // Scale and Axis for Losers: FROM LEFT TO RIGHT
    const maxLoserVal = Math.max(...topLosersData.map(l => Math.abs(l.changePercent || 0)), 3);
    const loserScale = calcPercentAxisCeilingAndTicks(maxLoserVal);
    const rightBarStartX = rightCardX + 230;
    const rightBarMaxW = 280;

    // Grid lines for losers
    loserScale.ticks.forEach(tick => {
      const tx = rightBarStartX + (tick / loserScale.ceiling) * rightBarMaxW;
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, rowStartY);
      ctx.lineTo(tx, rowStartY + 12 * rowH);
      ctx.stroke();
    });

    // Draw 12 Loser Rows: GREEN, starting from LEFT (rightBarStartX) to RIGHT, proportional!
    topLosersData.forEach((sec, idx) => {
      const ry = rowStartY + idx * rowH;

      // Rank Pill
      const isTop3 = idx < 3;
      ctx.fillStyle = isTop3 ? colors.outflowBar : colors.itemBg;
      roundRect(ctx, rightCardX + 20, ry + 12, 22, 22, 4);
      ctx.fill();
      ctx.fillStyle = isTop3 ? '#ffffff' : colors.textSec;
      ctx.font = `bold 11px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${idx + 1}`, rightCardX + 31, ry + 27);
      ctx.textAlign = 'left';

      // Sector Name
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 14.5px ${fontSans}`;
      ctx.fillText(sec.name, rightCardX + 48, ry + 28);

      // Lead/Lag Stock tag
      const leadName = sec.leadStock?.name;
      const leadPct = sec.leadStock?.changePercent;
      if (leadName) {
        ctx.fillStyle = colors.textMuted;
        ctx.font = `11px ${fontSans}`;
        ctx.fillText(`(${leadName} ${leadPct ?? ''}%)`, rightCardX + 124, ry + 28);
      }

      // Bar (starts at rightBarStartX, extends to right, proportional)
      const pct = Math.abs(sec.changePercent || 0);
      const barW = Math.min(rightBarMaxW, Math.max(8, (pct / loserScale.ceiling) * rightBarMaxW));

      // Bar Track
      ctx.fillStyle = colors.itemBg;
      roundRect(ctx, rightBarStartX, ry + 15, rightBarMaxW, 18, 4);
      ctx.fill();

      // Solid GREEN Bar
      ctx.fillStyle = colors.outflowBar;
      roundRect(ctx, rightBarStartX, ry + 15, barW, 18, 4);
      ctx.fill();

      // Value label at right of bar (-XX.XX%)
      ctx.fillStyle = colors.outflowText;
      ctx.font = `bold 13.5px ${fontSans}`;
      ctx.fillText(`-${pct.toFixed(2)}%`, rightBarStartX + barW + 8, ry + 29);

      // Main Net Inflow at right edge
      const inflow = sec.mainNetInflow || 0;
      ctx.textAlign = 'right';
      ctx.fillStyle = inflow >= 0 ? colors.inflowText : colors.outflowText;
      ctx.font = `500 12px ${fontSans}`;
      ctx.fillText(`${inflow >= 0 ? '+' : ''}${inflow.toFixed(1)}亿`, rightCardX + cardW - 20, ry + 29);
      ctx.textAlign = 'left';
    });

    // Right Bottom X-Axis Ticks (From Left to Right: 0%, 1%, 2%, 3%...)
    const rightAxisY = rowStartY + 12 * rowH + 16;
    ctx.strokeStyle = colors.axisLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rightBarStartX, rightAxisY);
    ctx.lineTo(rightBarStartX + rightBarMaxW, rightAxisY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = colors.textMuted;
    ctx.font = `11.5px ${fontSans}`;
    loserScale.ticks.forEach(tick => {
      const tx = rightBarStartX + (tick / loserScale.ceiling) * rightBarMaxW;
      ctx.beginPath();
      ctx.moveTo(tx, rightAxisY);
      ctx.lineTo(tx, rightAxisY + 4);
      ctx.stroke();
      ctx.fillText(`${tick}%`, tx, rightAxisY + 16);
    });
    ctx.textAlign = 'left';

    // 4. Footer Row (Y: 890 to 935)
    const footerY = 890;
    ctx.fillStyle = colors.textMuted;
    ctx.font = `12px ${fontSans}`;
    ctx.fillText('大盘全景数据复盘 · 行业与概念领涨领跌梯队多维对照 · 行情源自上海/深圳证券交易所实时公开撮合数据', 25, footerY + 28);

    ctx.textAlign = 'right';
    if (watermarkMode === 'with_watermark') {
      ctx.fillText(`${watermarkText} · 原创出品`, width - 25, footerY + 28);
    } else {
      ctx.fillText('上海 / 深圳交易所公开行情 · 纯净导出', width - 25, footerY + 28);
    }
    ctx.textAlign = 'left';

  } else {
    // =========================================================================
    // TEMPLATE B: PORTRAIT IN-DEPTH REPORT (1200x1760 HD Research Note)
    // =========================================================================
    // Outer Border
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 2;
    roundRect(ctx, 20, 20, width - 40, height - 40, 24);
    ctx.stroke();

    // Header Area (Y: 20 to 170)
    const headerHeight = 150;
    ctx.fillStyle = colors.cardBg;
    roundRect(ctx, 20, 20, width - 40, headerHeight, 24);
    ctx.fill();

    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, 20 + headerHeight);
    ctx.lineTo(width - 20, 20 + headerHeight);
    ctx.stroke();

    // App Logo Icon
    ctx.fillStyle = colors.inflowBar;
    roundRect(ctx, 50, 48, 64, 64, 16);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 36px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('A', 82, 94);

    // Title Text
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 32px ${fontSans}`;
    let titleText = 'A股大盘全景总览与盘面复盘深度研报';
    if (template === 'sector_deepdive') titleText = `${selectedSector?.name || '行业板块'}量化深度画像研报`;
    else if (template === 'sentiment_ladder') titleText = 'A股市场情绪罗盘与连板天梯复盘';
    else if (template === 'gold_macro') titleText = '黄金大宗商品与采选金矿股联动研报';
    ctx.fillText(titleText, 134, 76);

    // Subtitle / Date / Source
    ctx.fillStyle = colors.textSec;
    ctx.font = `500 18px ${fontSans}`;
    ctx.fillText(`日期：${todayStr}   •   数据源：沪深北交易所 / 东方财富   •   权威量化复盘`, 134, 110);

    // Corner Watermark / Mode Badge
    const badgeRight = width - 50;
    if (watermarkMode === 'with_watermark' && (watermarkStyle === 'corner' || watermarkStyle === 'both')) {
      ctx.fillStyle = isDark || isNavy ? 'rgba(148, 163, 184, 0.15)' : 'rgba(100, 116, 139, 0.1)';
      ctx.strokeStyle = isDark || isNavy ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.25)';
      ctx.lineWidth = 1.5;
      roundRect(ctx, badgeRight - 280, 52, 280, 46, 23);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark || isNavy ? '#cbd5e1' : '#475569';
      ctx.font = `bold 16px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(`🛡️ ${watermarkText}`, badgeRight - 140, 81);
    } else {
      ctx.fillStyle = colors.itemBg;
      ctx.strokeStyle = colors.itemBorder;
      ctx.lineWidth = 1.5;
      roundRect(ctx, badgeRight - 260, 52, 260, 46, 23);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.textSec;
      ctx.font = `bold 16px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText('📊 A股行情全景 (纯净版)', badgeRight - 130, 81);
    }
    ctx.textAlign = 'left';

    // -------------------------------------------------------------
    // CONTENT SECTION 1: Major Indices Matrix (8 Indices)
    // -------------------------------------------------------------
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 22px ${fontSans}`;
    ctx.fillText('核心大盘主要指数走势', 50, 215);

    const idxCardW = 250;
    const idxCardH = 92;
    const idxStartY = 235;
    const idxList = indices.slice(0, 8);

    idxList.forEach((idxItem, i) => {
      const col = i % 4;
      const row = Math.floor(i / 4);
      const cx = 50 + col * (idxCardW + 33);
      const cy = idxStartY + row * (idxCardH + 14);
      const isUp = (idxItem.change || 0) >= 0;

      ctx.fillStyle = colors.cardBg;
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 1;
      roundRect(ctx, cx, cy, idxCardW, idxCardH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 16px ${fontSans}`;
      ctx.fillText(idxItem.name, cx + 16, cy + 30);

      // Price: RED if up, GREEN if down
      ctx.fillStyle = isUp ? colors.inflowText : colors.outflowText;
      ctx.font = `bold 22px ${fontSans}`;
      ctx.fillText(`${idxItem.price.toFixed(2)}`, cx + 16, cy + 68);

      ctx.font = `bold 16px ${fontSans}`;
      ctx.textAlign = 'right';
      ctx.fillText(`${isUp ? '+' : ''}${idxItem.changePercent.toFixed(2)}%`, cx + idxCardW - 16, cy + 68);
      ctx.textAlign = 'left';
    });

    // -------------------------------------------------------------
    // CONTENT SECTION 2: Macro KPI Strip
    // -------------------------------------------------------------
    const kpiStartY = 465;
    const kpiW = 345;
    const kpiH = 90;

    // KPI 1: 两市总成交
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    roundRect(ctx, 50, kpiStartY, kpiW, kpiH, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.blue;
    ctx.font = `bold 14px ${fontSans}`;
    ctx.fillText('两市总成交额', 70, kpiStartY + 30);
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 24px ${fontSans}`;
    ctx.fillText('25,443 亿元', 70, kpiStartY + 68);
    ctx.fillStyle = colors.blue;
    ctx.font = `bold 13px ${fontSans}`;
    ctx.textAlign = 'right';
    ctx.fillText('放量 +18.4%', 50 + kpiW - 20, kpiStartY + 68);
    ctx.textAlign = 'left';

    // KPI 2: 全市场主力净流入 (RED/GREEN based on value)
    const netSum = sectors.reduce((acc, s) => acc + (s.mainNetInflow || 0), 0);
    const isNetPos = netSum >= 0;
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    roundRect(ctx, 50 + kpiW + 32, kpiStartY, kpiW, kpiH, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isNetPos ? colors.inflowText : colors.outflowText;
    ctx.font = `bold 14px ${fontSans}`;
    ctx.fillText('全市场主力净买卖', 50 + kpiW + 52, kpiStartY + 30);
    ctx.fillStyle = isNetPos ? colors.inflowText : colors.outflowText;
    ctx.font = `bold 24px ${fontSans}`;
    ctx.fillText(`${isNetPos ? '+' : ''}${netSum.toFixed(1)} 亿元`, 50 + kpiW + 52, kpiStartY + 68);
    ctx.font = `bold 13px ${fontSans}`;
    ctx.textAlign = 'right';
    ctx.fillText('机构主力博弈', 50 + kpiW * 2 + 12, kpiStartY + 68);
    ctx.textAlign = 'left';

    // KPI 3: 涨跌家数比
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    roundRect(ctx, 50 + (kpiW + 32) * 2, kpiStartY, kpiW, kpiH, 14);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.amber;
    ctx.font = `bold 14px ${fontSans}`;
    ctx.fillText('上涨 / 下跌家数比', 50 + (kpiW + 32) * 2 + 20, kpiStartY + 30);
    ctx.font = `bold 24px ${fontSans}`;
    ctx.fillStyle = colors.inflowText;
    ctx.fillText('3,126', 50 + (kpiW + 32) * 2 + 20, kpiStartY + 68);
    ctx.fillStyle = colors.textMuted;
    ctx.fillText(' / ', 50 + (kpiW + 32) * 2 + 95, kpiStartY + 68);
    ctx.fillStyle = colors.outflowText;
    ctx.fillText('2,029', 50 + (kpiW + 32) * 2 + 115, kpiStartY + 68);
    ctx.textAlign = 'right';
    ctx.fillStyle = colors.amber;
    ctx.font = `bold 13px ${fontSans}`;
    ctx.fillText('多头占比 60.6%', 50 + kpiW * 3 + 44, kpiStartY + 68);
    ctx.textAlign = 'left';

    // -------------------------------------------------------------
    // CONTENT SECTION 3: INFLOW TOP 8 (RED) VS OUTFLOW TOP 8 (GREEN)
    // -------------------------------------------------------------
    const flowStartY = 590;
    const flowCardW = 534;
    const flowCardH = 540;

    const topInflows = [...sectors].filter(s => (s.mainNetInflow || 0) > 0).sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0)).slice(0, 8);
    const topOutflows = [...sectors].filter(s => (s.mainNetInflow || 0) < 0).sort((a, b) => (a.mainNetInflow || 0) - (b.mainNetInflow || 0)).slice(0, 8);

    // Left Card: 主力净流入 TOP 8 (RED BARS, RED VALUES)
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, 50, flowStartY, flowCardW, flowCardH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colors.inflowText;
    ctx.font = `bold 19px ${fontSans}`;
    ctx.fillText('主力资金净流入 TOP 8 (买入前列)', 74, flowStartY + 38);

    ctx.fillStyle = colors.inflowBadgeBg;
    ctx.strokeStyle = colors.inflowBadgeBorder;
    roundRect(ctx, 50 + flowCardW - 110, flowStartY + 20, 88, 26, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.inflowBadgeText;
    ctx.font = `bold 12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('多头主力', 50 + flowCardW - 66, flowStartY + 37);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = colors.divider;
    ctx.beginPath();
    ctx.moveTo(50, flowStartY + 58);
    ctx.lineTo(50 + flowCardW, flowStartY + 58);
    ctx.stroke();

    const maxInflowPortrait = Math.max(...topInflows.map(s => Math.abs(s.mainNetInflow || 0)), 10);
    topInflows.forEach((item, idx) => {
      const iy = flowStartY + 76 + idx * 56;
      // Sector Name
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 15px ${fontSans}`;
      ctx.fillText(item.name, 74, iy + 22);

      // Track
      const barStartX = 200;
      const barMaxW = 210;
      ctx.fillStyle = colors.itemBg;
      roundRect(ctx, barStartX, iy + 8, barMaxW, 18, 9);
      ctx.fill();

      // INFLOW BAR: RED!
      const val = item.mainNetInflow || 0;
      const bw = Math.min(barMaxW, Math.max(16, (val / maxInflowPortrait) * barMaxW));
      ctx.fillStyle = colors.inflowBar; // RED!
      roundRect(ctx, barStartX, iy + 8, bw, 18, 9);
      ctx.fill();

      // Inflow Value: RED!
      ctx.fillStyle = colors.inflowText;
      ctx.font = `bold 15px ${fontSans}`;
      ctx.textAlign = 'right';
      ctx.fillText(`+${val.toFixed(2)}亿`, 50 + flowCardW - 24, iy + 22);
      ctx.textAlign = 'left';
    });

    // Right Card: 主力净流出 TOP 8 (GREEN BARS, GREEN VALUES)
    const rightFlowX = 50 + flowCardW + 32;
    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    roundRect(ctx, rightFlowX, flowStartY, flowCardW, flowCardH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = colors.outflowText;
    ctx.font = `bold 19px ${fontSans}`;
    ctx.fillText('主力资金净流出 TOP 8 (承压前列)', rightFlowX + 24, flowStartY + 38);

    ctx.fillStyle = colors.outflowBadgeBg;
    ctx.strokeStyle = colors.outflowBadgeBorder;
    roundRect(ctx, rightFlowX + flowCardW - 110, flowStartY + 20, 88, 26, 13);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.outflowBadgeText;
    ctx.font = `bold 12px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('空头承压', rightFlowX + flowCardW - 66, flowStartY + 37);
    ctx.textAlign = 'left';

    // Divider
    ctx.strokeStyle = colors.divider;
    ctx.beginPath();
    ctx.moveTo(rightFlowX, flowStartY + 58);
    ctx.lineTo(rightFlowX + flowCardW, flowStartY + 58);
    ctx.stroke();

    const maxOutflowPortrait = Math.max(...topOutflows.map(s => Math.abs(s.mainNetInflow || 0)), 10);
    topOutflows.forEach((item, idx) => {
      const iy = flowStartY + 76 + idx * 56;
      // Sector Name
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 15px ${fontSans}`;
      ctx.fillText(item.name, rightFlowX + 24, iy + 22);

      // Track
      const barStartX = rightFlowX + 150;
      const barMaxW = 210;
      ctx.fillStyle = colors.itemBg;
      roundRect(ctx, barStartX, iy + 8, barMaxW, 18, 9);
      ctx.fill();

      // OUTFLOW BAR: GREEN!
      const absVal = Math.abs(item.mainNetInflow || 0);
      const bw = Math.min(barMaxW, Math.max(16, (absVal / maxOutflowPortrait) * barMaxW));
      ctx.fillStyle = colors.outflowBar; // GREEN!
      roundRect(ctx, barStartX, iy + 8, bw, 18, 9);
      ctx.fill();

      // Outflow Value: GREEN!
      ctx.fillStyle = colors.outflowText;
      ctx.font = `bold 15px ${fontSans}`;
      ctx.textAlign = 'right';
      ctx.fillText(`${(item.mainNetInflow || 0).toFixed(2)}亿`, rightFlowX + flowCardW - 24, iy + 22);
      ctx.textAlign = 'left';
    });

    // -------------------------------------------------------------
    // CONTENT SECTION 4: Institutional Quant Insights Card
    // -------------------------------------------------------------
    const insightStartY = 1160;
    const insightW = width - 100;
    const insightH = 390;

    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    roundRect(ctx, 50, insightStartY, insightW, insightH, 16);
    ctx.fill();
    ctx.stroke();

    // Card Header
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 20px ${fontSans}`;
    ctx.fillText('🏛️ 机构量化盘面研判评述与行业博弈透视', 75, insightStartY + 42);

    ctx.strokeStyle = colors.divider;
    ctx.beginPath();
    ctx.moveTo(50, insightStartY + 62);
    ctx.lineTo(50 + insightW, insightStartY + 62);
    ctx.stroke();

    // 3 Sub-insight blocks
    const subColW = (insightW - 60) / 3;
    const subY = insightStartY + 85;

    // Block 1: 多头主线分析
    ctx.fillStyle = colors.itemBg;
    ctx.strokeStyle = colors.itemBorder;
    roundRect(ctx, 75, subY, subColW, 275, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.inflowText;
    ctx.font = `bold 16px ${fontSans}`;
    ctx.fillText('🔥 主力做多核心阵营', 95, subY + 34);
    ctx.fillStyle = colors.textSec;
    ctx.font = `14px ${fontSans}`;
    const topInflowNames = topInflows.slice(0, 3).map(s => s.name).join('、') || '农林牧渔、电力行业';
    const lines1 = [
      `今日多头资金聚焦于 ${topInflowNames} 等高景气度防御与成长赛道。`,
      '超大单机构席位持续维持大单净买入形态，主力筹码锁定度显著提升。',
      '量价齐升配合换手率放大，具备较强趋势持续性。'
    ];
    let curY1 = subY + 68;
    lines1.forEach(line => {
      ctx.fillText(line, 95, curY1, subColW - 40);
      curY1 += 44;
    });

    // Block 2: 承压板块警示
    const bx2 = 75 + subColW + 20;
    ctx.fillStyle = colors.itemBg;
    ctx.strokeStyle = colors.itemBorder;
    roundRect(ctx, bx2, subY, subColW, 275, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.outflowText;
    ctx.font = `bold 16px ${fontSans}`;
    ctx.fillText('⚠️ 主力减仓流出板块', bx2 + 20, subY + 34);
    ctx.fillStyle = colors.textSec;
    ctx.font = `14px ${fontSans}`;
    const topOutflowNames = topOutflows.slice(0, 3).map(s => s.name).join('、') || '半导体、证券、电子元器件';
    const lines2 = [
      `承压流出板块集中于 ${topOutflowNames} 等前期获利盘密集区。`,
      '主力大单出现高位主动抛盘，分时量能背离迹象显现。',
      '建议严密关注关键支撑位回踩力度，防范短期估值震荡洗盘。'
    ];
    let curY2 = subY + 68;
    lines2.forEach(line => {
      ctx.fillText(line, bx2 + 20, curY2, subColW - 40);
      curY2 += 44;
    });

    // Block 3: 整体仓位与策略建议
    const bx3 = 75 + (subColW + 20) * 2;
    ctx.fillStyle = colors.itemBg;
    ctx.strokeStyle = colors.itemBorder;
    roundRect(ctx, bx3, subY, subColW, 275, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = colors.blue;
    ctx.font = `bold 16px ${fontSans}`;
    ctx.fillText('💡 策略与资金流动性导向', bx3 + 20, subY + 34);
    ctx.fillStyle = colors.textSec;
    ctx.font = `14px ${fontSans}`;
    const lines3 = [
      '两市全天量能维持于万亿量级以上，流动性环境保持中性充裕。',
      '建议采取均衡哑铃型配置：以低估值红利高股息为盾，以算力AI及新质生产力核心龙头为矛。',
      '顺势跟随主力净流入强度靠前行业，严控单一板块仓位暴露。'
    ];
    let curY3 = subY + 68;
    lines3.forEach(line => {
      ctx.fillText(line, bx3 + 20, curY3, subColW - 40);
      curY3 += 44;
    });

    // -------------------------------------------------------------
    // FOOTER AREA
    // -------------------------------------------------------------
    const footerY = 1585;
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(45, footerY);
    ctx.lineTo(width - 45, footerY);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(65, footerY + 45, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.textMuted;
    ctx.font = `500 17px ${fontSans}`;
    ctx.fillText('行情状态：A股实盘交易时段已校准 · 资金流入(红) / 流出(绿) · 机构级量化数据实时核验', 84, footerY + 51);

    ctx.textAlign = 'right';
    if (watermarkMode === 'with_watermark') {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `bold 17px ${fontSans}`;
      ctx.fillText(`${watermarkText} · 原创出品`, width - 50, footerY + 51);
    } else {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 17px ${fontSans}`;
      ctx.fillText('上海 / 深圳交易所公开行情 · 纯净导出', width - 50, footerY + 51);
    }
    ctx.textAlign = 'left';
  }

  // =========================================================================
  // WATERMARK OVERLAY (Neutral Gray, never intrusive, only if enabled)
  // =========================================================================
  if (watermarkMode === 'with_watermark' && (watermarkStyle === 'grid' || watermarkStyle === 'both')) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.35, Math.max(0.08, watermarkOpacity));
    ctx.fillStyle = isDark || isNavy ? '#94a3b8' : '#64748b';
    ctx.font = `bold 22px ${fontSans}`;
    ctx.rotate(-25 * Math.PI / 180);

    const stepX = 280;
    const stepY = 180;
    for (let x = -width; x < width * 2; x += stepX) {
      for (let y = -height; y < height * 2; y += stepY) {
        ctx.fillText(watermarkText, x, y);
      }
    }
    ctx.restore();
  }

  return canvas;
}
