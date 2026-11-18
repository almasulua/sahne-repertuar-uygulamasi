import { parseChordPro, getDirective } from './parser';

export interface ChordProExportInput {
  title: string;
  artist?: string | null;
  key?: string | null;
  bpm?: number | null;
  capo?: number | null;
  lyrics?: string | null;
}

/**
 * Şarkıyı ChordPro metnine dönüştürür.
 * Lyrics içinde zaten yer alan direktifler (title/artist/key/tempo/capo)
 * tekrar header'a eklenmez.
 */
export function exportToChordPro(song: ChordProExportInput): string {
  const lyrics = song.lyrics ?? '';
  const lines = lyrics.trim() ? parseChordPro(lyrics) : [];
  const has = (key: string) => getDirective(lines, key) !== null;

  const headers: string[] = [];
  if (song.title && !has('title')) headers.push(`{title: ${song.title}}`);
  if (song.artist && !has('artist')) headers.push(`{artist: ${song.artist}}`);
  if (song.key && !has('key')) headers.push(`{key: ${song.key}}`);
  if (song.bpm != null && !has('tempo')) headers.push(`{tempo: ${song.bpm}}`);
  if (song.capo != null && song.capo > 0 && !has('capo')) {
    headers.push(`{capo: ${song.capo}}`);
  }

  const headerBlock = headers.length ? headers.join('\n') + '\n\n' : '';
  return headerBlock + lyrics.trimStart();
}
