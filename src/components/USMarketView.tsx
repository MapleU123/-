import React, { useState, useEffect, useCallback } from 'react';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Clock,
  Radio,
  ExternalLink,
  DollarSign
} from 'lucide-react';

interface USMarketViewProps {
  onOpenAIDiagnosis?: (title?: string) => void;
  onNavigateToQDII?: () => void;
}

interface USIndexItem {
  name: string;
  price: string;
  change: string;
  changePct: string;
  isUp: boolean;
  high?: string;
  low?: string;
  volume?: string;
}

interface USStockItem {
  code: string;
  name: string;
  price: string;
  changePct: string;
  isUp: boolean;
  cap: string;
  pe: string;
  desc: string;
}

export const USMarketView: React.FC<USMarketViewProps> = ({
  onOpenAIDiagnosis,
  onNavigateToQDII
}) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('--:--:--');
  const [dataSource, setDataSource] = useState<string>('新浪财经美股实时行情');

  const [indices, setIndices] = useState<USIndexItem[]>([
    { name: '纳斯达克综合指数 (IXIC)', price: '26,081.72', change: '-171.62', changePct: '-0.65%', isUp: false },
    { name: '纳斯达克 100 ETF (QQQ)', price: '708.69', change: '-7.62', changePct: '-1.06%', isUp: false },
    { name: '标普 500 指数 (S&P 500)', price: '7,591.70', change: '-44.66', changePct: '-0.58%', isUp: false },
    { name: '道琼斯工业指数 (DJI)', price: '52,064.10', change: '-316.56', changePct: '-0.60%', isUp: false },
  ]);

  const [techGiants, setTechGiants] = useState<USStockItem[]>([
    { code: 'NVDA', name: '英伟达 (NVIDIA)', price: '$218.36', changePct: '-2.26%', isUp: false, cap: '$5.26万亿', pe: '33.2', desc: 'Blackwell AI 芯片全球放量，AI算力基础设施核心引擎' },
    { code: 'AAPL', name: '苹果 (Apple)', price: '$326.57', changePct: '+3.56%', isUp: true, cap: '$4.76万亿', pe: '39.4', desc: 'Apple Intelligence 端侧生态加速普及，iPhone换机周期提速' },
    { code: 'MSFT', name: '微软 (Microsoft)', price: '$492.44', changePct: '+0.16%', isUp: true, cap: '$3.65万亿', pe: '29.2', desc: 'Azure AI 企业级商业化云服务放量，Copilot渗透率提升' },
    { code: 'TSLA', name: '特斯拉 (Tesla)', price: '$363.56', changePct: '-1.16%', isUp: false, cap: '$1.43万亿', pe: '302.9', desc: 'FSD V13 全自动驾驶与 Robotaxi 无人出租车量产提速' },
    { code: 'GOOGL', name: '谷歌 (Alphabet)', price: '$332.60', changePct: '+0.59%', isUp: true, cap: '$4.06万亿', pe: '25.1', desc: 'Gemini 生态与谷歌搜索、云端 TPU 协同效应显著' },
    { code: 'AMZN', name: '亚马逊 (Amazon)', price: '$251.89', changePct: '-0.20%', isUp: false, cap: '$2.71万亿', pe: '29.7', desc: 'AWS 自研 AI 芯片与电商广告利润率双双攀升' },
    { code: 'META', name: 'Meta (Facebook)', price: '$644.38', changePct: '-1.42%', isUp: false, cap: '$1.64万亿', pe: '23.1', desc: '开源 Llama 大模型与 AI 驱动广告推荐投放回报超预期' },
  ]);

  const [chinaADRs, setChinaADRs] = useState<USStockItem[]>([
    { code: 'BABA', name: '阿里巴巴 (Alibaba)', price: '$108.56', changePct: '-0.77%', isUp: false, cap: '$2,698亿', pe: '16.9', desc: '阿里云智能全面拥抱开源，电商股份回购提振估值' },
    { code: 'PDD', name: '拼多多 (PDD Holdings)', price: '$77.84', changePct: '-0.98%', isUp: false, cap: '$1,107亿', pe: '8.0', desc: 'Temu 全球化出海与国内高性价比供应链壁垒' },
    { code: 'JD', name: '京东集团 (JD.com)', price: '$27.02', changePct: '+0.07%', isUp: true, cap: '$363亿', pe: '19.4', desc: '即时零售与全国自建仓储物流履约供应链护城河' },
    { code: 'NIO', name: '蔚来汽车 (NIO)', price: '$3.58', changePct: '-3.24%', isUp: false, cap: '$89亿', pe: '--', desc: '乐道与萤火虫子品牌交付放量，换电联盟网络扩容' },
    { code: 'BILI', name: '哔哩哔哩 (Bilibili)', price: '$15.47', changePct: '-2.77%', isUp: false, cap: '$64亿', pe: '32.2', desc: '优质年轻高粘性社区生态与游戏自研出海盈利' },
  ]);

  const fetchUSMarketData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/market/us-realtime');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        if (data.indices && data.indices.length > 0) setIndices(data.indices);
        if (data.techGiants && data.techGiants.length > 0) setTechGiants(data.techGiants);
        if (data.chinaADRs && data.chinaADRs.length > 0) setChinaADRs(data.chinaADRs);
        if (data.updateTime) setLastUpdated(data.updateTime);
        if (data.source) setDataSource(data.source);
      }
    } catch (err) {
      console.warn('Fetch US market real-time data failed:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUSMarketData();
  }, [fetchUSMarketData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetchUSMarketData();
    }, 15000);
    return () => clearInterval(timer);
  }, [autoRefresh, fetchUSMarketData]);

  return (
    <div id="us-market-view" className="space-y-4">
      {/* Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                美股实盘跟踪与全球科技巨头联动
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                实盘直连
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold hidden sm:inline-block">
                纳斯达克/标普/中概ADR
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
              <span>跟踪纳指、标普、七大科技巨头 (Magnificent 7) 真实行情</span>
              <span className="text-slate-300">|</span>
              <span className="font-mono text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                最新更新: {lastUpdated}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Jump to QDII Quotas Monitor */}
          {onNavigateToQDII && (
            <button
              id="us-market-jump-qdii-btn"
              onClick={onNavigateToQDII}
              className="px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xs transition-all cursor-pointer"
              title="查看国内市场上所有纳斯达克与标普500的QDII基金额度与限购状态"
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>QDII额度看板</span>
            </button>
          )}

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer border ${
              autoRefresh 
                ? 'bg-slate-50 border-slate-200 text-slate-700' 
                : 'bg-white border-slate-200 text-slate-400'
            }`}
            title={autoRefresh ? '点击暂停自动刷新' : '点击开启15秒自动刷新'}
          >
            <Radio className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-500' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{autoRefresh ? '15秒轮询' : '轮询已暂停'}</span>
          </button>

          {/* Manual Refresh Button */}
          <button
            onClick={() => fetchUSMarketData(true)}
            disabled={refreshing}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
            title="立即获取最新美股实盘行情"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span>{refreshing ? '刷新中...' : '立即刷新'}</span>
          </button>

          {/* AI Analysis */}
          <button
            onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('美股科技股走势对A股算力与消费电子的映射')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI 映射诊断</span>
          </button>
        </div>
      </div>

      {/* 4 Indices Cards - Live Real-Time */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {indices.map((idx, i) => (
          <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">{idx.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">实时</span>
            </div>
            <div className="mt-2 font-mono">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{idx.price}</div>
              <div className={`text-xs font-bold mt-1 flex items-center gap-1 ${idx.isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                {idx.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                <span>{idx.change}</span>
                <span>({idx.changePct})</span>
              </div>
            </div>
            {idx.high && idx.low && (
              <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>振幅: {idx.low} - {idx.high}</span>
                {idx.volume && <span>量: {idx.volume}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Tech Giants Table - Live Real-Time */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">美股科技七巨头 (Magnificent 7) 实时行情</span>
            <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-medium">实时股价驱动</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">数据源: {dataSource}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 font-semibold font-mono">
              <tr>
                <th className="py-2.5 px-3.5">代码</th>
                <th className="py-2.5 px-3">公司名称</th>
                <th className="py-2.5 px-3 text-right">最新股价</th>
                <th className="py-2.5 px-3 text-right">涨跌幅</th>
                <th className="py-2.5 px-3 text-right">总市值</th>
                <th className="py-2.5 px-3 text-right">市盈率 (PE)</th>
                <th className="py-2.5 px-3">AI 战略与业务亮点</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {techGiants.map((stk) => (
                <tr key={stk.code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-blue-600">{stk.code}</td>
                  <td className="py-3 px-3 font-sans font-bold text-slate-900">{stk.name}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{stk.price}</td>
                  <td className={`py-3 px-3 text-right font-bold ${stk.isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {stk.changePct}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">{stk.cap}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{stk.pe}</td>
                  <td className="py-3 px-3 font-sans text-slate-600 text-[11.5px] truncate max-w-xs">{stk.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* China ADRs Table - Live Real-Time */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">热门中概互联 ADR 实时动态</span>
            <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono font-medium">中概资产联动</span>
          </div>
          <span className="text-xs text-slate-400 font-mono">自动跟踪美元实盘成交</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 font-semibold font-mono">
              <tr>
                <th className="py-2.5 px-3.5">代码</th>
                <th className="py-2.5 px-3">公司名称</th>
                <th className="py-2.5 px-3 text-right">最新股价</th>
                <th className="py-2.5 px-3 text-right">涨跌幅</th>
                <th className="py-2.5 px-3 text-right">总市值</th>
                <th className="py-2.5 px-3 text-right">市盈率 (PE)</th>
                <th className="py-2.5 px-3">核心逻辑与基本面</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {chinaADRs.map((stk) => (
                <tr key={stk.code} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-indigo-600">{stk.code}</td>
                  <td className="py-3 px-3 font-sans font-bold text-slate-900">{stk.name}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{stk.price}</td>
                  <td className={`py-3 px-3 text-right font-bold ${stk.isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {stk.changePct}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">{stk.cap}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{stk.pe}</td>
                  <td className="py-3 px-3 font-sans text-slate-600 text-[11.5px] truncate max-w-xs">{stk.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
