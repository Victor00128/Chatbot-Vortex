import { useEffect, useRef } from 'react';
import type { Conversation, FileAttachment, AISettings } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatInput } from './ChatInput';
import { WelcomeScreen } from './WelcomeScreen';
import { Header } from './Header';

interface ChatAreaProps {
  conversation: Conversation | null;
  isLoading: boolean;
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onRegenerate: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  aiSettings: AISettings;
}

export function ChatArea({
  conversation,
  isLoading,
  onSend,
  onToggleSidebar,
  onOpenSettings,
  onRegenerate,
  onDeleteMessage,
  aiSettings,
}: ChatAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation?.messages, isLoading]);

  const hasMessages = conversation && conversation.messages.length > 0;

  return (
    <div className="flex w-full flex-1 flex-col bg-[#0a0a0a] matrix-bg min-w-0">
      <Header
        onToggleSidebar={onToggleSidebar}
        onOpenSettings={onOpenSettings}
        conversationTitle={conversation?.title}
        aiSettings={aiSettings}
      />

      {/* Messages Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        {!hasMessages ? (
          <WelcomeScreen
            onSuggestionClick={(text) => onSend(text)}
            aiSettings={aiSettings}
            onOpenSettings={onOpenSettings}
          />
        ) : (
          <div className="mx-auto max-w-3xl w-full">
            {conversation.messages
              .filter((m) => !m.deleted)
              .map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onRegenerate={
                    message.role === 'assistant' ? onRegenerate : undefined
                  }
                  onDelete={
                    message.role === 'assistant' ? onDeleteMessage : undefined
                  }
                  isLoading={isLoading}
                />
              ))}
            {isLoading && <TypingIndicator />}
            <div className="h-4" />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={onSend} isLoading={isLoading} />
    </div>
  );
}
