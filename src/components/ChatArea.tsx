import { useEffect, useRef, useCallback } from 'react';
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
  const shouldStickToBottomRef = useRef(true);
  const lastConversationIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const handleScroll = () => {
      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldStickToBottomRef.current = distanceFromBottom < 96;
    };

    handleScroll();
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    const conversationId = conversation?.id ?? null;
    const conversationChanged = lastConversationIdRef.current !== conversationId;

    if (conversationChanged) {
      lastConversationIdRef.current = conversationId;
      shouldStickToBottomRef.current = true;
      scrollToBottom();
      return;
    }

    if (shouldStickToBottomRef.current) {
      scrollToBottom();
    }
  }, [conversation?.id, conversation?.messages.length, isLoading, scrollToBottom]);

  const hasMessages = conversation && conversation.messages.length > 0;

  return (
    <div className="flex w-full flex-1 flex-col bg-[#0a0a0a] matrix-bg min-w-0">
      <Header
        onToggleSidebar={onToggleSidebar}
        onOpenSettings={onOpenSettings}
        conversationTitle={conversation?.title}
        aiSettings={aiSettings}
      />

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

      <ChatInput onSend={onSend} isLoading={isLoading} />
    </div>
  );
}
