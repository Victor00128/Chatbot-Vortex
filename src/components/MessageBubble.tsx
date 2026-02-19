import { useState, useCallback } from 'react';
import { Copy, Check, RefreshCw, Trash2, Terminal, Skull } from 'lucide-react';
import type { Message } from '../types';
import { FilePreview } from './FilePreview';
import { ImageModal } from './ImageModal';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: (id: string) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/* ─── Code Block with Copy Button ─── */
function CodeBlock({ lang, code }: { lang: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2 sm:my-3 overflow-hidden rounded-lg border border-[#00ff4122] bg-[#0a0e14]">
      <div className="flex items-center justify-between border-b border-[#00ff4118] bg-[#0d1117] px-2.5 py-1 sm:px-4 sm:py-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Terminal size={11} className="text-[#00ff41]" />
          <span className="text-[10px] sm:text-xs font-medium text-[#00ff41aa]">
            {lang || 'code'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 sm:px-2 text-[10px] sm:text-xs text-[#00ff4188] transition-all hover:bg-[#00ff4115] hover:text-[#00ff41]"
        >
          {copied ? (
            <>
              <Check size={10} className="text-[#00ff41]" />
              <span className="text-[#00ff41] hidden xs:inline">Copiado!</span>
            </>
          ) : (
            <>
              <Copy size={10} />
              <span className="hidden xs:inline">Copiar</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-2.5 sm:p-4 text-[11px] sm:text-sm leading-relaxed text-[#c0f0c0]">
        <code>{code}</code>
      </pre>
    </div>
  );
}

/* ─── Clean text: strip any leftover Markdown symbols ─── */
function cleanMarkdown(text: string): string {
  let cleaned = text;

  // Remove heading markers: lines starting with # ## ### etc.
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '');

  // Remove bold markers: **text** → text
  cleaned = cleaned.replace(/\*\*(.+?)\*\*/g, '$1');

  // Remove bold markers: __text__ → text
  cleaned = cleaned.replace(/__(.+?)__/g, '$1');

  // Remove italic markers: *text* → text (but not inside words like don't)
  cleaned = cleaned.replace(/(?<!\w)\*(.+?)\*(?!\w)/g, '$1');

  // Remove italic markers: _text_ → text
  cleaned = cleaned.replace(/(?<!\w)_(.+?)_(?!\w)/g, '$1');

  // Remove strikethrough: ~~text~~ → text
  cleaned = cleaned.replace(/~~(.+?)~~/g, '$1');

  // Remove blockquote markers: > text → text
  cleaned = cleaned.replace(/^>\s+/gm, '');

  // Remove bullet list markers: - item or * item → item
  cleaned = cleaned.replace(/^[\s]*[-*]\s+/gm, '  ');

  // Remove horizontal rules: --- or *** or ___
  cleaned = cleaned.replace(/^[-*_]{3,}\s*$/gm, '');

  // Remove link syntax: [text](url) → text (url)
  cleaned = cleaned.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)');

  // Remove image syntax: ![alt](url) → (imagen: alt)
  cleaned = cleaned.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '(imagen: $1)');

  // Remove table pipe syntax: |col1|col2| → col1  col2
  cleaned = cleaned.replace(/^\|(.+)\|\s*$/gm, (_, row) => {
    return row.split('|').map((c: string) => c.trim()).filter((c: string) => !/^[-:]+$/.test(c)).join('    ');
  });
  // Remove separator rows like |---|---|
  cleaned = cleaned.replace(/^\|[-:\s|]+\|\s*$/gm, '');

  return cleaned;
}

/* ─── Render inline code (backtick) within plain text ─── */
function renderInlineCode(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={i}
          className="rounded bg-[#00ff4112] px-1.5 py-0.5 text-[11px] sm:text-xs font-mono text-[#00ff41cc] border border-[#00ff4118]"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

/* ─── Main content renderer: plain text + code blocks only ─── */
function renderContent(content: string) {
  // Split by code blocks (``` ... ```)
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    // Code blocks — the ONLY formatted element
    if (part.startsWith('```') && part.endsWith('```')) {
      const inner = part.slice(3, -3);
      const lines = inner.split('\n');
      const firstLine = lines[0]?.trim() || '';
      const hasLang = firstLine && !/\s/.test(firstLine) && firstLine.length < 20;
      const lang = hasLang ? firstLine : '';
      const code = hasLang ? lines.slice(1).join('\n').trim() : inner.trim();

      return <CodeBlock key={i} lang={lang} code={code} />;
    }

    // Everything else: clean any Markdown symbols and render as plain text
    const cleaned = cleanMarkdown(part);

    return (
      <span key={i}>
        {cleaned.split('\n').map((line, j, arr) => (
          <span key={j}>
            {renderInlineCode(line)}
            {j < arr.length - 1 && <br />}
          </span>
        ))}
      </span>
    );
  });
}

/* ─── Main Component ─── */
export function MessageBubble({
  message,
  onRegenerate,
  onDelete,
  isLoading,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [modal, setModal] = useState<{ src: string; name: string } | null>(null);
  const isUser = message.role === 'user';

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleRegenerate = useCallback(() => {
    if (onRegenerate) onRegenerate(message.id);
  }, [onRegenerate, message.id]);

  const handleDelete = useCallback(() => {
    if (onDelete) onDelete(message.id);
  }, [onDelete, message.id]);

  return (
    <>
      <div
        className={`group flex gap-2 sm:gap-3 px-2.5 py-3 sm:px-4 md:px-6 sm:py-4 transition-all animate-fade-in ${
          isUser
            ? 'bg-transparent'
            : 'bg-[#00ff4105] border-l-2 border-[#00ff4122]'
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex h-6 w-6 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg ${
            isUser
              ? 'bg-gradient-to-br from-cyan-600 to-blue-700 shadow-lg shadow-cyan-500/20'
              : 'bg-gradient-to-br from-[#00cc33] to-[#009922] shadow-lg shadow-[#00ff4133]'
          }`}
        >
          {isUser ? (
            <span className="text-[9px] sm:text-xs font-bold text-white">{'>'}_</span>
          ) : (
            <Skull size={13} className="text-black" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="mb-1 sm:mb-1.5 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span
              className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase ${
                isUser ? 'text-cyan-400' : 'text-[#00ff41]'
              }`}
            >
              {isUser ? 'OPERADOR' : 'VORTEX'}
            </span>
            <span className="text-[9px] sm:text-[10px] text-[#444] font-mono">
              {formatTime(message.timestamp)}
            </span>
          </div>

          {/* File Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-1.5 sm:gap-2">
              {message.attachments.map((att) => (
                <FilePreview
                  key={att.id}
                  attachment={att}
                  onImageClick={(src, name) => setModal({ src, name })}
                />
              ))}
            </div>
          )}

          {/* Text content — PLAIN TEXT with inline code + code blocks */}
          {message.content && (
            <div
              className={`whitespace-pre-wrap break-words text-xs sm:text-sm leading-relaxed ${
                isUser ? 'text-[#b0b0b0]' : 'text-[#c0c0c0]'
              }`}
            >
              {renderContent(message.content)}
            </div>
          )}

          {/* ─── ACTION BUTTONS (Bot messages only) ─── */}
          {!isUser && (
            <div className="mt-2 sm:mt-3 flex items-center gap-1 flex-wrap opacity-100 sm:opacity-0 transition-all duration-300 sm:group-hover:opacity-100">
              {/* Copy */}
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-[#00ff4118] bg-[#00ff4108] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-[#00ff4188] transition-all hover:border-[#00ff4133] hover:bg-[#00ff4118] hover:text-[#00ff41]"
                title="Copiar respuesta"
              >
                {copied ? (
                  <>
                    <Check size={10} />
                    <span className="hidden xs:inline">Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={10} />
                    <span className="hidden xs:inline">Copiar</span>
                  </>
                )}
              </button>

              {/* Regenerate */}
              <button
                onClick={handleRegenerate}
                disabled={isLoading}
                className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-[#00d4ff18] bg-[#00d4ff08] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-[#00d4ff88] transition-all hover:border-[#00d4ff33] hover:bg-[#00d4ff18] hover:text-[#00d4ff] disabled:opacity-30"
                title="Regenerar respuesta"
              >
                <RefreshCw size={10} />
                <span className="hidden xs:inline">Regenerar</span>
              </button>

              {/* Delete */}
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-[#ff004018] bg-[#ff004008] px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-medium text-[#ff004088] transition-all hover:border-[#ff004033] hover:bg-[#ff004018] hover:text-[#ff0040]"
                title="Eliminar respuesta"
              >
                <Trash2 size={10} />
                <span className="hidden xs:inline">Borrar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {modal && (
        <ImageModal
          src={modal.src}
          name={modal.name}
          onClose={() => setModal(null)}
        />
      )}
    </>
  );
}
