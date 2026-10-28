import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Search, 
  Check, 
  FolderPlus, 
  Sparkles,
  Layers, 
  AlertCircle 
} from 'lucide-react';
import { CustomSector } from '../types/customSector';
import { customSectorService } from '../services/customSectorService';

interface CustomSectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  sectorToEdit?: CustomSector | null;
  onSaved: (sector: CustomSector) => void;
}

const COLOR_OPTIONS = [
  { id: 'rose', label: '活力红', bg: 'bg-rose-500', text: 'text-rose-500', border: 'border-rose-500', light: 'bg-rose-50' },
  { id: 'indigo', label: '科技蓝', bg: 'bg-indigo-500', text: 'text-indigo-500', border: 'border-indigo-500', light: 'bg-indigo-50' },
  { id: 'emerald', label: '成长绿', bg: 'bg-emerald-500', text: 'text-emerald-500', border: 'border-emerald-500', light: 'bg-emerald-50' },
  { id: 'amber', label: '价值金', bg: 'bg-amber-500', text: 'text-amber-500', border: 'border-amber-500', light: 'bg-amber-50' },
  { id: 'purple', label: '高端紫', bg: 'bg-purple-500', text: 'text-purple-500', border: 'border-purple-500', light: 'bg-purple-50' },
  { id: 'cyan', label: '创新青', bg: 'bg-cyan-500', text: 'text-cyan-500', border: 'border-cyan-500', light: 'bg-cyan-50' },
];

const PRESET_STOCK_SHORTCUTS = [
  { name: '中际旭创', code: '300308' },
  { name: '工业富联', code: '601138' },
  { name: '寒武纪', code: '688256' },
  { name: '中芯国际', code: '688981' },
  { name: '宁德时代', code: '300750' },
  { name: '中国神华', code: '601088' },
  { name: '长江电力', code: '600900' },
  { name: '比亚迪', code: '002594' },
  { name: '贵州茅台', code: '600519' },
  { name: '东方财富', code: '300059' }
];

export const CustomSectorModal: React.FC<CustomSectorModalProps> = ({
  isOpen,
  onClose,
  sectorToEdit,
  onSaved
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagColor, setTagColor] = useState('rose');
  const [selectedStocks, setSelectedStocks] = useState<{ code: string; name: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ code: string; name: string; price: number; changePercent: number; sector?: string }[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (sectorToEdit) {
      setName(sectorToEdit.name);
      setDescription(sectorToEdit.description || '');
      setTagColor(sectorToEdit.tagColor || 'rose');
      setSelectedStocks(sectorToEdit.stocks.map(s => ({ code: s.code, name: s.name })));
    } else {
      setName('');
      setDescription('');
      setTagColor('rose');
      setSelectedStocks([]);
    }
    setSearchQuery('');
    setErrorMessage('');
  }, [sectorToEdit, isOpen]);

  useEffect(() => {
    const res = customSectorService.searchStocks(searchQuery);
    setSearchResults(res);
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleAddStock = (stock: { code: string; name: string }) => {
    if (selectedStocks.some(s => s.code === stock.code)) {
      return;
    }
    setSelectedStocks(prev => [...prev, stock]);
    setErrorMessage('');
  };

  const handleRemoveStock = (code: string) => {
    setSelectedStocks(prev => prev.filter(s => s.code !== code));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('请输入自定义板块名称');
      return;
    }
    if (selectedStocks.length === 0) {
      setErrorMessage('请至少添加1只股票以进行资金流跟踪');
      return;
    }

    try {
      if (sectorToEdit) {
        const updated = customSectorService.updateCustomSector(sectorToEdit.id, {
          name: name.trim(),
          description: description.trim(),
          tagColor,
          stocks: selectedStocks.map(s => ({
            code: s.code,
            name: s.name,
            addedAt: sectorToEdit.stocks.find(es => es.code === s.code)?.addedAt || new Date().toISOString().split('T')[0]
          }))
        });
        onSaved(updated);
      } else {
        const created = customSectorService.createCustomSector({
          name: name.trim(),
          description: description.trim(),
          tagColor,
          stockCodes: selectedStocks.map(s => s.code)
        });
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || '保存失败，请检查输入');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-indigo-600 flex items-center justify-center text-white shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {sectorToEdit ? '编辑自定义板块' : '新建自定义板块'}
              </h2>
              <p className="text-xs text-slate-500">
                自由组合看好的A股标的，实时穿透追踪专属主力资金流向
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in slide-in-from-top-1">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Sector Name & Color */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                板块名称 <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="例如：🚀 算力核心与半导体龙头"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all"
                maxLength={25}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                主题色标
              </label>
              <div className="flex items-center gap-2 py-1">
                {COLOR_OPTIONS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setTagColor(c.id)}
                    className={`w-7 h-7 rounded-full ${c.bg} transition-all cursor-pointer flex items-center justify-center text-white ${
                      tagColor === c.id ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-xs' : 'opacity-70 hover:opacity-100'
                    }`}
                    title={c.label}
                  >
                    {tagColor === c.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              板块投资逻辑 / 跟踪备注
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简要记录本板块的选股逻辑，例如：关注业绩反转与高景气订单催化"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all"
              maxLength={80}
            />
          </div>

          {/* 3. Selected Stocks Strip */}
          <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/90">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-800">已纳入成分股</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold">
                  {selectedStocks.length} 只
                </span>
              </div>
              {selectedStocks.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedStocks([])}
                  className="text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>清空已选</span>
                </button>
              )}
            </div>

            {selectedStocks.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                尚未添加股票，请在下方搜索栏搜索股票代码或名称添加
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1">
                {selectedStocks.map(stk => (
                  <span
                    key={stk.code}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 shadow-2xs group"
                  >
                    <span>{stk.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{stk.code}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveStock(stk.code)}
                      className="text-slate-400 hover:text-rose-600 rounded-full p-0.5 transition-colors cursor-pointer"
                      title="移除"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 4. Quick Stock Shortcuts */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>常用热门龙头快捷加入：</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_STOCK_SHORTCUTS.map(sc => {
                const isAdded = selectedStocks.some(s => s.code === sc.code);
                return (
                  <button
                    key={sc.code}
                    type="button"
                    onClick={() => handleAddStock(sc)}
                    disabled={isAdded}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1 border ${
                      isAdded
                        ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        : 'bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 border-slate-200 hover:border-rose-300 shadow-2xs'
                    }`}
                  >
                    <span>{sc.name}</span>
                    {isAdded ? <Check className="w-3 h-3 text-emerald-500" /> : <Plus className="w-3 h-3 text-slate-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Stock Search Box */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              搜索并添加股票（支持代码、名称、所属行业）
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入股票代码如 300308 或 名称如 中际旭创..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-none transition-all bg-slate-50/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  清空
                </button>
              )}
            </div>

            {/* Results List */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
              {searchResults.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  未匹配到相关个股，请确认代码或名称无误
                </div>
              ) : (
                searchResults.map(stock => {
                  const isAdded = selectedStocks.some(s => s.code === stock.code);
                  const isUp = stock.changePercent >= 0;
                  return (
                    <div
                      key={stock.code}
                      className="px-3.5 py-2 flex items-center justify-between hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-xs font-bold text-slate-800 w-16">{stock.code}</span>
                        <span className="text-xs font-bold text-slate-900">{stock.name}</span>
                        {stock.sector && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                            {stock.sector}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <span className="font-mono text-xs font-bold text-slate-700">¥{stock.price.toFixed(2)}</span>
                          <span className={`font-mono text-[11px] font-bold ml-2 ${isUp ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {isUp ? '+' : ''}{stock.changePercent.toFixed(2)}%
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddStock(stock)}
                          disabled={isAdded}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                            isAdded
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 hover:border-transparent'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3 h-3" />
                              <span>已添加</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>添加</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            已选择 <strong className="text-slate-800">{selectedStocks.length}</strong> 只股票
          </div>
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 shadow-md shadow-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{sectorToEdit ? '保存修改' : '确认创建并开始跟踪'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
