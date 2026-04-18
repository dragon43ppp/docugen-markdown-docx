import React, { useRef } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  FileType,
  RotateCcw,
  Sparkles,
  Table,
  Trash2,
  Upload,
  Wand2,
} from 'lucide-react';
import { DOC_FONTS, type DocFont, type ModelInfo, type ProcessingState } from '../types';

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
  onDirectExportPdfDocx: () => void;
  canDirectExportPdf: boolean;
  hasDirectExportedPdf: boolean;
  processingState: ProcessingState;
  onReconfigure: () => void;
  onClearConfig: () => void;
  activeModel: string;
  availableModels: ModelInfo[];
  onModelChange: (id: string) => void;
  docFont: DocFont;
  onFontChange: (font: DocFont) => void;
  hasContent: boolean;
  providerName: string;
  apiBaseUrl: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  onAutoFormat,
  onSmartTable,
  onBidFormat,
  onImportFile,
  onImportBidFile,
  onExportDocx,
  onExportXlsx,
  onDirectExportPdfDocx,
  canDirectExportPdf,
  hasDirectExportedPdf,
  processingState,
  onReconfigure,
  onClearConfig,
  activeModel,
  availableModels,
  onModelChange,
  docFont,
  onFontChange,
  hasContent,
  providerName,
  apiBaseUrl,
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
    <div
      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
        done ? 'border-emerald-200 bg-emerald-100 text-emerald-600' : 'border-brand-200 bg-brand-50 text-brand-600'
      }`}
    >
      {done ? '✓' : step}
    </div>
  );

  const StepHeader = ({ step, label, done }: { step: number; label: string; done?: boolean }) =>
    !collapsed ? (
      <div className="flex items-center gap-2 px-1 pb-1 pt-3 first:pt-0">
        <StepDot step={step} done={done} />
        <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      </div>
    ) : (
      <div className="flex justify-center py-1">
        <StepDot step={step} done={done} />
      </div>
    );

  const StepLine = () =>
    !collapsed ? (
      <div className="flex items-stretch py-0 pl-[9px]">
        <div className="min-h-[8px] w-px bg-slate-200" />
      </div>
    ) : null;

  const SidebarItem = ({
    icon: Icon,
    label,
    onClick,
    disabled,
    active,
    accent,
    hint,
  }: {
    icon: React.ElementType;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    accent?: string;
    hint?: string;
  }) => (
    <div className="sidebar-item relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
          active
            ? 'bg-brand-50 text-brand-700 shadow-sm'
            : accent
              ? `${accent} hover:opacity-90`
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
        } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
      >
        <Icon size={18} className={isProcessing && label === 'AI 格式化' ? 'animate-spin' : ''} />
        {!collapsed && (
          <div className="min-w-0 flex-1 text-left">
            <span className="whitespace-nowrap">{label}</span>
            {hint && <div className="truncate text-[10px] font-normal text-slate-400">{hint}</div>}
          </div>
        )}
      </button>

      {collapsed && (
        <div className="sidebar-tooltip pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-800 px-2.5 py-1 text-xs text-white">
          {label}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`${collapsed ? 'w-[68px]' : 'w-[252px]'} flex h-full flex-col border-r border-slate-200/80 bg-white shadow-sidebar transition-all duration-200 ease-in-out`}
    >
      <div className="px-3 pb-4 pt-5">
        <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-1'}`}>
          <div className="flex-shrink-0 rounded-xl bg-gradient-to-br from-brand-500 to-sky-600 p-2 text-white shadow-md">
            <FileType size={20} />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold leading-tight text-slate-800">DocuGen MD DOCX</h1>
              <p className="truncate text-[11px] text-slate-400">PDF to Word / Markdown to DOCX</p>
            </div>
          )}
        </div>
      </div>

      <div className="mx-3 h-px bg-slate-100" />

      <div className="flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".txt,.md,.csv,.log,.json,.xml,.html,.docx,.doc,.xlsx,.xls,.pdf,.png,.jpg,.jpeg,.bmp,.webp,.tif,.tiff"
          onChange={handleFileChange}
        />
        <input
          type="file"
          ref={bidFileInputRef}
          className="hidden"
          accept=".txt,.md,.docx,.doc,.pdf"
          onChange={handleBidFileChange}
        />

        <StepHeader step={1} label="导入内容" done={hasContent} />
        <SidebarItem
          icon={Upload}
          label="导入文件"
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          hint="Word / Excel / PDF / 图片 / TXT"
        />
        {!collapsed && !hasContent && (
          <div className="px-3 pb-1 text-[10px] leading-relaxed text-slate-400">
            也可以直接把原始内容粘贴到右侧编辑区。
          </div>
        )}

        <StepLine />

        <StepHeader step={2} label="PDF 转 Word" done={hasDirectExportedPdf} />
        <SidebarItem
          icon={FileDown}
          label="下载中间 Word"
          onClick={onDirectExportPdfDocx}
          disabled={isProcessing || !canDirectExportPdf}
          accent={canDirectExportPdf ? 'bg-slate-800 text-white hover:bg-slate-700' : undefined}
          hint={canDirectExportPdf ? '按原始 PDF 直接转成 Word，作为中间结果下载' : '请先导入 PDF 文件'}
        />
        {!collapsed && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
            这个步骤只负责把原始 PDF 转成 Word 并下载下来。下载后，你仍然可以继续在当前页面里整理提取出的内容，再导出最终文档。
          </div>
        )}

        <StepLine />

        <StepHeader step={3} label="继续整理格式" done={hasContent} />
        {!collapsed ? (
          <div className="space-y-2 px-1 pb-1">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
              <div className="font-semibold text-slate-700">{providerName}</div>
              <div className="mt-1 truncate">{apiBaseUrl}</div>
            </div>

            <div>
              {availableModels.length > 0 ? (
                <select
                  value={activeModel}
                  onChange={(event) => onModelChange(event.target.value)}
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
                >
                  {availableModels.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="truncate text-xs text-slate-400">{activeModel || '未配置模型'}</div>
              )}
              <div className="mt-1.5 rounded-md bg-slate-50 px-2 py-1 text-[10px] leading-relaxed text-slate-500">
                程序会优先从你的接口自动探测模型列表；如果探测失败，手动填写的模型名仍然可以继续使用。
              </div>
            </div>

            <div>
              <div className="mb-1 text-[10px] font-semibold tracking-[0.08em] text-slate-400">导出字体</div>
              <select
                value={docFont}
                onChange={(event) => onFontChange(event.target.value as DocFont)}
                className="w-full cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              >
                {DOC_FONTS.map((font) => (
                  <option key={font.id} value={font.id}>
                    {font.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <SidebarItem icon={FileType} label="模型与字体" onClick={onToggleCollapse} />
        )}
        <SidebarItem
          icon={Wand2}
          label="AI 格式化"
          onClick={onAutoFormat}
          disabled={isProcessing || !hasContent}
          accent={hasContent ? 'bg-brand-600 text-white hover:bg-brand-700' : undefined}
          hint="整理标题、段落和结构"
        />
        <SidebarItem
          icon={Table}
          label="智能表格"
          onClick={onSmartTable}
          disabled={isProcessing || !hasContent}
          hint="把结构化内容整理成 Markdown 表格"
        />

        <StepLine />

        <StepHeader step={4} label="导出结果" />
        <SidebarItem
          icon={FileDown}
          label="导出最终 DOCX"
          onClick={onExportDocx}
          disabled={isProcessing || !hasContent}
          accent={hasContent ? 'bg-emerald-600 text-white hover:bg-emerald-500' : undefined}
          hint="这是整理完成后的最终 Word"
        />
        <SidebarItem
          icon={FileSpreadsheet}
          label="导出 Excel"
          onClick={onExportXlsx}
          disabled={isProcessing || !hasContent}
          accent={hasContent ? 'bg-teal-600 text-white hover:bg-teal-500' : undefined}
        />

        <div className="my-3 h-px bg-slate-100" />

        {!collapsed ? (
          <div className="flex items-center gap-1.5 px-1 pb-1">
            <Sparkles size={12} className="text-amber-500" />
            <span className="text-[10px] font-semibold tracking-[0.08em] text-amber-500">实验功能</span>
          </div>
        ) : (
          <div className="flex justify-center py-1">
            <Sparkles size={14} className="text-amber-500" />
          </div>
        )}

        <SidebarItem icon={Upload} label="导入标书" onClick={() => bidFileInputRef.current?.click()} disabled={isProcessing} hint="最大 50MB" />
        <SidebarItem
          icon={BookOpen}
          label="标书转写"
          onClick={onBidFormat}
          disabled={isProcessing || !hasContent}
          accent={hasContent ? 'bg-amber-600 text-white hover:bg-amber-500' : undefined}
        />
        <SidebarItem
          icon={FileDown}
          label="导出标书 DOCX"
          onClick={onExportDocx}
          disabled={isProcessing || !hasContent}
          hint="把转写结果导出为 Word"
        />
        {!collapsed && (
          <div className="mt-1 rounded-lg bg-amber-50 px-2 py-1.5 text-[10px] leading-relaxed text-amber-600">
            标书模式会使用更大的分段处理，请务必人工复核输出结果。
          </div>
        )}
      </div>

      <div className="space-y-1 border-t border-slate-100 px-3 py-3">
        <SidebarItem icon={RotateCcw} label="重新配置" onClick={onReconfigure} />
        <SidebarItem icon={Trash2} label="清空配置" onClick={onClearConfig} />
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center rounded-lg py-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
