import React from 'react';
import { 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight,
  DollarSign,
  Activity
} from 'lucide-react';

interface USMarketViewProps {
  onOpenAIDiagnosis?: (title?: string) => void;
}

export const USMarketView: React.FC<USMarketViewProps> = ({
  onOpenAIDiagnosis
}) => {
  const usIndices = [
    { name: '纳斯达克 100 (NDX)', price: '21,480.20', change: '+185.40', changePct: '+0.87%', isUp: true },
    { name: '标普 500 (S&P 500)', price: '6,048.80', change: '+32.10', changePct: '+0.53%', isUp: true },
    { name: '道琼斯工业指数 (DJI)', price: '44,820.60', change: '-45.20', changePct: '-0.10%', isUp: false },
    { name: '罗素 2000 小型股 (RUT)', price: '2,310.50', change: '+18.90', changePct: '+0.82%', isUp: true },
  ];

  const techGiants = [
    { code: 'NVDA', name: '英伟达 (NVIDIA)', price: '$148.50', changePct: '+3.45%', cap: '$3.62万亿', pe: '42.5', desc: 'Blackwell AI 芯片放量，算力需求旺盛' },
    { code: 'AAPL', name: '苹果 (Apple)', price: '$238.20', changePct: '+1.15%', cap: '$3.58万亿', pe: '34.2', desc: 'Apple Intelligence 普及推升换机周期' },
    { code: 'MSFT', name: '微软 (Microsoft)', price: '$442.10', changePct: '+1.80%', cap: '$3.28万亿', pe: '33.8', desc: 'Azure AI 商业化云服务营收提速' },
    { code: 'TSLA', name: '特斯拉 (Tesla)', price: '$345.60', changePct: '+4.85%', cap: '$1.12万亿', pe: '92.0', desc: 'FSD V13 全自动驾驶与 Cybercab 进展超预期' },
    { code: 'GOOGL', name: '谷歌 (Alphabet)', price: '$186.40', changePct: '+1.65%', cap: '$2.31万亿', pe: '22.4', desc: 'Gemini 生态与搜索云端协同效应显现' },
    { code: 'AMZN', name: '亚马逊 (Amazon)', price: '$218.90', changePct: '+2.10%', cap: '$2.28万亿', pe: '38.6', desc: 'AWS 云计算与电商广告利润率双升' },
  ];

  const chinaADRs = [
    { code: 'BABA', name: '阿里巴巴 (Alibaba)', price: '$94.20', changePct: '+3.80%', cap: '$2,280亿', desc: '云智能与电商回购提振估值' },
    { code: 'PDD', name: '拼多多 (PDD Holdings)', price: '$126.80', changePct: '+4.15%', cap: '$1,750亿', desc: 'Temu 全球化出海与国内供应链壁垒' },
    { code: 'NIO', name: '蔚来 (NIO)', price: '$5.68', changePct: '+6.20%', cap: '$118亿', desc: '乐道子品牌交付放量与换电联盟扩容' },
    { code: 'BILI', name: '哔哩哔哩 (Bilibili)', price: '$21.40', changePct: '+5.40%', cap: '$89亿', desc: '游戏自研与广告变现盈亏平衡' },
  ];

  return (
    <div id="us-market-view" className="space-y-4">
      {/* Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              美股行情与全球科技巨头联动
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                纳指/标普/中概股
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              跟踪美股三大指数、七大科技巨头(Magnificent 7)以及热门中概互联 ADR 盘前/盘中动态
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('美股科技股走势对A股算力与消费电子的映射')}
          className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI 全球科技映射分析</span>
        </button>
      </div>

      {/* 4 Indices Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {usIndices.map((idx, i) => (
          <div key={i} className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-medium text-slate-500">{idx.name}</span>
            <div className="mt-1 font-mono">
              <div className="text-2xl font-black text-slate-900">{idx.price}</div>
              <div className={`text-xs font-bold mt-0.5 flex items-center ${idx.isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                {idx.isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {idx.change} ({idx.changePct})
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tech Giants Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs font-bold text-slate-800">美股科技七巨头 (Magnificent 7)</span>
          <span className="text-xs text-slate-400 font-mono">实时报价 (美元)</span>
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
                <tr key={stk.code} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3.5 font-bold text-blue-600">{stk.code}</td>
                  <td className="py-3 px-3 font-sans font-bold text-slate-900">{stk.name}</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">{stk.price}</td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">{stk.changePct}</td>
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
