import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Sparkles,
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
  FileCheck,
  Layers,
  Scale
} from 'lucide-react';
import { HeatmapStockItem } from '../data/marketStockHeatmapData';
import { MarketOverviewData } from '../types/market';
import {
  renderStockHeatmapToCanvas,
  HeatmapExportTheme,
  HeatmapExportResolution,
  HEATMAP_RESOLUTIONS
} from '../utils/stockHeatmapCanvasRenderer';
import { getRealtimeDateString, getRealtimeTimeString } from '../utils/marketDateUtils';

export interface StockHeatmapExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stocks: HeatmapStockItem[];
  overviewData?: MarketOverviewData;
  initialTheme?: HeatmapExportTheme;
  initialResolution?: HeatmapExportResolution;
}

export const StockHeatmapExportModal: React.FC<StockHeatmapExportModalProps> = ({
  isOpen,
  onClose,
  stocks,
  overviewData,
  initialTheme = 'dark',
  initialResolution = '4k'
}) => {
  const [theme, setTheme] = useState<HeatmapExportTheme>(initialTheme);
  const [resolution, setResolution] = useState<HeatmapExportResolution>(initialResolution);
  const [watermarkText, setWatermarkText] = useState<string>('A股量化投研复盘终端 · 公众号专属');
  const [showWatermark, setShowWatermark] = useState<boolean>(true);
  const [sizeMetric, setSizeMetric] = useState<'marketCap' | 'turnover'>('marketCap');
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(0.28); // preview scale

  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [renderedCanvas, setRenderedCanvas] = useState<HTMLCanvasElement | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Re-render canvas when options change
  const triggerRender = useCallback(async () => {
    setIsRendering(true);
    try {
      const canvas = await renderStockHeatmapToCanvas({
        stocks,
        overviewData,
        dateStr: getRealtimeDateString(),
        timeStr: getRealtimeTimeString(),
        theme,
        resolution,
        watermarkText,
        showWatermark,
        sizeMetric,
        selectedGroupFilter
      });
      setRenderedCanvas(canvas);
    } catch (e) {
      console.error('Failed to render stock heatmap canvas', e);
    } finally {
      setIsRendering(false);
    }
  }, [stocks, overviewData, theme, resolution, watermarkText, showWatermark, sizeMetric, selectedGroupFilter]);

  useEffect(() => {
    if (isOpen) {
      triggerRender();
    }
  }, [isOpen, triggerRender]);

  // Adjust zoom for preview container
  useEffect(() => {
    if (resolution === 'portrait') {
      setZoomLevel(0.32);
    } else if (resolution === '4k') {
      setZoomLevel(0.24);
    } else {
      setZoomLevel(0.35);
    }
  }, [resolution]);

  // Handle Download PNG
  const handleDownload = () => {
    if (!renderedCanvas) return;
    try {
      const dateStr = getRealtimeDateString().replace(/-/g, '');
      const filename = `A股个股涨跌幅全景热力图_${dateStr}_${resolution.toUpperCase()}.png`;
      const link = document.createElement('a');
      link.download = filename;
      link.href = renderedCanvas.toDataURL('image/png', 1.0);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error('Download error', e);
    }
  };

  // Handle Copy to Clipboard
  const handleCopyClipboard = async () => {
    if (!renderedCanvas) return;
    try {
      renderedCanvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 3000);
        } catch (err) {
          console.warn('Clipboard write failed, fallback downloading', err);
          handleDownload();
        }
      }, 'image/png');
    } catch (e) {
      console.error('Copy blob error', e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 sm:p-4 overflow-hidden">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-[1580px] h-[92vh] flex flex-col shadow-2xl text-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* 1. Modal Top Bar */}
        <div className="px-5 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-rose-600 via-red-600 to-amber-500 flex items-center justify-center text-white shadow-md">
              <FileImage className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">
                  导出高清市场个股涨跌幅热力图
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {HEATMAP_RESOLUTIONS[resolution].label.split(' ')[0]} 极清输出
                </span>
              </div>
              <p className="text-xs text-slate-400">
                支持 4K 旗舰级/2K 视网膜/竖屏长图极清导出，高保真矢量文字渲染，适合社交分享与投研复盘
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Refresh Canvas */}
            <button
              onClick={triggerRender}
              disabled={isRendering}
              title="重新渲染生成"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${isRendering ? 'animate-spin' : ''}`} />
            </button>

            {/* Copy button */}
            <button
              id="btn-copy-heatmap-image"
              onClick={handleCopyClipboard}
              disabled={isRendering}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制到剪贴板' : '复制高清图片'}</span>
            </button>

            {/* Download button */}
            <button
              id="btn-download-heatmap-image"
              onClick={handleDownload}
              disabled={isRendering}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer shadow-md ${
                downloadSuccess
                  ? 'bg-emerald-600 text-white shadow-emerald-900/50'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-rose-900/50'
              }`}
            >
              {downloadSuccess ? <Check className="w-4 h-4 text-white" /> : <Download className="w-4 h-4" />}
              <span>{downloadSuccess ? '下载成功!' : '下载高清 PNG 图片'}</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Main Workspace: Settings Left + Canvas Preview Right */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Settings Panel */}
          <div className="w-80 sm:w-88 bg-slate-950/80 border-r border-slate-800 p-4 overflow-y-auto space-y-5 flex-shrink-0 text-xs">
            
            {/* Resolution Selector */}
            <div className="space-y-2">
              <label className="text-slate-400 font-bold flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-rose-400" />
                <span>输出清晰度等级</span>
              </label>
              <div className="grid grid-cols-1 gap-2">
                {(['4k', '2k', 'portrait'] as HeatmapExportResolution[]).map((res) => {
                  const cfg = HEATMAP_RESOLUTIONS[res];
                  const isSel = resolution === res;
                  return (
                    <button
                      key={res}
                      onClick={() => setResolution(res)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSel
                          ? 'bg-rose-950/40 border-rose-500/80 text-white shadow-xs'
                          : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{cfg.label}</span>
                        {res === '4k' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            推荐
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">{cfg.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Theme Selector */}
            <div className="space-y-2">
              <label className="text-slate-400 font-bold flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>视觉配色主题</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'dark' as HeatmapExportTheme, label: '深空黑夜', desc: '夜间高对比' },
                  { id: 'light' as HeatmapExportTheme, label: '专业纯白', desc: '研报印刷风' },
                  { id: 'oled' as HeatmapExportTheme, label: 'OLED纯黑', desc: '极客黑色' },
                ].map((th) => {
                  const isSel = theme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => setTheme(th.id)}
                      className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                        isSel
                          ? 'bg-indigo-950/50 border-indigo-500 text-white font-bold'
                          : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div>{th.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{th.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Metric */}
            <div className="space-y-2">
              <label className="text-slate-400 font-bold flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5 text-amber-400" />
                <span>个股权重考量维度</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSizeMetric('marketCap')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    sizeMetric === 'marketCap'
                      ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 font-bold'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400'
                  }`}
                >
                  按总市值权重
                </button>
                <button
                  onClick={() => setSizeMetric('turnover')}
                  className={`p-2 rounded-lg border text-center transition-all cursor-pointer ${
                    sizeMetric === 'turnover'
                      ? 'bg-amber-950/40 border-amber-500/80 text-amber-200 font-bold'
                      : 'bg-slate-900/70 border-slate-800 text-slate-400'
                  }`}
                >
                  按成交活跃度
                </button>
              </div>
            </div>

            {/* Scope Filter */}
            <div className="space-y-2">
              <label className="text-slate-400 font-bold flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>覆盖行业与概念范围</span>
              </label>
              <select
                value={selectedGroupFilter}
                onChange={(e) => setSelectedGroupFilter(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
              >
                <option value="all">全市场核心成分股 (全部行业)</option>
                <option value="科技成长">科技成长 (半导体/算力/AI/软件)</option>
                <option value="高端制造">高端制造 (新能源/锂电/汽车/军工)</option>
                <option value="大消费">核心大消费 (白酒/食品饮料/医药生物)</option>
                <option value="大金融">大金融 (银行/券商/保险/高股息)</option>
                <option value="周期资源">周期资源 (有色金属/煤炭/化工/石油)</option>
              </select>
            </div>

            {/* Watermark Config */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 font-bold flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>机构/公众号防伪水印</span>
                </label>
                <input
                  type="checkbox"
                  checked={showWatermark}
                  onChange={(e) => setShowWatermark(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0 cursor-pointer"
                />
              </div>
              {showWatermark && (
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  placeholder="自定义图片底部水印文字..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden font-medium"
                />
              )}
            </div>

            {/* Summary Tips */}
            <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-slate-300">💡 导出建议：</div>
              <div>• 4K超高清格式适合投屏报告、微信公众号首图</div>
              <div>• 竖屏长图版适合直接保存发送给微信好友与社群</div>
              <div>• 生成的 PNG 包含清晰涨跌停标识与实时行情快照</div>
            </div>

          </div>

          {/* Right Canvas Preview Area */}
          <div className="flex-1 bg-slate-950 flex flex-col overflow-hidden relative">
            
            {/* Preview Toolbar */}
            <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 flex-shrink-0">
              <div className="flex items-center space-x-2 font-mono">
                <span>原图尺寸: {HEATMAP_RESOLUTIONS[resolution].width} × {HEATMAP_RESOLUTIONS[resolution].height}px</span>
                <span>•</span>
                <span>缩放预览: {(zoomLevel * 100).toFixed(0)}%</span>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.15, z - 0.05))}
                  title="缩小"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(0.8, z + 0.05))}
                  title="放大"
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setZoomLevel(0.25)}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 cursor-pointer"
                >
                  适应窗口
                </button>
              </div>
            </div>

            {/* Preview Canvas Container */}
            <div
              ref={previewContainerRef}
              className="flex-1 overflow-auto p-4 sm:p-8 flex items-center justify-center bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
            >
              {isRendering ? (
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-10 h-10 border-3 border-rose-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-semibold text-slate-300">正在生成超清 4K 热力图...</span>
                </div>
              ) : renderedCanvas ? (
                <div
                  style={{
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'center center',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
                  }}
                  className="transition-transform duration-100 ease-out border border-slate-700/60 rounded-lg overflow-hidden flex-shrink-0"
                >
                  <img
                    src={renderedCanvas.toDataURL('image/png')}
                    alt="Stock Heatmap Preview"
                    style={{
                      width: `${HEATMAP_RESOLUTIONS[resolution].width}px`,
                      height: `${HEATMAP_RESOLUTIONS[resolution].height}px`
                    }}
                  />
                </div>
              ) : (
                <div className="text-sm text-slate-500">正在初始化热力图画布...</div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
