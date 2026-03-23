import { useCallback, useRef, useState } from 'react';
import type { AISettings, AppNotice, ChatState, Conversation, FileAttachment, Message } from '../types';
import { generateBotResponse, generateTitle } from '../utils/chat';
import { DEFAULT_REQUEST_TIMEOUT_MS, loadSettings, saveSettings, sendToAI } from '../utils/api';

const STORAGE_KEY = 'vortex-conversations';

function sanitize(conversations: Conversation[]): Conversation[] {
  return conversations.map((conversation) => ({
    ...conversation,
    messages: conversation.messages
      .filter((message) => !message.deleted)
      .map((message) => ({
        ...message,
        attachments: message.attachments?.map((attachment) => ({
          ...attachment,
          preview: undefined,
          content: attachment.content && attachment.content.length > 2000
            ? attachment.content.substring(0, 2000)
            : attachment.content,
        })),
      })),
  }));
}

function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveConversations(conversations: Conversation[]): { ok: boolean; error?: string } {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitize(conversations)));
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'No se pudo guardar el historial',
    };
  }
}

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function createNotice(level: AppNotice['level'], title: string, message: string): AppNotice {
  return { id: uid(), level, title, message };
}

function exportJson(conversations: Conversation[]): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      conversationCount: conversations.length,
      conversations,
    },
    null,
    2,
  );
}

function exportMarkdown(conversations: Conversation[]): string {
  return conversations
    .map((conversation) => {
      const sections = [
        `# ${conversation.title}`,
        '',
        `Creada: ${new Date(conversation.createdAt).toLocaleString('es-ES')}`,
        `Actualizada: ${new Date(conversation.updatedAt).toLocaleString('es-ES')}`,
        '',
      ];

      for (const message of conversation.messages.filter((item) => !item.deleted)) {
        sections.push(`## ${message.role === 'user' ? 'Usuario' : 'VORTEX'}`);
        sections.push(`Hora: ${new Date(message.timestamp).toLocaleString('es-ES')}`);

        if (message.attachments?.length) {
          sections.push('Adjuntos:');
          for (const attachment of message.attachments) {
            sections.push(`- ${attachment.name} (${attachment.type}, ${attachment.size} bytes)`);
          }
        }

        sections.push('');
        sections.push(message.content || '(sin texto)');
        sections.push('');
      }

      return sections.join('\n');
    })
    .join('\n---\n\n');
}

function downloadFile(fileName: string, contents: string, mimeType: string) {
  const blob = new Blob([contents], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function slugifyTitle(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'conversation';
}

function createExportName(extension: 'json' | 'md', title = 'vortex-export'): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${slugifyTitle(title)}-${stamp}.${extension}`;
}

export function useChat() {
  const [state, setState] = useState<ChatState>(() => {
    const conversations = loadConversations();
    return {
      conversations,
      activeConversationId: conversations.length > 0 ? conversations[0].id : null,
      isLoading: false,
      sidebarOpen: false,
    };
  });
  const [aiSettings, setAiSettings] = useState<AISettings>(loadSettings);
  const [notice, setNotice] = useState<AppNotice | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = state.conversations.find(
    (conversation) => conversation.id === state.activeConversationId,
  ) || null;

  const pushNotice = useCallback((level: AppNotice['level'], title: string, message: string) => {
    setNotice(createNotice(level, title, message));
  }, []);

  const dismissNotice = useCallback(() => {
    setNotice(null);
  }, []);

  const persist = useCallback((conversations: Conversation[]) => {
    const result = saveConversations(conversations);
    if (!result.ok) {
      pushNotice(
        'warning',
        'Historial no guardado',
        'El navegador no pudo guardar todo el historial. Exporta tus conversaciones para evitar pérdidas.',
      );
    }
  }, [pushNotice]);

  const updateAiSettings = useCallback((settings: AISettings) => {
    const normalized: AISettings = {
      ...settings,
      apiKey: settings.apiKey.trim(),
      systemPrompt: settings.systemPrompt.trim() || 'VORTEX_DYNAMIC',
    };

    setAiSettings(normalized);

    const result = saveSettings(normalized);
    if (!result.ok) {
      pushNotice(
        'warning',
        'Configuración no guardada',
        'No se pudo guardar la configuración en este navegador.',
      );
      return;
    }

    if (normalized.provider === 'offline' || !normalized.apiKey) {
      pushNotice(
        'success',
        'Modo local listo',
        'Puedes usar la interfaz y analizar archivos sin configurar ningún proveedor externo.',
      );
      return;
    }

    pushNotice(
      'warning',
      'Modo con API propia',
      'La API key se usará desde este navegador. Para un producto multiusuario conviene mover esto a un backend.',
    );
  }, [pushNotice]);

  const createNewConversation = useCallback(() => {
      const conversation: Conversation = {
      id: uid(),
      title: 'Nueva conversación',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setState((previous) => {
      const conversations = [conversation, ...previous.conversations];
      persist(conversations);
      return {
        ...previous,
        conversations,
        activeConversationId: conversation.id,
      };
    });
  }, [persist]);

  const selectConversation = useCallback((id: string) => {
    setState((previous) => ({ ...previous, activeConversationId: id }));
  }, []);

  const deleteConversation = useCallback((id: string) => {
    setState((previous) => {
      const conversations = previous.conversations.filter((conversation) => conversation.id !== id);
      const activeConversationId = previous.activeConversationId === id
        ? conversations[0]?.id ?? null
        : previous.activeConversationId;
      persist(conversations);
      return { ...previous, conversations, activeConversationId };
    });
  }, [persist]);

  const getBotResponse = useCallback(async (
    text: string,
    history: { role: 'user' | 'assistant'; content: string }[],
    attachments?: FileAttachment[],
    signal?: AbortSignal,
  ): Promise<string> => {
    if (aiSettings.provider !== 'offline' && aiSettings.apiKey.trim()) {
      try {
        return await sendToAI(
          aiSettings,
          text,
          history,
          attachments,
          { signal, timeoutMs: DEFAULT_REQUEST_TIMEOUT_MS },
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Error';

        if (message === 'OFFLINE_MODE' || message === 'NO_API_KEY') {
          return generateBotResponse(text, attachments);
        }

        if (message === 'REQUEST_ABORTED' || message === 'REQUEST_TIMEOUT') {
          throw error;
        }

        const fallback = generateBotResponse(text, attachments);
        return `Error de conexión con ${aiSettings.provider}: ${message}\n\nRespuesta local:\n\n${fallback}`;
      }
    }

    return generateBotResponse(text, attachments);
  }, [aiSettings]);

  const stopLoadingState = useCallback(() => {
    setState((previous) => ({ ...previous, isLoading: false }));
  }, []);

  const cancelGeneration = useCallback(() => {
    if (!abortRef.current) return;

    abortRef.current.abort(new DOMException('Solicitud cancelada', 'AbortError'));
    abortRef.current = null;
    stopLoadingState();
    pushNotice('info', 'Generación detenida', 'La respuesta en curso se canceló correctamente.');
  }, [pushNotice, stopLoadingState]);

  const sendMessage = useCallback(async (content: string, attachments?: FileAttachment[]) => {
    const text = content.trim();
    const hasText = text.length > 0;
    const hasFiles = Boolean(attachments?.length);

    if ((!hasText && !hasFiles) || state.isLoading) return;

    const userMessage: Message = {
      id: uid(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      attachments,
    };

    let targetConversationId = state.activeConversationId;
    const shouldCreateConversation = !targetConversationId;
    if (!targetConversationId) {
      targetConversationId = uid();
    }

    const currentConversation = state.conversations.find(
      (conversation) => conversation.id === targetConversationId,
    );
    const history = (currentConversation?.messages || [])
      .filter((message) => !message.deleted && message.content)
      .map((message) => ({
        role: message.role as 'user' | 'assistant',
        content: message.content,
      }));

    setState((previous) => {
      let conversations = [...previous.conversations];
      let activeConversationId = previous.activeConversationId;

      if (shouldCreateConversation) {
        conversations = [
          {
            id: targetConversationId!,
            title: generateTitle(text, attachments),
            messages: [userMessage],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          ...conversations,
        ];
        activeConversationId = targetConversationId!;
      } else {
        conversations = conversations.map((conversation) => {
          if (conversation.id !== targetConversationId) return conversation;
          const isFirstMessage = conversation.messages.length === 0;
          return {
            ...conversation,
            title: isFirstMessage ? generateTitle(text, attachments) : conversation.title,
            messages: [...conversation.messages, userMessage],
            updatedAt: Date.now(),
          };
        });
      }

      persist(conversations);
      return {
        ...previous,
        conversations,
        activeConversationId,
        isLoading: true,
      };
    });

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await getBotResponse(text, history, attachments, controller.signal);
      const botMessage: Message = {
        id: uid(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setState((previous) => {
        const conversations = previous.conversations.map((conversation) => {
          if (conversation.id !== targetConversationId) return conversation;
          return {
            ...conversation,
            messages: [...conversation.messages, botMessage],
            updatedAt: Date.now(),
          };
        });

        persist(conversations);
        return { ...previous, conversations, isLoading: false };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';

      if (message === 'REQUEST_TIMEOUT') {
        pushNotice(
          'warning',
          'Respuesta demorada',
          'El proveedor tardó demasiado en responder. Prueba con otro modelo o vuelve a intentarlo.',
        );
      } else if (message !== 'REQUEST_ABORTED') {
        pushNotice(
          'error',
          'No se pudo completar',
          'La respuesta falló antes de terminar. Puedes reintentar o cambiar de proveedor.',
        );
      }

      stopLoadingState();
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [getBotResponse, persist, pushNotice, state.activeConversationId, state.conversations, state.isLoading, stopLoadingState]);

  const regenerateMessage = useCallback(async (messageId: string) => {
    if (state.isLoading) return;

    const conversation = state.conversations.find(
      (item) => item.id === state.activeConversationId,
    );
    if (!conversation) return;

    const messageIndex = conversation.messages.findIndex((message) => message.id === messageId);
    if (messageIndex < 0) return;

    let previousUserText = '';
    let previousUserFiles: FileAttachment[] | undefined;
    for (let index = messageIndex - 1; index >= 0; index -= 1) {
      const message = conversation.messages[index];
      if (message.role === 'user') {
        previousUserText = message.content;
        previousUserFiles = message.attachments;
        break;
      }
    }

    setState((previous) => {
      const conversations = previous.conversations.map((item) => {
        if (item.id !== state.activeConversationId) return item;
        return {
          ...item,
          messages: item.messages.filter((message) => message.id !== messageId),
          updatedAt: Date.now(),
        };
      });

      persist(conversations);
      return { ...previous, conversations, isLoading: true };
    });

    const history = conversation.messages
      .filter((message) => !message.deleted && message.id !== messageId && message.content)
      .map((message) => ({
        role: message.role as 'user' | 'assistant',
        content: message.content,
      }));

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await getBotResponse(
        previousUserText,
        history,
        previousUserFiles,
        controller.signal,
      );
      const newMessage: Message = {
        id: uid(),
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setState((previous) => {
        const conversations = previous.conversations.map((item) => {
          if (item.id !== state.activeConversationId) return item;
          const messages = [...item.messages];
          let insertAt = messages.length;
          for (let index = messages.length - 1; index >= 0; index -= 1) {
            if (messages[index].role === 'user') {
              insertAt = index + 1;
              break;
            }
          }
          messages.splice(insertAt, 0, newMessage);
          return { ...item, messages, updatedAt: Date.now() };
        });

        persist(conversations);
        return { ...previous, conversations, isLoading: false };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error';

      if (message === 'REQUEST_TIMEOUT') {
        pushNotice(
          'warning',
          'Regeneración lenta',
          'El proveedor tardó demasiado en regenerar esta respuesta.',
        );
      } else if (message !== 'REQUEST_ABORTED') {
        pushNotice(
          'error',
          'Regeneración fallida',
          'No se pudo regenerar la respuesta actual.',
        );
      }

      stopLoadingState();
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  }, [getBotResponse, persist, pushNotice, state.activeConversationId, state.conversations, state.isLoading, stopLoadingState]);

  const deleteMessage = useCallback((messageId: string) => {
    setState((previous) => {
      const conversations = previous.conversations.map((conversation) => {
        if (conversation.id !== state.activeConversationId) return conversation;
        return {
          ...conversation,
          messages: conversation.messages.filter((message) => message.id !== messageId),
          updatedAt: Date.now(),
        };
      });

      persist(conversations);
      return { ...previous, conversations };
    });
  }, [persist, state.activeConversationId]);

  const toggleSidebar = useCallback(() => {
    setState((previous) => ({ ...previous, sidebarOpen: !previous.sidebarOpen }));
  }, []);

  const clearAllConversations = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort(new DOMException('Solicitud cancelada', 'AbortError'));
      abortRef.current = null;
    }

    setState({
      conversations: [],
      activeConversationId: null,
      isLoading: false,
      sidebarOpen: false,
    });
    persist([]);
  }, [persist]);

  const exportConversations = useCallback((format: 'json' | 'markdown') => {
    if (state.conversations.length === 0) {
      pushNotice('info', 'Sin conversaciones', 'Todavía no hay conversaciones para exportar.');
      return;
    }

    if (format === 'json') {
      downloadFile(
        createExportName('json'),
        exportJson(state.conversations),
        'application/json;charset=utf-8',
      );
    } else {
      downloadFile(
        createExportName('md'),
        exportMarkdown(state.conversations),
        'text/markdown;charset=utf-8',
      );
    }

    pushNotice(
      'success',
      'Exportación lista',
      format === 'json'
        ? 'Se descargó un respaldo completo en JSON.'
        : 'Se descargó un transcript legible en Markdown.',
    );
  }, [pushNotice, state.conversations]);

  const exportConversation = useCallback((conversationId: string, format: 'json' | 'markdown') => {
    const conversation = state.conversations.find((item) => item.id === conversationId);

    if (!conversation) {
      pushNotice('warning', 'Conversación no encontrada', 'No se pudo exportar esa conversación.');
      return;
    }

    const exportLabel = `vortex-${conversation.title || 'chat'}`;

    if (format === 'json') {
      downloadFile(
        createExportName('json', exportLabel),
        exportJson([conversation]),
        'application/json;charset=utf-8',
      );
    } else {
      downloadFile(
        createExportName('md', exportLabel),
        exportMarkdown([conversation]),
        'text/markdown;charset=utf-8',
      );
    }

    pushNotice(
      'success',
      'Conversación exportada',
      format === 'json'
        ? `Se descargó "${conversation.title}" en JSON.`
        : `Se descargó "${conversation.title}" en Markdown.`,
    );
  }, [pushNotice, state.conversations]);

  return {
    ...state,
    activeConversation,
    aiSettings,
    notice,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    regenerateMessage,
    deleteMessage,
    toggleSidebar,
    clearAllConversations,
    updateAiSettings,
    dismissNotice,
    cancelGeneration,
    exportConversations,
    exportConversation,
  };
}
