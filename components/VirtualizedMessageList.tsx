import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Sender, ChatMessage as Message } from '../types';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ToolIndicator from './ToolIndicator';
import { useChatStore } from '../store/chatStore';

// Altura estimada por mensaje (puede ajustarse según el diseño)
const ITEM_HEIGHT = 120;
const CONTAINER_HEIGHT = 'calc(100vh - 200px)'; // Se puede ajustar según el layout

interface MessageItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    messages: Message[];
    isLastMessage: (messageId: string) => boolean;
    isLastUserMessage: (messageId: string) => boolean;
  };
}

const MessageItem: React.FC<MessageItemProps> = ({ index, style, data }) => {
  const { messages, isLastMessage, isLastUserMessage } = data;
  const message = messages[index];

  return (
    <div style={style}>
      <div className="px-6 py-2">
        <ChatMessage
          key={message.id}
          message={message}
          isLastMessage={isLastMessage(message.id)}
          isLastUserMessage={isLastUserMessage(message.id)}
        />
      </div>
    </div>
  );
};

const VirtualizedMessageList: React.FC = () => {
  const listRef = useRef<List>(null);
  const {
    conversations,
    activeConversationId,
    isLoading,
    isSearching,
    currentTool,
    toolQuery
  } = useChatStore();

  const activeConversation = activeConversationId ? conversations[activeConversationId] : null;
  const messages = activeConversation?.messages || [];

  // Filtrar mensajes visibles
  const visibleMessages = useMemo(() =>
    messages.filter(
      (msg) => !(msg.sender === Sender.AI && msg.text === '' && isLoading)
    ), [messages, isLoading]
  );

  // Funciones para determinar si es el último mensaje
  const isLastMessage = useCallback((messageId: string) => {
    const lastMessage = visibleMessages[visibleMessages.length - 1];
    return lastMessage?.id === messageId;
  }, [visibleMessages]);

  const isLastUserMessage = useCallback((messageId: string) => {
    const userMessages = visibleMessages.filter(m => m.sender === Sender.User);
    const lastUserMessage = userMessages[userMessages.length - 1];
    return lastUserMessage?.id === messageId;
  }, [visibleMessages]);

  // Scroll automático al final cuando hay nuevos mensajes
  useEffect(() => {
    if (listRef.current && visibleMessages.length > 0) {
      listRef.current.scrollToItem(visibleMessages.length - 1, 'end');
    }
  }, [visibleMessages.length, isLoading]);

  // Datos para pasar al componente virtualizado
  const itemData = useMemo(() => ({
    messages: visibleMessages,
    isLastMessage,
    isLastUserMessage
  }), [visibleMessages, isLastMessage, isLastUserMessage]);

  const showIndicator = isLoading && visibleMessages.length > 0 &&
    visibleMessages[visibleMessages.length - 1]?.sender === Sender.User;

  // renderizado normal para mejor UX (si es que hay pocos mensajes)
  if (visibleMessages.length < 10) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        {visibleMessages.map((msg) => (
          <ChatMessage
            key={msg.id}
            message={msg}
            isLastMessage={isLastMessage(msg.id)}
            isLastUserMessage={isLastUserMessage(msg.id)}
          />
        ))}
        {showIndicator && (
          <div className="flex w-full my-2 justify-start">
            <div className="rounded-xl px-4 py-2.5 max-w-xl shadow-md bg-zinc-800 text-gray-100 rounded-bl-none animate-message-in">
              <div className="font-bold text-sm mb-1 text-gray-300">Bot</div>
              {isSearching && currentTool ? (
                <ToolIndicator tool={currentTool} query={toolQuery} />
              ) : (
                <TypingIndicator />
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="flex-1 relative">
        <List
          ref={listRef}
          height={window.innerHeight - 200} 
          itemCount={visibleMessages.length}
          itemSize={ITEM_HEIGHT}
          itemData={itemData}
          className="scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-transparent"
        >
          {MessageItem}
        </List>
      </div>

      {/* Indicador del typing/tool fuera de la lista virtualizada */}
      {showIndicator && (
        <div className="px-6 pb-4">
          <div className="flex w-full my-2 justify-start">
            <div className="rounded-xl px-4 py-2.5 max-w-xl shadow-md bg-zinc-800 text-gray-100 rounded-bl-none animate-message-in">
              <div className="font-bold text-sm mb-1 text-gray-300">Bot</div>
              {isSearching && currentTool ? (
                <ToolIndicator tool={currentTool} query={toolQuery} />
              ) : (
                <TypingIndicator />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualizedMessageList;
