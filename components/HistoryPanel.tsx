import React from 'react';
import { Download, Trash2, X, RefreshCw, ChevronDown, Clock } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryPanelProps {
  items: HistoryItem[];
  hasMore: boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  onRefresh: () => void;
  onLoadMore: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ items, hasMore, onLoad, onDelete, onClose, onRefresh, onLoadMore }) => {
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* 抽屉面板 */}
      <div
        className="relative w-full max-w-sm bg-white shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
        style={{ animation: 'slideInRight 0.2s ease-out' }}
      >
        {/* 头部 */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
              <Clock size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-800">历史文档</h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={onRefresh} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title="刷新">
              <RefreshCw size={15} />
            </button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" title="关闭">
              <X size={15} />
            </button>
          </div>
        </div>

        {/* 列表 */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <Clock size={36} className="mb-3 opacity-30" />
              <div className="text-sm font-medium">暂无历史文档</div>
              <div className="text-xs mt-1">导出 DOCX/XLSX 时会自动保存</div>
            </div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="group p-3.5 bg-slate-50/80 hover:bg-brand-50/50 rounded-xl border border-slate-100 hover:border-brand-200 transition-all cursor-pointer"
                  onClick={() => onLoad(item.id)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-700 truncate">{item.title}</div>
                      <div className="text-xs text-slate-400 mt-1.5 flex items-center gap-2">
                        <span>{formatDate(item.created_at)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300" />
                        <span>{item.char_count.toLocaleString()} 字符</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={(e) => { e.stopPropagation(); onLoad(item.id); }}
                        className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg"
                        title="加载"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('确定删除此历史文档？')) onDelete(item.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg"
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={onLoadMore}
                  className="w-full py-3 text-sm text-brand-600 hover:bg-brand-50 rounded-xl flex items-center justify-center gap-1.5 border border-dashed border-brand-200"
                >
                  <ChevronDown size={14} />
                  加载更多
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default HistoryPanel;
