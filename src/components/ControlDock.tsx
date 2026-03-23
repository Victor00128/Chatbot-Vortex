import { Square } from 'lucide-react';

interface ControlDockProps {
  isLoading: boolean;
  onStop: () => void;
}

export function ControlDock({
  isLoading,
  onStop,
}: ControlDockProps) {
  if (!isLoading) return null;

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-50 sm:bottom-4">
      <button
        type="button"
        onClick={onStop}
        className="pointer-events-auto flex items-center justify-center gap-2 rounded-2xl border border-[#ff004033] bg-[#17070b]/95 px-4 py-3 text-sm font-semibold text-[#ff9aa8] shadow-xl backdrop-blur-xl transition-colors hover:bg-[#21090f]"
      >
        <Square size={14} />
        Detener respuesta
      </button>
    </div>
  );
}
