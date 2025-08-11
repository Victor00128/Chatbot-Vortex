import React, { useState, useRef } from 'react';
import { AIPersonalityConfig } from '../types';

interface ChatInputProps {
  onSendMessage: (message: string, file?: File) => void;
  isLoading: boolean;
  personalityType: AIPersonalityConfig['type'];
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, personalityType }) => {
  const [input, setInput] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || file) && !isLoading) {
      onSendMessage(input.trim(), file ?? undefined);
      setInput('');
      setFile(null);
      // Resetea la altura del textarea
      if (e.currentTarget instanceof HTMLFormElement) {
        const textarea = e.currentTarget.querySelector('textarea');
        if (textarea) {
          textarea.style.height = 'auto';
        }
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };
  
  const placeholderText = file ? "Pregunta sobre el archivo adjunto..." : "Escribe tu mensaje...";


  return (
    <div className="bg-zinc-900/70 backdrop-blur-sm p-2 sm:p-4 border-t border-zinc-700">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {file && (
            <div className="mb-2 flex items-center justify-between bg-zinc-800 p-2 rounded-lg text-sm min-w-0">
                <span className="text-gray-300 break-all min-w-0 pr-2 flex-1">Adjunto: {file.name}</span>
                <button 
                    type="button" 
                    onClick={() => setFile(null)} 
                    className="text-red-500 hover:text-red-400 font-bold ml-2 flex-shrink-0"
                    aria-label="Remove attachment"
                >
                    &times;
                </button>
            </div>
        )}
        {/* CORRECCIÓN DE UI MÓVIL: Se usa `items-end` para alinear en la base y `flex-shrink-0` en los botones */}
        <div className="flex items-end gap-2">
            {personalityType !== 'image' && (
                <button
                    type="button"
                    onClick={triggerFileSelect}
                    disabled={isLoading}
                    className="p-3 text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                    aria-label="Adjuntar archivo"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81" />
                    </svg>
                </button>
            )}
            <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                disabled={isLoading || personalityType === 'image'}
                accept="image/*,application/pdf"
            />
            <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={placeholderText}
                disabled={isLoading}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-300 disabled:opacity-50 resize-none max-h-40 overflow-y-auto"
                autoComplete="off"
                rows={1}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSubmit(e);
                    }
                }}
                onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = `${target.scrollHeight}px`;
                }}
            />
            <button
                type="submit"
                disabled={isLoading || (!input.trim() && !file)}
                className="bg-red-600 text-white rounded-full p-3 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Enviar mensaje"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6">
                    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                </svg>
            </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;