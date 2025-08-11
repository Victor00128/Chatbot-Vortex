
import React, { useEffect, useRef } from 'react';
import { Sender, ChatMessage as Message } from '../types';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
}

const MessageList: React.FC<MessageListProps> = React.memo(({ messages, isLoading }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Don't render the AI's message placeholder while streaming
  const visibleMessages = messages.filter(
    (msg) => !(msg.sender === Sender.AI && msg.text === '' && isLoading)
  );

  const showTypingIndicator = isLoading && visibleMessages.length > 0 && visibleMessages[visibleMessages.length - 1]?.sender === Sender.User;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {visibleMessages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {showTypingIndicator && (
         <div className="flex w-full my-2 justify-start">
           <div className="rounded-xl px-4 py-2.5 max-w-xl shadow-md bg-zinc-700 text-gray-100 rounded-bl-none">
             <div className="font-bold text-sm mb-1 text-red-400">Bot</div>
             <TypingIndicator />
           </div>
         </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;
