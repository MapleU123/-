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

export default function App() {
  // Navigation State - Default to 'fundflow' matching the user's uploaded layout image!
  const [activeTab, setActiveTab] = useState<ActiveNavigationTab>('fundflow');

  // Real-time market state
  const [indices, setIndices] = useState<IndexQuote[]>(() => marketService.getIndices());
  const [sectors, setSectors] = useState<SectorFundFlow[]>(() => marketService.getSectors());
  const [alerts, setAlerts] = useState<AnomalyAlert[]>(() => marketService.getAnomalyAlerts());
  const [breadth, setBreadth] = useState<MarketBreadth>(() => marketService.getMarketBreadth());
  const [northbound, setNorthbound] = useState<NorthboundFlow>(() => marketService.getNorthbound());
  const [overviewData, setOverviewData] = useState<MarketOverviewData>(() => marketService.getOverviewData());
  const [watchlist, setWatchlist] = useState<WatchlistStock[]>(() => marketService.getWatchlist());

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

  const handleOpenExportImage = (tpl: ExportTemplateType = 'market_overview', sector?: SectorFundFlow | null) => {
    setExportTemplate(tpl);
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
        onOpenExportImage={() => handleOpenExportImage(activeTab === 'overview' ? 'market_overview' : 'fundflow_panorama')}
        onSelectStock={(stk) => {
          const foundAlert = alerts.find(a => a.stockCode === stk.code);
          if (foundAlert) {
            setSelectedAlertStock(foundAlert);
          } else {
            handleOpenAIDiagnosis(`${stk.name}(${stk.code})`);
          }
        }}
      />

      {/* 2. Full-Width 8 Major A-Share Indices Real-Time Ticker Bar */}
      <IndexTickerBar
        indices={indices}
        onSelectIndex={(idx) => setSelectedIndex(idx)}
      />

      {/* 3. Full-Width Main Content Viewport */}
      <main className="flex-1 w-full max-w-[1780px] mx-auto px-3 sm:px-6 py-4 overflow-y-auto">
          {/* TAB: 资金流看板 (Exact Re-layout matching the User's Image Blueprint) */}
          {activeTab === 'fundflow' && (
            <MainFundFlowBoard
              sectors={sectors}
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab)}
              onSelectSector={handleSelectSector}
              onOpenAIDiagnosis={handleOpenAIDiagnosis}
              onOpenExportImage={() => handleOpenExportImage('fundflow_panorama')}
            />
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

          {/* TAB: 大盘总览 */}
          {activeTab === 'overview' && (
            <MarketOverviewView
              indices={indices}
              overviewData={overviewData}
              onSelectSector={handleSelectSectorByName}
              onOpenAIDiagnosis={() => handleOpenAIDiagnosis('今日大盘与主力资金总览')}
              onOpenExportImage={(tpl) => handleOpenExportImage(tpl || 'gainers_losers')}
            />
          )}

          {/* TAB: 板块资金流 (Original Deep Dive Dashboard) */}
          {activeTab === 'sectors' && (
            <div className="space-y-5 pb-12 max-w-7xl mx-auto">
              {/* Top 8 Indices ticker bar */}
              <IndexTickerBar
                indices={indices}
                onSelectIndex={(idx) => setSelectedIndex(idx)}
              />

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left / Main Section (8 cols on lg) */}
                <div className="lg:col-span-8 space-y-5">
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

                {/* Right Section (4 cols on lg): Intelligent Anomaly Stock Alert Stream */}
                <div className="lg:col-span-4 h-full">
                  <AnomalyAlertStream
                    alerts={alerts}
                    onSelectAlert={handleSelectAlert}
                  />
                </div>
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
        </main>

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
      />
    </div>
  );
}
