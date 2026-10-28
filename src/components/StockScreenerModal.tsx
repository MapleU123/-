import React, { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Code2,
  Filter,
  Layers,
  ArrowRight,
  HelpCircle,
  TrendingUp,
  ShieldCheck,
  Download
} from 'lucide-react';
import { PendingConvertibleBond } from '../types/market';

interface StockScreenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bonds: PendingConvertibleBond[];
  currentSelectedStage?: string;
  currentFilterHighRights?: boolean;
}

export const StockScreenerModal: React.FC<StockScreenerModalProps> = ({
  isOpen,
  onClose,
  bonds,
  currentSelectedStage = 'all',
  currentFilterHighRights = false
}) => {
  // Custom filter state for dynamic one-sentence query generator
  const [selectedStage, setSelectedStage] = useState<string>(
    currentSelectedStage !== 'all' ? currentSelectedStage : 'registered_and_approved'
  );
  const [minRights, setMinRights] = useState<number>(currentFilterHighRights ? 10 : 8);
  const [marketCapLimit, setMarketCapLimit] = useState<string>('all');
  const [marketBoard, setMarketBoard] = useState<string>('all');
  const [excludeST, setExcludeST] = useState<boolean>(true);
  const [onlyProfitable, setOnlyProfitable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('rights');

  // Copy feedbacks
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Active tab inside modal
  const [activeTab, setActiveTab] = useState<'builder' | 'presets' | 'code_export' | 'guide'>('builder');

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey(null);
    }, 2200);
  };

  // Dynamic Sentence Generator based on user settings
  const generatedSentence = useMemo(() => {
    const parts: string[] = ['拟发行可转债'];

    // Stage
    if (selectedStage === 'registered_and_approved') {
      parts.push('方案进度为同意注册或证监会核准或上市委通过');
    } else if (selectedStage === 'csrc_registered') {
      parts.push('方案进度为同意注册或证监会核准');
    } else if (selectedStage === 'committee_approved') {
      parts.push('方案进度为上市委通过或发审委通过');
    } else if (selectedStage === 'exchange_accepted') {
      parts.push('方案进度为交易所已受理');
    } else if (selectedStage === 'board_plan') {
      parts.push('方案进度为董事会预案或股东大会通过');
    } else {
      parts.push('方案进度在审核中');
    }

    // Rights
    if (minRights > 0) {
      parts.push(`百元股票含权大于${minRights}元`);
    }

    // Market Cap
    if (marketCapLimit === 'small') {
      parts.push('总市值小于80亿');
    } else if (marketCapLimit === 'mid') {
      parts.push('总市值小于150亿');
    } else if (marketCapLimit === 'large') {
      parts.push('总市值大于150亿');
    }

    // Board
    if (marketBoard === 'main') {
      parts.push('主板');
    } else if (marketBoard === 'chinext') {
      parts.push('创业板');
    } else if (marketBoard === 'star') {
      parts.push('科创板');
    }

    // Quality
    if (onlyProfitable) {
      parts.push('净利润大于0');
    }

    // ST
    if (excludeST) {
      parts.push('非ST');
    }

    // Sorting
    if (sortBy === 'rights') {
      parts.push('按百元股票含权降序排序');
    } else if (sortBy === 'date') {
      parts.push('按最新公告日降序排序');
    } else if (sortBy === 'progress') {
      parts.push('按方案进度排序');
    }

    return parts.join('；');
  }, [selectedStage, minRights, marketCapLimit, marketBoard, excludeST, onlyProfitable, sortBy]);

  // Preset queries battle-tested in Tonghuashun / iWencai / EastMoney
  const presets = [
    {
      id: 'high_rights_gold',
      title: '高含权抢权金股（核心优选·安全垫厚）',
      tag: '最实用',
      tagColor: 'bg-amber-100 text-amber-800 border-amber-300',
      desc: '专为抢权配债设计，百元含权≥10元，且审核进入上市委通过或同意注册阶段，获配额度大且安全垫足。',
      sentence: '拟发行可转债；百元股票含权大于10元；方案进度为证监会核准或同意注册或上市委通过；非ST；按百元股票含权降序'
    },
    {
      id: 'approved_ready_to_issue',
      title: '已获批文·即将发债个股（倒计时抢权）',
      tag: '时效性强',
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      desc: '证监会已批文注册，随时可能公布发行公告与股权登记日，适合紧跟配债日期的投资者。',
      sentence: '拟发行可转债；方案进度为同意注册或证监会核准；尚未披露发行公告；非ST；按最新公告日降序'
    },
    {
      id: 'small_cap_one_hand',
      title: '小市值一手党低成本抢权（低门槛配一手）',
      tag: '一手党优选',
      tagColor: 'bg-rose-100 text-rose-800 border-rose-300',
      desc: '总市值较小、含权度适中，仅需极少持股市值（通常数千元）即可稳配1手（10张）转债。',
      sentence: '拟发行可转债；方案进度在审核中；百元股票含权大于8元；总市值小于100亿；非ST'
    },
    {
      id: 'quality_growth_cb',
      title: '业绩稳健·白马成长发债股（正股防守强）',
      tag: '稳健防守',
      tagColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      desc: '兼顾发债抢权与正股基本面质量，要求最新盈利为正且非ST，大幅降低正股抢权贴权下跌风险。',
      sentence: '拟发行可转债；方案进度为上市委通过或同意注册；扣非净利润大于0；百元股票含权大于5元；非ST'
    },
    {
      id: 'all_cb_pipeline',
      title: '全市场已披露待发可转债全景池（全覆盖）',
      tag: '全景底池',
      tagColor: 'bg-slate-100 text-slate-800 border-slate-300',
      desc: '全A股所有已披露可转债预案且处于审批流程中的标的池，涵盖从预案到注册全生命周期。',
      sentence: '已披露拟发行可转债；方案进度；非ST；按最新公告日降序'
    }
  ];

  // Codes string formatted for direct paste
  const codeListComma = useMemo(() => {
    return bonds.map(b => b.stockCode).join(', ');
  }, [bonds]);

  const codeListNewline = useMemo(() => {
    return bonds.map(b => b.stockCode).join('\n');
  }, [bonds]);

  const codeListWithMarket = useMemo(() => {
    return bonds
      .map(b => {
        const prefix = b.stockCode.startsWith('6') ? 'SH' : 'SZ';
        return `${prefix}${b.stockCode}`;
      })
      .join(', ');
  }, [bonds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        id="modal-stock-screener"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-rose-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-400/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-rose-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold tracking-tight">一句话条件选股语句生成器</h2>
                <span className="text-[11px] bg-rose-500/30 text-rose-200 px-2 py-0.5 rounded-full font-mono">
                  同花顺 / 问财 / 东方财富通用
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                复制一句话自然语言，粘贴到交易行情软件（如问财/同花顺/东财）即可 0 秒自动选出精准发债标的
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center space-x-1 px-6 border-b border-slate-200 bg-slate-50/70 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('builder')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'builder'
                ? 'border-rose-600 text-rose-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>自定义一句话拼接生成</span>
          </button>
          <button
            onClick={() => setActiveTab('presets')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'presets'
                ? 'border-rose-600 text-rose-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>经典实盘选股模板 (5套)</span>
          </button>
          <button
            onClick={() => setActiveTab('code_export')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'code_export'
                ? 'border-rose-600 text-rose-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>自选股代码批量导入 ({bonds.length}只)</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-4 border-b-2 flex items-center space-x-1.5 transition-colors cursor-pointer ${
              activeTab === 'guide'
                ? 'border-rose-600 text-rose-600 bg-white font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>使用教程说明</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: DYNAMIC BUILDER */}
          {activeTab === 'builder' && (
            <div className="space-y-5">
              {/* Filter controls row */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 1. 方案进度 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    1. 审核方案进度
                  </label>
                  <select
                    value={selectedStage}
                    onChange={(e) => setSelectedStage(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="registered_and_approved">批文注册 或 上市委通过 (推荐·临近发债)</option>
                    <option value="csrc_registered">仅限：批文已同意注册 (随时公布配债日)</option>
                    <option value="committee_approved">仅限：上市委审核通过</option>
                    <option value="exchange_accepted">仅限：交易所已受理</option>
                    <option value="board_plan">初级：董事会预案或股东会通过</option>
                    <option value="all_stages">不限：审核中全部阶段</option>
                  </select>
                </div>

                {/* 2. 百元股票含权门槛 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    2. 百元股票含权要求
                  </label>
                  <select
                    value={minRights}
                    onChange={(e) => setMinRights(Number(e.target.value))}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value={15}>百元含权 ≥ 15元 (超高含权·极佳安全垫)</option>
                    <option value={10}>百元含权 ≥ 10元 (主流黄金优选)</option>
                    <option value={8}>百元含权 ≥ 8元 (标准门槛)</option>
                    <option value={5}>百元含权 ≥ 5元 (宽松筛选)</option>
                    <option value={0}>不限制含权度</option>
                  </select>
                </div>

                {/* 3. 正股市值限制 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    3. 正股市值范围
                  </label>
                  <select
                    value={marketCapLimit}
                    onChange={(e) => setMarketCapLimit(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="all">不限制正股市值</option>
                    <option value="small">总市值 &lt; 80亿 (小市值·一手党易配)</option>
                    <option value="mid">总市值 &lt; 150亿 (中小市值有弹性)</option>
                    <option value="large">总市值 &gt; 150亿 (中大盘稳健)</option>
                  </select>
                </div>

                {/* 4. 市场板块 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    4. 股票板块归属
                  </label>
                  <select
                    value={marketBoard}
                    onChange={(e) => setMarketBoard(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="all">全市场所有板块</option>
                    <option value="main">主板 (沪市+深市主板)</option>
                    <option value="chinext">仅创业板 (30开头)</option>
                    <option value="star">仅科创板 (688开头)</option>
                  </select>
                </div>

                {/* 5. 排序规则 */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    5. 结果排序规则
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-slate-800 font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    <option value="rights">按百元股票含权降序 (优先看含权度)</option>
                    <option value="date">按最新进展公告日降序 (最新优先)</option>
                    <option value="progress">按方案审核进度先后排序</option>
                  </select>
                </div>

                {/* 6. 风控开关 */}
                <div className="flex flex-col justify-end">
                  <div className="flex items-center space-x-4 pt-3">
                    <label className="inline-flex items-center space-x-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={excludeST}
                        onChange={(e) => setExcludeST(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                      />
                      <span>排除ST/退市风险股</span>
                    </label>
                    <label className="inline-flex items-center space-x-1.5 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={onlyProfitable}
                        onChange={(e) => setOnlyProfitable(e.target.checked)}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer accent-rose-600"
                      />
                      <span>剔除亏损股 (净利润&gt;0)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Real-time Generated Sentence Output Box */}
              <div className="rounded-2xl border-2 border-rose-300 bg-gradient-to-br from-rose-50/70 via-white to-amber-50/50 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      生成的一句话选股语句（直接复制即可使用）
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-medium">
                    适用于同花顺问财APP / 网页端 / 东方财富
                  </span>
                </div>

                {/* The Sentence */}
                <div className="p-3.5 bg-white rounded-xl border border-rose-200 text-sm md:text-base font-mono font-bold text-slate-900 leading-relaxed select-all">
                  {generatedSentence}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                  <div className="text-xs text-slate-500 flex items-center space-x-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>包含 {generatedSentence.split('；').length} 项复合筛选条件</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopy(generatedSentence, 'builder_copy')}
                      className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer ${
                        copiedKey === 'builder_copy'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 hover:bg-rose-700 text-white'
                      }`}
                    >
                      {copiedKey === 'builder_copy' ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>已成功复制到剪贴板！</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>一键复制选股语句</span>
                        </>
                      )}
                    </button>

                    <a
                      href={`https://www.iwencai.com/unifiedwap/result?w=${encodeURIComponent(generatedSentence)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold transition-colors shadow-xs"
                      title="在同花顺问财中直接运行此语句查看结果"
                    >
                      <span>在问财中验证</span>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRESET MASTER STRATEGIES */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                经过实盘检验的 5 大成熟选股公式，点击右侧即可一键复制并直接在同花顺/问财中执行：
              </p>

              <div className="grid grid-cols-1 gap-3.5">
                {presets.map((p) => (
                  <div
                    key={p.id}
                    className="bg-slate-50 hover:bg-white p-4 rounded-xl border border-slate-200 hover:border-rose-300 hover:shadow-xs transition-all space-y-2.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">{p.title}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${p.tagColor}`}>
                          {p.tag}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopy(p.sentence, p.id)}
                          className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                            copiedKey === p.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border border-slate-300 text-slate-700 hover:border-rose-400 hover:text-rose-600 shadow-2xs'
                          }`}
                        >
                          {copiedKey === p.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>已复制</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>复制语句</span>
                            </>
                          )}
                        </button>
                        <a
                          href={`https://www.iwencai.com/unifiedwap/result?w=${encodeURIComponent(p.sentence)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                          title="在问财中运行"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>

                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-xs font-mono font-medium text-slate-800 select-all">
                      {p.sentence}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: STOCK CODES BATCH IMPORT */}
          {activeTab === 'code_export' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                <span>
                  当前系统已收录 <strong>{bonds.length}</strong> 只待发转债的正股代码，可直接复制粘贴导入通达信、同花顺、东方财富自选股。
                </span>
                <span className="font-mono font-bold text-amber-800 text-[11px]">
                  共 {bonds.length} 只标的
                </span>
              </div>

              {/* Format 1: Comma-separated (Tonghuashun / Eastmoney) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    格式一：逗号分隔代码（同花顺 / 东方财富 自选股批量导入）
                  </span>
                  <button
                    onClick={() => handleCopy(codeListComma, 'comma_codes')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:text-rose-600 cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'comma_codes' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'comma_codes' ? '已复制' : '复制代码'}</span>
                  </button>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 max-h-24 overflow-y-auto break-all select-all">
                  {codeListComma}
                </div>
              </div>

              {/* Format 2: Newline-separated (Tongdaxin text import) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    格式二：换行文本格式（通达信 自定义板块文本导入）
                  </span>
                  <button
                    onClick={() => handleCopy(codeListNewline, 'newline_codes')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:text-rose-600 cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'newline_codes' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'newline_codes' ? '已复制' : '复制代码'}</span>
                  </button>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 max-h-24 overflow-y-auto whitespace-pre-wrap select-all">
                  {codeListNewline}
                </div>
              </div>

              {/* Format 3: With Market Prefix SH/SZ */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    格式三：带市场前缀（SH60xxxx, SZ00xxxx / 雪球自选股导入）
                  </span>
                  <button
                    onClick={() => handleCopy(codeListWithMarket, 'market_codes')}
                    className="inline-flex items-center space-x-1 px-2.5 py-1 bg-white border border-slate-300 rounded text-xs font-semibold text-slate-700 hover:text-rose-600 cursor-pointer shadow-2xs"
                  >
                    {copiedKey === 'market_codes' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'market_codes' ? '已复制' : '复制代码'}</span>
                  </button>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-700 max-h-24 overflow-y-auto break-all select-all">
                  {codeListWithMarket}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USAGE GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                  <span>如何在【同花顺 / 问财】中使用一句话选股？</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 pl-1">
                  <li>
                    <strong>复制语句</strong>：在上方标签页选择你满意的条件语句（如：<code className="text-rose-600 font-mono bg-rose-50 px-1 py-0.5 rounded">拟发行可转债；百元股票含权大于10元；方案进度为证监会核准或同意注册；非ST</code>），点击「一键复制」。
                  </li>
                  <li>
                    <strong>打开同花顺或问财</strong>：
                    <ul className="list-disc list-inside pl-4 pt-1 space-y-1 text-slate-500">
                      <li>电脑端：在同花顺主界面顶部的搜索框输入，或者打开 <strong>问财选股（快捷键 Ctrl+Q 或点击问财图标）</strong>。</li>
                      <li>手机端：打开同花顺 APP，点击底部的 <strong>问财</strong>，将选股语句粘贴到问财对话框中直接发送。</li>
                    </ul>
                  </li>
                  <li>
                    <strong>查看与保存</strong>：问财会自动解析自然语言，0秒筛出所有符合发债条件的A股个股，支持在问财中点击「设为预警」或「加入自选股」。
                  </li>
                </ol>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="font-bold text-sm text-slate-900 flex items-center space-x-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>发债选股的核心实战技巧</span>
                </h3>
                <ul className="list-disc list-inside space-y-2 text-slate-600 pl-1">
                  <li>
                    <strong>优先关注「同意注册」阶段</strong>：此时批文已下发，通常在 1~3 个月内必须完成发行，发债确定性最高，股权登记日公布后即进入实盘抢权期。
                  </li>
                  <li>
                    <strong>百元含权是安全垫的生命线</strong>：百元含权≥10元（即配债收益占正股市值比重较高），即使正股有小幅贴权波动，配债利润依然能覆盖正股波动。
                  </li>
                  <li>
                    <strong>一手党技巧</strong>：利用「四舍五入」规则，计算只需配售 500 元即可获配 1 手转债（1000 元）的最小持股门槛，大幅降低资金占用与持仓风险。
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 flex items-center space-x-2">
            <span>选股语句支持全天候实时更新验证</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            完成并返回
          </button>
        </div>
      </div>
    </div>
  );
};
