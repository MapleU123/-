import { CustomSector, CustomSectorFundFlow, CustomSectorStock } from '../types/customSector';
import { SectorStock, SectorFundFlow } from '../types/market';
import { initialSectors, searchableStockList, initialWatchlistStocks } from '../data/mockMarketData';
import { getRealtimeDateString } from '../utils/marketDateUtils';

const STORAGE_KEY = 'a_share_custom_sectors_v1';

// Preset realistic default custom sectors reflecting key 2026 investment themes
const DEFAULT_CUSTOM_SECTORS: CustomSector[] = [
  {
    id: 'cs-ai-compute',
    name: '🚀 算力核心与半导体旗舰',
    description: '集结全市场最顶尖的AI服务器、光模块(CPO)、国产算力GPU及先进制程代工龙头，主线进攻先锋。',
    tagColor: 'rose',
    createdAt: '2026-03-15',
    updatedAt: getRealtimeDateString(),
    stocks: [
      { code: '300308', name: '中际旭创', addedAt: '2026-03-15', notes: '全球800G/1.6T光模块市占率第一' },
      { code: '601138', name: '工业富联', addedAt: '2026-03-15', notes: '全球AI服务器代工绝对主力' },
      { code: '688256', name: '寒武纪', addedAt: '2026-03-16', notes: '国产AI推理与训练自研架构龙头' },
      { code: '688981', name: '中芯国际', addedAt: '2026-03-18', notes: '中国大陆最大芯片代工与晶圆基地' },
      { code: '688041', name: '海光信息', addedAt: '2026-03-20', notes: '国产x86 CPU与DCU加速处理器' },
      { code: '300502', name: '新易盛', addedAt: '2026-03-21', notes: '硅光模块与高速光通信出海龙头' },
      { code: '300476', name: '胜宏科技', addedAt: '2026-03-22', notes: '英伟达高阶HDI核心供应商' }
    ]
  },
  {
    id: 'cs-high-dividend',
    name: '💎 高股息红利现金奶牛',
    description: '长期现金流充沛、股息率超4%的高防御央国企底仓资产，兼顾高分红安全垫与长线复利。',
    tagColor: 'emerald',
    createdAt: '2026-03-10',
    updatedAt: getRealtimeDateString(),
    stocks: [
      { code: '601088', name: '中国神华', addedAt: '2026-03-10', notes: '煤电运一体化超高股息标杆' },
      { code: '600900', name: '长江电力', addedAt: '2026-03-10', notes: '六大梯级水电站，永续现金流' },
      { code: '601225', name: '陕西煤业', addedAt: '2026-03-12', notes: '吨煤成本行业最低，分红比例可观' },
      { code: '601398', name: '工商银行', addedAt: '2026-03-14', notes: '宇宙行稳健分红，长期资金压舱石' },
      { code: '600941', name: '中国移动', addedAt: '2026-03-15', notes: '数字基建超级现金牛，派息率逐年提升' },
      { code: '600028', name: '中国石化', addedAt: '2026-03-18', notes: '高股息石化央企，破净修复空间大' }
    ]
  },
  {
    id: 'cs-new-energy',
    name: '⚡ 固态电池与出海先锋',
    description: '覆盖全固态电池材料突破、全球储能逆变器与智能电动车产业链头部企业。',
    tagColor: 'indigo',
    createdAt: '2026-03-25',
    updatedAt: getRealtimeDateString(),
    stocks: [
      { code: '300750', name: '宁德时代', addedAt: '2026-03-25', notes: '全球动力与储能电池双冠王' },
      { code: '002594', name: '比亚迪', addedAt: '2026-03-25', notes: '新能源车全产业链自研出海领跑者' },
      { code: '300014', name: '亿纬锂能', addedAt: '2026-03-28', notes: '消费电池稳健，大圆柱与固态预研' },
      { code: '300274', name: '阳光电源', addedAt: '2026-04-02', notes: '全球光伏逆变器与大储系统出海龙头' },
      { code: '002050', name: '三花智控', addedAt: '2026-04-05', notes: '热管理全球霸主，人形机器人执行器布局' }
    ]
  }
];

class CustomSectorService {
  private customSectors: CustomSector[] = [];
  private allStocksMap: Map<string, SectorStock> = new Map();
  private searchableCatalog: { code: string; name: string; price: number; changePercent: number; sector?: string }[] = [];

  constructor() {
    this.buildGlobalStockPool();
    this.loadFromStorage();
  }

  /**
   * Build complete stock lookup map from all mock datasets
   */
  private buildGlobalStockPool() {
    const map = new Map<string, SectorStock>();
    const catalogMap = new Map<string, { code: string; name: string; price: number; changePercent: number; sector?: string }>();

    // 1. Ingest searchableStockList
    searchableStockList.forEach(s => {
      catalogMap.set(s.code, {
        code: s.code,
        name: s.name,
        price: s.price,
        changePercent: s.changePercent,
        sector: s.sector
      });

      map.set(s.code, {
        code: s.code,
        name: s.name,
        price: s.price,
        changePercent: s.changePercent,
        mainNetInflow: Number(((s.changePercent * 0.45) + (s.price * 0.05)).toFixed(2)),
        mainNetRatio: Number((s.changePercent * 2.5).toFixed(1)),
        turnover: Number((Math.abs(s.price * 1.5) + 5.2).toFixed(2)),
        turnoverRate: Number((Math.abs(s.changePercent * 0.8) + 2.1).toFixed(2)),
        superLargeInflow: Number(((s.changePercent * 0.25) + 0.5).toFixed(2)),
        largeInflow: Number(((s.changePercent * 0.20) + 0.3).toFixed(2)),
        mediumInflow: Number((-(s.changePercent * 0.15) - 0.2).toFixed(2)),
        smallInflow: Number((-(s.changePercent * 0.30) - 0.6).toFixed(2)),
        peRatio: 28.5,
        marketCap: Number((s.price * 8.5).toFixed(1))
      });
    });

    // 2. Ingest stocks from all sectors
    initialSectors.forEach(sec => {
      sec.topStocks?.forEach(stk => {
        map.set(stk.code, stk);
        catalogMap.set(stk.code, {
          code: stk.code,
          name: stk.name,
          price: stk.price,
          changePercent: stk.changePercent,
          sector: sec.name
        });
      });
    });

    // 3. Ingest watchlist stocks
    initialWatchlistStocks.forEach(w => {
      if (!map.has(w.code)) {
        map.set(w.code, {
          code: w.code,
          name: w.name,
          price: w.price,
          changePercent: w.changePercent,
          mainNetInflow: w.mainNetInflow,
          mainNetRatio: 5.2,
          turnover: w.turnover || 12.8,
          turnoverRate: w.turnoverRate || 3.5,
          superLargeInflow: w.superLargeInflow || Number((w.mainNetInflow * 0.6).toFixed(2)),
          largeInflow: Number((w.mainNetInflow * 0.4).toFixed(2)),
          mediumInflow: -1.2,
          smallInflow: -2.3,
          peRatio: 32.0,
          marketCap: 450.0
        });
      }
      if (!catalogMap.has(w.code)) {
        catalogMap.set(w.code, {
          code: w.code,
          name: w.name,
          price: w.price,
          changePercent: w.changePercent,
          sector: '自选核心'
        });
      }
    });

    // Add extra popular A-share bluechips if missing
    const popularExtras: SectorStock[] = [
      { code: '300308', name: '中际旭创', price: 168.50, changePercent: 5.82, mainNetInflow: 8.62, mainNetRatio: 14.2, turnover: 60.5, turnoverRate: 4.8, superLargeInflow: 5.2, largeInflow: 3.42, mediumInflow: -2.1, smallInflow: -6.52, peRatio: 38.5, marketCap: 1350 },
      { code: '601138', name: '工业富联', price: 26.40, changePercent: 3.25, mainNetInflow: 6.45, mainNetRatio: 9.8, turnover: 65.8, turnoverRate: 2.1, superLargeInflow: 4.1, largeInflow: 2.35, mediumInflow: -1.8, smallInflow: -4.65, peRatio: 18.2, marketCap: 5240 },
      { code: '688256', name: '寒武纪', price: 432.00, changePercent: 7.15, mainNetInflow: 5.18, mainNetRatio: 16.4, turnover: 31.5, turnoverRate: 3.6, superLargeInflow: 3.2, largeInflow: 1.98, mediumInflow: -1.2, smallInflow: -3.98, peRatio: 95.0, marketCap: 1800 },
      { code: '688981', name: '中芯国际', price: 92.50, changePercent: 2.85, mainNetInflow: 4.30, mainNetRatio: 6.5, turnover: 66.2, turnoverRate: 2.9, superLargeInflow: 2.8, largeInflow: 1.5, mediumInflow: -1.0, smallInflow: -3.3, peRatio: 85.0, marketCap: 7350 },
      { code: '688041', name: '海光信息', price: 135.20, changePercent: 4.10, mainNetInflow: 3.85, mainNetRatio: 11.2, turnover: 34.3, turnoverRate: 3.1, superLargeInflow: 2.4, largeInflow: 1.45, mediumInflow: -0.9, smallInflow: -2.95, peRatio: 72.0, marketCap: 3140 },
      { code: '300502', name: '新易盛', price: 118.60, changePercent: 6.40, mainNetInflow: 4.75, mainNetRatio: 15.1, turnover: 31.4, turnoverRate: 5.2, superLargeInflow: 2.9, largeInflow: 1.85, mediumInflow: -1.4, smallInflow: -3.35, peRatio: 42.0, marketCap: 840 },
      { code: '300476', name: '胜宏科技', price: 42.15, changePercent: 4.85, mainNetInflow: 2.65, mainNetRatio: 8.9, turnover: 29.8, turnoverRate: 6.8, superLargeInflow: 1.6, largeInflow: 1.05, mediumInflow: -0.8, smallInflow: -1.85, peRatio: 26.5, marketCap: 364 },
      { code: '601088', name: '中国神华', price: 41.50, changePercent: 1.25, mainNetInflow: 2.85, mainNetRatio: 12.5, turnover: 22.8, turnoverRate: 0.4, superLargeInflow: 1.8, largeInflow: 1.05, mediumInflow: -0.5, smallInflow: -2.35, peRatio: 12.5, marketCap: 8250 },
      { code: '600900', name: '长江电力', price: 30.20, changePercent: 0.85, mainNetInflow: 3.10, mainNetRatio: 15.0, turnover: 20.6, turnoverRate: 0.3, superLargeInflow: 2.0, largeInflow: 1.1, mediumInflow: -0.4, smallInflow: -2.7, peRatio: 22.0, marketCap: 7380 },
      { code: '601225', name: '陕西煤业', price: 25.80, changePercent: 1.65, mainNetInflow: 1.95, mainNetRatio: 9.8, turnover: 19.8, turnoverRate: 0.8, superLargeInflow: 1.2, largeInflow: 0.75, mediumInflow: -0.3, smallInflow: -1.65, peRatio: 11.0, marketCap: 2500 },
      { code: '601398', name: '工商银行', price: 6.15, changePercent: 0.65, mainNetInflow: 4.20, mainNetRatio: 18.2, turnover: 23.0, turnoverRate: 0.1, superLargeInflow: 2.8, largeInflow: 1.4, mediumInflow: -0.8, smallInflow: -3.4, peRatio: 5.6, marketCap: 21900 },
      { code: '600941', name: '中国移动', price: 108.50, changePercent: 1.10, mainNetInflow: 2.75, mainNetRatio: 11.4, turnover: 24.1, turnoverRate: 0.2, superLargeInflow: 1.7, largeInflow: 1.05, mediumInflow: -0.5, smallInflow: -2.25, peRatio: 16.2, marketCap: 23200 },
      { code: '600028', name: '中国石化', price: 6.85, changePercent: 0.90, mainNetInflow: 1.85, mainNetRatio: 8.5, turnover: 21.8, turnoverRate: 0.3, superLargeInflow: 1.1, largeInflow: 0.75, mediumInflow: -0.4, smallInflow: -1.45, peRatio: 12.0, marketCap: 8350 },
      { code: '300750', name: '宁德时代', price: 265.80, changePercent: 3.80, mainNetInflow: 9.50, mainNetRatio: 11.5, turnover: 82.6, turnoverRate: 1.8, superLargeInflow: 6.2, largeInflow: 3.3, mediumInflow: -2.8, smallInflow: -6.7, peRatio: 24.5, marketCap: 11690 },
      { code: '002594', name: '比亚迪', price: 298.50, changePercent: 2.45, mainNetInflow: 5.80, mainNetRatio: 8.8, turnover: 65.9, turnoverRate: 1.5, superLargeInflow: 3.6, largeInflow: 2.2, mediumInflow: -1.9, smallInflow: -3.9, peRatio: 22.0, marketCap: 8690 },
      { code: '300014', name: '亿纬锂能', price: 48.20, changePercent: 4.15, mainNetInflow: 2.85, mainNetRatio: 9.6, turnover: 29.6, turnoverRate: 3.5, superLargeInflow: 1.7, largeInflow: 1.15, mediumInflow: -0.7, smallInflow: -2.15, peRatio: 25.0, marketCap: 986 },
      { code: '300274', name: '阳光电源', price: 92.40, changePercent: 3.65, mainNetInflow: 4.10, mainNetRatio: 10.2, turnover: 40.1, turnoverRate: 2.9, superLargeInflow: 2.5, largeInflow: 1.6, mediumInflow: -1.1, smallInflow: -3.0, peRatio: 18.0, marketCap: 1370 },
      { code: '002050', name: '三花智控', price: 24.50, changePercent: 3.10, mainNetInflow: 2.20, mainNetRatio: 7.9, turnover: 27.8, turnoverRate: 3.2, superLargeInflow: 1.3, largeInflow: 0.9, mediumInflow: -0.6, smallInflow: -1.6, peRatio: 28.0, marketCap: 914 }
    ];

    popularExtras.forEach(stk => {
      map.set(stk.code, stk);
      catalogMap.set(stk.code, {
        code: stk.code,
        name: stk.name,
        price: stk.price,
        changePercent: stk.changePercent,
        sector: '核心精选'
      });
    });

    this.allStocksMap = map;
    this.searchableCatalog = Array.from(catalogMap.values());
  }

  /**
   * Load custom sectors from localStorage, or populate with defaults
   */
  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.customSectors = parsed;
          return;
        }
      }
    } catch (e) {
      console.warn('Failed to parse custom sectors from storage, using defaults', e);
    }

    // Default seed
    this.customSectors = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_SECTORS));
    this.saveToStorage();
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.customSectors));
    } catch (e) {
      console.error('Failed to save custom sectors to storage', e);
    }
  }

  public getCustomSectors(): CustomSector[] {
    return this.customSectors;
  }

  public getCustomSectorById(id: string): CustomSector | undefined {
    return this.customSectors.find(s => s.id === id);
  }

  public createCustomSector(data: {
    name: string;
    description?: string;
    tagColor?: string;
    stockCodes?: string[];
  }): CustomSector {
    const today = getRealtimeDateString();
    const id = `cs-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    const stocks: CustomSectorStock[] = (data.stockCodes || []).map(code => {
      const stockInfo = this.allStocksMap.get(code) || this.searchableCatalog.find(s => s.code === code);
      return {
        code,
        name: stockInfo?.name || code,
        addedAt: today
      };
    });

    const newSector: CustomSector = {
      id,
      name: data.name.trim(),
      description: data.description?.trim() || '自定义个性化跟踪分析板块',
      tagColor: data.tagColor || 'rose',
      createdAt: today,
      updatedAt: today,
      stocks
    };

    this.customSectors.unshift(newSector);
    this.saveToStorage();
    return newSector;
  }

  public updateCustomSector(id: string, updates: Partial<CustomSector>): CustomSector {
    const idx = this.customSectors.findIndex(s => s.id === id);
    if (idx === -1) {
      throw new Error(`Custom sector with id ${id} not found`);
    }

    const updated = {
      ...this.customSectors[idx],
      ...updates,
      updatedAt: getRealtimeDateString()
    };

    this.customSectors[idx] = updated;
    this.saveToStorage();
    return updated;
  }

  public deleteCustomSector(id: string): boolean {
    const initialLen = this.customSectors.length;
    this.customSectors = this.customSectors.filter(s => s.id !== id);
    if (this.customSectors.length !== initialLen) {
      this.saveToStorage();
      return true;
    }
    return false;
  }

  public addStockToSector(sectorId: string, stock: { code: string; name?: string; notes?: string }): boolean {
    const sector = this.customSectors.find(s => s.id === sectorId);
    if (!sector) return false;

    if (sector.stocks.some(s => s.code === stock.code)) {
      return false; // already in sector
    }

    const stockInfo = this.allStocksMap.get(stock.code) || this.searchableCatalog.find(s => s.code === stock.code);
    sector.stocks.push({
      code: stock.code,
      name: stock.name || stockInfo?.name || stock.code,
      addedAt: getRealtimeDateString(),
      notes: stock.notes
    });
    sector.updatedAt = getRealtimeDateString();
    this.saveToStorage();
    return true;
  }

  public removeStockFromSector(sectorId: string, stockCode: string): boolean {
    const sector = this.customSectors.find(s => s.id === sectorId);
    if (!sector) return false;

    const initialLen = sector.stocks.length;
    sector.stocks = sector.stocks.filter(s => s.code !== stockCode);
    if (sector.stocks.length !== initialLen) {
      sector.updatedAt = getRealtimeDateString();
      this.saveToStorage();
      return true;
    }
    return false;
  }

  /**
   * Search available stocks by code, name, or sector
   */
  public searchStocks(query: string): { code: string; name: string; price: number; changePercent: number; sector?: string }[] {
    const q = query.trim().toLowerCase();
    if (!q) {
      return this.searchableCatalog.slice(0, 20);
    }

    return this.searchableCatalog
      .filter(s => s.code.includes(q) || s.name.toLowerCase().includes(q) || (s.sector && s.sector.toLowerCase().includes(q)))
      .slice(0, 30);
  }

  /**
   * Get all available catalog stocks
   */
  public getAllCatalogStocks() {
    return this.searchableCatalog;
  }

  /**
   * Dynamically calculate real-time fund flow statistics for a custom sector
   */
  public calculateFundFlow(
    sector: CustomSector,
    liveOverrideStocks?: Record<string, SectorStock>
  ): CustomSectorFundFlow {
    const constituentStocks: SectorStock[] = [];

    sector.stocks.forEach(item => {
      // 1. Check live override
      let stock = liveOverrideStocks ? liveOverrideStocks[item.code] : undefined;
      // 2. Check internal pool
      if (!stock) {
        stock = this.allStocksMap.get(item.code);
      }
      // 3. Fallback dummy quote if somehow not found
      if (!stock) {
        const cat = this.searchableCatalog.find(c => c.code === item.code);
        stock = {
          code: item.code,
          name: item.name || cat?.name || item.code,
          price: cat?.price || 15.80,
          changePercent: cat?.changePercent || 0.0,
          mainNetInflow: 0.5,
          mainNetRatio: 2.1,
          turnover: 10.5,
          turnoverRate: 2.0,
          superLargeInflow: 0.3,
          largeInflow: 0.2,
          mediumInflow: -0.1,
          smallInflow: -0.4,
          marketCap: 200
        };
      }
      constituentStocks.push(stock);
    });

    if (constituentStocks.length === 0) {
      return {
        sectorId: sector.id,
        name: sector.name,
        tagColor: sector.tagColor,
        description: sector.description,
        changePercent: 0,
        mainNetInflow: 0,
        mainNetRatio: 0,
        superLargeInflow: 0,
        largeInflow: 0,
        mediumInflow: 0,
        smallInflow: 0,
        totalTurnover: 0,
        turnoverRate: 0,
        stocksCount: 0,
        upCount: 0,
        downCount: 0,
        flatCount: 0,
        stocks: []
      };
    }

    // Aggregations
    let totalChangePercent = 0;
    let totalMainNetInflow = 0;
    let totalSuperLargeInflow = 0;
    let totalLargeInflow = 0;
    let totalMediumInflow = 0;
    let totalSmallInflow = 0;
    let totalTurnover = 0;
    let totalTurnoverRate = 0;
    let upCount = 0;
    let downCount = 0;
    let flatCount = 0;

    let leadStock = constituentStocks[0];
    let dragStock = constituentStocks[0];
    let topInflowStock = constituentStocks[0];

    constituentStocks.forEach(s => {
      totalChangePercent += s.changePercent;
      totalMainNetInflow += s.mainNetInflow;
      totalSuperLargeInflow += s.superLargeInflow;
      totalLargeInflow += s.largeInflow;
      totalMediumInflow += s.mediumInflow;
      totalSmallInflow += s.smallInflow;
      totalTurnover += s.turnover;
      totalTurnoverRate += s.turnoverRate;

      if (s.changePercent > 0.001) upCount++;
      else if (s.changePercent < -0.001) downCount++;
      else flatCount++;

      if (s.changePercent > leadStock.changePercent) leadStock = s;
      if (s.changePercent < dragStock.changePercent) dragStock = s;
      if (s.mainNetInflow > topInflowStock.mainNetInflow) topInflowStock = s;
    });

    const count = constituentStocks.length;
    const avgChangePercent = Number((totalChangePercent / count).toFixed(2));
    const avgTurnoverRate = Number((totalTurnoverRate / count).toFixed(2));
    const mainNetRatio = totalTurnover > 0 ? Number(((totalMainNetInflow / totalTurnover) * 100).toFixed(2)) : 0;

    return {
      sectorId: sector.id,
      name: sector.name,
      tagColor: sector.tagColor,
      description: sector.description,
      changePercent: avgChangePercent,
      mainNetInflow: Number(totalMainNetInflow.toFixed(2)),
      mainNetRatio,
      superLargeInflow: Number(totalSuperLargeInflow.toFixed(2)),
      largeInflow: Number(totalLargeInflow.toFixed(2)),
      mediumInflow: Number(totalMediumInflow.toFixed(2)),
      smallInflow: Number(totalSmallInflow.toFixed(2)),
      totalTurnover: Number(totalTurnover.toFixed(2)),
      turnoverRate: avgTurnoverRate,
      stocksCount: count,
      upCount,
      downCount,
      flatCount,
      leadStock,
      dragStock,
      topInflowStock,
      stocks: constituentStocks
    };
  }

  /**
   * Convert custom sector to a standard SectorFundFlow item for interoperability
   */
  public toSectorFundFlow(customSector: CustomSector): SectorFundFlow {
    const flow = this.calculateFundFlow(customSector);
    return {
      id: customSector.id,
      name: customSector.name,
      category: 'concept', // compatible with concept view
      changePercent: flow.changePercent,
      mainNetInflow: flow.mainNetInflow,
      mainNetRatio: flow.mainNetRatio,
      superLargeInflow: flow.superLargeInflow,
      largeInflow: flow.largeInflow,
      mediumInflow: flow.mediumInflow,
      smallInflow: flow.smallInflow,
      totalTurnover: flow.totalTurnover,
      turnoverRate: flow.turnoverRate,
      leadStock: flow.leadStock ? {
        code: flow.leadStock.code,
        name: flow.leadStock.name,
        price: flow.leadStock.price,
        changePercent: flow.leadStock.changePercent,
        mainNetInflow: flow.leadStock.mainNetInflow
      } : {
        code: '000001',
        name: '样本龙头',
        price: 10.0,
        changePercent: 0.0,
        mainNetInflow: 0
      },
      dragStock: flow.dragStock ? {
        code: flow.dragStock.code,
        name: flow.dragStock.name,
        price: flow.dragStock.price,
        changePercent: flow.dragStock.changePercent
      } : undefined,
      inflowMomentum: Math.min(100, Math.max(0, 50 + flow.mainNetRatio * 3)),
      priceMomentum: Math.min(10, Math.max(-10, flow.changePercent)),
      stocksCount: flow.stocksCount,
      upCount: flow.upCount,
      downCount: flow.downCount,
      flatCount: flow.flatCount,
      topStocks: flow.stocks,
      intradayInflowHistory: [
        { time: '09:30', netInflow: 0, indexPrice: 1000 },
        { time: '10:30', netInflow: flow.mainNetInflow * 0.35, indexPrice: 1000 + flow.changePercent * 5 },
        { time: '11:30', netInflow: flow.mainNetInflow * 0.60, indexPrice: 1000 + flow.changePercent * 8 },
        { time: '14:00', netInflow: flow.mainNetInflow * 0.85, indexPrice: 1000 + flow.changePercent * 9 },
        { time: '15:00', netInflow: flow.mainNetInflow, indexPrice: 1000 + flow.changePercent * 10 }
      ],
      description: customSector.description
    };
  }
}

export const customSectorService = new CustomSectorService();
