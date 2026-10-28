import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  FolderPlus, 
  BookmarkPlus, 
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CustomSector } from '../types/customSector';
import { customSectorService } from '../services/customSectorService';

interface AddToCustomSectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock: { code: string; name: string; price?: number; changePercent?: number } | null;
  onSuccess?: (sectorName: string) => void;
  onOpenCreateSectorModal?: () => void;
}

export const AddToCustomSectorModal: React.FC<AddToCustomSectorModalProps> = ({
  isOpen,
  onClose,
  stock,
  onSuccess,
  onOpenCreateSectorModal
}) => {
  const [sectors, setSectors] = useState<CustomSector[]>([]);
  const [selectedSectorIds, setSelectedSectorIds] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && stock) {
      const list = customSectorService.getCustomSectors();
      setSectors(list);
      // Pre-select sectors that already contain this stock
      const containing = list.filter(s => s.stocks.some(st => st.code === stock.code)).map(s => s.id);
      setSelectedSectorIds(containing);
      setNotes('');
      setFeedback(null);
    }
  }, [isOpen, stock]);

  if (!isOpen || !stock) return null;

  const toggleSector = (id: string) => {
    setSelectedSectorIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    let addedCount = 0;
    sectors.forEach(sec => {
      const wasIn = sec.stocks.some(st => st.code === stock.code);
      const isNowSelected = selectedSectorIds.includes(sec.id);

      if (!wasIn && isNowSelected) {
        customSectorService.addStockToSector(sec.id, {
          code: stock.code,
          name: stock.name,
          notes: notes.trim() || undefined
        });
        addedCount++;
      } else if (wasIn && !isNowSelected) {
        customSectorService.removeStockFromSector(sec.id, stock.code);
      }
    });

    setFeedback('更新成功！已同步至自定义板块');
    setTimeout(() => {
      onSuccess?.(stock.name);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center space-x-2">
            <BookmarkPlus className="w-5 h-5 text-rose-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                收录至自定义板块
              </h3>
              <p className="text-[11px] text-slate-500">
                将个股归入个性化板块，集中监控资金与联动
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Stock Card */}
        <div className="p-4 bg-gradient-to-r from-rose-50/70 via-indigo-50/40 to-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-black text-xs font-mono shadow-xs">
              {stock.code.slice(0, 2)}
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">{stock.name}</div>
              <div className="text-[11px] font-mono text-slate-500">{stock.code}</div>
            </div>
          </div>
          {stock.price !== undefined && (
            <div className="text-right">
              <div className="text-xs font-mono font-bold text-slate-800">¥{stock.price.toFixed(2)}</div>
              {stock.changePercent !== undefined && (
                <div className={`text-[11px] font-mono font-bold ${
                  stock.changePercent >= 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sectors Checklist */}
        <div className="p-4 space-y-3 max-h-60 overflow-y-auto">
          <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span>选择收纳的自定义板块：</span>
            <span className="text-[11px] text-slate-400 font-normal">多选</span>
          </div>

          {sectors.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed rounded-xl">
              暂无自定义板块，请先新建一个板块
            </div>
          ) : (
            <div className="space-y-1.5">
              {sectors.map(sec => {
                const isSelected = selectedSectorIds.includes(sec.id);
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => toggleSector(sec.id)}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-rose-50/80 border-rose-300 text-slate-900 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-rose-600 border-rose-600 text-white'
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">{sec.name}</div>
                        <div className="text-[10px] text-slate-400 line-clamp-1">{sec.description}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">
                      {sec.stocks.length} 只
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Create Link */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateSectorModal?.();
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5" />
              <span>➕ 新建自定义板块...</span>
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className="px-4 py-2 bg-emerald-50 text-emerald-700 text-xs text-center font-bold">
            {feedback}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 flex items-center justify-end space-x-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-xs transition-colors cursor-pointer"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  );
};
