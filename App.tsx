import React, { useEffect, useState } from 'react';
import saveAs from 'file-saver';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import LoginPage from './components/LoginPage';
import { detectAvailableModels, getActiveModel, setGlobalModel } from './services/aiService';
import { apiFetch, clearConfig, getConfig, hasConfig } from './services/authService';
import { exportDocx, exportXlsx } from './services/docGenerator';
import type { DocFont, ModelInfo, ProcessingState } from './types';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BID_MAX_FILE_SIZE = 50 * 1024 * 1024;
const PDF_EXTENSIONS = ['.pdf'];
const BINARY_EXTENSIONS = ['.docx', '.doc', '.xlsx', '.xls', '.pdf', '.png', '.jpg', '.jpeg', '.bmp', '.webp', '.tif', '.tiff'];

const DEFAULT_MARKDOWN = `# 项目季度报告

## 1. 概述
本工具用于把原始内容整理成结构清晰的 Markdown 文档，并进一步导出为 Word 或 Excel。

## 2. 支持的输入
| 类型 | 示例 | 备注 |
| :--- | :--- | :--- |
| 纯文本 | 会议纪要、聊天记录 | 可直接粘贴 |
| Markdown | 方案、文档草稿 | 保留原始结构 |
| 文件导入 | DOCX / XLSX / PDF / 图片 | 自动提取文本 |

## 3. 推荐流程
1. 导入原始内容
2. 如果是 PDF，可先下载中间 Word
3. 继续在页面中整理格式
4. 导出最终 Word 或 Excel
`;

const buildImportStatus = (data: any, prefix: string) => {
  const extra = data?.meta?.summary ? `，${data.meta.summary}` : '';
  return `${prefix}${data.filename}，共 ${data.chars} 字符${extra}`;
};

const isPdfFile = (file: File | null) => Boolean(file && PDF_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext)));

const parseFilenameFromDisposition = (disposition: string | null, fallbackName: string) => {
  if (!disposition) return fallbackName;

  const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return fallbackName;
    }
  }

  const plainMatch = disposition.match(/filename=([^;]+)/i);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim().replace(/^"|"$/g, '');
  }
  return fallbackName;
};

const App: React.FC = () => {
  const [configured, setConfigured] = useState(hasConfig());
  const [markdown, setMarkdown] = useState(DEFAULT_MARKDOWN);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    statusMessage: '',
  });
  const [activeModel, setActiveModelState] = useState('等待配置');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [docFont, setDocFont] = useState<DocFont>('Microsoft YaHei');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastImportedFile, setLastImportedFile] = useState<File | null>(null);
  const [hasDirectExportedPdf, setHasDirectExportedPdf] = useState(false);

  const currentConfig = getConfig();
  const hasImportedPdf = isPdfFile(lastImportedFile);

  const loadModels = async () => {
    const config = getConfig();
    if (!config) return;

    setProcessingState({ isProcessing: true, statusMessage: '正在探测模型列表...' });
    try {
      const models = await detectAvailableModels();
      setAvailableModels(models);
      setActiveModelState(getActiveModel() || config.model);
      setProcessingState({ isProcessing: false, statusMessage: '模型已就绪' });
    } catch (error: any) {
      const fallbackModel = config.model || '';
      setAvailableModels(fallbackModel ? [{ id: fallbackModel, name: fallbackModel }] : []);
      setActiveModelState(fallbackModel || '模型探测失败');
      setProcessingState({
        isProcessing: false,
        statusMessage: '已加载本地配置',
        error: error?.message || '模型探测失败，已切换为手动模型模式。',
      });
    }
  };

  useEffect(() => {
    if (!configured) return;
    void loadModels();
  }, [configured]);

  const handleConfigured = () => {
    setConfigured(hasConfig());
  };

  const handleReconfigure = () => {
    setConfigured(false);
    setProcessingState({ isProcessing: false, statusMessage: '', error: undefined });
  };

  const handleClearConfig = () => {
    clearConfig();
    setConfigured(false);
    setAvailableModels([]);
    setActiveModelState('等待配置');
    setProcessingState({ isProcessing: false, statusMessage: '', error: undefined });
  };

  const handleModelChange = (modelId: string) => {
    setGlobalModel(modelId);
    setActiveModelState(modelId);
  };

  const runChunkProcess = async (
    mode: 'format' | 'table' | 'bid',
    startMessage: string,
    finishMessage: string,
  ) => {
    const config = getConfig();
    if (!config) {
      setConfigured(false);
      return;
    }

    setProcessingState({ isProcessing: true, statusMessage: startMessage });
    try {
      const response = await apiFetch('/api/ai/chunk-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: markdown, mode, model: activeModel, config }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `${finishMessage}失败`);
      }

      setMarkdown(data.text);
      const suffix = data.chunks_processed > 1 ? `，共分 ${data.chunks_processed} 段处理` : '';
      const warning = mode === 'bid' ? '标书模式属于实验功能，请务必人工复核输出结果。' : undefined;
      setProcessingState({
        isProcessing: false,
        statusMessage: `${finishMessage}${suffix}`,
        error: warning,
      });
    } catch (error: any) {
      setProcessingState({
        isProcessing: false,
        statusMessage: `${finishMessage}失败`,
        error: error?.message || 'AI 调用失败',
      });
    }
  };

  const applyImportedResult = (file: File, data: any, prefix: string) => {
    setMarkdown(data.text);
    setLastImportedFile(isPdfFile(file) ? file : null);
    setHasDirectExportedPdf(false);
    setProcessingState({
      isProcessing: false,
      statusMessage: buildImportStatus(data, prefix),
    });
  };

  const handleAutoFormat = async () => {
    await runChunkProcess('format', '正在调用 AI 格式化...', '格式化完成');
  };

  const handleSmartTable = async () => {
    await runChunkProcess('table', '正在整理智能表格...', '智能表格完成');
  };

  const handleBidFormat = async () => {
    if (!markdown.trim()) {
      setProcessingState({ isProcessing: false, statusMessage: '', error: '请先导入标书文件或粘贴标书内容。' });
      return;
    }
    await runChunkProcess('bid', '正在执行标书转写...', '标书转写完成');
  };

  const handleImportBidFile = async (file: File) => {
    const config = getConfig();
    if (!config) {
      setConfigured(false);
      return;
    }
    if (file.size > BID_MAX_FILE_SIZE) {
      setProcessingState({ isProcessing: false, statusMessage: '', error: '标书文件不能超过 50MB。' });
      return;
    }

    setProcessingState({ isProcessing: true, statusMessage: '正在上传标书文件...' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config));

    try {
      const response = await apiFetch('/api/upload?bid=true', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '标书上传失败');
      }
      applyImportedResult(file, data, '已导入标书 ');
    } catch (error: any) {
      setProcessingState({
        isProcessing: false,
        statusMessage: '标书导入失败',
        error: error?.message || '上传错误',
      });
    }
  };

  const handleImportFile = async (file: File) => {
    const config = getConfig();
    if (!config) {
      setConfigured(false);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setProcessingState({ isProcessing: false, statusMessage: '', error: '普通文档暂不支持超过 10MB 的文件。' });
      return;
    }

    const isBinary = BINARY_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isBinary && file.size < 100_000) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setMarkdown(text);
        setLastImportedFile(null);
        setHasDirectExportedPdf(false);
        setProcessingState({ isProcessing: false, statusMessage: `已导入 ${file.name}` });
      };
      reader.readAsText(file);
      return;
    }

    setProcessingState({ isProcessing: true, statusMessage: '正在上传文件...' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config));

    try {
      const response = await apiFetch('/api/upload', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '文件导入失败');
      }
      applyImportedResult(file, data, '已导入 ');
    } catch (error: any) {
      setProcessingState({
        isProcessing: false,
        statusMessage: '文件导入失败',
        error: error?.message || '上传错误',
      });
    }
  };

  const handleExportDocx = async () => {
    try {
      await exportDocx(markdown, docFont);
      setProcessingState({ isProcessing: false, statusMessage: 'DOCX 已导出' });
    } catch (error) {
      console.error(error);
      setProcessingState({ isProcessing: false, statusMessage: '导出失败', error: 'DOCX 生成失败' });
    }
  };

  const handleExportXlsx = async () => {
    setProcessingState({ isProcessing: true, statusMessage: '正在准备 Excel...' });
    try {
      await exportXlsx(markdown);
      setProcessingState({ isProcessing: false, statusMessage: 'Excel 已导出' });
    } catch (error) {
      console.error(error);
      setProcessingState({ isProcessing: false, statusMessage: '导出失败', error: 'Excel 生成失败' });
    }
  };

  const handleDirectExportPdfDocx = async () => {
    if (!lastImportedFile || !isPdfFile(lastImportedFile)) {
      setProcessingState({ isProcessing: false, statusMessage: '', error: '请先导入 PDF 文件。' });
      return;
    }

    setProcessingState({ isProcessing: true, statusMessage: '正在按原始 PDF 直出 Word...' });
    const formData = new FormData();
    formData.append('file', lastImportedFile);

    try {
      const response = await apiFetch('/api/export/pdf-docx', { method: 'POST', body: formData });
      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'PDF 直出失败' }));
        throw new Error(data.error || 'PDF 直出失败');
      }

      const blob = await response.blob();
      const fallbackName = `${lastImportedFile.name.replace(/\.pdf$/i, '') || 'document'}.docx`;
      const filename = parseFilenameFromDisposition(response.headers.get('Content-Disposition'), fallbackName);
      saveAs(blob, filename);
      setHasDirectExportedPdf(true);
      setProcessingState({ isProcessing: false, statusMessage: '中间 Word 已下载，可继续调整当前页面内容并导出最终文档' });
    } catch (error: any) {
      setProcessingState({
        isProcessing: false,
        statusMessage: 'PDF 直出失败',
        error: error?.message || 'PDF 转 Word 失败',
      });
    }
  };

  const charCount = markdown.length;

  if (!configured) {
    return <LoginPage onLoginSuccess={handleConfigured} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-100">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        onAutoFormat={handleAutoFormat}
        onSmartTable={handleSmartTable}
        onBidFormat={handleBidFormat}
        onImportFile={handleImportFile}
        onImportBidFile={handleImportBidFile}
        onExportDocx={handleExportDocx}
        onExportXlsx={handleExportXlsx}
        onDirectExportPdfDocx={handleDirectExportPdfDocx}
        canDirectExportPdf={hasImportedPdf}
        hasDirectExportedPdf={hasDirectExportedPdf}
        processingState={processingState}
        onReconfigure={handleReconfigure}
        onClearConfig={handleClearConfig}
        activeModel={activeModel}
        availableModels={availableModels}
        onModelChange={handleModelChange}
        docFont={docFont}
        onFontChange={setDocFont}
        hasContent={markdown.trim().length > 0}
        providerName="OpenAI 兼容接口"
        apiBaseUrl={currentConfig?.apiBaseUrl || ''}
      />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-14 items-center justify-between border-b border-slate-200/50 bg-white/60 px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {processingState.isProcessing && (
              <div className="flex items-center gap-2 text-brand-600">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
                <span className="text-sm font-medium">{processingState.statusMessage}</span>
              </div>
            )}

            {!processingState.isProcessing && processingState.statusMessage && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-medium text-brand-600">
                {processingState.statusMessage}
              </span>
            )}

            {processingState.error && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-sm text-red-500">
                {processingState.error}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`rounded-full px-2 py-0.5 ${charCount > 6000 ? 'bg-amber-50 font-medium text-amber-600' : 'bg-slate-50'}`}>
              {charCount.toLocaleString()} 字符
            </span>
            <span className="max-w-[320px] truncate rounded-full bg-slate-50 px-2 py-0.5 text-slate-500">
              OpenAI 兼容接口 / {activeModel || '未选择模型'}
            </span>
          </div>
        </div>

        <div className="flex flex-1 gap-4 overflow-hidden p-4">
          <div className="min-w-0 flex-1">
            <Editor value={markdown} onChange={setMarkdown} charCount={charCount} />
          </div>
          <div className="min-w-0 flex-1">
            <Preview markdown={markdown} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
