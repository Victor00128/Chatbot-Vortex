import { useState, useCallback, useEffect } from 'react';
import {
  X, Zap, Key, Cpu, Thermometer, MessageSquare,
  ExternalLink, CheckCircle2, XCircle, Loader2,
  ChevronDown, RotateCcw, Shield, Globe, Search, AlertTriangle,
} from 'lucide-react';
import type { AISettings, AIProvider } from '../types';
import {
  AI_PROVIDERS, DEFAULT_SYSTEM_PROMPT,
  getProviderConfig, testConnection,
  fetchAvailableGeminiModels,
} from '../utils/api';
import type { DetectedModel } from '../utils/api';

interface SettingsModalProps {
  settings: AISettings;
  onSave: (settings: AISettings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [local, setLocal] = useState<AISettings>({ ...settings });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string; latency?: number } | null>(null);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Auto-detect models state
  const [detecting, setDetecting] = useState(false);
  const [detectedModels, setDetectedModels] = useState<DetectedModel[] | null>(null);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [autoDetected, setAutoDetected] = useState(false);

  const providerConfig = getProviderConfig(local.provider);

  // Close on ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Auto-detect models when Gemini is selected and there's an API key
  useEffect(() => {
    if (local.provider === 'gemini' && local.apiKey.trim() && !autoDetected) {
      handleDetectModels();
      setAutoDetected(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local.provider]);

  const updateField = useCallback(<K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setLocal((prev) => ({ ...prev, [key]: value }));
    setTestResult(null);
  }, []);

  const handleProviderChange = useCallback((provider: AIProvider) => {
    const config = getProviderConfig(provider);
    setLocal((prev) => ({
      ...prev,
      provider,
      model: config.models[0]?.id || '',
      apiKey: provider === 'offline' ? '' : prev.apiKey,
    }));
    setTestResult(null);
    setDetectedModels(null);
    setDetectError(null);
    setAutoDetected(false);
  }, []);

  const handleDetectModels = useCallback(async () => {
    if (!local.apiKey.trim()) {
      setDetectError('Ingresa tu API Key primero');
      return;
    }

    setDetecting(true);
    setDetectError(null);
    setDetectedModels(null);

    try {
      const models = await fetchAvailableGeminiModels(local.apiKey);
      if (models.length === 0) {
        setDetectError('No se encontraron modelos disponibles con esta API Key');
      } else {
        setDetectedModels(models);
        // Auto-select the best available model if current model is not in the list
        const currentModelExists = models.some((m) => m.id === local.model);
        if (!currentModelExists) {
          setLocal((prev) => ({ ...prev, model: models[0].id }));
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido';
      setDetectError(msg);
    } finally {
      setDetecting(false);
    }
  }, [local.apiKey, local.model]);

  const handleTest = useCallback(async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testConnection(local);
    setTestResult(result);
    setTesting(false);
  }, [local]);

  const handleSave = useCallback(() => {
    onSave(local);
    onClose();
  }, [local, onSave, onClose]);

  const handleResetPrompt = useCallback(() => {
    updateField('systemPrompt', DEFAULT_SYSTEM_PROMPT);
  }, [updateField]);

  // Models to show in dropdown: detected models (if available) or fallback to static list
  const modelsToShow = (local.provider === 'gemini' && detectedModels && detectedModels.length > 0)
    ? detectedModels.map((m) => ({ id: m.id, name: m.name, description: m.description }))
    : providerConfig.models;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-xl border border-[#00ff4122] bg-[#0a0e14] shadow-2xl shadow-[#00ff4110] scrollbar-vortex">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#00ff4118] bg-[#0a0e14]/95 backdrop-blur-xl px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#00cc33] to-[#009922]">
              <Cpu size={14} className="text-black" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#00ff41] tracking-wider">
                CONFIGURACIÓN IA
              </h2>
              <p className="text-[9px] font-mono text-[#00ff4144] tracking-wider">
                AJUSTES
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#00ff4155] hover:bg-[#00ff4115] hover:text-[#00ff41] transition-all"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-5">
          {/* ═══ PROVIDER SELECTION ═══ */}
          <section>
            <label className="flex items-center gap-2 mb-2.5 text-[10px] sm:text-xs font-bold text-[#00ff41aa] tracking-wider uppercase">
              <Globe size={12} />
              PROVEEDOR DE IA
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {AI_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProviderChange(p.id)}
                  className={`relative rounded-lg border p-2.5 text-left transition-all ${
                    local.provider === p.id
                      ? 'border-[#00ff4155] bg-[#00ff4115] shadow-[0_0_15px_#00ff4110]'
                      : 'border-[#00ff4118] bg-[#0d1117] hover:border-[#00ff4133] hover:bg-[#00ff4108]'
                  }`}
                >
                  {p.free && (
                    <span className="absolute -top-1.5 -right-1.5 rounded-full bg-[#00ff41] px-1.5 py-0.5 text-[7px] font-bold text-black tracking-wider">
                      FREE
                    </span>
                  )}
                  <span className={`block text-[10px] sm:text-xs font-bold ${
                    local.provider === p.id ? 'text-[#00ff41]' : 'text-[#888]'
                  }`}>
                    {p.name}
                  </span>
                  <span className="block text-[8px] text-[#555] mt-0.5 leading-tight line-clamp-2">
                    {p.description.split('.')[0]}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ═══ API KEY ═══ */}
          {local.provider !== 'offline' && (
            <section>
              <label className="flex items-center gap-2 mb-2 text-[10px] sm:text-xs font-bold text-[#00ff41aa] tracking-wider uppercase">
                <Key size={12} />
                API KEY
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={local.apiKey}
                  onChange={(e) => {
                    updateField('apiKey', e.target.value);
                    // Reset detected models when key changes
                    if (local.provider === 'gemini') {
                      setDetectedModels(null);
                      setDetectError(null);
                      setAutoDetected(false);
                    }
                  }}
                  placeholder={`Ingresa tu ${providerConfig.name} API Key...`}
                  className="w-full rounded-lg border border-[#00ff4118] bg-[#0d1117] px-3 py-2.5 pr-20 text-xs font-mono text-[#c0c0c0] outline-none placeholder:text-[#333] focus:border-[#00ff4144] focus:shadow-[0_0_15px_#00ff4110] transition-all"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="rounded px-2 py-1 text-[9px] font-mono text-[#00ff4155] hover:text-[#00ff41] hover:bg-[#00ff4115] transition-all"
                  >
                    {showApiKey ? 'OCULTAR' : 'VER'}
                  </button>
                </div>
              </div>
              {providerConfig.apiKeyUrl && (
                <a
                  href={providerConfig.apiKeyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 mt-1.5 text-[9px] sm:text-[10px] font-mono text-[#00d4ff55] hover:text-[#00d4ff] transition-colors"
                >
                  <ExternalLink size={9} />
                  Obtener API Key de {providerConfig.name}
                </a>
              )}
              <div className="mt-1.5 flex items-center gap-1.5 text-[9px] text-[#00ff4133]">
                <Shield size={9} />
                <span className="font-mono">Tu API Key se guarda solo en tu navegador (localStorage).</span>
              </div>
            </section>
          )}

          {/* ═══ MODEL SELECTION ═══ */}
          {local.provider !== 'offline' && (
            <section>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#00ff41aa] tracking-wider uppercase">
                  <Zap size={12} />
                  MODELO
                </label>

                {/* Auto-detect button for Gemini */}
                {local.provider === 'gemini' && (
                  <button
                    onClick={handleDetectModels}
                    disabled={detecting || !local.apiKey.trim()}
                    className="flex items-center gap-1.5 rounded-md border border-[#00d4ff33] bg-[#00d4ff08] px-2.5 py-1 text-[9px] font-bold text-[#00d4ff] tracking-wider transition-all hover:bg-[#00d4ff15] hover:shadow-[0_0_10px_#00d4ff15] disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {detecting ? (
                      <>
                        <Loader2 size={10} className="animate-spin" />
                        BUSCANDO...
                      </>
                    ) : (
                      <>
                        <Search size={10} />
                        DETECTAR MODELOS
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Detection status */}
              {local.provider === 'gemini' && detectError && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#ff904022] bg-[#ff904008] p-2 text-[9px] font-mono text-[#ff9040aa] animate-fade-in">
                  <AlertTriangle size={12} className="shrink-0" />
                  <span>{detectError}</span>
                </div>
              )}

              {local.provider === 'gemini' && detectedModels && detectedModels.length > 0 && (
                <div className="mb-2 flex items-center gap-2 rounded-lg border border-[#00ff4122] bg-[#00ff4108] p-2 text-[9px] font-mono text-[#00ff41aa] animate-fade-in">
                  <CheckCircle2 size={12} className="shrink-0" />
                  <span>
                    {detectedModels.length} modelos detectados desde la API de Google
                  </span>
                </div>
              )}

              {/* Model dropdown */}
              <div className="relative">
                <select
                  value={local.model}
                  onChange={(e) => updateField('model', e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[#00ff4118] bg-[#0d1117] px-3 py-2.5 pr-8 text-xs font-mono text-[#c0c0c0] outline-none focus:border-[#00ff4144] transition-all cursor-pointer"
                >
                  {modelsToShow.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {m.description}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#00ff4144] pointer-events-none" />
              </div>

              {/* Current selected model ID */}
              <p className="mt-1.5 text-[8px] font-mono text-[#00ff4133] tracking-wider break-all">
                MODEL_ID: {local.model}
              </p>
            </section>
          )}

          {/* ═══ TEMPERATURE ═══ */}
          <section>
            <label className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#00ff41aa] tracking-wider uppercase">
                <Thermometer size={12} />
                TEMPERATURA
              </span>
              <span className="text-xs font-mono text-[#00ff41]">{local.temperature.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={local.temperature}
              onChange={(e) => updateField('temperature', parseFloat(e.target.value))}
              className="w-full accent-[#00ff41] h-1.5 bg-[#0d1117] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ff41] [&::-webkit-slider-thumb]:shadow-[0_0_10px_#00ff4155]"
            />
            <div className="flex justify-between mt-1 text-[8px] font-mono text-[#333]">
              <span>Preciso</span>
              <span>Balanceado</span>
              <span>Creativo</span>
            </div>
          </section>

          {/* ═══ MAX TOKENS ═══ */}
          <section>
            <label className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#00ff41aa] tracking-wider uppercase">
                <MessageSquare size={12} />
                MAX TOKENS
              </span>
              <span className="text-xs font-mono text-[#00ff41]">{local.maxTokens.toLocaleString()}</span>
            </label>
            <input
              type="range"
              min="256"
              max="16384"
              step="256"
              value={local.maxTokens}
              onChange={(e) => updateField('maxTokens', parseInt(e.target.value))}
              className="w-full accent-[#00ff41] h-1.5 bg-[#0d1117] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#00ff41] [&::-webkit-slider-thumb]:shadow-[0_0_10px_#00ff4155]"
            />
            <div className="flex justify-between mt-1 text-[8px] font-mono text-[#333]">
              <span>256</span>
              <span>4096</span>
              <span>16384</span>
            </div>
          </section>

          {/* ═══ SYSTEM PROMPT ═══ */}
          <section>
            <button
              onClick={() => setShowSystemPrompt(!showSystemPrompt)}
              className="flex items-center justify-between w-full mb-2 group"
            >
              <span className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-[#00ff41aa] tracking-wider uppercase group-hover:text-[#00ff41] transition-colors">
                <MessageSquare size={12} />
                SYSTEM PROMPT
              </span>
              <ChevronDown
                size={14}
                className={`text-[#00ff4144] transition-transform ${showSystemPrompt ? 'rotate-180' : ''}`}
              />
            </button>

            {/* nota sobre el prompt */}
            <p className="mb-2 text-[8px] sm:text-[9px] font-mono text-[#00ff4144] leading-relaxed">
              El prompt se ajusta segun el tipo de pregunta. Solo modificalo si quieres un comportamiento distinto.
            </p>

            {showSystemPrompt && (
              <div className="animate-fade-in">
                <textarea
                  value={local.systemPrompt === 'VORTEX_DYNAMIC' ? '(Modo dinámico activado — El prompt se genera automáticamente según el contexto de cada mensaje)' : local.systemPrompt}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.includes('Modo dinámico activado')) return;
                    updateField('systemPrompt', val);
                  }}
                  rows={8}
                  className="w-full rounded-lg border border-[#00ff4118] bg-[#0d1117] px-3 py-2.5 text-[10px] sm:text-xs font-mono text-[#888] outline-none placeholder:text-[#333] focus:border-[#00ff4144] resize-y transition-all leading-relaxed"
                  placeholder="Escribe tu prompt personalizado o restaura el dinámico..."
                />
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    onClick={handleResetPrompt}
                    className="flex items-center gap-1.5 text-[9px] font-mono text-[#00ff4144] hover:text-[#00ff41] transition-colors"
                  >
                    <RotateCcw size={9} />
                    Restaurar modo dinámico
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* ═══ TEST CONNECTION ═══ */}
          <section className="rounded-lg border border-[#00ff4118] bg-[#0d1117] p-3">
            <button
              onClick={handleTest}
              disabled={testing || (local.provider !== 'offline' && !local.apiKey.trim())}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-[#00ff4133] bg-[#00ff4115] px-4 py-2.5 text-xs font-bold text-[#00ff41] tracking-wider transition-all hover:bg-[#00ff4122] hover:shadow-[0_0_20px_#00ff4115] disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {testing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  PROBANDO CONEXIÓN...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  PROBAR CONEXIÓN
                </>
              )}
            </button>

            {testResult && (
              <div
                className={`mt-3 flex items-start gap-2 rounded-lg p-2.5 text-[10px] sm:text-xs font-mono animate-fade-in ${
                  testResult.ok
                    ? 'border border-[#00ff4122] bg-[#00ff4108] text-[#00ff41aa]'
                    : 'border border-[#ff004022] bg-[#ff004008] text-[#ff0040aa]'
                }`}
              >
                {testResult.ok ? (
                  <CheckCircle2 size={14} className="shrink-0 mt-0.5" />
                ) : (
                  <XCircle size={14} className="shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <p className="break-words">{testResult.message}</p>
                  {testResult.latency && (
                    <p className="mt-1 text-[9px] text-[#00ff4155]">
                      Latencia: {testResult.latency}ms
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>

          {/* ═══ SAVE BUTTON ═══ */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={onClose}
              className="flex-1 rounded-lg border border-[#ffffff15] px-4 py-2.5 text-xs font-bold text-[#666] tracking-wider hover:bg-[#ffffff08] transition-all"
            >
              CANCELAR
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-gradient-to-r from-[#00cc33] to-[#009922] px-4 py-2.5 text-xs font-bold text-black tracking-wider shadow-lg shadow-[#00ff4133] hover:shadow-[#00ff4155] transition-all active:scale-[0.98]"
            >
              GUARDAR CONFIGURACIÓN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
