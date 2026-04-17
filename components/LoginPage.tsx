import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileType, KeyRound, Link2, Shield, Wand2 } from 'lucide-react';
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
    if (!config) return;

    setForm({
      apiBaseUrl: config.apiBaseUrl,
      apiKey: config.apiKey,
      model: config.model,
      bidModel: config.bidModel || '',
    });
  }, []);

  const canSubmit = useMemo(() => Boolean(form.apiBaseUrl.trim() && form.model.trim()), [form]);

  const updateField = (key: keyof LocalAIConfig, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (!canSubmit) {
      setError('请填写 API Base URL 和默认模型。');
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
      setError('保存配置失败，请稍后重试。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-brand-50/30 p-4">
      <div className="w-full max-w-[560px]">
        <div className="mb-10 text-center">
          <div className="mb-3 inline-flex items-center gap-3.5">
            <div className="rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 p-3.5 text-white shadow-lg shadow-brand-500/20">
              <FileType size={28} />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold tracking-tight text-slate-800">DocuGen Open</h1>
              <p className="text-sm text-slate-500">本地开源版文档整理工具</p>
            </div>
          </div>
          <p className="mx-auto max-w-[480px] text-sm leading-relaxed text-slate-500">
            首次使用时，请填写你自己的 OpenAI 兼容接口配置。配置只会保存在当前浏览器本地，并在调用时发送给本地后端代理。
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/60 bg-white p-8 shadow-card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Link2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.apiBaseUrl}
                onChange={(event) => updateField('apiBaseUrl', event.target.value)}
                placeholder="API Base URL，例如 https://api.openai.com/v1"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={form.apiKey}
                onChange={(event) => updateField('apiKey', event.target.value)}
                placeholder="API Key（可选）"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-mono outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="relative">
              <Wand2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.model}
                onChange={(event) => updateField('model', event.target.value)}
                placeholder="默认模型，例如 gpt-4o-mini / qwen-max / gemini-2.5-flash"
                required
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="relative">
              <Shield size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={form.bidModel || ''}
                onChange={(event) => updateField('bidModel', event.target.value)}
                placeholder="标书模式专用模型（可选）"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                <span>程序会优先尝试从你的 Base URL 自动探测模型列表；探测失败时，仍可继续使用手动填写的模型名。</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                <span>API Key 是可选项；如果你的本地代理或兼容网关不要求鉴权，可以留空。</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-emerald-600" />
                <span>配置只保存到当前浏览器 localStorage。本项目不内置任何公司网关、管理员账户或默认密钥。</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0 text-amber-600" />
                <span>PDF 转 Word 本身可以不依赖大模型；只有 AI 格式化、智能表格、标书转写这些步骤才会调用你自己的模型接口。</span>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !canSubmit}
              className={`w-full rounded-xl py-3 text-sm font-medium text-white transition-all ${
                loading || !canSubmit
                  ? 'cursor-not-allowed bg-slate-400'
                  : 'bg-gradient-to-r from-brand-600 to-brand-500 shadow-sm shadow-brand-500/20 hover:from-brand-700 hover:to-brand-600 active:scale-[0.98]'
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
