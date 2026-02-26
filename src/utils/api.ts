// Modulo de conexion con APIs de IA (Gemini, Groq, OpenAI, etc.)
// TODO: la lista de modelos de Gemini crece rapido, habria que moverla a un archivo de config separado
// conexion con APIs de IA
import type { AIProvider, AIProviderConfig, AISettings, FileAttachment } from '../types';
import { getEnhancedSystemPrompt, getOptimalParameters } from './prompts';

const SETTINGS_KEY = 'vortex-ai-settings';

export const AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'groq',
    name: 'Groq',
    description: 'Modelos Llama y Mixtral. Gratuito.',
    baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    free: true,
    apiKeyUrl: 'https://console.groq.com/keys',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', description: 'Razonamiento avanzado' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B', description: 'Rapido' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', description: 'Buen balance' },
      { id: 'gemma2-9b-it', name: 'Gemma 2 9B', description: 'Compacto' },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4o y GPT-4. De pago.',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    free: false,
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', description: 'Multimodal' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', description: 'Rapido y economico' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Contexto largo' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Economico' },
    ],
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    description: 'Modelos Gemini. Tiene tier gratuito.',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    free: true,
    apiKeyUrl: 'https://aistudio.google.com/apikey',
    models: [
      { id: 'gemini-2.5-pro-preview-06-05', name: 'Gemini 2.5 Pro Preview', description: 'Ultimo preview Pro' },
      { id: 'gemini-2.5-flash-preview-05-20', name: 'Gemini 2.5 Flash Preview', description: 'Preview Flash rapido' },
      { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash Preview (04-17)', description: 'Preview anterior' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', description: 'Estable, recomendado' },
      { id: 'gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash Lite', description: 'Version ligera' },
      { id: 'gemini-2.0-flash-001', name: 'Gemini 2.0 Flash 001', description: 'Version fija' },
      { id: 'gemini-2.0-flash-exp', name: 'Gemini 2.0 Flash Exp', description: 'Experimental' },
      { id: 'gemini-2.0-flash-thinking-exp', name: 'Gemini 2.0 Flash Thinking', description: 'Con razonamiento' },
      { id: 'gemini-2.0-pro-exp', name: 'Gemini 2.0 Pro Exp', description: 'Pro experimental' },
      { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', description: 'Contexto 2M tokens' },
      { id: 'gemini-1.5-pro-001', name: 'Gemini 1.5 Pro 001', description: 'Version fija' },
      { id: 'gemini-1.5-pro-002', name: 'Gemini 1.5 Pro 002', description: 'Version mejorada' },
      { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', description: 'Rapido' },
      { id: 'gemini-1.5-flash-001', name: 'Gemini 1.5 Flash 001', description: 'Version fija' },
      { id: 'gemini-1.5-flash-002', name: 'Gemini 1.5 Flash 002', description: 'Version mejorada' },
      { id: 'gemini-1.5-flash-8b', name: 'Gemini 1.5 Flash 8B', description: 'Compacto' },
      { id: 'gemini-1.5-flash-8b-001', name: 'Gemini 1.5 Flash 8B 001', description: 'Version fija 8B' },
      { id: 'gemini-1.0-pro', name: 'Gemini 1.0 Pro', description: 'Original estable' },
      { id: 'gemini-1.0-pro-001', name: 'Gemini 1.0 Pro 001', description: 'Version fija' },
      { id: 'gemini-1.0-pro-002', name: 'Gemini 1.0 Pro 002', description: 'Version mejorada' },
      { id: 'gemini-embedding-exp', name: 'Gemini Embedding', description: 'Embeddings' },
      { id: 'gemma-3-27b-it', name: 'Gemma 3 27B', description: 'Modelo abierto' },
      { id: 'gemma-3-12b-it', name: 'Gemma 3 12B', description: 'Modelo abierto' },
      { id: 'gemma-3-4b-it', name: 'Gemma 3 4B', description: 'Compacto' },
      { id: 'gemma-3-1b-it', name: 'Gemma 3 1B', description: 'Ultra ligero' },
      { id: 'gemma-3n-e4b-it', name: 'Gemma 3n E4B', description: 'Para edge/mobile' },
      { id: 'gemma-2-27b-it', name: 'Gemma 2 27B', description: 'Modelo abierto' },
      { id: 'gemma-2-9b-it', name: 'Gemma 2 9B', description: 'Buen balance' },
      { id: 'gemma-2-2b-it', name: 'Gemma 2 2B', description: 'Ultra ligero' },
      { id: 'learnlm-2.0-flash-experimental', name: 'LearnLM 2.0', description: 'Educativo' },
    ],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    description: 'Bueno en programacion. Economico.',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    free: false,
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', description: 'Chat general' },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', description: 'Razonamiento' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    description: 'Acceso a muchos modelos con una API key.',
    baseUrl: 'https://openrouter.ai/api/v1/chat/completions',
    free: false,
    apiKeyUrl: 'https://openrouter.ai/keys',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (Free)', description: 'Gratuito' },
      { id: 'google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', description: 'Gratuito' },
      { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', description: 'De pago' },
      { id: 'openai/gpt-4o', name: 'GPT-4o via Router', description: 'De pago' },
    ],
  },
  {
    id: 'offline',
    name: 'Offline',
    description: 'Respuestas locales, sin API.',
    baseUrl: '',
    free: true,
    apiKeyUrl: '',
    models: [
      { id: 'built-in', name: 'Local', description: 'Respuestas pre-definidas' },
    ],
  },
];

export const DEFAULT_SYSTEM_PROMPT = 'VORTEX_DYNAMIC';

export function getDefaultSettings(): AISettings {
  return {
    provider: 'gemini',
    apiKey: 'AIzaSyDTQQmXpVmUuDFvi4VFI6ds48XyjYZMTlU',
    model: 'gemini-2.0-flash',
    temperature: 0.7,
    maxTokens: 4096,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  };
}

export function loadSettings(): AISettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      const defaults = getDefaultSettings();
      saveSettings(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw);
    if (parsed.provider === 'offline' && (!parsed.apiKey || parsed.apiKey === '')) {
      const defaults = getDefaultSettings();
      saveSettings(defaults);
      return defaults;
    }
    return { ...getDefaultSettings(), ...parsed };
  } catch {
    return getDefaultSettings();
  }
}

export function saveSettings(s: AISettings): void {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* */ }
}

export function getProviderConfig(id: AIProvider): AIProviderConfig {
  return AI_PROVIDERS.find((p) => p.id === id) || AI_PROVIDERS[AI_PROVIDERS.length - 1];
}

// auto-detectar modelos disponibles en gemini
export interface DetectedModel {
  id: string;
  name: string;
  description: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

export async function fetchAvailableGeminiModels(apiKey: string): Promise<DetectedModel[]> {
  if (!apiKey.trim()) throw new Error('API Key vacia');

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  if (!res.ok) {
    const body = await res.text();
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(body).error?.message || msg; } catch { /* */ }
    throw new Error(msg);
  }

  const data = await res.json();
  if (!data.models || !Array.isArray(data.models)) throw new Error('Respuesta invalida');

  const chatModels = data.models.filter((m: { supportedGenerationMethods?: string[] }) =>
    (m.supportedGenerationMethods || []).includes('generateContent')
  );

  const mapped: DetectedModel[] = chatModels.map((m: {
    name: string; displayName?: string; description?: string;
    inputTokenLimit?: number; outputTokenLimit?: number;
  }) => ({
    id: m.name.replace('models/', ''),
    name: m.displayName || m.name.replace('models/', ''),
    description: m.description ? m.description.substring(0, 80) : `Input: ${(m.inputTokenLimit || 0).toLocaleString()} tokens`,
    inputTokenLimit: m.inputTokenLimit,
    outputTokenLimit: m.outputTokenLimit,
  }));

  mapped.sort((a, b) => {
    const score = (id: string) => {
      if (id.includes('2.5') && id.includes('pro')) return 100;
      if (id.includes('2.5') && id.includes('flash')) return 95;
      if (id.includes('2.0') && id.includes('flash')) return 90;
      if (id.includes('2.0') && id.includes('pro')) return 85;
      if (id.includes('1.5') && id.includes('pro')) return 70;
      if (id.includes('1.5') && id.includes('flash')) return 65;
      if (id.includes('gemini')) return 50;
      return 10;
    };
    return score(b.id) - score(a.id);
  });

  return mapped;
}

interface ChatMsg {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function buildMessages(
  systemPrompt: string, userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  attachments?: FileAttachment[],
): ChatMsg[] {
  const msgs: ChatMsg[] = [{ role: 'system', content: systemPrompt }];

  // ultimos 20 mensajes como contexto — mas de eso y la API cobra un ojo de la cara
  for (const m of history.slice(-20)) {
    msgs.push({ role: m.role, content: m.content });
  }

  let finalMsg = userMessage;
  if (attachments && attachments.length > 0) {
    const descs = attachments.map((a) => {
      let d = `[Archivo: ${a.name} (${a.type}, ${fmtSize(a.size)})]`;
      if (a.content) {
        const trunc = a.content.length > 3000 ? a.content.substring(0, 3000) + '\n...(truncado)' : a.content;
        d += `\nContenido:\n${trunc}`;
      }
      return d;
    }).join('\n\n');
    finalMsg = descs + (userMessage ? `\n\nMensaje: ${userMessage}` : '\n\nEl usuario subió estos archivos. Analízalos.');
  }

  msgs.push({ role: 'user', content: finalMsg });
  return msgs;
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

// llamada a APIs compatibles con OpenAI
async function callOpenAI(
  url: string, key: string, model: string,
  msgs: ChatMsg[], temp: number, maxTk: number, provider: AIProvider,
): Promise<string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  };
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'VORTEX';
  }

  const res = await fetch(url, {
    method: 'POST', headers,
    body: JSON.stringify({ model, messages: msgs, temperature: temp, max_tokens: maxTk, stream: false }),
  });

  if (!res.ok) {
    const body = await res.text();
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(body).error?.message || msg; } catch { /* */ }
    throw new Error(msg);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'Sin respuesta.';
}

// llamada a Gemini
async function callGemini(
  baseUrl: string, key: string, model: string,
  msgs: ChatMsg[], temp: number, maxTk: number,
): Promise<string> {
  const sysText = msgs.find(m => m.role === 'system')?.content || '';
  const contents = msgs.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(`${baseUrl}/models/${model}:generateContent?key=${key}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: sysText }] },
      contents,
      generationConfig: { temperature: temp, maxOutputTokens: maxTk, topP: 0.9, topK: 50 },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    let msg = `HTTP ${res.status}`;
    try { msg = JSON.parse(body).error?.message || msg; } catch { /* */ }
    throw new Error(msg);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sin respuesta.';
}

// enviar mensaje al proveedor seleccionado
export async function sendToAI(
  settings: AISettings, userMessage: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  attachments?: FileAttachment[],
): Promise<string> {
  if (settings.provider === 'offline') throw new Error('OFFLINE_MODE');
  if (!settings.apiKey.trim()) throw new Error('NO_API_KEY');

  const provider = getProviderConfig(settings.provider);

  const ctx = history.map(m => m.content).join(' ');
  const prompt = getEnhancedSystemPrompt(userMessage, ctx);
  const params = getOptimalParameters(userMessage);

  // si hay prompt custom, usarlo
  const isCustom = settings.systemPrompt && settings.systemPrompt !== DEFAULT_SYSTEM_PROMPT
    && settings.systemPrompt !== 'VORTEX_DYNAMIC' && settings.systemPrompt.length > 50;
  const finalPrompt = isCustom ? settings.systemPrompt : prompt;

  const temp = settings.temperature !== 0.7 ? settings.temperature : params.temperature;
  const tokens = settings.maxTokens !== 4096 ? settings.maxTokens : params.maxTokens;

  const msgs = buildMessages(finalPrompt, userMessage, history, attachments);
  // console.log('[sendToAI] proveedor:', settings.provider, '| modelo:', settings.model, '| tokens max:', tokens);

  if (settings.provider === 'gemini') {
    return callGemini(provider.baseUrl, settings.apiKey, settings.model, msgs, temp, tokens);
  }
  return callOpenAI(provider.baseUrl, settings.apiKey, settings.model, msgs, temp, tokens, settings.provider);
}

// probar conexion
export async function testConnection(settings: AISettings): Promise<{ ok: boolean; message: string; latency?: number }> {
  if (settings.provider === 'offline') return { ok: true, message: 'Modo offline activo.' };
  if (!settings.apiKey.trim()) return { ok: false, message: 'API Key vacia.' };

  const start = performance.now();
  try {
    const resp = await sendToAI({ ...settings, maxTokens: 50 }, 'Responde solo: "Conexión OK."', []);
    return { ok: true, message: resp.substring(0, 100), latency: Math.round(performance.now() - start) };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : 'Error desconocido' };
  }
}
