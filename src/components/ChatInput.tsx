import { Send, Loader2, Paperclip, Zap } from 'lucide-react';
import { useState, useRef, useCallback, useEffect } from 'react';
import type { FileAttachment } from '../types';
import { processFile, validateFile } from '../utils/files';
import { FileUploadPreview } from './FileUploadPreview';

interface ChatInputProps {
  onSend: (message: string, attachments?: FileAttachment[]) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [pendingFiles, setPendingFiles] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const adjustHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [input, adjustHeight]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(t);
  }, [error]);

  /* ---- file handling ---- */
  const handleFiles = useCallback(async (list: FileList | File[]) => {
    const files = Array.from(list);
    setError('');

    for (const file of files) {
      const v = validateFile(file);
      if (!v.valid) {
        setError(v.error || 'Archivo inválido');
        continue;
      }

      const tempId =
        Date.now().toString(36) + Math.random().toString(36).substring(2);
      const placeholder: FileAttachment = {
        id: tempId,
        name: file.name,
        size: file.size,
        mimeType: file.type || 'application/octet-stream',
        type: 'other',
        status: 'processing',
        extension: file.name.split('.').pop()?.toLowerCase() || '',
      };
      setPendingFiles((prev) => [...prev, placeholder]);

      try {
        const processed = await processFile(file);
        setPendingFiles((prev) =>
          prev.map((f) => (f.id === tempId ? { ...processed, id: tempId } : f)),
        );
      } catch {
        setPendingFiles((prev) =>
          prev.map((f) =>
            f.id === tempId ? { ...f, status: 'error' as const } : f,
          ),
        );
      }
    }
  }, []);

  const removePendingFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  /* ---- drag & drop ---- */
  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  /* ---- submit ---- */
  const allReady = pendingFiles.every(
    (f) => f.status === 'ready' || f.status === 'error',
  );
  const canSend =
    (input.trim().length > 0 || pendingFiles.length > 0) &&
    !isLoading &&
    !disabled &&
    allReady;

  const handleSubmit = useCallback(() => {
    if (!canSend) return;
    const readyFiles = pendingFiles.filter((f) => f.status === 'ready');
    onSend(input.trim(), readyFiles.length > 0 ? readyFiles : undefined);
    setInput('');
    setPendingFiles([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }, [canSend, input, pendingFiles, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div
      className="relative border-t border-[#00ff4118] bg-[#0a0a0a] p-2 sm:p-3 md:p-4"
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {/* drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-[#00ff41] bg-[#00ff4110] backdrop-blur-sm animate-fade-in">
          <div className="text-center">
            <Zap size={28} className="mx-auto mb-2 text-[#00ff41] animate-float" />
            <p className="text-xs sm:text-sm font-bold text-[#00ff41] tracking-wider">
              SOLTAR ARCHIVOS
            </p>
            <p className="text-[9px] sm:text-[10px] text-[#00ff4166] font-mono">
              Imágenes, PDFs, ZIPs, código...
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl w-full">
        {/* error */}
        {error && (
          <div className="mb-2 animate-fade-in rounded-lg border border-[#ff004033] bg-[#ff004015] px-2.5 py-1.5 sm:px-3 sm:py-2 text-[9px] sm:text-[10px] font-mono text-[#ff0040]">
            ⚠ ERROR: {error}
          </div>
        )}

        <div className="rounded-xl border border-[#00ff4118] bg-[#0d1117] transition-all focus-within:border-[#00ff4144] focus-within:shadow-[0_0_20px_#00ff4115] focus-neon">
          {/* pending files */}
          <FileUploadPreview files={pendingFiles} onRemove={removePendingFile} />

          {/* input row */}
          <div className="flex items-end gap-1.5 sm:gap-2 p-1.5 sm:p-2">
            {/* attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              aria-label="Adjuntar archivo"
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-[#00ff4155] transition-all hover:bg-[#00ff4115] hover:text-[#00ff41] disabled:opacity-30"
            >
              <Paperclip size={15} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="*/*"
              onChange={(e) => {
                if (e.target.files?.length) {
                  handleFiles(e.target.files);
                  e.target.value = '';
                }
              }}
              className="hidden"
            />

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                pendingFiles.length > 0
                  ? 'Mensaje o envía archivos...'
                  : 'root@vortex:~$ ...'
              }
              rows={1}
              disabled={disabled}
              className="max-h-[160px] min-h-[36px] sm:min-h-[40px] flex-1 resize-none bg-transparent px-1.5 sm:px-2 py-1.5 text-xs sm:text-sm text-[#c0c0c0] outline-none placeholder:text-[#333] disabled:opacity-50 font-mono"
            />

            <button
              onClick={handleSubmit}
              disabled={!canSend}
              className="flex h-8 w-8 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-[#00cc33] to-[#009922] text-black shadow-lg shadow-[#00ff4133] transition-all hover:shadow-[#00ff4155] disabled:opacity-20 disabled:shadow-none active:scale-95"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Send size={14} />
              )}
            </button>
          </div>
        </div>

        <p className="mt-1.5 sm:mt-2 text-center text-[8px] sm:text-[9px] font-mono text-[#00ff4122] tracking-wider">
          DRAG & DROP · ENTER ENVIAR · SHIFT+ENTER NUEVA LÍNEA
        </p>
      </div>
    </div>
  );
}
