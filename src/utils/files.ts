import type { FileAttachment } from '../types';

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const THUMB_MAX = 300;

export function createId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()!.toLowerCase() : '';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function detectFileCategory(mimeType: string, extension: string): FileAttachment['type'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType === 'application/zip' ||
    mimeType === 'application/x-zip-compressed' ||
    mimeType === 'application/x-rar-compressed' ||
    mimeType === 'application/x-7z-compressed' ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'].includes(extension)
  )
    return 'zip';
  if (mimeType === 'application/json' || extension === 'json') return 'json';
  if (mimeType === 'text/csv' || extension === 'csv') return 'csv';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('text/') || ['txt', 'md', 'log', 'rtf'].includes(extension)) return 'text';

  const codeExts = [
    'js','ts','tsx','jsx','py','java','c','cpp','cs','go','rb','php','swift','kt','rs',
    'html','css','scss','sass','less','sql','sh','bash','yaml','yml','xml','toml','ini',
    'cfg','env','vue','svelte','dart','lua','r','scala','hs','elm','ex','exs','clj','erl',
    'pl','pm','zig','nim',
  ];
  if (codeExts.includes(extension)) return 'code';

  return 'other';
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `"${file.name}" supera los 50 MB` };
  }
  if (file.size === 0) {
    return { valid: false, error: `"${file.name}" está vacío` };
  }
  return { valid: true };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Error leyendo archivo'));
    r.readAsDataURL(file);
  });
}

function readAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error('Error leyendo archivo'));
    r.readAsText(file);
  });
}

function readAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(new Error('Error leyendo archivo'));
    r.readAsArrayBuffer(file);
  });
}

// genera thumbnail comprimido para imagenes
async function generateImagePreview(
  file: File,
): Promise<{ preview: string; width: number; height: number }> {
  const dataUrl = await readAsDataURL(file);

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      const ow = width;
      const oh = height;

      if (width > THUMB_MAX || height > THUMB_MAX) {
        const ratio = Math.min(THUMB_MAX / width, THUMB_MAX / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      resolve({ preview: canvas.toDataURL('image/jpeg', 0.7), width: ow, height: oh });
    };
    img.onerror = () => resolve({ preview: dataUrl, width: 0, height: 0 });
    img.src = dataUrl;
  });
}

// parsea headers de un ZIP
async function extractZipInfo(file: File): Promise<string> {
  try {
    const buf = await readAsArrayBuffer(file);
    const bytes = new Uint8Array(buf);
    let fileCount = 0;
    const names: string[] = [];

    for (let i = 0; i < bytes.length - 4; i++) {
      if (bytes[i] === 0x50 && bytes[i + 1] === 0x4b && bytes[i + 2] === 0x03 && bytes[i + 3] === 0x04) {
        fileCount++;
        if (i + 30 < bytes.length) {
          const nl = bytes[i + 26] | (bytes[i + 27] << 8);
          if (nl > 0 && nl < 256 && i + 30 + nl <= bytes.length) {
            try {
              const n = new TextDecoder().decode(bytes.slice(i + 30, i + 30 + nl));
              if (n && !n.startsWith('__MACOSX') && !n.endsWith('/')) names.push(n);
            } catch { /* skip */ }
          }
        }
      }
    }
    return JSON.stringify({ fileCount, fileNames: names.slice(0, 30) });
  } catch {
    return JSON.stringify({ fileCount: 0, fileNames: [] });
  }
}

// parsea headers de un PDF
async function extractPdfInfo(file: File): Promise<string> {
  try {
    const buf = await readAsArrayBuffer(file);
    const bytes = new Uint8Array(buf);
    const text = new TextDecoder('latin1').decode(bytes);

    const pages = text.match(/\/Type\s*\/Page[^s]/g);
    const pageCount = pages ? pages.length : 0;

    const vm = text.match(/%PDF-(\d+\.\d+)/);
    const version = vm ? vm[1] : 'desconocida';

    const hasText = text.includes('/Font') || text.includes('Tj') || text.includes('TJ');
    const hasImages = text.includes('/Image') || text.includes('/XObject');

    const tm = text.match(/\/Title\s*\(([^)]*)\)/);
    const title = tm ? tm[1] : '';
    const am = text.match(/\/Author\s*\(([^)]*)\)/);
    const author = am ? am[1] : '';

    return JSON.stringify({ pageCount, version, hasText, hasImages, title, author });
  } catch {
    return JSON.stringify({ pageCount: 0, version: 'desconocida' });
  }
}

// procesa un archivo y extrae metadata + contenido
export async function processFile(file: File): Promise<FileAttachment> {
  const extension = getFileExtension(file.name);
  const type = detectFileCategory(file.type, extension);

  const att: FileAttachment = {
    id: createId(),
    name: file.name,
    size: file.size,
    mimeType: file.type || 'application/octet-stream',
    type,
    status: 'processing',
    extension,
  };

  try {
    switch (type) {
      case 'image': {
        const { preview, width, height } = await generateImagePreview(file);
        att.preview = preview;
        att.content = JSON.stringify({ width, height, format: extension.toUpperCase() });
        break;
      }
      case 'text':
      case 'code':
      case 'csv':
      case 'json': {
        const txt = await readAsText(file);
        att.content = txt.substring(0, 15000);
        break;
      }
      case 'pdf': {
        att.content = await extractPdfInfo(file);
        break;
      }
      case 'zip': {
        att.content = await extractZipInfo(file);
        break;
      }
      default: {
        att.content = JSON.stringify({ type: file.type, lastModified: file.lastModified });
        break;
      }
    }
    att.status = 'ready';
  } catch {
    att.status = 'error';
    att.content = 'Error al procesar el archivo';
  }

  return att;
}
