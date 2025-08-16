import React, { useEffect } from "react";
import "katex/dist/katex.min.css";
import "./styles/animations.css";
import { useChatStore } from "./store/chatStore";
import Header from "./components/Header";
import MessageList from "./components/MessageList";
import ChatInput from "./components/ChatInput";
import Sidebar from "./components/Sidebar";
import Toast from "./components/Toast";

const App: React.FC = () => {
  const {
    conversations,
    activeConversationId,
    error,
    isSidebarOpen,
    toast,
    newConversation,
    setError,
    setFullscreen,
    hideToast,
  } = useChatStore();

  // Inicializar la aplicación con una conversación si no hay ninguna
  useEffect(() => {
    if (Object.keys(conversations).length === 0) {
      newConversation();
    }
  }, [conversations, newConversation]);

  // Manejar cambios de pantalla completa
  useEffect(() => {
    const onFullscreenChange = () =>
      setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [setFullscreen]);

  return (
    <div className="flex h-screen bg-[#121212] text-white font-sans overflow-hidden transition-all">
      <Sidebar />
      {isSidebarOpen && (
        <div
          onClick={() => useChatStore.getState().setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-20 md:hidden modal-backdrop backdrop-blur-sm"
          aria-hidden="true"
        />
      )}
      <div className="flex flex-col flex-1 relative min-w-0 transition-all">
        <Header />
        {error && (
          <div className="bg-red-900/50 border-t border-b border-red-600/30 text-red-100 p-3 text-center text-sm z-20 animate-message-in transition-all">
            <strong>Error:</strong> {error}
          </div>
        )}
        <MessageList />
        <ChatInput />
        {toast && (
          <div className="toast-enter">
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={hideToast}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
