import { describe, expect, it } from 'vitest';

import { detectFileCategory, formatFileSize } from './files';

describe('files utils', () => {
  it('formats file sizes for readable output', () => {
    expect(formatFileSize(0)).toBe('0 B');
    expect(formatFileSize(1024)).toBe('1 KB');
    expect(formatFileSize(1536)).toBe('1.5 KB');
  });

  it('detects categories from mime type and extension', () => {
    expect(detectFileCategory('image/png', 'png')).toBe('image');
    expect(detectFileCategory('application/pdf', 'pdf')).toBe('pdf');
    expect(detectFileCategory('text/plain', 'md')).toBe('text');
    expect(detectFileCategory('application/octet-stream', 'ts')).toBe('code');
    expect(detectFileCategory('application/octet-stream', 'bin')).toBe('other');
  });
});
