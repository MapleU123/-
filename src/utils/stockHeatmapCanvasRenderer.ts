import { HeatmapStockItem, SectorCluster, groupStocksBySector } from '../data/marketStockHeatmapData';
import { MarketOverviewData } from '../types/market';

export type HeatmapExportTheme = 'dark' | 'light' | 'oled';
export type HeatmapExportResolution = '4k' | '2k' | 'portrait';

export interface StockHeatmapRenderOptions {
  stocks: HeatmapStockItem[];
  overviewData?: MarketOverviewData;
  dateStr: string;
  timeStr: string;
  theme: HeatmapExportTheme;
  resolution: HeatmapExportResolution;
  watermarkText?: string;
  showWatermark?: boolean;
  sizeMetric?: 'marketCap' | 'turnover';
  selectedGroupFilter?: string;
}

export interface ResolutionConfig {
  width: number;
  height: number;
  scale: number;
  label: string;
  desc: string;
}

export const HEATMAP_RESOLUTIONS: Record<HeatmapExportResolution, ResolutionConfig> = {
  '4k': {
    width: 3840,
    height: 2200,
    scale: 2.0,
    label: '4K 旗舰级 (3840×2200)',
    desc: '超高清超清印刷级，近850万像素，文字极端锐利'
  },
  '2k': {
    width: 2560,
    height: 1480,
    scale: 1.5,
    label: '2K 视网膜 (2560×1480)',
    desc: '适合微信公众号、社群长图秒发，高保真体积适中'
  },
  'portrait': {
    width: 1600,
    height: 2600,
    scale: 1.5,
    label: '长图竖屏版 (1600×2600)',
    desc: '适合手机微信聊天、朋友圈、小红书竖版信息流'
  }
};

/**
 * Get color hex code for change percent
 */
function getCanvasColorForChange(change: number, isDark: boolean): { bg: string; text: string; border: string } {
  if (change >= 9.5) {
    return { bg: '#991b1b', text: '#ffffff', border: '#f87171' }; // 涨停极红
  }
  if (change >= 5.0) {
    return { bg: '#b91c1c', text: '#ffffff', border: '#ef4444' };
  }
  if (change >= 2.0) {
    return { bg: '#dc2626', text: '#ffffff', border: '#fca5a5' };
  }
  if (change >= 0.2) {
    return { bg: '#e11d48', text: '#ffffff', border: '#fda4af' };
  }
  if (change > -0.2 && change < 0.2) {
    return isDark 
      ? { bg: '#334155', text: '#cbd5e1', border: '#475569' }
      : { bg: '#94a3b8', text: '#f8fafc', border: '#cbd5e1' };
  }
  if (change > -2.0) {
    return { bg: '#059669', text: '#ffffff', border: '#6ee7b7' };
  }
  if (change > -5.0) {
    return { bg: '#047857', text: '#ffffff', border: '#34d399' };
  }
  // 跌停/大跌
  return { bg: '#064e3b', text: '#ffffff', border: '#10b981' };
}

/**
 * Render High Definition Stock Heatmap to HTML Canvas
 */
export async function renderStockHeatmapToCanvas(
  options: StockHeatmapRenderOptions
): Promise<HTMLCanvasElement> {
  const {
    stocks,
    overviewData,
    dateStr,
    timeStr,
    theme,
    resolution,
    watermarkText = 'A股量化投研复盘终端 · 公众号专属',
    showWatermark = true,
    sizeMetric = 'marketCap',
    selectedGroupFilter = 'all'
  } = options;

  const resConfig = HEATMAP_RESOLUTIONS[resolution] || HEATMAP_RESOLUTIONS['4k'];
  const { width, height } = resConfig;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D canvas context');

  const isDark = theme !== 'light';
  const isOled = theme === 'oled';

  // 1. Draw Background
  if (isOled) {
    ctx.fillStyle = '#000000';
  } else if (isDark) {
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0b1120');
    bgGrad.addColorStop(0.5, '#0f172a');
    bgGrad.addColorStop(1, '#090d16');
    ctx.fillStyle = bgGrad;
  } else {
    ctx.fillStyle = '#f8fafc';
  }
  ctx.fillRect(0, 0, width, height);

  // Subtle decorative grid in background
  ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Draw Header
  const padX = resolution === 'portrait' ? 40 : 60;
  let curY = 45;

  // Title Row
  ctx.font = 'bold 38px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = isDark ? '#ffffff' : '#0f172a';
  ctx.fillText('A股市场个股涨跌幅全景热力图', padX, curY + 34);

  // Subtitle / English title
  ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.fillText('A-SHARE MARKET STOCK PERFORMANCE & CAPITAL HEATMAP', padX, curY + 62);

  // Date & Time Pill (Right-aligned)
  const timeBoxWidth = 320;
  const timeBoxX = width - padX - timeBoxWidth;
  ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.8)' : '#ffffff';
  ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
  ctx.lineWidth = 1.5;
  roundRect(ctx, timeBoxX, curY + 5, timeBoxWidth, 60, 10, true, true);

  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = isDark ? '#f8fafc' : '#1e293b';
  ctx.fillText(`📅 交易日期: ${dateStr}`, timeBoxX + 16, curY + 30);
  ctx.font = '14px monospace';
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.fillText(`⏱️ 快照时间: ${timeStr} 盘中/收盘`, timeBoxX + 16, curY + 52);

  curY += 88;

  // 3. Stats Summary Banner
  // Calculate market stats from stocks
  let risingCount = 0;
  let fallingCount = 0;
  let flatCount = 0;
  let totalMarketCap = 0;
  let totalTurnover = 0;
  let sumChanges = 0;

  const filteredStocks = selectedGroupFilter === 'all' 
    ? stocks 
    : stocks.filter(s => s.sectorGroup === selectedGroupFilter || s.sector === selectedGroupFilter);

  filteredStocks.forEach(s => {
    if (s.changePercent > 0.05) risingCount++;
    else if (s.changePercent < -0.05) fallingCount++;
    else flatCount++;
    totalMarketCap += s.marketCap;
    totalTurnover += s.turnover;
    sumChanges += s.changePercent;
  });

  const medianChange = filteredStocks.length > 0 ? (sumChanges / filteredStocks.length).toFixed(2) : '0.00';

  const statsBannerHeight = 54;
  ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.9)' : '#ffffff';
  ctx.strokeStyle = isDark ? '#334155' : '#cbd5e1';
  roundRect(ctx, padX, curY, width - padX * 2, statsBannerHeight, 8, true, true);

  // Draw stats pills
  const statsX = padX + 24;
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

  // Rising
  ctx.fillStyle = '#ef4444';
  ctx.fillText(`▲ 上涨: ${risingCount} 家`, statsX, curY + 34);

  // Flat
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.fillText(`- 平盘: ${flatCount} 家`, statsX + 180, curY + 34);

  // Falling
  ctx.fillStyle = '#10b981';
  ctx.fillText(`▼ 下跌: ${fallingCount} 家`, statsX + 340, curY + 34);

  // Median
  ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
  ctx.fillText(`📊 样本平均涨幅: ${Number(medianChange) >= 0 ? '+' : ''}${medianChange}%`, statsX + 500, curY + 34);

  // Total Turnover & Market Cap
  ctx.fillStyle = isDark ? '#cbd5e1' : '#475569';
  const rightStats = `样本总市值: ${(totalMarketCap / 10000).toFixed(1)}万亿  |  总成交: ${totalTurnover.toFixed(0)}亿元  |  标的数: ${filteredStocks.length}只`;
  const rightMetrics = ctx.measureText(rightStats);
  ctx.fillText(rightStats, width - padX - rightMetrics.width - 24, curY + 34);

  curY += statsBannerHeight + 20;

  // 4. Draw Sector Clusters & Stocks Heatmap
  const clusters = groupStocksBySector(filteredStocks);
  const bottomFooterHeight = 65;
  const availableHeight = height - curY - bottomFooterHeight;
  const availableWidth = width - padX * 2;

  // Layout sectors in grid
  let colCount = 4;
  if (resolution === 'portrait') {
    colCount = 2;
  } else if (clusters.length <= 6) {
    colCount = 3;
  } else if (clusters.length > 10) {
    colCount = 4;
  }

  const rowCount = Math.ceil(clusters.length / colCount);
  const sectorGap = 16;
  const sectorW = (availableWidth - (colCount - 1) * sectorGap) / colCount;
  const sectorH = (availableHeight - (rowCount - 1) * sectorGap) / rowCount;

  clusters.forEach((cluster, idx) => {
    const col = idx % colCount;
    const row = Math.floor(idx / colCount);
    const secX = padX + col * (sectorW + sectorGap);
    const secY = curY + row * (sectorH + sectorGap);

    // Cluster Card Background
    ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.7)' : '#ffffff';
    ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
    ctx.lineWidth = 1;
    roundRect(ctx, secX, secY, sectorW, sectorH, 8, true, true);

    // Cluster Header
    const headH = 32;
    ctx.fillStyle = isDark ? 'rgba(30, 41, 59, 0.8)' : '#f1f5f9';
    roundRect(ctx, secX, secY, sectorW, headH, 8, true, false);

    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a';
    ctx.fillText(`${cluster.name}`, secX + 10, secY + 21);

    // Cluster avg change % badge
    const avgChangeStr = `${cluster.avgChangePercent >= 0 ? '+' : ''}${cluster.avgChangePercent.toFixed(2)}%`;
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = cluster.avgChangePercent >= 0 ? '#ef4444' : '#10b981';
    const badgeW = ctx.measureText(avgChangeStr).width;
    ctx.fillText(avgChangeStr, secX + sectorW - badgeW - 10, secY + 21);

    // Cluster stock count
    ctx.font = '11px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
    ctx.fillText(`共${cluster.stocks.length}只`, secX + 10 + ctx.measureText(cluster.name).width + 12, secY + 21);

    // Layout stocks inside this cluster
    const stockAreaX = secX + 6;
    const stockAreaY = secY + headH + 6;
    const stockAreaW = sectorW - 12;
    const stockAreaH = sectorH - headH - 12;

    layoutClusterStocks(ctx, cluster.stocks, stockAreaX, stockAreaY, stockAreaW, stockAreaH, sizeMetric, isDark);
  });

  // 5. Draw Footer (Legend & Watermark)
  const footerY = height - bottomFooterHeight + 10;

  // Legend Bar
  const legendX = padX;
  const legendW = 280;
  const legendH = 14;

  const legGrad = ctx.createLinearGradient(legendX, 0, legendX + legendW, 0);
  legGrad.addColorStop(0, '#064e3b'); // -10%
  legGrad.addColorStop(0.25, '#059669'); // -3%
  legGrad.addColorStop(0.5, '#475569'); // 0%
  legGrad.addColorStop(0.75, '#dc2626'); // +3%
  legGrad.addColorStop(1, '#991b1b'); // +10%

  ctx.fillStyle = legGrad;
  roundRect(ctx, legendX, footerY + 12, legendW, legendH, 4, true, false);

  ctx.font = '11px -apple-system, BlinkMacSystemFont, monospace';
  ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
  ctx.fillText('跌停 ≤-10%', legendX, footerY + 38);
  ctx.fillText('0.0%', legendX + legendW / 2 - 12, footerY + 38);
  ctx.fillText('+10% 涨停', legendX + legendW - 55, footerY + 38);

  // Watermark / Brand info in footer
  if (showWatermark && watermarkText) {
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.4)';
    const wmMetrics = ctx.measureText(watermarkText);
    ctx.fillText(watermarkText, width - padX - wmMetrics.width, footerY + 28);
  }

  // Centered footnote
  ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.fillStyle = isDark ? 'rgba(148, 163, 184, 0.5)' : 'rgba(100, 116, 139, 0.6)';
  const note = '数据来源: 交易所行情总线 · 本图表仅供量化复盘参考，不构成任何投资买卖建议';
  const noteMetrics = ctx.measureText(note);
  ctx.fillText(note, (width - noteMetrics.width) / 2, footerY + 28);

  return canvas;
}

/**
 * Layout stocks within a cluster box using a proportional grid
 */
function layoutClusterStocks(
  ctx: CanvasRenderingContext2D,
  stocks: HeatmapStockItem[],
  x: number,
  y: number,
  w: number,
  h: number,
  sizeMetric: 'marketCap' | 'turnover',
  isDark: boolean
) {
  if (stocks.length === 0) return;

  const count = stocks.length;
  let cols = 3;
  if (count <= 2) cols = 2;
  else if (count <= 4) cols = 2;
  else if (count <= 6) cols = 3;
  else if (count <= 8) cols = 4;
  else cols = 4;

  const rows = Math.ceil(count / cols);
  const gap = 4;
  const cellW = (w - (cols - 1) * gap) / cols;
  const cellH = (h - (rows - 1) * gap) / rows;

  stocks.forEach((stk, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const cellX = x + col * (cellW + gap);
    const cellY = y + row * (cellH + gap);

    const colors = getCanvasColorForChange(stk.changePercent, isDark);

    // Draw Stock Tile
    ctx.fillStyle = colors.bg;
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 1;
    roundRect(ctx, cellX, cellY, cellW, cellH, 6, true, true);

    // Stock Name
    const isSmall = cellH < 42 || cellW < 65;
    const nameFontSize = isSmall ? 11 : 13;
    ctx.font = `bold ${nameFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillStyle = colors.text;

    // Truncate name if too long
    let displayName = stk.name;
    if (ctx.measureText(displayName).width > cellW - 8 && displayName.length > 3) {
      displayName = displayName.substring(0, 3) + '..';
    }

    if (isSmall) {
      // Small tile layout: name + change in one or two compact lines
      ctx.fillText(displayName, cellX + 4, cellY + 14);
      const chgStr = `${stk.changePercent >= 0 ? '+' : ''}${stk.changePercent.toFixed(1)}%`;
      ctx.font = 'bold 10px monospace';
      ctx.fillText(chgStr, cellX + 4, cellY + cellH - 4);
    } else {
      // Standard tile layout:
      // Line 1: Name
      ctx.fillText(displayName, cellX + 6, cellY + 18);

      // Line 2: Change % (Large and prominent)
      const chgStr = `${stk.changePercent >= 0 ? '+' : ''}${stk.changePercent.toFixed(2)}%`;
      ctx.font = 'bold 12px monospace';
      ctx.fillText(chgStr, cellX + 6, cellY + 34);

      // Line 3: Price and Cap (if cell is tall enough)
      if (cellH >= 54) {
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        const infoStr = `${stk.price.toFixed(1)}元 | ${stk.marketCap > 10000 ? (stk.marketCap / 10000).toFixed(1) + '万亿' : stk.marketCap.toFixed(0) + '亿'}`;
        ctx.fillText(infoStr, cellX + 6, cellY + 48);
      }
    }
  });
}

/**
 * Helper to draw rounded rectangle on canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  fill = true,
  stroke = false
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) ctx.fill();
  if (stroke) ctx.stroke();
}
