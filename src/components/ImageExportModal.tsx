import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Share2, 
  Eye, 
  EyeOff,
  Calendar,
  Clock,
  Palette,
  FileImage,
  Flame,
  BarChart2,
  PieChart,
  Activity,
  Layers as LayersIcon,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Image as ImageIcon,
  FileCheck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SectorFundFlow, IndexQuote, MarketOverviewData } from '../types/market';
import { SHENWAN_31_INDUSTRIES_VALUATION } from '../data/industryValuationData';
import { ALL_ETF_VALUATION_LIST } from '../data/etfValuationData';
import { IndustryValuationItem } from '../types/industryValuation';
import { ETFValuationItem } from '../types/etfValuation';
import { renderReportToCanvas, ReportThemeMode } from '../utils/reportCanvasRenderer';
import { computeHierarchicalTreemap, getTreemapStockColor } from '../utils/marketTreemapLayout';
import { getRealtimeDateString, getRealtimeTimeString } from '../utils/marketDateUtils';

export const TEMPLATE_NAME_MAP: Record<ExportTemplateType, string> = {
  market_treemap: '全市场板块个股树状热力图',
  industry_valuation: '31个行业指数估值全景',
  etf_valuation: '全市场ETF基金估值全景',
  market_overview: '大盘全景总览',
  gainers_losers: '大盘全景领涨领跌榜',
  fundflow_panorama: '行业主力资金全景',
  sector_deepdive: '单板块量化深度研报',
  sentiment_ladder: '情绪与连板天梯复盘',
  gold_macro: '黄金大宗与金矿联动',
  current_snapshot: '市场快照'
};

export const THEME_NAME_MAP: Record<ReportThemeMode, string> = {
  light: '研报白',
  dark: '夜间黑',
  classic: '牛皮纸',
  navy: '机构蓝'
};

export type ClarityTier = '2k' | '4k' | '8k';

export interface ClarityConfigItem {
  id: ClarityTier;
  scale: number;
  label: string;
  tag: string;
  portraitRes: string;
  widescreenRes: string;
  desc: string;
  isRecommended?: boolean;
}

export const CLARITY_CONFIG: Record<ClarityTier, ClarityConfigItem> = {
  '2k': {
    id: '2k',
    scale: 2.0,
    label: '2K 视网膜',
    tag: '2.0x 锐化',
    portraitRes: '2400×3520',
    widescreenRes: '3200×1920',
    desc: '适合微信私聊/社群秒发，体积约1.5MB且边缘锐利'
  },
  '4k': {
    id: '4k',
    scale: 3.0,
    label: '4K 旗舰极清',
    tag: '3.0x 推荐',
    portraitRes: '3600×5280',
    widescreenRes: '4800×2880',
    desc: '近2000万像素，放大300%无任何毛刺，研报推荐',
    isRecommended: true
  },
  '8k': {
    id: '8k',
    scale: 4.0,
    label: '8K 印刷母版',
    tag: '4.0x 母版',
    portraitRes: '4800×7040',
    widescreenRes: '6400×3840',
    desc: '超3300万像素，专供投行路演、4K/8K投屏与出版印刷'
  }
};

export type ExportTemplateType = 
  | 'market_treemap'
  | 'industry_valuation'
  | 'etf_valuation'
  | 'market_overview' 
  | 'fundflow_panorama' 
  | 'gainers_losers' 
  | 'sector_deepdive' 
  | 'sentiment_ladder' 
  | 'gold_macro' 
  | 'current_snapshot';

export interface ViewContextItem {
  id: string;
  name: string;
  shortName: string;
  badge: string;
  defaultTemplate: ExportTemplateType;
  allowedTemplates: ExportTemplateType[];
  description: string;
  isolationNotice: string;
}

export const VIEW_CONTEXT_CONFIGS: Record<string, ViewContextItem> = {
  all: {
    id: 'all',
    name: '全部板块选项',
    shortName: '全部板块',
    badge: '综合自由选',
    defaultTemplate: 'market_overview',
    allowedTemplates: [
      'etf_valuation',
      'industry_valuation',
      'market_treemap',
      'fundflow_panorama',
      'gainers_losers',
      'market_overview',
      'sector_deepdive',
      'sentiment_ladder',
      'gold_macro'
    ],
    description: '综合导出中心，可自由切换任一板块专属数据源',
    isolationNotice: '🔒 数据源隔离机制保障：根据您选中的板块模型载入特定数据源，禁止跨板块串联'
  },
  etf_valuation: {
    id: 'etf_valuation',
    name: 'ETF基金估值',
    shortName: 'ETF估值',
    badge: '宽基/策略/行业/主题/全球',
    defaultTemplate: 'etf_valuation',
    allowedTemplates: ['etf_valuation'],
    description: '全市场40+只核心ETF估值分位、市盈率与折溢价专属数据源',
    isolationNotice: '🔒 数据源严格隔离：当前仅使用【ETF基金估值模型】数据，已排除资金流看板、大盘指数等数据，禁止跨视图数据污染'
  },
  industry_valuation: {
    id: 'industry_valuation',
    name: '31个行业估值',
    shortName: '行业估值',
    badge: '申万一级估值',
    defaultTemplate: 'industry_valuation',
    allowedTemplates: ['industry_valuation'],
    description: '申万31个行业PE/PB/ROE及历史十年百分位数专属数据源',
    isolationNotice: '🔒 数据源严格隔离：当前仅使用【31行业估值模型】数据，已排除资金流看板、大盘指数等数据，禁止跨视图数据污染'
  },
  heatmap: {
    id: 'heatmap',
    name: '全市场个股热力图',
    shortName: '个股热力图',
    badge: '树状热力图',
    defaultTemplate: 'market_treemap',
    allowedTemplates: ['market_treemap'],
    description: '全市场核心行业与个股等比树状热力图数据源',
    isolationNotice: '🔒 数据源严格隔离：当前仅使用【全市场个股热力图】数据源，生成纯净等比树图快照'
  },
  fundflow: {
    id: 'fundflow',
    name: '资金流看板 (核心)',
    shortName: '资金流看板',
    badge: '主力流向',
    defaultTemplate: 'fundflow_panorama',
    allowedTemplates: ['fundflow_panorama', 'sector_deepdive'],
    description: '超大单与主力机构资金多空双向净流入/流出对峙数据源',
    isolationNotice: '🔒 数据源严格隔离：当前仅使用【主力资金流向看板】数据源，与申万估值表、热力图完全隔离'
  },
  overview: {
    id: 'overview',
    name: '大盘全景',
    shortName: '大盘全景',
    badge: '核心指数',
    defaultTemplate: 'gainers_losers',
    allowedTemplates: ['gainers_losers', 'market_overview'],
    description: '8大核心指数矩阵、成交量能与领涨领跌对照梯队数据源',
    isolationNotice: '🔒 数据源严格隔离：当前仅使用【大盘全景与指数】数据源'
  },
  sentiment: {
    id: 'sentiment',
    name: '市场情绪',
    shortName: '市场情绪',
    badge: '连板天梯',
    defaultTemplate: 'sentiment_ladder',
    allowedTemplates: ['sentiment_ladder'],
    description: '涨跌停比例、短线打板晋级率与连板梯队数据源',
    isolationNotice: '🔒 数据源严格隔离：当前仅使用【市场情绪与连板】专属数据源'
  },
  gold: {
    id: 'gold',
    name: '黄金大宗',
    shortName: '黄金大宗',
    badge: '金矿联动',
    defaultTemplate: 'gold_macro',
    allowedTemplates: ['gold_macro'],
    description: '外盘COMEX/现货金与A股金矿采选股联动数据源',
    isolationNotice: '🔒 数据源严格隔离：当前仅使用【黄金大宗与金矿】专属数据源'
  },
  sector_deepdive: {
    id: 'sector_deepdive',
    name: '单板块深度研报',
    shortName: '单板块',
    badge: '量化画像',
    defaultTemplate: 'sector_deepdive',
    allowedTemplates: ['sector_deepdive'],
    description: '针对指定单一板块的量化四维画像与领涨标的数据源',
    isolationNotice: '🔒 数据源严格隔离：仅围绕选定行业板块生成独立研报画像，杜绝跨板块混淆'
  }
};

interface ImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: SectorFundFlow[];
  indices: IndexQuote[];
  overviewData: MarketOverviewData;
  initialSector?: SectorFundFlow | null;
  initialTemplate?: ExportTemplateType;
  currentViewContext?: string;
  selectedETFs?: ETFValuationItem[];
  selectedIndustries?: IndustryValuationItem[];
}

export const ImageExportModal: React.FC<ImageExportModalProps> = ({
  isOpen,
  onClose,
  sectors,
  indices,
  overviewData,
  initialSector,
  initialTemplate,
  currentViewContext,
  selectedETFs,
  selectedIndustries
}) => {
  // Context state from props to ensure strict data source isolation
  const [activeContext, setActiveContext] = useState<string>(() => {
    if (currentViewContext && VIEW_CONTEXT_CONFIGS[currentViewContext]) {
      return currentViewContext;
    }
    if (initialTemplate === 'etf_valuation') return 'etf_valuation';
    if (initialTemplate === 'industry_valuation') return 'industry_valuation';
    if (initialTemplate === 'market_treemap') return 'heatmap';
    if (initialTemplate === 'fundflow_panorama') return 'fundflow';
    if (initialTemplate === 'gainers_losers' || initialTemplate === 'market_overview') return 'overview';
    if (initialTemplate === 'sentiment_ladder') return 'sentiment';
    if (initialTemplate === 'gold_macro') return 'gold';
    if (initialTemplate === 'sector_deepdive' || initialSector) return 'sector_deepdive';
    return 'all';
  });

  const [template, setTemplate] = useState<ExportTemplateType>(() => {
    if (initialTemplate) return initialTemplate;
    if (currentViewContext && VIEW_CONTEXT_CONFIGS[currentViewContext]) {
      return VIEW_CONTEXT_CONFIGS[currentViewContext].defaultTemplate;
    }
    return 'market_overview';
  });
  const [selectedSector, setSelectedSector] = useState<SectorFundFlow>(() => initialSector || sectors[0] || {} as SectorFundFlow);

  // Selection scope for ETF Valuation: whether to export only selected ETFs
  const [useOnlySelectedETFs, setUseOnlySelectedETFs] = useState<boolean>(() => {
    return Boolean(selectedETFs && selectedETFs.length > 0);
  });

  // Sync when selectedETFs or isOpen changes
  useEffect(() => {
    if (isOpen && selectedETFs && selectedETFs.length > 0) {
      setUseOnlySelectedETFs(true);
      setPreviewImageUrl(null);
    }
  }, [isOpen, selectedETFs]);

  // Selection scope for Industry Valuation: whether to export only selected Industries
  const [useOnlySelectedIndustries, setUseOnlySelectedIndustries] = useState<boolean>(() => {
    return Boolean(selectedIndustries && selectedIndustries.length > 0);
  });

  // Sync when selectedIndustries or isOpen changes
  useEffect(() => {
    if (isOpen && selectedIndustries && selectedIndustries.length > 0) {
      setUseOnlySelectedIndustries(true);
      setPreviewImageUrl(null);
    }
  }, [isOpen, selectedIndustries]);
  
  // Watermark switch: with watermark vs no watermark
  const [watermarkMode, setWatermarkMode] = useState<'with_watermark' | 'no_watermark'>('with_watermark');
  const [watermarkText, setWatermarkText] = useState<string>('公众号：我爱这young');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.16);
  const [watermarkStyle, setWatermarkStyle] = useState<'grid' | 'corner' | 'both'>('both');
  const [themeMode, setThemeMode] = useState<ReportThemeMode>('light');
  const [clarity, setClarity] = useState<ClarityTier>('4k');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<{ type: 'success' | 'fallback' | 'info'; message: string } | null>(null);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // New: Image Preview Before Export states
  const [previewTab, setPreviewTab] = useState<'image' | 'design'>('image');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeKb: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isThumbnailExpanded, setIsThumbnailExpanded] = useState<boolean>(true);

  const isWidescreen = template === 'fundflow_panorama' || template === 'gainers_losers' || template === 'market_treemap' || template === 'industry_valuation' || template === 'etf_valuation' || template === 'current_snapshot';
  const posterRef = useRef<HTMLDivElement>(null);

  // Generate date strings
  const todayStr = getRealtimeDateString();
  const nowTimeStr = getRealtimeTimeString();

  // Pure isolated report data generator - STRICTLY PREVENTS ANY CROSS-VIEW DATA POLLUTION!
  const getIsolatedReportData = useCallback(() => {
    if (template === 'etf_valuation') {
      const activeETFs = (useOnlySelectedETFs && selectedETFs && selectedETFs.length > 0)
        ? selectedETFs
        : ALL_ETF_VALUATION_LIST;

      return {
        template: 'etf_valuation' as ExportTemplateType,
        industryValuationData: undefined,
        etfValuationData: activeETFs,
        // STRICT ISOLATION: empty sectors and indices so fundflow or overview NEVER leaks into ETF valuation canvas!
        sectors: [] as SectorFundFlow[],
        indices: [] as IndexQuote[],
        overviewData,
        selectedSector: undefined
      };
    }

    if (template === 'industry_valuation') {
      const activeIndustries = (useOnlySelectedIndustries && selectedIndustries && selectedIndustries.length > 0)
        ? selectedIndustries
        : SHENWAN_31_INDUSTRIES_VALUATION;

      return {
        template: 'industry_valuation' as ExportTemplateType,
        industryValuationData: activeIndustries,
        etfValuationData: undefined,
        // STRICT ISOLATION: empty sectors and indices so fundflow or overview NEVER leaks into valuation canvas!
        sectors: [] as SectorFundFlow[],
        indices: [] as IndexQuote[],
        overviewData,
        selectedSector: undefined
      };
    }

    if (template === 'market_treemap') {
      return {
        template: 'market_treemap' as ExportTemplateType,
        industryValuationData: undefined,
        etfValuationData: undefined,
        sectors,
        indices,
        overviewData,
        selectedSector: undefined
      };
    }

    if (template === 'fundflow_panorama') {
      return {
        template: 'fundflow_panorama' as ExportTemplateType,
        industryValuationData: undefined,
        etfValuationData: undefined,
        sectors,
        indices: [],
        overviewData,
        selectedSector: undefined
      };
    }

    if (template === 'gainers_losers') {
      return {
        template: 'gainers_losers' as ExportTemplateType,
        industryValuationData: undefined,
        etfValuationData: undefined,
        sectors,
        indices,
        overviewData,
        selectedSector: undefined
      };
    }

    if (template === 'sector_deepdive') {
      return {
        template: 'sector_deepdive' as ExportTemplateType,
        industryValuationData: undefined,
        etfValuationData: undefined,
        sectors,
        indices,
        overviewData,
        selectedSector: selectedSector || sectors[0]
      };
    }

    return {
      template,
      industryValuationData: undefined,
      etfValuationData: undefined,
      sectors,
      indices,
      overviewData,
      selectedSector: selectedSector || undefined
    };
  }, [template, sectors, indices, overviewData, selectedSector, useOnlySelectedETFs, selectedETFs, useOnlySelectedIndustries, selectedIndustries]);

  // Generate high-resolution crystal-clear image via native Canvas 2D (<15ms, 100% reliable)
  const generateImagePreview = useCallback((forceRegenerate = false, overrideClarity?: ClarityTier): string | null => {
    if (previewImageUrl && !forceRegenerate && !overrideClarity) return previewImageUrl;

    setIsGeneratingPreview(true);
    try {
      const activeClarity = overrideClarity || clarity;
      const config = CLARITY_CONFIG[activeClarity] || CLARITY_CONFIG['4k'];
      const isolated = getIsolatedReportData();
      const canvas = renderReportToCanvas({
        template: isolated.template,
        sectors: isolated.sectors,
        indices: isolated.indices,
        overviewData: isolated.overviewData,
        selectedSector: isolated.selectedSector,
        industryValuationData: isolated.industryValuationData,
        etfValuationData: (isolated as any).etfValuationData,
        themeMode,
        watermarkMode,
        watermarkText,
        watermarkOpacity,
        watermarkStyle,
        todayStr,
        scale: config.scale
      });

      const dataUrl = canvas.toDataURL('image/png', 1.0);
      if (dataUrl && dataUrl.length > 2000) {
        const estimatedKb = Math.round((dataUrl.length * 3) / 4 / 1024);
        setImageMeta({
          width: canvas.width,
          height: canvas.height,
          sizeKb: estimatedKb
        });
        setPreviewImageUrl(dataUrl);
        return dataUrl;
      }
      return null;
    } catch (err) {
      console.error('Failed to generate image preview:', err);
      return null;
    } finally {
      setIsGeneratingPreview(false);
    }
  }, [getIsolatedReportData, themeMode, watermarkMode, watermarkText, watermarkOpacity, watermarkStyle, previewImageUrl, todayStr, clarity]);

  useEffect(() => {
    if (currentViewContext && VIEW_CONTEXT_CONFIGS[currentViewContext]) {
      setActiveContext(currentViewContext);
      if (!initialTemplate) {
        setTemplate(VIEW_CONTEXT_CONFIGS[currentViewContext].defaultTemplate);
      }
    }
  }, [currentViewContext]);

  useEffect(() => {
    if (initialTemplate) {
      setTemplate(initialTemplate);
    } else if (initialSector) {
      setSelectedSector(initialSector);
      setTemplate('sector_deepdive');
    }
  }, [initialSector, initialTemplate, isOpen]);

  // Instantly generate preview on open or parameter change (no lag, no hang)
  useEffect(() => {
    if (!isOpen) return;
    generateImagePreview(true);
  }, [isOpen, template, watermarkMode, watermarkText, watermarkOpacity, watermarkStyle, themeMode, clarity, selectedSector, overviewData, useOnlySelectedETFs, selectedETFs, useOnlySelectedIndustries, selectedIndustries]);

  if (!isOpen) return null;

  // Top 10 inflow & outflow sectors
  const topInflows = [...sectors].sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0)).slice(0, 10);
  const topOutflows = [...sectors].sort((a, b) => (a.mainNetInflow || 0) - (b.mainNetInflow || 0)).slice(0, 10);

  const handleDownload = () => {
    setIsExporting(true);
    try {
      const config = CLARITY_CONFIG[clarity] || CLARITY_CONFIG['4k'];
      const isolated = getIsolatedReportData();
      // 实时生成指定超高画质的完整 Canvas (消除锯齿，原画级细节，严格隔离数据源)
      const canvas = renderReportToCanvas({
        template: isolated.template,
        sectors: isolated.sectors,
        indices: isolated.indices,
        overviewData: isolated.overviewData,
        selectedSector: isolated.selectedSector,
        industryValuationData: isolated.industryValuationData,
        etfValuationData: (isolated as any).etfValuationData,
        themeMode,
        watermarkMode,
        watermarkText,
        watermarkOpacity,
        watermarkStyle,
        todayStr,
        scale: config.scale
      });

      const watermarkTag = watermarkMode === 'with_watermark' ? '带水印' : '纯净版';
      const themeTag = THEME_NAME_MAP[themeMode] || themeMode;
      const tplTag = TEMPLATE_NAME_MAP[template] || template;
      const clarityTag = clarity === '8k' ? '8K印刷级' : clarity === '4k' ? '4K极清' : '2K视网膜';
      const fileName = `A股研报_${tplTag}_${themeTag}_${clarityTag}_${watermarkTag}_${todayStr}.png`;

      // 采用 Blob ObjectURL 触发极速无损下载 (不占用巨额内存，无 URL 字符长度截断风险)
      canvas.toBlob((blob) => {
        if (!blob) {
          const fallbackUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = fileName;
          link.href = fallbackUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setExportSuccess(true);
          setTimeout(() => setExportSuccess(false), 3000);
          setIsExporting(false);
          return;
        }

        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = fileName;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
        }, 300);

        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3500);
        setIsExporting(false);
      }, 'image/png');
    } catch (err) {
      console.error('Failed to export image:', err);
      setIsExporting(false);
    }
  };

  /**
   * 复制高清图片到系统剪贴板 (直接支持在微信/企微/飞书/钉钉/Word/PPT 中 Ctrl+V 粘贴)
   */
  const handleCopyHDImage = async () => {
    setIsCopying(true);
    try {
      // 1. 确保使用当前清晰度配置渲染出高清 Canvas (严格隔离数据源)
      const config = CLARITY_CONFIG[clarity] || CLARITY_CONFIG['4k'];
      const isolated = getIsolatedReportData();
      const canvas = renderReportToCanvas({
        template: isolated.template,
        sectors: isolated.sectors,
        indices: isolated.indices,
        overviewData: isolated.overviewData,
        selectedSector: isolated.selectedSector,
        industryValuationData: isolated.industryValuationData,
        etfValuationData: (isolated as any).etfValuationData,
        themeMode,
        watermarkMode,
        watermarkText,
        watermarkOpacity,
        watermarkStyle,
        todayStr,
        scale: config.scale
      });

      // 2. 将 Canvas 转换为最高品质 PNG Blob
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png', 1.0);
      });

      if (!blob) {
        throw new Error('未能生成高清图片数据');
      }

      // 3. 优先使用原生 Clipboard API 写入剪贴板
      if (navigator.clipboard && typeof window.ClipboardItem !== 'undefined') {
        const item = new ClipboardItem({ 'image/png': blob });
        await navigator.clipboard.write([item]);
        
        setCopied(true);
        setCopyFeedback({
          type: 'success',
          message: `✅ 已成功复制${config.label}图片 (${canvas.width}×${canvas.height}px)！可直接在微信、企微、飞书聊天框或 Word 中按 Ctrl+V (Mac: ⌘+V) 粘贴`
        });

        setTimeout(() => {
          setCopied(false);
        }, 3500);
        setTimeout(() => {
          setCopyFeedback(null);
        }, 5500);
      } else {
        // 剪贴板受浏览器权限沙箱限制时的优雅降级
        handleDownload();
        setCopied(true);
        setCopyFeedback({
          type: 'fallback',
          message: '💡 浏览器当前环境限制直接写入剪贴板，已为您自动触发高清图片下载，亦可直接在右侧预览图上右键选择「复制图像」'
        });
        setTimeout(() => {
          setCopied(false);
        }, 3500);
        setTimeout(() => {
          setCopyFeedback(null);
        }, 6000);
      }
    } catch (err) {
      console.warn('Clipboard write permission restricted, using download fallback:', err);
      handleDownload();
      setCopied(true);
      setCopyFeedback({
        type: 'fallback',
        message: '💡 浏览器安全策略限制了程序剪贴板操作，已自动下载该超清图，您也可在右侧预览图上右键点击「复制图像」'
      });
      setTimeout(() => {
        setCopied(false);
      }, 3500);
      setTimeout(() => {
        setCopyFeedback(null);
      }, 6000);
    } finally {
      setIsCopying(false);
    }
  };

  const handleCopyImage = handleCopyHDImage;

  // Watermark repeated items for grid layout
  const watermarkItems = Array.from({ length: 24 }).map((_, i) => i);

  return (
    <div id="image-export-modal-backdrop" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight">A股行情研报图片导出中心</h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                  watermarkMode === 'with_watermark'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                }`}>
                  {watermarkMode === 'with_watermark' ? '专属水印版' : '纯净无水印版'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                图片水平置于文字上方 · 支持【有水印】与【无水印】自由切换
              </p>
            </div>
          </div>

          <button
            id="btn-close-export-modal"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body: Left Control Panel + Right Live Preview */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto bg-slate-50">
          
          {/* Left Control Panel */}
          <div className="lg:col-span-4 space-y-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-fit">
            
            {/* 🌟 侧边栏实时版式效果缩略图 (用户在切换模板或设置时可立即看到导出的版式效果) */}
            <div 
              id="sidebar-live-thumbnail-card"
              className="bg-slate-900 text-white rounded-xl p-3.5 border border-slate-800 shadow-md space-y-2.5 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                    <FileImage className="w-3.5 h-3.5 text-rose-400" />
                    <span>实时版式缩略图</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono border border-slate-700">
                    {isWidescreen ? '横向全景 16:9' : '纵向海报 3:4'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsThumbnailExpanded(v => !v)}
                    className="text-[10.5px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-slate-800 flex items-center gap-0.5 transition-colors cursor-pointer"
                    title={isThumbnailExpanded ? '收起缩略图' : '展开缩略图'}
                  >
                    {isThumbnailExpanded ? (
                      <>
                        <span>收起</span>
                        <ChevronUp className="w-3 h-3" />
                      </>
                    ) : (
                      <>
                        <span>展开</span>
                        <ChevronDown className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {isThumbnailExpanded && (
                <>
                  {/* Thumbnail Image Box */}
                  <div 
                    onClick={() => {
                      setPreviewTab('image');
                      const rightCol = document.getElementById('export-preview-main-area');
                      if (rightCol) {
                        rightCol.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="relative group rounded-lg overflow-hidden border border-slate-700/80 bg-slate-950/90 cursor-pointer flex items-center justify-center transition-all hover:border-rose-500/80 hover:shadow-lg hover:shadow-rose-950/30"
                    style={{ minHeight: isWidescreen ? '125px' : '175px' }}
                    title="点击在右侧查看高清大图"
                  >
                    {previewImageUrl ? (
                      <img
                        src={previewImageUrl}
                        alt="实时版式效果缩略图"
                        className={`w-full h-auto object-contain transition-transform duration-200 group-hover:scale-[1.02] ${
                          isWidescreen ? 'max-h-[150px]' : 'max-h-[210px]'
                        }`}
                      />
                    ) : (
                      <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-rose-500" />
                        <span>正在实时渲染版式...</span>
                      </div>
                    )}

                    {/* Updating Shimmer Overlay */}
                    {isGeneratingPreview && (
                      <div className="absolute inset-0 bg-slate-950/65 backdrop-blur-[1px] flex items-center justify-center gap-1.5 text-white text-xs font-semibold animate-in fade-in">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-400" />
                        <span>更新版式中...</span>
                      </div>
                    )}

                    {/* Hover Hint Overlay */}
                    <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold pointer-events-none">
                      <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
                      <span>查看右侧大图</span>
                    </div>

                    {/* Watermark mode badge floating on thumbnail corner */}
                    <div className="absolute top-1.5 left-1.5 pointer-events-none flex items-center gap-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold shadow-xs ${
                        watermarkMode === 'with_watermark'
                          ? 'bg-rose-600/95 text-white'
                          : 'bg-emerald-600/95 text-white'
                      }`}>
                        {watermarkMode === 'with_watermark' ? '带水印' : '纯净版'}
                      </span>
                    </div>

                    {/* Theme badge floating on thumbnail corner */}
                    <div className="absolute top-1.5 right-1.5 pointer-events-none flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-900/95 text-slate-200 border border-slate-700 shadow-xs">
                        {THEME_NAME_MAP[themeMode] || themeMode}
                      </span>
                    </div>
                  </div>

                  {/* Meta & Quick Action Footer */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                    <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                      <span className="text-slate-200 font-medium truncate">
                        {TEMPLATE_NAME_MAP[template] || template}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-rose-400 font-mono font-bold text-[10.5px]">
                        {CLARITY_CONFIG[clarity]?.label || '4K 极清'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          generateImagePreview(true);
                        }}
                        className="text-slate-400 hover:text-white flex items-center gap-0.5 transition-colors cursor-pointer"
                        title="立即刷新缩略图"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGeneratingPreview ? 'animate-spin' : ''}`} />
                        <span>刷新</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 0. 导出板块数据源选取 (通过 currentViewContext 驱动，严格数据隔离禁止跨视图污染) */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/90 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-600" />
                  <span>导出板块数据源选取</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>数据源隔离</span>
                </span>
              </div>

              {/* Context Selector Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'all', name: '全部' },
                  { id: 'etf_valuation', name: 'ETF基金估值' },
                  { id: 'industry_valuation', name: '31行业估值' },
                  { id: 'heatmap', name: '个股热力图' },
                  { id: 'fundflow', name: '资金流看板' },
                  { id: 'overview', name: '大盘全景' },
                  { id: 'sentiment', name: '市场情绪' },
                  { id: 'gold', name: '黄金大宗' },
                  { id: 'sector_deepdive', name: '单板块深度' }
                ].map((ctxItem) => {
                  const isCur = activeContext === ctxItem.id;
                  return (
                    <button
                      key={ctxItem.id}
                      type="button"
                      id={`export-context-btn-${ctxItem.id}`}
                      onClick={() => {
                        setActiveContext(ctxItem.id);
                        const cfg = VIEW_CONTEXT_CONFIGS[ctxItem.id];
                        if (cfg && !cfg.allowedTemplates.includes(template)) {
                          setTemplate(cfg.defaultTemplate);
                        }
                      }}
                      className={`px-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer truncate text-center ${
                        isCur
                          ? 'bg-rose-600 text-white shadow-xs font-bold ring-2 ring-rose-500/20'
                          : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                      }`}
                      title={VIEW_CONTEXT_CONFIGS[ctxItem.id]?.name}
                    >
                      {ctxItem.name}
                    </button>
                  );
                })}
              </div>

              {/* Isolation Notice Banner */}
              <div className="text-[10.5px] bg-white p-2.5 rounded-lg border border-slate-200 text-slate-600 space-y-1 shadow-xs">
                <div className="font-bold text-emerald-700 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{VIEW_CONTEXT_CONFIGS[activeContext]?.isolationNotice || '🔒 数据源隔离已激活'}</span>
                </div>
                <div className="text-slate-500 font-normal">
                  定位数据源：{VIEW_CONTEXT_CONFIGS[activeContext]?.description}
                </div>
              </div>
            </div>

            {/* 1. Template Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  1. 选择研报图片模板
                </label>
                {activeContext !== 'all' && (
                  <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded font-semibold border border-rose-200">
                    当前限定：{VIEW_CONTEXT_CONFIGS[activeContext]?.name}
                  </span>
                )}
              </div>
              <div className="space-y-1.5">
                {/* 🌟 核心新功能：全市场板块个股树状热力图 (Finviz / 52etf同款) */}
                <button
                  id="tpl-market-treemap"
                  onClick={() => setTemplate('market_treemap')}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    template === 'market_treemap'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs ring-2 ring-rose-500/25'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <LayersIcon className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>全市场板块个股树状热力图</span>
                        <span className="px-1.5 py-0.2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded text-[9px] font-black shadow-xs">
                          52etf同款·热门
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">申万24大行业·60+细分·核心标的等比矩形树图</div>
                    </div>
                  </div>
                  {template === 'market_treemap' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>

                {/* 🌟 申万31行业估值全景模板 */}
                <button
                  id="tpl-industry-valuation"
                  onClick={() => setTemplate('industry_valuation')}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    template === 'industry_valuation'
                      ? 'bg-indigo-50 border-indigo-500 text-indigo-900 shadow-xs ring-2 ring-indigo-500/25'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>31个行业指数估值全景</span>
                        <span className="px-1.5 py-0.2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded text-[9px] font-black shadow-xs">
                          申万一级·精选
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">31行业市盈率PE分位·PB·ROE·极度低估到高估全梯队</div>
                    </div>
                  </div>
                  {template === 'industry_valuation' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                </button>

                {/* Scope selector for selected Industries in Industry valuation */}
                {template === 'industry_valuation' && selectedIndustries && selectedIndustries.length > 0 && (
                  <div className="p-2.5 bg-indigo-50/90 border border-indigo-200 rounded-xl space-y-2 mt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-indigo-600" />
                        <span>已勾选 {selectedIndustries.length} 个行业标的</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-indigo-200/80 text-indigo-800 rounded font-mono font-bold">
                        定制
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUseOnlySelectedIndustries(true);
                          setPreviewImageUrl(null);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          useOnlySelectedIndustries
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-indigo-100/50 border border-indigo-200'
                        }`}
                      >
                        仅导出选中 ({selectedIndustries.length}个)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseOnlySelectedIndustries(false);
                          setPreviewImageUrl(null);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !useOnlySelectedIndustries
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-indigo-100/50 border border-indigo-200'
                        }`}
                      >
                        导出全部 ({SHENWAN_31_INDUSTRIES_VALUATION.length}个)
                      </button>
                    </div>
                  </div>
                )}

                {/* 🌟 全市场ETF基金估值全景罗盘 */}
                <button
                  id="tpl-etf-valuation"
                  onClick={() => setTemplate('etf_valuation')}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    template === 'etf_valuation'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 shadow-xs ring-2 ring-rose-500/25'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>全市场ETF基金估值全景罗盘</span>
                        <span className="px-1.5 py-0.2 bg-gradient-to-r from-rose-600 to-red-600 text-white rounded text-[9px] font-black shadow-xs">
                          5大分类·精选
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-normal">宽基/策略/行业/主题/全球 核心ETF十年PE分位与折溢价</div>
                    </div>
                  </div>
                  {template === 'etf_valuation' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>

                {/* Scope selector for selected ETFs in ETF valuation */}
                {template === 'etf_valuation' && selectedETFs && selectedETFs.length > 0 && (
                  <div className="p-2.5 bg-rose-50/90 border border-rose-200 rounded-xl space-y-2 mt-1">
                    <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                      <span className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-rose-600" />
                        <span>已勾选 {selectedETFs.length} 只 ETF 标的</span>
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 bg-rose-200/80 text-rose-800 rounded font-mono font-bold">
                        定制
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setUseOnlySelectedETFs(true);
                          setPreviewImageUrl(null);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          useOnlySelectedETFs
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-rose-100/50 border border-rose-200'
                        }`}
                      >
                        仅导出选中 ({selectedETFs.length}只)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUseOnlySelectedETFs(false);
                          setPreviewImageUrl(null);
                        }}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          !useOnlySelectedETFs
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-rose-100/50 border border-rose-200'
                        }`}
                      >
                        导出全部 ({ALL_ETF_VALUATION_LIST.length}只)
                      </button>
                    </div>
                  </div>
                )}

                {/* NEW: 大盘总览模板 */}
                <button
                  id="tpl-market-overview"
                  onClick={() => setTemplate('market_overview')}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    template === 'market_overview'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs ring-1 ring-rose-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-bold">A股大盘全景总览图</div>
                      <div className="text-[10px] text-slate-400 font-normal">8大指数+两市量能+涨跌家数比</div>
                    </div>
                  </div>
                  {template === 'market_overview' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>

                {/* NEW: 大盘全景 · 领涨与领跌板块榜 */}
                <button
                  id="tpl-gainers-losers"
                  onClick={() => setTemplate('gainers_losers')}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    template === 'gainers_losers'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs ring-1 ring-rose-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        <span>大盘全景 · 领涨与领跌板块榜</span>
                        <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded text-[9px] font-bold">推荐</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-normal">领涨TOP12 vs 领跌TOP12板块涨跌幅对照图</div>
                    </div>
                  </div>
                  {template === 'gainers_losers' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>

                <button
                  id="tpl-fundflow-panorama"
                  onClick={() => setTemplate('fundflow_panorama')}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    template === 'fundflow_panorama'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs ring-1 ring-rose-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="font-bold">行业主力资金全景图 (TOP 10)</div>
                      <div className="text-[10px] text-slate-400 font-normal">多空两极各10个板块主力净买卖深度对比</div>
                    </div>
                  </div>
                  {template === 'fundflow_panorama' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>

                <button
                  id="tpl-sector-deepdive"
                  onClick={() => setTemplate('sector_deepdive')}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    template === 'sector_deepdive'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs ring-1 ring-rose-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-bold">单板块量化深度研报卡</div>
                      <div className="text-[10px] text-slate-400 font-normal">指定板块4维量化矩阵+领涨股</div>
                    </div>
                  </div>
                  {template === 'sector_deepdive' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>

                <button
                  id="tpl-sentiment-ladder"
                  onClick={() => setTemplate('sentiment_ladder')}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    template === 'sentiment_ladder'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs ring-1 ring-rose-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-bold">市场情绪与连板天梯复盘</div>
                      <div className="text-[10px] text-slate-400 font-normal">涨跌停比例+晋级率+梯队标的</div>
                    </div>
                  </div>
                  {template === 'sentiment_ladder' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>

                <button
                  id="tpl-gold-macro"
                  onClick={() => setTemplate('gold_macro')}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    template === 'gold_macro'
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs ring-1 ring-rose-400/30'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    <div>
                      <div className="font-bold">黄金大宗与采选金矿联动</div>
                      <div className="text-[10px] text-slate-400 font-normal">外盘现货金+A股金矿龙头联动</div>
                    </div>
                  </div>
                  {template === 'gold_macro' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>
              </div>
            </div>

            {/* If sector deep dive, choose sector */}
            {template === 'sector_deepdive' && (
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  选择目标板块
                </label>
                <select
                  value={selectedSector.id}
                  onChange={(e) => {
                    const found = sectors.find(s => s.id === e.target.value);
                    if (found) setSelectedSector(found);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-rose-500"
                >
                  {sectors.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.mainNetInflow > 0 ? '+' : ''}{s.mainNetInflow}亿 / {s.changePercent > 0 ? '+' : ''}{s.changePercent}%)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* 2. 水印和无水印的选择 (User Mandate) */}
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  2. 水印防伪设置
                </label>
                <span className={`text-[10.5px] px-2 py-0.5 rounded-full font-bold ${
                  watermarkMode === 'with_watermark' 
                    ? 'bg-rose-100 text-rose-700 border border-rose-200' 
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {watermarkMode === 'with_watermark' ? '已启用专属水印' : '纯净无水印模式'}
                </span>
              </div>

              {/* Watermark Choice Toggle Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-choice-with-watermark"
                  type="button"
                  onClick={() => setWatermarkMode('with_watermark')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    watermarkMode === 'with_watermark'
                      ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-600" />
                    <div>
                      <div className="text-xs font-bold">有水印</div>
                      <div className="text-[10px] text-slate-500">公众号专属防伪</div>
                    </div>
                  </div>
                  {watermarkMode === 'with_watermark' && <Check className="w-3.5 h-3.5 text-rose-600" />}
                </button>

                <button
                  id="btn-choice-no-watermark"
                  type="button"
                  onClick={() => setWatermarkMode('no_watermark')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    watermarkMode === 'no_watermark'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold">无水印 (纯净版)</div>
                      <div className="text-[10px] text-slate-500">官方极简原图</div>
                    </div>
                  </div>
                  {watermarkMode === 'no_watermark' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              </div>

              {/* Watermark Configuration when with_watermark is selected */}
              {watermarkMode === 'with_watermark' && (
                <div className="space-y-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200/70 animate-in fade-in">
                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">水印文字内容 (默认：公众号：我爱这young)</span>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-800 outline-none focus:border-rose-500"
                      placeholder="公众号：我爱这young"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>水印透明度</span>
                      <span className="font-bold text-slate-700">{Math.round(watermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="0.45"
                      step="0.01"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-rose-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-500 block mb-1">水印形式</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => setWatermarkStyle('both')}
                        className={`py-1 px-1.5 rounded-md text-[10.5px] font-semibold border text-center transition-all cursor-pointer ${
                          watermarkStyle === 'both'
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        网格 + 徽章
                      </button>
                      <button
                        onClick={() => setWatermarkStyle('grid')}
                        className={`py-1 px-1.5 rounded-md text-[10.5px] font-semibold border text-center transition-all cursor-pointer ${
                          watermarkStyle === 'grid'
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        45°微网格
                      </button>
                      <button
                        onClick={() => setWatermarkStyle('corner')}
                        className={`py-1 px-1.5 rounded-md text-[10.5px] font-semibold border text-center transition-all cursor-pointer ${
                          watermarkStyle === 'corner'
                            ? 'bg-rose-500 text-white border-rose-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        专属徽章
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {watermarkMode === 'no_watermark' && (
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/80 text-emerald-800 text-xs flex items-center gap-2">
                  <EyeOff className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>已启用<strong>无水印模式</strong>：图片中将不添加任何覆盖网格或公众号标识，导出最纯净的官方研报。</span>
                </div>
              )}
            </div>

            {/* 3. Visual Style */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  3. 图片配色主题
                </label>
                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-rose-600">流入柱红</span>
                  <span className="text-slate-300">|</span>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-600">流出柱绿</span>
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  id="theme-light"
                  onClick={() => setThemeMode('light')}
                  className={`py-2 px-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-white border-rose-500 text-rose-600 shadow-xs ring-2 ring-rose-500/20 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-300" />
                  <span>研报白</span>
                </button>
                <button
                  id="theme-dark"
                  onClick={() => setThemeMode('dark')}
                  className={`py-2 px-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-slate-900 border-rose-500 text-rose-400 shadow-xs ring-2 ring-rose-500/20 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                  <span>夜间黑</span>
                </button>
                <button
                  id="theme-classic"
                  onClick={() => setThemeMode('classic')}
                  className={`py-2 px-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'classic'
                      ? 'bg-amber-50 border-amber-500 text-amber-800 shadow-xs ring-2 ring-amber-500/20 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-200 border border-amber-400" />
                  <span>牛皮纸</span>
                </button>
                <button
                  id="theme-navy"
                  onClick={() => setThemeMode('navy')}
                  className={`py-2 px-1.5 rounded-lg text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    themeMode === 'navy'
                      ? 'bg-[#080e1e] border-blue-500 text-blue-400 shadow-xs ring-2 ring-blue-500/20 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-2.5 h-2.5 rounded-full bg-[#080e1e] border border-blue-400" />
                  <span>机构蓝</span>
                </button>
              </div>
            </div>

            {/* 4. Clarity Resolution (清晰度选择) */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                  <span>4. 导出分辨率 (超清画质)</span>
                </label>
                <span className="text-[11px] font-bold text-rose-600 font-mono">
                  {isWidescreen 
                    ? CLARITY_CONFIG[clarity]?.widescreenRes 
                    : CLARITY_CONFIG[clarity]?.portraitRes} · {CLARITY_CONFIG[clarity]?.label}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(CLARITY_CONFIG) as ClarityTier[]).map((tierKey) => {
                  const item = CLARITY_CONFIG[tierKey];
                  const isSelected = clarity === tierKey;
                  const resText = isWidescreen ? item.widescreenRes : item.portraitRes;
                  return (
                    <button
                      key={tierKey}
                      id={`clarity-${tierKey}`}
                      type="button"
                      onClick={() => {
                        setClarity(tierKey);
                        generateImagePreview(true, tierKey);
                      }}
                      className={`relative p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between min-h-[64px] ${
                        isSelected
                          ? 'bg-rose-50/70 border-rose-500 ring-2 ring-rose-500/25 shadow-xs font-bold'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {item.isRecommended && (
                        <span className="absolute -top-1.5 right-1.5 px-1 py-0.2 rounded bg-rose-600 text-[9px] font-black text-white shadow-xs">
                          推荐
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-black ${isSelected ? 'text-rose-700' : 'text-slate-800'}`}>
                          {item.label}
                        </span>
                        <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-rose-200/80 text-rose-800 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                          {item.tag}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 truncate mt-1">
                        {resText}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 text-[10.5px] text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                <span>{CLARITY_CONFIG[clarity]?.desc}</span>
              </div>
            </div>

            {/* Preview & Action Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              {/* 核心主打：复制高清图片 (支持微信/企微/飞书/Word免存直接粘贴) */}
              <button
                id="btn-copy-hd-image"
                onClick={handleCopyHDImage}
                disabled={isCopying || isExporting}
                className="w-full py-3 px-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isCopying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>正在生成高清图片并写入剪贴板...</span>
                  </>
                ) : copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300 stroke-[3]" />
                    <span className="text-white font-bold">已复制高清图片！可在微信/文档中 Ctrl+V 粘贴</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-white" />
                    <span>复制高清图片 (可直接粘贴至微信/企微/飞书)</span>
                    <span className="ml-1 px-1.5 py-0.5 rounded bg-white/20 text-[10px] font-mono tracking-wider">
                      {clarity.toUpperCase()} HD
                    </span>
                  </>
                )}
              </button>

              {/* 下载高清图片文件 */}
              <button
                id="btn-download-image"
                onClick={handleDownload}
                disabled={isExporting || isCopying}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>正在导出超清图片文件...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-300" />
                    <span>保存超清 PNG 图片文件 ({clarity.toUpperCase()} · {watermarkMode === 'with_watermark' ? '带水印' : '纯净版'})</span>
                  </>
                )}
              </button>

              {/* 刷新/生成预览 */}
              <button
                id="btn-generate-image-preview"
                onClick={() => {
                  setPreviewTab('image');
                  generateImagePreview(true);
                }}
                disabled={isGeneratingPreview || isExporting || isCopying}
                className="w-full py-2 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPreview ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    <span>正在生成高清预览图...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>刷新图片实时渲染预览</span>
                  </>
                )}
              </button>
            </div>

            {/* Copy Feedback Notification */}
            {copyFeedback && (
              <div className={`p-3 rounded-xl border text-xs font-medium animate-in fade-in zoom-in-95 flex items-start gap-2 shadow-xs ${
                copyFeedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
              }`}>
                {copyFeedback.type === 'success' ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-bold mb-0.5">
                    {copyFeedback.type === 'success' ? '高清图片复制成功' : '提示'}
                  </div>
                  <div>{copyFeedback.message}</div>
                </div>
              </div>
            )}

            {exportSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center animate-in fade-in">
                ✅ 高清图片已成功导出并保存至本地下载目录！
              </div>
            )}
          </div>

          {/* Right Live Preview Canvas Area */}
          <div id="export-preview-main-area" className="lg:col-span-8 flex flex-col items-center justify-start overflow-y-auto relative min-h-[500px]">
            {/* Top Toolbar: Mode Switcher & Status */}
            <div className="w-full max-w-[620px] mb-3 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center p-1 bg-slate-200/80 rounded-xl w-full sm:w-auto">
                <button
                  id="tab-preview-image"
                  onClick={() => setPreviewTab('image')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    previewTab === 'image'
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>🖼️ 真实导出图片预览 (所见即所得)</span>
                  {previewImageUrl && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  )}
                </button>
                <button
                  id="tab-preview-design"
                  onClick={() => setPreviewTab('design')}
                  className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    previewTab === 'design'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>📐 排版DOM源卡片</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                {/* Top Quick Copy HD Button */}
                <button
                  id="btn-preview-top-copy-hd"
                  onClick={handleCopyHDImage}
                  disabled={isCopying}
                  className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50 transition-colors"
                  title="直接复制高清图片到剪贴板"
                >
                  {isCopying ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-600" />
                  ) : copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>{copied ? '已复制高清图' : '复制高清图'}</span>
                </button>

                <button
                  id="btn-refresh-preview"
                  onClick={() => generateImagePreview(true)}
                  disabled={isGeneratingPreview}
                  title="重新渲染生成图片"
                  className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingPreview ? 'animate-spin text-rose-600' : ''}`} />
                  <span>刷新预览</span>
                </button>
                <span className={`px-2 py-1 rounded text-[10.5px] font-bold ${
                  watermarkMode === 'with_watermark'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {watermarkMode === 'with_watermark' ? '带水印' : '纯净无水印'}
                </span>
              </div>
            </div>

            {/* TAB 1: Real Rendered Image Preview (What You See Is What You Export) */}
            {previewTab === 'image' && (
              <div className="w-full max-w-[620px] flex flex-col items-center gap-3">
                {previewImageUrl ? (
                  <>
                    {/* Metadata Strip */}
                    <div className="w-full bg-emerald-50 border border-emerald-200/80 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs text-emerald-800">
                      <div className="flex items-center gap-1.5 font-bold">
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>真实高清研报图片已就绪 · 所见即所得</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] font-mono text-emerald-700">
                        {imageMeta && <span>{imageMeta.width}×{imageMeta.height}px</span>}
                        {imageMeta && <span>约 {imageMeta.sizeKb}KB</span>}
                        <span className="px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold">{CLARITY_CONFIG[clarity]?.label || '4K 旗舰极清'}</span>
                      </div>
                    </div>

                    {/* Image Viewer Container */}
                    <div className="w-full relative rounded-2xl shadow-2xl overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center p-1 group">
                      <img 
                        id="rendered-preview-image"
                        src={previewImageUrl} 
                        alt="导出版研报真实图片预览" 
                        className="w-full h-auto rounded-xl object-contain transition-transform"
                        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
                      />

                      {/* Quick Floating Controls (包括复制高清图、放大、下载) */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity bg-slate-950/85 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-white text-xs shadow-xl">
                        <button 
                          id="btn-floating-copy-hd"
                          onClick={handleCopyHDImage}
                          disabled={isCopying}
                          className="px-2.5 py-1 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-lg font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                          title="复制当前高清图片到剪贴板，支持直接在微信等聊天工具中粘贴"
                        >
                          {copied ? <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 text-white" />}
                          <span>{copied ? '已复制高清图' : '复制高清图'}</span>
                        </button>
                        <button 
                          onClick={() => setZoomLevel(z => z === 1 ? 1.25 : 1)}
                          className="px-2 py-1 hover:bg-white/20 rounded-lg flex items-center gap-1 cursor-pointer"
                          title="缩放切换"
                        >
                          {zoomLevel === 1 ? <ZoomIn className="w-3.5 h-3.5" /> : <ZoomOut className="w-3.5 h-3.5" />}
                          <span>{zoomLevel === 1 ? '放大' : '原尺寸'}</span>
                        </button>
                        <button 
                          onClick={handleDownload}
                          disabled={isExporting}
                          className="px-2.5 py-1 bg-white/15 hover:bg-white/25 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                          title="下载保存到本地"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>下载</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 text-center">
                      💡 提示：点击「复制高清图片」即可在微信、企业微信、飞书、钉钉、Word/PPT 中按 Ctrl+V (Mac: ⌘+V) 直接粘贴发送高清原图；亦可直接在上方图片上右键选择「复制图像」。
                    </p>
                  </>
                ) : (
                  <div className="w-full aspect-[1/1.4] bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 p-8 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-800">正在极速生成超清研报真实图片预览...</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm">正在将行情图表、主力资金榜单与水印渲染为高清图片</p>
                    </div>
                    <button
                      onClick={() => generateImagePreview(true)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs"
                    >
                      立即手动触发生成
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Poster Card (When in design tab, visible for live layout verification) */}
            <div
              ref={posterRef}
              className={`w-full max-w-[620px] rounded-2xl shadow-xl border relative overflow-hidden transition-all select-none ${
                previewTab === 'design' ? 'block' : 'hidden'
              } ${
                themeMode === 'dark' 
                  ? 'bg-slate-950 text-slate-100 border-slate-800' 
                  : themeMode === 'navy'
                  ? 'bg-[#080e1e] text-slate-100 border-[#1b2d56]'
                  : themeMode === 'classic'
                  ? 'bg-[#fbf7ee] text-slate-900 border-amber-200'
                  : 'bg-white text-slate-900 border-slate-200'
              }`}
              style={{
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
            >
              {/* --- 45° Micro Watermark Grid Overlay (ONLY when watermarkMode is 'with_watermark') --- */}
              {watermarkMode === 'with_watermark' && (watermarkStyle === 'grid' || watermarkStyle === 'both') && (
                <div 
                  className="absolute inset-0 pointer-events-none z-20 overflow-hidden flex flex-wrap gap-x-12 gap-y-16 p-6 items-center justify-around"
                  style={{ opacity: watermarkOpacity }}
                >
                  {watermarkItems.map((_, idx) => (
                    <div 
                      key={`wm-grid-${idx}`} 
                      className="text-xs font-black tracking-wider whitespace-nowrap transform -rotate-25 select-none"
                      style={{
                        color: themeMode === 'dark' ? '#94a3b8' : '#64748b'
                      }}
                    >
                      {watermarkText}
                    </div>
                  ))}
                </div>
              )}

              {/* --- Top Card Header --- */}
              <div className={`p-5 border-b relative z-10 ${
                themeMode === 'dark' ? 'border-slate-800 bg-slate-900/60' : 'border-slate-100 bg-slate-50/80'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
                      A
                    </div>
                    <div>
                      <h3 className="font-black text-base tracking-tight leading-tight">
                        {template === 'market_treemap' && 'A股全市场板块个股涨跌树状热力图'}
                        {template === 'etf_valuation' && '全市场 ETF 基金最新估值与十年分位数全景罗盘'}
                        {template === 'industry_valuation' && '申万一级 31 个行业指数最新估值与市场表现全景'}
                        {template === 'market_overview' && 'A股大盘全景总览与盘面复盘深度研报'}
                        {template === 'gainers_losers' && 'A股大盘全景 · 行业领涨与领跌板块排行榜'}
                        {template === 'fundflow_panorama' && 'A股市场资金流向与主力博弈深度研报'}
                        {template === 'sector_deepdive' && `${selectedSector.name || '行业板块'}量化深度画像研报`}
                        {template === 'sentiment_ladder' && 'A股市场情绪罗盘与连板天梯复盘'}
                        {template === 'gold_macro' && '黄金大宗商品与采选金矿股联动研报'}
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                        <span>日期：{todayStr}</span>
                        <span>•</span>
                        <span>数据源：沪深北交易所 / 东方财富</span>
                      </div>
                    </div>
                  </div>

                  {/* Corner Badge: Show watermark if enabled, or clean official tag if disabled */}
                  {watermarkMode === 'with_watermark' && (watermarkStyle === 'corner' || watermarkStyle === 'both') ? (
                    <div className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-600 text-[11px] font-black tracking-wide flex items-center gap-1 shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-rose-500" />
                      <span>{watermarkText}</span>
                    </div>
                  ) : (
                    <div className="px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10.5px] font-bold tracking-wide flex items-center gap-1">
                      <Activity className="w-3 h-3 text-blue-500" />
                      <span>A股行情全景 (纯净版)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* --- 1. UPPER PART: HORIZONTAL IMAGE / CHART (Strictly above text) --- */}
              <div className="p-5 relative z-10">
                <div className="text-[11px] font-black uppercase tracking-wider text-rose-600 mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <BarChart2 className="w-3.5 h-3.5" />
                    【图表与盘面可视化 · 水平在上】
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">单位：点 / 亿元 / %</span>
                </div>

                {/* TEMPLATE 0: Market Treemap (Finviz Style 52etf) */}
                {template === 'market_treemap' && (() => {
                  const previewSectors = computeHierarchicalTreemap({ x: 0, y: 0, w: 580, h: 420 });
                  return (
                    <div className={`p-3 rounded-xl border space-y-2.5 ${
                      themeMode === 'dark' ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50/90 border-slate-200/80'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="text-[10.5px] font-bold text-slate-600 flex items-center gap-1.5">
                          <LayersIcon className="w-3.5 h-3.5 text-rose-600" />
                          <span>A股全景树状热力图（参考 52etf.site 申万行业/细分/个股等比权重）</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">28个行业 · 70+细分 · 200+核心股票</span>
                      </div>

                      {/* Dynamic SVG Hierarchical Treemap Preview */}
                      <div className="w-full overflow-hidden rounded-lg border border-slate-700/60 bg-slate-950 shadow-inner">
                        <svg viewBox="0 0 580 420" className="w-full h-auto block select-none">
                          {previewSectors.map(sec => {
                            if (!sec.rect || sec.rect.w <= 0 || sec.rect.h <= 0) return null;
                            const { x, y, w, h } = sec.rect;
                            return (
                              <g key={sec.id}>
                                {/* Sector Background & Border */}
                                <rect
                                  x={x}
                                  y={y}
                                  width={w}
                                  height={h}
                                  fill="#0f172a"
                                  stroke={themeMode === 'light' ? '#cbd5e1' : '#334155'}
                                  strokeWidth="1.5"
                                />

                                {/* Subsectors and Stocks */}
                                {sec.subsectors.map(sub => {
                                  if (!sub.rect || sub.rect.w <= 0 || sub.rect.h <= 0) return null;
                                  const { x: sx, y: sy, w: sw, h: sh } = sub.rect;
                                  return (
                                    <g key={sub.id}>
                                      {/* Subsector Outline */}
                                      <rect
                                        x={sx}
                                        y={sy}
                                        width={sw}
                                        height={sh}
                                        fill="none"
                                        stroke={themeMode === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.08)'}
                                        strokeWidth="0.8"
                                      />
                                      {/* Subsector Title if big enough */}
                                      {sh > 40 && sw > 40 && (
                                        <g>
                                          <rect
                                            x={sx + 0.5}
                                            y={sy + 0.5}
                                            width={Math.max(0, sw - 1)}
                                            height={14}
                                            fill={themeMode === 'light' ? '#f1f5f9' : '#0b0f19'}
                                          />
                                          <text
                                            x={sx + 3}
                                            y={sy + 10.5}
                                            fill="#94a3b8"
                                            fontSize="7.5"
                                            fontWeight="600"
                                            fontFamily="sans-serif"
                                          >
                                            {sub.name}
                                          </text>
                                        </g>
                                      )}

                                      {/* Stocks */}
                                      {sub.stocks.map(stk => {
                                        if (!stk.rect || stk.rect.w <= 0 || stk.rect.h <= 0) return null;
                                        const { x: kx, y: ky, w: kw, h: kh } = stk.rect;
                                        const color = getTreemapStockColor(stk.changePercent, themeMode);
                                        const changeStr = (stk.changePercent > 0 ? '+' : '') + stk.changePercent.toFixed(2) + '%';
                                        return (
                                          <g key={stk.code}>
                                            <rect
                                              x={kx}
                                              y={ky}
                                              width={kw}
                                              height={kh}
                                              fill={color.bg}
                                              stroke={color.border}
                                              strokeWidth="0.8"
                                            />
                                            {kw >= 50 && kh >= 28 ? (
                                              <>
                                                <text
                                                  x={kx + kw / 2}
                                                  y={ky + kh / 2 - 3}
                                                  fill="#ffffff"
                                                  fontSize={kw >= 80 ? '11' : '9.5'}
                                                  fontWeight="bold"
                                                  textAnchor="middle"
                                                  fontFamily="sans-serif"
                                                >
                                                  {stk.name}
                                                </text>
                                                <text
                                                  x={kx + kw / 2}
                                                  y={ky + kh / 2 + 9}
                                                  fill={color.subText}
                                                  fontSize={kw >= 80 ? '9.5' : '8'}
                                                  fontWeight="bold"
                                                  textAnchor="middle"
                                                  fontFamily="monospace"
                                                >
                                                  {changeStr}
                                                </text>
                                              </>
                                            ) : kw >= 32 && kh >= 18 ? (
                                              <>
                                                <text
                                                  x={kx + kw / 2}
                                                  y={ky + kh / 2 - 2}
                                                  fill="#ffffff"
                                                  fontSize="8"
                                                  fontWeight="bold"
                                                  textAnchor="middle"
                                                  fontFamily="sans-serif"
                                                >
                                                  {stk.name}
                                                </text>
                                                <text
                                                  x={kx + kw / 2}
                                                  y={ky + kh / 2 + 7}
                                                  fill={color.subText}
                                                  fontSize="7"
                                                  textAnchor="middle"
                                                  fontFamily="monospace"
                                                >
                                                  {changeStr}
                                                </text>
                                              </>
                                            ) : kw >= 20 && kh >= 12 ? (
                                              <text
                                                x={kx + kw / 2}
                                                y={ky + kh / 2 + 3}
                                                fill="#ffffff"
                                                fontSize="7"
                                                fontWeight="bold"
                                                textAnchor="middle"
                                                fontFamily="sans-serif"
                                              >
                                                {stk.name.slice(0, 2)}
                                              </text>
                                            ) : null}
                                          </g>
                                        );
                                      })}
                                    </g>
                                  );
                                })}

                                {/* SUPERIMPOSED Sector Header Pill on top of stocks */}
                                {w >= 45 && h >= 26 && (
                                  <g className="pointer-events-none select-none">
                                    <rect
                                      x={x + 3}
                                      y={y + 3}
                                      width={Math.min(w - 6, Math.max(48, sec.name.length * 12 + 14))}
                                      height={16}
                                      rx={3}
                                      fill={themeMode === 'light' ? 'rgba(255, 255, 255, 0.88)' : 'rgba(15, 23, 42, 0.88)'}
                                      stroke={themeMode === 'light' ? 'rgba(0, 0, 0, 0.25)' : 'rgba(255, 255, 255, 0.22)'}
                                      strokeWidth="0.8"
                                    />
                                    <text
                                      x={x + 7}
                                      y={y + 14.5}
                                      fill={themeMode === 'light' ? '#0f172a' : '#f8fafc'}
                                      fontSize="9.5"
                                      fontWeight="bold"
                                      fontFamily="sans-serif"
                                    >
                                      {sec.name}
                                    </text>
                                  </g>
                                )}
                              </g>
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                  );
                })()}

                {/* TEMPLATE: ETF Valuation View */}
                {template === 'etf_valuation' && (() => {
                  const activeETFs = (useOnlySelectedETFs && selectedETFs && selectedETFs.length > 0)
                    ? selectedETFs
                    : ALL_ETF_VALUATION_LIST;
                  return (
                    <div className={`p-4 rounded-xl border space-y-3.5 ${
                      themeMode === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                    }`}>
                      {useOnlySelectedETFs && selectedETFs && selectedETFs.length > 0 && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-rose-50 border border-rose-200 rounded-lg text-xs font-bold text-rose-800">
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-rose-600" />
                            <span>当前专属研报已载入您勾选的 {selectedETFs.length} 只 ETF 基金</span>
                          </span>
                          <span className="text-[10px] font-normal text-rose-600">定制视图</span>
                        </div>
                      )}

                      {/* Top Valuation Metric Guide & Summary Strip */}
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: '极度低估', range: '<10%', count: activeETFs.filter(x => x.status === '极度低估').length, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
                          { label: '低估', range: '10%-30%', count: activeETFs.filter(x => x.status === '低估').length, color: 'text-green-500 bg-green-500/10 border-green-500/30' },
                          { label: '正常', range: '30%-70%', count: activeETFs.filter(x => x.status === '正常').length, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
                          { label: '高估', range: '70%-90%', count: activeETFs.filter(x => x.status === '高估').length, color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
                          { label: '极度高估', range: '≥90%', count: activeETFs.filter(x => x.status === '极度高估').length, color: 'text-red-500 bg-red-500/10 border-red-500/30' },
                        ].map(st => (
                          <div key={st.label} className={`p-2 rounded-lg border text-center ${st.color}`}>
                            <div className="text-[10px] font-bold">{st.label} ({st.range})</div>
                            <div className="text-base font-black font-mono mt-0.5">{st.count} 只</div>
                          </div>
                        ))}
                      </div>

                      {/* Preview Table of All Selected ETFs */}
                      <div className="overflow-hidden rounded-lg border border-slate-200/80 bg-white">
                        <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                          <span>已收录全部基金明细清单</span>
                          <span className="text-[10.5px] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-mono font-black">
                            共 {activeETFs.length} 只
                          </span>
                        </div>
                        <div className="max-h-[360px] overflow-y-auto">
                          <table className="w-full text-left text-[11px]">
                            <thead className="bg-slate-50/90 sticky top-0 text-slate-600 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-1.5 px-2 w-10 text-center">#</th>
                                <th className="py-1.5 px-2">代码 / 名称</th>
                                <th className="py-1.5 px-2 text-center">分类</th>
                                <th className="py-1.5 px-2 text-right">最新价</th>
                                <th className="py-1.5 px-2 text-right">5年PE分位</th>
                                <th className="py-1.5 px-2 text-right">10年PE分位</th>
                                <th className="py-1.5 px-2 text-center">估值状态</th>
                                <th className="py-1.5 px-2 text-right">股息率</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {activeETFs.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-slate-50/80">
                                  <td className="py-1 px-2 text-center font-mono text-slate-400 text-[10px]">{idx + 1}</td>
                                  <td className="py-1 px-2 font-bold text-slate-800">{item.name} <span className="text-[9.5px] font-mono text-slate-400 font-normal">{item.code}</span></td>
                                  <td className="py-1 px-2 text-center"><span className="px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 text-[10px]">{item.categoryName}</span></td>
                                  <td className={`py-1 px-2 text-right font-mono font-bold ${item.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{item.price.toFixed(3)}</td>
                                  <td className="py-1 px-2 text-right font-mono font-bold text-indigo-600">{item.pePercentile5y.toFixed(1)}%</td>
                                  <td className="py-1 px-2 text-right font-mono font-bold text-slate-900">{item.pePercentile10y.toFixed(1)}%</td>
                                  <td className="py-1 px-2 text-center">
                                    <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${item.status.includes('低估') ? 'bg-emerald-50 text-emerald-700' : item.status.includes('高估') ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{item.status}</span>
                                  </td>
                                  <td className="py-1 px-2 text-right font-mono text-slate-600">{item.dividendYield.toFixed(2)}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TEMPLATE: 31 Industry Valuation View */}
                {template === 'industry_valuation' && (() => {
                  const activeIndustries = (useOnlySelectedIndustries && selectedIndustries && selectedIndustries.length > 0)
                    ? selectedIndustries
                    : SHENWAN_31_INDUSTRIES_VALUATION;

                  return (
                    <div className={`p-4 rounded-xl border space-y-3.5 ${
                      themeMode === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                    }`}>
                      {useOnlySelectedIndustries && selectedIndustries && selectedIndustries.length > 0 && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-bold text-indigo-800">
                          <span className="flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-indigo-600" />
                            <span>当前专属研报已载入您勾选的 {selectedIndustries.length} 个申万一级行业</span>
                          </span>
                          <span className="text-[11px] font-mono text-indigo-600">已定制筛选</span>
                        </div>
                      )}

                      {/* Top Valuation Metric Guide & Summary Strip */}
                      <div className="grid grid-cols-5 gap-2">
                        {[
                          { label: '极度低估', count: activeIndustries.filter(i => i.status === '极度低估').length, color: 'text-emerald-600', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                          { label: '低估', count: activeIndustries.filter(i => i.status === '低估').length, color: 'text-green-600', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                          { label: '正常', count: activeIndustries.filter(i => i.status === '正常').length, color: 'text-blue-600', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                          { label: '高估', count: activeIndustries.filter(i => i.status === '高估').length, color: 'text-orange-600', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                          { label: '极度高估', count: activeIndustries.filter(i => i.status === '极度高估').length, color: 'text-red-600', bg: 'bg-red-500/10', border: 'border-red-500/20' }
                        ].map(st => (
                          <div key={st.label} className={`p-2 rounded-lg border text-center ${st.bg} ${st.border}`}>
                            <div className={`text-[10px] font-bold ${st.color}`}>{st.label}</div>
                            <div className="text-sm font-black text-slate-800 dark:text-slate-100 font-mono mt-0.5">{st.count} 个</div>
                          </div>
                        ))}
                      </div>

                      {/* Table Sample Preview */}
                      <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden text-[10.5px]">
                        <div className="bg-slate-100 dark:bg-slate-800 p-2 font-bold text-slate-600 dark:text-slate-300 grid grid-cols-12 gap-1 text-center">
                          <span className="col-span-1">#</span>
                          <span className="col-span-2 text-left">行业名称</span>
                          <span className="col-span-2">估值状态</span>
                          <span className="col-span-2 text-right">市盈率(PE)</span>
                          <span className="col-span-3 text-left pl-2">PE历史百分位</span>
                          <span className="col-span-2 text-right">股息率</span>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto">
                          {[...activeIndustries].sort((a,b) => a.pePercentile - b.pePercentile).slice(0, 8).map((item, idx) => (
                            <div key={item.id} className="p-1.5 grid grid-cols-12 gap-1 items-center text-center">
                              <span className="col-span-1 text-slate-400 font-mono">{idx + 1}</span>
                              <span className="col-span-2 font-bold text-left text-slate-800 dark:text-slate-200 truncate">{item.name}</span>
                              <span className="col-span-2">
                                <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                  item.status === '极度低估' ? 'bg-emerald-100 text-emerald-700' :
                                  item.status === '低估' ? 'bg-green-100 text-green-700' :
                                  item.status === '正常' ? 'bg-blue-100 text-blue-700' :
                                  item.status === '高估' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {item.status}
                                </span>
                              </span>
                              <span className="col-span-2 font-mono font-bold text-right text-slate-700 dark:text-slate-300">{item.pe.toFixed(1)}</span>
                              <div className="col-span-3 flex items-center gap-1.5 pl-2">
                                <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${item.pePercentile}%` }} />
                                </div>
                                <span className="font-mono text-[9.5px] font-bold text-indigo-600 w-8 text-right">{item.pePercentile.toFixed(0)}%</span>
                              </div>
                              <span className="col-span-2 font-mono text-right text-amber-600 font-bold">{item.dividendYield.toFixed(1)}%</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-1.5 bg-slate-50 dark:bg-slate-800/50 text-[10px] text-center text-slate-400 font-medium">
                          (导出版包含 {activeIndustries.length} 个行业高清矢量数据完整大表)
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TEMPLATE 1: Market Overview (NEW) */}
                {template === 'market_overview' && (
                  <div className={`p-4 rounded-xl border space-y-3.5 ${
                    themeMode === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                  }`}>
                    {/* 8 Major Indices Horizontal Grid */}
                    <div>
                      <div className="text-[10.5px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                        <Activity className="w-3 h-3 text-blue-500" />
                        <span>核心大盘指数走势矩阵</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {indices.slice(0, 8).map((idx) => {
                          const isUp = (idx.change || 0) >= 0;
                          return (
                            <div 
                              key={idx.code}
                              className={`p-2 rounded-lg border text-center transition-all ${
                                themeMode === 'dark' 
                                  ? 'bg-slate-800/80 border-slate-700' 
                                  : 'bg-white border-slate-200/80 shadow-xs'
                              }`}
                            >
                              <div className="text-[11px] font-bold text-slate-700 truncate">{idx.name}</div>
                              <div className={`text-xs font-mono font-black mt-0.5 ${isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {idx.price?.toFixed(2)}
                              </div>
                              <div className={`text-[10px] font-mono font-bold ${isUp ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {isUp ? '+' : ''}{idx.changePercent?.toFixed(2)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Macro KPI Strip */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center">
                        <div className="text-[10px] text-blue-600 font-bold">全天两市成交额</div>
                        <div className="text-sm font-black text-blue-700 font-mono mt-0.5">25,443 亿元</div>
                        <div className="text-[9.5px] text-blue-500">放量 +18.4%</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-center">
                        <div className="text-[10px] text-rose-600 font-bold">全市场主力净流入</div>
                        <div className="text-sm font-black text-rose-700 font-mono mt-0.5">-789.11 亿元</div>
                        <div className="text-[9.5px] text-rose-500">超大单博弈分化</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                        <div className="text-[10px] text-amber-600 font-bold">上涨 / 下跌家数比</div>
                        <div className="text-sm font-black text-slate-800 font-mono mt-0.5">
                          <span className="text-rose-600">3126</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-emerald-600">2029</span>
                        </div>
                        <div className="text-[9.5px] text-amber-600">多头情绪占比 60.6%</div>
                      </div>
                    </div>

                    {/* Gainers vs Outflows Horizontal Progress */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <div className="text-[10.5px] font-bold text-rose-600 mb-1.5 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>领涨板块 (主力净流入 TOP 4)</span>
                        </div>
                        <div className="space-y-1.5">
                          {(() => {
                            const maxInflow = Math.max(...topInflows.slice(0, 4).map(s => Math.abs(s.mainNetInflow || 0)), 10);
                            return topInflows.slice(0, 4).map((item, idx) => {
                              const pct = Math.min(100, Math.max(8, (Math.abs(item.mainNetInflow || 0) / maxInflow) * 100));
                              return (
                                <div key={item.id ? `top-inflow-${item.id}` : `top-inflow-${idx}`} className="flex items-center justify-between text-[10.5px]">
                                  <span className="w-16 truncate font-medium text-slate-700">{item.name}</span>
                                  <div className="flex-1 mx-2 bg-slate-200/70 h-2.5 rounded-full overflow-hidden flex">
                                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="font-mono font-bold text-rose-600 text-[10px]">+{item.mainNetInflow}亿</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      <div>
                        <div className="text-[10.5px] font-bold text-emerald-600 mb-1.5 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          <span>承压板块 (主力净流出 TOP 4)</span>
                        </div>
                        <div className="space-y-1.5">
                          {(() => {
                            const maxOutflow = Math.max(...topOutflows.slice(0, 4).map(s => Math.abs(s.mainNetInflow || 0)), 10);
                            return topOutflows.slice(0, 4).map((item, idx) => {
                              const pct = Math.min(100, Math.max(8, (Math.abs(item.mainNetInflow || 0) / maxOutflow) * 100));
                              return (
                                <div key={item.id ? `top-outflow-${item.id}` : `top-outflow-${idx}`} className="flex items-center justify-between text-[10.5px]">
                                  <span className="w-16 truncate font-medium text-slate-700">{item.name}</span>
                                  <div className="flex-1 mx-2 bg-slate-200/70 h-2.5 rounded-full overflow-hidden flex">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <span className="font-mono font-bold text-emerald-600 text-[10px]">{item.mainNetInflow}亿</span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE: GAINERS & LOSERS (大盘全景 · 行业领涨与领跌板块对照榜) */}
                {template === 'gainers_losers' && (
                  <div className={`p-4 rounded-xl border ${
                    themeMode === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                  }`}>
                    {/* Breadth Quick Stats */}
                    <div className="flex items-center justify-between text-xs pb-3 mb-3 border-b border-slate-200/60 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-700">全市场行业统计：</span>
                        <span className="text-rose-600 font-bold">涨 {overviewData?.industryBreadth?.up ?? 360}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-emerald-600 font-bold">跌 {overviewData?.industryBreadth?.down ?? 134}</span>
                        <span className="text-slate-400">/</span>
                        <span className="text-slate-600 font-bold">平 {overviewData?.industryBreadth?.flat ?? 2}</span>
                      </div>
                      <div className="font-mono text-slate-500">
                        行业均涨: <strong className="text-rose-600">+{(overviewData?.industryBreadth?.avgChangePercent ?? 0.82).toFixed(2)}%</strong>
                      </div>
                    </div>

                    {/* Dual Column Gainers & Losers */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left: 领涨 TOP 12 */}
                      <div>
                        <div className="text-[11px] font-bold text-rose-600 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>领涨板块 TOP 12 (行业先锋)</span>
                          </div>
                          <span className="text-[10px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">涨幅居前</span>
                        </div>
                        <div className="space-y-1.5">
                          {(() => {
                            const gainersList = (overviewData?.topGainers && overviewData.topGainers.length > 0)
                              ? overviewData.topGainers.slice(0, 12)
                              : [...sectors].sort((a, b) => (b.changePercent || 0) - (a.changePercent || 0)).slice(0, 12);
                            const maxGainer = Math.max(...gainersList.map(g => Math.abs(g.changePercent || 0)), 5);

                            return gainersList.map((sec, idx) => {
                              const pct = Math.min(100, Math.max(8, (Math.abs(sec.changePercent || 0) / maxGainer) * 100));
                              return (
                                <div key={sec.id ? `modal-gainer-${sec.id}` : `modal-gainer-${idx}`} className="text-[11px] flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 w-28 truncate">
                                    <span className={`w-3.5 h-3.5 rounded text-[9px] font-mono flex items-center justify-center ${
                                      idx < 3 ? 'bg-rose-500 text-white font-bold' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <span className="font-medium text-slate-800 truncate">{sec.name}</span>
                                  </div>
                                  <div className="flex-1 mx-2 bg-slate-200/60 h-3 rounded-full overflow-hidden flex">
                                    <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <div className="text-right flex items-center gap-1 min-w-[90px] justify-end">
                                    <span className="font-bold text-rose-600 text-[10.5px]">+{Math.abs(sec.changePercent || 0).toFixed(2)}%</span>
                                    <span className="text-[9.5px] text-slate-400 font-mono hidden sm:inline">({sec.mainNetInflow > 0 ? '+' : ''}{sec.mainNetInflow}亿)</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Right: 领跌 TOP 12 */}
                      <div>
                        <div className="text-[11px] font-bold text-emerald-600 mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5" />
                            <span>领跌板块 TOP 12 (承压调整)</span>
                          </div>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">跌幅居前</span>
                        </div>
                        <div className="space-y-1.5">
                          {(() => {
                            const losersList = (overviewData?.topLosers && overviewData.topLosers.length > 0)
                              ? overviewData.topLosers.slice(0, 12)
                              : [...sectors].sort((a, b) => (a.changePercent || 0) - (b.changePercent || 0)).slice(0, 12);
                            const maxLoser = Math.max(...losersList.map(l => Math.abs(l.changePercent || 0)), 3);

                            return losersList.map((sec, idx) => {
                              const pct = Math.min(100, Math.max(8, (Math.abs(sec.changePercent || 0) / maxLoser) * 100));
                              return (
                                <div key={sec.id ? `modal-loser-${sec.id}` : `modal-loser-${idx}`} className="text-[11px] flex items-center justify-between">
                                  <div className="flex items-center gap-1.5 w-28 truncate">
                                    <span className={`w-3.5 h-3.5 rounded text-[9px] font-mono flex items-center justify-center ${
                                      idx < 3 ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-200 text-slate-600'
                                    }`}>
                                      {idx + 1}
                                    </span>
                                    <span className="font-medium text-slate-800 truncate">{sec.name}</span>
                                  </div>
                                  <div className="flex-1 mx-2 bg-slate-200/60 h-3 rounded-full overflow-hidden flex">
                                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                                  </div>
                                  <div className="text-right flex items-center gap-1 min-w-[90px] justify-end">
                                    <span className="font-bold text-emerald-600 text-[10.5px]">-{Math.abs(sec.changePercent || 0).toFixed(2)}%</span>
                                    <span className="text-[9.5px] text-slate-400 font-mono hidden sm:inline">({sec.mainNetInflow}亿)</span>
                                  </div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 1: Panorama Chart */}
                {template === 'fundflow_panorama' && (
                  <div className={`p-4 rounded-xl border ${
                    themeMode === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                  }`}>
                    {/* Horizontal Bar Visualizations */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Inflow List */}
                      <div>
                        <div className="text-[11px] font-bold text-rose-600 mb-2 flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>主力净流入前列 TOP 10</span>
                        </div>
                        <div className="space-y-1.5">
                          {(() => {
                            const maxInflow = Math.max(...topInflows.slice(0, 10).map(s => Math.abs(s.mainNetInflow || 0)), 10);
                            return topInflows.slice(0, 10).map((sec, idx) => {
                              const pct = Math.min(100, Math.max(8, (Math.abs(sec.mainNetInflow || 0) / maxInflow) * 100));
                              return (
                                <div key={sec.id ? `modal-pano-in-${sec.id}` : `modal-pano-in-${idx}`} className="text-[11px] flex items-center justify-between gap-1">
                                  <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${
                                    idx < 3 ? 'bg-rose-500 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="w-18 truncate font-medium text-slate-700">{sec.name}</span>
                                  <div className="flex-1 mx-1.5 bg-slate-200/60 h-2.5 rounded-full overflow-hidden flex">
                                    <div 
                                      className="bg-rose-500 h-full rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-rose-600 text-[10px] w-12 text-right">
                                    {(sec.mainNetInflow || 0) >= 0 ? `+${(sec.mainNetInflow || 0).toFixed(1)}亿` : `${(sec.mainNetInflow || 0).toFixed(1)}亿`}
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* Outflow List */}
                      <div>
                        <div className="text-[11px] font-bold text-emerald-600 mb-2 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          <span>主力净流出前列 TOP 10</span>
                        </div>
                        <div className="space-y-1.5">
                          {(() => {
                            const maxOutflow = Math.max(...topOutflows.slice(0, 10).map(s => Math.abs(s.mainNetInflow || 0)), 10);
                            return topOutflows.slice(0, 10).map((sec, idx) => {
                              const pct = Math.min(100, Math.max(8, (Math.abs(sec.mainNetInflow || 0) / maxOutflow) * 100));
                              return (
                                <div key={sec.id ? `modal-pano-out-${sec.id}` : `modal-pano-out-${idx}`} className="text-[11px] flex items-center justify-between gap-1">
                                  <span className={`w-4 h-4 rounded text-[9px] font-bold flex items-center justify-center shrink-0 ${
                                    idx < 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                  <span className="w-18 truncate font-medium text-slate-700">{sec.name}</span>
                                  <div className="flex-1 mx-1.5 bg-slate-200/60 h-2.5 rounded-full overflow-hidden flex">
                                    <div 
                                      className="bg-emerald-500 h-full rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-emerald-600 text-[10px] w-12 text-right">
                                    {(sec.mainNetInflow || 0).toFixed(1)}亿
                                  </span>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 2: Sector Deep Dive */}
                {template === 'sector_deepdive' && (
                  <div className={`p-4 rounded-xl border ${
                    themeMode === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">{selectedSector.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                          {selectedSector.category === 'concept' ? '概念板块' : '行业板块'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-base font-black ${selectedSector.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {selectedSector.changePercent >= 0 ? '+' : ''}{selectedSector.changePercent}%
                        </span>
                      </div>
                    </div>

                    {/* 4 Metrics Matrix Graph */}
                    <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                        <div className="text-[10px] text-slate-400">主力净流入</div>
                        <div className={`text-xs font-black mt-0.5 ${selectedSector.mainNetInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {selectedSector.mainNetInflow > 0 ? '+' : ''}{selectedSector.mainNetInflow}亿
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                        <div className="text-[10px] text-slate-400">超大单净额</div>
                        <div className={`text-xs font-black mt-0.5 ${selectedSector.superLargeInflow >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {selectedSector.superLargeInflow > 0 ? '+' : ''}{selectedSector.superLargeInflow}亿
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                        <div className="text-[10px] text-slate-400">成交总额</div>
                        <div className="text-xs font-black mt-0.5 text-slate-800">
                          {selectedSector.totalTurnover}亿
                        </div>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60 shadow-xs">
                        <div className="text-[10px] text-slate-400">换手率</div>
                        <div className="text-xs font-black mt-0.5 text-slate-800">
                          {selectedSector.turnoverRate}%
                        </div>
                      </div>
                    </div>

                    {/* Lead Stock Progress */}
                    {selectedSector.leadStock && (
                      <div className="p-2 bg-white rounded-lg border border-slate-200/60 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded">领涨龙头</span>
                          <span className="font-black text-slate-800">{selectedSector.leadStock.name}</span>
                          <span className="text-[10px] text-slate-400">{selectedSector.leadStock.code}</span>
                        </div>
                        <span className="font-black text-rose-600">+{selectedSector.leadStock.changePercent}%</span>
                      </div>
                    )}
                  </div>
                )}

                {/* TEMPLATE 3: Sentiment Ladder */}
                {template === 'sentiment_ladder' && (
                  <div className={`p-4 rounded-xl border ${
                    themeMode === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                  }`}>
                    <div className="grid grid-cols-4 gap-2 mb-3 text-center">
                      <div className="p-2 bg-rose-50/80 border border-rose-200 rounded-lg">
                        <div className="text-[10px] text-rose-600 font-bold">涨停家数</div>
                        <div className="text-sm font-black text-rose-700">82 家</div>
                      </div>
                      <div className="p-2 bg-emerald-50/80 border border-emerald-200 rounded-lg">
                        <div className="text-[10px] text-emerald-600 font-bold">跌停家数</div>
                        <div className="text-sm font-black text-emerald-700">4 家</div>
                      </div>
                      <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-lg">
                        <div className="text-[10px] text-amber-600 font-bold">昨日连板晋级率</div>
                        <div className="text-sm font-black text-amber-700">62.5%</div>
                      </div>
                      <div className="p-2 bg-indigo-50/80 border border-indigo-200 rounded-lg">
                        <div className="text-[10px] text-indigo-600 font-bold">情绪温度</div>
                        <div className="text-sm font-black text-indigo-700">76° 偏多</div>
                      </div>
                    </div>

                    {/* Ladder Tiers */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 p-1.5 bg-rose-500/10 border border-rose-500/20 rounded">
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-black text-[10px]">5连板</span>
                        <span className="font-bold text-slate-800">万丰奥威 (002085)</span>
                        <span className="text-[10px] text-slate-500 ml-auto">低空经济核心龙头 / 封板资金 3.2亿</span>
                      </div>
                      <div className="flex items-center gap-2 p-1.5 bg-rose-500/10 border border-rose-500/20 rounded">
                        <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-black text-[10px]">3连板</span>
                        <span className="font-bold text-slate-800">中科曙光 (603019)、宗申动力 (001696)</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TEMPLATE 4: Gold Macro */}
                {template === 'gold_macro' && (
                  <div className={`p-4 rounded-xl border ${
                    themeMode === 'dark' ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/80 border-slate-200/80'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs font-black text-amber-600 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>伦敦现货金 (XAU/USD) 2,752.40 美元/盎司</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">国内沪金主力 628.50 元/克 (+1.85%)</div>
                      </div>
                      <span className="px-2 py-1 bg-amber-500 text-white font-black text-xs rounded-lg shadow-xs">
                        强力看多
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">赤峰黄金</div>
                        <div className="font-black text-rose-600">+5.42%</div>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">紫金矿业</div>
                        <div className="font-black text-rose-600">+3.88%</div>
                      </div>
                      <div className="p-2 bg-white rounded border border-slate-200">
                        <div className="text-[10px] text-slate-400">山东黄金</div>
                        <div className="font-black text-rose-600">+4.15%</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* --- 2. LOWER PART: TEXTUAL ANALYSIS & INSIGHTS (Strictly below image) --- */}
              <div className={`p-5 border-t relative z-10 ${
                themeMode === 'dark' ? 'border-slate-800 bg-slate-900/40' : 'border-slate-100 bg-slate-50/50'
              }`}>
                <div className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>【机构博弈与复盘策略解读 · 文字在下】</span>
                </div>

                {/* Dynamic Textual Insights based on Template */}
                <div className="space-y-2 text-xs leading-relaxed text-slate-700">
                  {template === 'etf_valuation' ? (
                    <>
                      <p className="font-medium">
                        <strong className="text-slate-900">1. ETF 估值分位与核心锚点：</strong> 
                        全市场宽基、策略、行业、主题及全球跨境 ETF 估值梯度明晰。以沪深300、中证A500为代表的核心宽基估值处于十年 25%~38% 偏低分位，安全边际良好，构成中长期稳健配置压舱石。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">2. 极度低估与红利防御：</strong> 
                        红利低波与高股息策略 ETF 股息率突破 4.2%，防守底仓价值显著；光伏、医药生物、恒生科技等行业主题处于 10% 历史极度低估分位，胜率赔率优异，适合分批定投布局。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">3. 场内折溢价套利与防守指引：</strong> 
                        跨境海外类 ETF 呈现适度溢价分化，警惕追高透支；建议坚守“低估值宽基做底仓 + 极度低估成长分批定投 + 策略红利防守对冲”的均衡量化轮动配置体系。
                      </p>
                    </>
                  ) : template === 'industry_valuation' ? (
                    <>
                      <p className="font-medium">
                        <strong className="text-slate-900">1. 申万31行业估值分化：</strong> 
                        全市场31个行业呈现鲜明的分层轮动特征，银行、煤炭、石油石化等高股息品种维持低PE高股息防守优势；电子、通信、计算机等科技成长方向在产业景气与算力基建驱动下分位数回升。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">2. PE历史分位数与安全边际：</strong> 
                        结合过去十年历史估值分位，处于 10% 以下的极度低估板块构筑了坚实的下行防守垫，而处于 90% 以上极度高估板块需关注业绩兑现与高位换手节奏。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">3. 哑铃型量化配置策略：</strong> 
                        建议采用“高股息现金流红利（底仓防守）+ 景气度持续修复且处于历史估值中位数下方的高性价比成长（进攻弹性）”攻守均衡策略。
                      </p>
                    </>
                  ) : template === 'market_treemap' ? (
                    <>
                      <p className="font-medium">
                        <strong className="text-slate-900">1. 板块热力权重分布：</strong> 
                        电子、银行、电力设备、非银金融、计算机等核心行业占据市场主要权重；半导体算力链、电池龙头与高股息大金融形成双主线共振，市场结构性做多氛围坚挺。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">2. 权重股涨跌与梯队扩散：</strong> 
                        宁德时代、寒武纪、海光信息等大市值中军呈现放量阳线，带动相应细分行业呈现大面积暖色扩散，个股赚钱效应主要集中于绩优与自主可控主线。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">3. 树图量化配置指引：</strong> 
                        本树状热力图按总市值等比铺陈矩形面积，色块深浅精确标定个股涨跌幅。建议重点锚定大面积深红核心品种，规避处于持续阴跌的弱势边缘资产。
                      </p>
                    </>
                  ) : template === 'market_overview' ? (
                    <>
                      <p className="font-medium">
                        <strong className="text-slate-900">1. 大盘指数与量能诊断：</strong> 
                        全天两市成交额放大至 25,443 亿元，各主要宽基指数呈现上行格局，盘中超大单与主力机构资金多空博弈充分，增量资金进场承接意愿坚决。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">2. 盘面强弱与多空特征：</strong> 
                        上涨家数达到 3,126 家，显著压制下跌 2,029 家，涨跌家数比达 1.54:1；领涨概念与主流热点具备明显赚钱效应，超短连板梯队稳步晋级。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">3. 后市策略与仓位指引：</strong> 
                        量能维持历史高位，市场趋势向上支撑坚实。建议维持 6-7 成积极仓位，紧盯主力资金与超大单持续加仓的核心宽基及高景气科技成长主线。
                      </p>
                    </>
                  ) : template === 'sentiment_ladder' ? (
                    <>
                      <p className="font-medium">
                        <strong className="text-slate-900">1. 短线情绪特征：</strong> 
                        两市涨停家数达 82 家，昨日连板晋级率高达 62.5%，情绪温度处在 76° 偏多活跃区间，未出现恶性核按钮压制。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">2. 高位连板梯队：</strong> 
                        低空经济万丰奥威 5 连板确立空间高度，AI 与高端装备 3 连板梯队接力顺畅，短线做多合力充沛。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">3. 接力操盘建议：</strong> 
                        重点博弈 2 进 3 强分歧弱转强机会，关注首板炸板率是否显著攀升作为防守观察哨。
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">
                        <strong className="text-slate-900">1. 资金盘口特征：</strong> 
                        今日全市场主力资金呈现结构性调仓特征，以农林牧渔、商贸零售及非银金融为代表的板块获得主力稳健配置，细分赛道获得增量超大单流入。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">2. 短线情绪研判：</strong> 
                        涨跌家数比呈现偏暖格局，两市上涨个股超 3,100 家。短线高位连板梯队保持良性换手，分歧接力承接意愿较强。
                      </p>
                      <p className="font-medium">
                        <strong className="text-slate-900">3. 明日操盘策略：</strong> 
                        建议重点关注主力资金连续2日以上净流入且量价配合优异的细分赛道龙头，警惕高位连续放量滞涨品种。
                      </p>
                    </>
                  )}
                </div>

                {/* Bottom Certification Footer */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    <span>行情状态：A股实盘交易时段已校准 · 机构级数据</span>
                  </div>
                  {watermarkMode === 'with_watermark' ? (
                    <div className="font-bold text-slate-500 tracking-wide">
                      {watermarkText} · 原创出品
                    </div>
                  ) : (
                    <div className="font-bold text-slate-500 tracking-wide">
                      上海 / 深圳交易所公开行情 · 纯净导出
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
