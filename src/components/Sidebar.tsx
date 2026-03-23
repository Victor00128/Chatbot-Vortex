import { useState, useCallback, useEffect } from 'react';
import {
  AlertTriangle, Eraser, FileJson, FileText, MessageSquarePlus,
  MoreVertical, Skull, Terminal, Trash2, X,
} from 'lucide-react';
import type { Conversation } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onExportConversation: (id: string, format: 'json' | 'markdown') => void;
  onClose: () => void;
  onClearAll: () => void;
}

function formatDate(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
}

function ConfirmModal({ message, onConfirm, onCancel }: {
  message: string; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-[280px] rounded-xl border border-[#ff004044] bg-[#0a0e12] p-4 shadow-[0_0_30px_#ff004022]">
        <div className="mb-3 flex items-center gap-2 text-[#ff0040]">
          <AlertTriangle size={16} />
          <span className="text-xs font-bold tracking-wider">CONFIRMAR</span>
        </div>
        <p className="mb-4 text-[11px] leading-relaxed text-[#888] font-mono">{message}</p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-[#333] px-3 py-2.5 text-[10px] font-bold tracking-wider text-[#666] transition-all hover:bg-[#ffffff08] hover:text-[#999] active:scale-95"
          >
            CANCELAR
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-lg border border-[#ff004044] bg-[#ff004015] px-3 py-2.5 text-[10px] font-bold tracking-wider text-[#ff0040] transition-all hover:bg-[#ff004025] active:scale-95"
          >
            ELIMINAR
          </button>
        </div>
      </div>
    </div>
  );
}

function ConversationItem({
  conv,
  isActive,
  isMenuOpen,
  onSelect,
  onMenuToggle,
  onRequestDelete,
  onExportJson,
  onExportMarkdown,
}: {
  conv: Conversation;
  isActive: boolean;
  isMenuOpen: boolean;
  onSelect: () => void;
  onMenuToggle: () => void;
  onRequestDelete: () => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
}) {
  return (
    <div
      className={`
        group relative flex items-center gap-2 rounded-lg border px-2.5 py-2.5 sm:px-3
        transition-all duration-200
        ${isActive
          ? 'border-[#00ff4133] bg-[#00ff4115] text-[#00ff41] shadow-[0_0_10px_#00ff4110]'
          : 'border-transparent text-[#555] hover:border-[#00ff4115] hover:bg-[#00ff4108] hover:text-[#888]'
        }
      `}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={isActive}
        aria-label={`Abrir conversación ${conv.title || 'sin título'}`}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <Terminal size={12} className="shrink-0 opacity-60" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] sm:text-xs font-medium">{conv.title}</p>
          <p className="mt-0.5 font-mono text-[9px] opacity-40 sm:text-[10px]">
            {conv.messages.length} mensajes · {formatDate(conv.updatedAt)}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={onMenuToggle}
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        className={`shrink-0 rounded-md p-1.5 transition-all focus-visible:opacity-100 active:scale-90 ${
          isMenuOpen
            ? 'bg-[#00ff4118] text-[#00ff41] opacity-100'
            : 'text-[#00ff4170] opacity-60 hover:bg-[#00ff4115] hover:text-[#00ff41] hover:opacity-100'
        }`}
        aria-label={`Más opciones para ${conv.title || 'sin título'}`}
      >
        <MoreVertical size={14} />
      </button>

      {isMenuOpen && (
        <div
          role="menu"
          aria-label={`Opciones para ${conv.title || 'sin título'}`}
          className="absolute right-2 top-[calc(100%+0.35rem)] z-20 min-w-[172px] overflow-hidden rounded-xl border border-[#00ff4126] bg-[#08110c]/98 p-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={onExportJson}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-[#85daff] transition-colors hover:bg-[#07202b]"
            role="menuitem"
          >
            <FileJson size={14} />
            Exportar JSON
          </button>
          <button
            type="button"
            onClick={onExportMarkdown}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-[#8fffb0] transition-colors hover:bg-[#0d1c10]"
            role="menuitem"
          >
            <FileText size={14} />
            Exportar Markdown
          </button>
          <button
            type="button"
            onClick={onRequestDelete}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[11px] font-semibold text-[#ff7e94] transition-colors hover:bg-[#21090f]"
            role="menuitem"
          >
            <Trash2 size={14} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  conversations, activeId, isOpen, onNewChat, onSelect, onDelete, onExportConversation, onClose, onClearAll,
}: SidebarProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [clearAll, setClearAll] = useState(false);
  const [menuId, setMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setMenuId(null);
    }
  }, [isOpen]);

  const confirmDelete = useCallback(() => {
    if (deleteId) {
      onDelete(deleteId);
    }
    setDeleteId(null);
    setMenuId(null);
  }, [deleteId, onDelete]);

  const confirmClearAll = useCallback(() => {
    onClearAll();
    setClearAll(false);
    setMenuId(null);
  }, [onClearAll]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-30 flex h-full flex-col
          w-[280px] sm:w-[300px] md:w-[320px]
          bg-[#060a0e]/95 backdrop-blur-xl border-r border-[#00ff4118]
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between border-b border-[#00ff4118] px-3 py-3 sm:px-4 sm:py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#00cc33] to-[#009922] shadow-lg shadow-[#00ff4133]">
              <Skull size={16} className="text-black" />
            </div>
            <div>
              <span className="text-xs sm:text-sm font-bold tracking-widest text-[#00ff41] text-glow-green">
                VORTEX
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#00ff4155] transition-colors hover:bg-[#00ff4115] hover:text-[#00ff41] focus-visible:opacity-100 active:scale-90"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-2 sm:p-3">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="flex w-full items-center gap-2.5 rounded-lg border border-[#00ff4122] bg-[#00ff4108] px-3 py-2.5 text-[10px] font-bold tracking-wider text-[#00ff41aa] transition-all hover:border-[#00ff4144] hover:bg-[#00ff4118] hover:text-[#00ff41] focus-visible:opacity-100 active:scale-[0.98] sm:px-4 sm:py-3 sm:text-xs"
          >
            <MessageSquarePlus size={15} />
            NUEVA CONVERSACIÓN
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto px-2 pb-2 sm:px-3 sm:pb-3 sidebar-scroll"
          onScroll={() => setMenuId(null)}
        >
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 sm:py-12 text-[#00ff4133]">
              <Terminal size={24} className="mb-3 opacity-50" />
              <p className="text-[10px] sm:text-xs font-mono tracking-wider">SIN CONVERSACIONES</p>
              <p className="text-[9px] sm:text-[10px] mt-1 opacity-50 font-mono">Crea una para empezar</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeId}
                  isMenuOpen={menuId === conv.id}
                  onSelect={() => {
                    setMenuId(null);
                    onSelect(conv.id);
                    onClose();
                  }}
                  onMenuToggle={() => setMenuId((current) => (current === conv.id ? null : conv.id))}
                  onRequestDelete={() => {
                    setMenuId(null);
                    setDeleteId(conv.id);
                  }}
                  onExportJson={() => {
                    onExportConversation(conv.id, 'json');
                    setMenuId(null);
                  }}
                  onExportMarkdown={() => {
                    onExportConversation(conv.id, 'markdown');
                    setMenuId(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {conversations.length > 0 && (
          <div className="border-t border-[#00ff4118] p-2 sm:p-3">
            <button
              onClick={() => {
                setMenuId(null);
                setClearAll(true);
              }}
              className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-[9px] font-bold tracking-wider text-[#ff004055] transition-all hover:bg-[#ff004015] hover:text-[#ff0040] focus-visible:opacity-100 active:scale-95 sm:px-4 sm:py-2.5 sm:text-[10px]"
            >
              <Eraser size={12} />
              BORRAR TODO
            </button>
          </div>
        )}

        {menuId && (
          <button
            type="button"
            aria-label="Cerrar menú"
            className="fixed inset-0 z-10 cursor-default bg-transparent"
            onClick={() => setMenuId(null)}
          />
        )}
      </aside>

      {deleteId && (
        <ConfirmModal
          message="¿Eliminar esta conversación? También se borrarán sus mensajes."
          onConfirm={confirmDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      {clearAll && (
        <ConfirmModal
          message="¿Borrar todas las conversaciones? Esta acción no se puede deshacer."
          onConfirm={confirmClearAll}
          onCancel={() => setClearAll(false)}
        />
      )}
    </>
  );
}
