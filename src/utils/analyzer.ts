import type { FileAttachment } from '../types';
import { formatFileSize } from './files';

// analiza un archivo y genera texto descriptivo
export function analyzeFile(a: FileAttachment): string {
  switch (a.type) {
    case 'image':  return analyzeImage(a);
    case 'pdf':    return analyzePDF(a);
    case 'zip':    return analyzeZIP(a);
    case 'code':   return analyzeCode(a);
    case 'text':   return analyzeText(a);
    case 'csv':    return analyzeCSV(a);
    case 'json':   return analyzeJSON(a);
    case 'audio':  return analyzeAudio(a);
    case 'video':  return analyzeVideo(a);
    default:       return analyzeGeneric(a);
  }
}

export function analyzeFiles(attachments: FileAttachment[]): string {
  if (attachments.length === 0) return '';
  if (attachments.length === 1) return analyzeFile(attachments[0]);

  let total = 0;
  attachments.forEach((a) => (total += a.size));

  let r = `He analizado ${attachments.length} archivos (Total: ${formatFileSize(total)})\n\n`;
  attachments.forEach((a, i) => {
    r += analyzeFile(a);
    if (i < attachments.length - 1) r += '\n\n---\n\n';
  });
  return r;
}

function ratio(w: number, h: number): string {
  const r = w / h;
  if (Math.abs(r - 16 / 9) < 0.05) return '16:9';
  if (Math.abs(r - 4 / 3) < 0.05) return '4:3';
  if (Math.abs(r - 1) < 0.05) return '1:1';
  if (Math.abs(r - 3 / 2) < 0.05) return '3:2';
  if (Math.abs(r - 21 / 9) < 0.08) return '21:9';
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(w, h);
  return `${w / d}:${h / d}`;
}

function langName(ext: string): string {
  const m: Record<string, string> = {
    js:'JavaScript',ts:'TypeScript',tsx:'TypeScript React',jsx:'JavaScript React',
    py:'Python',java:'Java',c:'C',cpp:'C++',cs:'C#',go:'Go',rb:'Ruby',php:'PHP',
    swift:'Swift',kt:'Kotlin',rs:'Rust',html:'HTML',css:'CSS',scss:'SCSS',
    sass:'Sass',sql:'SQL',sh:'Shell',bash:'Bash',yaml:'YAML',yml:'YAML',
    xml:'XML',toml:'TOML',vue:'Vue',svelte:'Svelte',dart:'Dart',lua:'Lua',
    r:'R',scala:'Scala',hs:'Haskell',elm:'Elm',ex:'Elixir',clj:'Clojure',
    zig:'Zig',nim:'Nim',
  };
  return m[ext] || ext.toUpperCase();
}

function analyzeImage(f: FileAttachment): string {
  try {
    const d = JSON.parse(f.content || '{}');
    const { width, height, format } = d;
    const mp = width && height ? ((width * height) / 1e6).toFixed(1) : '?';
    let res = 'Desconocida';
    if (width && height) {
      if (width >= 3840 || height >= 2160) res = '4K Ultra HD';
      else if (width >= 2560 || height >= 1440) res = '2K QHD';
      else if (width >= 1920 || height >= 1080) res = 'Full HD';
      else if (width >= 1280 || height >= 720) res = 'HD';
      else res = 'SD';
    }
    let opt = '';
    if (f.size > 5 * 1024 * 1024)
      opt = '\n\nEl archivo es pesado. Considera comprimirlo o convertirlo a WebP.';
    else if (['BMP', 'TIFF'].includes(format))
      opt = `\n\n${format} no es optimo para web. Usa PNG o WebP.`;

    return (
      `Imagen: ${f.name}\n\n` +
      `Formato: ${format || f.extension.toUpperCase()}\n` +
      `Dimensiones: ${width ?? '?'} x ${height ?? '?'} px\n` +
      `Resolucion: ${res}\n` +
      `Megapixeles: ${mp} MP\n` +
      `Aspecto: ${width && height ? ratio(width, height) : '?'}\n` +
      `Tamano: ${formatFileSize(f.size)}\n` +
      `MIME: ${f.mimeType}` +
      opt
    );
  } catch {
    return `Imagen: ${f.name} - ${formatFileSize(f.size)}`;
  }
}

function analyzePDF(f: FileAttachment): string {
  try {
    const d = JSON.parse(f.content || '{}');
    let r =
      `PDF: ${f.name}\n\n` +
      `Paginas (est.): ${d.pageCount || 'No determinado'}\n` +
      `Version PDF: ${d.version || '?'}\n` +
      `Tamano: ${formatFileSize(f.size)}\n` +
      `Texto: ${d.hasText ? 'Si' : 'No detectado'}\n` +
      `Imagenes: ${d.hasImages ? 'Si' : 'No'}`;
    if (d.title) r += `\nTitulo: ${d.title}`;
    if (d.author) r += `\nAutor: ${d.author}`;
    if (!d.hasText && d.hasImages)
      r += '\n\nParece un PDF escaneado. Necesitarias OCR para extraer texto.';
    return r;
  } catch {
    return `PDF: ${f.name} - ${formatFileSize(f.size)}`;
  }
}

function analyzeZIP(f: FileAttachment): string {
  try {
    const d = JSON.parse(f.content || '{}');
    let r =
      `Archivo comprimido: ${f.name}\n\n` +
      `Formato: ${f.extension.toUpperCase()}\n` +
      `Tamano: ${formatFileSize(f.size)}\n` +
      `Archivos: ${d.fileCount || '?'}`;

    if (d.fileNames?.length) {
      const exts: Record<string, number> = {};
      (d.fileNames as string[]).forEach((n) => {
        const e = n.split('.').pop()?.toLowerCase() || 'otro';
        exts[e] = (exts[e] || 0) + 1;
      });
      r += '\n\nContenido:\n';
      (d.fileNames as string[]).slice(0, 15).forEach((n: string) => (r += `\n  ${n}`));
      if (d.fileNames.length > 15) r += `\n  ... y ${d.fileNames.length - 15} mas`;

      r += '\n\nPor tipo:\n';
      Object.entries(exts)
        .sort((a, b) => b[1] - a[1])
        .forEach(([ext, c]) => (r += `\n  .${ext}: ${c}`));
    }
    return r;
  } catch {
    return `${f.name} - ${formatFileSize(f.size)}`;
  }
}

function analyzeCode(f: FileAttachment): string {
  const c = f.content || '';
  const lines = c.split('\n');
  const total = lines.length;
  const nonEmpty = lines.filter((l) => l.trim()).length;
  const comments = lines.filter((l) => {
    const t = l.trim();
    return t.startsWith('//') || t.startsWith('#') || t.startsWith('/*') || t.startsWith('*') || t.startsWith('<!--');
  }).length;
  const fns = (c.match(/\bfunction\b|\bdef\b|\bfunc\b|\bfn\b/g) || []).length;
  const cls = (c.match(/\bclass\b/g) || []).length;
  const imp = (c.match(/\bimport\b|\brequire\(/g) || []).length;

  let r =
    `Codigo: ${f.name}\n\n` +
    `Lenguaje: ${langName(f.extension)}\n` +
    `Lineas totales: ${total}\n` +
    `Lineas de codigo: ${nonEmpty}\n` +
    `Comentarios: ~${comments}\n` +
    `Funciones: ~${fns}\n` +
    `Clases: ${cls}\n` +
    `Imports: ~${imp}\n` +
    `Tamano: ${formatFileSize(f.size)}`;

  const preview = lines.slice(0, 12).join('\n');
  r += `\n\nVista previa:\n\`\`\`${f.extension}\n${preview}\n\`\`\``;
  if (total > 12) r += `\n... y ${total - 12} lineas mas`;
  return r;
}

function analyzeText(f: FileAttachment): string {
  const c = f.content || '';
  const words = c.split(/\s+/).filter((w) => w.length > 0);
  const lines = c.split('\n').length;
  const paragraphs = c.split(/\n\s*\n/).filter((p) => p.trim()).length;
  const readMin = Math.max(1, Math.round(words.length / 200));

  let r =
    `Texto: ${f.name}\n\n` +
    `Palabras: ${words.length.toLocaleString()}\n` +
    `Caracteres: ${c.length.toLocaleString()}\n` +
    `Lineas: ${lines.toLocaleString()}\n` +
    `Parrafos: ${paragraphs}\n` +
    `Lectura: ~${readMin} min\n` +
    `Tamano: ${formatFileSize(f.size)}`;

  const pre = c.substring(0, 300);
  r += `\n\nVista previa:\n${pre}${c.length > 300 ? '...' : ''}`;
  return r;
}

function analyzeCSV(f: FileAttachment): string {
  const c = f.content || '';
  const rows = c.split('\n').filter((l) => l.trim());
  if (!rows.length) return `CSV vacio: ${f.name}`;

  const first = rows[0];
  let sep = ',';
  let best = 0;
  [',', ';', '\t', '|'].forEach((s) => {
    const n = (first.match(new RegExp(s === '|' ? '\\|' : s === '\t' ? '\t' : s, 'g')) || []).length;
    if (n > best) { best = n; sep = s; }
  });

  const headers = first.split(sep).map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const dataRows = rows.length - 1;

  let r =
    `CSV: ${f.name}\n\n` +
    `Columnas: ${headers.length}\n` +
    `Filas: ${dataRows.toLocaleString()}\n` +
    `Separador: "${sep === '\t' ? 'TAB' : sep}"\n` +
    `Tamano: ${formatFileSize(f.size)}`;

  r += '\n\nColumnas:\n';
  headers.forEach((h) => (r += `  ${h}\n`));

  if (rows.length > 1) {
    r += '\nPrimeras filas:\n```\n';
    rows.slice(0, 4).forEach((l) => (r += l + '\n'));
    r += '```';
  }
  return r;
}

function analyzeJSON(f: FileAttachment): string {
  const c = f.content || '';
  try {
    const data = JSON.parse(c);
    const isArr = Array.isArray(data);

    let keys = 0;
    let depth = 0;
    const walk = (o: unknown, lv: number) => {
      depth = Math.max(depth, lv);
      if (Array.isArray(o)) o.forEach((i) => { if (typeof i === 'object' && i) walk(i, lv + 1); });
      else if (typeof o === 'object' && o !== null) {
        const k = Object.keys(o as Record<string, unknown>);
        keys += k.length;
        k.forEach((key) => {
          const v = (o as Record<string, unknown>)[key];
          if (typeof v === 'object' && v) walk(v, lv + 1);
        });
      }
    };
    walk(data, 0);

    let r =
      `JSON: ${f.name}\n\n` +
      `Tipo raiz: ${isArr ? 'Array' : 'Object'}\n` +
      `Claves totales: ${keys}\n` +
      `Profundidad: ${depth} niveles\n` +
      `Tamano: ${formatFileSize(f.size)}`;

    if (isArr) {
      r += `\nElementos: ${(data as unknown[]).length}`;
    } else {
      const topKeys = Object.keys(data as Record<string, unknown>);
      r += '\n\nClaves raiz:\n';
      topKeys.slice(0, 10).forEach((k) => {
        const v = (data as Record<string, unknown>)[k];
        const t = Array.isArray(v) ? `Array[${(v as unknown[]).length}]` : typeof v;
        r += `  ${k}: ${t}\n`;
      });
      if (topKeys.length > 10) r += `  ... y ${topKeys.length - 10} mas`;
    }

    const fmt = JSON.stringify(data, null, 2).substring(0, 400);
    r += `\n\nVista previa:\n\`\`\`json\n${fmt}${c.length > 400 ? '\n...' : ''}\n\`\`\``;
    return r;
  } catch (e) {
    return `JSON invalido: ${f.name}\n\nError: ${(e as Error).message}\nTamano: ${formatFileSize(f.size)}`;
  }
}

function analyzeAudio(f: FileAttachment): string {
  const fmts: Record<string, string> = {
    mp3:'MPEG-3',wav:'WAV',ogg:'Ogg Vorbis',flac:'FLAC',aac:'AAC',m4a:'M4A',wma:'WMA',webm:'WebM',
  };
  return (
    `Audio: ${f.name}\n\n` +
    `Formato: ${fmts[f.extension] || f.extension.toUpperCase()}\n` +
    `MIME: ${f.mimeType}\n` +
    `Tamano: ${formatFileSize(f.size)}`
  );
}

function analyzeVideo(f: FileAttachment): string {
  const fmts: Record<string, string> = {
    mp4:'MPEG-4',avi:'AVI',mkv:'Matroska',mov:'QuickTime',wmv:'WMV',webm:'WebM',flv:'Flash',
  };
  return (
    `Video: ${f.name}\n\n` +
    `Formato: ${fmts[f.extension] || f.extension.toUpperCase()}\n` +
    `MIME: ${f.mimeType}\n` +
    `Tamano: ${formatFileSize(f.size)}`
  );
}

function analyzeGeneric(f: FileAttachment): string {
  return (
    `Archivo: ${f.name}\n\n` +
    `Extension: .${f.extension || 'sin extension'}\n` +
    `MIME: ${f.mimeType}\n` +
    `Tamano: ${formatFileSize(f.size)}`
  );
}
