import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';

const ContactAdmin: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="absolute bottom-16 right-0 w-72 bg-white border border-slate-200/60 rounded-2xl shadow-2xl p-5"
          style={{ animation: 'fadeUp 0.15s ease-out' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-slate-700">联系管理员</div>
            <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-slate-600 p-0.5">
              <X size={14} />
            </button>
          </div>
          <div className="text-sm text-slate-600 leading-relaxed">
            请通过<span className="font-semibold text-brand-600">纷享逍客</span>联系管理员<span className="font-semibold">李良龙</span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            如需解锁账号、获取 API Key 帮助等
          </div>
        </div>
      )}
      <button
        onClick={() => setOpen(!open)}
        className={`w-11 h-11 rounded-2xl shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
          open
            ? 'bg-slate-700 text-white'
            : 'bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-brand-500/30'
        }`}
        title="联系管理员"
      >
        {open ? <X size={18} /> : <MessageCircle size={18} />}
      </button>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ContactAdmin;
