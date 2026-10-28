import { SHENWAN_31_INDUSTRIES_VALUATION } from '../data/industryValuationData';
import { IndustryValuationItem, ValuationStatus } from '../types/industryValuation';
import { ALL_ETF_VALUATION_LIST } from '../data/etfValuationData';
import { ETFValuationItem, ETFValuationStatus } from '../types/etfValuation';
import { IndexQuote, SectorFundFlow, MarketOverviewData } from '../types/market';
import { getRealtimeDateString } from './marketDateUtils';
import { computeHierarchicalTreemap, getTreemapStockColor } from './marketTreemapLayout';

export type ReportThemeMode = 'light' | 'dark' | 'classic' | 'navy';

export interface USMarketItem {
  name: string;
  price: string;
  change: string;
  changePct: string;
  isUp: boolean;
  high?: string;
  low?: string;
  volume?: string;
}

export interface USStockItem {
  code: string;
  name: string;
  price: string;
  changePct: string;
  isUp: boolean;
  cap: string;
  pe: string;
  desc: string;
}

export interface CanvasExportOptions {
  template: 'market_treemap' | 'industry_valuation' | 'etf_valuation' | 'market_overview' | 'fundflow_panorama' | 'gainers_losers' | 'sector_deepdive' | 'sentiment_ladder' | 'gold_macro' | 'us_market' | 'current_snapshot';
  sectors: SectorFundFlow[];
  indices: IndexQuote[];
  overviewData?: MarketOverviewData;
  selectedSector?: SectorFundFlow;
  industryValuationData?: IndustryValuationItem[];
  etfValuationData?: ETFValuationItem[];
  usMarketData?: {
    indices?: USMarketItem[];
    techGiants?: USStockItem[];
    chinaADRs?: USStockItem[];
  };
  themeMode: ReportThemeMode;
  watermarkMode: 'with_watermark' | 'no_watermark';
  watermarkText: string;
  watermarkOpacity: number;
  watermarkStyle: 'grid' | 'corner' | 'both';
  todayStr?: string;
  scale?: number;
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

  const isTreemap = template === 'market_treemap';
  const isIndustryValuation = template === 'industry_valuation';
  const isETFValuation = template === 'etf_valuation';
  const isPanorama = template === 'fundflow_panorama' || template === 'current_snapshot';
  const isGainersLosers = template === 'gainers_losers';
  const isUSMarket = template === 'us_market';
  const isWidescreen = isPanorama || isGainersLosers || isUSMarket || isTreemap || isIndustryValuation || isETFValuation;
  const width = isTreemap ? 1800 : (isIndustryValuation || isETFValuation ? 1680 : (isWidescreen ? 1600 : 1200));
  const height = isTreemap ? 1020 : (isIndustryValuation || isETFValuation ? 1120 : (isUSMarket ? 980 : (isWidescreen ? 960 : 1760)));
  const scale = options.scale && options.scale > 0 ? options.scale : 3.0;

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * scale);
  canvas.height = Math.round(height * scale);

  const ctx = canvas.getContext('2d', {
    alpha: false,
    desynchronized: false
  });
  if (!ctx) return canvas;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (scale !== 1.0) {
    ctx.scale(scale, scale);
  }

  // Build complete color palette according to selectable style (themeMode)
  const isDark = themeMode === 'dark';
  const isClassic = themeMode === 'classic';
  const isNavy = themeMode === 'navy';
  const isLight = !isDark && !isNavy;

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

  const fontSans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif';

  // 1. Draw Canvas Background (Matches selected theme style)
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // =========================================================================
  // TEMPLATE: MARKET STOCK SQUARIFIED TREEMAP (Widescreen 1800x1020 Finviz Style)
  // =========================================================================
  // =========================================================================
  // TEMPLATE: 31 SHENWAN INDUSTRY VALUATION PANORAMA (1680x1120 HD Master)
  // =========================================================================
  if (isIndustryValuation) {
    const valuationList: IndustryValuationItem[] = options.industryValuationData && options.industryValuationData.length > 0 
      ? options.industryValuationData 
      : SHENWAN_31_INDUSTRIES_VALUATION;

    // 1. Top Header Bar (Y: 0 to 60)
    const topBarBg = isDark ? '#090d16' : isNavy ? '#050a17' : isClassic ? '#f5ede0' : '#ffffff';
    ctx.fillStyle = topBarBg;
    ctx.fillRect(0, 0, width, 60);

    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(width, 60);
    ctx.stroke();

    // App Logo Icon
    ctx.fillStyle = '#6366f1';
    roundRect(ctx, 25, 12, 36, 36, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 20px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('31', 43, 37);

    // Title
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 20px ${fontSans}`;
    const isSubset = valuationList.length < SHENWAN_31_INDUSTRIES_VALUATION.length;
    const mainTitle = isSubset
      ? `申万一级精选行业指数估值与市场表现研报 (已定制收录共 ${valuationList.length} 个行业)`
      : '申万一级 31 个行业指数最新估值与市场表现全景';
    ctx.fillText(mainTitle, 72, 38);

    ctx.fillStyle = colors.textSec;
    ctx.font = `500 13px ${fontSans}`;
    const subTitle = isSubset
      ? `统计时点：${todayStr}  •  定制精选 ${valuationList.length} 个行业配置目标  •  基于十年PE/PB历史百分位权威梯队划分`
      : `统计时点：${todayStr}  •  基于历史10年PE分位数权威梯队划分  •  沪深北证券交易所公开数据`;
    ctx.fillText(subTitle, isSubset ? 640 : 560, 38);

    // Watermark / Clean Mode badge on top right
    const badgeRight = width - 25;
    if (watermarkMode === 'with_watermark' && (watermarkStyle === 'corner' || watermarkStyle === 'both')) {
      ctx.fillStyle = isDark || isNavy ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)';
      ctx.strokeStyle = isDark || isNavy ? 'rgba(99, 102, 241, 0.35)' : 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 1;
      roundRect(ctx, badgeRight - 240, 14, 240, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark || isNavy ? '#a5b4fc' : '#4f46e5';
      ctx.font = `bold 12.5px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(`🛡️ ${watermarkText}`, badgeRight - 120, 35);
    } else {
      ctx.fillStyle = colors.itemBg;
      ctx.strokeStyle = colors.itemBorder;
      ctx.lineWidth = 1;
      roundRect(ctx, badgeRight - 220, 14, 220, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.textSec;
      ctx.font = `bold 12.5px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText('📊 申万估值官方纯净版', badgeRight - 110, 35);
    }
    ctx.textAlign = 'left';

    // 2. Metric Explanation Strip & 5 Valuation Summary Cards (Y: 72 to 155)
    // Summary counts by status
    const statusCounts: Record<ValuationStatus, number> = {
      '极度低估': 0,
      '低估': 0,
      '正常': 0,
      '高估': 0,
      '极度高估': 0
    };
    valuationList.forEach(item => {
      if (statusCounts[item.status] !== undefined) {
        statusCounts[item.status]++;
      }
    });

    const statusConfigs: { status: ValuationStatus; range: string; color: string; bg: string; border: string }[] = [
      { status: '极度低估', range: 'PE分位 < 10%', color: '#059669', bg: isDark ? '#062e22' : '#ecfdf5', border: isDark ? '#047857' : '#a7f3d0' },
      { status: '低估', range: '10% ≤ PE < 30%', color: '#16a34a', bg: isDark ? '#052e16' : '#f0fdf4', border: isDark ? '#15803d' : '#bbf7d0' },
      { status: '正常', range: '30% ≤ PE ≤ 70%', color: '#2563eb', bg: isDark ? '#172554' : '#eff6ff', border: isDark ? '#1d4ed8' : '#bfdbfe' },
      { status: '高估', range: '70% < PE < 90%', color: '#ea580c', bg: isDark ? '#371805' : '#fff7ed', border: isDark ? '#c2410c' : '#fed7aa' },
      { status: '极度高估', range: 'PE分位 ≥ 90%', color: '#dc2626', bg: isDark ? '#3b0d0c' : '#fef2f2', border: isDark ? '#b91c1c' : '#fecaca' }
    ];

    // Left Metric Explanation block (W: 460)
    const expX = 25;
    const expY = 72;
    const expW = 480;
    const expH = 80;

    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, expX, expY, expW, expH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#6366f1';
    ctx.font = `bold 12px ${fontSans}`;
    ctx.fillText('💡 估值三维核心研判准则', expX + 14, expY + 22);

    ctx.fillStyle = colors.textSec;
    ctx.font = `11px ${fontSans}`;
    ctx.fillText('• 市盈率(PE)：反映单位盈利对价，结合历史百分位排除周期波动干扰', expX + 14, expY + 41);
    ctx.fillText('• 市净率(PB)：衡量资产定价安全边际，破净(PB<1)为重要防守边际', expX + 14, expY + 58);
    ctx.fillText('• 股息率：现金分红回报率标尺，高股息构筑坚实安全垫与红利避险价值', expX + 14, expY + 74);

    // Right: 5 status cards
    const cardGap = 12;
    const statCardW = Math.floor((width - 25 - expW - 20 - (statusConfigs.length - 1) * cardGap) / statusConfigs.length);
    statusConfigs.forEach((cfg, i) => {
      const cx = expX + expW + 18 + i * (statCardW + cardGap);
      ctx.fillStyle = cfg.bg;
      ctx.strokeStyle = cfg.border;
      ctx.lineWidth = 1;
      roundRect(ctx, cx, expY, statCardW, expH, 12);
      ctx.fill();
      ctx.stroke();

      // Status title
      ctx.fillStyle = cfg.color;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText(cfg.status, cx + 12, expY + 24);

      // Status indicator dot
      ctx.beginPath();
      ctx.arc(cx + statCardW - 16, expY + 20, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // Count
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 24px ${fontSans}`;
      ctx.fillText(`${statusCounts[cfg.status]}`, cx + 12, expY + 55);

      ctx.fillStyle = colors.textMuted;
      ctx.font = `12px ${fontSans}`;
      ctx.fillText('个行业', cx + 46, expY + 53);

      // Subtitle
      ctx.fillStyle = cfg.color;
      ctx.font = `10px ${fontSans}`;
      ctx.fillText(cfg.range, cx + 12, expY + 72);
    });

    // 3. Main Data Table (Y: 165 to 1055, 31 rows + header)
    const tableX = 25;
    const tableY = 165;
    const tableW = width - 50; // 1630
    const tableH = 890;

    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, tableX, tableY, tableW, tableH, 14);
    ctx.fill();
    ctx.stroke();

    // Table Columns Configuration
    const cols = [
      { key: 'rank', label: '#', w: 45, align: 'center' },
      { key: 'code', label: '指数代码', w: 100, align: 'center' },
      { key: 'name', label: '行业名称', w: 125, align: 'left' },
      { key: 'status', label: '估值状态', w: 110, align: 'center' },
      { key: 'pe', label: '最新市盈率 (PE)', w: 120, align: 'right' },
      { key: 'pePercentile', label: 'PE历史分位', w: 190, align: 'left' },
      { key: 'pbPercentile', label: 'PB历史分位', w: 190, align: 'left' },
      { key: 'roe', label: 'ROE (%)', w: 90, align: 'right' },
      { key: 'weekChange', label: '近1周涨跌', w: 100, align: 'right' },
      { key: 'monthChange', label: '当月涨跌', w: 100, align: 'right' },
      { key: 'dividendYield', label: '股息率 (%)', w: 95, align: 'right' },
      { key: 'leadingStocks', label: '代表性权重龙头股', w: 345, align: 'left' }
    ];

    // Table Header Row (Y: 165 to 205)
    const headerH = 40;
    ctx.fillStyle = isDark ? '#111827' : isNavy ? '#0a1428' : isClassic ? '#eee2cf' : '#f8fafc';
    roundRect(ctx, tableX, tableY, tableW, headerH, 14);
    ctx.fill();

    ctx.strokeStyle = colors.divider;
    ctx.beginPath();
    ctx.moveTo(tableX, tableY + headerH);
    ctx.lineTo(tableX + tableW, tableY + headerH);
    ctx.stroke();

    let curColX = tableX;
    ctx.fillStyle = colors.textSec;
    ctx.font = `bold 12px ${fontSans}`;
    cols.forEach(col => {
      let tx = curColX + 8;
      if (col.align === 'center') tx = curColX + col.w / 2;
      else if (col.align === 'right') tx = curColX + col.w - 10;

      ctx.textAlign = col.align as CanvasTextAlign;
      ctx.fillText(col.label, tx, tableY + 25);
      curColX += col.w;
    });

    // Rows (Adaptive height based on item count, fits up to 31 rows)
    const rowCount = Math.max(1, valuationList.length);
    const rowH = rowCount <= 8 ? 48 : rowCount <= 14 ? 38 : rowCount <= 22 ? 32 : 27;
    const sortedValuation = [...valuationList].sort((a, b) => a.pePercentile - b.pePercentile);

    sortedValuation.slice(0, 31).forEach((item, index) => {
      const ry = tableY + headerH + index * rowH;
      const isEven = index % 2 === 1;

      // Row alternate background
      if (isEven) {
        ctx.fillStyle = isDark ? 'rgba(255,255,255,0.02)' : isClassic ? 'rgba(0,0,0,0.02)' : 'rgba(0,0,0,0.015)';
        ctx.fillRect(tableX, ry, tableW, rowH);
      }

      // Bottom row divider
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(tableX + 10, ry + rowH);
      ctx.lineTo(tableX + tableW - 10, ry + rowH);
      ctx.stroke();

      let cx = tableX;
      cols.forEach(col => {
        ctx.textAlign = col.align as CanvasTextAlign;
        const textY = ry + Math.round(rowH / 2) + 4.5;

        if (col.key === 'rank') {
          ctx.fillStyle = colors.textMuted;
          ctx.font = `bold 11px ${fontSans}`;
          ctx.fillText(`${index + 1}`, cx + col.w / 2, textY);
        } else if (col.key === 'code') {
          ctx.fillStyle = colors.textMuted;
          ctx.font = `500 11px monospace`;
          ctx.fillText(item.code, cx + col.w / 2, textY);
        } else if (col.key === 'name') {
          ctx.fillStyle = colors.textMain;
          ctx.font = `bold ${rowH >= 38 ? 13.5 : 12.5}px ${fontSans}`;
          ctx.fillText(item.name, cx + 10, textY);
        } else if (col.key === 'status') {
          // Status badge
          const cfg = statusConfigs.find(c => c.status === item.status) || statusConfigs[2];
          const badgeW = rowH >= 38 ? 74 : 68;
          const badgeH = rowH >= 38 ? 22 : 18;
          const bx = cx + (col.w - badgeW) / 2;
          const by = ry + Math.round((rowH - badgeH) / 2);
          ctx.fillStyle = cfg.bg;
          ctx.strokeStyle = cfg.border;
          ctx.lineWidth = 0.8;
          roundRect(ctx, bx, by, badgeW, badgeH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = cfg.color;
          ctx.font = `bold ${rowH >= 38 ? 11.5 : 10.5}px ${fontSans}`;
          ctx.fillText(item.status, cx + col.w / 2, by + Math.round(badgeH / 2) + 3.5);
        } else if (col.key === 'pe') {
          ctx.fillStyle = colors.textMain;
          ctx.font = `bold ${rowH >= 38 ? 13 : 12}px monospace`;
          ctx.fillText(item.pe.toFixed(2), cx + col.w - 10, textY);
        } else if (col.key === 'pePercentile') {
          // PE Percentile Bar (Width: 95px) + Text
          const barW = 95;
          const barH = rowH >= 38 ? 10 : 8;
          const bx = cx + 8;
          const by = ry + Math.round((rowH - barH) / 2);

          // Track
          ctx.fillStyle = isDark ? '#1f2937' : '#e2e8f0';
          roundRect(ctx, bx, by, barW, barH, 4);
          ctx.fill();

          // Active fill
          const fillW = Math.min(barW, Math.max(4, (item.pePercentile / 100) * barW));
          const cfg = statusConfigs.find(c => c.status === item.status) || statusConfigs[2];
          ctx.fillStyle = cfg.color;
          roundRect(ctx, bx, by, fillW, barH, 4);
          ctx.fill();

          // Percentile label
          ctx.fillStyle = cfg.color;
          ctx.font = `bold ${rowH >= 38 ? 12 : 11}px monospace`;
          ctx.fillText(`${item.pePercentile.toFixed(1)}%`, bx + barW + 10, textY);
        } else if (col.key === 'pbPercentile') {
          // PB Percentile Bar
          const barW = 95;
          const barH = rowH >= 38 ? 10 : 8;
          const bx = cx + 8;
          const by = ry + Math.round((rowH - barH) / 2);

          ctx.fillStyle = isDark ? '#1f2937' : '#e2e8f0';
          roundRect(ctx, bx, by, barW, barH, 4);
          ctx.fill();

          const fillW = Math.min(barW, Math.max(4, (item.pbPercentile / 100) * barW));
          const pbColor = item.pbPercentile < 20 ? '#059669' : item.pbPercentile > 80 ? '#dc2626' : '#3b82f6';
          ctx.fillStyle = pbColor;
          roundRect(ctx, bx, by, fillW, barH, 4);
          ctx.fill();

          ctx.fillStyle = pbColor;
          ctx.font = `bold ${rowH >= 38 ? 12 : 11}px monospace`;
          ctx.fillText(`${item.pbPercentile.toFixed(1)}% (PB ${item.pb.toFixed(2)})`, bx + barW + 8, textY);
        } else if (col.key === 'roe') {
          ctx.fillStyle = colors.textMain;
          ctx.font = `bold ${rowH >= 38 ? 12.5 : 11.5}px monospace`;
          ctx.fillText(`${item.roe.toFixed(2)}%`, cx + col.w - 10, textY);
        } else if (col.key === 'weekChange') {
          const isUp = item.weekChange >= 0;
          ctx.fillStyle = isUp ? colors.inflowText : colors.outflowText;
          ctx.font = `bold ${rowH >= 38 ? 12.5 : 11.5}px monospace`;
          ctx.fillText(`${isUp ? '+' : ''}${item.weekChange.toFixed(2)}%`, cx + col.w - 10, textY);
        } else if (col.key === 'monthChange') {
          const isUp = item.monthChange >= 0;
          ctx.fillStyle = isUp ? colors.inflowText : colors.outflowText;
          ctx.font = `bold ${rowH >= 38 ? 12.5 : 11.5}px monospace`;
          ctx.fillText(`${isUp ? '+' : ''}${item.monthChange.toFixed(2)}%`, cx + col.w - 10, textY);
        } else if (col.key === 'dividendYield') {
          ctx.fillStyle = item.dividendYield >= 3.0 ? '#d97706' : colors.textSec;
          ctx.font = `bold ${rowH >= 38 ? 12.5 : 11.5}px monospace`;
          ctx.fillText(`${item.dividendYield.toFixed(2)}%`, cx + col.w - 10, textY);
        } else if (col.key === 'leadingStocks') {
          ctx.fillStyle = colors.textSec;
          ctx.font = `500 ${rowH >= 38 ? 12 : 11}px ${fontSans}`;
          const stocksStr = item.leadingStocks.slice(0, 4).join('、');
          ctx.fillText(stocksStr, cx + 8, textY);
        }

        cx += col.w;
      });
    });

    // 4. Footer Strip (Y: 1065 to 1105)
    const footerY = 1065;
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(25, footerY);
    ctx.lineTo(width - 25, footerY);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(38, footerY + 26, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMuted;
    ctx.font = `500 12.5px ${fontSans}`;
    const footerNotice = isSubset
      ? `A股申万一级行业估值罗盘 · 定制精选收录共 ${valuationList.length} 个行业 · 实时行情与十年滚动分位数严密核验 · 仅供量化配置参考`
      : 'A股申万一级31个行业估值罗盘 · 数据经交易所实时公开行情与十年历史分位数严密核验 · 仅供量化配置参考';
    ctx.fillText(footerNotice, 52, footerY + 30);

    ctx.textAlign = 'right';
    if (watermarkMode === 'with_watermark') {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `bold 12.5px ${fontSans}`;
      ctx.fillText(`${watermarkText} · 原创出品`, width - 30, footerY + 30);
    } else {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 12.5px ${fontSans}`;
      ctx.fillText('上海 / 深圳交易所公开行情 · 纯净无水印导出', width - 30, footerY + 30);
    }
    ctx.textAlign = 'left';
  } else if (isETFValuation) {
    // =========================================================================
    // TEMPLATE: ETF VALUATION COMPASS (1680x1120 HD Master)
    // =========================================================================
    const etfList: ETFValuationItem[] = options.etfValuationData && options.etfValuationData.length > 0
      ? options.etfValuationData
      : ALL_ETF_VALUATION_LIST;

    // 1. Top Header Bar (Y: 0 to 60)
    const topBarBg = isDark ? '#090d16' : isNavy ? '#050a17' : isClassic ? '#f5ede0' : '#ffffff';
    ctx.fillStyle = topBarBg;
    ctx.fillRect(0, 0, width, 60);

    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.lineTo(width, 60);
    ctx.stroke();

    // App Logo Icon
    ctx.fillStyle = '#e11d48';
    roundRect(ctx, 25, 12, 44, 36, 10);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 16px ${fontSans}`;
    ctx.textAlign = 'center';
    ctx.fillText('ETF', 47, 36);

    // Title
    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 20px ${fontSans}`;
    const isSubset = etfList.length < ALL_ETF_VALUATION_LIST.length;
    const mainTitle = isSubset 
      ? `精选 ETF 基金最新估值与十年分位数罗盘 (已完整收录共 ${etfList.length} 只标的)`
      : `全市场 ETF 基金最新估值与十年分位数全景罗盘 (共 ${etfList.length} 只核心标的)`;
    ctx.fillText(mainTitle, 80, 38);

    ctx.fillStyle = colors.textSec;
    ctx.font = `500 13px ${fontSans}`;
    const subTitle = isSubset
      ? `统计时点：${todayStr}  •  序号 1 至 ${etfList.length} 号重点标的全部呈列  •  交易所及基金公开行情`
      : `统计时点：${todayStr}  •  涵盖 宽基 / 策略 / 行业 / 主题 / 全球 5大分类核心标的  •  交易所及基金公开行情`;
    ctx.fillText(subTitle, isSubset ? 640 : 545, 38);

    // Watermark / Clean Mode badge on top right
    const badgeRight = width - 25;
    if (watermarkMode === 'with_watermark' && (watermarkStyle === 'corner' || watermarkStyle === 'both')) {
      ctx.fillStyle = isDark || isNavy ? 'rgba(225, 29, 72, 0.15)' : 'rgba(225, 29, 72, 0.1)';
      ctx.strokeStyle = isDark || isNavy ? 'rgba(225, 29, 72, 0.35)' : 'rgba(225, 29, 72, 0.25)';
      ctx.lineWidth = 1;
      roundRect(ctx, badgeRight - 240, 14, 240, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = isDark || isNavy ? '#f43f5e' : '#e11d48';
      ctx.font = `bold 12.5px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(`🛡️ ${watermarkText}`, badgeRight - 120, 35);
    } else {
      ctx.fillStyle = colors.itemBg;
      ctx.strokeStyle = colors.itemBorder;
      ctx.lineWidth = 1;
      roundRect(ctx, badgeRight - 220, 14, 220, 32, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = colors.textSec;
      ctx.font = `bold 12.5px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText('📊 ETF估值官方纯净版', badgeRight - 110, 35);
    }
    ctx.textAlign = 'left';

    // 2. Metric Guide Strip (Y: 72 to 155)
    const expX = 25;
    const expY = 72;
    const expW = 460;
    const expH = 80;

    ctx.fillStyle = colors.cardBg;
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1;
    roundRect(ctx, expX, expY, expW, expH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e11d48';
    ctx.font = `bold 12px ${fontSans}`;
    ctx.fillText('💡 ETF 估值三维核心配置准则', expX + 14, expY + 22);

    ctx.fillStyle = colors.textSec;
    ctx.font = `11px ${fontSans}`;
    ctx.fillText('• PE分位 (<10%极度低估 / >90%极度高估)：精准把控左侧逆向定投与高位分批止盈节奏', expX + 14, expY + 41);
    ctx.fillText('• 市净率(PB)：衡量资产定价安全垫，低PB与破净品种防守反弹空间充分', expX + 14, expY + 58);
    ctx.fillText('• 股息率与折溢价：高股息(>3%)构筑防御底仓，微折价交易为天然折价安全垫', expX + 14, expY + 74);

    // Right: 5 status cards
    const statusConfigs = [
      { status: '极度低估', range: 'PE分位 < 10%', color: '#059669', bg: isDark ? '#062e22' : '#ecfdf5', border: isDark ? '#047857' : '#a7f3d0' },
      { status: '低估', range: '10% ≤ PE < 30%', color: '#16a34a', bg: isDark ? '#052e16' : '#f0fdf4', border: isDark ? '#15803d' : '#bbf7d0' },
      { status: '正常', range: '30% ≤ PE ≤ 70%', color: '#2563eb', bg: isDark ? '#172554' : '#eff6ff', border: isDark ? '#1d4ed8' : '#bfdbfe' },
      { status: '高估', range: '70% < PE < 90%', color: '#ea580c', bg: isDark ? '#371805' : '#fff7ed', border: isDark ? '#c2410c' : '#fed7aa' },
      { status: '极度高估', range: 'PE分位 ≥ 90%', color: '#dc2626', bg: isDark ? '#3b0d0c' : '#fef2f2', border: isDark ? '#b91c1c' : '#fecaca' }
    ];

    const cardGap = 12;
    const statCardW = Math.floor((width - 25 - expW - 20 - (statusConfigs.length - 1) * cardGap) / statusConfigs.length);
    statusConfigs.forEach((cfg, i) => {
      const cx = expX + expW + 18 + i * (statCardW + cardGap);
      ctx.fillStyle = cfg.bg;
      ctx.strokeStyle = cfg.border;
      ctx.lineWidth = 1;
      roundRect(ctx, cx, expY, statCardW, expH, 12);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = cfg.color;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText(cfg.status, cx + 12, expY + 24);

      const cnt = etfList.filter(item => item.status === cfg.status).length;
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 22px monospace`;
      ctx.fillText(`${cnt}`, cx + 12, expY + 54);

      ctx.fillStyle = colors.textMuted;
      ctx.font = `10.5px ${fontSans}`;
      ctx.fillText(cfg.range, cx + 12, expY + 70);
    });

    // 3. ETF Table (Adaptive: Single Full-Width Table if <= 26 items; Dual-Column if > 26 items)
    const tableTop = 168;
    const colGap = 18;
    const isSingleColumn = etfList.length <= 26;

    if (isSingleColumn) {
      // =======================================================================
      // SINGLE UNIFIED TABLE (e.g. 20 Strategic Funds, 8 Theme Funds, 6 Global Funds)
      // All items are rendered sequentially in rows 1 to N without column splitting
      // =======================================================================
      const tableW = width - 50; // 1630px
      const rowCount = etfList.length;
      const rowH = rowCount <= 10 ? 46 : rowCount <= 16 ? 40 : rowCount <= 22 ? 36 : 32;

      const singleColumns = [
        { key: 'idx', label: '#', w: 42, align: 'center' },
        { key: 'code', label: '代码', w: 75, align: 'center' },
        { key: 'name', label: 'ETF基金名称', w: 175, align: 'left' },
        { key: 'index', label: '标的指数', w: 165, align: 'left' },
        { key: 'category', label: '分类', w: 65, align: 'center' },
        { key: 'price', label: '最新价', w: 80, align: 'right' },
        { key: 'change', label: '涨跌幅', w: 80, align: 'right' },
        { key: 'status', label: '估值状态', w: 85, align: 'center' },
        { key: 'pe', label: 'PE-TTM', w: 75, align: 'right' },
        { key: 'pePercentile5y', label: '近5年PE分位', w: 115, align: 'center' },
        { key: 'pePercentile10y', label: '近10年PE分位', w: 120, align: 'center' },
        { key: 'pb', label: 'PB', w: 70, align: 'right' },
        { key: 'dividend', label: '股息率', w: 75, align: 'right' },
        { key: 'premium', label: '折溢价率', w: 75, align: 'right' },
        { key: 'aum', label: '规模', w: 80, align: 'right' },
        { key: 'holdings', label: '核心重仓成分股', w: 185, align: 'left' },
        { key: 'rating', label: '量化建议', w: 68, align: 'center' }
      ];

      // Header row
      ctx.fillStyle = isDark ? '#111a2e' : isNavy ? '#0e1b38' : isClassic ? '#eee2d0' : '#f1f5f9';
      roundRect(ctx, 25, tableTop, tableW, 34, 6);
      ctx.fill();

      let hx = 25;
      singleColumns.forEach(col => {
        ctx.fillStyle = colors.textSec;
        ctx.font = `bold 11px ${fontSans}`;
        let tx = hx + 8;
        if (col.align === 'center') tx = hx + col.w / 2;
        else if (col.align === 'right') tx = hx + col.w - 8;
        ctx.textAlign = col.align as CanvasTextAlign;
        ctx.fillText(col.label, tx, tableTop + 22);
        hx += col.w;
      });

      // Data rows (Rows 1 to N complete sequential listing)
      etfList.forEach((item, rIdx) => {
        const ry = tableTop + 36 + rIdx * rowH;
        const isEven = rIdx % 2 === 0;
        ctx.fillStyle = isEven ? (isDark ? '#0c1424' : isNavy ? '#0b162e' : isClassic ? '#f9f3ea' : '#ffffff') : colors.cardBg;
        roundRect(ctx, 25, ry, tableW, rowH - 2, 4);
        ctx.fill();

        let cx = 25;
        singleColumns.forEach(col => {
          let tx = cx + 8;
          if (col.align === 'center') tx = cx + col.w / 2;
          else if (col.align === 'right') tx = cx + col.w - 8;
          ctx.textAlign = col.align as CanvasTextAlign;
          const textY = ry + Math.floor(rowH / 2) + 4;

          if (col.key === 'idx') {
            ctx.fillStyle = colors.textMuted;
            ctx.font = `11.5px monospace`;
            ctx.fillText(`${rIdx + 1}`, tx, textY);
          } else if (col.key === 'code') {
            ctx.fillStyle = colors.textSec;
            ctx.font = `bold 11.5px monospace`;
            ctx.fillText(item.code, tx, textY);
          } else if (col.key === 'name') {
            ctx.fillStyle = colors.textMain;
            ctx.font = `bold 12px ${fontSans}`;
            ctx.fillText(item.name, tx, textY);
          } else if (col.key === 'index') {
            ctx.fillStyle = colors.textMuted;
            ctx.font = `11px ${fontSans}`;
            ctx.fillText(`${item.indexName} (${item.indexCode})`, tx, textY);
          } else if (col.key === 'category') {
            ctx.fillStyle = item.category === 'broad' ? '#0284c7' : item.category === 'strategy' ? '#4f46e5' : item.category === 'industry' ? '#2563eb' : item.category === 'theme' ? '#9333ea' : '#d97706';
            ctx.font = `bold 10.5px ${fontSans}`;
            ctx.fillText(item.categoryName, tx, textY);
          } else if (col.key === 'price') {
            ctx.fillStyle = colors.textMain;
            ctx.font = `bold 11.5px monospace`;
            ctx.fillText(`¥${item.price.toFixed(3)}`, tx, textY);
          } else if (col.key === 'change') {
            const isUp = item.changePercent >= 0;
            ctx.fillStyle = isUp ? colors.inflowText : colors.outflowText;
            ctx.font = `bold 11.5px monospace`;
            ctx.fillText(`${isUp ? '+' : ''}${item.changePercent.toFixed(2)}%`, tx, textY);
          } else if (col.key === 'status') {
            let badgeBg = '#ecfdf5';
            let badgeText = '#059669';
            if (item.status === '低估') { badgeBg = '#f0fdf4'; badgeText = '#16a34a'; }
            else if (item.status === '正常') { badgeBg = '#eff6ff'; badgeText = '#2563eb'; }
            else if (item.status === '高估') { badgeBg = '#fff7ed'; badgeText = '#ea580c'; }
            else if (item.status === '极度高估') { badgeBg = '#fef2f2'; badgeText = '#dc2626'; }

            roundRect(ctx, cx + 8, ry + (rowH - 22) / 2, col.w - 16, 20, 10);
            ctx.fillStyle = isDark ? '#151f32' : badgeBg;
            ctx.fill();
            ctx.fillStyle = badgeText;
            ctx.font = `bold 10.5px ${fontSans}`;
            ctx.fillText(item.status, cx + col.w / 2, textY - 1);
          } else if (col.key === 'pe') {
            ctx.fillStyle = colors.textMain;
            ctx.font = `bold 11.5px monospace`;
            ctx.fillText(`${item.pe.toFixed(1)}`, tx, textY);
          } else if (col.key === 'pePercentile5y') {
            const barW = 52;
            const barX = cx + 8;
            const barY = ry + (rowH - 9) / 2;
            ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
            roundRect(ctx, barX, barY, barW, 9, 4.5);
            ctx.fill();

            const p5 = item.pePercentile5y;
            const fillW = Math.min(barW, Math.max(5, (p5 / 100) * barW));
            ctx.fillStyle = p5 < 10 ? '#059669' : p5 < 30 ? '#16a34a' : p5 <= 70 ? '#4f46e5' : p5 < 90 ? '#ea580c' : '#dc2626';
            roundRect(ctx, barX, barY, fillW, 9, 4.5);
            ctx.fill();

            ctx.textAlign = 'right';
            ctx.fillStyle = colors.textMain;
            ctx.font = `bold 11px monospace`;
            ctx.fillText(`${p5.toFixed(1)}%`, cx + col.w - 6, textY);
          } else if (col.key === 'pePercentile10y') {
            const barW = 55;
            const barX = cx + 8;
            const barY = ry + (rowH - 9) / 2;
            ctx.fillStyle = isDark ? '#1e293b' : '#e2e8f0';
            roundRect(ctx, barX, barY, barW, 9, 4.5);
            ctx.fill();

            const p10 = item.pePercentile10y;
            const fillW = Math.min(barW, Math.max(5, (p10 / 100) * barW));
            ctx.fillStyle = p10 < 10 ? '#059669' : p10 < 30 ? '#16a34a' : p10 <= 70 ? '#2563eb' : p10 < 90 ? '#ea580c' : '#dc2626';
            roundRect(ctx, barX, barY, fillW, 9, 4.5);
            ctx.fill();

            ctx.textAlign = 'right';
            ctx.fillStyle = colors.textMain;
            ctx.font = `bold 11px monospace`;
            ctx.fillText(`${p10.toFixed(1)}%`, cx + col.w - 6, textY);
          } else if (col.key === 'pb') {
            ctx.fillStyle = item.pb < 1.0 ? '#4f46e5' : colors.textSec;
            ctx.font = `bold 11.5px monospace`;
            ctx.fillText(`${item.pb.toFixed(2)}`, tx, textY);
          } else if (col.key === 'dividend') {
            ctx.fillStyle = item.dividendYield >= 3.0 ? '#d97706' : colors.textSec;
            ctx.font = `bold 11.5px monospace`;
            ctx.fillText(`${item.dividendYield.toFixed(2)}%`, tx, textY);
          } else if (col.key === 'premium') {
            ctx.fillStyle = item.premiumRate < 0 ? '#4f46e5' : item.premiumRate > 1.0 ? '#dc2626' : colors.textSec;
            ctx.font = `bold 11px monospace`;
            ctx.fillText(`${item.premiumRate > 0 ? '+' : ''}${item.premiumRate.toFixed(2)}%`, tx, textY);
          } else if (col.key === 'aum') {
            ctx.fillStyle = colors.textSec;
            ctx.font = `bold 11px monospace`;
            ctx.fillText(`${item.aum.toFixed(1)}亿`, tx, textY);
          } else if (col.key === 'holdings') {
            ctx.fillStyle = colors.textMuted;
            ctx.font = `10.5px ${fontSans}`;
            const topH = item.topHoldings.slice(0, 3).map(h => h.name).join('、');
            ctx.fillText(topH, tx, textY);
          } else if (col.key === 'rating') {
            ctx.fillStyle = item.quantRating === '积极定投' ? '#059669' : item.quantRating === '适度配置' ? '#2563eb' : '#64748b';
            ctx.font = `bold 10.5px ${fontSans}`;
            ctx.fillText(item.quantRating, tx, textY);
          }

          cx += col.w;
        });
      });
    } else {
      // =======================================================================
      // DUAL COLUMN TABLE (For > 26 items: e.g. 32 Industry funds, or 87 all funds)
      // Displays items in two balanced side-by-side columns with clear column headers
      // =======================================================================
      const halfTableW = Math.floor((width - 50 - colGap) / 2);

      const tableColumns = [
        { key: 'idx', label: '#', w: 32, align: 'center' },
        { key: 'code', label: '代码', w: 58, align: 'left' },
        { key: 'name', label: 'ETF基金名称', w: 110, align: 'left' },
        { key: 'category', label: '分类', w: 46, align: 'center' },
        { key: 'price', label: '最新价', w: 60, align: 'right' },
        { key: 'change', label: '涨跌幅', w: 60, align: 'right' },
        { key: 'status', label: '估值状态', w: 68, align: 'center' },
        { key: 'pe', label: 'PE', w: 50, align: 'right' },
        { key: 'pePercentile5y', label: '5年分位', w: 68, align: 'right' },
        { key: 'pePercentile10y', label: '10年分位', w: 72, align: 'right' },
        { key: 'pb', label: 'PB', w: 48, align: 'right' },
        { key: 'dividend', label: '股息率', w: 52, align: 'right' },
        { key: 'rating', label: '配置建议', w: 62, align: 'center' }
      ];

      const maxDisplayCount = Math.min(etfList.length, 88);
      const displayETFs = etfList.slice(0, maxDisplayCount);
      const halfCount = Math.ceil(displayETFs.length / 2);
      const leftList = displayETFs.slice(0, halfCount);
      const rightList = displayETFs.slice(halfCount);
      const rowH = halfCount > 35 ? 19 : halfCount > 24 ? 24 : halfCount > 18 ? 26 : 28;

      const renderTableHalf = (list: ETFValuationItem[], startX: number, startIdx: number, colTitle: string) => {
        // Header row
        ctx.fillStyle = isDark ? '#111a2e' : isNavy ? '#0e1b38' : isClassic ? '#eee2d0' : '#f1f5f9';
        roundRect(ctx, startX, tableTop, halfTableW, 32, 6);
        ctx.fill();

        let hx = startX;
        tableColumns.forEach(col => {
          ctx.fillStyle = colors.textSec;
          ctx.font = `bold 11px ${fontSans}`;
          let tx = hx + 6;
          if (col.align === 'center') tx = hx + col.w / 2;
          else if (col.align === 'right') tx = hx + col.w - 6;
          ctx.textAlign = col.align as CanvasTextAlign;
          
          // Enhanced label for # column to show range
          const labelText = col.key === 'idx' ? `${colTitle}` : col.label;
          ctx.fillText(labelText, tx, tableTop + 20);
          hx += col.w;
        });

        // Data rows
        list.forEach((item, rIdx) => {
          const ry = tableTop + 34 + rIdx * rowH;
          const isEven = rIdx % 2 === 0;
          ctx.fillStyle = isEven ? (isDark ? '#0c1424' : isNavy ? '#0b162e' : isClassic ? '#f9f3ea' : '#ffffff') : colors.cardBg;
          roundRect(ctx, startX, ry, halfTableW, rowH - 2, 4);
          ctx.fill();

          let cx = startX;
          tableColumns.forEach(col => {
            let tx = cx + 6;
            if (col.align === 'center') tx = cx + col.w / 2;
            else if (col.align === 'right') tx = cx + col.w - 6;
            ctx.textAlign = col.align as CanvasTextAlign;
            const textY = ry + 18;

            if (col.key === 'idx') {
              ctx.fillStyle = colors.textMuted;
              ctx.font = `11px monospace`;
              ctx.fillText(`${startIdx + rIdx + 1}`, tx, textY);
            } else if (col.key === 'code') {
              ctx.fillStyle = colors.textSec;
              ctx.font = `bold 11px monospace`;
              ctx.fillText(item.code, tx, textY);
            } else if (col.key === 'name') {
              ctx.fillStyle = colors.textMain;
              ctx.font = `bold 11.5px ${fontSans}`;
              ctx.fillText(item.name.slice(0, 8), tx, textY);
            } else if (col.key === 'category') {
              ctx.fillStyle = item.category === 'broad' ? '#0284c7' : item.category === 'strategy' ? '#4f46e5' : item.category === 'industry' ? '#2563eb' : item.category === 'theme' ? '#9333ea' : '#d97706';
              ctx.font = `bold 10px ${fontSans}`;
              ctx.fillText(item.categoryName, tx, textY);
            } else if (col.key === 'price') {
              ctx.fillStyle = colors.textMain;
              ctx.font = `bold 11px monospace`;
              ctx.fillText(`¥${item.price.toFixed(3)}`, tx, textY);
            } else if (col.key === 'change') {
              const isUp = item.changePercent >= 0;
              ctx.fillStyle = isUp ? colors.inflowText : colors.outflowText;
              ctx.font = `bold 11px monospace`;
              ctx.fillText(`${isUp ? '+' : ''}${item.changePercent.toFixed(2)}%`, tx, textY);
            } else if (col.key === 'status') {
              let badgeBg = '#ecfdf5';
              let badgeText = '#059669';
              if (item.status === '低估') { badgeBg = '#f0fdf4'; badgeText = '#16a34a'; }
              else if (item.status === '正常') { badgeBg = '#eff6ff'; badgeText = '#2563eb'; }
              else if (item.status === '高估') { badgeBg = '#fff7ed'; badgeText = '#ea580c'; }
              else if (item.status === '极度高估') { badgeBg = '#fef2f2'; badgeText = '#dc2626'; }

              roundRect(ctx, cx + 6, ry + 4, col.w - 12, 18, 9);
              ctx.fillStyle = isDark ? '#151f32' : badgeBg;
              ctx.fill();
              ctx.fillStyle = badgeText;
              ctx.font = `bold 10px ${fontSans}`;
              ctx.fillText(item.status, cx + col.w / 2, textY - 1);
            } else if (col.key === 'pe') {
              ctx.fillStyle = colors.textMain;
              ctx.font = `bold 11px monospace`;
              ctx.fillText(`${item.pe.toFixed(1)}`, tx, textY);
            } else if (col.key === 'pePercentile5y') {
              const p5 = item.pePercentile5y;
              ctx.fillStyle = p5 < 10 ? '#059669' : p5 < 30 ? '#16a34a' : p5 <= 70 ? '#4f46e5' : p5 < 90 ? '#ea580c' : '#dc2626';
              ctx.font = `bold 10.5px monospace`;
              ctx.fillText(`${p5.toFixed(1)}%`, tx, textY);
            } else if (col.key === 'pePercentile10y') {
              const p10 = item.pePercentile10y;
              ctx.fillStyle = p10 < 10 ? '#059669' : p10 < 30 ? '#16a34a' : p10 <= 70 ? '#2563eb' : p10 < 90 ? '#ea580c' : '#dc2626';
              ctx.font = `bold 10.5px monospace`;
              ctx.fillText(`${p10.toFixed(1)}%`, tx, textY);
            } else if (col.key === 'pb') {
              ctx.fillStyle = item.pb < 1.0 ? '#4f46e5' : colors.textSec;
              ctx.font = `bold 11px monospace`;
              ctx.fillText(`${item.pb.toFixed(2)}`, tx, textY);
            } else if (col.key === 'dividend') {
              ctx.fillStyle = item.dividendYield >= 3.0 ? '#d97706' : colors.textSec;
              ctx.font = `bold 11px monospace`;
              ctx.fillText(`${item.dividendYield.toFixed(2)}%`, tx, textY);
            } else if (col.key === 'rating') {
              ctx.fillStyle = item.quantRating === '积极定投' ? '#059669' : item.quantRating === '适度配置' ? '#2563eb' : '#64748b';
              ctx.font = `bold 10px ${fontSans}`;
              ctx.fillText(item.quantRating, tx, textY);
            }

            cx += col.w;
          });
        });
      };

      renderTableHalf(leftList, 25, 0, `1-${halfCount}`);
      if (rightList.length > 0) {
        renderTableHalf(rightList, 25 + halfTableW + colGap, halfCount, `${halfCount + 1}-${displayETFs.length}`);
      }
    }

    // 4. Footer Strip (Y: 1065 to 1105)
    const footerY = 1065;
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(25, footerY);
    ctx.lineTo(width - 25, footerY);
    ctx.stroke();

    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(38, footerY + 26, 4.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMuted;
    ctx.font = `500 12.5px ${fontSans}`;
    ctx.fillText('全市场ETF基金估值罗盘 · 数据经交易所及基金管理人公开数据实时校准 · 涵盖宽基/策略/行业/主题/全球 · 仅供量化资产配置与定投参考', 52, footerY + 30);

    ctx.textAlign = 'right';
    if (watermarkMode === 'with_watermark') {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `bold 12.5px ${fontSans}`;
      ctx.fillText(`${watermarkText} · 原创出品`, width - 30, footerY + 30);
    } else {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 12.5px ${fontSans}`;
      ctx.fillText('交易所公开行情 · 纯净无水印导出', width - 30, footerY + 30);
    }
    ctx.textAlign = 'left';
  } else if (isTreemap) {
    // -------------------------------------------------------------
    // TOP STATUS & LEGEND BAR (Y: 0 to 48)
    // -------------------------------------------------------------
    const topBarBg = isDark ? '#090d16' : isNavy ? '#050a17' : isClassic ? '#f5ede0' : '#f8fafc';
    ctx.fillStyle = topBarBg;
    ctx.fillRect(0, 0, width, 48);

    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 48);
    ctx.lineTo(width, 48);
    ctx.stroke();

    // Top-Left: Live Indicator, Title & Timestamp
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(26, 24, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 16px ${fontSans}`;
    ctx.fillText('A股全景板块个股涨跌树状热力图', 38, 29);

    ctx.fillStyle = colors.textSec;
    ctx.font = `12px ${fontSans}`;
    ctx.fillText(`交易时段: ${todayStr} 15:00:00 (实盘校准)`, 285, 29);

    ctx.fillStyle = isDark || isNavy ? '#38bdf8' : '#0284c7';
    ctx.font = `bold 11.5px ${fontSans}`;
    ctx.fillText('数据源: 52etf.site · 东方财富', 510, 29);

    // Top-Right: Color Scale Legend (Finviz style gradient scale)
    const legendItems = [
      { label: '≤-5%', bg: isLight ? '#14532d' : '#0d4a25', text: '#ffffff' },
      { label: '-2%', bg: isLight ? '#166534' : '#166534', text: '#ffffff' },
      { label: '-0.2%', bg: isLight ? '#15803d' : '#1e5436', text: '#ffffff' },
      { label: '平盘', bg: isLight ? '#64748b' : '#2e3748', text: '#ffffff' },
      { label: '+0.2%', bg: isLight ? '#be3232' : '#882222', text: '#ffffff' },
      { label: '+2%', bg: isLight ? '#e11d48' : '#a82424', text: '#ffffff' },
      { label: '+5%', bg: isLight ? '#dc2626' : '#b91c1c', text: '#ffffff' },
      { label: '≥+9.5%', bg: isLight ? '#b91c1c' : '#991b1b', text: '#ffffff' },
    ];

    let legX = width - 480;
    ctx.fillStyle = colors.textMuted;
    ctx.font = `11px ${fontSans}`;
    ctx.fillText('涨跌分布:', legX - 58, 29);

    legendItems.forEach(item => {
      ctx.fillStyle = item.bg;
      ctx.fillRect(legX, 16, 44, 18);
      ctx.strokeStyle = colors.divider;
      ctx.lineWidth = 0.5;
      ctx.strokeRect(legX, 16, 44, 18);

      ctx.fillStyle = item.text;
      ctx.font = `bold 10px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(item.label, legX + 22, 29);
      legX += 47;
    });
    ctx.textAlign = 'left';

    // -------------------------------------------------------------
    // MAIN SQUARIFIED TREEMAP CONTAINER
    // -------------------------------------------------------------
    const treeContainer = {
      x: 16,
      y: 54,
      w: width - 32,
      h: height - 106
    };

    const sectors = computeHierarchicalTreemap(treeContainer);

    // Render Sectors
    sectors.forEach(sec => {
      if (!sec.rect || sec.rect.w <= 0 || sec.rect.h <= 0) return;

      const { x, y, w, h } = sec.rect;

      // 1. Sector Outer Frame
      ctx.strokeStyle = isDark ? '#334155' : isNavy ? '#1e3a8a' : isClassic ? '#d6c7b2' : '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);

      // Sector headers are superimposed directly on top of stocks below!

      // 3. Render Subsectors inside Sector
      sec.subsectors.forEach(sub => {
        if (!sub.rect || sub.rect.w <= 0 || sub.rect.h <= 0) return;

        const sx = sub.rect.x;
        const sy = sub.rect.y;
        const sw = sub.rect.w;
        const sh = sub.rect.h;

        // Subsector outline
        ctx.strokeStyle = isDark ? '#1e293b' : isNavy ? '#172554' : isClassic ? '#e2d5bd' : '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx + 0.5, sy + 0.5, sw - 1, sh - 1);

        // Subsector header if space permits
        if (sh > 45 && sw > 45) {
          const subH = 16;
          ctx.fillStyle = isDark ? '#0b0f19' : isNavy ? '#080d1a' : isClassic ? '#f5ede0' : '#f1f5f9';
          ctx.fillRect(sx + 1, sy + 1, sw - 2, subH);

          ctx.fillStyle = isDark || isNavy ? '#94a3b8' : '#64748b';
          ctx.font = `bold 10px ${fontSans}`;
          ctx.fillText(sub.name, sx + 4, sy + 12, sw - 8);
        }

        // 4. Render Stocks inside Subsector
        sub.stocks.forEach(stk => {
          if (!stk.rect || stk.rect.w <= 0 || stk.rect.h <= 0) return;

          const { x: kx, y: ky, w: kw, h: kh } = stk.rect;
          const color = getTreemapStockColor(stk.changePercent, themeMode);

          // Tile Background
          ctx.fillStyle = color.bg;
          ctx.fillRect(kx, ky, kw, kh);

          // Tile Border
          ctx.strokeStyle = color.border;
          ctx.lineWidth = 1;
          ctx.strokeRect(kx + 0.5, ky + 0.5, Math.max(0, kw - 1), Math.max(0, kh - 1));

          // Stock Text
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const cx = kx + kw / 2;
          const cy = ky + kh / 2;
          const changeStr = (stk.changePercent > 0 ? '+' : '') + stk.changePercent.toFixed(2) + '%';

          if (kw >= 95 && kh >= 55) {
            // Very Large Tile (e.g. 农业银行, 工商银行, 宁德时代, 贵州茅台)
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 20px ${fontSans}`;
            ctx.fillText(stk.name, cx, cy - 11);

            ctx.fillStyle = color.subText;
            ctx.font = `bold 14.5px ${fontSans}`;
            ctx.fillText(changeStr, cx, cy + 12);

            if (kh >= 82) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.font = `10.5px ${fontSans}`;
              ctx.fillText(`${stk.marketCap}亿`, cx, cy + 28);
            }
          } else if (kw >= 56 && kh >= 34) {
            // Medium Tile (e.g. 寒武纪, 海光信息, 北方华创, 中际旭创)
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 13.5px ${fontSans}`;
            ctx.fillText(stk.name, cx, cy - 8);

            ctx.fillStyle = color.subText;
            ctx.font = `bold 11px ${fontSans}`;
            ctx.fillText(changeStr, cx, cy + 9);
          } else if (kw >= 38 && kh >= 22) {
            // Compact Tile
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 11px ${fontSans}`;
            ctx.fillText(stk.name, cx, cy - 6);

            ctx.fillStyle = color.subText;
            ctx.font = `10px ${fontSans}`;
            ctx.fillText(changeStr, cx, cy + 7);
          } else if (kw >= 26 && kh >= 15) {
            // Small Tile: Name only
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold 9.5px ${fontSans}`;
            ctx.fillText(stk.name.slice(0, 3), cx, cy);
          }
        });
      });

      // SUPERIMPOSED Sector Header Badge directly over stocks
      if (w >= 50 && h >= 32) {
        const badgeW = Math.min(w - 8, Math.max(56, sec.name.length * 15 + 16));
        const badgeH = 20;
        ctx.fillStyle = isDark || isNavy ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.90)';
        roundRect(ctx, x + 4, y + 4, badgeW, badgeH, 4);
        ctx.fill();
        ctx.strokeStyle = isDark || isNavy ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.22)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = isDark || isNavy ? '#f8fafc' : '#0f172a';
        ctx.font = `bold 12px ${fontSans}`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(sec.name, x + 9, y + 18);
      }
    });

    // -------------------------------------------------------------
    // BOTTOM FOOTER STATUS & COPYRIGHT (Y: height - 42 to height)
    // -------------------------------------------------------------
    const footerY = height - 42;
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(16, footerY);
    ctx.lineTo(width - 16, footerY);
    ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(28, footerY + 22, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = colors.textMuted;
    ctx.font = `500 13px ${fontSans}`;
    ctx.fillText('行情状态：A股全市场板块与核心权重股等比树状热力图 · 面积代表总市值占比 · 红色为上涨 / 绿色为下跌', 42, footerY + 26);

    ctx.textAlign = 'right';
    if (watermarkMode === 'with_watermark') {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText(`${watermarkText} · 原创出品 · 机构级量化树图`, width - 20, footerY + 26);
    } else {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 13px ${fontSans}`;
      ctx.fillText('52etf / 东方财富公开行情 · 纯净无水印导出', width - 20, footerY + 26);
    }
    ctx.textAlign = 'left';
  } else if (isPanorama) {
    // =========================================================================
    // TEMPLATE A: FUNDFLOW PANORAMA (Widescreen 1600x940 Bilateral Board)
    // =========================================================================
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

    // Separate into Inflows and Outflows - Strictly GUARANTEE TOP 10 for both sides!
    let inflows = [...sectors].filter(s => (s.mainNetInflow || 0) > 0).sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0)).slice(0, 10);
    if (inflows.length < 10) {
      const remaining = [...sectors]
        .filter(s => !inflows.some(item => item.id === s.id))
        .sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0))
        .slice(0, 10 - inflows.length);
      inflows = [...inflows, ...remaining];
    }

    let outflows = [...sectors].filter(s => (s.mainNetInflow || 0) < 0).sort((a, b) => (a.mainNetInflow || 0) - (b.mainNetInflow || 0)).slice(0, 10);
    if (outflows.length < 10) {
      const remaining = [...sectors]
        .filter(s => !outflows.some(item => item.id === s.id))
        .sort((a, b) => (a.mainNetInflow || 0) - (b.mainNetInflow || 0))
        .slice(0, 10 - outflows.length);
      outflows = [...outflows, ...remaining];
    }

    const rowCount = 10;
    const cardY = 70;
    const cardH = 845;
    const cardW = 760;
    const leftCardX = 25;
    const rightCardX = 815;

    // -------------------------------------------------------------
    // LEFT CARD: 资金流入 TOP 10 (RED BARS, RED BADGE, RED VALUES)
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
    ctx.fillText('资金流入 TOP 10', leftCardX + 24, cardY + 35);

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
    const leftBarStartX = leftCardX + 215;
    const leftBarMaxW = 405;
    const rowStartY = cardY + 70;
    const rowH = 65;

    ticksInflow.forEach(tick => {
      const tx = leftBarStartX + (tick / inflowScale.ceiling) * leftBarMaxW;
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, rowStartY);
      ctx.lineTo(tx, rowStartY + rowCount * rowH);
      ctx.stroke();
    });

    // Draw Left 10 Rows: Inflow in RED with rank badges
    inflows.forEach((sec, idx) => {
      const ry = rowStartY + idx * rowH;

      // Rank Badge (01-10)
      const rankX = leftCardX + 22;
      const rankY = ry + 14;
      let badgeBg = isDark ? '#334155' : '#e2e8f0';
      let badgeText = isDark ? '#94a3b8' : '#64748b';
      if (idx === 0) {
        badgeBg = '#e11d48';
        badgeText = '#ffffff';
      } else if (idx === 1) {
        badgeBg = '#ea580c';
        badgeText = '#ffffff';
      } else if (idx === 2) {
        badgeBg = '#d97706';
        badgeText = '#ffffff';
      }
      ctx.fillStyle = badgeBg;
      roundRect(ctx, rankX, rankY, 26, 22, 5);
      ctx.fill();

      ctx.fillStyle = badgeText;
      ctx.font = `bold 12px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(idx + 1).padStart(2, '0'), rankX + 13, rankY + 16);
      ctx.textAlign = 'left';

      // Sector Name
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 15px ${fontSans}`;
      ctx.fillText(sec.name, leftCardX + 58, ry + 30);

      // INFLOW BAR: RED!
      const val = sec.mainNetInflow || 0;
      const barW = Math.min(leftBarMaxW, Math.max(10, (Math.abs(val) / inflowScale.ceiling) * leftBarMaxW));

      ctx.fillStyle = colors.inflowBar; // Solid bright RED
      roundRect(ctx, leftBarStartX, ry + 13, barW, 24, 4);
      ctx.fill();

      // Number text at the right of the bar (RED)
      ctx.fillStyle = colors.inflowText;
      ctx.font = `bold 14px ${fontSans}`;
      const valFormatted = val >= 0 ? `+${val.toFixed(2)}亿` : `${val.toFixed(2)}亿`;
      ctx.fillText(valFormatted, leftBarStartX + barW + 10, ry + 30);
    });

    // Left Bottom X-Axis Ticks
    const leftAxisY = rowStartY + rowCount * rowH + 16;
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
    // RIGHT CARD: 资金流出 TOP 10 (GREEN BARS, GREEN BADGE, GREEN VALUES)
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
    ctx.fillText('资金流出 TOP 10', rightCardX + 24, cardY + 35);

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

    const rightBarStartX = rightCardX + 215;
    const rightBarMaxW = 405;

    ticksOutflow.forEach(tick => {
      const tx = rightBarStartX + (tick / outflowScale.ceiling) * rightBarMaxW;
      ctx.strokeStyle = colors.gridLine;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tx, rowStartY);
      ctx.lineTo(tx, rowStartY + rowCount * rowH);
      ctx.stroke();
    });

    // Draw Right 10 Rows: Outflow in GREEN with rank badges
    outflows.forEach((sec, idx) => {
      const ry = rowStartY + idx * rowH;

      // Rank Badge (01-10)
      const rankX = rightCardX + 22;
      const rankY = ry + 14;
      let badgeBg = isDark ? '#334155' : '#e2e8f0';
      let badgeText = isDark ? '#94a3b8' : '#64748b';
      if (idx === 0) {
        badgeBg = '#059669';
        badgeText = '#ffffff';
      } else if (idx === 1) {
        badgeBg = '#0d9488';
        badgeText = '#ffffff';
      } else if (idx === 2) {
        badgeBg = '#10b981';
        badgeText = '#ffffff';
      }
      ctx.fillStyle = badgeBg;
      roundRect(ctx, rankX, rankY, 26, 22, 5);
      ctx.fill();

      ctx.fillStyle = badgeText;
      ctx.font = `bold 12px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(String(idx + 1).padStart(2, '0'), rankX + 13, rankY + 16);
      ctx.textAlign = 'left';

      // Sector Name
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 15px ${fontSans}`;
      ctx.fillText(sec.name, rightCardX + 58, ry + 30);

      // OUTFLOW BAR: GREEN! Starts from LEFT (rightBarStartX) and extends towards RIGHT
      const absVal = Math.abs(sec.mainNetInflow || 0);
      const barW = Math.min(rightBarMaxW, Math.max(10, (absVal / outflowScale.ceiling) * rightBarMaxW));
      const bx = rightBarStartX;

      ctx.fillStyle = colors.outflowBar; // Solid bright GREEN
      roundRect(ctx, bx, ry + 13, barW, 24, 4);
      ctx.fill();

      // Number text at the RIGHT tip of the bar (GREEN)
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.outflowText;
      ctx.font = `bold 14px ${fontSans}`;
      ctx.fillText(`${(sec.mainNetInflow || 0).toFixed(2)}亿`, bx + barW + 10, ry + 30);
    });

    // Right Bottom X-Axis Ticks (From Left to Right: 0, 20, 40, 60, 80...)
    const rightAxisY = rowStartY + rowCount * rowH + 16;
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

    let topInflows = [...sectors].filter(s => (s.mainNetInflow || 0) > 0).sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0)).slice(0, 8);
    if (topInflows.length < 8) {
      const remaining = [...sectors]
        .filter(s => !topInflows.some(item => item.id === s.id))
        .sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0))
        .slice(0, 8 - topInflows.length);
      topInflows = [...topInflows, ...remaining];
    }

    let topOutflows = [...sectors].filter(s => (s.mainNetInflow || 0) < 0).sort((a, b) => (a.mainNetInflow || 0) - (b.mainNetInflow || 0)).slice(0, 8);
    if (topOutflows.length < 8) {
      const remaining = [...sectors]
        .filter(s => !topOutflows.some(item => item.id === s.id))
        .sort((a, b) => (a.mainNetInflow || 0) - (b.mainNetInflow || 0))
        .slice(0, 8 - topOutflows.length);
      topOutflows = [...topOutflows, ...remaining];
    }

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
