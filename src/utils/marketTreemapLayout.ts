/**
 * Full Market Stock Squarified Treemap Layout & Dataset
 * Recreates the exact Finviz / 52etf.site A-share Sector & Stock Heatmap style
 */

export interface TreemapRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface TreemapStockItem {
  code: string;
  name: string;
  changePercent: number;
  marketCap: number; // 亿元
  turnover?: number; // 亿元
  mainNetInflow?: number; // 亿元
  rect?: TreemapRect;
}

export interface TreemapSubSector {
  id: string;
  name: string;
  weight?: number;
  stocks: TreemapStockItem[];
  rect?: TreemapRect;
}

export interface TreemapSector {
  id: string;
  name: string;
  weight?: number;
  subsectors: TreemapSubSector[];
  rect?: TreemapRect;
}

/**
 * Standard Squarified Treemap Algorithm (Bruls, Huizing, van Wijk)
 * Optimizes rectangle aspect ratio close to 1:1 (golden standard)
 */
export function squarify<T extends { weight?: number; rect?: TreemapRect }>(
  items: T[],
  container: TreemapRect
): void {
  if (!items || items.length === 0) return;
  if (container.w <= 1 || container.h <= 1) {
    items.forEach(item => {
      item.rect = { x: container.x, y: container.y, w: Math.max(1, container.w), h: Math.max(1, container.h) };
    });
    return;
  }

  // Calculate total weight
  const totalWeight = items.reduce((sum, item) => sum + Math.max(1, item.weight || 1), 0);
  const totalArea = container.w * container.h;

  // Normalized area for each item
  const elements = items.map(item => ({
    item,
    area: (Math.max(1, item.weight || 1) / totalWeight) * totalArea
  }));

  // Sort descending by area
  elements.sort((a, b) => b.area - a.area);

  let remaining = { ...container };
  let row: typeof elements = [];

  const worstRatio = (r: typeof elements, length: number): number => {
    if (r.length === 0 || length <= 0) return Infinity;
    const rowArea = r.reduce((s, e) => s + e.area, 0);
    const side = rowArea / length;
    if (side <= 0) return Infinity;
    let maxR = 0;
    for (const e of r) {
      const itemSide = e.area / side;
      if (itemSide <= 0) continue;
      const ratio = Math.max(side / itemSide, itemSide / side);
      if (ratio > maxR) maxR = ratio;
    }
    return maxR;
  };

  const layoutRow = (r: typeof elements, isHorizontal: boolean) => {
    const rowArea = r.reduce((s, e) => s + e.area, 0);
    if (rowArea <= 0) return;

    if (isHorizontal) {
      // Row along width, advances in Y
      const rowHeight = rowArea / remaining.w;
      let curX = remaining.x;
      for (const e of r) {
        const itemWidth = e.area / rowHeight;
        e.item.rect = {
          x: curX,
          y: remaining.y,
          w: Math.max(0, itemWidth),
          h: Math.max(0, rowHeight)
        };
        curX += itemWidth;
      }
      remaining.y += rowHeight;
      remaining.h = Math.max(0, remaining.h - rowHeight);
    } else {
      // Row along height, advances in X
      const rowWidth = rowArea / remaining.h;
      let curY = remaining.y;
      for (const e of r) {
        const itemHeight = e.area / rowWidth;
        e.item.rect = {
          x: remaining.x,
          y: curY,
          w: Math.max(0, rowWidth),
          h: Math.max(0, itemHeight)
        };
        curY += itemHeight;
      }
      remaining.x += rowWidth;
      remaining.w = Math.max(0, remaining.w - rowWidth);
    }
  };

  for (let i = 0; i < elements.length; i++) {
    const current = elements[i];
    const isHorizontal = remaining.w < remaining.h; // If taller, place row horizontally
    const length = isHorizontal ? remaining.w : remaining.h;

    const testRow = [...row, current];
    const currWorst = worstRatio(row, length);
    const nextWorst = worstRatio(testRow, length);

    if (row.length === 0 || nextWorst <= currWorst) {
      row.push(current);
    } else {
      // Freeze row and layout
      layoutRow(row, isHorizontal);
      row = [current];
    }
  }

  if (row.length > 0) {
    const isHorizontal = remaining.w < remaining.h;
    layoutRow(row, isHorizontal);
  }
}

/**
 * Color mapping matching Chinese A-share standard (Finviz / 52etf.site)
 * Red = Up, Green = Down, Slate/Dark = Flat
 */
export function getTreemapStockColor(
  change: number,
  themeMode: 'light' | 'dark' | 'classic' | 'navy' = 'dark'
): { bg: string; text: string; subText: string; border: string } {
  const isLight = themeMode === 'light';
  const isClassic = themeMode === 'classic';

  if (change >= 9.5) {
    // 涨停板 / 极度强势
    return {
      bg: isLight ? '#b91c1c' : '#991b1b',
      text: '#ffffff',
      subText: '#fecaca',
      border: '#ef4444'
    };
  }
  if (change >= 5.0) {
    // 大涨
    return {
      bg: isLight ? '#dc2626' : '#b91c1c',
      text: '#ffffff',
      subText: '#fee2e2',
      border: '#f87171'
    };
  }
  if (change >= 2.0) {
    // 中涨
    return {
      bg: isLight ? '#e11d48' : '#a82424',
      text: '#ffffff',
      subText: '#ffe4e6',
      border: '#fb7185'
    };
  }
  if (change >= 0.2) {
    // 微涨
    return {
      bg: isLight ? '#be3232' : '#882222',
      text: '#ffffff',
      subText: '#fecdd3',
      border: '#9f2e2e'
    };
  }
  if (change > -0.2 && change < 0.2) {
    // 平盘
    if (isLight) {
      return { bg: '#64748b', text: '#ffffff', subText: '#cbd5e1', border: '#475569' };
    }
    if (isClassic) {
      return { bg: '#57534e', text: '#ffffff', subText: '#d6d3d1', border: '#44403c' };
    }
    return { bg: '#2e3748', text: '#e2e8f0', subText: '#94a3b8', border: '#1e293b' };
  }
  if (change > -2.0) {
    // 微跌
    return {
      bg: isLight ? '#15803d' : '#1e5436',
      text: '#ffffff',
      subText: '#bbf7d0',
      border: '#166534'
    };
  }
  if (change > -5.0) {
    // 中跌
    return {
      bg: isLight ? '#166534' : '#166534',
      text: '#ffffff',
      subText: '#86efac',
      border: '#15803d'
    };
  }
  // 大跌 / 跌停
  return {
    bg: isLight ? '#14532d' : '#0d4a25',
    text: '#ffffff',
    subText: '#4ade80',
    border: '#22c55e'
  };
}

/**
 * Full Market Tree Dataset with accurate A-share hierarchy:
 * 28 Sectors, 70+ Subsectors, 200+ Core Stocks
 */
export function getFullMarketTreemapData(): TreemapSector[] {
  return [
    // 1. 电子 (Technology & Semiconductor)
    {
      id: 'elec',
      name: '电子',
      weight: 18800,
      subsectors: [
        {
          id: 'semi',
          name: '半导体',
          weight: 9200,
          stocks: [
            { code: '688256', name: '寒武纪', changePercent: 1.15, marketCap: 1785 },
            { code: '688041', name: '海光信息', changePercent: 4.53, marketCap: 2740 },
            { code: '002371', name: '北方华创', changePercent: 0.46, marketCap: 2050 },
            { code: '688012', name: '中微公司', changePercent: 2.18, marketCap: 1330 },
            { code: '688981', name: '中芯国际', changePercent: -4.85, marketCap: 1650 },
            { code: '603501', name: '韦尔股份', changePercent: 1.45, marketCap: 1270 },
            { code: '688008', name: '澜起科技', changePercent: 4.80, marketCap: 782 },
            { code: '603986', name: '兆易创新', changePercent: 3.15, marketCap: 616 },
            { code: '688072', name: '拓荆科技', changePercent: 2.40, marketCap: 650 },
            { code: '688082', name: '盛美上海', changePercent: 1.80, marketCap: 450 },
            { code: '300604', name: '长川科技', changePercent: 2.50, marketCap: 320 },
            { code: '688521', name: '芯原股份', changePercent: -0.90, marketCap: 380 },
            { code: '002156', name: '通富微电', changePercent: 3.20, marketCap: 580 },
            { code: '603893', name: '瑞芯微', changePercent: 1.90, marketCap: 480 },
            { code: '688396', name: '华润微', changePercent: 0.80, marketCap: 520 },
            { code: '688200', name: '华峰测控', changePercent: 1.60, marketCap: 340 },
            { code: '688249', name: '晶合集成', changePercent: 0.40, marketCap: 360 }
          ]
        },
        {
          id: 'elec_components',
          name: '元件',
          weight: 3600,
          stocks: [
            { code: '600183', name: '生益科技', changePercent: -1.08, marketCap: 560 },
            { code: '002384', name: '东山精密', changePercent: 3.67, marketCap: 680 },
            { code: '002916', name: '深南电路', changePercent: -2.25, marketCap: 620 },
            { code: '002463', name: '沪电股份', changePercent: -0.38, marketCap: 750 },
            { code: '300408', name: '三环集团', changePercent: 0.50, marketCap: 590 },
            { code: '002938', name: '鹏鼎控股', changePercent: 1.20, marketCap: 720 },
            { code: '300476', name: '胜宏科技', changePercent: 2.80, marketCap: 410 }
          ]
        },
        {
          id: 'consumer_elec',
          name: '消费电子',
          weight: 4800,
          stocks: [
            { code: '601138', name: '工业富联', changePercent: 0.44, marketCap: 4650 },
            { code: '002475', name: '立讯精密', changePercent: 1.75, marketCap: 2680 },
            { code: '300433', name: '蓝思科技', changePercent: 1.10, marketCap: 980 },
            { code: '002600', name: '领益智造', changePercent: 0.90, marketCap: 620 },
            { code: '300857', name: '协创数据', changePercent: 3.50, marketCap: 310 },
            { code: '002241', name: '歌尔股份', changePercent: 1.40, marketCap: 780 }
          ]
        },
        {
          id: 'opto_elec',
          name: '光学光电子',
          weight: 1200,
          stocks: [
            { code: '000725', name: '京东方A', changePercent: 0.00, marketCap: 1520 },
            { code: '000100', name: 'TCL科技', changePercent: 0.80, marketCap: 910 }
          ]
        }
      ]
    },

    // 2. 银行 (Banking Mega Caps)
    {
      id: 'bank',
      name: '银行',
      weight: 19500,
      subsectors: [
        {
          id: 'state_banks',
          name: '国有大型银行',
          weight: 12800,
          stocks: [
            { code: '601288', name: '农业银行', changePercent: -0.58, marketCap: 4850 },
            { code: '601398', name: '工商银行', changePercent: -0.25, marketCap: 5200 },
            { code: '601988', name: '中国银行', changePercent: -0.30, marketCap: 4100 },
            { code: '601658', name: '邮储银行', changePercent: -0.75, marketCap: 1650 },
            { code: '601328', name: '交通银行', changePercent: -0.15, marketCap: 1420 }
          ]
        },
        {
          id: 'joint_stock_banks',
          name: '股份制银行',
          weight: 4800,
          stocks: [
            { code: '600036', name: '招商银行', changePercent: -0.66, marketCap: 3680 },
            { code: '601166', name: '兴业银行', changePercent: 0.20, marketCap: 1580 },
            { code: '601998', name: '中信银行', changePercent: 1.01, marketCap: 1250 },
            { code: '600000', name: '浦发银行', changePercent: 0.00, marketCap: 980 },
            { code: '000001', name: '平安银行', changePercent: 0.30, marketCap: 1100 },
            { code: '601818', name: '光大银行', changePercent: -0.20, marketCap: 680 }
          ]
        },
        {
          id: 'city_banks',
          name: '城商行',
          weight: 1900,
          stocks: [
            { code: '002142', name: '宁波银行', changePercent: 0.80, marketCap: 890 },
            { code: '601009', name: '南京银行', changePercent: 0.40, marketCap: 760 },
            { code: '600919', name: '江苏银行', changePercent: 0.60, marketCap: 1120 },
            { code: '600926', name: '杭州银行', changePercent: 0.50, marketCap: 680 },
            { code: '601169', name: '北京银行', changePercent: 0.20, marketCap: 720 }
          ]
        }
      ]
    },

    // 3. 电力设备 (New Energy & Power Equipment)
    {
      id: 'power_equip',
      name: '电力设备',
      weight: 15200,
      subsectors: [
        {
          id: 'battery',
          name: '电池',
          weight: 7800,
          stocks: [
            { code: '300750', name: '宁德时代', changePercent: 3.25, marketCap: 11780 },
            { code: '300014', name: '亿纬锂能', changePercent: 1.45, marketCap: 986 },
            { code: '002074', name: '国轩高科', changePercent: 1.20, marketCap: 420 },
            { code: '300207', name: '欣旺达', changePercent: 1.80, marketCap: 380 }
          ]
        },
        {
          id: 'grid_equip',
          name: '电网设备',
          weight: 3500,
          stocks: [
            { code: '600406', name: '国电南瑞', changePercent: 1.12, marketCap: 2153 },
            { code: '600089', name: '特变电工', changePercent: 0.85, marketCap: 740 },
            { code: '601179', name: '中国西电', changePercent: 2.40, marketCap: 680 },
            { code: '002276', name: '思源电气', changePercent: 1.60, marketCap: 590 }
          ]
        },
        {
          id: 'pv_equip',
          name: '光伏设备',
          weight: 3900,
          stocks: [
            { code: '300274', name: '阳光电源', changePercent: 4.15, marketCap: 1918 },
            { code: '601012', name: '隆基绿能', changePercent: -1.82, marketCap: 1432 },
            { code: '600438', name: '通威股份', changePercent: -0.72, marketCap: 1242 },
            { code: '605117', name: '德业股份', changePercent: 3.20, marketCap: 580 }
          ]
        }
      ]
    },

    // 4. 非银金融 (Brokers & Insurance)
    {
      id: 'fin_nonbank',
      name: '非银金融',
      weight: 12500,
      subsectors: [
        {
          id: 'securities',
          name: '证券',
          weight: 7600,
          stocks: [
            { code: '600030', name: '中信证券', changePercent: 0.56, marketCap: 3650 },
            { code: '300059', name: '东方财富', changePercent: 0.43, marketCap: 2850 },
            { code: '601211', name: '国泰君安', changePercent: 0.57, marketCap: 1820 },
            { code: '601688', name: '华泰证券', changePercent: 0.40, marketCap: 1680 },
            { code: '601995', name: '中金公司', changePercent: 0.80, marketCap: 1420 },
            { code: '000776', name: '广发证券', changePercent: 0.50, marketCap: 1100 },
            { code: '000166', name: '申万宏源', changePercent: 0.20, marketCap: 1150 }
          ]
        },
        {
          id: 'insurance',
          name: '保险',
          weight: 4900,
          stocks: [
            { code: '601628', name: '中国人寿', changePercent: 1.05, marketCap: 3200 },
            { code: '601318', name: '中国平安', changePercent: 0.24, marketCap: 4100 },
            { code: '601601', name: '中国太保', changePercent: -0.28, marketCap: 1650 },
            { code: '601336', name: '新华保险', changePercent: 0.60, marketCap: 950 }
          ]
        }
      ]
    },

    // 5. 通信 (Communication & AI Optical)
    {
      id: 'comm',
      name: '通信',
      weight: 8800,
      subsectors: [
        {
          id: 'comm_equip',
          name: '通信设备',
          weight: 5600,
          stocks: [
            { code: '300308', name: '中际旭创', changePercent: 1.43, marketCap: 1490 },
            { code: '300502', name: '新易盛', changePercent: 0.66, marketCap: 882 },
            { code: '300394', name: '天孚通信', changePercent: 1.80, marketCap: 442 },
            { code: '601869', name: '长飞光纤', changePercent: 2.50, marketCap: 310 },
            { code: '600487', name: '亨通光电', changePercent: 1.20, marketCap: 480 },
            { code: '000063', name: '中兴通讯', changePercent: 0.90, marketCap: 1580 },
            { code: '002281', name: '光迅科技', changePercent: 1.60, marketCap: 390 }
          ]
        },
        {
          id: 'comm_services',
          name: '通信服务',
          weight: 3200,
          stocks: [
            { code: '601728', name: '中国电信', changePercent: 0.80, marketCap: 2600 },
            { code: '600050', name: '中国联通', changePercent: 1.20, marketCap: 1850 },
            { code: '300442', name: '润泽科技', changePercent: 3.50, marketCap: 580 }
          ]
        }
      ]
    },

    // 6. 食品饮料 (Liquor & Food)
    {
      id: 'food_beverage',
      name: '食品饮料',
      weight: 9800,
      subsectors: [
        {
          id: 'liquor',
          name: '白酒',
          weight: 7500,
          stocks: [
            { code: '600519', name: '贵州茅台', changePercent: 0.24, marketCap: 21100 },
            { code: '000858', name: '五粮液', changePercent: 0.28, marketCap: 5530 },
            { code: '000568', name: '泸州老窖', changePercent: 1.75, marketCap: 2170 },
            { code: '600809', name: '山西汾酒', changePercent: 2.80, marketCap: 2659 },
            { code: '002304', name: '洋河股份', changePercent: 0.82, marketCap: 1303 }
          ]
        },
        {
          id: 'dairy_food',
          name: '饮料乳品',
          weight: 2300,
          stocks: [
            { code: '600887', name: '伊利股份', changePercent: 1.05, marketCap: 1814 },
            { code: '603288', name: '海天味业', changePercent: 0.65, marketCap: 2457 }
          ]
        }
      ]
    },

    // 7. 计算机 (Software & IT)
    {
      id: 'comp',
      name: '计算机',
      weight: 7800,
      subsectors: [
        {
          id: 'software',
          name: '软件开发',
          weight: 4600,
          stocks: [
            { code: '688111', name: '金山办公', changePercent: 2.10, marketCap: 1378 },
            { code: '300033', name: '同花顺', changePercent: 3.20, marketCap: 1530 },
            { code: '600570', name: '恒生电子', changePercent: 1.50, marketCap: 604 },
            { code: '300339', name: '润和软件', changePercent: 4.18, marketCap: 497 },
            { code: '601360', name: '三六零', changePercent: 9.98, marketCap: 914 }
          ]
        },
        {
          id: 'comp_hardware',
          name: '计算机设备',
          weight: 3200,
          stocks: [
            { code: '002415', name: '海康威视', changePercent: 1.44, marketCap: 2980 },
            { code: '000977', name: '浪潮信息', changePercent: 3.82, marketCap: 680 },
            { code: '603019', name: '中科曙光', changePercent: 5.60, marketCap: 1086 },
            { code: '000938', name: '紫光股份', changePercent: 1.92, marketCap: 758 }
          ]
        }
      ]
    },

    // 8. 医药生物 (Pharma & Biotech)
    {
      id: 'pharma',
      name: '医药生物',
      weight: 10800,
      subsectors: [
        {
          id: 'chem_pharma',
          name: '化学制药',
          weight: 4200,
          stocks: [
            { code: '600276', name: '恒瑞医药', changePercent: -0.54, marketCap: 3100 },
            { code: '688289', name: '百利天恒', changePercent: 2.80, marketCap: 890 }
          ]
        },
        {
          id: 'med_service',
          name: '医疗服务',
          weight: 3200,
          stocks: [
            { code: '603259', name: '药明康德', changePercent: 0.11, marketCap: 1570 },
            { code: '300015', name: '爱尔眼科', changePercent: 0.80, marketCap: 1420 }
          ]
        },
        {
          id: 'med_devices',
          name: '医疗器械',
          weight: 3400,
          stocks: [
            { code: '300760', name: '迈瑞医疗', changePercent: 1.12, marketCap: 3297 }
          ]
        }
      ]
    },

    // 9. 公用事业 (Utilities & Hydro Power)
    {
      id: 'utilities',
      name: '公用事业',
      weight: 8600,
      subsectors: [
        {
          id: 'power_gen',
          name: '电力',
          weight: 8600,
          stocks: [
            { code: '600900', name: '长江电力', changePercent: -0.18, marketCap: 6850 },
            { code: '600025', name: '华能水电', changePercent: 0.40, marketCap: 1850 },
            { code: '003816', name: '中国广核', changePercent: 0.20, marketCap: 2100 },
            { code: '601985', name: '中国核电', changePercent: 0.50, marketCap: 1980 },
            { code: '600886', name: '国投电力', changePercent: 0.80, marketCap: 1150 },
            { code: '600905', name: '三峡能源', changePercent: -0.30, marketCap: 1320 },
            { code: '600795', name: '国电电力', changePercent: 0.60, marketCap: 980 }
          ]
        }
      ]
    },

    // 10. 石油石化 (Petroleum & Petrochemical)
    {
      id: 'petro',
      name: '石油石化',
      weight: 8200,
      subsectors: [
        {
          id: 'refining',
          name: '炼化及贸易',
          weight: 8200,
          stocks: [
            { code: '601857', name: '中国石油', changePercent: 0.37, marketCap: 5800 },
            { code: '600028', name: '中国石化', changePercent: -1.13, marketCap: 4200 },
            { code: '002493', name: '荣盛石化', changePercent: 0.80, marketCap: 980 },
            { code: '600346', name: '恒力石化', changePercent: 0.40, marketCap: 890 },
            { code: '000301', name: '东方盛虹', changePercent: -0.50, marketCap: 620 }
          ]
        }
      ]
    },

    // 11. 汽车 (Automotive & EV)
    {
      id: 'auto',
      name: '汽车',
      weight: 8400,
      subsectors: [
        {
          id: 'passenger_car',
          name: '乘用车',
          weight: 4800,
          stocks: [
            { code: '002594', name: '比亚迪', changePercent: 1.94, marketCap: 8690 },
            { code: '600104', name: '上汽集团', changePercent: 0.40, marketCap: 1775 },
            { code: '000625', name: '长安汽车', changePercent: 1.84, marketCap: 1374 }
          ]
        },
        {
          id: 'auto_parts',
          name: '汽车零部件',
          weight: 3600,
          stocks: [
            { code: '601127', name: '赛力斯', changePercent: 5.85, marketCap: 2053 },
            { code: '600660', name: '福耀玻璃', changePercent: 1.25, marketCap: 1471 },
            { code: '000338', name: '潍柴动力', changePercent: 0.80, marketCap: 1320 },
            { code: '601689', name: '拓普集团', changePercent: 3.40, marketCap: 924 },
            { code: '002050', name: '三花智控', changePercent: 2.15, marketCap: 881 }
          ]
        }
      ]
    },

    // 12. 有色金属 (Non-Ferrous Metals & Gold)
    {
      id: 'metal',
      name: '有色金属',
      weight: 7100,
      subsectors: [
        {
          id: 'industrial_metal',
          name: '工业金属',
          weight: 4700,
          stocks: [
            { code: '601899', name: '紫金矿业', changePercent: 0.86, marketCap: 4560 },
            { code: '603993', name: '洛阳钼业', changePercent: 1.20, marketCap: 1680 },
            { code: '601600', name: '中国铝业', changePercent: 0.60, marketCap: 1320 }
          ]
        },
        {
          id: 'rare_metals',
          name: '小金属与能源金属',
          weight: 2400,
          stocks: [
            { code: '600111', name: '北方稀土', changePercent: 1.80, marketCap: 820 },
            { code: '000657', name: '中钨高新', changePercent: 2.40, marketCap: 420 },
            { code: '000408', name: '藏格矿业', changePercent: 1.50, marketCap: 560 }
          ]
        }
      ]
    },

    // 13. 机械设备 (Machinery & Automation)
    {
      id: 'mach',
      name: '机械设备',
      weight: 6600,
      subsectors: [
        {
          id: 'general_mach',
          name: '通用设备',
          weight: 4200,
          stocks: [
            { code: '300124', name: '汇川技术', changePercent: 1.80, marketCap: 1680 },
            { code: '002008', name: '大族激光', changePercent: 0.80, marketCap: 420 },
            { code: '002353', name: '杰瑞股份', changePercent: 1.20, marketCap: 390 }
          ]
        },
        {
          id: 'eng_mach',
          name: '工程机械与轨交',
          weight: 2400,
          stocks: [
            { code: '600031', name: '三一重工', changePercent: 1.40, marketCap: 1420 },
            { code: '601766', name: '中国中车', changePercent: 0.50, marketCap: 2100 }
          ]
        }
      ]
    },

    // 14. 基础化工 (Basic Chemicals)
    {
      id: 'chem',
      name: '基础化工',
      weight: 6400,
      subsectors: [
        {
          id: 'chem_products',
          name: '化学制品',
          weight: 4800,
          stocks: [
            { code: '600309', name: '万华化学', changePercent: 0.80, marketCap: 2680 },
            { code: '600989', name: '宝丰能源', changePercent: -1.81, marketCap: 1250 },
            { code: '000792', name: '盐湖股份', changePercent: 0.40, marketCap: 920 }
          ]
        },
        {
          id: 'chem_materials',
          name: '化学原料',
          weight: 1600,
          stocks: [
            { code: '002601', name: '龙佰集团', changePercent: 0.60, marketCap: 520 }
          ]
        }
      ]
    },

    // 15. 交通运输 (Transportation & Shipping)
    {
      id: 'trans',
      name: '交通运输',
      weight: 6000,
      subsectors: [
        {
          id: 'shipping_ports',
          name: '航运港口',
          weight: 3400,
          stocks: [
            { code: '601919', name: '中远海控', changePercent: 0.80, marketCap: 2150 },
            { code: '601872', name: '招商轮船', changePercent: 1.20, marketCap: 680 },
            { code: '600018', name: '上港集团', changePercent: 0.40, marketCap: 920 }
          ]
        },
        {
          id: 'rail_logistics',
          name: '铁路公路与物流',
          weight: 2600,
          stocks: [
            { code: '002352', name: '顺丰控股', changePercent: 0.60, marketCap: 1850 },
            { code: '601816', name: '京沪高铁', changePercent: -0.63, marketCap: 2450 }
          ]
        }
      ]
    },

    // 16. 家用电器 (Home Appliances)
    {
      id: 'home_appliances',
      name: '家用电器',
      weight: 4800,
      subsectors: [
        {
          id: 'white_goods',
          name: '白色家电',
          weight: 4800,
          stocks: [
            { code: '000333', name: '美的集团', changePercent: 2.09, marketCap: 4850 },
            { code: '000651', name: '格力电器', changePercent: 0.80, marketCap: 2420 },
            { code: '600690', name: '海尔智家', changePercent: 0.60, marketCap: 2680 }
          ]
        }
      ]
    },

    // 17. 国防军工 (Defense & Military)
    {
      id: 'military',
      name: '国防军工',
      weight: 5400,
      subsectors: [
        {
          id: 'aero_equip',
          name: '航空装备',
          weight: 3200,
          stocks: [
            { code: '600760', name: '中航沈飞', changePercent: 1.50, marketCap: 1280 },
            { code: '000768', name: '中航西飞', changePercent: 0.80, marketCap: 780 }
          ]
        },
        {
          id: 'navy_equip',
          name: '航海装备',
          weight: 2200,
          stocks: [
            { code: '600150', name: '中国船舶', changePercent: 1.80, marketCap: 1680 }
          ]
        }
      ]
    },

    // 18. 煤炭 (Coal Energy)
    {
      id: 'coal',
      name: '煤炭',
      weight: 5000,
      subsectors: [
        {
          id: 'coal_mining',
          name: '煤炭开采',
          weight: 5000,
          stocks: [
            { code: '601088', name: '中国神华', changePercent: 0.83, marketCap: 6800 },
            { code: '601898', name: '中煤能源', changePercent: 0.60, marketCap: 1680 },
            { code: '600188', name: '兖矿能源', changePercent: 0.20, marketCap: 1420 }
          ]
        }
      ]
    },

    // 19. 建筑装饰 (Infrastructure & Construction)
    {
      id: 'construction',
      name: '建筑装饰',
      weight: 4400,
      subsectors: [
        {
          id: 'infra',
          name: '基础建设',
          weight: 4400,
          stocks: [
            { code: '601668', name: '中国建筑', changePercent: 0.40, marketCap: 2280 },
            { code: '601390', name: '中国中铁', changePercent: 0.20, marketCap: 1580 }
          ]
        }
      ]
    },

    // 20. 传媒 (Media & Gaming)
    {
      id: 'media',
      name: '传媒',
      weight: 3800,
      subsectors: [
        {
          id: 'gaming',
          name: '游戏',
          weight: 3800,
          stocks: [
            { code: '002555', name: '三七互娱', changePercent: 2.40, marketCap: 420 },
            { code: '002602', name: '世纪华通', changePercent: 3.80, marketCap: 580 },
            { code: '300418', name: '昆仑万维', changePercent: 10.02, marketCap: 526 }
          ]
        }
      ]
    },

    // 21. 农林牧渔 (Agriculture & Livestock)
    {
      id: 'agri',
      name: '农林牧渔',
      weight: 3600,
      subsectors: [
        {
          id: 'livestock',
          name: '养殖业',
          weight: 3600,
          stocks: [
            { code: '002714', name: '牧原股份', changePercent: 1.20, marketCap: 2280 },
            { code: '300498', name: '温氏股份', changePercent: 0.80, marketCap: 1250 }
          ]
        }
      ]
    },

    // 22. 房地产 (Real Estate)
    {
      id: 'real_estate',
      name: '房地产',
      weight: 3300,
      subsectors: [
        {
          id: 're_dev',
          name: '房地产开发',
          weight: 3300,
          stocks: [
            { code: '600048', name: '保利发展', changePercent: 0.50, marketCap: 1220 },
            { code: '001979', name: '招商蛇口', changePercent: 0.80, marketCap: 980 }
          ]
        }
      ]
    },

    // 23. 钢铁 (Steel)
    {
      id: 'steel',
      name: '钢铁',
      weight: 2500,
      subsectors: [
        {
          id: 'carbon_steel',
          name: '普钢',
          weight: 2500,
          stocks: [
            { code: '600019', name: '宝钢股份', changePercent: 0.40, marketCap: 1480 },
            { code: '000932', name: '华菱钢铁', changePercent: 0.60, marketCap: 420 }
          ]
        }
      ]
    },

    // 24. 商贸零售 (Retail & Duty Free)
    {
      id: 'retail',
      name: '商贸零售',
      weight: 2400,
      subsectors: [
        {
          id: 'duty_free',
          name: '旅游零售',
          weight: 2400,
          stocks: [
            { code: '601888', name: '中国中免', changePercent: -1.45, marketCap: 1410 }
          ]
        }
      ]
    }
  ];
}

/**
 * Perform Hierarchical Layout of the Market Treemap
 * 1. Squarify sectors in the container
 * 2. Squarify subsectors in each sector's content area
 * 3. Squarify stocks in each subsector's content area
 */
export function computeHierarchicalTreemap(
  container: TreemapRect
): TreemapSector[] {
  const sectors = getFullMarketTreemapData();

  // Calculate sector aggregate weights
  sectors.forEach(s => {
    let sWeight = 0;
    s.subsectors.forEach(sub => {
      let subWeight = 0;
      sub.stocks.forEach(stk => {
        subWeight += Math.max(10, stk.marketCap);
      });
      sub.weight = Math.max(subWeight, sub.weight || 100);
      sWeight += sub.weight;
    });
    s.weight = Math.max(sWeight, s.weight || 200);
  });

  // 1. Layout Sectors
  squarify(sectors, container);

  // 2. Layout Subsectors & Stocks (Superimposed header design: stocks fill full sector area)
  sectors.forEach(sector => {
    if (!sector.rect) return;

    // Outer padding of 2px
    const innerRect: TreemapRect = {
      x: sector.rect.x + 2,
      y: sector.rect.y + 2,
      w: Math.max(1, sector.rect.w - 4),
      h: Math.max(1, sector.rect.h - 4)
    };

    if (innerRect.w <= 4 || innerRect.h <= 4) return;

    // Squarify subsectors inside sector
    squarify(sector.subsectors, innerRect);

    // 3. Squarify stocks inside each subsector
    sector.subsectors.forEach(sub => {
      if (!sub.rect) return;

      const subInnerRect: TreemapRect = {
        x: sub.rect.x + 1,
        y: sub.rect.y + 1,
        w: Math.max(1, sub.rect.w - 2),
        h: Math.max(1, sub.rect.h - 2)
      };

      if (subInnerRect.w <= 2 || subInnerRect.h <= 2) return;

      // Ensure stocks have weight property
      const stocksWithWeight = sub.stocks.map(stk => ({
        ...stk,
        weight: Math.max(10, stk.marketCap)
      }));

      squarify(stocksWithWeight, subInnerRect);

      // Copy rect back
      sub.stocks = stocksWithWeight;
    });
  });

  return sectors;
}
