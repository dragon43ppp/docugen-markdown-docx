import React, { useRef } from 'react';
import { FileDown, Wand2, FileSpreadsheet, FileType, Upload, Table, History } from 'lucide-react';
import { ProcessingState } from '../types';

interface ToolbarProps {
  onAutoFormat: () => void;
  onSmartTable: () => void;
  onImportFile: (file: File) => void;
  onExportDocx: () => void;
  onExportXlsx: () => void;
  onToggleHistory: () => void;
  processingState: ProcessingState;
}

const Toolbar: React.FC<ToolbarProps> = ({
  onAutoFormat,
  onSmartTable,
  onImportFile,
  onExportDocx,
  onExportXlsx,
  onToggleHistory,
  processingState
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    onImportFile(file);
    event.target.value = '';
  };

  return (
    <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center gap-3">
        <div className="bg-brand-600 p-2 rounded-lg text-white">
          <FileType size={20} />
        </div>
        <div>
           <h1 className="font-bold text-slate-800 text-lg leading-tight">DocuGen AI</h1>
           <p className="text-xs text-slate-500">智能文档格式化</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".txt,.md,.csv,.log,.json,.xml,.html"
          onChange={handleFileChange}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={processingState.isProcessing}
          className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-all"
          title="导入文件（支持 txt、md、csv 等）"
        >
          <Upload size={16} />
          <span className="font-medium hidden sm:inline">导入</span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        <button
          onClick={onSmartTable}
          disabled={processingState.isProcessing}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
            processingState.isProcessing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
          }`}
          title="AI 自动识别并转换为表格"
        >
          <Table size={16} />
          <span className="font-medium">智能表格</span>
        </button>

        <button
          onClick={onAutoFormat}
          disabled={processingState.isProcessing}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
            processingState.isProcessing
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200'
          }`}
          title="AI 格式化（支持 Markdown/纯文本/聊天记录/笔记）"
        >
          <Wand2 size={16} className={processingState.isProcessing ? "animate-spin" : ""} />
          <span className="font-medium">AI 格式化</span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        <button
          onClick={onExportDocx}
          disabled={processingState.isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700 transition-colors shadow-sm"
          title="导出为 Word 文档"
        >
          <FileDown size={16} />
          <span>导出 DOCX</span>
        </button>

        <button
          onClick={onExportXlsx}
          disabled={processingState.isProcessing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 transition-colors shadow-sm"
          title="导出为 Excel 表格"
        >
          <FileSpreadsheet size={16} />
          <span>导出 XLSX</span>
        </button>

        <div className="h-6 w-px bg-slate-200"></div>

        <button
          onClick={onToggleHistory}
          className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-brand-600 hover:bg-slate-100 rounded-md transition-all"
          title="历史文档"
        >
          <History size={16} />
          <span className="font-medium hidden sm:inline">历史</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
