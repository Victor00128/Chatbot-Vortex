import React, { useState, useEffect, useCallback } from 'react';
import type { ChatSession } from '@google/generative-ai';
import 'katex/dist/katex.min.css';
import { Sender, ChatMessage, AIPersonality, PERSONALITIES, Conversation } from './types';
import { startChat, internetSearchTool, realTimeClockTool } from './services/geminiService';
import { analyzeFileWithBackend } from './services/backendService';
import { performSearch } from './services/searchService';
import { getOpenAIStream } from './services/openaiService';
import { toastEvents } from './utils/toast';
import Header from './components/Header';
import MessageList from './components/MessageList';
import ChatInput from './components/ChatInput';
import Sidebar from './components/Sidebar';

const HISTORY_KEY = 'chatHistory_v5';
const USER_PROFILE_UPDATE_INTERVAL = 3;

const App: React.FC = () => {
  const [conversations, setConversations] = useState<Record<string, Conversation>>({});
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [chat, setChat] = useState<ChatSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(!!document.fullscreenElement);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSearchEnabled, setIsSearchEnabled] = useState<boolean>(true);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;

  const handleApiError = (e: unknown, context: string) => {
    let errorMessage = `Error en ${context}: `;
    if (e instanceof Error) errorMessage += e.message;
    else errorMessage += 'Ocurrió un error desconocido.';
    console.error(e);
    setError(errorMessage);
  };
  
  const handleNewConversation = useCallback((p?: AIPersonality) => {
      const newPersonality = p || 'flash';
      const config = PERSONALITIES[newPersonality];
      const newId = Date.now().toString();
      const welcomeMessage: ChatMessage = { id: 'initial-message', sender: Sender.AI, text: config.welcomeMessage };
      const newConversation: Conversation = { id: newId, title: 'Nueva Conversación', messages: [welcomeMessage], lastModified: Date.now(), personality: newPersonality };
      setConversations(prev => ({ ...prev, [newId]: newConversation }));
      setActiveConversationId(newId);
      toastEvents.dispatch('show', 'Nueva conversación iniciada');
  }, []);

  useEffect(() => {
    try {
      const savedHistoryJSON = localStorage.getItem(HISTORY_KEY);
      const savedConversations = savedHistoryJSON ? JSON.parse(savedHistoryJSON) : {};
      if (Object.keys(savedConversations).length > 0) {
        setConversations(savedConversations);
        const sortedConvos = Object.values(savedConversations).sort((a: any, b: any) => b.lastModified - a.lastModified);
        setActiveConversationId(sortedConvos[0].id);
      } else {
        handleNewConversation();
      }
    } catch (e) {
      localStorage.removeItem(HISTORY_KEY);
      handleNewConversation();
    }
  }, [handleNewConversation]);

  useEffect(() => {
    if (Object.keys(conversations).length > 0) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(conversations));
    }
  }, [conversations]);

  useEffect(() => {
    if (!activeConversation || PERSONALITIES[activeConversation.personality].provider !== 'google') {
      setChat(null);
      return;
    }
    setError(null);
    try {
      const config = PERSONALITIES[activeConversation.personality];
      const apiHistory = activeConversation.messages
        .filter(m => m.id !== 'initial-message' && !m.fileInfo)
        .map(msg => ({ role: msg.sender === Sender.User ? 'user' : 'model', parts: [{ text: msg.text }] }));

      const tools: any[] = [];
      if (isSearchEnabled) {
        tools.push(internetSearchTool);
      }
      tools.push(realTimeClockTool); // El reloj siempre está disponible

      const chatSession = startChat(config.systemInstruction, config.model, apiHistory, tools);
      setChat(chatSession);
    } catch (e) {
      handleApiError(e, 'conversation switch');
    }
  }, [activeConversationId, activeConversation?.personality]);

  const handlePersonalityChange = (newPersonality: AIPersonality) => {
    if (!activeConversationId) {
        handleNewConversation(newPersonality);
        return;
    }
    if (conversations[activeConversationId]?.personality !== newPersonality) {
      setConversations(prev => ({
        ...prev, [activeConversationId]: { ...prev[activeConversationId], personality: newPersonality, lastModified: Date.now() }
      }));
      toastEvents.dispatch('show', `Modelo cambiado a ${PERSONALITIES[newPersonality].name}`);
    }
  };

  const handleSendMessage = useCallback(async (text: string, file?: File) => {
    if ((!text && !file) || !activeConversationId) return;

    // --- PASO 3: IA CONVERSACIONAL (RISAS) ---
    const laughExpressions = [
      /^j(a|i)+j(a|i)+j(a|i)*$/i, // jajaja, jijiji, etc.
      /^j+$/i, // jjjjj
      /^x[d]+$/i, // xD, xDD, etc.
      /^lo+l$/i, // lol, lool, etc.
      /😂/,
      /🤣/
    ];
    const isLaugh = laughExpressions.some(regex => regex.test(text.trim()));

    if (isLaugh && !file) {
      const userMessage: ChatMessage = { id: Date.now().toString(), sender: Sender.User, text };

      const lastAiMessage = conversations[activeConversationId]?.messages
        .filter(m => m.sender === Sender.AI)
        .pop()?.text.toLowerCase() || '';

      const wasJoke = lastAiMessage.includes('chiste');

      const baseResponses = [
        "¡Me alegro de que te haya gustado! 😄",
        "¡Genial, sabía que te haría reír!",
        "¡Perfecto! ¿En qué más puedo ayudarte?",
      ];

      const jokeFollowUpResponse = "¡Qué bueno que te gustó! ¿Te cuento otro?";

      let aiResponseText: string;

      if (wasJoke && Math.random() > 0.5) {
        aiResponseText = jokeFollowUpResponse;
      } else {
        aiResponseText = baseResponses[Math.floor(Math.random() * baseResponses.length)];
      }

      const aiMessage: ChatMessage = { id: (Date.now() + 1).toString(), sender: Sender.AI, text: aiResponseText };

      setConversations(prev => {
        const updatedConvo = { ...prev[activeConversationId] };
        updatedConvo.messages.push(userMessage, aiMessage);
        updatedConvo.lastModified = Date.now();
        return { ...prev, [activeConversationId]: updatedConvo };
      });
      return; // Evita que el mensaje de risa se envíe a la IA
    }
    // --- FIN PASO 3 ---

    const userMessage: ChatMessage = {
      id: Date.now().toString(), sender: Sender.User, text,
      fileInfo: file ? { name: file.name, type: file.type, size: file.size } : undefined,
      fileData: file,
    };
    
    setIsLoading(true);
    setError(null);

    const updatedConvo = { ...conversations[activeConversationId] };
    updatedConvo.messages.push(userMessage);
    if (!updatedConvo.messages.some(m => m.sender === Sender.User && m.id !== userMessage.id) && text) {
        updatedConvo.title = text.substring(0, 40);
    }
    const aiMessageId = (Date.now() + 1).toString();
    updatedConvo.messages.push({ id: aiMessageId, sender: Sender.AI, text: '' });
    setConversations(prev => ({ ...prev, [activeConversationId]: updatedConvo }));

    try {
      const processStream = async (stream: AsyncGenerator<any>) => {
        let aiResponseText = '';
        let lastUpdateTime = 0;
        const UPDATE_INTERVAL_MS = 100;

        const updateDisplay = (text: string) => {
            setConversations(prev => {
                const activeConvo = prev[activeConversationId!];
                if (!activeConvo) return prev;
                const lastMessage = activeConvo.messages[activeConvo.messages.length - 1];
                if (!lastMessage || lastMessage.id !== aiMessageId || lastMessage.text === text) return prev;
                const updatedMessages = activeConvo.messages.map(msg => msg.id === aiMessageId ? { ...msg, text } : msg);
                return { ...prev, [activeConversationId!]: { ...activeConvo, messages: updatedMessages, lastModified: Date.now() } };
            });
        };

        for await (const chunk of stream) {
            let chunkText = '';
            // Adapt to both Gemini and OpenAI stream formats
            if (typeof chunk.text === 'function') {
                chunkText = chunk.text(); // Gemini format
            } else if (chunk.type === 'text') {
                chunkText = chunk.value; // New OpenAI format
            }

            if (chunkText) {
                aiResponseText += chunkText;
                const now = Date.now();
                if (now - lastUpdateTime > UPDATE_INTERVAL_MS) {
                    updateDisplay(aiResponseText);
                    lastUpdateTime = now;
                }
            }
        }
        updateDisplay(aiResponseText); // Final update
      };
      
      const config = PERSONALITIES[updatedConvo.personality];

      if (config.provider === 'openai') {
        const history = updatedConvo.messages.slice(0, -1); // Include user message

        // 1. Definir herramientas para OpenAI
        const tools = [
          {
            type: 'function',
            function: {
              name: 'internetSearch',
              description: 'Busca en internet información en tiempo real. Úsalo para eventos recientes, precios, etc.',
              parameters: {
                type: 'object',
                properties: { query: { type: 'string', description: 'La consulta de búsqueda.' } },
                required: ['query'],
              },
            },
          },
          {
            type: 'function',
            function: {
              name: 'getCurrentTime',
              description: 'Obtiene la fecha y hora actual.',
              parameters: { type: 'object', properties: {} },
            },
          },
        ];

        // 2. Llamada inicial a la API
        const stream = getOpenAIStream(config, history.slice(0, -1), userMessage, tools);

        let aiResponseText = '';
        let toolCalls: any[] = [];

        // 3. Procesar el stream de respuesta
        for await (const chunk of stream) {
          if (chunk.type === 'text') {
            aiResponseText += chunk.value;
            updateDisplay(aiResponseText); // Reutilizamos la función de actualización
          } else if (chunk.type === 'tool_call') {
            toolCalls = chunk.value;
          }
        }
        updateDisplay(aiResponseText); // Final update for any remaining text

        // 4. Si hay llamadas a herramientas, ejecutarlas
        if (toolCalls.length > 0) {
          setIsSearching(true);
          const toolResults = await Promise.all(toolCalls.map(async (call) => {
            let content = '';
            try {
              const args = JSON.parse(call.function.arguments);
              if (call.function.name === 'internetSearch') {
                const searchResults = await performSearch(args.query);
                content = JSON.stringify(searchResults.map(r => ({ title: r.title, snippet: r.snippet, source: r.link })));
              } else if (call.function.name === 'getCurrentTime') {
                const now = new Date();
                content = now.toLocaleString('es-ES', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                });
              }
            } catch (e) {
              console.error("Error executing OpenAI tool:", e);
              content = JSON.stringify({ error: "La herramienta falló" });
            }
            return {
              role: 'tool',
              tool_call_id: call.id,
              content,
            };
          }));

          // 5. Enviar resultados de vuelta a la API
          const finalStream = getOpenAIStream(config, history, userMessage, tools, toolResults);
          setIsSearching(false);
          await processStream(finalStream); // processStream adaptado para el nuevo output
        }

      } else {
        if (file) {
          const result = await analyzeFileWithBackend(text, file, config.systemInstruction);
          await processStream(result.stream);
        } else {
          if (!chat) throw new Error("Chat de Gemini no inicializado.");

          let promptToSend = text;
          // The proactive response logic is now implicitly handled by the AI's tool-calling ability.
          // We can remove the explicit regex checks for "crea una web", etc.,
          // as the model itself will decide when to be proactive if prompted correctly.
          // The system instructions for the personalities can be enhanced to guide this behavior.

          const result = await chat.sendMessageStream(promptToSend);

          let aiResponseText = '';
          let lastUpdateTime = 0;
          const UPDATE_INTERVAL_MS = 100;

          const updateDisplay = (text: string) => {
            setConversations(prev => {
                const activeConvo = prev[activeConversationId!];
                if (!activeConvo) return prev;

                const lastMessage = activeConvo.messages[activeConvo.messages.length - 1];
                if (!lastMessage || lastMessage.id !== aiMessageId) {
                    return prev;
                }

                if (lastMessage.text === text) {
                    return prev;
                }

                const updatedMessages = activeConvo.messages.map(msg =>
                    msg.id === aiMessageId ? { ...msg, text: text } : msg
                );

                return {
                    ...prev,
                    [activeConversationId!]: { ...activeConvo, messages: updatedMessages, lastModified: Date.now() }
                };
            });
          };

          for await (const chunk of result.stream) {
            const functionCalls = chunk.functionCalls();
            if (functionCalls && functionCalls.length > 0) {
              updateDisplay(aiResponseText); // Finalize previous text
              setIsSearching(true);

              const toolPromises = functionCalls.map(async (call) => {
                try {
                  if (call.name === 'internetSearch') {
                    const query = call.args.query;
                    const searchResults = await performSearch(query as string);
                    const response = searchResults.map(r => ({
                      title: r.title,
                      snippet: r.snippet,
                      source: r.link,
                    }));
                    return { functionResponse: { name: 'internetSearch', response: { results: response } } };
                  } else if (call.name === 'getCurrentTime') {
                    const now = new Date();
                    const formattedTime = now.toLocaleString('es-ES', {
                      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
                      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
                    });
                    return { functionResponse: { name: 'getCurrentTime', response: { currentTime: formattedTime } } };
                  } else {
                    // BUG FIX: Handle unknown tools to prevent response count mismatch.
                    return { functionResponse: { name: call.name, response: { error: `La herramienta '${call.name}' no es conocida o no está implementada.` } } };
                  }
                } catch (e) {
                  console.error(`Error during tool call ${call.name}:`, e);
                  return { functionResponse: { name: call.name, response: { error: "La herramienta falló durante la ejecución." } } };
                }
              });

              const responses = await Promise.all(toolPromises);

              setIsSearching(false);
              if (responses.length > 0) {
                const toolResultStream = await chat.sendMessageStream(responses as any);
                await processStream(toolResultStream.stream);
              }

              return; // Tool call turn is complete
            }

            // If we are here, it's a regular text chunk.
            aiResponseText += chunk.text();
            const now = Date.now();
            if (now - lastUpdateTime > UPDATE_INTERVAL_MS) {
              updateDisplay(aiResponseText);
              lastUpdateTime = now;
            }
          }

          // If the loop completes without any function calls, do a final update.
          updateDisplay(aiResponseText);
        }
      }
    } catch (e) {
        handleApiError(e, 'envío de mensaje');
        setConversations(prev => {
            const convo = { ...prev[activeConversationId] };
            convo.messages = convo.messages.slice(0, -2);
            return { ...prev, [activeConversationId]: convo };
        });
    } finally {
      setIsLoading(false);
    }
  }, [chat, activeConversationId, conversations]);

  // --- FUNCIÓN CORREGIDA / RESTAURADA ---
  const handleDeleteConversation = (idToDelete: string) => {
    if (Object.keys(conversations).length <= 1) {
      toastEvents.dispatch('show', 'No se puede eliminar la última conversación.');
      return;
    }

    const newConversations = { ...conversations };
    delete newConversations[idToDelete];
    setConversations(newConversations);

    if (activeConversationId === idToDelete) {
      const remainingConvos = Object.values(newConversations).sort((a: any, b: any) => b.lastModified - a.lastModified);
      setActiveConversationId(remainingConvos.length > 0 ? remainingConvos[0].id : null);
    }
    toastEvents.dispatch('show', 'Conversación eliminada');
  };

  // --- FUNCIÓN CORREGIDA / RESTAURADA ---
  const handleDownloadConversation = (idToDownload: string) => {
      const conversation = conversations[idToDownload];
      if (!conversation) return;
      const fileContent = `Conversación: ${conversation.title}\n` +
                          `Personalidad IA: ${PERSONALITIES[conversation.personality].name}\n` +
                          `Fecha: ${new Date(conversation.lastModified).toLocaleString()}\n\n` +
                          '---\n\n' +
                          conversation.messages.filter(m => m.id !== 'initial-message').map(msg => {
                              const sender = msg.sender === Sender.User ? 'Tú' : 'Bot';
                              const fileInfo = msg.fileInfo ? `[Archivo Adjunto: ${msg.fileInfo.name}]` : '';
                              return `${sender}:\n${fileInfo ? fileInfo + '\n' : ''}${msg.text}\n`;
                          }).join('\n---\n\n');
      const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizedTitle = conversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      link.download = `conversacion_${sanitizedTitle || 'chat'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toastEvents.dispatch('show', 'Conversación descargada');
  };

  // --- OTRAS FUNCIONES (sin cambios) ---
  const handleConversationSelect = (id: string) => { if (id !== activeConversationId) { setActiveConversationId(id); setIsSidebarOpen(false); }};
  const handleToggleFullscreen = () => { if (!document.fullscreenElement) { document.documentElement.requestFullscreen().catch(console.error); } else { document.exitFullscreen(); }};
  const handleToggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const handleRenameConversation = (conversationId: string, newTitle: string) => {
    if (!newTitle.trim()) return toastEvents.dispatch('show', 'El título no puede estar vacío');
    setConversations(prev => ({ ...prev, [conversationId]: { ...prev[conversationId], title: newTitle.trim(), lastModified: Date.now() } }));
    toastEvents.dispatch('show', 'Chat renombrado');
  };
  useEffect(() => {
    const handleShowToast = (e: Event) => {
        const detail = (e as CustomEvent).detail;
        setToast(detail);
        setTimeout(() => setToast(null), 3000);
    };
    toastEvents.addEventListener('show', handleShowToast);
    return () => toastEvents.removeEventListener('show', handleShowToast);
  }, []);
  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);
  const canRetry = !isLoading && activeConversation?.personality === 'flash' && activeConversation?.messages.some(m => m.sender === Sender.User);

  return (
    <div className="flex h-screen bg-[#121212] text-white font-sans overflow-hidden">
      <Sidebar 
        conversations={Object.values(conversations)}
        activeConversationId={activeConversationId}
        onConversationSelect={handleConversationSelect}
        onNewConversation={() => handleNewConversation()}
        isLoading={isLoading}
        isOpen={isSidebarOpen}
        onRenameConversation={handleRenameConversation}
        onDeleteConversation={handleDeleteConversation}
        onDownloadConversation={handleDownloadConversation}
      />
       {isSidebarOpen && <div onClick={() => setIsSidebarOpen(false)} className="fixed inset-0 bg-black/60 z-20 md:hidden" aria-hidden="true" />}
      <div className="flex flex-col flex-1 relative min-w-0">
        <Header 
          currentPersonality={activeConversation?.personality || 'flash'} 
          onPersonalityChange={handlePersonalityChange} 
          isLoading={isLoading}
          onRetry={() => { /* Lógica de reintento aquí si la necesitas */ }}
          canRetry={canRetry}
          onToggleFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
          onToggleSidebar={handleToggleSidebar}
          isSearchEnabled={isSearchEnabled}
          onToggleSearch={() => setIsSearchEnabled(prev => !prev)}
        />
        {error && <div className="bg-red-900/50 border-t border-b border-red-600/30 text-red-100 p-3 text-center text-sm z-20"><strong>Error:</strong> {error}</div>}
        <MessageList messages={activeConversation?.messages || []} isLoading={isLoading || isSearching} isSearching={isSearching} />
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} personalityType={activeConversation?.personality ? PERSONALITIES[activeConversation.personality].type : 'chat'} />
        {toast && <div className="absolute bottom-24 right-5 bg-green-600 text-white py-2 px-4 rounded-lg shadow-lg z-50 transition-transform transform-gpu animate-fade-in-out">{toast}</div>}
      </div>
    </div>
  );
};

export default App;