import React, { useState } from 'react';
import { Sender, ChatMessage as Message } from '../types';
import FormattedMessage from './FormattedMessage';
import FileIcon from './FileIcon'; // <-- Importamos nuestro nuevo componente
import { useChatStore } from '../store/chatStore';

interface ChatMessageProps {
  message: Message;
  isLastMessage?: boolean;
  isLastUserMessage?: boolean;
}

/**
 * React.memo (optimización manual)
 */
const ChatMessage: React.FC<ChatMessageProps> = React.memo(({ message, isLastMessage = false, isLastUserMessage = false }) => {
  const isUser = message.sender === Sender.User;
  const { 
    editingMessageId, 
    startEditingMessage, 
    stopEditingMessage, 
    editAndResendMessage, 
    regenerateLastResponse, 
    isLoading 
  } = useChatStore();
  
  const isEditing = editingMessageId === message.id;
  
  // diseño para optimizar. 
  const [localEditText, setLocalEditText] = useState(message.text);

  const handleEditClick = () => {
    if (isUser && isLastUserMessage) {
      startEditingMessage(message.id, message.text);
      setLocalEditText(message.text); 
    }
  };

  const handleEditSave = () => {
    // Validacion del texto para cuando haya cambiado, para evitar llamadas innecesarias a la API.
    if (localEditText.trim() && localEditText !== message.text) {
      editAndResendMessage(message.id, localEditText);
    } else {
      stopEditingMessage(); 
    }
  };

  const handleEditCancel = () => {
    setLocalEditText(message.text); 
    stopEditingMessage();
  };

  const handleRegenerate = () => {
    regenerateLastResponse();
  };

  const containerClasses = `flex w-full my-1 ${isUser ? 'justify-end' : 'justify-start'}`;
  
  const bubbleClasses = `rounded-xl px-4 py-2.5 max-w-xl shadow-md flex flex-col ${
    isUser
      ? 'bg-blue-500 text-white rounded-br-none'
      : 'bg-zinc-800 text-gray-100 rounded-bl-none'
  }`;
  
  const speaker = isUser ? 'Tú' : 'Bot';
  const speakerColor = isUser ? 'text-blue-200' : 'text-gray-300';

  return (
    <div className={containerClasses}>
      <div className={`${bubbleClasses} animate-message-in group relative`}>
        <div className={`font-bold text-sm mb-1 ${speakerColor}`}>{speaker}</div>
        
        {/* Bloque de información del archivo adjunto */}
        {message.fileInfo && (
           <div className="flex items-center gap-3 rounded-lg bg-black/20 p-2 my-1 border border-white/10">
              <div className="flex-shrink-0">
                {/* componente centralizado. */}
                <FileIcon fileType={message.fileInfo.type} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-sm font-medium break-all text-white">{message.fileInfo.name}</span>
                <span className="text-xs text-gray-400">{(message.fileInfo.size / 1024).toFixed(2)} KB</span>
              </div>
           </div>
        )}

        {/* Lógica para mostrar el textarea de edición o el mensaje formateado */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={localEditText}
              onChange={(e) => setLocalEditText(e.target.value)}
              className="w-full bg-black/20 border border-blue-300 rounded-md p-2 text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
              rows={Math.max(2, localEditText.split('\n').length)}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditSave}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={handleEditCancel}
                className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            {message.text && <FormattedMessage text={message.text} />}
            
            {/* Los botones de acción aparecen al pasar el ratón */}
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              {isUser && isLastUserMessage && (
                <button
                  onClick={handleEditClick}
                  className="p-1 bg-black/20 rounded hover:bg-black/40 transition-colors"
                  title="Editar mensaje"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                  </svg>
                </button>
              )}
              
              {!isUser && isLastMessage && (
                <button
                  onClick={handleRegenerate}
                  disabled={isLoading}
                  className="p-1 bg-black/20 rounded hover:bg-black/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Regenerar respuesta"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.667 0l3.181-3.183m-4.991-2.691v4.992m0 0h-4.992m4.992 0-3.181-3.183a8.25 8.25 0 0 0-11.667 0L2.985 16.953" />
                  </svg>
                </button>
              )}
            </div>
          </>
        )}
        
        {/* Bloque para imágenes generadas */}
        {message.imageUrl && (
          <div className="mt-2">
            <img 
              src={`data:image/jpeg;base64,${message.imageUrl}`} 
              alt="Generated by AI" 
              className="rounded-lg w-full h-auto"
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default ChatMessage;