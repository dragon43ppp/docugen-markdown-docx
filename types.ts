export interface ProcessingState {
  isProcessing: boolean;
  statusMessage: string;
  error?: string;
}

export interface DocumentSection {
  type: 'header' | 'paragraph' | 'list' | 'table' | 'code';
  content: string | string[][] | string[];
  level?: number;
}

export interface HistoryItem {
  id: string;
  title: string;
  created_at: string;
  char_count: number;
}

export interface ModelInfo {
  id: string;
  name: string;
}

export type DocFont = '微软雅黑' | '仿宋_GB2312' | '宋体';

export const DOC_FONTS: { id: DocFont; name: string; note?: string }[] = [
  { id: '微软雅黑', name: '微软雅黑' },
  { id: '仿宋_GB2312', name: '仿宋 GB2312', note: '公文推荐字体，如未安装请下载' },
  { id: '宋体', name: '宋体' },
];

export interface LocalAIConfig {
  apiBaseUrl: string;
  apiKey?: string;
  model: string;
  bidModel?: string;
}
