import { PendingConvertibleBond, CBProgressSummary } from '../types/market';
import { getRealtimeDateString, getRealtimeTimeString } from './marketDateUtils';

export type CBReportThemeMode = 'light' | 'dark' | 'classic' | 'navy';
export type CBExportClarityTier = '2k' | '4k' | '8k';
export type CBExportTemplateType = 'cb_list_long' | 'cb_single_card';

export interface CBCanvasExportOptions {
  template: CBExportTemplateType;
  selectedBonds: PendingConvertibleBond[];
  singleBond?: PendingConvertibleBond;
  summary?: CBProgressSummary;
  themeMode: CBReportThemeMode;
  clarity: CBExportClarityTier;
  watermarkMode: 'with_watermark' | 'no_watermark';
  watermarkText: string;
  watermarkOpacity: number;
  watermarkStyle: 'grid' | 'corner' | 'both';
  todayStr?: string;
  timeStr?: string;
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

/**
 * High-Definition Canvas Renderer for Pending Convertible Bonds (待发可转债高清研报)
 * Supports:
 * 1. 'cb_list_long': Multi-bond allotment & pipeline comparison long report
 * 2. 'cb_single_card': Deep-dive single bond allocation & safety margin card
 */
export function renderCBReportToCanvas(options: CBCanvasExportOptions): HTMLCanvasElement {
  const {
    template = 'cb_list_long',
    selectedBonds = [],
    singleBond,
    summary,
    themeMode = 'light',
    clarity = '4k',
    watermarkMode = 'with_watermark',
    watermarkText = '公众号：我爱这young',
    watermarkOpacity = 0.16,
    watermarkStyle = 'both',
    todayStr = getRealtimeDateString(),
    timeStr = getRealtimeTimeString()
  } = options;

  // Clarity scale factor
  const scaleMap: Record<CBExportClarityTier, number> = {
    '2k': 2.0,
    '4k': 3.0,
    '8k': 4.0
  };
  const scale = scaleMap[clarity] || 3.0;

  // Dimensions
  const fontSans = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif';
  const width = template === 'cb_list_long' ? 1580 : 1400;
  
  // Calculate dynamic height based on selected bonds count
  const bondCount = selectedBonds.length;
  let height = 1800;

  if (template === 'cb_list_long') {
    // Header (180) + Pipeline Overview (140) + Table Header & Rows (65 + rowH * N) + Spotlight Box (240) + Rules & Tips (170) + Footer (100)
    const rowHeight = 56;
    const tableHeaderHeight = 50;
    const baseHeight = 180 + 130 + tableHeaderHeight + 250 + 170 + 100;
    height = Math.max(1280, baseHeight + bondCount * rowHeight);
  } else {
    // Single Bond Deep-dive card: fixed 1200 x 1480
    height = 1480;
  }

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

  // Theme palettes
  const isDark = themeMode === 'dark';
  const isClassic = themeMode === 'classic';
  const isNavy = themeMode === 'navy';

  // Light Clean Paper (Default)
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
    tableHeaderBg: '#f8fafc',
    tableStripeBg: '#fbfcfe',
    tableBorder: '#e2e8f0',
    accentRose: '#e11d48',
    accentRoseLight: '#ffe4e6',
    accentAmber: '#d97706',
    accentAmberLight: '#fef3c7',
    accentEmerald: '#059669',
    accentEmeraldLight: '#d1fae5',
    accentBlue: '#2563eb',
    accentBlueLight: '#dbeafe',
    badgeText: '#ffffff',
    highlightText: '#b45309'
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
      tableHeaderBg: '#131d2e',
      tableStripeBg: '#111b2d',
      tableBorder: '#1e293b',
      accentRose: '#f43f5e',
      accentRoseLight: '#4c0519',
      accentAmber: '#f59e0b',
      accentAmberLight: '#451a03',
      accentEmerald: '#10b981',
      accentEmeraldLight: '#022c22',
      accentBlue: '#3b82f6',
      accentBlueLight: '#1e3a8a',
      badgeText: '#ffffff',
      highlightText: '#fde68a'
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
      tableHeaderBg: '#122045',
      tableStripeBg: '#0f1c3d',
      tableBorder: '#1b2d56',
      accentRose: '#fb7185',
      accentRoseLight: '#4c0519',
      accentAmber: '#fbbf24',
      accentAmberLight: '#451a03',
      accentEmerald: '#34d399',
      accentEmeraldLight: '#022c22',
      accentBlue: '#60a5fa',
      accentBlueLight: '#1e3a8a',
      badgeText: '#ffffff',
      highlightText: '#fef08a'
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
      tableHeaderBg: '#ede0cc',
      tableStripeBg: '#faf5ec',
      tableBorder: '#e2d5bd',
      accentRose: '#be123c',
      accentRoseLight: '#ffe4e6',
      accentAmber: '#b45309',
      accentAmberLight: '#fef3c7',
      accentEmerald: '#047857',
      accentEmeraldLight: '#d1fae5',
      accentBlue: '#1d4ed8',
      accentBlueLight: '#dbeafe',
      badgeText: '#ffffff',
      highlightText: '#92400e'
    };
  }

  // 1. Fill Canvas Background
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, width, height);

  // =========================================================================
  // TEMPLATE 1: MULTI-BOND COMPARISON & ALLOTMENT LONG-IMAGE
  // =========================================================================
  if (template === 'cb_list_long') {
    // -------------------------------------------------------------
    // TOP HEADER BANNER (Y: 30 to 170)
    // -------------------------------------------------------------
    const headerX = 40;
    const headerY = 30;
    const headerW = width - 80;
    const headerH = 135;

    ctx.fillStyle = colors.cardBg;
    roundRect(ctx, headerX, headerY, headerW, headerH, 14);
    ctx.fill();
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Top Red/Rose Accent Strip
    ctx.fillStyle = colors.accentRose;
    roundRect(ctx, headerX, headerY, 8, headerH, 4);
    ctx.fill();

    // Main Title (Without '集思录' as requested)
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 28px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('待发可转债方案进展跟踪与抢权配债研报', headerX + 30, headerY + 44);

    // Subtitle / Standard declaration - Vivid high-contrast multi-colored issuance stage flow
    ctx.font = `bold 14px ${fontSans}`;
    ctx.fillStyle = colors.textMain;
    ctx.textAlign = 'left';
    ctx.fillText('发行流程：', headerX + 30, headerY + 76);

    const pipelineSteps = [
      { text: '1.董事会预案', color: '#7c3aed' },
      { text: '2.股东大会批准', color: '#2563eb' },
      { text: '3.交易所受理', color: '#4f46e5' },
      { text: '4.上市委通过', color: '#d97706' },
      { text: '5.同意注册', color: '#059669' },
      { text: '6.发行公告', color: '#e11d48' }
    ];
    let flowX = headerX + 105;
    pipelineSteps.forEach((step, sIdx) => {
      ctx.fillStyle = step.color;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText(step.text, flowX, headerY + 76);
      flowX += ctx.measureText(step.text).width + 5;
      if (sIdx < pipelineSteps.length - 1) {
        ctx.fillStyle = '#6366f1';
        ctx.font = `bold 13px ${fontSans}`;
        ctx.fillText('→', flowX, headerY + 76);
        flowX += 18;
      }
    });
    ctx.fillStyle = colors.textSec;
    ctx.font = `500 13px ${fontSans}`;
    ctx.fillText(' · 全流程监测百元含权与抢权安全垫', flowX + 8, headerY + 76);

    // Timestamp & Scope Tags
    ctx.font = `500 14px ${fontSans}`;
    ctx.fillStyle = colors.textSec;
    ctx.fillText(`核验时效：${todayStr} ${timeStr}`, headerX + 30, headerY + 108);

    // -------------------------------------------------------------
    // PIPELINE 6-STAGE BREAKDOWN BAR (Y: 185 to 280)
    // -------------------------------------------------------------
    const stageY = 185;
    const stageH = 85;
    ctx.fillStyle = colors.cardBg;
    roundRect(ctx, headerX, stageY, headerW, stageH, 12);
    ctx.fill();
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const stageList = [
      { key: 'board_plan', label: '1. 董事会预案', color: '#7c3aed', bg: isDark ? '#2e1065' : '#f5f3ff', border: isDark ? '#5b21b6' : '#ddd6fe', text: isDark ? '#c4b5fd' : '#7c3aed' },
      { key: 'shareholder_approved', label: '2. 股东大会', color: '#2563eb', bg: isDark ? '#172554' : '#eff6ff', border: isDark ? '#1e40af' : '#bfdbfe', text: isDark ? '#93c5fd' : '#1d4ed8' },
      { key: 'exchange_accepted', label: '3. 交易所受理', color: '#4f46e5', bg: isDark ? '#1e1b4b' : '#eef2ff', border: isDark ? '#3730a3' : '#c7d2fe', text: isDark ? '#a5b4fc' : '#4338ca' },
      { key: 'committee_approved', label: '4. 上市委通过', color: '#d97706', bg: isDark ? '#451a03' : '#fffbeb', border: isDark ? '#92400e' : '#fde68a', text: isDark ? '#fcd34d' : '#b45309' },
      { key: 'csrc_registered', label: '5. 同意注册', color: '#059669', bg: isDark ? '#022c22' : '#ecfdf5', border: isDark ? '#065f46' : '#a7f3d0', text: isDark ? '#6ee7b7' : '#047857' },
      { key: 'issue_announced', label: '6. 发行公告', color: '#e11d48', bg: isDark ? '#4c0519' : '#fff1f2', border: isDark ? '#9f1239' : '#fecdd3', text: isDark ? '#fda4af' : '#be123c' }
    ];

    const stageBlockW = (headerW - 30) / 6;
    stageList.forEach((st, idx) => {
      const bx = headerX + 15 + idx * stageBlockW;
      const count = selectedBonds.filter(b => b.stage === st.key).length;
      
      // Stage block with distinct non-gray colored tint
      ctx.fillStyle = st.bg;
      roundRect(ctx, bx + 4, stageY + 12, stageBlockW - 8, stageH - 24, 8);
      ctx.fill();
      ctx.strokeStyle = st.border;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Colored left dot
      ctx.fillStyle = st.color;
      ctx.beginPath();
      ctx.arc(bx + 18, stageY + 32, 5, 0, Math.PI * 2);
      ctx.fill();

      // Title in vibrant stage color (NO gray!)
      ctx.fillStyle = st.text;
      ctx.font = `bold 12px ${fontSans}`;
      ctx.textAlign = 'left';
      ctx.fillText(st.label, bx + 28, stageY + 36);

      // Count in high contrast
      ctx.fillStyle = count > 0 ? st.text : colors.textMuted;
      ctx.font = `bold 19px ${fontSans}`;
      ctx.fillText(`${count}`, bx + 28, stageY + 62);

      ctx.fillStyle = colors.textSec;
      ctx.font = `500 11px ${fontSans}`;
      ctx.fillText('只标的', bx + 55, stageY + 62);
    });

    // -------------------------------------------------------------
    // INSTITUTIONAL COMPARISON DATA TABLE (Y: 290 onwards)
    // -------------------------------------------------------------
    const tableY = 290;
    const tableHeaderH = 46;
    const rowH = 56;
    const tableTotalH = tableHeaderH + bondCount * rowH;

    ctx.fillStyle = colors.cardBg;
    roundRect(ctx, headerX, tableY, headerW, tableTotalH, 12);
    ctx.fill();
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Table Header Background
    ctx.fillStyle = colors.tableHeaderBg;
    roundRect(ctx, headerX, tableY, headerW, tableHeaderH, 12);
    ctx.fill();
    // Re-draw border divider under header
    ctx.strokeStyle = colors.tableBorder;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headerX, tableY + tableHeaderH);
    ctx.lineTo(headerX + headerW, tableY + tableHeaderH);
    ctx.stroke();

    // Column Definitions: dynamic x offsets, comfortable widths, precise alignments
    const colDefs = [
      { key: 'idx', label: '#', w: 40, align: 'center' as CanvasTextAlign },
      { key: 'stock', label: '正股代码/名称', w: 140, align: 'left' as CanvasTextAlign },
      { key: 'bond', label: '转债简称/代码', w: 135, align: 'left' as CanvasTextAlign },
      { key: 'stage', label: '方案进展', w: 105, align: 'center' as CanvasTextAlign },
      { key: 'stageDate', label: '进展公告日', w: 105, align: 'center' as CanvasTextAlign },
      { key: 'subscribe', label: '申购日期/代码', w: 115, align: 'left' as CanvasTextAlign },
      { key: 'safetyMargin', label: '安全垫(%)', w: 100, align: 'center' as CanvasTextAlign },
      { key: 'size', label: '规模(亿)', w: 85, align: 'right' as CanvasTextAlign },
      { key: 'rating', label: '评级', w: 55, align: 'center' as CanvasTextAlign },
      { key: 'stockPrice', label: '最新正股价', w: 95, align: 'right' as CanvasTextAlign },
      { key: 'convertPrice', label: '转股价', w: 85, align: 'right' as CanvasTextAlign },
      { key: 'convertValue', label: '转股价值', w: 85, align: 'right' as CanvasTextAlign },
      { key: 'ration', label: '每股配售', w: 85, align: 'right' as CanvasTextAlign },
      { key: 'rights100', label: '百元含权', w: 110, align: 'right' as CanvasTextAlign },
      { key: 'oneHand', label: '一手党门槛', w: 135, align: 'center' as CanvasTextAlign }
    ];

    // Compute dynamic x coordinates for perfect horizontal alignment
    let currentX = headerX + 18;
    const cols = colDefs.map(c => {
      const colObj = { ...c, x: currentX };
      currentX += c.w;
      return colObj;
    });

    // Draw Column Headers
    ctx.fillStyle = colors.textMuted;
    ctx.font = `bold 13px ${fontSans}`;
    cols.forEach(col => {
      ctx.textAlign = col.align;
      const tx = col.align === 'center'
        ? col.x + col.w / 2
        : (col.align === 'right' ? col.x + col.w - 10 : col.x + 6);
      ctx.fillText(col.label, tx, tableY + 28);
    });

    // Draw Table Rows
    selectedBonds.forEach((bond, rIdx) => {
      const ry = tableY + tableHeaderH + rIdx * rowH;

      // Row alternate background
      if (rIdx % 2 === 1) {
        ctx.fillStyle = colors.tableStripeBg;
        ctx.fillRect(headerX + 1, ry, headerW - 2, rowH);
      }

      // If issue announced or high rights >= 10, soft highlight
      if (bond.rightsPer100 >= 10) {
        ctx.fillStyle = isDark || isNavy ? 'rgba(245, 158, 11, 0.08)' : 'rgba(254, 243, 199, 0.45)';
        ctx.fillRect(headerX + 1, ry, headerW - 2, rowH);
      }

      // Divider line
      if (rIdx < bondCount - 1) {
        ctx.strokeStyle = colors.tableBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(headerX, ry + rowH);
        ctx.lineTo(headerX + headerW, ry + rowH);
        ctx.stroke();
      }

      // # Index
      ctx.fillStyle = colors.textMuted;
      ctx.font = `bold 12px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(`${rIdx + 1}`, cols[0].x + cols[0].w / 2, ry + 33);

      // Stock Name & Code
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 14px ${fontSans}`;
      ctx.fillText(bond.stockName, cols[1].x + 6, ry + 25);
      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 12px ${fontSans}`;
      ctx.fillText(bond.stockCode, cols[1].x + 6, ry + 44);

      // Bond Name & Code
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 14px ${fontSans}`;
      ctx.fillText(bond.bondName, cols[2].x + 6, ry + 25);
      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 12px ${fontSans}`;
      ctx.fillText(bond.bondCode, cols[2].x + 6, ry + 44);

      // Progress Stage Badge - Vibrant, eye-catching distinct colors, NO gray
      const stageMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
        board_plan: {
          label: '董事会(1/6)',
          bg: isDark ? '#2e1065' : '#f5f3ff',
          text: isDark ? '#c4b5fd' : '#7c3aed',
          border: isDark ? '#5b21b6' : '#ddd6fe'
        },
        shareholder_approved: {
          label: '股东会(2/6)',
          bg: isDark ? '#172554' : '#eff6ff',
          text: isDark ? '#93c5fd' : '#1d4ed8',
          border: isDark ? '#1e40af' : '#bfdbfe'
        },
        exchange_accepted: {
          label: '交易所(3/6)',
          bg: isDark ? '#1e1b4b' : '#eef2ff',
          text: isDark ? '#a5b4fc' : '#4338ca',
          border: isDark ? '#3730a3' : '#c7d2fe'
        },
        committee_approved: {
          label: '上市委(4/6)',
          bg: isDark ? '#451a03' : '#fffbeb',
          text: isDark ? '#fcd34d' : '#b45309',
          border: isDark ? '#92400e' : '#fde68a'
        },
        csrc_registered: {
          label: '同意注册(5/6)',
          bg: isDark ? '#022c22' : '#ecfdf5',
          text: isDark ? '#6ee7b7' : '#047857',
          border: isDark ? '#065f46' : '#a7f3d0'
        },
        issue_announced: {
          label: '发行公告(6/6)',
          bg: isDark ? '#4c0519' : '#fff1f2',
          text: isDark ? '#fda4af' : '#be123c',
          border: isDark ? '#9f1239' : '#fecdd3'
        }
      };
      const stInfo = stageMap[bond.stage] || stageMap['board_plan'];

      const badgeW = 92;
      const badgeX = cols[3].x + (cols[3].w - badgeW) / 2;
      ctx.fillStyle = stInfo.bg;
      roundRect(ctx, badgeX, ry + 16, badgeW, 24, 5);
      ctx.fill();
      ctx.strokeStyle = stInfo.border;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = stInfo.text;
      ctx.font = `bold 11px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(stInfo.label, cols[3].x + cols[3].w / 2, ry + 32);

      // 进展公告日 (cols[4])
      const sDate = bond.stageDate || bond.latestUpdate || '-';
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 12px ${fontSans}`;
      ctx.textAlign = 'center';
      ctx.fillText(sDate, cols[4].x + cols[4].w / 2, ry + 33);

      // Subscribe Date / Code (cols[5])
      ctx.textAlign = 'left';
      ctx.fillStyle = bond.subscribeDate !== '待定' ? colors.accentRose : colors.textMuted;
      ctx.font = `bold 12px ${fontSans}`;
      ctx.fillText(bond.subscribeDate, cols[5].x + 6, ry + 25);
      ctx.fillStyle = colors.textMuted;
      ctx.font = `11px ${fontSans}`;
      ctx.fillText(bond.subscribeCode !== '-' ? `配售:${bond.subscribeCode}` : '待公告', cols[5].x + 6, ry + 43);

      // 安全垫 (%) (cols[6])
      ctx.textAlign = 'center';
      const sfVal = bond.safetyMargin > 0 ? `+${bond.safetyMargin.toFixed(2)}%` : '0.00%';
      ctx.fillStyle = bond.safetyMargin >= 3.0 ? colors.accentRose : (bond.safetyMargin >= 2.0 ? colors.accentAmber : colors.textMain);
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText(sfVal, cols[6].x + cols[6].w / 2, ry + 25);
      // Optional subtle note on recordDate or dynamic estimated listing price & gain
      ctx.fillStyle = colors.textMuted;
      ctx.font = `10px ${fontSans}`;
      const recSub = (bond.recordDate && bond.recordDate !== '-' && bond.recordDate !== '待定' && bond.recordDate !== '待公告')
        ? `登记:${bond.recordDate.replace(/^\d{4}-/, '')}`
        : `估¥${(bond.estimatedListingPrice || 125).toFixed(0)}(+${(bond.estimatedListingGain || 25).toFixed(0)}%)`;
      ctx.fillText(recSub, cols[6].x + cols[6].w / 2, ry + 43);

      // Issue Size (cols[7])
      ctx.textAlign = 'right';
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText(`${bond.issueSize.toFixed(2)}亿`, cols[7].x + cols[7].w - 10, ry + 33);

      // Rating (cols[8])
      ctx.textAlign = 'center';
      ctx.fillStyle = colors.textSec;
      ctx.font = `bold 12px ${fontSans}`;
      ctx.fillText(bond.rating, cols[8].x + cols[8].w / 2, ry + 33);

      // Stock Price & Chg% (cols[9])
      ctx.textAlign = 'right';
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText(`¥${bond.stockPrice.toFixed(2)}`, cols[9].x + cols[9].w - 10, ry + 24);
      const isUp = bond.stockChangePercent >= 0;
      ctx.fillStyle = isUp ? colors.accentRose : colors.accentEmerald;
      ctx.font = `bold 11px ${fontSans}`;
      ctx.fillText(`${isUp ? '+' : ''}${bond.stockChangePercent.toFixed(2)}%`, cols[9].x + cols[9].w - 10, ry + 43);

      // Convert Price (cols[10])
      ctx.textAlign = 'right';
      ctx.fillStyle = colors.textSec;
      ctx.font = `500 13px ${fontSans}`;
      ctx.fillText(`¥${bond.convertPrice.toFixed(2)}`, cols[10].x + cols[10].w - 10, ry + 33);

      // Convert Value (Parity) (cols[11])
      ctx.textAlign = 'right';
      ctx.fillStyle = colors.textSec;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText(`${bond.convertValue.toFixed(2)}%`, cols[11].x + cols[11].w - 10, ry + 33);

      // Ration Per Share (cols[12])
      ctx.textAlign = 'right';
      ctx.fillStyle = colors.textSec;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText(bond.rationPerShare > 0 ? `¥${bond.rationPerShare.toFixed(2)}` : '-', cols[12].x + cols[12].w - 10, ry + 33);

      // Rights Per 100 (Core Highlighted Column) (cols[13])
      ctx.textAlign = 'right';
      const isHighRights = bond.rightsPer100 >= 10;
      if (isHighRights) {
        ctx.fillStyle = colors.accentAmberLight;
        roundRect(ctx, cols[13].x + 5, ry + 12, cols[13].w - 10, 32, 6);
        ctx.fill();
        ctx.fillStyle = colors.highlightText;
        ctx.font = `bold 14px ${fontSans}`;
      } else {
        ctx.fillStyle = colors.textMain;
        ctx.font = `bold 13px ${fontSans}`;
      }
      ctx.fillText(`${bond.rightsPer100.toFixed(2)}元`, cols[13].x + cols[13].w - 12, ry + 33);

      // One Hand Required Shares (一手党门槛) (cols[14])
      ctx.textAlign = 'center';
      if (bond.sharesPerHand > 0) {
        ctx.fillStyle = colors.textMain;
        ctx.font = `bold 13px ${fontSans}`;
        ctx.fillText(`${bond.sharesPerHand} 股`, cols[14].x + cols[14].w / 2, ry + 24);
        ctx.fillStyle = colors.textMuted;
        ctx.font = `500 11px ${fontSans}`;
        ctx.fillText(`约 ${(bond.sharesPerHand * bond.stockPrice).toFixed(0)}元`, cols[14].x + cols[14].w / 2, ry + 43);
      } else {
        ctx.fillStyle = colors.textMuted;
        ctx.font = `bold 12px ${fontSans}`;
        ctx.fillText('-', cols[14].x + cols[14].w / 2, ry + 33);
      }
    });

    // -------------------------------------------------------------
    // SPOTLIGHT BOX: HIGH-RIGHTS OPPORTUNITY CALLOUT (Y: tableY + tableTotalH + 20)
    // -------------------------------------------------------------
    const spotY = tableY + tableTotalH + 20;
    const spotH = 135;

    ctx.fillStyle = colors.cardBg;
    roundRect(ctx, headerX, spotY, headerW, spotH, 12);
    ctx.fill();
    ctx.strokeStyle = colors.cardBorder;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Golden accent border strip
    ctx.fillStyle = colors.accentAmber;
    roundRect(ctx, headerX, spotY, 6, spotH, 3);
    ctx.fill();

    // Find best opportunity bond (highest rights per 100)
    const topBond = [...selectedBonds].sort((a, b) => b.rightsPer100 - a.rightsPer100)[0] || selectedBonds[0];

    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 16px ${fontSans}`;
    ctx.fillText(`💡 抢权配债核心亮点标的精要：${topBond?.stockName} (${topBond?.stockCode}) · ${topBond?.bondName}`, headerX + 25, spotY + 34);

    ctx.fillStyle = colors.textSec;
    ctx.font = `500 13px ${fontSans}`;
    ctx.fillText(
      `· 拟发行规模 ${topBond?.issueSize}亿元，百元股票含权率高达 ${topBond?.rightsPer100}元，每股配售额 ${topBond?.rationPerShare}元。`,
      headerX + 25,
      spotY + 64
    );
    ctx.fillText(
      `· 一手党配售门槛低：仅需持有约 ${topBond?.sharesPerHand}股（约 ${(topBond?.sharesPerHand * topBond?.stockPrice).toFixed(0)}元）即可获配1手转债，预估上市安全垫达 ${topBond?.safetyMargin}%。`,
      headerX + 25,
      spotY + 90
    );
    ctx.fillText(
      `· 项目投向与业务赋能：${topBond?.remark || '主营业务扩产及技术升级'}（所属行业：${topBond?.industry}，最新进度：${topBond?.stage}）。`,
      headerX + 25,
      spotY + 116
    );

    // -------------------------------------------------------------
    // OPERATIONAL RULES & CHECKLIST BOX (Y: spotY + spotH + 18)
    // -------------------------------------------------------------
    const rulesY = spotY + spotH + 18;
    const rulesH = 120;

    ctx.fillStyle = colors.itemBg;
    roundRect(ctx, headerX, rulesY, headerW, rulesH, 12);
    ctx.fill();
    ctx.strokeStyle = colors.itemBorder;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = colors.textMain;
    ctx.font = `bold 14px ${fontSans}`;
    ctx.fillText('📋 抢权配债实战操盘指引与风险控制守则', headerX + 22, rulesY + 28);

    ctx.fillStyle = colors.textMuted;
    ctx.font = `500 12px ${fontSans}`;
    ctx.fillText(
      '1. 股权登记日(T-1日)：必须在股权登记日收盘时持有正股，才享有可转债优先配售权；T日(申购日)可卖出正股，仍享有配售资格。',
      headerX + 22,
      rulesY + 54
    );
    ctx.fillText(
      '2. 一手党精确配售套利：沪深市场采用“精确配售舍去零头”与四舍五入规则，利用每股配售额逆推最小持股手数，以极低资金博取1手转债上市收益。',
      headerX + 22,
      rulesY + 76
    );
    ctx.fillText(
      '3. 安全垫与正股对冲：含权率高于10元/百元市值的标的具备更厚安全垫；关注市场走势与大盘情绪，避免因正股单日剧烈回调吞噬配债收益。',
      headerX + 22,
      rulesY + 98
    );

    // -------------------------------------------------------------
    // FOOTER WATERMARK & COPYRIGHT
    // -------------------------------------------------------------
    const footerY = height - 55;
    ctx.strokeStyle = colors.divider;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(headerX, footerY - 15);
    ctx.lineTo(headerX + headerW, footerY - 15);
    ctx.stroke();

    ctx.fillStyle = colors.accentEmerald;
    ctx.beginPath();
    ctx.arc(headerX + 10, footerY + 12, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = colors.textMuted;
    ctx.font = `500 13px ${fontSans}`;
    ctx.textAlign = 'left';
    ctx.fillText('数据来源：沪深北交易所披露公告 & 方案进展全景跟踪 · 权威量化核验', headerX + 25, footerY + 17);

    ctx.textAlign = 'right';
    if (watermarkMode === 'with_watermark') {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `bold 14px ${fontSans}`;
      ctx.fillText(`${watermarkText} · 原创研报出品`, headerX + headerW, footerY + 17);
    } else {
      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 13px ${fontSans}`;
      ctx.fillText('公开市场拟发行数据 · 纯净导出', headerX + headerW, footerY + 17);
    }
  }

  // =========================================================================
  // TEMPLATE 2: SINGLE BOND DEEP-DIVE ALLOTMENT CARD
  // =========================================================================
  else {
    const bond = singleBond || selectedBonds[0];
    if (bond) {
      const cardX = 50;
      const cardY = 40;
      const cardW = width - 100;

      // Header Banner
      const headerH = 140;
      ctx.fillStyle = colors.cardBg;
      roundRect(ctx, cardX, cardY, cardW, headerH, 14);
      ctx.fill();
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = colors.accentRose;
      roundRect(ctx, cardX, cardY, 8, headerH, 4);
      ctx.fill();

      // Stock and Bond Big Title
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 32px ${fontSans}`;
      ctx.fillText(`${bond.stockName} (${bond.stockCode})`, cardX + 30, cardY + 50);

      ctx.fillStyle = colors.accentRose;
      ctx.font = `bold 22px ${fontSans}`;
      ctx.fillText(`拟发行转债：${bond.bondName} · 代码 ${bond.bondCode}`, cardX + 30, cardY + 90);

      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 14px ${fontSans}`;
      ctx.fillText(`行业：${bond.industry} · 评级：${bond.rating} · 拟发行规模：${bond.issueSize}亿元 · 最新更新：${bond.latestUpdate}`, cardX + 30, cardY + 120);

      // Big Rights Badge on Right
      const rightX = cardX + cardW - 320;
      ctx.fillStyle = colors.accentAmberLight;
      roundRect(ctx, rightX, cardY + 20, 290, 100, 10);
      ctx.fill();
      ctx.strokeStyle = colors.accentAmber;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = colors.accentAmber;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText('百元股票含权率 (核心指标)', rightX + 20, cardY + 50);

      ctx.font = `bold 36px ${fontSans}`;
      ctx.fillText(`${bond.rightsPer100.toFixed(2)}`, rightX + 20, cardY + 98);
      ctx.font = `bold 16px ${fontSans}`;
      ctx.fillText('元 / 百元市值', rightX + 175, cardY + 98);

      // 4 Key Metric Metric Blocks (Y: 200)
      const metricY = 200;
      const metricH = 105;
      const mW = (cardW - 45) / 4;

      const metricList = [
        { label: '最新正股价', value: `¥${bond.stockPrice.toFixed(2)}`, sub: `涨跌: ${bond.stockChangePercent >= 0 ? '+' : ''}${bond.stockChangePercent}%`, color: bond.stockChangePercent >= 0 ? colors.accentRose : colors.accentEmerald },
        { label: '每股配售额', value: `¥${bond.rationPerShare.toFixed(2)}`, sub: '元/股 (优先配售)', color: colors.accentBlue },
        { label: '一手党所需股数', value: `${bond.sharesPerHand} 股`, sub: `约 ${(bond.sharesPerHand * bond.stockPrice).toFixed(0)}元市值`, color: colors.accentAmber },
        { label: '预估抢权安全垫', value: `${bond.safetyMargin.toFixed(2)}%`, sub: '按上市125元测算', color: colors.accentEmerald }
      ];

      metricList.forEach((m, idx) => {
        const mx = cardX + idx * (mW + 15);
        ctx.fillStyle = colors.cardBg;
        roundRect(ctx, mx, metricY, mW, metricH, 12);
        ctx.fill();
        ctx.strokeStyle = colors.cardBorder;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = colors.textMuted;
        ctx.font = `500 13px ${fontSans}`;
        ctx.textAlign = 'left';
        ctx.fillText(m.label, mx + 20, metricY + 32);

        ctx.fillStyle = m.color;
        ctx.font = `bold 24px ${fontSans}`;
        ctx.fillText(m.value, mx + 20, metricY + 68);

        ctx.fillStyle = colors.textSec;
        ctx.font = `500 12px ${fontSans}`;
        ctx.fillText(m.sub, mx + 20, metricY + 92);
      });

      // 6-Stage Issuance Pipeline Timeline (Y: 330)
      const timeY = 325;
      const timeH = 160;
      ctx.fillStyle = colors.cardBg;
      roundRect(ctx, cardX, timeY, cardW, timeH, 12);
      ctx.fill();
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 16px ${fontSans}`;
      ctx.fillText('📅 转债发行方案进展审核历史与时间轴', cardX + 25, timeY + 35);

      const timelineSteps = [
        {
          name: '1. 董事会预案',
          date: bond.history.boardDate || '未公布',
          done: !!bond.history.boardDate,
          color: '#7c3aed',
          bg: isDark ? '#2e1065' : '#f5f3ff',
          text: isDark ? '#c4b5fd' : '#7c3aed',
          border: isDark ? '#5b21b6' : '#ddd6fe'
        },
        {
          name: '2. 股东大会批准',
          date: bond.history.shareholderDate || '未公布',
          done: !!bond.history.shareholderDate,
          color: '#2563eb',
          bg: isDark ? '#172554' : '#eff6ff',
          text: isDark ? '#93c5fd' : '#1d4ed8',
          border: isDark ? '#1e40af' : '#bfdbfe'
        },
        {
          name: '3. 交易所受理',
          date: bond.history.exchangeDate || '审核中',
          done: !!bond.history.exchangeDate,
          color: '#4f46e5',
          bg: isDark ? '#1e1b4b' : '#eef2ff',
          text: isDark ? '#a5b4fc' : '#4338ca',
          border: isDark ? '#3730a3' : '#c7d2fe'
        },
        {
          name: '4. 上市委审议',
          date: bond.history.committeeDate || '待上会',
          done: !!bond.history.committeeDate,
          color: '#d97706',
          bg: isDark ? '#451a03' : '#fffbeb',
          text: isDark ? '#fcd34d' : '#b45309',
          border: isDark ? '#92400e' : '#fde68a'
        },
        {
          name: '5. 证监会注册',
          date: bond.history.regDate || '待注册',
          done: !!bond.history.regDate,
          color: '#059669',
          bg: isDark ? '#022c22' : '#ecfdf5',
          text: isDark ? '#6ee7b7' : '#047857',
          border: isDark ? '#065f46' : '#a7f3d0'
        },
        {
          name: '6. 刊登发行公告',
          date: bond.history.announceDate || '待公告',
          done: !!bond.history.announceDate,
          color: '#e11d48',
          bg: isDark ? '#4c0519' : '#fff1f2',
          text: isDark ? '#fda4af' : '#be123c',
          border: isDark ? '#9f1239' : '#fecdd3'
        }
      ];

      const tW = (cardW - 50) / 6;
      timelineSteps.forEach((st, idx) => {
        const tx = cardX + 25 + idx * tW;
        const ty = timeY + 60;

        ctx.fillStyle = st.done ? st.bg : (isDark ? '#1e293b' : '#f8fafc');
        roundRect(ctx, tx + 2, ty, tW - 6, 82, 8);
        ctx.fill();
        ctx.strokeStyle = st.done ? st.border : (isDark ? '#334155' : '#e2e8f0');
        ctx.lineWidth = st.done ? 1.5 : 1;
        ctx.stroke();

        // Step Name in vivid color (NO gray!)
        ctx.fillStyle = st.text;
        ctx.font = `bold 12px ${fontSans}`;
        ctx.fillText(st.name, tx + 10, ty + 28);

        // Date / Status in high contrast
        ctx.fillStyle = st.done ? st.color : colors.textSec;
        ctx.font = `bold 13px ${fontSans}`;
        ctx.fillText(st.date, tx + 10, ty + 50);

        // Status pill indicator
        const isCurrentActive = idx + 1 === bond.stageStep;
        const statusLabel = st.done ? '✓ 已达成' : (isCurrentActive ? '● 进行中' : '○ 待审批');
        ctx.fillStyle = st.done ? st.color : (isCurrentActive ? '#d97706' : colors.textMuted);
        ctx.font = `bold 11px ${fontSans}`;
        ctx.fillText(statusLabel, tx + 10, ty + 70);
      });

      // Simulation Allotment & Return Matrix Table (Y: 510)
      const matrixY = 505;
      const matrixH = 340;
      ctx.fillStyle = colors.cardBg;
      roundRect(ctx, cardX, matrixY, cardW, matrixH, 12);
      ctx.fill();
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const estPrice = bond.estimatedListingPrice || 125;
      const estGain = bond.estimatedListingGain !== undefined ? bond.estimatedListingGain : (estPrice - 100);

      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 16px ${fontSans}`;
      ctx.fillText(`📊 持股抢权配债精准测算收益表 (正常估算上市价 ¥${estPrice.toFixed(1)}，涨幅 +${estGain.toFixed(1)}%)`, cardX + 25, matrixY + 36);

      // Table inside
      const matCols = [
        { label: '持股规模', w: 180 },
        { label: '持有股票市值', w: 220 },
        { label: '可获配转债额度', w: 220 },
        { label: '实际配售手数(张)', w: 220 },
        { label: '配债缴款金额', w: 180 },
        { label: '预估首日盈利', w: 180 },
        { label: '正股安全垫', w: 160 }
      ];

      const simRows = [
        { label: `一手党 (${bond.sharesPerHand}股)`, shares: bond.sharesPerHand },
        { label: '500股', shares: 500 },
        { label: '1,000股', shares: 1000 },
        { label: '2,000股', shares: 2000 },
        { label: '5,000股', shares: 5000 }
      ];

      const thY = matrixY + 55;
      ctx.fillStyle = colors.tableHeaderBg;
      roundRect(ctx, cardX + 20, thY, cardW - 40, 40, 8);
      ctx.fill();

      let cx = cardX + 35;
      ctx.fillStyle = colors.textMuted;
      ctx.font = `bold 13px ${fontSans}`;
      matCols.forEach(col => {
        ctx.fillText(col.label, cx, thY + 25);
        cx += col.w;
      });

      simRows.forEach((row, rIdx) => {
        const ry = thY + 45 + rIdx * 46;
        const mv = row.shares * bond.stockPrice;
        const allotYuan = row.shares * bond.rationPerShare;
        const hands = Math.max(1, Math.round(allotYuan / 1000));
        const bondsCount = hands * 10;
        const cost = bondsCount * 100;
        const profit = bondsCount * (estPrice - 100);
        const cushion = mv > 0 ? ((profit / mv) * 100).toFixed(2) : '0';

        if (rIdx % 2 === 1) {
          ctx.fillStyle = colors.tableStripeBg;
          ctx.fillRect(cardX + 20, ry - 5, cardW - 40, 44);
        }

        let rx = cardX + 35;
        ctx.fillStyle = colors.textMain;
        ctx.font = `bold 13px ${fontSans}`;
        ctx.fillText(row.label, rx, ry + 24); rx += matCols[0].w;

        ctx.fillStyle = colors.textSec;
        ctx.font = `500 13px ${fontSans}`;
        ctx.fillText(`¥${mv.toFixed(0)}`, rx, ry + 24); rx += matCols[1].w;
        ctx.fillText(`¥${allotYuan.toFixed(1)}`, rx, ry + 24); rx += matCols[2].w;

        ctx.fillStyle = colors.textMain;
        ctx.font = `bold 13px ${fontSans}`;
        ctx.fillText(`${hands} 手 (${bondsCount}张)`, rx, ry + 24); rx += matCols[3].w;

        ctx.fillStyle = colors.textSec;
        ctx.fillText(`¥${cost}`, rx, ry + 24); rx += matCols[4].w;

        ctx.fillStyle = colors.accentRose;
        ctx.font = `bold 14px ${fontSans}`;
        ctx.fillText(`+¥${profit}`, rx, ry + 24); rx += matCols[5].w;

        ctx.fillStyle = colors.accentEmerald;
        ctx.font = `bold 14px ${fontSans}`;
        ctx.fillText(`${cushion}%`, rx, ry + 24);
      });

      // Remark and Business Insight Box (Y: 865)
      const remY = 865;
      const remH = 140;
      ctx.fillStyle = colors.cardBg;
      roundRect(ctx, cardX, remY, cardW, remH, 12);
      ctx.fill();
      ctx.strokeStyle = colors.cardBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 15px ${fontSans}`;
      ctx.fillText('💡 资金投向与量化核心看点', cardX + 25, remY + 34);

      ctx.fillStyle = colors.textSec;
      ctx.font = `500 13px ${fontSans}`;
      ctx.fillText(`· 投向亮点：${bond.remark || '公司主营业务技术升级与智能化生产基地建设'}`, cardX + 25, remY + 65);
      ctx.fillText(`· 正股估值与弹性：当前正股转股价值为 ${bond.convertValue.toFixed(2)}%，转股价¥${bond.convertPrice.toFixed(2)}。`, cardX + 25, remY + 92);
      ctx.fillText(`· 参与策略建议：适合在证监会注册批文落地后密切盯盘，在股权登记日前逢低分批布局，登记日收盘持仓锁定配额。`, cardX + 25, remY + 119);

      // Operational Rule Strip (Y: 1025)
      const opY = 1025;
      const opH = 95;
      ctx.fillStyle = colors.itemBg;
      roundRect(ctx, cardX, opY, cardW, opH, 10);
      ctx.fill();

      ctx.fillStyle = colors.textMain;
      ctx.font = `bold 13px ${fontSans}`;
      ctx.fillText('📌 抢权配债必知纪律：', cardX + 22, opY + 28);
      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 12px ${fontSans}`;
      ctx.fillText('1. 股权登记日(T-1)收盘必须持股方可获得配债权，T日开盘即可卖出正股，配债权不受影响。', cardX + 22, opY + 52);
      ctx.fillText('2. 获配转债需在T日通过交易软件的“配售/缴款”功能手动完成资金认购缴款，逾期视作自动放弃。', cardX + 22, opY + 74);

      // Single Card Footer (Y: height - 55)
      const sFooterY = height - 55;
      ctx.strokeStyle = colors.divider;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cardX, sFooterY - 15);
      ctx.lineTo(cardX + cardW, sFooterY - 15);
      ctx.stroke();

      ctx.fillStyle = colors.textMuted;
      ctx.font = `500 13px ${fontSans}`;
      ctx.textAlign = 'left';
      ctx.fillText(`核验时效：${todayStr} ${timeStr} · 数据源：交易所披露公告 & 方案进展全景跟踪 · 权威量化核验`, cardX + 15, sFooterY + 16);

      ctx.textAlign = 'right';
      if (watermarkMode === 'with_watermark') {
        ctx.fillStyle = colors.textMuted;
        ctx.font = `bold 14px ${fontSans}`;
        ctx.fillText(`${watermarkText} · 原创研报出品`, cardX + cardW, sFooterY + 16);
      } else {
        ctx.fillStyle = colors.textMuted;
        ctx.font = `500 13px ${fontSans}`;
        ctx.fillText('公开市场拟发行数据 · 纯净导出', cardX + cardW, sFooterY + 16);
      }
    }
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

    const stepX = 300;
    const stepY = 190;
    for (let x = -width; x < width * 2; x += stepX) {
      for (let y = -height; y < height * 2; y += stepY) {
        ctx.fillText(watermarkText, x, y);
      }
    }
    ctx.restore();
  }

  return canvas;
}
