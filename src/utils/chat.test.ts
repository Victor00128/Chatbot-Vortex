import { describe, expect, it } from 'vitest';

import type { FileAttachment } from '../types';
import { analyzeFiles } from './analyzer';
import { generateTitle } from './chat';

const attachment = (overrides: Partial<FileAttachment> = {}): FileAttachment => ({
  id: 'file-1',
  name: 'notes.md',
  size: 1024,
  mimeType: 'text/markdown',
  type: 'text',
  status: 'ready',
  extension: 'md',
  content: 'hola mundo',
  ...overrides,
});

describe('chat utils', () => {
  it('uses attachment names for empty conversation titles', () => {
    expect(generateTitle('', [attachment()])).toBe('notes.md');
    expect(generateTitle('', [attachment(), attachment({ id: 'file-2', name: 'todo.txt' })])).toBe('2 archivos');
  });

  it('summarizes multiple attachments in analysis mode', () => {
    const summary = analyzeFiles([
      attachment(),
      attachment({ id: 'file-2', name: 'image.png', type: 'image', mimeType: 'image/png', extension: 'png', content: '{"width":1920,"height":1080,"format":"PNG"}' }),
    ]);

    expect(summary).toContain('He analizado 2 archivos');
    expect(summary).toContain('notes.md');
    expect(summary).toContain('image.png');
  });
});
