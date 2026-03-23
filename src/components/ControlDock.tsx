import { Download, FileJson, FileText, Square } from 'lucide-react';

interface ControlDockProps {
  hasConversations: boolean;
  isLoading: boolean;
  onStop: () => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
}

export function ControlDock({
  hasConversations,
  isLoading,
  onStop,
  onExportJson,
  onExportMarkdown,
}: ControlDockProps) {
  if (!hasConversations && !isLoading) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(92vw,320px)] flex-col gap-2">
      {isLoading && (
        <button
          type="button"
          onClick={onStop}
          className="pointer-events-auto flex items-center justify-center gap-2 rounded-2xl border border-[#ff004033] bg-[#17070b]/95 px-4 py-3 text-sm font-semibold text-[#ff9aa8] shadow-xl backdrop-blur-xl transition-colors hover:bg-[#21090f]"
        >
          <Square size={14} />
          Detener respuesta
        </button>
      )}

      {hasConversations && (
        <div className="pointer-events-auto rounded-2xl border border-[#00ff411f] bg-[#08110c]/90 p-2 shadow-xl backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-2 px-2 pt-1 text-[11px] font-bold uppercase tracking-[0.25em] text-[#00ff4190]">
            <Download size={12} />
            Exportar
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onExportJson}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#00d4ff26] bg-[#05151d] px-3 py-2 text-xs font-semibold text-[#85daff] transition-colors hover:bg-[#07202b]"
            >
              <FileJson size={13} />
              JSON
            </button>
            <button
              type="button"
              onClick={onExportMarkdown}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#00ff4126] bg-[#08140a] px-3 py-2 text-xs font-semibold text-[#8fffb0] transition-colors hover:bg-[#0d1c10]"
            >
              <FileText size={13} />
              Markdown
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
