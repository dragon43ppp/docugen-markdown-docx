import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import Preview from './components/Preview';
import LoginPage from './components/LoginPage';
import { ProcessingState, ModelInfo, DocFont } from './types';
import { detectAvailableModels, getActiveModel, setGlobalModel } from './services/aiService';
import { exportDocx, exportXlsx } from './services/docGenerator';
import { clearConfig, getConfig, hasConfig, apiFetch } from './services/authService';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const BID_MAX_FILE_SIZE = 50 * 1024 * 1024;

const DEFAULT_MARKDOWN = `# 项目季度报告

## 1. 概述
本项目旨在优化内部文档处理流程，本季度已完成 **85%** 的里程碑目标。

## 2. 关键指标

| 指标 | 目标 | 实际 | 状态 |
| :--- | :--- | :--- | :--- |
| 可用性 | 99.9% | 99.95% | 超额完成 |
| 延迟 | < 200ms | 145ms | 超额完成 |
| 用户增长 | 10% | 12.5% | 超额完成 |

## 3. 下一步计划
- 完成 API 集成
- 进行用户验收测试
- 部署到生产环境

> 支持输入 Markdown、纯文本、微信聊天记录、零散笔记等任意格式`;

const App: React.FC = () => {
  const [configured, setConfigured] = useState(hasConfig());
  const [markdown, setMarkdown] = useState<string>(DEFAULT_MARKDOWN);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    statusMessage: '',
  });
  const [activeModel, setActiveModel] = useState<string>('等待配置');
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [docFont, setDocFont] = useState<DocFont>('微软雅黑');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const loadModels = async () => {
    if (!hasConfig()) return;
    setProcessingState({ isProcessing: true, statusMessage: '正在检测 AI 模型...' });
    try {
      const models = await detectAvailableModels();
      setAvailableModels(models);
      setActiveModel(getActiveModel() || getConfig()?.model || '');
      setProcessingState({ isProcessing: false, statusMessage: 'AI 就绪' });
    } catch (e: any) {
      const fallbackModel = getConfig()?.model || '';
      setAvailableModels(fallbackModel ? [{ id: fallbackModel, name: fallbackModel }] : []);
      setActiveModel(fallbackModel || '模型检测失败');
      setProcessingState({
        isProcessing: false,
        statusMessage: '已载入本地配置',
        error: e?.message || '模型检测失败，可直接使用手填模型',
      });
    }
  };

  useEffect(() => {
    if (!configured) return;
    loadModels();
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
    setActiveModel('等待配置');
    setProcessingState({ isProcessing: false, statusMessage: '', error: undefined });
  };

  const handleModelChange = (modelId: string) => {
    setGlobalModel(modelId);
    setActiveModel(modelId);
  };

  const handleAutoFormat = async () => {
    const config = getConfig();
    if (!config) {
      setConfigured(false);
      return;
    }
    setProcessingState({ isProcessing: true, statusMessage: '正在用 AI 格式化...' });
    try {
      const resp = await apiFetch('/api/ai/chunk-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: markdown, mode: 'format', model: activeModel, config }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || '格式化失败');
      const data = await resp.json();
      setMarkdown(data.text);
      const msg = data.chunks_processed > 1
        ? `格式化完成（${data.chunks_processed} 段分段处理）`
        : '格式化完成';
      setProcessingState({ isProcessing: false, statusMessage: msg });
    } catch (e: any) {
      setProcessingState({ isProcessing: false, statusMessage: '格式化出错', error: e.message || 'AI 错误' });
    }
  };

  const handleSmartTable = async () => {
    const config = getConfig();
    if (!config) {
      setConfigured(false);
      return;
    }
    setProcessingState({ isProcessing: true, statusMessage: '正在用 AI 生成表格...' });
    try {
      const resp = await apiFetch('/api/ai/chunk-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: markdown, mode: 'table', model: activeModel, config }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || '表格生成失败');
      const data = await resp.json();
      setMarkdown(data.text);
      setProcessingState({ isProcessing: false, statusMessage: '表格生成完成' });
    } catch (e: any) {
      setProcessingState({ isProcessing: false, statusMessage: '表格生成出错', error: e.message || 'AI 错误' });
    }
  };

  const handleBidFormat = async () => {
    const config = getConfig();
    if (!config) {
      setConfigured(false);
      return;
    }
    if (!markdown.trim()) {
      setProcessingState({ isProcessing: false, statusMessage: '', error: '请先导入标书文件或粘贴标书内容' });
      return;
    }
    setProcessingState({ isProcessing: true, statusMessage: '正在转写标书...' });
    try {
      const resp = await apiFetch('/api/ai/chunk-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: markdown, mode: 'bid', model: activeModel, config }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || '标书转写失败');
      const data = await resp.json();
      setMarkdown(data.text);
      const msg = data.chunks_processed > 1
        ? `标书转写完成（${data.chunks_processed} 段分段处理）`
        : '标书转写完成';
      setProcessingState({ isProcessing: false, statusMessage: msg, error: '实验功能，请人工校验转写结果' });
    } catch (e: any) {
      setProcessingState({ isProcessing: false, statusMessage: '标书转写出错', error: e.message || 'AI 错误' });
    }
  };

  const handleImportBidFile = async (file: File) => {
    const config = getConfig();
    if (!config) {
      setConfigured(false);
      return;
    }
    if (file.size > BID_MAX_FILE_SIZE) {
      setProcessingState({ isProcessing: false, statusMessage: '', error: '标书文件不能超过 50MB' });
      return;
    }
    setProcessingState({ isProcessing: true, statusMessage: '正在上传标书文件...' });
    const formData = new FormData();
    formData.append('file', file);
    formData.append('config', JSON.stringify(config));
    try {
      const resp = await apiFetch('/api/upload?bid=true', { method: 'POST', body: formData });
      if (resp.status === 413) {
        setProcessingState({ isProcessing: false, statusMessage: '', error: '标书文件超过大小限制' });
        return;
      }
      if (!resp.ok) throw new Error('上传失败');
      const data = await resp.json();
      setMarkdown(data.text);
      setProcessingState({ isProcessing: false, statusMessage: `已导入标书: ${data.filename}（${data.chars} 字符）` });
    } catch {
      setProcessingState({ isProcessing: false, statusMessage: '标书导入失败', error: '上传错误' });
    }
  };

  const handleImportFile = async (file: File) => {
    const config = getConfig();
    if (!config) {
      setConfigured(false);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setProcessingState({ isProcessing: false, statusMessage: '', error: '暂不支持大于 10MB 的普通文档上传' });
      return;
    }

    const binaryExts = ['.docx', '.doc', '.xlsx', '.xls', '.pdf'];
    const isBinary = binaryExts.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!isBinary && file.size < 100_000) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setMarkdown(text);
        setProcessingState({ isProcessing: false, statusMessage: `已导入: ${file.name}`, error: undefined });
      };
      reader.readAsText(file);
    } else {
      setProcessingState({ isProcessing: true, statusMessage: '正在上传文件...' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify(config));
      try {
        const resp = await apiFetch('/api/upload', { method: 'POST', body: formData });
        if (resp.status === 413) {
          setProcessingState({ isProcessing: false, statusMessage: '', error: '暂不支持大于 10MB 的普通文档上传' });
          return;
        }
        if (!resp.ok) throw new Error('上传失败');
        const data = await resp.json();
        setMarkdown(data.text);
        setProcessingState({ isProcessing: false, statusMessage: `已导入: ${data.filename}（${data.chars} 字符）` });
      } catch {
        setProcessingState({ isProcessing: false, statusMessage: '文件导入失败', error: '上传错误' });
      }
    }
  };

  const handleExportDocx = async () => {
    try {
      await exportDocx(markdown, docFont);
      setProcessingState({ isProcessing: false, statusMessage: 'DOCX 已导出' });
    } catch (e) {
      console.error(e);
      setProcessingState({ isProcessing: false, statusMessage: '导出出错', error: 'DOCX 生成失败' });
    }
  };

  const handleExportXlsx = async () => {
    setProcessingState({ isProcessing: true, statusMessage: '正在准备 Excel...' });
    try {
      await exportXlsx(markdown);
      setProcessingState({ isProcessing: false, statusMessage: 'Excel 已导出' });
    } catch (e) {
      console.error(e);
      setProcessingState({ isProcessing: false, statusMessage: '导出出错', error: '导出失败' });
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
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onAutoFormat={handleAutoFormat}
        onSmartTable={handleSmartTable}
        onBidFormat={handleBidFormat}
        onImportFile={handleImportFile}
        onImportBidFile={handleImportBidFile}
        onExportDocx={handleExportDocx}
        onExportXlsx={handleExportXlsx}
        processingState={processingState}
        onReconfigure={handleReconfigure}
        onClearConfig={handleClearConfig}
        activeModel={activeModel}
        availableModels={availableModels}
        onModelChange={handleModelChange}
        docFont={docFont}
        onFontChange={setDocFont}
        hasContent={markdown.trim().length > 0}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="h-14 flex items-center justify-between px-6 bg-white/60 backdrop-blur-sm border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            {processingState.isProcessing && (
              <div className="flex items-center gap-2 text-brand-600">
                <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-medium">{processingState.statusMessage}</span>
              </div>
            )}
            {!processingState.isProcessing && processingState.statusMessage && (
              <span className="text-sm text-brand-600 font-medium bg-brand-50 px-3 py-1 rounded-full">{processingState.statusMessage}</span>
            )}
            {processingState.error && (
              <span className="text-sm text-red-500 bg-red-50 px-3 py-1 rounded-full">{processingState.error}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`px-2 py-0.5 rounded-full ${charCount > 6000 ? 'bg-amber-50 text-amber-600 font-medium' : 'bg-slate-50'}`}>
              {charCount.toLocaleString()} 字符
            </span>
            <span className="px-2 py-0.5 rounded-full bg-slate-50 text-slate-500 truncate max-w-[220px]">
              {activeModel || '未选择模型'}
            </span>
          </div>
        </div>

        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          <div className="flex-1 min-w-0">
            <Editor value={markdown} onChange={setMarkdown} charCount={charCount} />
          </div>
          <div className="flex-1 min-w-0">
            <Preview markdown={markdown} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
