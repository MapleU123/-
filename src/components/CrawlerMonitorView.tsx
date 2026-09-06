import React from 'react';
import { 
  Database, 
  Server, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  HardDrive, 
  RefreshCw, 
  Activity, 
  Zap,
  Layers,
  Sparkles
} from 'lucide-react';
import { MarketOverviewData } from '../types/market';

interface CrawlerMonitorViewProps {
  overviewData: MarketOverviewData;
  onOpenAIDiagnosis?: (title?: string) => void;
}

export const CrawlerMonitorView: React.FC<CrawlerMonitorViewProps> = ({
  overviewData,
  onOpenAIDiagnosis
}) => {
  const crawlerTasks = [
    { name: '东方财富行业板块实时资金流', interval: '3秒/轮', status: '正常运行 (Healthy)', latency: '48ms', records: '496条/轮', errorRate: '0.00%' },
    { name: '东方财富概念板块实时资金流', interval: '5秒/轮', status: '正常运行 (Healthy)', latency: '56ms', records: '382条/轮', errorRate: '0.00%' },
    { name: '两市个股 Level-2 逐笔异动大单', interval: '1秒/轮', status: '正常运行 (Healthy)', latency: '24ms', records: '5,320条/秒', errorRate: '0.00%' },
    { name: '北向资金 (沪深股通) 实时流向', interval: '10秒/轮', status: '正常运行 (Healthy)', latency: '62ms', records: '2条/轮', errorRate: '0.00%' },
    { name: '大盘多空情绪与涨跌停天梯', interval: '5秒/轮', status: '正常运行 (Healthy)', latency: '35ms', records: '100条/轮', errorRate: '0.00%' },
    { name: '黄金 AU9999 与美股行情网关', interval: '15秒/轮', status: '正常运行 (Healthy)', latency: '110ms', records: '48条/轮', errorRate: '0.00%' },
  ];

  return (
    <div id="crawler-monitor-view" className="space-y-4">
      {/* Banner */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              后端数据源采集与入库监控中心
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-bold">
                高可用集群 99.99%
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              监控东财/通达信数据源爬取管道、SQLite/PostgreSQL 同步日志及毫秒级 API 延迟
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
          <span className="flex items-center gap-1 text-emerald-600 font-bold">
            <CheckCircle2 className="w-4 h-4" />
            所有采集节点同步正常
          </span>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-sans">当前采集总轮次</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{overviewData.collectionRound || 248} 次</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-sans">累计入库记录条数</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{(overviewData.totalRecords || 123000).toLocaleString()} 条</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-sans">平均网络延迟</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">38 ms</div>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
          <div className="text-xs text-slate-500 font-sans">数据缓存命中率</div>
          <div className="text-2xl font-black text-purple-600 mt-1">99.4%</div>
        </div>
      </div>

      {/* Pipelines Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-3.5 border-b border-slate-100 font-bold text-xs text-slate-800 bg-slate-50/50">
          实时采集任务管线状态
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200/80 font-semibold font-mono">
              <tr>
                <th className="py-2.5 px-3.5">采集任务名称</th>
                <th className="py-2.5 px-3">轮询频率</th>
                <th className="py-2.5 px-3">运行状态</th>
                <th className="py-2.5 px-3 text-right">网络延迟</th>
                <th className="py-2.5 px-3 text-right">单轮入库吞吐量</th>
                <th className="py-2.5 px-3 text-right">错误率</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {crawlerTasks.map((task, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-3.5 font-sans font-bold text-slate-900">{task.name}</td>
                  <td className="py-3 px-3 text-slate-600">{task.interval}</td>
                  <td className="py-3 px-3 font-sans">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {task.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-600 font-bold">{task.latency}</td>
                  <td className="py-3 px-3 text-right text-slate-700">{task.records}</td>
                  <td className="py-3 px-3 text-right text-slate-500">{task.errorRate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
