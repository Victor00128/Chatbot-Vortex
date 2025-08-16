import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  Sender,
  ChatMessage,
  AIPersonality,
  PERSONALITIES,
  Conversation,
  ConversationSummary,
} from "../types";
import {
  needsSummary,
  generateConversationSummary,
  createConversationSummary,
  getEnrichedSystemInstruction,
  getEnrichedContext,
} from "../services/summaryService";

interface ChatState {
  conversations: Record<string, Conversation>;
  summaries: Record<string, ConversationSummary>;
  activeConversationId: string | null;
  isLoading: boolean;
  chat: any; // ChatSession de Gemini
  error: string | null;
  isFullscreen: boolean;
  isSidebarOpen: boolean;
  isSearchEnabled: boolean;
  isSearching: boolean;
  editingMessageId: string | null;
  editingText: string;
  currentTool: string | null;
  toolQuery: string | null;
  toast: { message: string; type: "success" | "error" | "info" } | null;
  isGeneratingSummary: boolean;

  // Acciones
  setActiveConversationId: (id: string | null) => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  setFullscreen: (fullscreen: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
  setSearchEnabled: (enabled: boolean) => void;
  setSearching: (searching: boolean) => void;
  showToast: (message: string, type?: "success" | "error" | "info") => void;
  hideToast: () => void;
  addConversation: (conversation: Conversation) => void;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  renameConversation: (id: string, newTitle: string) => void;
  downloadConversation: (id: string) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  updateMessage: (
    conversationId: string,
    messageId: string,
    updates: Partial<ChatMessage>,
  ) => void;
  deleteMessage: (conversationId: string, messageId: string) => void;
  startEditingMessage: (messageId: string, text: string) => void;
  stopEditingMessage: () => void;
  updateEditingText: (text: string) => void;
  regenerateLastResponse: () => Promise<void>;
  editAndResendMessage: (messageId: string, newText: string) => Promise<void>;
  setCurrentTool: (tool: string | null, query?: string) => void;
  newConversation: (personality?: AIPersonality) => void;
  sendMessage: (text: string, file?: File) => Promise<void>;
  changePersonality: (newPersonality: AIPersonality) => void;
  selectConversation: (id: string) => void;
  toggleSidebar: () => void;
  toggleFullscreen: () => void;
  toggleSearch: () => void;
  generateSummaryForConversation: (conversationId: string) => Promise<void>;
  getSummaryForConversation: (
    conversationId: string,
  ) => ConversationSummary | undefined;
  getEnrichedContextForConversation: (conversationId: string) => ChatMessage[];
  backgroundSummaryGeneration: (conversationId: string) => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: {},
      summaries: {},
      activeConversationId: null,
      isLoading: false,
      chat: null,
      error: null,
      isFullscreen: false,
      isSidebarOpen: false,
      isSearchEnabled: true,
      isSearching: false,
      editingMessageId: null,
      editingText: "",
      currentTool: null,
      toolQuery: null,
      toast: null,
      isGeneratingSummary: false,

      setActiveConversationId: (id) => set({ activeConversationId: id }),
      setError: (error) => set({ error }),
      setLoading: (loading) => set({ isLoading: loading }),
      setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
      setSidebarOpen: (open) => set({ isSidebarOpen: open }),
      setSearchEnabled: (enabled) => set({ isSearchEnabled: enabled }),
      setSearching: (searching) => set({ isSearching: searching }),
      showToast: (message, type = "info") => set({ toast: { message, type } }),
      hideToast: () => set({ toast: null }),

      addConversation: (conversation) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversation.id]: conversation,
          },
        })),

      updateConversation: (id, updates) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [id]: {
              ...state.conversations[id],
              ...updates,
              lastModified: Date.now(),
            },
          },
        })),

      deleteConversation: (id) => {
        const state = get();
        if (Object.keys(state.conversations).length <= 1) return;

        const newConversations = { ...state.conversations };
        delete newConversations[id];

        let newActiveId = state.activeConversationId;
        if (state.activeConversationId === id) {
          const remainingConvos = Object.values(newConversations).sort(
            (a, b) => b.lastModified - a.lastModified,
          );
          newActiveId =
            remainingConvos.length > 0 ? remainingConvos[0].id : null;
        }

        set({
          conversations: newConversations,
          activeConversationId: newActiveId,
        });
      },

      renameConversation: (id, newTitle) => {
        if (!newTitle.trim()) return;
        get().updateConversation(id, { title: newTitle.trim() });
      },

      downloadConversation: (id) => {
        const state = get();
        const conversation = state.conversations[id];
        if (!conversation) return;

        const fileContent =
          `Conversación: ${conversation.title}\n` +
          `Personalidad IA: ${PERSONALITIES[conversation.personality].name}\n` +
          `Fecha: ${new Date(conversation.lastModified).toLocaleString()}\n\n` +
          "---\n\n" +
          conversation.messages
            .filter((m) => m.id !== "initial-message")
            .map((msg) => {
              const sender = msg.sender === Sender.User ? "Tú" : "Bot";
              const fileInfo = msg.fileInfo
                ? `[Archivo Adjunto: ${msg.fileInfo.name}]`
                : "";
              return `${sender}:\n${fileInfo ? fileInfo + "\n" : ""}${msg.text}\n`;
            })
            .join("\n---\n\n");

        const blob = new Blob([fileContent], {
          type: "text/plain;charset=utf-8",
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const sanitizedTitle = conversation.title
          .replace(/[^a-z0-9]/gi, "_")
          .toLowerCase();
        link.download = `conversacion_${sanitizedTitle || "chat"}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },

      addMessage: (conversationId, message) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...state.conversations[conversationId],
              messages: [
                ...state.conversations[conversationId].messages,
                message,
              ],
              lastModified: Date.now(),
            },
          },
        })),

      updateMessage: (conversationId, messageId, updates) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...state.conversations[conversationId],
              messages: state.conversations[conversationId].messages.map(
                (msg) => (msg.id === messageId ? { ...msg, ...updates } : msg),
              ),
              lastModified: Date.now(),
            },
          },
        })),

      deleteMessage: (conversationId, messageId) =>
        set((state) => ({
          conversations: {
            ...state.conversations,
            [conversationId]: {
              ...state.conversations[conversationId],
              messages: state.conversations[conversationId].messages.filter(
                (msg) => msg.id !== messageId,
              ),
              lastModified: Date.now(),
            },
          },
        })),

      startEditingMessage: (messageId, text) =>
        set({ editingMessageId: messageId, editingText: text }),

      stopEditingMessage: () =>
        set({ editingMessageId: null, editingText: "" }),

      updateEditingText: (text) => set({ editingText: text }),

      regenerateLastResponse: async () => {
        const state = get();
        if (!state.activeConversationId) return;

        const conversation = state.conversations[state.activeConversationId];
        if (!conversation) return;

        const userMessages = conversation.messages.filter(
          (m) => m.sender === Sender.User,
        );
        const lastUserMessage = userMessages[userMessages.length - 1];

        if (!lastUserMessage) return;

        const messagesWithoutLastAI = conversation.messages.filter(
          (msg, index) => {
            if (
              msg.sender === Sender.AI &&
              index >
                conversation.messages.findIndex(
                  (m) => m.id === lastUserMessage.id,
                )
            ) {
              return false;
            }
            return true;
          },
        );

        get().updateConversation(state.activeConversationId, {
          messages: messagesWithoutLastAI,
        });
        await get().sendMessage(lastUserMessage.text, lastUserMessage.fileData);
      },

      // Nueva función para editar y reenviar mensajes
      editAndResendMessage: async (messageId: string, newText: string) => {
        const state = get();
        if (!state.activeConversationId) return;

        const conversation = state.conversations[state.activeConversationId];
        if (!conversation) return;

        // Encontrar el mensaje a editar
        const messageToEdit = conversation.messages.find(
          (m) => m.id === messageId,
        );
        if (!messageToEdit || messageToEdit.sender !== Sender.User) return;

        // Encontrar el índice del mensaje
        const messageIndex = conversation.messages.findIndex(
          (m) => m.id === messageId,
        );

        // Eliminar todos los mensajes después del mensaje editado (incluyendo respuestas de IA)
        const messagesBeforeEdit = conversation.messages.slice(
          0,
          messageIndex + 1,
        );

        // Actualizar el texto del mensaje editado
        const updatedMessage = { ...messageToEdit, text: newText };
        messagesBeforeEdit[messageIndex] = updatedMessage;

        // Actualizar la conversación
        get().updateConversation(state.activeConversationId, {
          messages: messagesBeforeEdit,
        });

        // Detener la edición
        get().stopEditingMessage();

        // Reenviar el mensaje editado
        await get().sendMessage(newText, messageToEdit.fileData);
      },

      setCurrentTool: (tool, query) =>
        set({ currentTool: tool, toolQuery: query || null }),

      newConversation: (personality = "flash") => {
        const config = PERSONALITIES[personality];
        const newId = Date.now().toString();
        const welcomeMessage: ChatMessage = {
          id: "initial-message",
          sender: Sender.AI,
          text: config.welcomeMessage,
        };

        const newConversation: Conversation = {
          id: newId,
          title: "Nueva Conversación",
          messages: [welcomeMessage],
          lastModified: Date.now(),
          personality,
        };

        get().addConversation(newConversation);
        get().setActiveConversationId(newId);
        get().setError(null);
        get().showToast("Nueva conversación iniciada", "success");
      },

      sendMessage: async (text, file) => {
        const state = get();
        if ((!text && !file) || !state.activeConversationId) return;

        // Lógica de risas (mantenida del código original)
        const laughExpressions = [
          /^j(a|i)+j(a|i)+j(a|i)*$/i,
          /^j+$/i,
          /^x[d]+$/i,
          /^lo+l$/i,
          /😂/,
          /🤣/,
        ];
        const isLaugh = laughExpressions.some((regex) =>
          regex.test(text.trim()),
        );

        if (isLaugh && !file) {
          const userMessage: ChatMessage = {
            id: Date.now().toString(),
            sender: Sender.User,
            text,
          };

          const lastAiMessage =
            state.conversations[state.activeConversationId]?.messages
              .filter((m) => m.sender === Sender.AI)
              .pop()
              ?.text.toLowerCase() || "";

          const wasJoke = lastAiMessage.includes("chiste");
          const baseResponses = [
            "¡Me alegro de que te haya gustado! 😄",
            "¡Genial, sabía que te haría reír!",
            "¡Perfecto! ¿En qué más puedo ayudarte?",
          ];
          const jokeFollowUpResponse =
            "¡Qué bueno que te gustó! ¿Te cuento otro?";

          let aiResponseText: string;
          if (wasJoke && Math.random() > 0.5) {
            aiResponseText = jokeFollowUpResponse;
          } else {
            aiResponseText =
              baseResponses[Math.floor(Math.random() * baseResponses.length)];
          }

          const aiMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            sender: Sender.AI,
            text: aiResponseText,
          };

          get().addMessage(state.activeConversationId, userMessage);
          get().addMessage(state.activeConversationId, aiMessage);
          get().showToast("¡Me alegro de que te haya gustado! 😄", "success");
          return;
        }

        // Mensaje normal
        const userMessage: ChatMessage = {
          id: Date.now().toString(),
          sender: Sender.User,
          text,
          fileInfo: file
            ? { name: file.name, type: file.type, size: file.size }
            : undefined,
          fileData: file,
        };

        get().setLoading(true);
        get().setError(null);

        // Actualizar título si es el primer mensaje
        const conversation = state.conversations[state.activeConversationId];
        if (
          !conversation.messages.some(
            (m) => m.sender === Sender.User && m.id !== userMessage.id,
          ) &&
          text
        ) {
          get().updateConversation(state.activeConversationId, {
            title: text.substring(0, 40),
          });
        }

        // Añadir mensaje del usuario
        get().addMessage(state.activeConversationId, userMessage);

        // Crear placeholder para la respuesta de la IA
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: ChatMessage = {
          id: aiMessageId,
          sender: Sender.AI,
          text: "",
        };
        get().addMessage(state.activeConversationId, aiMessage);

        // Verificar si necesita generar resumen automático
        const updatedConversation =
          get().conversations[state.activeConversationId];
        const existingSummary = get().summaries[state.activeConversationId];
        if (needsSummary(updatedConversation, existingSummary)) {
          get().backgroundSummaryGeneration(state.activeConversationId);
        }

        try {
          const config = PERSONALITIES[conversation.personality];

          // Usar contexto enriquecido con resúmenes para conversaciones largas
          const enrichedContext = get().getEnrichedContextForConversation(
            state.activeConversationId,
          );
          const summary = get().getSummaryForConversation(
            state.activeConversationId,
          );
          const enrichedSystemInstruction = getEnrichedSystemInstruction(
            config.systemInstruction,
            summary,
          );

          if (config.provider === "openai") {
            // Lógica para OpenAI - usar contexto enriquecido con resúmenes
            const enrichedHistory = enrichedContext.slice(0, -2); // Excluir mensaje del usuario y placeholder de IA

            const tools = [
              {
                type: "function",
                function: {
                  name: "internetSearch",
                  description:
                    "Busca en internet información en tiempo real. Úsalo para eventos recientes, precios, etc.",
                  parameters: {
                    type: "object",
                    properties: {
                      query: {
                        type: "string",
                        description: "La consulta de búsqueda.",
                      },
                    },
                    required: ["query"],
                  },
                },
              },
              {
                type: "function",
                function: {
                  name: "getCurrentTime",
                  description: "Obtiene la fecha y hora actual.",
                  parameters: { type: "object", properties: {} },
                },
              },
            ];

            // Importar dinámicamente para evitar errores de build
            const { getOpenAIStream } = await import(
              "../services/openaiService"
            );
            const { performSearch } = await import("../services/searchService");

            // Crear config enriquecido con resumen
            const enrichedConfig = {
              ...config,
              systemInstruction: enrichedSystemInstruction,
            };
            const stream = getOpenAIStream(
              enrichedConfig,
              enrichedHistory,
              userMessage,
              tools,
            );
            let aiResponseText = "";
            let toolCalls: any[] = [];

            for await (const chunk of stream) {
              if (chunk.type === "text") {
                aiResponseText += chunk.value;
                get().updateMessage(state.activeConversationId!, aiMessageId, {
                  text: aiResponseText,
                });
              } else if (chunk.type === "tool_call") {
                toolCalls = chunk.value;
              }
            }

            if (toolCalls.length > 0) {
              get().setSearching(true);
              get().setCurrentTool(
                "internetSearch",
                toolCalls[0]?.function?.arguments
                  ? JSON.parse(toolCalls[0].function.arguments).query
                  : undefined,
              );

              const toolResults = await Promise.all(
                toolCalls.map(async (call) => {
                  let content = "";
                  try {
                    const args = JSON.parse(call.function.arguments);
                    if (call.function.name === "internetSearch") {
                      const searchResults = await performSearch(args.query);
                      content = JSON.stringify(
                        searchResults.map((r) => ({
                          title: r.title,
                          snippet: r.snippet,
                          source: r.link,
                        })),
                      );
                    } else if (call.function.name === "getCurrentTime") {
                      const now = new Date();
                      content = now.toLocaleString("es-ES", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false,
                      });
                    }
                  } catch (e) {
                    console.error("Error executing OpenAI tool:", e);
                    content = JSON.stringify({ error: "La herramienta falló" });
                  }
                  return {
                    role: "tool",
                    tool_call_id: call.id,
                    content,
                  };
                }),
              );

              get().setSearching(false);
              get().setCurrentTool(null);

              const finalStream = getOpenAIStream(
                enrichedConfig,
                enrichedHistory,
                userMessage,
                tools,
                toolResults,
              );
              let finalResponse = "";
              for await (const chunk of finalStream) {
                if (chunk.type === "text") {
                  finalResponse += chunk.value;
                  get().updateMessage(
                    state.activeConversationId!,
                    aiMessageId,
                    { text: finalResponse },
                  );
                }
              }
            }
          } else {
            // Lógica para Gemini
            if (file) {
              // Importar dinámicamente
              const { analyzeFileWithBackend } = await import(
                "../services/backendService"
              );
              const result = await analyzeFileWithBackend(
                text,
                file,
                enrichedSystemInstruction,
              );
              let aiResponseText = "";
              for await (const chunk of (result as any).stream) {
                aiResponseText += chunk.text();
                get().updateMessage(state.activeConversationId!, aiMessageId, {
                  text: aiResponseText,
                });
              }
            } else {
              // Importar dinámicamente
              const { startChat, internetSearchTool, realTimeClockTool } =
                await import("../services/geminiService");
              const { performSearch } = await import(
                "../services/searchService"
              );

              // Inicializar chat de Gemini con contexto enriquecido
              const apiHistory = enrichedContext
                .filter((m) => m.id !== "initial-message" && !m.fileInfo)
                .map((msg) => ({
                  role: msg.sender === Sender.User ? "user" : "model",
                  parts: [{ text: msg.text }],
                }));

              const tools: any[] = [];
              if (state.isSearchEnabled) {
                tools.push(internetSearchTool);
              }
              tools.push(realTimeClockTool);

              const chatSession = startChat(
                enrichedSystemInstruction,
                config.model,
                apiHistory,
                tools,
              );
              set({ chat: chatSession });

              const result = await chatSession.sendMessageStream(text);
              let aiResponseText = "";

              for await (const chunk of result.stream) {
                const functionCalls = chunk.functionCalls();
                if (functionCalls && functionCalls.length > 0) {
                  get().setSearching(true);
                  get().setCurrentTool(
                    functionCalls[0].name,
                    (functionCalls[0].args as any)?.query,
                  );

                  const toolPromises = functionCalls.map(async (call) => {
                    try {
                      if (call.name === "internetSearch") {
                        const query = (call.args as any).query;
                        const searchResults = await performSearch(
                          query as string,
                        );
                        const response = searchResults.map((r) => ({
                          title: r.title,
                          snippet: r.snippet,
                          source: r.link,
                        }));
                        return {
                          functionResponse: {
                            name: "internetSearch",
                            response: { results: response },
                          },
                        };
                      } else if (call.name === "getCurrentTime") {
                        const now = new Date();
                        const formattedTime = now.toLocaleString("es-ES", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                          hour12: false,
                        });
                        return {
                          functionResponse: {
                            name: "getCurrentTime",
                            response: { currentTime: formattedTime },
                          },
                        };
                      }
                    } catch (e) {
                      console.error(`Error during tool call ${call.name}:`, e);
                      return {
                        functionResponse: {
                          name: call.name,
                          response: {
                            error: "La herramienta falló durante la ejecución.",
                          },
                        },
                      };
                    }
                  });

                  const responses = await Promise.all(toolPromises);
                  get().setSearching(false);
                  get().setCurrentTool(null);

                  if (responses.length > 0) {
                    const toolResultStream =
                      await chatSession.sendMessageStream(responses as any);
                    let toolResponseText = "";
                    for await (const toolChunk of toolResultStream.stream) {
                      toolResponseText += toolChunk.text();
                      get().updateMessage(
                        state.activeConversationId!,
                        aiMessageId,
                        { text: toolResponseText },
                      );
                    }
                  }
                  return;
                }

                aiResponseText += chunk.text();
                get().updateMessage(state.activeConversationId!, aiMessageId, {
                  text: aiResponseText,
                });
              }
            }
          }
        } catch (e) {
          get().setError(
            `Error en envío de mensaje: ${e instanceof Error ? e.message : "Error desconocido"}`,
          );
          // Eliminar los mensajes fallidos
          get().deleteMessage(state.activeConversationId, userMessage.id);
          get().deleteMessage(state.activeConversationId, aiMessageId);
        } finally {
          get().setLoading(false);
        }
      },

      changePersonality: (newPersonality) => {
        const state = get();
        if (!state.activeConversationId) {
          get().newConversation(newPersonality);
          return;
        }

        if (
          state.conversations[state.activeConversationId]?.personality !==
          newPersonality
        ) {
          get().updateConversation(state.activeConversationId, {
            personality: newPersonality,
          });
        }
      },

      selectConversation: (id) => {
        if (id !== get().activeConversationId) {
          get().setActiveConversationId(id);
          get().setSidebarOpen(false);
        }
      },

      toggleSidebar: () => {
        const state = get();
        get().setSidebarOpen(!state.isSidebarOpen);
      },

      toggleFullscreen: async () => {
        const state = get();
        if (!document.fullscreenElement) {
          try {
            await document.documentElement.requestFullscreen();
            get().setFullscreen(true);
          } catch (e) {
            console.error("Error al entrar en pantalla completa:", e);
          }
        } else {
          try {
            await document.exitFullscreen();
            get().setFullscreen(false);
          } catch (e) {
            console.error("Error al salir de pantalla completa:", e);
          }
        }
      },

      toggleSearch: () => {
        const state = get();
        get().setSearchEnabled(!state.isSearchEnabled);
      },

      // Funciones de resumen y memoria a largo plazo
      generateSummaryForConversation: async (conversationId: string) => {
        const state = get();
        const conversation = state.conversations[conversationId];
        if (!conversation) return;

        set({ isGeneratingSummary: true });
        try {
          const existingSummary = state.summaries[conversationId];

          if (needsSummary(conversation, existingSummary)) {
            const summaryText = await generateConversationSummary(
              conversation,
              existingSummary,
            );
            const newSummary = createConversationSummary(
              conversationId,
              summaryText,
              conversation.messages.length,
              existingSummary,
            );

            set((state) => ({
              summaries: {
                ...state.summaries,
                [conversationId]: newSummary,
              },
            }));

            get().showToast("Resumen de conversación actualizado", "success");
          }
        } catch (error) {
          console.error("Error generando resumen:", error);
          get().showToast("Error al generar resumen de conversación", "error");
        } finally {
          set({ isGeneratingSummary: false });
        }
      },

      getSummaryForConversation: (conversationId: string) => {
        const state = get();
        return state.summaries[conversationId];
      },

      getEnrichedContextForConversation: (conversationId: string) => {
        const state = get();
        const conversation = state.conversations[conversationId];
        if (!conversation) return [];

        const summary = state.summaries[conversationId];
        return getEnrichedContext(conversation, summary);
      },

      backgroundSummaryGeneration: (conversationId: string) => {
        // Generar resumen en background sin bloquear la UI
        setTimeout(() => {
          get()
            .generateSummaryForConversation(conversationId)
            .catch(console.error);
        }, 2000); // Esperar 2 segundos después del último mensaje
      },
    }),
    {
      name: "chat-store-v1",
      partialize: (state) => ({
        conversations: state.conversations,
        summaries: state.summaries,
        activeConversationId: state.activeConversationId,
        isSearchEnabled: state.isSearchEnabled,
      }),
    },
  ),
);
