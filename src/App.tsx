// App principal — punto de entrada de la UI
// Julio: si tocas este archivo revisa que el sidebar no rompa el layout en movil
import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { useChat } from './hooks/useChat';

export function App() {
  const {
    conversations,
    activeConversationId,
    activeConversation,
    isLoading,
    sidebarOpen,
    aiSettings,
    createNewConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    regenerateMessage,
    deleteMessage,
    toggleSidebar,
    clearAllConversations,
    updateAiSettings,
  } = useChat();

  // TODO: considerar mover showSettings al hook useChat para no tener estado suelto aqui
  const [showSettings, setShowSettings] = useState(false);
  // console.log('[App] activeConversationId:', activeConversationId, '| isLoading:', isLoading);

  return (
    <div className="relative flex h-[100dvh] w-screen overflow-hidden bg-[#0a0a0a] scanline-overlay">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeConversationId}
        isOpen={sidebarOpen}
        onNewChat={createNewConversation}
        onSelect={selectConversation}
        onDelete={deleteConversation}
        onClose={toggleSidebar}
        onClearAll={clearAllConversations}
      />

      {/* Chat area */}
      <ChatArea
        conversation={activeConversation}
        isLoading={isLoading}
        onSend={sendMessage}
        onToggleSidebar={toggleSidebar}
        onOpenSettings={() => setShowSettings(true)}
        onRegenerate={regenerateMessage}
        onDeleteMessage={deleteMessage}
        aiSettings={aiSettings}
      />

      {/* Modal de ajustes — se abre desde el Header */}
      {/* TODO: animacion de entrada/salida del modal, por ahora aparece de golpe */}
      {showSettings && (
        <SettingsModal
          settings={aiSettings}
          onSave={updateAiSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
