import { FileText, Image, Archive, Code, Music, Film, File } from 'lucide-react';
import type { FileAttachment } from '../types';

interface FilePreviewProps {
  attachment: FileAttachment;
  onImageClick?: (src: string, name: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getIcon(type: string) {
  const size = 16;
  switch (type) {
    case 'image': return <Image size={size} className="text-purple-400" />;
    case 'pdf': return <FileText size={size} className="text-red-400" />;
    case 'zip': return <Archive size={size} className="text-yellow-400" />;
    case 'code': return <Code size={size} className="text-cyan-400" />;
    case 'text': return <FileText size={size} className="text-green-400" />;
    case 'audio': return <Music size={size} className="text-pink-400" />;
    case 'video': return <Film size={size} className="text-orange-400" />;
    default: return <File size={size} className="text-gray-400" />;
  }
}

export function FilePreview({ attachment, onImageClick }: FilePreviewProps) {
  const isImage = attachment.type === 'image' && attachment.preview;

  if (isImage) {
    return (
      <button
        onClick={() => onImageClick?.(attachment.preview!, attachment.name)}
        className="group relative overflow-hidden rounded-lg border border-[#00ff4122] bg-[#0d1117] transition-all hover:border-[#00ff4144] max-w-[140px] sm:max-w-[180px]"
      >
        <img
          src={attachment.preview}
          alt={attachment.name}
          className="h-20 w-full sm:h-24 object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <Image size={18} className="text-white" />
        </div>
        <div className="px-1.5 py-1 sm:px-2">
          <p className="truncate text-[9px] sm:text-[10px] font-mono text-[#888]">
            {attachment.name}
          </p>
          <p className="text-[8px] sm:text-[9px] font-mono text-[#555]">
            {formatSize(attachment.size)}
          </p>
        </div>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg border border-[#00ff4118] bg-[#0d1117] px-2 py-1.5 sm:px-3 sm:py-2 max-w-[180px] sm:max-w-[220px]">
      {getIcon(attachment.type)}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[9px] sm:text-[10px] font-mono text-[#888]">
          {attachment.name}
        </p>
        <p className="text-[8px] sm:text-[9px] font-mono text-[#555]">
          {formatSize(attachment.size)} · {attachment.extension?.toUpperCase()}
        </p>
      </div>
    </div>
  );
}
