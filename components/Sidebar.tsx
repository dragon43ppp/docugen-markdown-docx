import React, { useRef } from 'react';
import {
  FileType, Upload, Wand2, Table, FileDown, FileSpreadsheet,
  ChevronLeft, ChevronRight, Sparkles, RotateCcw, Trash2, BookOpen
} from 'lucide-react';
import { ProcessingState, DocFont, DOC_FONTS, ModelInfo } from '../types';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onAutoFormat: () => void;
  onSmartTable: () => void;
  onBidFormat: () => void;
  onImportFile: (file: File) => void;
  onImportBidFile: (file: File) => void;
  onExportDocx: () => void;
  onExportXlsx: () => void;
  processingState: ProcessingState;
  onReconfigure: () => void;
  onClearConfig: () => void;
  activeModel: string;
  availableModels: ModelInfo[];
  onModelChange: (id: string) => void;
  docFont: DocFont;
  onFontChange: (f: DocFont) => void;
  hasContent: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed, onToggleCollapse,
  onAutoFormat, onSmartTable, onBidFormat, onImportFile, onImportBidFile, onExportDocx, onExportXlsx,
  processingState, onReconfigure, onClearConfig,
  activeModel, availableModels, onModelChange, docFont, onFontChange,
  hasContent,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bidFileInputRef = useRef<HTMLInputElement>(null);
  const isProcessing = processingState.isProcessing;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onImportFile(file);
    event.target.value = '';
  };

  const handleBidFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onImportBidFile(file);
    event.target.value = '';
  };

  const StepDot = ({ step, done }: { step: number; done?: boolean }) => (
    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all ${
      done
        ? 'bg-green-100 text-green-600 border border-green-200'
        : 'bg-brand-50 text-brand-600 border border-brand-200'
    }`}>
      {done ? '✓' : step}
    </div>
  );

  const StepHeader = ({ step, label, done }: { step: number; label: string; done?: boolean }) => (
    !collapsed ? (
      <div className="flex items-center gap-2 px-1 pb-1 pt-3 first:pt-0">
        <StepDot step={step} done={done} />
        <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">{label}</span>
      </div>
    ) : (
      <div className="flex justify-center py-1">
        <StepDot step={step} done={done} />
      </div>
    )
  );

  const StepLine = () => (
    !collapsed ? (
      <div className="flex items-stretch pl-[9px] py-0">
        <div className="w-px bg-slate-200 min-h-[8px]" />
      </div>
    ) : null
  );

  const SidebarItem = ({ icon: Icon, label, onClick, disabled, active, accent, hint }: {
    icon: React.ElementType; label: string; onClick: () => void;
    disabled?: boolean; active?: boolean; accent?: string; hint?: string;
  }) => (
    <div className="sidebar-item relative">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
          ${active
            ? 'bg-brand-50 text-brand-700 shadow-sm'
            : accent
              ? `${accent} hover:opacity-90`
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
          }
          ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
        `}
      >
        <Icon size={18} className={isProcessing && (label === 'AI 格式化') ? 'animate-spin' : ''} />
        {!collapsed && (
          <div className="flex-1 min-w-0 text-left">
            <span className="whitespace-nowrap">{label}</span>
            {hint && <div className="text-[10px] text-slate-400 font-normal truncate">{hint}</div>}
          </div>
        )}
      </button>
      {collapsed && (
        <div className="sidebar-tooltip absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2.5 py-1 bg-slate-800 text-white text-xs rounded-lg whitespace-nowrap z-50 pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );

  return (
    <div className={`${collapsed ? 'w-[68px]' : 'w-[220px]'} h-full bg-white border-r border-slate-200/80 flex flex-col shadow-sidebar transition-all duration-200 ease-in-out`}>
      <div className="px-3 pt-5 pb-4">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-1'}`}>
          <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-2 rounded-xl text-white shadow-md flex-shrink-0">
            <FileType size={20} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="font-bold text-slate-800 text-base leading-tight truncate">DocuGen AI</h1>
              <p className="text-[11px] text-slate-400 truncate">开源本地版</p>
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-slate-100 mx-3" />

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.csv,.log,.json,.xml,.html,.docx,.doc,.xlsx,.xls,.pdf" onChange={handleFileChange} />
        <input type="file" ref={bidFileInputRef} className="hidden" accept=".txt,.md,.docx,.doc,.pdf" onChange={handleBidFileChange} />

        <StepHeader step={1} label="导入内容" done={hasContent} />
        <SidebarItem icon={Upload} label="导入文件" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}
          hint="Word / Excel / PDF / TXT" />
        {!collapsed && !hasContent && (
          <div className="text-[10px] text-slate-400 px-3 pb-1 leading-relaxed">
            或直接在左侧编辑区粘贴内容
          </div>
        )}

        <StepLine />

        <StepHeader step={2} label="选择模型" />
        {!collapsed ? (
          <div className="space-y-2 px-1 pb-1">
            <div>
              {availableModels.length > 0 ? (
                <select
                  value={activeModel}
                  onChange={(e) => onModelChange(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none cursor-pointer"
                >
                  {availableModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              ) : (
                <div className="text-xs text-slate-400 truncate">{activeModel || '未配置模型'}</div>
              )}
              <div className="mt-1.5 text-[10px] text-slate-500 leading-relaxed bg-slate-50 rounded-md px-2 py-1">
                模型列表会尝试自动探测；失败时仍可使用手填模型名继续调用。
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase mb-1">导出字体</div>
              <select
                value={docFont}
                onChange={(e) => onFontChange(e.target.value as DocFont)}
                className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-700 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none cursor-pointer"
              >
                {DOC_FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
              </select>
            </div>
          </div>
        ) : (
          <SidebarItem icon={FileType} label="模型/字体" onClick={onToggleCollapse} />
        )}

        <StepLine />

        <StepHeader step={3} label="AI 处理" />
        <SidebarItem icon={Wand2} label="AI 格式化" onClick={onAutoFormat} disabled={isProcessing || !hasContent}
          accent={hasContent ? 'bg-brand-600 text-white hover:bg-brand-700' : undefined}
          hint="一键整理文档格式" />
        <SidebarItem icon={Table} label="智能表格" onClick={onSmartTable} disabled={isProcessing || !hasContent}
          hint="表格不够美观？单独优化" />

        <StepLine />

        <StepHeader step={4} label="导出文档" />
        <SidebarItem icon={FileDown} label="导出 DOCX" onClick={onExportDocx} disabled={isProcessing || !hasContent}
          accent={hasContent ? 'bg-slate-800 text-white hover:bg-slate-700' : undefined} />
        <SidebarItem icon={FileSpreadsheet} label="导出 Excel" onClick={onExportXlsx} disabled={isProcessing || !hasContent}
          accent={hasContent ? 'bg-emerald-600 text-white hover:bg-emerald-500' : undefined} />

        <div className="h-px bg-slate-100 my-3" />

        {!collapsed ? (
          <div className="flex items-center gap-1.5 px-1 pb-1">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[10px] font-semibold text-amber-500 tracking-widest uppercase">实验功能</span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <Sparkles size={14} className="text-amber-500" />
          </div>
        )}
        <SidebarItem icon={Upload} label="导入标书" onClick={() => bidFileInputRef.current?.click()} disabled={isProcessing}
          hint="最大 50MB" />
        <SidebarItem icon={BookOpen} label="标书转写" onClick={onBidFormat} disabled={isProcessing || !hasContent}
          accent={hasContent ? 'bg-amber-600 text-white hover:bg-amber-500' : undefined} />
        <SidebarItem icon={FileDown} label="导出标书" onClick={onExportDocx} disabled={isProcessing || !hasContent}
          hint="转写完成后导出 DOCX" />
        {!collapsed && (
          <div className="px-2 mt-1 text-[10px] text-amber-600 leading-relaxed bg-amber-50 rounded-lg py-1.5">
            标书转写会使用更大的分段处理，结果请人工复核。
          </div>
        )}
      </div>

      <div className="border-t border-slate-100 px-3 py-3 space-y-1">
        <SidebarItem icon={RotateCcw} label="重新配置" onClick={onReconfigure} />
        <SidebarItem icon={Trash2} label="清空配置" onClick={onClearConfig} />
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center py-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
