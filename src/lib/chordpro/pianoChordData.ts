/**
 * Piyano akor verileri.
 * Her akor için MIDI nota numaraları (C4 = 60 baz alınarak).
 * Kök nota 0-11 arasında (C=0, C#=1, ..., B=11).
 */

/** Kök notadan intervallarla akor oluşturma */
const INTERVALS = {
  major: [0, 4, 7],
  minor: [0, 3, 7],
  '7': [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  m7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  '6': [0, 4, 7, 9],
  m6: [0, 3, 7, 9],
  '9': [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  add9: [0, 4, 7, 14],
  '7sus4': [0, 5, 7, 10],
  '7b5': [0, 4, 6, 10],
  'm7b5': [0, 3, 6, 10],
} as const;

export type ChordQuality = keyof typeof INTERVALS;

const ROOT_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/** Kök nota adını indekse çevirir */
function rootToIndex(root: string): number {
  const ENHARMONIC: Record<string, string> = {
    'Db': 'C#', 'Eb': 'D#', 'Fb': 'E', 'Gb': 'F#',
    'Ab': 'G#', 'Bb': 'A#', 'Cb': 'B', 'E#': 'F', 'B#': 'C',
  };
  const normalized = ENHARMONIC[root] ?? root;
  return ROOT_NAMES.indexOf(normalized);
}

/** Akor adından kök ve kaliteyi ayrıştırır */
export function parseChordForPiano(chordName: string): { root: string; quality: ChordQuality; rootIndex: number } | null {
  // Slash chord (/bass) kısmını at
  const name = chordName.split('/')[0];

  // Kök notayı çıkar (1-2 karakter: A, A#, Ab, Bb vb.)
  const rootMatch = name.match(/^([A-G][#b]?)/);
  if (!rootMatch) return null;

  const root = rootMatch[1];
  const rootIndex = rootToIndex(root);
  if (rootIndex === -1) return null;

  const suffix = name.slice(root.length);

  // Kaliteyi eşle
  let quality: ChordQuality = 'major';
  if (suffix === 'm' || suffix === 'min') quality = 'minor';
  else if (suffix === '7') quality = '7';
  else if (suffix === 'maj7' || suffix === 'M7') quality = 'maj7';
  else if (suffix === 'm7' || suffix === 'min7') quality = 'm7';
  else if (suffix === 'dim' || suffix === 'o') quality = 'dim';
  else if (suffix === 'dim7' || suffix === 'o7') quality = 'dim7';
  else if (suffix === 'aug' || suffix === '+') quality = 'aug';
  else if (suffix === 'sus2') quality = 'sus2';
  else if (suffix === 'sus4' || suffix === 'sus') quality = 'sus4';
  else if (suffix === '6') quality = '6';
  else if (suffix === 'm6') quality = 'm6';
  else if (suffix === '9') quality = '9';
  else if (suffix === 'm9') quality = 'm9';
  else if (suffix === 'add9') quality = 'add9';
  else if (suffix === '7sus4') quality = '7sus4';
  else if (suffix === '7b5') quality = '7b5';
  else if (suffix === 'm7b5') quality = 'm7b5';
  else if (suffix !== '') quality = 'major'; // Bilinmeyen → major fallback

  return { root, quality, rootIndex };
}

/** Verilen akor için basılması gereken piyano tuşlarını döner (0-23 arası, 2 oktav C4-B5) */
export function getPianoKeys(chordName: string): number[] | null {
  const parsed = parseChordForPiano(chordName);
  if (!parsed) return null;

  const { rootIndex, quality } = parsed;
  const intervals = INTERVALS[quality];

  return intervals.map((interval) => (rootIndex + interval) % 24);
}

export { INTERVALS, ROOT_NAMES };
