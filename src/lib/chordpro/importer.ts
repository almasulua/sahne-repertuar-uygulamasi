import { parseChordPro, getDirective } from './parser';

export interface ChordProImportResult {
  title: string;
  artist: string | null;
  key: string | null;
  bpm: number | null;
  capo: number | null;
  lyrics: string;
}

/**
 * Yapıştırılan ChordPro metninden meta veri ve şarkı sözlerini çıkarır.
 * Title yoksa lyrics'in ilk dolu satırı title olarak kullanılır.
 */
export function importFromChordPro(source: string): ChordProImportResult {
  const text = source.replace(/\r\n/g, '\n').trim();
  const lines = parseChordPro(text);

  const directiveTitle = getDirective(lines, 'title') ?? getDirective(lines, 't');
  const artist =
    getDirective(lines, 'artist') ?? getDirective(lines, 'subtitle') ?? null;
  const key = getDirective(lines, 'key') ?? null;
  const tempoStr = getDirective(lines, 'tempo') ?? getDirective(lines, 'bpm');
  const capoStr = getDirective(lines, 'capo');

  const bpm = tempoStr ? parseInt(tempoStr, 10) : NaN;
  const capo = capoStr ? parseInt(capoStr, 10) : NaN;

  let title = directiveTitle ?? '';
  if (!title) {
    const firstNonDirective = text
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0 && !l.startsWith('{'));
    title = firstNonDirective?.replace(/\[[^\]]+\]/g, '').trim() ?? 'Untitled';
  }

  return {
    title,
    artist,
    key,
    bpm: Number.isFinite(bpm) ? bpm : null,
    capo: Number.isFinite(capo) ? capo : null,
    lyrics: text,
  };
}
