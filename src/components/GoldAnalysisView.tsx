import React, { useState, useEffect, useCallback } from 'react';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Sparkles, 
  ShieldCheck, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Clock,
  Radio,
  BarChart2
} from 'lucide-react';

interface GoldAnalysisViewProps {
  onOpenAIDiagnosis?: (title?: string) => void;
  onSelectStockByName?: (name: string) => void;
}

interface GoldBenchmark {
  name: string;
  price: string;
  unit: string;
  change: string;
  changePct: string;
  isUp: boolean;
  turnover: string;
}

interface GoldStockItem {
  code: string;
  name: string;
  price: string;
  changePct: string;
  isUp: boolean;
  inflow: string;
  goldOutput: string;
  pe: string;
  turnover?: string;
  desc: string;
}

export const GoldAnalysisView: React.FC<GoldAnalysisViewProps> = ({
  onOpenAIDiagnosis,
  onSelectStockByName
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('--:--:--');
  const [dataSource, setDataSource] = useState<string>('上金所 AU(T+D) & 伦敦金 XAU 实时行情');

  const [benchmarks, setBenchmarks] = useState<GoldBenchmark[]>([
    { name: '上海金 AU(T+D)', price: '940.72', unit: '元/克', change: '-11.54', changePct: '-1.21%', isUp: false, turnover: '60,962 手' },
    { name: '伦敦现货黄金 XAU/USD', price: '4,358.11', unit: '美元/盎司', change: '+41.51', changePct: '+0.96%', isUp: true, turnover: '24小时实时' },
    { name: 'COMEX 黄金期货主力', price: '4,398.80', unit: '美元/盎司', change: '+38.50', changePct: '+0.88%', isUp: true, turnover: '活跃主力合约' },
    { name: '纽约商品期货 白银主力', price: '64.60', unit: '美元/盎司', change: '+0.45', changePct: '+0.70%', isUp: true, turnover: '金银比率 67.4' },
    { name: 'NYMEX WTI 国际原油', price: '101.25', unit: '美元/桶', change: '-3.05', changePct: '-2.92%', isUp: false, turnover: '大宗能源基准' },
  ]);

  const [goldStocks, setGoldStocks] = useState<GoldStockItem[]>([
    { code: '601899', name: '紫金矿业', price: '32.28', changePct: '-5.37%', isUp: false, inflow: '-8.92 亿', goldOutput: '68 吨/年', pe: '14.5', turnover: '111.47 亿', desc: '全球铜金矿龙头，黄金全维持开采成本极低，高分红抗通胀典范' },
    { code: '600547', name: '山东黄金', price: '34.85', changePct: '-2.08%', isUp: false, inflow: '-2.03 亿', goldOutput: '42 吨/年', pe: '22.8', turnover: '25.38 亿', desc: '纯正黄金采选央企标的，对国内外金价变动弹性系数高达 1.85' },
    { code: '600489', name: '中金黄金', price: '24.66', changePct: '-2.84%', isUp: false, inflow: '-1.57 亿', goldOutput: '28 吨/年', pe: '16.2', turnover: '19.66 亿', desc: '中国黄金集团旗下核心上市公司，金铜伴生矿资源禀赋雄厚' },
    { code: '600988', name: '赤峰黄金', price: '44.64', changePct: '+0.77%', isUp: true, inflow: '+1.51 亿', goldOutput: '16 吨/年', pe: '18.4', turnover: '19.65 亿', desc: '海外万象矿业高品位矿山扩张迅速，单位克金克利持续攀升' },
    { code: '000975', name: '山金国际', price: '25.44', changePct: '-1.66%', isUp: false, inflow: '-0.65 亿', goldOutput: '10 吨/年', pe: '17.1', turnover: '8.11 亿', desc: '原银泰黄金，山东黄金入主赋能，金矿品位全国前列且现金流充裕' },
    { code: '002155', name: '湖南黄金', price: '19.85', changePct: '+1.25%', isUp: true, inflow: '+0.88 亿', goldOutput: '6 吨/年', pe: '21.0', turnover: '12.40 亿', desc: '国内金锑共生矿核心龙头标的，坐拥全球稀缺锑精矿伴生利润' }
  ]);

  const fetchGoldData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/market/gold-realtime');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        if (data.benchmarks && data.benchmarks.length > 0) setBenchmarks(data.benchmarks);
        if (data.goldStocks && data.goldStocks.length > 0) setGoldStocks(data.goldStocks);
        if (data.updateTime) setLastUpdated(data.updateTime);
        if (data.source) setDataSource(data.source);
      }
    } catch (err) {
      console.warn('Fetch Gold real-time data failed:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchGoldData();
  }, [fetchGoldData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchGoldData();
    }, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchGoldData]);

  return (
    <div id="gold-analysis-view" className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 p-4.5 rounded-xl text-white shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-amber-100">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-black tracking-tight">黄金大宗与贵金属宏观实盘跟踪</h2>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse"></span>
                实时报价流
              </span>
            </div>
            <p className="text-xs text-amber-100 mt-1 flex items-center gap-2">
              <span>上海金 AU(T+D)、伦敦现货金 XAU/USD、COMEX 期货及 A 股金矿真实行情</span>
              <span>|</span>
              <span className="font-mono text-amber-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                更新: {lastUpdated}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer border ${
              autoRefresh 
                ? 'bg-white/20 border-white/30 text-white' 
                : 'bg-black/20 border-black/20 text-amber-200'
            }`}
            title={autoRefresh ? '点击暂停自动刷新' : '点击开启15秒自动刷新'}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-300' : 'text-amber-300'}`} />
            <span className="hidden sm:inline">{autoRefresh ? '15秒轮询' : '轮询暂停'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchGoldData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="立即获取最新黄金现货与期货价格"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? '刷新中' : '刷新'}</span>
          </button>

          <button
            onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('全球黄金价格周期与A股金矿配置策略')}
            className="px-3.5 py-1.5 bg-white text-amber-800 hover:bg-amber-50 rounded-lg text-xs font-extrabold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>AI 对冲策略</span>
          </button>
        </div>
      </div>

      {/* 5 Gold & Macro Benchmarks Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {benchmarks.map((b, i) => (
          <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="font-bold text-slate-700">{b.name}</span>
              <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600">{b.unit}</span>
            </div>
            <div className="mt-2 font-mono">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{b.price}</div>
              <div className="flex items-center space-x-1.5 mt-1">
                <span className={`text-xs font-bold flex items-center ${b.isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {b.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {b.change} ({b.changePct})
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                状态: {b.turnover}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Gold Mining Equities Leaderboard - Live Real-Time */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-800">
            <Coins className="w-4 h-4 text-amber-500" />
            <span>A股黄金采选核心龙头资产池 (实盘联动)</span>
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono">金价弹性映射</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">点击股票名称可直达详情与分时</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 font-semibold font-mono">
              <tr>
                <th className="py-2.5 px-3.5">股票代码</th>
                <th className="py-2.5 px-3">股票名称</th>
                <th className="py-2.5 px-3 text-right">实时现价</th>
                <th className="py-2.5 px-3 text-right">今日涨跌幅</th>
                <th className="py-2.5 px-3 text-right">成交额</th>
                <th className="py-2.5 px-3 text-right">年黄金产量</th>
                <th className="py-2.5 px-3 text-right">动态市盈率</th>
                <th className="py-2.5 px-3">核心投资亮点</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {goldStocks.map((stock) => (
                <tr 
                  key={stock.code} 
                  onClick={() => onSelectStockByName && onSelectStockByName(stock.name)}
                  className="hover:bg-amber-50/40 transition-colors cursor-pointer"
                  title="点击查看个股盘口与AI量化诊断"
                >
                  <td className="py-3 px-3.5 font-bold text-slate-500">{stock.code}</td>
                  <td className="py-3 px-3 font-sans font-bold text-blue-600 hover:underline">{stock.name}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">¥{stock.price}</td>
                  <td className={`py-3 px-3 text-right font-bold ${stock.isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {stock.changePct}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">{stock.turnover || '--'}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{stock.goldOutput}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{stock.pe}</td>
                  <td className="py-3 px-3 font-sans text-slate-600 text-[11.5px] max-w-xs truncate">{stock.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
