import React, { useState, useRef, useEffect } from "react";
import { useChatStore } from "../store/chatStore";
import { PERSONALITIES } from "../types";
import { useChatTranslation } from "../src/i18n/useTranslation";
import "../styles/animations.css";

const ChatInput: React.FC = () => {
  const { t, getPlaceholder, getAttachmentText } = useChatTranslation();
  const { sendMessage, isLoading, conversations, activeConversationId } =
    useChatStore();
  const [input, setInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevLoadingRef = useRef(isLoading);

  const activeConversation = activeConversationId
    ? conversations[activeConversationId]
    : null;
  const personalityType = activeConversation
    ? PERSONALITIES[activeConversation.personality].type
    : "chat";

  // auto focus cuando termina la IA
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  // focus al cambiar chat
  useEffect(() => {
    if (activeConversationId && textareaRef.current) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [activeConversationId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || file) && !isLoading) {
      sendMessage(input.trim(), file ?? undefined);
      setInput("");
      setFile(null);
      // Resetea la altura del textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      // Se Devuelve el foco al textarea después de seleccionar archivo
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
    // Mantener focus visible durante la escritura
    if (!isFocused) setIsFocused(true);
  };

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = `${target.scrollHeight}px`;
  };

  const placeholderText = getPlaceholder(!!file);

  return (
    <div className="bg-zinc-900/70 backdrop-blur-sm p-2 sm:p-4 border-t border-zinc-700 transition-all">
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
        {file && (
          <div className="mb-2 flex items-center justify-between bg-zinc-800 p-2 rounded-lg text-sm min-w-0 animate-message-in">
            <span className="text-gray-300 break-all min-w-0 pr-2 flex-1">
              {getAttachmentText(file.name)}
            </span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setTimeout(() => textareaRef.current?.focus(), 100);
              }}
              className="text-red-500 hover:text-red-400 font-bold ml-2 flex-shrink-0 transition-colors hover-scale micro-bounce"
              aria-label={t("chatInput.removeAttachment")}
            >
              &times;
            </button>
          </div>
        )}
        {/* CORRECCIÓN DE UI MÓVIL: Se usa `items-end` para alinear la base y `flex-shrink-0` en los botones */}
        <div className="flex items-end gap-2">
          {personalityType !== "image" && (
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isLoading}
              className="p-3 text-gray-400 hover:text-white transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 focus-ring button-hover-lift micro-bounce ripple-effect"
              aria-label={t("chatInput.attachFile")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 transition-transform"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m18.375 12.739-7.693 7.693a4.5 4.5 0 0 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32m.009-.01-.01.01m5.699-9.941-7.81 7.81a1.5 1.5 0 0 0 2.122 2.122l7.81-7.81"
                />
              </svg>
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileChange}
            className="hidden"
            disabled={isLoading || personalityType === "image"}
            accept="image/*,application/pdf"
          />
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholderText}
            disabled={isLoading}
            className={`flex-1 bg-zinc-800 border border-zinc-700 rounded-2xl py-3 px-4 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 transition-all duration-300 disabled:opacity-50 resize-none max-h-40 overflow-y-auto focus-ring ${
              isFocused ? "ring-2 ring-blue-500/20 bg-zinc-750" : ""
            }`}
            autoComplete="off"
            rows={1}
            onKeyDown={handleTextareaKeyDown}
            onInput={handleTextareaInput}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && !file)}
            className="p-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-all duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex-shrink-0 focus-ring button-hover-lift micro-bounce ripple-effect"
            aria-label={t("chatInput.sendMessage")}
          >
            {isLoading ? (
              <div className="w-6 h-6 animate-spin">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </div>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6 transition-transform"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                />
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
