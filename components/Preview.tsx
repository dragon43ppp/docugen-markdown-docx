import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface PreviewProps {
  markdown: string;
}

const TextWithBreaks = ({ children }: { children?: React.ReactNode }) => {
  if (typeof children !== 'string') return <>{children}</>;
  const parts = children.split(/<br\s*\/?>/gi);
  return (
    <>
      {parts.map((part, index) => (
        <React.Fragment key={index}>
          {part}
          {index < parts.length - 1 && <br />}
        </React.Fragment>
      ))}
    </>
  );
};

const Preview: React.FC<PreviewProps> = ({ markdown }) => {
  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-card border border-slate-200/60 overflow-hidden">
      {/* 标题栏 */}
      <div className="px-5 py-3 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-semibold text-slate-700">文档预览</span>
        </div>
        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">只读</span>
      </div>

      {/* 预览区 */}
      <div className="flex-1 overflow-y-auto p-6 prose prose-slate max-w-none prose-headings:font-semibold prose-a:text-brand-600 prose-img:rounded-xl">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({node, ...props}) => <h1 className="text-2xl border-b border-slate-100 pb-2 mb-5 text-slate-900 font-sans" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl mt-7 mb-3 text-slate-800 font-sans" {...props} />,
            table: ({node, ...props}) => <div className="overflow-x-auto my-5 rounded-xl border border-slate-200"><table className="min-w-full border-collapse" {...props} /></div>,
            th: ({node, children, ...props}) => (
              <th className="border-b border-slate-200 bg-slate-50/80 px-4 py-2.5 text-left font-semibold text-slate-600 font-sans text-sm" {...props}>
                <TextWithBreaks>{children}</TextWithBreaks>
              </th>
            ),
            td: ({node, children, ...props}) => (
              <td className="border-b border-slate-100 px-4 py-2.5 text-slate-600 font-sans text-sm" {...props}>
                <TextWithBreaks>{children}</TextWithBreaks>
              </td>
            ),
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-brand-400 bg-brand-50/30 pl-4 py-2 italic text-slate-600 my-4 rounded-r-lg" {...props} />,
          }}
        >
          {markdown || "*在左侧输入内容后，预览将在此显示...*"}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default Preview;
