/**
 * AI 服务 — 通过本地后端代理调用，兼容 OpenAI 风格接口
 */

import { apiFetch, getConfig } from './authService';
import type { LocalAIConfig, ModelInfo } from '../types';

let currentModel = '';

const getRequiredConfig = (): LocalAIConfig => {
  const config = getConfig();
  if (!config) {
    throw new Error('请先完成模型配置');
  }
  return config;
};

export const detectAvailableModels = async (): Promise<ModelInfo[]> => {
  const config = getRequiredConfig();
  const resp = await apiFetch('/api/models', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || '模型检测失败');
  }

  const data = await resp.json();
  currentModel = data.default || config.model;

  const models = Array.isArray(data.models) ? data.models : [];
  if (models.length > 0) return models;

  return [{ id: config.model, name: config.model }];
};

export const setGlobalModel = (modelId: string) => {
  currentModel = modelId;
};

export const getActiveModel = () => currentModel || getConfig()?.model || '';

const generateContent = async (prompt: string): Promise<string> => {
  const config = getRequiredConfig();
  const resp = await apiFetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model: currentModel || config.model, config }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || `AI 请求失败: ${resp.status}`);
  }

  const data = await resp.json();
  return data.text || '';
};

export const standardizeMarkdown = async (markdown: string, _template: string): Promise<string> => {
  const prompt = `你是一名专业的文档格式化专家。请将以下输入内容转换为结构清晰、格式规范的 Markdown 文档。

重要规则：
1. **绝对不要修改原始文本内容**，只调整格式和结构。不要删减、改写或添加任何内容。
2. 输入可能是 Markdown、纯文本、微信聊天记录、零散笔记、会议记录等任意格式，你需要自动识别并整理。
3. 确保标题层级正确（#, ##, ###）。
4. 表格数据用 Markdown 表格格式化（|）。
5. 列表项用 - 或 1. 格式化。
6. 保留所有原始信息，一个字都不能丢。
7. 只返回 Markdown 内容，不要加任何解释说明或 \`\`\` 代码块包裹。

输入内容：
${markdown}`;

  return generateContent(prompt);
};

export const smartConvertToTable = async (text: string): Promise<string> => {
  const prompt = `你是一名专业的文档格式化专家。分析以下文本，将其中适合表格化的数据转换为 Markdown 表格。

重要规则：
1. **绝对不要修改原始文本内容**，只调整格式。
2. 非表格的叙述性文本保持原样，放在表格外面。
3. 表格格式要求：
   - 使用合理的列标题
   - 单元格内多行内容用 "<br>" 表示换行
   - 列表项用 "•" 符号
   - 不丢失任何信息
4. 返回完整的 Markdown 文档（文本 + 表格）。
5. 只返回 Markdown 内容，不要加任何解释说明。

输入文本：
${text}`;

  return generateContent(prompt);
};
