import React from 'react';

interface EditorProps {
  value: string;
  onChange: (val: string) => void;
  charCount: number;
}

const Editor: React.FC<EditorProps> = ({ value, onChange, charCount }) => {
  const isLong = charCount > 6000;

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-card border border-slate-200/60 overflow-hidden">
      {/* 标题栏 */}
      <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-brand-500" />
          <span className="text-sm font-semibold text-slate-700">输入内容</span>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
          isLong ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
        }`}>
          {charCount.toLocaleString()} 字符
          {isLong && ' · 自动分段'}
        </span>
      </div>

      {/* 长文本提示 */}
      {isLong && (
        <div className="px-5 py-2 bg-amber-50/50 border-b border-amber-100 text-xs text-amber-600 flex items-center gap-1.5">
          <span className="inline-block w-1 h-1 rounded-full bg-amber-400" />
          内容较长，AI 格式化时会自动分段处理，确保不丢失内容
        </div>
      )}

      {/* 编辑区 */}
      <textarea
        className="flex-1 w-full p-5 resize-none focus:outline-none font-mono text-sm leading-relaxed text-slate-700 bg-transparent placeholder:text-slate-300"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={"在此输入或粘贴内容...\n\n支持：Markdown、纯文本、微信聊天记录、零散笔记、会议记录等\n也可以点击侧边栏「导入文件」上传"}
        spellCheck={false}
      />
    </div>
  );
};

export default Editor;
