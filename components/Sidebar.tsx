
import React, { useState, useRef, useEffect } from 'react';
import { Conversation } from '../types';
import ConversationMenu from './ConversationMenu';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  isLoading: boolean;
  isOpen: boolean;
  onDeleteConversation: (id: string) => void;
  onDownloadConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  onNewConversation,
  isLoading,
  isOpen,
  onDeleteConversation,
  onDownloadConversation,
  onRenameConversation,
}) => {
  const [menuOpenForId, setMenuOpenForId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const renameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingId]);

  const handleRenameStart = (convo: Conversation) => {
    setRenamingId(convo.id);
    setTempTitle(convo.title);
    setMenuOpenForId(null);
  };

  const handleRenameConfirm = () => {
    if (renamingId && tempTitle.trim()) {
      onRenameConversation(renamingId, tempTitle);
    }
    setRenamingId(null);
  };

  const handleMenuToggle = (e: React.MouseEvent, convoId: string) => {
      e.stopPropagation();
      setMenuOpenForId(prevId => (prevId === convoId ? null : convoId));
  }

  return (
    <aside className={`
      fixed inset-y-0 left-0 z-30 w-64
      bg-[#1C1C1C] border-r border-zinc-800
      transform transition-transform duration-300 ease-in-out
      md:relative md:translate-x-0 md:flex-shrink-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="w-full h-full flex flex-col overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex-shrink-0">
          <button
            onClick={onNewConversation}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold rounded-lg px-4 py-2 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-zinc-900 transition-colors duration-200 disabled:bg-zinc-700 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Nuevo Chat
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          <span className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Historial</span>
          <ul>
            {conversations.sort((a, b) => b.lastModified - a.lastModified).map((convo) => (
              <li key={convo.id} className="relative group/item">
                {renamingId === convo.id ? (
                    <input
                      ref={renameInputRef}
                      type="text"
                      value={tempTitle}
                      onChange={(e) => setTempTitle(e.target.value)}
                      onBlur={handleRenameConfirm}
                      onKeyDown={(e) => e.key === 'Enter' && handleRenameConfirm()}
                      className="w-full bg-zinc-800 border border-blue-500 rounded-md text-sm font-medium px-2 py-2 text-white outline-none"
                    />
                ) : (
                    <div className={`flex items-center rounded-md ${activeConversationId === convo.id ? 'bg-zinc-800' : 'hover:bg-zinc-800/50'}`}>
                        <a
                        href="#"
                        onClick={(e) => {
                            e.preventDefault();
                            if (!isLoading) onConversationSelect(convo.id);
                        }}
                        className={`flex-1 p-2 text-sm font-medium transition-colors duration-150 truncate ${
                            activeConversationId === convo.id
                            ? 'text-white'
                            : 'text-gray-400 group-hover/item:text-white'
                        } ${isLoading ? 'cursor-not-allowed' : ''}`}
                        aria-current={activeConversationId === convo.id ? 'page' : undefined}
                        >
                        <span className="truncate">{convo.title}</span>
                        </a>
                        <button
                            onClick={(e) => handleMenuToggle(e, convo.id)}
                            className="p-1 mr-1 rounded-full text-gray-400 hover:bg-zinc-700 opacity-0 group-hover/item:opacity-100 focus:opacity-100 transition-opacity"
                            aria-label="Conversation options"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/></svg>
                        </button>
                    </div>
                )}

                {menuOpenForId === convo.id && (
                    <ConversationMenu
                    onClose={() => setMenuOpenForId(null)}
                    onRename={() => handleRenameStart(convo)}
                    onDownload={() => onDownloadConversation(convo.id)}
                    onDelete={() => onDeleteConversation(convo.id)}
                    />
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
