
import React, { useEffect, useRef } from 'react';
import { Sender, ChatMessage as Message } from '../types';
import ChatMessage from './ChatMessage';
import TypingIndicator from './TypingIndicator';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  isSearching?: boolean;
}

const MessageList: React.FC<MessageListProps> = React.memo(({ messages, isLoading, isSearching }) => {
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

  const showIndicator = isLoading && visibleMessages.length > 0 && visibleMessages[visibleMessages.length - 1]?.sender === Sender.User;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {visibleMessages.map((msg) => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
      {showIndicator && (
         <div className="flex w-full my-2 justify-start">
           <div className="rounded-xl px-4 py-2.5 max-w-xl shadow-md bg-zinc-800 text-gray-100 rounded-bl-none animate-message-in">
             <div className="font-bold text-sm mb-1 text-gray-300">Bot</div>
             {isSearching ? (
                <div className="flex items-center gap-2 text-sm text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 animate-spin">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691v4.992m0 0h-4.992m4.992 0-3.181-3.183a8.25 8.25 0 0 0-11.667 0L2.985 16.953" />
                    </svg>
                    <span>Buscando en internet...</span>
                </div>
             ) : (
                <TypingIndicator />
             )}
           </div>
         </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
});

export default MessageList;
