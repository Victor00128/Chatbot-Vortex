// Hook principal del chat — aqui vive toda la logica de sesiones y mensajes
// TODO: revisar la latencia de respuesta AI en conexiones lentas (a veces tarda mucho)
import { useState, useCallback, useRef } from 'react';
import type { ChatState, Conversation, Message, FileAttachment, AISettings } from '../types';
import { generateBotResponse, generateTitle } from '../utils/chat';
import { sendToAI, loadSettings, saveSettings } from '../utils/api';

const STORAGE_KEY = 'vortex-conversations';

// limpiar attachments pesados antes de guardar en localStorage
function sanitize(convs: Conversation[]): Conversation[] {
  return convs.map(c => ({
    ...c,
    messages: c.messages.filter(m => !m.deleted).map(m => ({
      ...m,
      attachments: m.attachments?.map(a => ({
        ...a, preview: undefined,
        content: a.content && a.content.length > 2000 ? a.content.substring(0, 2000) : a.content,
      })),
    })),
  }));
}

function load(): Conversation[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

function save(convs: Conversation[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(convs))); } catch { /* */ }
}

// generador de IDs unicos — suficiente para nuestro caso, no necesitamos UUID completo
function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function useChat() {
  const [state, setState] = useState<ChatState>(() => {
    const convs = load();
    return {
      conversations: convs,
      activeConversationId: convs.length > 0 ? convs[0].id : null,
      isLoading: false,
      sidebarOpen: false,
    };
  });

  const [aiSettings, setAiSettings] = useState<AISettings>(loadSettings);
  const abortRef = useRef<AbortController | null>(null);

  const active = state.conversations.find(c => c.id === state.activeConversationId) || null;

  const persist = useCallback((convs: Conversation[]) => save(convs), []);

  const updateAiSettings = useCallback((s: AISettings) => {
    setAiSettings(s);
    saveSettings(s);
  }, []);

  const createNewConversation = useCallback(() => {
    const conv: Conversation = {
      id: uid(), title: 'Nueva sesión', messages: [],
      createdAt: Date.now(), updatedAt: Date.now(),
    };
    setState(p => {
      const next = { ...p, conversations: [conv, ...p.conversations], activeConversationId: conv.id };
      persist(next.conversations);
      return next;
    });
  }, [persist]);

  const selectConversation = useCallback((id: string) => {
    setState(p => ({ ...p, activeConversationId: id }));
  }, []);

  // borrar conversacion
  const deleteConversation = useCallback((id: string) => {
    setState(prev => {
      const filtered = prev.conversations.filter(c => c.id !== id);
      let newActive = prev.activeConversationId;
      if (prev.activeConversationId === id) {
        newActive = filtered.length > 0 ? filtered[0].id : null;
      }
      const next = { ...prev, conversations: filtered, activeConversationId: newActive };
      persist(filtered);
      return next;
    });
  }, [persist]);

  // obtener respuesta del bot (con API o fallback offline)
  const getBotResponse = useCallback(async (
    text: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    attachments?: FileAttachment[],
  ): Promise<string> => {
    if (aiSettings.provider !== 'offline' && aiSettings.apiKey.trim()) {
      try {
        return await sendToAI(aiSettings, text, history, attachments);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error';
        if (msg === 'OFFLINE_MODE' || msg === 'NO_API_KEY') {
          return generateBotResponse(text, attachments);
        }
        // si falla la API, mostrar error + respuesta offline
        // TODO: mejorar este mensaje de error, esta medio feo
        const fallback = generateBotResponse(text, attachments);
        return `Error de conexion con ${aiSettings.provider}: ${msg}\n\nRespuesta offline:\n\n${fallback}`;
      }
    }
    return generateBotResponse(text, attachments);
  }, [aiSettings]);

  // enviar mensaje al chat activo (o crear uno nuevo si no hay ninguno)
  const sendMessage = useCallback(async (content: string, attachments?: FileAttachment[]) => {
    const hasText = content.trim().length > 0;
    const hasFiles = attachments && attachments.length > 0;
    if ((!hasText && !hasFiles) || state.isLoading) return;
    // console.log('[sendMessage] enviando:', content.substring(0, 50), '| archivos:', attachments?.length ?? 0);

    const userMsg: Message = {
      id: uid(), role: 'user', content: content.trim(),
      timestamp: Date.now(), attachments,
    };

    let targetId = state.activeConversationId;
    let shouldCreate = false;
    if (!targetId) { shouldCreate = true; targetId = uid(); }

    // agregar mensaje del usuario
    setState(prev => {
      let convs = [...prev.conversations];
      let activeId = prev.activeConversationId;

      if (shouldCreate) {
        convs = [{
          id: targetId!, title: generateTitle(content, attachments),
          messages: [userMsg], createdAt: Date.now(), updatedAt: Date.now(),
        }, ...convs];
        activeId = targetId;
      } else {
        convs = convs.map(c => {
          if (c.id !== targetId) return c;
          const isFirst = c.messages.length === 0;
          return {
            ...c,
            title: isFirst ? generateTitle(content, attachments) : c.title,
            messages: [...c.messages, userMsg], updatedAt: Date.now(),
          };
        });
      }
      persist(convs);
      return { ...prev, conversations: convs, activeConversationId: activeId, isLoading: true };
    });

    // historial para contexto
    const conv = state.conversations.find(c => c.id === targetId);
    const history = (conv?.messages || [])
      .filter(m => !m.deleted && m.content)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const resp = await getBotResponse(content.trim(), history, attachments);
      // TODO: revisar la latencia de la respuesta AI para la version final
      // console.log('[sendMessage] respuesta recibida, largo:', resp.length);
      const botMsg: Message = { id: uid(), role: 'assistant', content: resp, timestamp: Date.now() };

      setState(prev => {
        const convs = prev.conversations.map(c => {
          if (c.id !== targetId) return c;
          return { ...c, messages: [...c.messages, botMsg], updatedAt: Date.now() };
        });
        persist(convs);
        return { ...prev, conversations: convs, isLoading: false };
      });
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.activeConversationId, state.isLoading, state.conversations, persist, getBotResponse]);

  // regenerar respuesta
  const regenerateMessage = useCallback(async (messageId: string) => {
    if (state.isLoading) return;

    const conv = state.conversations.find(c => c.id === state.activeConversationId);
    if (!conv) return;

    const msgIdx = conv.messages.findIndex(m => m.id === messageId);
    if (msgIdx < 0) return;

    let userText = '';
    let userFiles: FileAttachment[] | undefined;
    for (let i = msgIdx - 1; i >= 0; i--) {
      if (conv.messages[i].role === 'user') {
        userText = conv.messages[i].content;
        userFiles = conv.messages[i].attachments;
        break;
      }
    }

    // quitar mensaje viejo
    setState(prev => {
      const convs = prev.conversations.map(c => {
        if (c.id !== state.activeConversationId) return c;
        return { ...c, messages: c.messages.filter(m => m.id !== messageId), updatedAt: Date.now() };
      });
      persist(convs);
      return { ...prev, conversations: convs, isLoading: true };
    });

    const history = conv.messages
      .filter(m => !m.deleted && m.id !== messageId && m.content)
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    try {
      const resp = await getBotResponse(userText, history, userFiles);
      const newMsg: Message = { id: uid(), role: 'assistant', content: resp, timestamp: Date.now() };

      setState(prev => {
        const convs = prev.conversations.map(c => {
          if (c.id !== state.activeConversationId) return c;
          const msgs = [...c.messages];
          let insertAt = msgs.length;
          for (let i = msgs.length - 1; i >= 0; i--) {
            if (msgs[i].role === 'user') { insertAt = i + 1; break; }
          }
          msgs.splice(insertAt, 0, newMsg);
          return { ...c, messages: msgs, updatedAt: Date.now() };
        });
        persist(convs);
        return { ...prev, conversations: convs, isLoading: false };
      });
    } catch {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.activeConversationId, state.isLoading, state.conversations, persist, getBotResponse]);

  // borrar un mensaje
  const deleteMessage = useCallback((messageId: string) => {
    setState(prev => {
      const convs = prev.conversations.map(c => {
        if (c.id !== state.activeConversationId) return c;
        return { ...c, messages: c.messages.filter(m => m.id !== messageId), updatedAt: Date.now() };
      });
      persist(convs);
      return { ...prev, conversations: convs };
    });
  }, [state.activeConversationId, persist]);

  // TODO: en mobile el sidebar a veces no cierra bien con el swipe, hay que agregar gesture handler
  const toggleSidebar = useCallback(() => {
    setState(p => ({ ...p, sidebarOpen: !p.sidebarOpen }));
  }, []);

  const clearAllConversations = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setState({ conversations: [], activeConversationId: null, isLoading: false, sidebarOpen: false });
    save([]);
  }, []);

  return {
    ...state,
    activeConversation: active,
    aiSettings,
    createNewConversation, selectConversation, deleteConversation,
    sendMessage, regenerateMessage, deleteMessage,
    toggleSidebar, clearAllConversations, updateAiSettings,
  };
}
