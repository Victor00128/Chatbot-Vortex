import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { SettingsModal } from './components/SettingsModal';
import { NoticeBanner } from './components/NoticeBanner';
import { ControlDock } from './components/ControlDock';
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
    notice,
    dismissNotice,
    cancelGeneration,
    exportConversations,
  } = useChat();

  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="relative flex h-[100dvh] w-screen overflow-hidden bg-[#0a0a0a] scanline-overlay">
      <div className="pointer-events-none absolute left-1/2 top-3 z-50 w-[calc(100%-1.5rem)] -translate-x-1/2 px-3 sm:top-4 sm:w-auto sm:max-w-[calc(100%-2rem)] sm:px-0">
        <NoticeBanner notice={notice} onDismiss={dismissNotice} />
      </div>

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

      {showSettings && (
        <SettingsModal
          settings={aiSettings}
          onSave={updateAiSettings}
          onClose={() => setShowSettings(false)}
          onExportJson={() => exportConversations('json')}
          onExportMarkdown={() => exportConversations('markdown')}
          hasConversations={conversations.length > 0}
        />
      )}

      <ControlDock
        hasConversations={conversations.length > 0}
        isLoading={isLoading}
        onStop={cancelGeneration}
        onExportJson={() => exportConversations('json')}
        onExportMarkdown={() => exportConversations('markdown')}
      />
    </div>
  );
}
