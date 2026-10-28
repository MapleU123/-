import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
  Layers,
  Palette,
  Eye,
  Sliders,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  FileImage,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  FileCheck
} from 'lucide-react';
import { PendingConvertibleBond, CBProgressSummary } from '../types/market';
import {
  renderCBReportToCanvas,
  CBReportThemeMode,
  CBExportClarityTier,
  CBExportTemplateType
} from '../utils/cbReportCanvasRenderer';
import { getRealtimeDateString, getRealtimeTimeString } from '../utils/marketDateUtils';

export interface CBImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBonds: PendingConvertibleBond[];
  summary?: CBProgressSummary;
  initialSingleBond?: PendingConvertibleBond | null;
  initialTemplate?: CBExportTemplateType;
}

export const CB_THEME_NAMES: Record<CBReportThemeMode, string> = {
  light: '研报白 (默认)',
  dark: '极客夜间黑',
  classic: '典雅牛皮纸',
  navy: '深海机构蓝'
};

export const CB_CLARITY_CONFIG: Record<CBExportClarityTier, {
  label: string;
  tag: string;
  desc: string;
  res: string;
  scale: number;
  isRecommended?: boolean;
}> = {
  '2k': {
    label: '2K 视网膜',
    tag: '2.0x 锐化',
    desc: '适合微信/社群秒发，体积约1.5MB且文字边缘锋利',
    res: '2800×3600 (动态)',
    scale: 2.0
  },
  '4k': {
    label: '4K 旗舰极清',
    tag: '3.0x 推荐',
    desc: '近2000万像素，放大300%无任何毛刺，机构研报首选',
    res: '4200×5400 (动态)',
    scale: 3.0,
    isRecommended: true
  },
  '8k': {
    label: '8K 印刷母版',
    tag: '4.0x 母版',
    desc: '超3000万像素，专供投行路演、4K/8K投屏与出版印刷',
    res: '5600×7200 (动态)',
    scale: 4.0
  }
};

export const CBImageExportModal: React.FC<CBImageExportModalProps> = ({
  isOpen,
  onClose,
  selectedBonds,
  summary,
  initialSingleBond,
  initialTemplate = 'cb_list_long'
}) => {
  const [template, setTemplate] = useState<CBExportTemplateType>(initialTemplate);
  const [activeSingleBond, setActiveSingleBond] = useState<PendingConvertibleBond>(
    () => initialSingleBond || selectedBonds[0] || ({} as PendingConvertibleBond)
  );
  const [themeMode, setThemeMode] = useState<CBReportThemeMode>('light');
  const [clarity, setClarity] = useState<CBExportClarityTier>('4k');
  
  // Watermark
  const [watermarkMode, setWatermarkMode] = useState<'with_watermark' | 'no_watermark'>('with_watermark');
  const [watermarkText, setWatermarkText] = useState<string>('公众号：我爱这young');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.16);
  const [watermarkStyle, setWatermarkStyle] = useState<'grid' | 'corner' | 'both'>('both');

  // Preview & Export States
  const [activeTab, setActiveTab] = useState<'preview' | 'settings'>('preview');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeKb: number } | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const currentCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync initial props
  useEffect(() => {
    if (initialSingleBond) {
      setActiveSingleBond(initialSingleBond);
    } else if (selectedBonds.length > 0 && !activeSingleBond.id) {
      setActiveSingleBond(selectedBonds[0]);
    }
    if (initialTemplate) {
      setTemplate(initialTemplate);
    }
  }, [initialSingleBond, selectedBonds, initialTemplate]);

  // Generate Image Preview
  const generatePreview = useCallback(() => {
    if (!isOpen || selectedBonds.length === 0) return;
    setIsGenerating(true);

    // Run slightly deferred to avoid UI freeze
    setTimeout(() => {
      try {
        const canvas = renderCBReportToCanvas({
          template,
          selectedBonds,
          singleBond: activeSingleBond || selectedBonds[0],
          summary,
          themeMode,
          clarity,
          watermarkMode,
          watermarkText,
          watermarkOpacity,
          watermarkStyle,
          todayStr: getRealtimeDateString(),
          timeStr: getRealtimeTimeString()
        });

        currentCanvasRef.current = canvas;
        const dataUrl = canvas.toDataURL('image/png', 0.95);
        setPreviewImageUrl(dataUrl);

        // Approximate size
        const base64Len = dataUrl.length - 'data:image/png;base64,'.length;
        const approxBytes = (base64Len * 3) / 4;
        setImageMeta({
          width: canvas.width,
          height: canvas.height,
          sizeKb: Math.round(approxBytes / 1024)
        });
      } catch (err) {
        console.error('Failed to generate CB canvas preview', err);
      } finally {
        setIsGenerating(false);
      }
    }, 40);
  }, [
    isOpen,
    template,
    selectedBonds,
    activeSingleBond,
    summary,
    themeMode,
    clarity,
    watermarkMode,
    watermarkText,
    watermarkOpacity,
    watermarkStyle
  ]);

  // Trigger preview on modal open or options change
  useEffect(() => {
    if (isOpen) {
      generatePreview();
    } else {
      setPreviewImageUrl(null);
      currentCanvasRef.current = null;
    }
  }, [isOpen, generatePreview]);

  if (!isOpen) return null;

  // Download Handler
  const handleDownload = (format: 'png' | 'jpeg' = 'png') => {
    setIsExporting(true);
    setTimeout(() => {
      try {
        const canvas = currentCanvasRef.current || renderCBReportToCanvas({
          template,
          selectedBonds,
          singleBond: activeSingleBond || selectedBonds[0],
          summary,
          themeMode,
          clarity,
          watermarkMode,
          watermarkText,
          watermarkOpacity,
          watermarkStyle,
          todayStr: getRealtimeDateString(),
          timeStr: getRealtimeTimeString()
        });

        const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
        const ext = format === 'jpeg' ? 'jpg' : 'png';
        const link = document.createElement('a');
        const filename = template === 'cb_list_long'
          ? `待发可转债方案进展研报_${selectedBonds.length}只标的_${getRealtimeDateString()}_${clarity.toUpperCase()}.${ext}`
          : `待发转债研报_${activeSingleBond?.stockName || '标的'}_${activeSingleBond?.bondName || ''}_${getRealtimeDateString()}.${ext}`;

        link.download = filename;
        link.href = canvas.toDataURL(mime, format === 'jpeg' ? 0.92 : 1.0);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportSuccess(true);
        setTimeout(() => setExportSuccess(false), 3000);
      } catch (err) {
        console.error('Download failed', err);
      } finally {
        setIsExporting(false);
      }
    }, 50);
  };

  // Copy to Clipboard Handler
  const handleCopyToClipboard = async () => {
    setIsCopying(true);
    setCopyFeedback(null);

    try {
      const canvas = currentCanvasRef.current || renderCBReportToCanvas({
        template,
        selectedBonds,
        singleBond: activeSingleBond || selectedBonds[0],
        summary,
        themeMode,
        clarity,
        watermarkMode,
        watermarkText,
        watermarkOpacity,
        watermarkStyle,
        todayStr: getRealtimeDateString(),
        timeStr: getRealtimeTimeString()
      });

      if (navigator.clipboard && window.ClipboardItem) {
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const item = new ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([item]);
              setCopied(true);
              setCopyFeedback('已成功复制高清研报图片至剪贴板！可直接在微信、钉钉或富文本编辑器中粘贴 (Ctrl+V)');
              setTimeout(() => {
                setCopied(false);
                setCopyFeedback(null);
              }, 4000);
            } catch (writeErr) {
              console.warn('Direct image clipboard write failed', writeErr);
              handleDownload('png');
              setCopyFeedback('浏览器权限限制直接写入图片，已自动为您触发高清 PNG 下载！');
            }
          }
        }, 'image/png', 1.0);
      } else {
        handleDownload('png');
        setCopyFeedback('您的浏览器不支持直接复制二进制图片，已为您触发高清图片下载！');
      }
    } catch (err) {
      console.error('Copy failed', err);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-6xl max-h-[94vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-slate-50/90">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-amber-600 flex items-center justify-center text-white shadow-xs">
              <FileImage className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  待发可转债 · 高清研报图片导出
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
                  已选 {selectedBonds.length} 只标的
                </span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  方案进展全景跟踪
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                支持 2K / 4K / 8K 超清母版导出 · 4种专业研报主题 · 抢权配债与安全垫量化测算
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Tab switch between preview and settings */}
            <div className="hidden sm:flex p-1 bg-slate-200/80 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>预览图片</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer flex items-center space-x-1.5 ${
                  activeTab === 'settings'
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>研报定制</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Left Control Panel + Right Live Canvas Preview */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Controls Sidebar */}
          <div className="w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-slate-200 bg-slate-50/60 p-4 overflow-y-auto space-y-4">
            {/* 1. Template Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-rose-500" />
                  导出研报模版
                </span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setTemplate('cb_list_long')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col ${
                    template === 'cb_list_long'
                      ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-400/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      📋 方案进展与抢权配债清单长图
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">
                      推荐
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    完整收录已选 {selectedBonds.length} 只标的对比表格、6大方案进展阶段、百元含权排序与一手党操作要诀。
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setTemplate('cb_single_card')}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col ${
                    template === 'cb_single_card'
                      ? 'border-rose-500 bg-rose-50/60 ring-2 ring-rose-400/20 shadow-xs'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      🎯 单标的抢权配债深度研报卡
                    </span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                      深度分析
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    专攻单只标的：含权率大字报、6流程时间轴、持股收益测算矩阵与业务投向研判。
                  </p>
                </button>
              </div>

              {/* If single card, select which bond */}
              {template === 'cb_single_card' && (
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-slate-600 mb-1 block">
                    选择具体标的：
                  </label>
                  <select
                    value={activeSingleBond?.id || ''}
                    onChange={(e) => {
                      const found = selectedBonds.find(b => b.id === e.target.value);
                      if (found) setActiveSingleBond(found);
                    }}
                    className="w-full text-xs font-medium px-2.5 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                  >
                    {selectedBonds.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.stockName} ({b.stockCode}) · {b.bondName} (含权: ¥{b.rightsPer100})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Theme Mode */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                  研报视觉主题
                </span>
                <span className="text-[11px] text-slate-400">
                  {CB_THEME_NAMES[themeMode]}
                </span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['light', 'dark', 'classic', 'navy'] as CBReportThemeMode[]).map((mode) => {
                  const isSelected = themeMode === mode;
                  const themeColors: Record<CBReportThemeMode, { bg: string; border: string; text: string }> = {
                    light: { bg: 'bg-white', border: 'border-slate-300', text: 'text-slate-800' },
                    dark: { bg: 'bg-slate-900', border: 'border-slate-700', text: 'text-white' },
                    classic: { bg: 'bg-[#fdfbf7]', border: 'border-[#d6c7b2]', text: 'text-[#44403c]' },
                    navy: { bg: 'bg-[#0a192f]', border: 'border-[#1e3a8a]', text: 'text-blue-100' }
                  };
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setThemeMode(mode)}
                      className={`p-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer flex items-center space-x-2 ${
                        isSelected
                          ? 'border-rose-500 ring-2 ring-rose-400/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full ${themeColors[mode].bg} border ${themeColors[mode].border}`}></span>
                      <span className="text-slate-700">{CB_THEME_NAMES[mode].split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Clarity Tier */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  画质清晰度母版
                </span>
                <span className="text-[11px] font-mono text-rose-600 font-bold">
                  {CB_CLARITY_CONFIG[clarity].tag}
                </span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['2k', '4k', '8k'] as CBExportClarityTier[]).map((tier) => {
                  const item = CB_CLARITY_CONFIG[tier];
                  const isSelected = clarity === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setClarity(tier)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                        isSelected
                          ? 'border-rose-500 bg-rose-50/70 text-rose-700 font-bold ring-2 ring-rose-400/20'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xs">{item.label}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">{item.tag}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-500">
                {CB_CLARITY_CONFIG[clarity].desc}
              </p>
            </div>

            {/* 4. Watermark Configuration */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  防伪水印设置
                </span>
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setWatermarkMode('with_watermark')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      watermarkMode === 'with_watermark'
                        ? 'bg-white font-bold text-slate-800 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    带水印
                  </button>
                  <button
                    type="button"
                    onClick={() => setWatermarkMode('no_watermark')}
                    className={`px-2 py-0.5 rounded cursor-pointer ${
                      watermarkMode === 'no_watermark'
                        ? 'bg-white font-bold text-slate-800 shadow-xs'
                        : 'text-slate-500'
                    }`}
                  >
                    纯净无水印
                  </button>
                </div>
              </div>

              {watermarkMode === 'with_watermark' && (
                <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-500 mb-1 block">水印署名文本：</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      placeholder="如：公众号：我爱这young"
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                      <span>水印透明度：</span>
                      <span className="font-mono font-bold text-slate-700">{Math.round(watermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.08"
                      max="0.35"
                      step="0.02"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Refresh Preview Trigger */}
            <button
              type="button"
              onClick={generatePreview}
              disabled={isGenerating}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? '正在渲染高清图谱...' : '重新生成预览画卷'}</span>
            </button>
          </div>

          {/* Right: Live Canvas Preview Viewport */}
          <div className="flex-1 flex flex-col bg-slate-100/90 overflow-hidden relative">
            {/* Top Toolbar: Zoom & Info */}
            <div className="h-10 px-4 border-b border-slate-200 bg-white flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center space-x-2">
                <span className="font-medium text-slate-700">实时渲染预览:</span>
                {imageMeta && (
                  <span className="font-mono text-[11px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    {imageMeta.width} × {imageMeta.height} px · 约 {(imageMeta.sizeKb / 1024).toFixed(1)} MB
                  </span>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.max(0.4, Number((prev - 0.2).toFixed(1))))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors cursor-pointer"
                  title="缩小"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono font-semibold text-[11px] text-slate-700 w-10 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(prev => Math.min(2.0, Number((prev + 0.2).toFixed(1))))}
                  className="p-1 hover:bg-slate-100 rounded text-slate-600 transition-colors cursor-pointer"
                  title="放大"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1)}
                  className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:text-slate-800 rounded hover:bg-slate-100 cursor-pointer"
                >
                  100%
                </button>
              </div>
            </div>

            {/* Canvas Image Container */}
            <div
              ref={previewContainerRef}
              className="flex-1 overflow-auto p-4 flex items-center justify-center relative min-h-[380px]"
            >
              {isGenerating && (
                <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center space-y-3">
                  <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold text-slate-700">正在生成 {clarity.toUpperCase()} 高清研报母版...</p>
                </div>
              )}

              {previewImageUrl ? (
                <div 
                  className="transition-transform duration-150 origin-top shadow-xl rounded-lg overflow-hidden border border-slate-300/80 bg-white"
                  style={{
                    transform: `scale(${zoomLevel})`,
                    maxWidth: zoomLevel <= 1 ? '100%' : 'none'
                  }}
                >
                  <img
                    src={previewImageUrl}
                    alt="可转债高清研报预览"
                    className="block max-w-full h-auto"
                  />
                </div>
              ) : (
                <div className="text-center text-slate-400 text-xs">
                  暂未渲染图片预览，请点击「重新生成预览画卷」
                </div>
              )}
            </div>

            {/* Copy Feedback Notification */}
            {copyFeedback && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-slate-900/90 text-white text-xs font-medium rounded-xl shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>{copyFeedback}</span>
              </div>
            )}

            {/* Export Success Notification */}
            {exportSuccess && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-lg flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2">
                <Check className="w-4 h-4" />
                <span>高清图片下载指令已触发！请在浏览器下载栏中查收文件。</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-white flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>已准备好 {clarity.toUpperCase()} ({CB_CLARITY_CONFIG[clarity].label}) 母版导出</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Copy to Clipboard */}
            <button
              type="button"
              onClick={handleCopyToClipboard}
              disabled={isCopying || isGenerating}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              <span>{copied ? '已复制到剪贴板' : '复制图片到剪贴板'}</span>
            </button>

            {/* Download JPEG */}
            <button
              type="button"
              onClick={() => handleDownload('jpeg')}
              disabled={isExporting || isGenerating}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-amber-700" />
              <span>下载 JPEG</span>
            </button>

            {/* Download PNG (Primary) */}
            <button
              type="button"
              onClick={() => handleDownload('png')}
              disabled={isExporting || isGenerating}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 ring-2 ring-rose-500/20"
            >
              <Download className="w-4 h-4" />
              <span>下载 {clarity.toUpperCase()} 高清研报图 (PNG)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
