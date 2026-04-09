import type { LocalAIConfig } from '../types';

const CONFIG_KEY = 'docugen_local_config';

const normalizeBaseUrl = (value: string) => value.trim().replace(/\/+$/, '');

export const getConfig = (): LocalAIConfig | null => {
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<LocalAIConfig>;
    if (!parsed.apiBaseUrl || !parsed.model) return null;
    return {
      apiBaseUrl: normalizeBaseUrl(parsed.apiBaseUrl),
      apiKey: parsed.apiKey?.trim() || '',
      model: parsed.model,
      bidModel: parsed.bidModel?.trim() || undefined,
    };
  } catch {
    return null;
  }
};

export const saveConfig = (config: LocalAIConfig) => {
  const normalized: LocalAIConfig = {
    apiBaseUrl: normalizeBaseUrl(config.apiBaseUrl),
    apiKey: config.apiKey.trim(),
    model: config.model.trim(),
    bidModel: config.bidModel?.trim() || undefined,
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(normalized));
};

export const clearConfig = () => {
  localStorage.removeItem(CONFIG_KEY);
};

export const hasConfig = () => !!getConfig();

export const apiFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const headers = new Headers(options.headers || {});
  return fetch(url, { ...options, headers });
};
