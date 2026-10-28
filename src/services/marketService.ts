import {
  IndexQuote,
  SectorFundFlow,
  MarketBreadth,
  NorthboundFlow,
  AnomalyAlert,
  TimeDimension,
  SectorCategory,
  AIAnalysisResult,
  AnomalyType,
  MarketOverviewData,
  WatchlistStock,
  PendingConvertibleBond
} from '../types/market';
import {
  initialIndices,
  initialSectors,
  initialAnomalyAlerts,
  initialMarketBreadth,
  initialNorthbound,
  initialMarketOverviewData,
  initialWatchlistStocks,
  searchableStockList
} from '../data/mockMarketData';
import {
  INITIAL_PENDING_CONVERTIBLE_BONDS,
  calculateCBSummary
} from '../data/pendingConvertibleBondsData';
import { calculateCBValuation } from '../utils/cbValuation';
import { audioAlertService } from '../utils/audioAlert';
import {
  getRealtimeDateString,
  getRealtimeTimeString,
  getRealtimeShortDateTimeString
} from '../utils/marketDateUtils';

export class MarketDataService {
  private indices: IndexQuote[] = JSON.parse(JSON.stringify(initialIndices));
  private sectors: SectorFundFlow[] = JSON.parse(JSON.stringify(initialSectors));
  private alerts: AnomalyAlert[] = JSON.parse(JSON.stringify(initialAnomalyAlerts));
  private marketBreadth: MarketBreadth = JSON.parse(JSON.stringify(initialMarketBreadth));
  private northbound: NorthboundFlow = JSON.parse(JSON.stringify(initialNorthbound));
  private overviewData: MarketOverviewData = JSON.parse(JSON.stringify(initialMarketOverviewData));
  private watchlist: WatchlistStock[] = JSON.parse(JSON.stringify(initialWatchlistStocks));
  private pendingBonds: PendingConvertibleBond[] = JSON.parse(JSON.stringify(INITIAL_PENDING_CONVERTIBLE_BONDS));
  
  private liveTradingDate: string = getRealtimeDateString();
  private liveTradingTime: string = getRealtimeTimeString();
  private isRealtimeActive: boolean = false;
  private lastLiveFetchTimestamp: number = 0;
  private liveFetchTimer: ReturnType<typeof setInterval> | null = null;

  private listeners: (() => void)[] = [];
  private alertListeners: ((alert: AnomalyAlert) => void)[] = [];
  private tickTimer: ReturnType<typeof setInterval> | null = null;
  private isSimulationRunning: boolean = true;
  private simulationSpeed: number = 1; // 1x, 2x, 5x

  constructor() {
    // Dynamic initialization with real current date and time (eliminating 2026-09-01)
    const today = getRealtimeDateString();
    const nowTime = getRealtimeTimeString();
    this.overviewData.dataRangeStart = `${today} 09:30:00`;
    this.overviewData.dataRangeEnd = `${today} ${nowTime}`;
    this.overviewData.lastCollectTime = getRealtimeShortDateTimeString();
    this.overviewData.pageRefreshTime = nowTime;

    this.startSimulation();
    this.startLiveFetch();

    // Initialize pending convertible bonds with live server data
    this.fetchPendingConvertibleBonds(false).then(data => {
      if (data && Array.isArray(data.bonds) && data.bonds.length > 0) {
        this.pendingBonds = data.bonds;
        this.notify();
      }
    }).catch(() => {});
  }

  public getPendingBonds(): PendingConvertibleBond[] {
    return this.pendingBonds;
  }

  public setPendingBonds(bonds: PendingConvertibleBond[]) {
    this.pendingBonds = bonds;
    this.notify();
  }

  public getLiveTradingDate(): string {
    return this.liveTradingDate;
  }

  public getLiveTradingTime(): string {
    return this.liveTradingTime;
  }

  public isLiveSourceActive(): boolean {
    return this.isRealtimeActive;
  }

  private startLiveFetch() {
    // Initial fetch immediately
    this.fetchLiveMarketData();

    // Regular polling every 6-8 seconds to keep live data freshest
    if (this.liveFetchTimer) clearInterval(this.liveFetchTimer);
    this.liveFetchTimer = setInterval(() => {
      this.fetchLiveMarketData();
    }, 7000);
  }

  public async fetchLiveMarketData() {
    try {
      if (typeof window === 'undefined') return;
      const res = await fetch('/api/market/realtime-all');
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        this.isRealtimeActive = true;
        this.liveTradingDate = data.dataDate || getRealtimeDateString();
        this.liveTradingTime = data.currentTime || getRealtimeTimeString();
        this.lastLiveFetchTimestamp = Date.now();

        if (Array.isArray(data.indices) && data.indices.length > 0) {
          this.indices = data.indices;
        }

        if (Array.isArray(data.sectors) && data.sectors.length > 0) {
          this.sectors = data.sectors;
        }

        if (data.overviewData) {
          this.overviewData = {
            ...this.overviewData,
            ...data.overviewData,
            dataRangeStart: data.dataRangeStart || `${this.liveTradingDate} 09:30:00`,
            dataRangeEnd: data.dataRangeEnd || `${this.liveTradingDate} ${this.liveTradingTime}`,
            lastCollectTime: data.lastCollectTime || getRealtimeShortDateTimeString(),
            pageRefreshTime: data.pageRefreshTime || this.liveTradingTime
          };
        }

        // Also sync real-time short-term signals alerts
        try {
          const alertRes = await fetch('/api/market/short-term-signals');
          if (alertRes.ok) {
            const alertData = await alertRes.json();
            if (alertData && alertData.success && Array.isArray(alertData.alerts) && alertData.alerts.length > 0) {
              this.alerts = alertData.alerts;
            }
          }
        } catch (e) {
          // ignore
        }

        this.notify();
      }
    } catch (err) {
      console.warn('Real-time market data poll error:', err);
    }
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public onNewAlert(listener: (alert: AnomalyAlert) => void) {
    this.alertListeners.push(listener);
    return () => {
      this.alertListeners = this.alertListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  public getIndices(): IndexQuote[] {
    return this.indices;
  }

  public getIndexByCode(code: string): IndexQuote | undefined {
    return this.indices.find(i => i.code === code || i.code.startsWith(code));
  }

  public getOverviewData(): MarketOverviewData {
    return this.overviewData;
  }

  public getWatchlist(): WatchlistStock[] {
    return this.watchlist;
  }

  public isInWatchlist(code: string): boolean {
    return this.watchlist.some(w => w.code === code);
  }

  public addToWatchlist(stock: { code: string; name: string; sector?: string; price?: number; changePercent?: number; notes?: string }) {
    if (this.isInWatchlist(stock.code)) return;
    const now = new Date();
    const timeStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const newStock: WatchlistStock = {
      code: stock.code,
      name: stock.name,
      price: stock.price || 50.0,
      change: stock.price ? Number((stock.price * (stock.changePercent || 0) / 100).toFixed(2)) : 1.2,
      changePercent: stock.changePercent || 0.0,
      mainNetInflow: Number(((Math.random() * 20 - 5)).toFixed(2)),
      superLargeInflow: Number(((Math.random() * 15 - 3)).toFixed(2)),
      turnoverRate: Number((Math.random() * 6 + 1).toFixed(2)),
      turnover: Number((Math.random() * 50 + 10).toFixed(1)),
      sectorName: stock.sector || '自选板块',
      addedAt: timeStr,
      notes: stock.notes || '用户手动加入自选池',
      sparkline: [48.0, 48.5, 49.2, 50.0]
    };

    this.watchlist = [newStock, ...this.watchlist];
    this.notify();
  }

  public removeFromWatchlist(code: string) {
    this.watchlist = this.watchlist.filter(w => w.code !== code);
    this.notify();
  }

  public searchStocks(keyword: string) {
    if (!keyword.trim()) return [];
    const kw = keyword.toLowerCase().trim();
    return searchableStockList.filter(s => 
      s.code.includes(kw) || s.name.toLowerCase().includes(kw) || s.sector.toLowerCase().includes(kw)
    );
  }

  public triggerManualRefresh() {
    const nowTime = getRealtimeTimeString();
    const shortDate = getRealtimeShortDateTimeString();
    
    this.overviewData.collectionRound += 1;
    this.overviewData.lastCollectTime = shortDate;
    this.overviewData.pageRefreshTime = nowTime;
    this.overviewData.totalRecords += Math.floor(Math.random() * 15 + 5);
    
    this.fetchLiveMarketData();
    this.tickMarketData();
    this.notify();
  }

  public getSectors(category?: SectorCategory, timeDim: TimeDimension = 'today'): SectorFundFlow[] {
    let list = this.sectors;
    if (category) {
      list = list.filter(s => s.category === category);
    }
    // Scale flows based on time dimension for historical simulation
    if (timeDim !== 'today') {
      const multiplier = timeDim === '3d' ? 2.4 : timeDim === '5d' ? 3.8 : timeDim === '10d' ? 6.5 : 11.2;
      return list.map(s => ({
        ...s,
        mainNetInflow: Number((s.mainNetInflow * multiplier).toFixed(2)),
        superLargeInflow: Number((s.superLargeInflow * multiplier).toFixed(2)),
        largeInflow: Number((s.largeInflow * multiplier).toFixed(2)),
        mediumInflow: Number((s.mediumInflow * multiplier).toFixed(2)),
        smallInflow: Number((s.smallInflow * multiplier).toFixed(2)),
        totalTurnover: Number((s.totalTurnover * multiplier * 0.9).toFixed(1)),
        changePercent: Number((s.changePercent * (0.8 + multiplier * 0.3)).toFixed(2))
      }));
    }
    return list;
  }

  public getSectorById(id: string): SectorFundFlow | undefined {
    return this.sectors.find(s => s.id === id);
  }

  public getAnomalyAlerts(filterType?: AnomalyType | 'all', minAmount?: number): AnomalyAlert[] {
    let list = this.alerts;
    if (filterType && filterType !== 'all') {
      list = list.filter(a => a.type === filterType);
    }
    if (minAmount && minAmount > 0) {
      list = list.filter(a => a.amount >= minAmount);
    }
    return list;
  }

  public getMarketBreadth(): MarketBreadth {
    return this.marketBreadth;
  }

  public getNorthbound(): NorthboundFlow {
    return this.northbound;
  }

  public setSimulationSpeed(speed: number) {
    this.simulationSpeed = speed;
    this.restartSimulation();
  }

  public toggleSimulation(running?: boolean) {
    this.isSimulationRunning = running !== undefined ? running : !this.isSimulationRunning;
    if (this.isSimulationRunning) {
      this.startSimulation();
    } else if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    this.notify();
  }

  public isRunning(): boolean {
    return this.isSimulationRunning;
  }

  public getSimulationSpeed(): number {
    return this.simulationSpeed;
  }

  private restartSimulation() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
    if (this.isSimulationRunning) {
      this.startSimulation();
    }
  }

  private startSimulation() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    const intervalMs = Math.max(800, Math.floor(2500 / this.simulationSpeed));

    this.tickTimer = setInterval(() => {
      if (!this.isSimulationRunning) return;
      this.tickMarketData();
    }, intervalMs);
  }

  private tickMarketData() {
    // 1. Tick Indices
    this.indices = this.indices.map(idx => {
      const volatility = idx.price * 0.0006;
      const delta = (Math.random() - 0.47) * volatility;
      const newPrice = Math.max(idx.prevClose * 0.8, Number((idx.price + delta).toFixed(2)));
      const change = Number((newPrice - idx.prevClose).toFixed(2));
      const changePercent = Number(((change / idx.prevClose) * 100).toFixed(2));
      const high = Math.max(idx.high, newPrice);
      const low = Math.min(idx.low, newPrice);
      const turnover = Number((idx.turnover + Math.random() * 2.5).toFixed(1));
      
      const newSparkline = [...idx.sparkline.slice(1), newPrice];

      return {
        ...idx,
        price: newPrice,
        change,
        changePercent,
        high,
        low,
        turnover,
        sparkline: newSparkline
      };
    });

    // 2. Tick Sectors
    this.sectors = this.sectors.map(sec => {
      const inflowDelta = (Math.random() - 0.45) * 0.45;
      const newInflow = Number((sec.mainNetInflow + inflowDelta).toFixed(2));
      const priceDelta = (Math.random() - 0.45) * 0.08;
      const newChange = Number((sec.changePercent + priceDelta).toFixed(2));
      const turnoverDelta = Math.random() * 1.5;
      
      // Update leading stock
      const leadDelta = (Math.random() - 0.45) * (sec.leadStock.price * 0.002);
      const leadPrice = Number((sec.leadStock.price + leadDelta).toFixed(2));
      const leadChange = Number((sec.leadStock.changePercent + (priceDelta * 1.2)).toFixed(2));
      const leadInflow = Number((sec.leadStock.mainNetInflow + inflowDelta * 0.35).toFixed(2));

      return {
        ...sec,
        mainNetInflow: newInflow,
        superLargeInflow: Number((sec.superLargeInflow + (inflowDelta > 0 ? inflowDelta * 0.7 : inflowDelta * 0.3)).toFixed(2)),
        largeInflow: Number((sec.largeInflow + inflowDelta * 0.3).toFixed(2)),
        changePercent: newChange,
        totalTurnover: Number((sec.totalTurnover + turnoverDelta).toFixed(1)),
        leadStock: {
          ...sec.leadStock,
          price: leadPrice,
          changePercent: leadChange,
          mainNetInflow: leadInflow
        }
      };
    });

    // 3. Tick Watchlist
    this.watchlist = this.watchlist.map(stk => {
      const deltaPercent = (Math.random() - 0.46) * 0.15;
      const newChangePercent = Number((stk.changePercent + deltaPercent).toFixed(2));
      const newPrice = Number((stk.price * (1 + deltaPercent / 100)).toFixed(2));
      const newChange = Number((stk.change + (newPrice - stk.price)).toFixed(2));
      const inflowDelta = (Math.random() - 0.45) * 0.3;
      const newSparkline = [...stk.sparkline.slice(1), newPrice];

      return {
        ...stk,
        price: newPrice,
        change: newChange,
        changePercent: newChangePercent,
        mainNetInflow: Number((stk.mainNetInflow + inflowDelta).toFixed(2)),
        sparkline: newSparkline
      };
    });

    // 4. Tick Overview Rankings subtly
    this.overviewData.topGainers = this.overviewData.topGainers.map(item => ({
      ...item,
      changePercent: Number((item.changePercent + (Math.random() - 0.48) * 0.05).toFixed(2)),
      mainNetInflow: Number((item.mainNetInflow + (Math.random() - 0.46) * 0.2).toFixed(2))
    }));

    this.overviewData.topLosers = this.overviewData.topLosers.map(item => ({
      ...item,
      changePercent: Number((item.changePercent + (Math.random() - 0.48) * 0.05).toFixed(2)),
      mainNetInflow: Number((item.mainNetInflow + (Math.random() - 0.52) * 0.2).toFixed(2))
    }));

    // 5. Tick Northbound
    const shAdd = (Math.random() - 0.4) * 0.3;
    const szAdd = (Math.random() - 0.38) * 0.4;
    this.northbound = {
      ...this.northbound,
      shNetBuy: Number((this.northbound.shNetBuy + shAdd).toFixed(2)),
      szNetBuy: Number((this.northbound.szNetBuy + szAdd).toFixed(2)),
      totalNetBuy: Number((this.northbound.totalNetBuy + shAdd + szAdd).toFixed(2))
    };

    // 6. Tick Breadth
    const randomWiggle = Math.floor((Math.random() - 0.48) * 6);
    this.marketBreadth = {
      ...this.marketBreadth,
      upCount: Math.min(4800, Math.max(1000, this.marketBreadth.upCount + randomWiggle)),
      downCount: Math.max(300, this.marketBreadth.downCount - randomWiggle),
      totalTurnoverAll: Number((this.marketBreadth.totalTurnoverAll + 4.2).toFixed(1))
    };

    // 7. Tick Pending Convertible Bonds stocks & dynamically update safety cushion calculations
    if (this.pendingBonds && this.pendingBonds.length > 0) {
      this.pendingBonds = this.pendingBonds.map(bond => {
        // Subtle tick: ~40% of bonds update per tick for realistic market volatility
        if (Math.random() < 0.6) return bond;
        const volatility = 0.0012;
        const deltaPercent = (Math.random() - 0.49) * volatility * 100;
        const newPrice = Number(Math.max(1.0, bond.stockPrice * (1 + deltaPercent / 100)).toFixed(2));
        if (newPrice === bond.stockPrice) return bond;

        const newChangePercent = Number((bond.stockChangePercent + deltaPercent).toFixed(2));
        const newConvertValue = bond.convertPrice > 0
          ? Number(((newPrice / bond.convertPrice) * 100).toFixed(2))
          : 100;
        const newRights100 = (bond.rationPerShare > 0 && newPrice > 0)
          ? Number(((bond.rationPerShare / newPrice) * 100).toFixed(2))
          : bond.rightsPer100;

        const liveValuation = calculateCBValuation({
          stockPrice: newPrice,
          convertPrice: bond.convertPrice,
          issueSize: bond.issueSize,
          rating: bond.rating,
          industry: bond.industry,
          rightsPer100: newRights100,
          rationPerShare: bond.rationPerShare
        });

        return {
          ...bond,
          stockPrice: newPrice,
          stockChangePercent: newChangePercent,
          convertValue: liveValuation.convertValue,
          rightsPer100: newRights100,
          safetyMargin: liveValuation.safetyMargin,
          estimatedListingPrice: liveValuation.estimatedListingPrice,
          estimatedListingGain: liveValuation.estimatedListingGain,
          estimatedPremiumRate: liveValuation.estimatedPremiumRate,
          valuationNote: liveValuation.valuationNote
        };
      });
    }

    // 8. Occasionally trigger random live anomaly
    if (Math.random() < 0.28) {
      this.generateLiveAnomaly();
    }

    this.notify();
  }

  private generateLiveAnomaly() {
    const candidates = [
      { code: '688981', name: '中芯国际', sector: '半导体芯片', basePrice: 88.50 },
      { code: '300308', name: '中际旭创', sector: 'AI算力', basePrice: 186.50 },
      { code: '000099', name: '中信海直', sector: '低空经济', basePrice: 24.60 },
      { code: '300418', name: '昆仑万维', sector: 'DeepSeek概念', basePrice: 46.80 },
      { code: '002896', name: '中大力德', sector: '人形机器人', basePrice: 42.15 },
      { code: '688027', name: '国盾量子', sector: '量子信息', basePrice: 245.00 },
      { code: '600118', name: '中国卫星', sector: '商业航天', basePrice: 33.40 },
      { code: '300037', name: '新宙邦', sector: '固态电池', basePrice: 48.20 },
      { code: '603019', name: '中科曙光', sector: '华为昇腾', basePrice: 74.20 },
      { code: '600030', name: '中信证券', sector: '证券金融', basePrice: 31.80 }
    ];

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const types: AnomalyType[] = ['block_buy', 'rocket_surge', 'rapid_limit', 'tail_rush', 'support_buy', 'block_sell', 'flash_dump', 'broken_limit'];
    const chosenType = types[Math.floor(Math.random() * types.length)];

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    let title = '';
    let description = '';
    let severity: 'high' | 'medium' | 'normal' = 'normal';
    let direction: 'bullish' | 'bearish' | 'neutral' = 'bullish';
    let amount = Math.floor(3000 + Math.random() * 15000);
    const volumeLots = Math.floor(5000 + Math.random() * 45000);
    const changeDelta = Number(((Math.random() * 2 + 0.5) * (chosenType.includes('sell') || chosenType.includes('dump') || chosenType.includes('broken') ? -1 : 1)).toFixed(2));
    const price = Number((target.basePrice * (1 + changeDelta / 100)).toFixed(2));

    switch (chosenType) {
      case 'block_buy':
        title = '万手特大单扫货';
        description = `主买单单笔成交 ${(volumeLots / 100).toFixed(0)}手，成交额 ${(amount / 100).toFixed(2)}万元，快速吃掉卖盘挂单`;
        severity = amount > 8000 ? 'high' : 'medium';
        direction = 'bullish';
        break;
      case 'rocket_surge':
        title = '火箭发射 5分钟急拉';
        description = `5分钟内突发脉冲式拉升 +${Math.abs(changeDelta * 1.5).toFixed(2)}%，多笔超大单密集进场`;
        severity = 'high';
        direction = 'bullish';
        break;
      case 'rapid_limit':
        title = '封单暴增 封死涨停';
        description = `买一位置瞬间追加封单 ${(volumeLots).toLocaleString()}手，主力游资强势锁定流动性`;
        severity = 'high';
        direction = 'bullish';
        break;
      case 'tail_rush':
        title = '尾盘抢筹 资金异动';
        description = `尾盘撮合大买单持续涌现，主力净买额突破 ${(amount / 100).toFixed(1)}万元`;
        severity = 'medium';
        direction = 'bullish';
        break;
      case 'support_buy':
        title = '压盘吸筹 蓄势突破';
        description = `主力大单压低挂单，并在低位暗中持续吃进大额买单，量价异动明显`;
        severity = 'normal';
        direction = 'bullish';
        break;
      case 'block_sell':
        title = '大单集中抛盘';
        description = `单笔特大卖单砸向买档，成交 ${(amount / 100).toFixed(2)}万元，短期面临获利回吐`;
        severity = 'medium';
        direction = 'bearish';
        break;
      case 'flash_dump':
        title = '高位跳水 快速回落';
        description = `高位突发密集大卖单砸盘，3分钟内回撤 ${(Math.abs(changeDelta) + 1.2).toFixed(2)}%`;
        severity = 'high';
        direction = 'bearish';
        break;
      case 'broken_limit':
        title = '炸板预警 开板震荡';
        description = `涨停板被大笔抛单强行砸开，主力资金瞬间流出 ${(amount / 100).toFixed(1)}万元`;
        severity = 'high';
        direction = 'bearish';
        break;
    }

    const newAlert: AnomalyAlert = {
      id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      time: timeStr,
      stockCode: target.code,
      stockName: target.name,
      sectorName: target.sector,
      type: chosenType,
      title,
      description,
      price,
      changePercent: changeDelta,
      amount,
      volumeLots,
      severity,
      direction,
      orderDetail: {
        type: direction === 'bullish' ? 'buy' : 'sell',
        price,
        lots: volumeLots
      }
    };

    // Prepend to alerts list (keep top 50)
    this.alerts = [newAlert, ...this.alerts.slice(0, 49)];

    // Play chime sound
    audioAlertService.playAnomalyChime(severity, direction);

    // Notify alert listeners
    this.alertListeners.forEach(cb => cb(newAlert));
  }

  // Request AI Deep Diagnosis via Server API
  public async requestAIDiagnosis(targetSectorOrStock?: string): Promise<AIAnalysisResult> {
    try {
      const topInflowSectors = this.sectors
        .sort((a, b) => b.mainNetInflow - a.mainNetInflow)
        .slice(0, 5)
        .map(s => `${s.name}(+${s.mainNetInflow}亿, 涨幅${s.changePercent}%)`)
        .join(', ');

      const topOutflowSectors = this.sectors
        .sort((a, b) => a.mainNetInflow - b.mainNetInflow)
        .slice(0, 3)
        .map(s => `${s.name}(${s.mainNetInflow}亿, 跌幅${s.changePercent}%)`)
        .join(', ');

      const recentAnomalies = this.alerts.slice(0, 4).map(a => `[${a.time}] ${a.stockName}(${a.stockCode}) - ${a.title}`).join('; ');

      const payload = {
        indices: this.indices.map(i => `${i.name}: ${i.price} (${i.changePercent > 0 ? '+' : ''}${i.changePercent}%)`).join('; '),
        topInflowSectors,
        topOutflowSectors,
        northboundTotal: `${this.northbound.totalNetBuy > 0 ? '净买入' : '净卖出'} ${this.northbound.totalNetBuy}亿元`,
        marketBreadth: `上涨${this.marketBreadth.upCount}家, 下跌${this.marketBreadth.downCount}家, 涨停${this.marketBreadth.limitUpCount}家, 成交额${this.marketBreadth.totalTurnoverAll}亿元`,
        recentAnomalies,
        specificTarget: targetSectorOrStock || '全市场资金流'
      };

      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('AI Diagnosis service error');
      }

      const data = await res.json();
      return data;
    } catch {
      // Fallback local heuristic analysis if offline or backend key not available
      return this.getLocalFallbackAnalysis(targetSectorOrStock);
    }
  }

  private getLocalFallbackAnalysis(target?: string): AIAnalysisResult {
    const isBullish = this.indices[0].changePercent > 0;
    const topSectors = this.sectors.sort((a, b) => b.mainNetInflow - a.mainNetInflow).slice(0, 3);

    return {
      title: `${target ? target + '专项' : 'A股主力资金流向'}智能深度研判`,
      summary: `今日两市呈现结构性分化行情。农业种植、传媒媒体与商超概念逆势走强，视频媒体以超20%涨幅领涨；高带宽内存、半导体设备等前期高位科技板块出现主力获利回吐。两市成交额维持在2.5万亿上方高量能水平。`,
      marketOutlook: isBullish ? '看多' : '中性震荡',
      capitalFlowAnalysis: `今日两市呈现红盘多于绿盘（3126家上涨），但大盘指数受半导体及高位概念抽血影响承压。主力资金在大消费、粮食种业板块净流入，高位科技概念出现阶段性资金调仓换股。`,
      hotSectorInsights: topSectors.map(s => ({
        sector: s.name,
        logic: `主力净流入${s.mainNetInflow}亿元，龙头${s.leadStock.name}放量领涨，机构席位与游资主力合力推升`,
        riskLevel: s.changePercent > 5 ? '中' : '低'
      })),
      anomalyVerdict: `异动个股中，万手扫货与火箭发射类型占比超过65%，反映多头主力短线承接意愿坚决，炸板率处于${this.marketBreadth.brokenLimitRate}%的安全区间。`,
      tacticalAdvice: [
        '关注资金低位回流的大消费、粮食种业等防御性主线；',
        '高位半导体设备与CPO光模块面临震荡分化，控制追高仓位；',
        '紧跟自选股中主力大单持续扫货的抗跌龙头。'
      ],
      keySupportResistance: {
        shSupport: 3950,
        shResistance: 4020,
        turnoverThreshold: '两市维持2万亿以上即具备主升行情动能'
      }
    };
  }

  /**
   * 待发可转债全流程与抢权配债数据获取
   * @param force 是否强制后端刷新
   */
  public async fetchPendingConvertibleBonds(force = false): Promise<any> {
    try {
      const res = await fetch(`/api/market/convertible-bonds-pre?refresh=${force ? 'true' : 'false'}`);
      if (!res.ok) throw new Error('API response not ok');
      const data = await res.json();
      if (data && Array.isArray(data.bonds) && data.bonds.length > 0) {
        this.pendingBonds = data.bonds;
        this.notify();
      }
      return data;
    } catch {
      // Offline / client fallback from INITIAL_PENDING_CONVERTIBLE_BONDS
      const { INITIAL_PENDING_CONVERTIBLE_BONDS, calculateCBSummary } = await import('../data/pendingConvertibleBondsData');
      const time = getRealtimeTimeString();
      return {
        success: true,
        source: '集思录 (Jisilu) 本地离线备用数据',
        updateTime: time,
        summary: calculateCBSummary(INITIAL_PENDING_CONVERTIBLE_BONDS, time),
        bonds: INITIAL_PENDING_CONVERTIBLE_BONDS
      };
    }
  }

  /**
   * 纳斯达克与标普500基金 QDII额度与限购监控数据获取
   * @param force 是否强制后端刷新
   */
  public async fetchQDIIQuotas(force = false): Promise<any> {
    try {
      const res = await fetch(`/api/market/qdii-quota?refresh=${force ? 'true' : 'false'}`);
      if (!res.ok) throw new Error('API response not ok');
      const data = await res.json();
      return data;
    } catch {
      // Offline / client fallback from INITIAL_QDII_FUNDS
      const { INITIAL_QDII_FUNDS, calculateQDIISummaryStats } = await import('../data/qdiiFundsData');
      const time = getRealtimeTimeString();
      return {
        success: true,
        source: '国家外汇管理局QDII投资额度披露 + 基金公司官方大额限购公告 (离线备用)',
        updateTime: time,
        summary: calculateQDIISummaryStats(INITIAL_QDII_FUNDS),
        funds: INITIAL_QDII_FUNDS
      };
    }
  }
}

export const marketService = new MarketDataService();
