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

export type DocFont = 'Microsoft YaHei' | 'FangSong_GB2312' | 'SimSun';

export const DOC_FONTS: { id: DocFont; name: string; note?: string }[] = [
  { id: 'Microsoft YaHei', name: '微软雅黑' },
  { id: 'FangSong_GB2312', name: '仿宋 GB2312', note: '公文常用字体，如未安装请先安装对应字体' },
  { id: 'SimSun', name: '宋体' },
];

export interface LocalAIConfig {
  apiBaseUrl: string;
  apiKey?: string;
  model: string;
  bidModel?: string;
}
