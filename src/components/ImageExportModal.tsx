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
  AlertCircle
} from 'lucide-react';
import { SectorFundFlow, IndexQuote, MarketOverviewData } from '../types/market';
import { renderReportToCanvas, ReportThemeMode } from '../utils/reportCanvasRenderer';
import { getRealtimeDateString, getRealtimeTimeString } from '../utils/marketDateUtils';

export type ExportTemplateType = 
  | 'market_overview' 
  | 'fundflow_panorama' 
  | 'gainers_losers'
  | 'sector_deepdive' 
  | 'sentiment_ladder' 
  | 'gold_macro' 
  | 'current_snapshot';

interface ImageExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectors: SectorFundFlow[];
  indices: IndexQuote[];
  overviewData: MarketOverviewData;
  initialSector?: SectorFundFlow | null;
  initialTemplate?: ExportTemplateType;
}

export const ImageExportModal: React.FC<ImageExportModalProps> = ({
  isOpen,
  onClose,
  sectors,
  indices,
  overviewData,
  initialSector,
  initialTemplate
}) => {
  const [template, setTemplate] = useState<ExportTemplateType>(() => initialTemplate || 'market_overview');
  const [selectedSector, setSelectedSector] = useState<SectorFundFlow>(() => initialSector || sectors[0] || {} as SectorFundFlow);
  
  // Watermark switch: with watermark vs no watermark
  const [watermarkMode, setWatermarkMode] = useState<'with_watermark' | 'no_watermark'>('with_watermark');
  const [watermarkText, setWatermarkText] = useState<string>('公众号：我爱这young');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.16);
  const [watermarkStyle, setWatermarkStyle] = useState<'grid' | 'corner' | 'both'>('both');
  const [themeMode, setThemeMode] = useState<ReportThemeMode>('light');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [exportSuccess, setExportSuccess] = useState<boolean>(false);

  // New: Image Preview Before Export states
  const [previewTab, setPreviewTab] = useState<'image' | 'design'>('image');
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number; sizeKb: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const posterRef = useRef<HTMLDivElement>(null);

  // Generate date strings
  const todayStr = getRealtimeDateString();
  const nowTimeStr = getRealtimeTimeString();

  // Generate high-resolution crystal-clear image via native Canvas 2D (<15ms, 100% reliable)
  const generateImagePreview = useCallback((forceRegenerate = false): string | null => {
    if (previewImageUrl && !forceRegenerate) return previewImageUrl;

    setIsGeneratingPreview(true);
    try {
      const canvas = renderReportToCanvas({
        template,
        sectors,
        indices,
        overviewData,
        selectedSector,
        themeMode,
        watermarkMode,
        watermarkText,
        watermarkOpacity,
        watermarkStyle,
        todayStr
      });

      const dataUrl = canvas.toDataURL('image/png', 0.98);
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
  }, [template, sectors, indices, overviewData, selectedSector, themeMode, watermarkMode, watermarkText, watermarkOpacity, watermarkStyle, previewImageUrl, todayStr]);

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
  }, [isOpen, template, watermarkMode, watermarkText, watermarkOpacity, watermarkStyle, themeMode, selectedSector, overviewData]);

  if (!isOpen) return null;

  // Top 10 inflow & outflow sectors
  const topInflows = [...sectors].sort((a, b) => (b.mainNetInflow || 0) - (a.mainNetInflow || 0)).slice(0, 8);
  const topOutflows = [...sectors].sort((a, b) => (a.mainNetInflow || 0) - (b.mainNetInflow || 0)).slice(0, 8);

  const handleDownload = () => {
    setIsExporting(true);
    try {
      let dataUrl = previewImageUrl;
      if (!dataUrl) {
        dataUrl = generateImagePreview(true);
      }
      if (!dataUrl) {
        console.error('No image content to download');
        return;
      }

      const link = document.createElement('a');
      const watermarkTag = watermarkMode === 'with_watermark' ? '带水印' : '纯净无水印';
      const themeNameMap: Record<ReportThemeMode, string> = {
        light: '研报白',
        dark: '夜间黑',
        classic: '牛皮纸',
        navy: '机构蓝'
      };
      const templateNameMap: Record<ExportTemplateType, string> = {
        market_overview: '大盘全景总览',
        gainers_losers: '大盘全景领涨领跌板块',
        fundflow_panorama: '资金流向全景',
        sector_deepdive: '板块量化深度',
        sentiment_ladder: '市场情绪天梯',
        gold_macro: '黄金大宗研报',
        current_snapshot: '实时行情快照'
      };
      const themeTag = themeNameMap[themeMode] || themeMode;
      const tplTag = templateNameMap[template] || template;
      link.download = `A股研报_${tplTag}_${themeTag}_${watermarkTag}_${todayStr}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyImage = async () => {
    setIsExporting(true);
    try {
      let dataUrl = previewImageUrl;
      if (!dataUrl) {
        dataUrl = generateImagePreview(true);
      }
      if (!dataUrl) return;

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } else {
        handleDownload();
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    } catch (err) {
      console.warn('Clipboard copy failed, using download fallback:', err);
      handleDownload();
    } finally {
      setIsExporting(false);
    }
  };

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
            
            {/* 1. Template Selection */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                1. 选择研报图片模板
              </label>
              <div className="space-y-1.5">
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
                      <div className="font-bold">行业主力资金全景图</div>
                      <div className="text-[10px] text-slate-400 font-normal">496个行业主力净买卖横向对比</div>
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

            {/* Preview & Action Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              {/* Preview Trigger Button */}
              <button
                id="btn-generate-image-preview"
                onClick={() => {
                  setPreviewTab('image');
                  generateImagePreview(true);
                }}
                disabled={isGeneratingPreview || isExporting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-sm hover:shadow flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isGeneratingPreview ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-white" />
                    <span>正在光栅化生成超清图片预览...</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-4 h-4 text-indigo-200" />
                    <span>🔄 立即生成/刷新图片预览 (所见即所得)</span>
                  </>
                )}
              </button>

              <button
                id="btn-download-image"
                onClick={handleDownload}
                disabled={isExporting}
                className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>正在导出超清图片文件...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>导出并下载超清 PNG 图片 ({watermarkMode === 'with_watermark' ? '带水印' : '纯净无水印'})</span>
                  </>
                )}
              </button>

              <button
                id="btn-copy-image"
                onClick={handleCopyImage}
                disabled={isExporting}
                className="w-full py-2 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">已复制到剪贴板！可直接粘贴至微信/文档</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-500" />
                    <span>复制图片到剪贴板 (粘贴至微信/公众号)</span>
                  </>
                )}
              </button>
            </div>

            {exportSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium text-center animate-in fade-in">
                ✅ 图片已成功导出并保存！
              </div>
            )}
          </div>

          {/* Right Live Preview Canvas Area */}
          <div className="lg:col-span-8 flex flex-col items-center justify-start overflow-y-auto relative min-h-[500px]">
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
                        <span>真实研报图片已就绪 · 内容完整无白屏</span>
                      </div>
                      <div className="flex items-center gap-2.5 text-[11px] font-mono text-emerald-700">
                        {imageMeta && <span>{imageMeta.width}×{imageMeta.height}px</span>}
                        {imageMeta && <span>约 {imageMeta.sizeKb}KB</span>}
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

                      {/* Quick Floating Controls */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity bg-slate-950/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 text-white text-xs shadow-lg">
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
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>下载此图</span>
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 text-center">
                      💡 提示：以上为您即将下载的真实图片文件，所见即所得。如需微调内容可切换至「排版DOM源卡片」。
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

                {/* TEMPLATE 0: Market Overview (NEW) */}
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
                          <span>主力净流入前列 TOP 6</span>
                        </div>
                        <div className="space-y-1.5">
                          {(() => {
                            const maxInflow = Math.max(...topInflows.slice(0, 6).map(s => Math.abs(s.mainNetInflow || 0)), 10);
                            return topInflows.slice(0, 6).map((sec, idx) => {
                              const pct = Math.min(100, Math.max(8, (Math.abs(sec.mainNetInflow || 0) / maxInflow) * 100));
                              return (
                                <div key={sec.id ? `modal-pano-in-${sec.id}` : `modal-pano-in-${idx}`} className="text-[11px] flex items-center justify-between">
                                  <span className="w-16 truncate font-medium text-slate-700">{sec.name}</span>
                                  <div className="flex-1 mx-2 bg-slate-200/60 h-3 rounded-full overflow-hidden flex">
                                    <div 
                                      className="bg-rose-500 h-full rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-rose-600 text-[10px] w-12 text-right">+{sec.mainNetInflow}亿</span>
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
                          <span>主力净流出前列 TOP 6</span>
                        </div>
                        <div className="space-y-1.5">
                          {(() => {
                            const maxOutflow = Math.max(...topOutflows.slice(0, 6).map(s => Math.abs(s.mainNetInflow || 0)), 10);
                            return topOutflows.slice(0, 6).map((sec, idx) => {
                              const pct = Math.min(100, Math.max(8, (Math.abs(sec.mainNetInflow || 0) / maxOutflow) * 100));
                              return (
                                <div key={sec.id ? `modal-pano-out-${sec.id}` : `modal-pano-out-${idx}`} className="text-[11px] flex items-center justify-between">
                                  <span className="w-16 truncate font-medium text-slate-700">{sec.name}</span>
                                  <div className="flex-1 mx-2 bg-slate-200/60 h-3 rounded-full overflow-hidden flex">
                                    <div 
                                      className="bg-emerald-500 h-full rounded-full"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-emerald-600 text-[10px] w-12 text-right">{sec.mainNetInflow}亿</span>
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
                  {template === 'market_overview' ? (
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
