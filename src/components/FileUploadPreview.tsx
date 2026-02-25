import { X, Loader2, AlertCircle, Image, FileText, Archive, Code, File } from 'lucide-react';
import type { FileAttachment } from '../types';

interface FileUploadPreviewProps {
  files: FileAttachment[];
  onRemove: (id: string) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getSmallIcon(type: string) {
  const size = 12;
  switch (type) {
    case 'image': return <Image size={size} className="text-purple-400" />;
    case 'pdf': return <FileText size={size} className="text-red-400" />;
    case 'zip': return <Archive size={size} className="text-yellow-400" />;
    case 'code': return <Code size={size} className="text-cyan-400" />;
    default: return <File size={size} className="text-gray-400" />;
  }
}

export function FileUploadPreview({ files, onRemove }: FileUploadPreviewProps) {
  if (files.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 border-b border-[#00ff4115] px-2 py-1.5 sm:px-3 sm:py-2">
      {files.map((file) => (
        <div
          key={file.id}
          className={`
            group flex items-center gap-1 sm:gap-1.5 rounded-md border px-1.5 py-0.5 sm:px-2 sm:py-1 text-[9px] sm:text-[10px] font-mono
            transition-all animate-fade-in max-w-[140px] sm:max-w-[180px]
            ${
              file.status === 'error'
                ? 'border-[#ff004033] bg-[#ff004010] text-[#ff0040]'
                : file.status === 'processing'
                ? 'border-[#00d4ff33] bg-[#00d4ff10] text-[#00d4ff]'
                : 'border-[#00ff4122] bg-[#00ff4108] text-[#00ff41aa]'
            }
          `}
        >
          {file.status === 'processing' ? (
            <Loader2 size={10} className="animate-spin shrink-0" />
          ) : file.status === 'error' ? (
            <AlertCircle size={10} className="shrink-0" />
          ) : (
            <span className="shrink-0">{getSmallIcon(file.type)}</span>
          )}

          <span className="truncate">{file.name}</span>
          <span className="text-[8px] opacity-50 shrink-0 hidden sm:inline">
            {formatSize(file.size)}
          </span>

          <button
            onClick={() => onRemove(file.id)}
            className="shrink-0 rounded p-0.5 opacity-50 transition-all hover:bg-[#ff004020] hover:text-[#ff0040] hover:opacity-100"
          >
            <X size={9} />
          </button>
        </div>
      ))}
    </div>
  );
}
