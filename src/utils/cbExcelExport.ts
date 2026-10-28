import * as XLSX from 'xlsx';
import { PendingConvertibleBond } from '../types/market';

export interface CalculatorExcelParams {
  bond: PendingConvertibleBond;
  holdingShares: number;
  expectedListingPrice: number;
  allBonds?: PendingConvertibleBond[]; // optional: to append batch comparison sheet
}

/**
 * Helper to safely format cell address e.g. colIndex (0-based) and rowIndex (1-based)
 */
function toCellAddress(col: number, row: number): string {
  let colStr = '';
  let c = col;
  while (c >= 0) {
    colStr = String.fromCharCode((c % 26) + 65) + colStr;
    c = Math.floor(c / 26) - 1;
  }
  return `${colStr}${row}`;
}

/**
 * Exports a high quality, interactive Excel (.xlsx) workbook containing genuine formulas.
 * Users can change any input cell in Excel and see values update in real-time.
 */
export function exportCalculatorToExcel(params: CalculatorExcelParams) {
  const { bond, holdingShares, expectedListingPrice, allBonds } = params;
  const wb = XLSX.utils.book_new();

  // -------------------------------------------------------------
  // SHEET 1: 单标的抢权配债精算模型 (带全套公式联动)
  // -------------------------------------------------------------
  const wsSingle: XLSX.WorkSheet = {};

  // Define styling / data structure using cell references:
  // Row 1: Title
  // Row 2: Subtitle
  // Row 4: 基础标的信息 (不可变信息)
  // Row 8: 核心输入参数 (用户可在 Excel 中随意修改，下方公式自动重算)
  // Row 16: 公式联动测算区 (真实 Excel 动态公式)
  // Row 26: 预估上市价格敏感性分析矩阵 (公式联动)
  // Row 38: 抢权配债实战备忘

  const setCell = (
    cellRef: string,
    value: string | number,
    formula?: string,
    numFmt?: string
  ) => {
    if (formula) {
      wsSingle[cellRef] = {
        t: typeof value === 'number' ? 'n' : 's',
        f: formula,
        v: value,
        z: numFmt
      };
    } else if (typeof value === 'number') {
      wsSingle[cellRef] = {
        t: 'n',
        v: value,
        z: numFmt
      };
    } else {
      wsSingle[cellRef] = {
        t: 's',
        v: value
      };
    }
  };

  // 1. Header Banner
  setCell('A1', `【抢权配债精准测算模型】${bond.stockName}(${bond.stockCode}) · ${bond.bondName}`);
  setCell('A2', `模型生成时间：${new Date().toLocaleString('zh-CN')} | 本表含 Excel 动态联动公式，修改【黄色背景】参数可自动重新计算`);

  // 2. Base Info Table
  setCell('A4', '【基本资料】');
  setCell('A5', '正股代码'); setCell('B5', bond.stockCode);
  setCell('C5', '正股名称'); setCell('D5', bond.stockName);
  setCell('E5', '所属行业'); setCell('F5', bond.industry);

  setCell('A6', '转债代码'); setCell('B6', bond.bondCode);
  setCell('C6', '转债简称'); setCell('D6', bond.bondName);
  setCell('E6', '拟发规模'); setCell('F6', `${bond.issueSize} 亿元`);

  const stageDisplay = bond.stageDate ? `${bond.stageName} (${bond.stageDate})` : bond.stageName;
  setCell('A7', '方案进展'); setCell('B7', stageDisplay);
  setCell('C7', '股权登记日'); setCell('D7', bond.recordDate);
  setCell('E7', '申购日期'); setCell('F7', bond.subscribeDate);

  // 3. User Parameters Input Area (Columns B & C)
  setCell('A9', '一、核心投资参数输入区 (在 Excel 中可自由编辑修改以下数值)');
  setCell('A10', '参数名称');
  setCell('B10', '输入数值');
  setCell('C10', '单位');
  setCell('D10', '参数说明与参考来源');

  setCell('A11', '正股最新价格');
  setCell('B11', bond.stockPrice, undefined, '#,##0.00');
  setCell('C11', '元');
  setCell('D11', '当前正股二级市场价格');

  setCell('A12', '计划持仓股数');
  setCell('B12', holdingShares, undefined, '#,##0');
  setCell('C12', '股');
  setCell('D12', '投资者计划或当前持有的正股数量');

  setCell('A13', '初始转股价格');
  setCell('B13', bond.convertPrice, undefined, '#,##0.00');
  setCell('C13', '元');
  setCell('D13', '募集说明书中约定的初始转股价');

  setCell('A14', '每股配售额');
  setCell('B14', bond.rationPerShare, undefined, '#,##0.0000');
  setCell('C14', '元/股');
  setCell('D14', '发行总额 ÷ 正股总股本 (每持有1股正股可配债金额)');

  setCell('A15', '预估转债上市首日价格');
  setCell('B15', expectedListingPrice, undefined, '#,##0.00');
  setCell('C15', '元/张');
  setCell('D15', '根据转股价值与当前转债市场平均溢价率预估 (面值100元)');

  // 4. Live Formula Calculation Area
  setCell('A17', '二、抢权配债关键指标公式测算区 (Excel 动态公式)');
  setCell('A18', '测算指标');
  setCell('B18', '计算结果');
  setCell('C18', '单位');
  setCell('D18', '内置 Excel 计算公式说明');

  // Market Value: =B11*B12
  const initialMarketValue = Number((bond.stockPrice * holdingShares).toFixed(2));
  setCell('A19', '1. 正股持仓总市值');
  setCell('B19', initialMarketValue, 'B11*B12', '#,##0.00');
  setCell('C19', '元');
  setCell('D19', '= 正股价 × 持股数 [公式: B11*B12]');

  // Rights per 100 shares: =(B14/B11)*100
  const initialRights100 = Number(((bond.rationPerShare / bond.stockPrice) * 100).toFixed(2));
  setCell('A20', '2. 百元股票含权');
  setCell('B20', initialRights100, '(B14/B11)*100', '#,##0.00');
  setCell('C20', '元');
  setCell('D20', '= (每股配售额 ÷ 正股价) × 100 [公式: (B14/B11)*100]');

  // Total CB entitlement: =B12*B14
  const initialEntitlement = Number((holdingShares * bond.rationPerShare).toFixed(2));
  setCell('A21', '3. 配债理论权益总额');
  setCell('B21', initialEntitlement, 'B12*B14', '#,##0.00');
  setCell('C21', '元');
  setCell('D21', '= 持股数 × 每股配售额 [公式: B12*B14]');

  // Allocated Hands: =ROUND(B21/1000, 0)
  const initialExactHands = initialEntitlement / 1000;
  const initialHands = Math.max(1, Math.round(initialExactHands));
  setCell('A22', '4. 获配转债手数(精确四舍五入)');
  setCell('B22', initialHands, 'ROUND(B21/1000,0)', '#,##0');
  setCell('C22', '手');
  setCell('D22', '= ROUND(理论权益 ÷ 1000, 0) [1手=1000元面值]');

  // Allocated Bonds: =B22*10
  const initialBonds = initialHands * 10;
  setCell('A23', '5. 获配转债张数');
  setCell('B23', initialBonds, 'B22*10', '#,##0');
  setCell('C23', '张');
  setCell('D23', '= 获配手数 × 10张 [公式: B22*10]');

  // Subscription Cost: =B23*100
  const initialCost = initialBonds * 100;
  setCell('A24', '6. 配债缴款资金');
  setCell('B24', initialCost, 'B23*100', '#,##0.00');
  setCell('C24', '元');
  setCell('D24', '= 转债张数 × 面值100元 [公式: B23*100]');

  // Expected Profit: =B23*(B15-100)
  const initialProfit = initialBonds * (expectedListingPrice - 100);
  setCell('A25', '7. 预估上市首日配债获利');
  setCell('B25', initialProfit, 'B23*(B15-100)', '#,##0.00');
  setCell('C25', '元');
  setCell('D25', '= 转债张数 × (预估开盘价 - 100) [公式: B23*(B15-100)]');

  // Safety Margin: =(B25/B19)*100
  const initialSafetyMargin = initialMarketValue > 0 ? Number(((initialProfit / initialMarketValue) * 100).toFixed(2)) : 0;
  setCell('A26', '8. 抢权安全垫 (正股防守空间)');
  setCell('B26', initialSafetyMargin, '(B25/B19)*100', '0.00"%"');
  setCell('C26', '%');
  setCell('D26', '= (预期配债收益 ÷ 正股市值) × 100% [公式: (B25/B19)*100]');

  // One hand party: =ROUNDUP(500/B14, 0)
  const oneHandNeededShares = Math.ceil(500 / bond.rationPerShare);
  setCell('A27', '9. 一手党理论最低持股数');
  setCell('B27', oneHandNeededShares, 'ROUNDUP(500/B14,0)', '#,##0');
  setCell('C27', '股');
  setCell('D27', '= ROUNDUP(500元 ÷ 每股配售额, 0) [满0.5手即四舍五入获配1手]');

  // One hand market value: =B27*B11
  const oneHandNeededMarketVal = Number((oneHandNeededShares * bond.stockPrice).toFixed(0));
  setCell('A28', '10. 一手党所需正股市值');
  setCell('B28', oneHandNeededMarketVal, 'B27*B11', '#,##0.00');
  setCell('C28', '元');
  setCell('D28', '= 一手党股数 × 正股价 [公式: B27*B11]');

  // 5. Sensitivity Analysis Table (Prices: 105, 110, 115, 120, 125, 130, 135, 140, 150)
  setCell('A30', '三、转债上市首日价格敏感性分析矩阵 (带公式)');
  setCell('A31', '行情情景假设');
  setCell('B31', '预估上市价格(元)');
  setCell('C31', '单张预期收益(元)');
  setCell('D31', '配债总获利(元)');
  setCell('E31', '抢权安全垫(%)');
  setCell('F31', '收益评估');

  const scenarios = [
    { label: '极度弱势/破发边缘', price: 105, remark: '低风险防守' },
    { label: '偏弱行情', price: 110, remark: '安全垫有限' },
    { label: '中性平稳行情', price: 115, remark: '常规收益' },
    { label: '正常偏暖行情', price: 120, remark: '较好回报' },
    { label: '市场标准溢价', price: 125, remark: '标准安全垫' },
    { label: '优质行业/题材活跃', price: 130, remark: '收益丰厚' },
    { label: '高景气度标的', price: 135, remark: '大肉签潜力' },
    { label: '市场火爆/大牛市', price: 140, remark: '超级肉签' },
    { label: '极致炒作溢价', price: 150, remark: '顶格高收益' },
  ];

  scenarios.forEach((sc, idx) => {
    const row = 32 + idx;
    const priceCell = `B${row}`;
    const singleProfitFormula = `${priceCell}-100`;
    const totalProfitFormula = `B$23*(${priceCell}-100)`;
    const safetyFormula = `(D${row}/B$19)*100`;

    const singleVal = sc.price - 100;
    const totalVal = initialBonds * singleVal;
    const safetyVal = initialMarketValue > 0 ? Number(((totalVal / initialMarketValue) * 100).toFixed(2)) : 0;

    setCell(`A${row}`, sc.label);
    setCell(`B${row}`, sc.price, undefined, '#,##0.00');
    setCell(`C${row}`, singleVal, singleProfitFormula, '#,##0.00');
    setCell(`D${row}`, totalVal, totalProfitFormula, '#,##0.00');
    setCell(`E${row}`, safetyVal, safetyFormula, '0.00"%"');
    setCell(`F${row}`, sc.remark);
  });

  // 6. Notes & Instructions
  const noteStartRow = 32 + scenarios.length + 2;
  setCell(`A${noteStartRow}`, '四、抢权配债实战操作要诀与风控指南');
  setCell(`A${noteStartRow + 1}`, '1. 抢权核心原则：在【股权登记日】（即登记日当天 15:00 收盘时）持有正股股票，即可 100% 获得转债优先配售权。');
  setCell(`A${noteStartRow + 2}`, '2. 缴款操作流程：股权登记日次日（申购日 9:30-15:00），在券商交易软件中找到【配债代码/配售代码】，输入全部可配额度并足额缴款。');
  setCell(`A${noteStartRow + 3}`, '3. 舍入规则(一手党)：沪深交易所针对转债优先配售普遍采用四舍五入规则（一般达 0.5 手~0.6 手即可获配 1 手转债，即 10 张/1000 元面值）。');
  setCell(`A${noteStartRow + 4}`, '4. 风险提示：若股权登记日次日正股因除权或大盘波动出现下跌，若跌幅超出【抢权安全垫】，持股总盈亏可能为负。建议优选百元股票含权高(≥10元)且正股质地优良的标的。');

  // Set column widths for Single Sheet
  wsSingle['!cols'] = [
    { wch: 32 }, // A
    { wch: 20 }, // B
    { wch: 18 }, // C
    { wch: 38 }, // D
    { wch: 18 }, // E
    { wch: 22 }, // F
  ];

  // Set print range
  wsSingle['!ref'] = `A1:F${noteStartRow + 5}`;
  XLSX.utils.book_append_sheet(wb, wsSingle, '单标的抢权精算(带公式)');

  // -------------------------------------------------------------
  // SHEET 2: 待发转债池批量联动测算表 (每一行均带联动公式)
  // -------------------------------------------------------------
  if (allBonds && allBonds.length > 0) {
    const wsBatch: XLSX.WorkSheet = {};

    const setBatchCell = (
      cellRef: string,
      value: string | number,
      formula?: string,
      numFmt?: string
    ) => {
      if (formula) {
        wsBatch[cellRef] = {
          t: typeof value === 'number' ? 'n' : 's',
          f: formula,
          v: value,
          z: numFmt
        };
      } else if (typeof value === 'number') {
        wsBatch[cellRef] = {
          t: 'n',
          v: value,
          z: numFmt
        };
      } else {
        wsBatch[cellRef] = {
          t: 's',
          v: value
        };
      }
    };

    // Header title
    setBatchCell('A1', '【待发可转债全景池批量公式测算表】');
    setBatchCell('A2', `生成时效：${new Date().toLocaleString('zh-CN')} | 共收录 ${allBonds.length} 只标的 | 包含正股市值、百元含权、配债手数、缴款额、预期收益与安全垫动态公式`);

    // Column Headers
    const headers = [
      '序号', '正股代码', '正股名称', '转债简称', '转债代码', 
      '方案进展', '进展公告日', '申购日期', '股权登记日', '发行规模(亿)', '最新正股价(元)', 
      '初始转股价(元)', '每股配售额(元)', '假设持股数(股)', '正股市值(元)[公式]', '百元股票含权(元)[公式]', 
      '理论配售额(元)[公式]', '配售手数(手)[公式]', '配债张数(张)[公式]', '配债缴款额(元)[公式]', 
      '预估首日价(元)', '预估配债收益(元)[公式]', '抢权安全垫(%)[公式]', '一手党所需股数', '一手党所需市值(元)[公式]'
    ];

    headers.forEach((h, colIdx) => {
      const cellRef = toCellAddress(colIdx, 4);
      setBatchCell(cellRef, h);
    });

    // Populate Data Rows with dynamic formulas!
    allBonds.forEach((b, idx) => {
      const row = 5 + idx;
      const defaultShares = b.sharesPerHand > 0 ? b.sharesPerHand : 1000;
      const price = b.stockPrice;
      const ration = b.rationPerShare;

      const priceCell = `K${row}`;
      const rationCell = `M${row}`;
      const sharesCell = `N${row}`;
      const mktValCell = `O${row}`;
      const entitlementCell = `Q${row}`;
      const handsCell = `R${row}`;
      const bondsCell = `S${row}`;
      const costCell = `T${row}`;
      const listingPriceCell = `U${row}`;
      const profitCell = `V${row}`;

      // Formulas:
      // Market Value (Col O): =K{row}*N{row}
      const mktValFormula = `${priceCell}*${sharesCell}`;
      const mktVal = Number((price * defaultShares).toFixed(2));

      // Rights per 100 (Col P): =(M{row}/K{row})*100
      const rightsFormula = `(${rationCell}/${priceCell})*100`;
      const rights100 = Number(((ration / price) * 100).toFixed(2));

      // Entitlement (Col Q): =N{row}*M{row}
      const entitleFormula = `${sharesCell}*${rationCell}`;
      const entitleVal = Number((defaultShares * ration).toFixed(2));

      // Hands (Col R): =ROUND(Q{row}/1000, 0)
      const handsFormula = `ROUND(${entitlementCell}/1000,0)`;
      const handsVal = Math.max(1, Math.round(entitleVal / 1000));

      // Bonds (Col S): =R{row}*10
      const bondsFormula = `${handsCell}*10`;
      const bondsVal = handsVal * 10;

      // Cost (Col T): =S{row}*100
      const costFormula = `${bondsCell}*100`;
      const costVal = bondsVal * 100;

      // Profit (Col V): =S{row}*(U{row}-100)
      const bondListingPrice = b.estimatedListingPrice || expectedListingPrice;
      const profitFormula = `${bondsCell}*(${listingPriceCell}-100)`;
      const profitVal = bondsVal * (bondListingPrice - 100);

      // Safety (Col W): =(V{row}/O{row})*100
      const safetyFormula = `(${profitCell}/${mktValCell})*100`;
      const safetyVal = mktVal > 0 ? Number(((profitVal / mktVal) * 100).toFixed(2)) : 0;

      // One Hand Needed Shares (Col X)
      const oneHandShares = b.sharesPerHand > 0 ? b.sharesPerHand : Math.ceil(500 / ration);

      // One Hand Needed Value (Col Y): =X{row}*K{row}
      const oneHandMktValFormula = `X${row}*${priceCell}`;
      const oneHandMktVal = Number((oneHandShares * price).toFixed(0));

      setBatchCell(`A${row}`, idx + 1);
      setBatchCell(`B${row}`, b.stockCode);
      setBatchCell(`C${row}`, b.stockName);
      setBatchCell(`D${row}`, b.bondName);
      setBatchCell(`E${row}`, b.bondCode);
      setBatchCell(`F${row}`, b.stageName);
      const stageDateVal = b.stageDate || b.latestUpdate || '-';
      setBatchCell(`G${row}`, stageDateVal);
      setBatchCell(`H${row}`, b.subscribeDate);
      setBatchCell(`I${row}`, b.recordDate);
      setBatchCell(`J${row}`, b.issueSize, undefined, '#,##0.00');
      setBatchCell(`K${row}`, b.stockPrice, undefined, '#,##0.00');
      setBatchCell(`L${row}`, b.convertPrice, undefined, '#,##0.00');
      setBatchCell(`M${row}`, b.rationPerShare, undefined, '#,##0.0000');
      setBatchCell(`N${row}`, defaultShares, undefined, '#,##0');
      setBatchCell(`O${row}`, mktVal, mktValFormula, '#,##0.00');
      setBatchCell(`P${row}`, rights100, rightsFormula, '#,##0.00');
      setBatchCell(`Q${row}`, entitleVal, entitleFormula, '#,##0.00');
      setBatchCell(`R${row}`, handsVal, handsFormula, '#,##0');
      setBatchCell(`S${row}`, bondsVal, bondsFormula, '#,##0');
      setBatchCell(`T${row}`, costVal, costFormula, '#,##0.00');
      setBatchCell(`U${row}`, bondListingPrice, undefined, '#,##0.00');
      setBatchCell(`V${row}`, profitVal, profitFormula, '#,##0.00');
      setBatchCell(`W${row}`, safetyVal, safetyFormula, '0.00"%"');
      setBatchCell(`X${row}`, oneHandShares, undefined, '#,##0');
      setBatchCell(`Y${row}`, oneHandMktVal, oneHandMktValFormula, '#,##0.00');
    });

    // Set Column Widths for Batch Sheet
    wsBatch['!cols'] = [
      { wch: 6 },  // A: 序号
      { wch: 11 }, // B: 正股代码
      { wch: 14 }, // C: 正股名称
      { wch: 14 }, // D: 转债简称
      { wch: 11 }, // E: 转债代码
      { wch: 13 }, // F: 方案进展
      { wch: 14 }, // G: 进展公告日
      { wch: 13 }, // H: 申购日期
      { wch: 13 }, // I: 股权登记日
      { wch: 12 }, // J: 发行规模
      { wch: 14 }, // K: 最新正股价
      { wch: 14 }, // L: 初始转股价
      { wch: 15 }, // M: 每股配售额
      { wch: 15 }, // N: 假设持股数
      { wch: 18 }, // O: 正股市值[公式]
      { wch: 18 }, // P: 百元股票含权[公式]
      { wch: 18 }, // Q: 理论配售额[公式]
      { wch: 16 }, // R: 配售手数[公式]
      { wch: 16 }, // S: 配债张数[公式]
      { wch: 18 }, // T: 配债缴款额[公式]
      { wch: 15 }, // U: 预估首日价
      { wch: 20 }, // V: 预估配债收益[公式]
      { wch: 18 }, // W: 抢权安全垫[公式]
      { wch: 16 }, // X: 一手党所需股数
      { wch: 20 }, // Y: 一手党所需市值[公式]
    ];

    wsBatch['!ref'] = `A1:Y${4 + allBonds.length}`;
    XLSX.utils.book_append_sheet(wb, wsBatch, '全景转债池公式测算表');
  }

  // Generate binary and download file
  const filename = `可转债抢权配债动态测算表_${bond.stockName}_${bond.bondName}_带公式_${new Date().toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
}
