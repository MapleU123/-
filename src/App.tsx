import React, { useState, useEffect } from 'react';
import { 
  IndexQuote, 
  SectorFundFlow, 
  SectorStock, 
  AnomalyAlert, 
  MarketBreadth, 
  NorthboundFlow,
  ActiveNavigationTab,
  MarketOverviewData,
  WatchlistStock
} from './types/market';
import { marketService } from './services/marketService';
import { WebsiteHeader } from './components/WebsiteHeader';
import { MainFundFlowBoard } from './components/MainFundFlowBoard';
import { MarketOverviewView } from './components/MarketOverviewView';
import { QuantAnalysisView } from './components/QuantAnalysisView';
import { GoldAnalysisView } from './components/GoldAnalysisView';
import { TopTradersView } from './components/TopTradersView';
import { ShortTermSignalsView } from './components/ShortTermSignalsView';
import { USMarketView } from './components/USMarketView';
import { StockQueryView } from './components/StockQueryView';
import { CrawlerMonitorView } from './components/CrawlerMonitorView';
import { MarketSentimentView } from './components/MarketSentimentView';
import { WatchlistView } from './components/WatchlistView';
import { IndexTickerBar } from './components/IndexTickerBar';
import { IndexDetailModal } from './components/IndexDetailModal';
import { SectorFundFlowView } from './components/SectorFundFlowView';
import { SectorDetailModal } from './components/SectorDetailModal';
import { AnomalyAlertStream } from './components/AnomalyAlertStream';
import { StockDetailModal } from './components/StockDetailModal';
import { MultiDimensionalAnalysis } from './components/MultiDimensionalAnalysis';
import { AIMarketAdvisorModal } from './components/AIMarketAdvisorModal';
import { ImageExportModal, ExportTemplateType } from './components/ImageExportModal';
import { PendingConvertibleBondsView } from './components/PendingConvertibleBondsView';
import { QDIIQuotaView } from './components/QDIIQuotaView';
import { MarketStockHeatmapView } from './components/MarketStockHeatmapView';
import { IndustryValuationView } from './components/IndustryValuationView';
import { ETFValuationView } from './components/ETFValuationView';
import { CustomSectorsView } from './components/CustomSectorsView';
import { ETFValuationItem } from './types/etfValuation';
import { IndustryValuationItem } from './types/industryValuation';
import { ChevronRight, ChevronLeft, BellRing, X, PanelRightOpen, PanelRightClose } from 'lucide-react';

export default function App() {
  // Navigation State - Default to 'industry_valuation' so user's newly requested industry trend component is immediately visible
  const getInitialTab = (): ActiveNavigationTab => {
    try {
      const hash = window.location.hash.replace('#', '') as ActiveNavigationTab;
      const validTabs: ActiveNavigationTab[] = [
        'fundflow', 'custom_sectors', 'etf_valuation', 'industry_valuation', 'heatmap',
        'cb_pre', 'qdii', 'overview', 'quant', 'gold', 'toptraders',
        'anomalies', 'usmarket', 'watchlist', 'stockquery', 'crawler', 'sentiment'
      ];
      if (hash && validTabs.includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('activeTab') as ActiveNavigationTab;
      if (saved && validTabs.includes(saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'industry_valuation';
  };

  const [activeTab, setActiveTabState] = useState<ActiveNavigationTab>(getInitialTab);

  const setActiveTab = (tab: ActiveNavigationTab) => {
    setActiveTabState(tab);
    try {
      localStorage.setItem('activeTab', tab);
      window.location.hash = tab;
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ActiveNavigationTab;
      const validTabs: ActiveNavigationTab[] = [
        'fundflow', 'etf_valuation', 'industry_valuation', 'heatmap',
        'cb_pre', 'qdii', 'overview', 'quant', 'gold', 'toptraders',
        'anomalies', 'usmarket', 'watchlist', 'stockquery', 'crawler', 'sentiment'
      ];
      if (hash && validTabs.includes(hash)) {
        setActiveTabState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Real-time market state
  const [indices, setIndices] = useState<IndexQuote[]>(() => marketService.getIndices());
  const [sectors, setSectors] = useState<SectorFundFlow[]>(() => marketService.getSectors());
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(() => marketService.getAnomalyAlerts());
  const [breadth, setBreadth] = useState<MarketBreadth>(() => marketService.getMarketBreadth());
  const [northbound, setNorthbound] = useState<NorthboundFlow>(() => marketService.getNorthbound());
  const [overviewData, setOverviewData] = useState<MarketOverviewData>(() => marketService.getOverviewData());
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>(() => marketService.getWatchlist());

  // Right Sidebar Drawer Open State (guarantees immediate slide-out reaction from right edge on ANY screen)
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState<boolean>(false);

  const toggleRightSidebar = () => {
    setIsRightDrawerOpen(prev => !prev);
  };

  const openRightSidebar = () => {
    setIsRightDrawerOpen(true);
  };

  const closeRightSidebar = () => {
    setIsRightDrawerOpen(false);
  };

  // Modal States
  const [selectedIndex, setSelectedIndex] = useState<IndexQuote | null>(null);
  const [selectedSector, setSelectedSector] = useState<SectorFundFlow | null>(null);
  const [selectedStock, setSelectedStock] = useState<SectorStock | null>(null);
  const [selectedAlertStock, setSelectedAlertStock] = useState<AnomalyAlert | null>(null);
  const [selectedStockSectorName, setSelectedStockSectorName] = useState<string>('');
  const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
  const [aiTargetSector, setAiTargetSector] = useState<string | undefined>(undefined);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportTemplate, setExportTemplate] = useState<ExportTemplateType>('market_overview');
  const [exportContext, setExportContext] = useState<string>('fundflow');
  const [exportSelectedETFs, setExportSelectedETFs] = useState<ETFValuationItem[] | undefined>(undefined);
  const [exportSelectedIndustries, setExportSelectedIndustries] = useState<IndustryValuationItem[] | undefined>(undefined);

  const handleOpenExportImage = (
    tpl?: ExportTemplateType,
    sector?: SectorFundFlow | null,
    context?: string,
    selectedETFs?: ETFValuationItem[],
    selectedIndustries?: IndustryValuationItem[]
  ) => {
    setExportSelectedETFs(selectedETFs);
    setExportSelectedIndustries(selectedIndustries);
    const targetContext = context || (
      tpl === 'etf_valuation'
        ? 'etf_valuation'
        : tpl === 'industry_valuation' 
        ? 'industry_valuation' 
        : tpl === 'market_treemap' 
        ? 'heatmap' 
        : tpl === 'fundflow_panorama'
        ? 'fundflow'
        : tpl === 'gainers_losers' || tpl === 'market_overview'
        ? 'overview'
        : activeTab
    );
    setExportContext(targetContext);

    if (tpl) {
      setExportTemplate(tpl);
    } else {
      if (targetContext === 'etf_valuation') setExportTemplate('etf_valuation');
      else if (targetContext === 'industry_valuation') setExportTemplate('industry_valuation');
      else if (targetContext === 'heatmap') setExportTemplate('market_treemap');
      else if (targetContext === 'fundflow') setExportTemplate('fundflow_panorama');
      else if (targetContext === 'overview') setExportTemplate('gainers_losers');
      else if (targetContext === 'sentiment') setExportTemplate('sentiment_ladder');
      else if (targetContext === 'gold') setExportTemplate('gold_macro');
      else setExportTemplate('market_overview');
    }

    if (sector) {
      setSelectedSector(sector);
    }
    setIsExportModalOpen(true);
  };

  // Subscribe to live market simulation
  useEffect(() => {
    const unsubscribe = marketService.subscribe(() => {
      setIndices([...marketService.getIndices()]);
      setSectors([...marketService.getSectors()]);
      setAlerts([...marketService.getAnomalyAlerts()]);
      setBreadth({ ...marketService.getMarketBreadth() });
      setNorthbound({ ...marketService.getNorthbound() });
      setOverviewData({ ...marketService.getOverviewData() });
      setWatchlist([...marketService.getWatchlist()]);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectSector = (sector: SectorFundFlow) => {
    setSelectedSector(sector);
  };

  const handleSelectSectorByName = (sectorName: string) => {
    const found = sectors.find(s => s.name === sectorName || sectorName.includes(s.name) || s.name.includes(sectorName));
    if (found) {
      setSelectedSector(found);
    } else if (sectors.length > 0) {
      // Fallback show top sector
      setSelectedSector(sectors[0]);
    }
  };

  const handleSelectStockFromSector = (stock: SectorStock, sectorName: string) => {
    setSelectedStock(stock);
    setSelectedAlertStock(null);
    setSelectedStockSectorName(sectorName);
  };

  const handleSelectAlert = (alert: AnomalyAlert) => {
    setSelectedAlertStock(alert);
    setSelectedStock(null);
    setSelectedStockSectorName(alert.sectorName);
  };

  const handleOpenAIDiagnosis = (targetName?: string) => {
    setAiTargetSector(targetName);
    setIsAIModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f1f4f9] text-slate-800 flex flex-col font-sans selection:bg-red-500/20 selection:text-red-900">
      {/* 1. Professional Website Header & Horizontal Navigation Menu */}
      <WebsiteHeader
        overviewData={overviewData}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        watchlistCount={watchlist.length}
        onOpenAIDiagnosis={() => handleOpenAIDiagnosis()}
        onOpenExportImage={(context, template) => handleOpenExportImage(
          template,
          null,
          context || activeTab
        )}
        onSelectStock={(stk) => {
          const foundAlert = alerts.find(a => a.stockCode === stk.code);
          if (foundAlert) {
            setSelectedAlertStock(foundAlert);
          } else {
            handleOpenAIDiagnosis(`${stk.name}(${stk.code})`);
          }
        }}
        isRightSidebarCollapsed={!isRightDrawerOpen}
        onToggleRightSidebar={toggleRightSidebar}
      />

      {/* 2. Full-Width 8 Major A-Share Indices Real-Time Ticker Bar */}
      <IndexTickerBar
        indices={indices}
        onSelectIndex={(idx) => setSelectedIndex(idx)}
      />

      {/* 3. Full-Width Main Content Viewport with Collapsible Right AnomalyAlertStream Sidebar */}
      <main className="flex-1 w-full max-w-[1780px] mx-auto px-3 sm:px-6 py-4 overflow-y-auto">
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          {/* Main Tab Views Content Area */}
          <div className="flex-1 min-w-0 w-full space-y-4">
            {/* TAB: 资金流看板 (Exact Re-layout matching the User's Image Blueprint) */}
          {activeTab === 'fundflow' && (
            <MainFundFlowBoard
              sectors={sectors}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab)}
              onSelectSector={handleSelectSector}
              onOpenAIDiagnosis={handleOpenAIDiagnosis}
              onOpenExportImage={() => handleOpenExportImage('fundflow_panorama', null, 'fundflow')}
            />
          )}

          {/* TAB: 自定义板块 (个性化板块创建、编辑、成分股资金流穿透与多维分析) */}
          {activeTab === 'custom_sectors' && (
            <div className="space-y-4 max-w-[1780px] mx-auto">
              <CustomSectorsView
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
                onSelectStock={(stk) => handleSelectStockFromSector(stk as any, '自定义板块')}
                onOpenExportImage={(context, template) => handleOpenExportImage(
                  template || 'fundflow_panorama',
                  null,
                  context || 'custom_sectors'
                )}
              />
            </div>
          )}

          {/* TAB: ETF基金估值 (宽基/策略/行业/主题/全球 5大分类) */}
          {activeTab === 'etf_valuation' && (
            <div className="space-y-4 max-w-[1780px] mx-auto">
              <ETFValuationView
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
                onOpenReportExport={(selectedETFs) => handleOpenExportImage('etf_valuation', null, 'etf_valuation', selectedETFs)}
              />
            </div>
          )}

          {/* TAB: 31个行业指数估值 (申万一级市盈率百分位/极度低估到极度高估) */}
          {activeTab === 'industry_valuation' && (
            <div className="space-y-4 max-w-[1780px] mx-auto">
              <IndustryValuationView
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
                onOpenReportExport={(selectedIndustries) => handleOpenExportImage('industry_valuation', null, 'industry_valuation', undefined, selectedIndustries)}
                onSelectSectorByName={handleSelectSectorByName}
              />
            </div>
          )}

          {/* TAB: 市场个股涨跌幅热力图 (全市场个股涨跌幅热力图与高清导出) */}
          {activeTab === 'heatmap' && (
            <div className="space-y-4 max-w-[1780px] mx-auto">
              <MarketStockHeatmapView
                sectors={sectors}
                overviewData={overviewData}
                onSelectStock={handleSelectStockFromSector}
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
                onOpenReportExport={() => handleOpenExportImage('market_treemap', null, 'heatmap')}
              />
            </div>
          )}

          {/* TAB: 量化分析 */}
          {activeTab === 'quant' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">量化分析与多因子选股模型</h2>
                <button
                  onClick={() => setActiveTab('fundflow')}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  返回资金流看板
                </button>
              </div>
              <QuantAnalysisView
                sectors={sectors}
                onSelectSectorByName={handleSelectSectorByName}
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
              />
            </div>
          )}

          {/* TAB: 黄金分析 */}
          {activeTab === 'gold' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">黄金与贵金属宏观分析</h2>
                <button
                  onClick={() => setActiveTab('fundflow')}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  返回资金流看板
                </button>
              </div>
              <GoldAnalysisView
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
                onSelectStockByName={handleSelectSectorByName}
              />
            </div>
          )}

          {/* TAB: 实盘高手 */}
          {activeTab === 'toptraders' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">实盘高手持仓雷达与战法</h2>
                <button
                  onClick={() => setActiveTab('fundflow')}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  返回资金流看板
                </button>
              </div>
              <TopTradersView
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
                onSelectStockByName={handleSelectSectorByName}
              />
            </div>
          )}

          {/* TAB: 短线精灵 */}
          {activeTab === 'anomalies' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">短线精灵与异动大单雷达</h2>
                <button
                  onClick={() => setActiveTab('fundflow')}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  返回资金流看板
                </button>
              </div>
              <ShortTermSignalsView
                alerts={alerts}
                onSelectAlert={handleSelectAlert}
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
              />
            </div>
          )}

          {/* TAB: 美股行情 */}
          {activeTab === 'usmarket' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">美股指数与科技巨头走势</h2>
                <button
                  onClick={() => setActiveTab('fundflow')}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  返回资金流看板
                </button>
              </div>
              <USMarketView
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
                onNavigateToQDII={() => setActiveTab('qdii')}
              />
            </div>
          )}

          {/* TAB: 个股查询 */}
          {activeTab === 'stockquery' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">全市场个股资金深度查询</h2>
                <button
                  onClick={() => setActiveTab('fundflow')}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  返回资金流看板
                </button>
              </div>
              <StockQueryView
                sectors={sectors}
                onSelectStock={handleSelectStockFromSector}
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
              />
            </div>
          )}

          {/* TAB: 采集监控 */}
          {activeTab === 'crawler' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">后端采集管道与数据源监控</h2>
                <button
                  onClick={() => setActiveTab('fundflow')}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  返回资金流看板
                </button>
              </div>
              <CrawlerMonitorView
                overviewData={overviewData}
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
              />
            </div>
          )}

          {/* TAB: 市场情绪 */}
          {activeTab === 'sentiment' && (
            <div className="space-y-4 max-w-7xl mx-auto">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-slate-900">市场情绪罗盘与连板天梯</h2>
                <button
                  onClick={() => setActiveTab('fundflow')}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  返回资金流看板
                </button>
              </div>
              <MarketSentimentView
                breadth={breadth}
                sectors={sectors}
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
              />
            </div>
          )}

          {/* TAB: 待发转债 (集思录全流程跟踪与抢权配债) */}
          {activeTab === 'cb_pre' && (
            <div className="max-w-[1780px] mx-auto">
              <PendingConvertibleBondsView
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
                onSelectStockByName={handleSelectSectorByName}
              />
            </div>
          )}

          {/* TAB: QDII额度监控 (纳指 & 标普500基金额度与限购全景) */}
          {activeTab === 'qdii' && (
            <div className="max-w-[1780px] mx-auto">
              <QDIIQuotaView
                onOpenAIDiagnosis={handleOpenAIDiagnosis}
                onSelectStockByName={handleSelectSectorByName}
              />
            </div>
          )}

          {/* TAB: 大盘总览 */}
          {activeTab === 'overview' && (
            <MarketOverviewView
              indices={indices}
              overviewData={overviewData}
              onSelectSector={handleSelectSectorByName}
              onOpenAIDiagnosis={() => handleOpenAIDiagnosis('今日大盘与主力资金总览')}
              onOpenExportImage={(tpl) => handleOpenExportImage(tpl || 'gainers_losers', null, 'overview')}
            />
          )}

          {/* TAB: 板块资金流 (Original Deep Dive Dashboard) */}
          {activeTab === 'sectors' && (
            <div className="space-y-5 pb-12 w-full">
              {/* Top 8 Indices ticker bar */}
              <IndexTickerBar
                indices={indices}
                onSelectIndex={(idx) => setSelectedIndex(idx)}
              />

              <div className="space-y-5">
                <SectorFundFlowView
                  sectors={sectors}
                  onSelectSector={handleSelectSector}
                  onOpenAIDiagnosisForSector={(secName) => handleOpenAIDiagnosis(secName)}
                />

                <MultiDimensionalAnalysis
                  breadth={breadth}
                  northbound={northbound}
                  sectors={sectors}
                  onSelectSectorByName={handleSelectSectorByName}
                />
              </div>
            </div>
          )}

          {/* TAB: 我的自选股 */}
          {activeTab === 'watchlist' && (
            <WatchlistView
              watchlist={watchlist}
              alerts={alerts}
              onOpenAIDiagnosis={(stockName) => handleOpenAIDiagnosis(stockName)}
              onSelectSector={handleSelectSectorByName}
            />
          )}
          </div>
        </div>
      </main>

      {/* 4. Global Fixed Floating Trigger Handle on Right Edge of Viewport */}
      {/* Always accessible on any page, scroll position, or device width */}
      {!isRightDrawerOpen && (
        <div 
          id="global-floating-right-sidebar-container"
          className="fixed right-0 top-1/2 -translate-y-1/2 z-40 flex"
        >
          <button
            id="global-floating-right-sidebar-btn"
            onClick={openRightSidebar}
            className="flex flex-col items-center justify-center py-3.5 px-2 bg-gradient-to-b from-[#0b1329] via-[#111c3d] to-[#1e293b] hover:from-rose-950 hover:via-slate-900 hover:to-rose-900 text-white rounded-l-2xl shadow-2xl border-y border-l border-rose-500/50 hover:border-rose-400 cursor-pointer transition-all hover:-translate-x-1 group ring-2 ring-rose-500/20"
            title="点击快速打开右侧智能异动预警栏 (快捷键可随时展开)"
          >
            <div className="relative mb-2">
              <BellRing className="w-4 h-4 text-rose-400 group-hover:text-rose-300 animate-bounce" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900 animate-ping" />
            </div>
            <span className="text-[11px] font-black [writing-mode:vertical-lr] tracking-widest text-slate-100 group-hover:text-rose-200">
              ⚡ 异动雷达
            </span>
            {alerts.length > 0 && (
              <span className="mt-2 text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-rose-600 text-white font-bold shadow-xs">
                {alerts.length}
              </span>
            )}
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 group-hover:text-white mt-1.5 -translate-x-0.5" />
          </button>
        </div>
      )}

      {/* 5. Slide-Over Right Drawer (Guaranteed to open smoothly right on screen over any table/content) */}
      {isRightDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={closeRightSidebar}
            title="点击任意处关闭右侧栏"
          />

          {/* Drawer Panel */}
          <div className="relative w-full sm:w-[420px] max-w-full bg-[#0b1329] text-slate-100 h-full shadow-2xl flex flex-col z-10 border-l border-slate-800 animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-800 bg-[#111c3d]/95">
              <div className="flex items-center space-x-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
                </span>
                <span className="font-bold text-sm text-white">智能个股异动雷达</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                  LIVE ({alerts.length})
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10.5px] font-mono text-slate-400 hidden sm:inline">Esc退出</span>
                <button
                  onClick={closeRightSidebar}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                  title="关闭右侧栏 (快捷键: Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-3">
              <AnomalyAlertStream
                alerts={alerts}
                onSelectAlert={(alt) => {
                  handleSelectAlert(alt);
                  closeRightSidebar();
                }}
              />
            </div>
          </div>
        </div>
      )}

        {/* Professional Website Portal Footer */}
        <footer className="border-t border-slate-200 bg-white py-5 px-4 text-xs text-slate-500 mt-auto">
          <div className="max-w-[1780px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-slate-600 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>上海证券交易所 / 深圳证券交易所公开行情授权 · 机构级量化数据实时核验</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              东方财富 A股全景量化复盘门户 · 数据仅供投研分析与复盘参考 · 股市有风险 入市需谨慎
            </div>
          </div>
        </footer>

      {/* Modals */}
      {selectedIndex && (
        <IndexDetailModal
          index={selectedIndex}
          onClose={() => setSelectedIndex(null)}
        />
      )}

      {selectedSector && (
        <SectorDetailModal
          sector={selectedSector}
          onClose={() => setSelectedSector(null)}
          onSelectStock={handleSelectStockFromSector}
          onOpenAIDiagnosis={(secName) => handleOpenAIDiagnosis(secName)}
        />
      )}

      {(selectedStock || selectedAlertStock) && (
        <StockDetailModal
          stock={selectedStock}
          alertStock={selectedAlertStock}
          sectorName={selectedStockSectorName}
          onClose={() => {
            setSelectedStock(null);
            setSelectedAlertStock(null);
          }}
        />
      )}

      {isAIModalOpen && (
        <AIMarketAdvisorModal
          isOpen={isAIModalOpen}
          targetSector={aiTargetSector}
          onClose={() => {
            setIsAIModalOpen(false);
            setAiTargetSector(undefined);
          }}
        />
      )}

      {/* 研报图片导出弹窗（图片水平在文字上方，水印：公众号：我爱这young，支持有水印与无水印切换） */}
      <ImageExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sectors={sectors}
        indices={indices}
        overviewData={overviewData}
        initialSector={selectedSector}
        initialTemplate={exportTemplate}
        currentViewContext={exportContext}
        selectedETFs={exportSelectedETFs}
        selectedIndustries={exportSelectedIndustries}
      />
    </div>
  );
}
