import { SHARPS, FLATS, ENHARMONIC, noteToIndex } from './chordData';

/**
 * Bir akoru belirtilen yarım ton sayısı kadar transpoze eder.
 *
 * Algoritma:
 * 1. Regex ile root + accidental + quality + bass notunu ayır
 * 2. ENHARMONIC haritasıyla normalize et (Db → C#, E# → F, vb.)
 * 3. SHARPS dizisinde indeks bul
 * 4. newIdx = ((idx + steps) % 12 + 12) % 12   (negatif koruma)
 * 5. steps < 0 veya bemollü nota → FLATS[newIdx], aksi → SHARPS[newIdx]
 * 6. quality ve bass notunu ekle
 */

/** Akor adını parçalarına ayırır */
interface ChordParts {
  root: string;        // C, D#, Bb, vb.
  quality: string;     // m, maj7, 7, sus4, vb.
  bass: string | null; // /G gibi slash notation
}

const CHORD_REGEX =
  /^([A-G])(#{1,2}|b{1,2})?(.*?)(?:\/([A-G](?:#{1,2}|b{1,2})?))?$/;

export function parseChordName(chord: string): ChordParts | null {
  const m = CHORD_REGEX.exec(chord.trim());
  if (!m) return null;
  const root = m[1] + (m[2] ?? '');
  const quality = m[3] ?? '';
  const bassRaw = m[4] ?? null;
  return { root, quality, bass: bassRaw };
}

/**
 * Bir nota adını transpoze eder (sadece root, bass için de kullanılır).
 */
export function transposeNote(note: string, steps: number): string {
  const normalized = ENHARMONIC[note] ?? note;
  const idx = noteToIndex(normalized);
  const newIdx = ((idx + steps) % 12 + 12) % 12;
  // Bemol tercihi kuralları:
  //   - Kaynak nota bemollü (Db, Eb, Gb, Ab, Bb, Cb) → bemol koru
  //   - Kaynak nota diyez ise (C#, F# vb.) → diyez koru
  //   - Doğal nota (C,D,E,F,G,A,B): adım negatifse bemol, pozitifse diyez
  const isFlatNote = /^[A-G]b/.test(note);
  const isSharpNote = note.includes('#');
  const preferFlats = isFlatNote || (!isSharpNote && steps < 0);
  return preferFlats ? FLATS[newIdx] : SHARPS[newIdx];
}

/**
 * Tam akor adını transpoze eder.
 * Geçersiz akor string'i → değiştirilmeden geri döner.
 */
export function transposeChord(chord: string, steps: number): string {
  if (steps === 0) return chord;

  const parts = parseChordName(chord);
  if (!parts) return chord; // tanınamayan format, dokunma

  const newRoot = transposeNote(parts.root, steps);
  const newBass = parts.bass ? '/' + transposeNote(parts.bass, steps) : '';

  return newRoot + parts.quality + newBass;
}

/**
 * Bir ChordPro metin satırındaki TÜM akorları transpoze eder.
 * `[Am]Yağmur yağ[C]ıyor` → `[Bm]Yağmur yağ[D]ıyor` (+2 adım için)
 */
export function transposeLyricLine(line: string, steps: number): string {
  if (steps === 0) return line;
  return line.replace(/\[([^\]]+)\]/g, (_, chord: string) => {
    return `[${transposeChord(chord, steps)}]`;
  });
}

/**
 * Tam ChordPro metnini transpoze eder (tüm satırlar).
 * Direktifler ({title:...} vb.) değiştirilmez.
 */
export function transposeChordPro(source: string, steps: number): string {
  if (steps === 0) return source;
  return source
    .split('\n')
    .map((line) => {
      // Direktif satırlarını atla
      if (line.trim().startsWith('{')) return line;
      return transposeLyricLine(line, steps);
    })
    .join('\n');
}

/**
 * Verilen temel ton ve adım sayısından yeni tonu hesaplar.
 * Örn: key="Am", steps=2 → "Bm"
 */
export function getTransposedKey(key: string, steps: number): string {
  return transposeChord(key, steps);
}
