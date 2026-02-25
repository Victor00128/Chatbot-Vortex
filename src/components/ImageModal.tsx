import { useEffect, useCallback } from 'react';
import { X, Download } from 'lucide-react';

interface ImageModalProps {
  src: string;
  name: string;
  onClose: () => void;
}

export function ImageModal({ src, name, onClose }: ImageModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = name;
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-2 sm:p-4"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 flex items-center justify-between">
        <span className="text-[10px] sm:text-xs font-mono text-[#00ff4188] truncate max-w-[60%]">
          {name}
        </span>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="rounded-lg p-1.5 sm:p-2 text-[#00ff4188] hover:bg-[#00ff4122] hover:text-[#00ff41] transition-colors"
          >
            <Download size={16} />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 sm:p-2 text-[#ff004088] hover:bg-[#ff004022] hover:text-[#ff0040] transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Image */}
      <img
        src={src}
        alt={name}
        className="max-h-[80dvh] max-w-[95vw] sm:max-w-[90vw] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
