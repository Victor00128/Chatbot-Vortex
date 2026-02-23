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

  const [showSettings, setShowSettings] = useState(false);

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

      {/* Settings Modal */}
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
