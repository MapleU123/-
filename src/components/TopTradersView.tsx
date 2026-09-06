import React from 'react';
import { 
  Trophy, 
  TrendingUp, 
  Award, 
  UserCheck, 
  Eye, 
  Percent, 
  Flame, 
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

interface TopTradersViewProps {
  onOpenAIDiagnosis?: (title?: string) => void;
}

export const TopTradersView: React.FC<TopTradersViewProps> = ({
  onOpenAIDiagnosis
}) => {
  const traders = [
    {
      id: 't1',
      name: '量化游资一号',
      avatar: '👨‍💼',
      badge: '总榜冠军 (TOP 1)',
      totalReturn: '+184.5%',
      monthlyReturn: '+26.8%',
      winRate: '86.4%',
      maxDrawdown: '4.2%',
      holdings: [
        { name: '隆平高科', ratio: '35%', profit: '+8.4%' },
        { name: '中芯国际', ratio: '30%', profit: '+6.8%' },
        { name: '中际旭创', ratio: '25%', profit: '+9.2%' },
        { name: '现金仓位', ratio: '10%', profit: '-' }
      ],
      strategyStyle: '超短波段 / 行业主线第一波龙头 / 涨停打板复利',
      recentTrade: '今日早盘 09:32 扫单加仓 隆平高科 1500手'
    },
    {
      id: 't2',
      name: '趋势价值先锋',
      avatar: '👩‍💼',
      badge: '机构风控王者',
      totalReturn: '+128.2%',
      monthlyReturn: '+18.4%',
      winRate: '81.0%',
      maxDrawdown: '3.1%',
      holdings: [
        { name: '紫金矿业', ratio: '40%', profit: '+14.5%' },
        { name: '长江电力', ratio: '30%', profit: '+4.2%' },
        { name: '中国平安', ratio: '20%', profit: '+5.6%' },
        { name: '现金仓位', ratio: '10%', profit: '-' }
      ],
      strategyStyle: '核心资产趋势跟踪 / 低估值高股息 + 金价弹性共振',
      recentTrade: '今日 10:15 止盈部分中国平安，调仓买入山东黄金'
    },
    {
      id: 't3',
      name: 'AI科技狙击手',
      avatar: '🧙‍♂️',
      badge: '成长弹性先锋',
      totalReturn: '+156.4%',
      monthlyReturn: '+32.1%',
      winRate: '78.5%',
      maxDrawdown: '6.8%',
      holdings: [
        { name: '新易盛', ratio: '40%', profit: '+12.6%' },
        { name: '中微公司', ratio: '30%', profit: '+8.1%' },
        { name: '昆仑万维', ratio: '20%', profit: '+11.5%' },
        { name: '现金仓位', ratio: '10%', profit: '-' }
      ],
      strategyStyle: '算力CPO/先进制程龙头持股 / 突破放量追涨',
      recentTrade: '今日 09:45 满仓持有光模块龙头新易盛'
    }
  ];

  return (
    <div id="top-traders-view" className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              实盘高手组合与跟投雷达
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                每日实时持仓披露
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              深度跟踪顶级量化私募、知名游资与实盘大赛百强选手的仓位变动与主线进攻方向
            </p>
          </div>
        </div>

        <button
          onClick={() => onOpenAIDiagnosis && onOpenAIDiagnosis('实盘高手持仓风格分析与跟投策略')}
          className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-yellow-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
          <span>AI 高手持仓风格诊断</span>
        </button>
      </div>

      {/* Trader Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {traders.map((trader, idx) => (
          <div
            key={trader.id}
            className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between space-y-3.5 hover:border-amber-400 transition-all"
          >
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <span className="text-2xl">{trader.avatar}</span>
                <div>
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                    {trader.name}
                  </div>
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full mt-0.5 inline-block">
                    {trader.badge}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="text-xs text-slate-400">总收益率</div>
                <div className="text-base font-black text-rose-600">{trader.totalReturn}</div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-3 gap-1.5 p-2 bg-slate-50 rounded-lg text-center font-mono text-xs">
              <div>
                <div className="text-[10.5px] text-slate-400 font-sans">近月收益</div>
                <div className="font-bold text-rose-600 mt-0.5">{trader.monthlyReturn}</div>
              </div>
              <div>
                <div className="text-[10.5px] text-slate-400 font-sans">胜率</div>
                <div className="font-bold text-slate-800 mt-0.5">{trader.winRate}</div>
              </div>
              <div>
                <div className="text-[10.5px] text-slate-400 font-sans">最大回撤</div>
                <div className="font-bold text-emerald-600 mt-0.5">{trader.maxDrawdown}</div>
              </div>
            </div>

            {/* Holdings Distribution */}
            <div>
              <div className="text-xs font-bold text-slate-700 mb-1.5">当前核心持仓</div>
              <div className="space-y-1 text-xs">
                {trader.holdings.map((h, i) => (
                  <div key={i} className="flex items-center justify-between p-1 rounded bg-slate-50/70">
                    <span className="font-medium text-slate-800">{h.name}</span>
                    <div className="flex items-center space-x-2 font-mono text-[11.5px]">
                      <span className="text-slate-500">仓位 {h.ratio}</span>
                      <span className="font-bold text-rose-600">{h.profit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Trade Note */}
            <div className="p-2 bg-amber-50/60 rounded-lg text-[11px] text-amber-900 border border-amber-200/60">
              <strong className="text-amber-800">最新动态:</strong> {trader.recentTrade}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
