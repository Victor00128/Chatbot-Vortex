import React, { useEffect, useRef } from "react";
import { Sender, ChatMessage as Message } from "../types";
import ChatMessage from "./ChatMessage";
import TypingIndicator from "./TypingIndicator";
import ToolIndicator from "./ToolIndicator";
import VirtualizedMessageList from "./VirtualizedMessageList";
import { useChatStore } from "../store/chatStore";
import "../styles/animations.css";

const MessageList: React.FC = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    conversations,
    activeConversationId,
    isLoading,
    isSearching,
    currentTool,
    toolQuery,
  } = useChatStore();

  const activeConversation = activeConversationId
    ? conversations[activeConversationId]
    : null;
  const messages = activeConversation?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // No transformar el marcador de posición del mensaje de IA mientras transmite
  const visibleMessages = messages.filter(
    (msg) => !(msg.sender === Sender.AI && msg.text === "" && isLoading),
  );

  const showIndicator =
    isLoading &&
    visibleMessages.length > 0 &&
    visibleMessages[visibleMessages.length - 1]?.sender === Sender.User;

  // Determinar si un mensaje es el último o el último del usuario
  const isLastMessage = (messageId: string) => {
    const lastMessage = visibleMessages[visibleMessages.length - 1];
    return lastMessage?.id === messageId;
  };

  const isLastUserMessage = (messageId: string) => {
    const userMessages = visibleMessages.filter(
      (m) => m.sender === Sender.User,
    );
    const lastUserMessage = userMessages[userMessages.length - 1];
    return lastUserMessage?.id === messageId;
  };

  // virtualización para conversaciones largas (más de 50 mensajes)
  const shouldUseVirtualization = visibleMessages.length > 50;

  if (shouldUseVirtualization) {
    return <VirtualizedMessageList />;
  }

  // Renderizado normal para conversaciones cortas
  return (
    <div className="flex-1 overflow-y-auto p-6 smooth-scroll">
      {visibleMessages.map((msg) => (
        <div key={msg.id} className="animate-message-fade">
          <ChatMessage
            message={msg}
            isLastMessage={isLastMessage(msg.id)}
            isLastUserMessage={isLastUserMessage(msg.id)}
          />
        </div>
      ))}
      {showIndicator && (
        <div className="flex w-full my-2 justify-start animate-message-in">
          <div className="rounded-xl px-4 py-2.5 max-w-xl shadow-md bg-zinc-800 text-gray-100 rounded-bl-none transition-all">
            <div className="font-bold text-sm mb-1 text-gray-300">Bot</div>
            {isSearching && currentTool ? (
              <ToolIndicator tool={currentTool} query={toolQuery} />
            ) : (
              <TypingIndicator />
            )}
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
