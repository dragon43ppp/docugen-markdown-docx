import React, { useEffect, useMemo, useState } from 'react';
import { FileType, KeyRound, Link2, Wand2, Shield, CheckCircle2 } from 'lucide-react';
import { getConfig, saveConfig } from '../services/authService';
import type { LocalAIConfig } from '../types';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

const EMPTY_CONFIG: LocalAIConfig = {
  apiBaseUrl: '',
  apiKey: '',
  model: '',
  bidModel: '',
};

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [form, setForm] = useState<LocalAIConfig>(EMPTY_CONFIG);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const config = getConfig();
    if (config) {
      setForm({
        apiBaseUrl: config.apiBaseUrl,
        apiKey: config.apiKey,
        model: config.model,
        bidModel: config.bidModel || '',
      });
    }
  }, []);

  const canSubmit = useMemo(() => {
    return form.apiBaseUrl.trim() && form.model.trim();
  }, [form]);

  const updateField = (key: keyof LocalAIConfig, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('请填写 API Base URL 和默认模型');
      return;
    }

    setLoading(true);
    try {
      saveConfig({
        apiBaseUrl: form.apiBaseUrl,
        apiKey: form.apiKey,
        model: form.model,
        bidModel: form.bidModel || undefined,
      });
      onLoginSuccess();
    } catch {
      setError('保存配置失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-brand-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-[560px]">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3.5 mb-3">
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-3.5 rounded-2xl text-white shadow-lg shadow-brand-500/20">
              <FileType size={28} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-slate-800 tracking-tight">DocuGen AI</h1>
              <p className="text-sm text-slate-500">开源本地版文档格式化工具</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 max-w-[480px] mx-auto leading-relaxed">
            首次使用请填写你自己的兼容 OpenAI 风格模型服务配置。配置会保存在当前浏览器本地，并在调用时发送给本地后端代理。
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-card border border-slate-200/60 p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.apiBaseUrl}
                onChange={(e) => updateField('apiBaseUrl', e.target.value)}
                placeholder="API Base URL，例如 https://api.openai.com/v1"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white outline-none text-sm"
              />
            </div>

            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => updateField('apiKey', e.target.value)}
                placeholder="API Key（可选）"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white outline-none text-sm font-mono"
              />
            </div>

            <div className="relative">
              <Wand2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.model}
                onChange={(e) => updateField('model', e.target.value)}
                placeholder="默认模型，例如 gpt-4o-mini / deepseek-chat"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white outline-none text-sm"
              />
            </div>

            <div className="relative">
              <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.bidModel || ''}
                onChange={(e) => updateField('bidModel', e.target.value)}
                placeholder="标书模式专用模型（可选）"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white outline-none text-sm"
              />
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600 space-y-2 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>程序会优先尝试从你填写的 Base URL 自动探测模型列表，失败时仍可使用手填模型名。</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>API Key 可选；如果你的本地代理或兼容网关不需要鉴权，可以留空。</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-emerald-600 flex-shrink-0" />
                <span>配置会保存在当前浏览器 localStorage，并在调用时发送给本地后端代理，本项目不会内置任何公司网关或默认密钥。</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 text-amber-600 flex-shrink-0" />
                <span>AI 可能产生幻觉或格式偏差，尤其是长文档和标书转写场景，请务必人工复核。</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-2.5 rounded-xl">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className={`w-full py-3 rounded-xl font-medium text-white text-sm transition-all ${
                loading || !canSubmit
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 shadow-sm shadow-brand-500/20 active:scale-[0.98]'
              }`}
            >
              {loading ? '保存中...' : '保存并开始使用'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
