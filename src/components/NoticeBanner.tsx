import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { AppNotice } from '../types';

interface NoticeBannerProps {
  notice: AppNotice | null;
  onDismiss: () => void;
}

const NOTICE_STYLES: Record<AppNotice['level'], { icon: typeof Info; classes: string }> = {
  info: {
    icon: Info,
    classes: 'border-[#00d4ff33] bg-[#05151d]/95 text-[#8fdfff]',
  },
  success: {
    icon: CheckCircle2,
    classes: 'border-[#00ff4133] bg-[#081409]/95 text-[#8fffb0]',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'border-[#ffaa0033] bg-[#181206]/95 text-[#ffd27a]',
  },
  error: {
    icon: XCircle,
    classes: 'border-[#ff004033] bg-[#19080b]/95 text-[#ff9aa8]',
  },
};

export function NoticeBanner({ notice, onDismiss }: NoticeBannerProps) {
  if (!notice) return null;

  const config = NOTICE_STYLES[notice.level];
  const Icon = config.icon;

  return (
    <div className="pointer-events-auto w-full max-w-xl animate-fade-in">
      <div className={`rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl ${config.classes}`}>
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg border border-current/20 bg-black/20 p-2">
            <Icon size={16} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em]">
              {notice.title}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-white/80">
              {notice.message}
            </p>
          </div>

          <button
            type="button"
            onClick={onDismiss}
            aria-label="Cerrar aviso"
            className="rounded-lg p-1.5 text-white/45 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
