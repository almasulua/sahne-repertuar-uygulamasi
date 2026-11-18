/** Yarım tonlara göre sıralı notalar (diyez dizisi) */
export const SHARPS: readonly string[] = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B',
];

/** Yarım tonlara göre sıralı notalar (bemol dizisi) */
export const FLATS: readonly string[] = [
  'C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B',
];

/**
 * Enharmonik eşdeğerler → normalize edilmiş (diyez) forma.
 * Tüm teorik eşdeğerler dahil (çift-diyez/bemol sınır durumları).
 */
export const ENHARMONIC: Record<string, string> = {
  // Bemol → Diyez
  'Db': 'C#',
  'Eb': 'D#',
  'Fb': 'E',
  'Gb': 'F#',
  'Ab': 'G#',
  'Bb': 'A#',
  'Cb': 'B',
  // Çift-diyez
  'C##': 'D',
  'D##': 'E',
  'E#': 'F',
  'F##': 'G',
  'G##': 'A',
  'A##': 'B',
  'B#': 'C',
  // Çift-bemol
  'Dbb': 'C',
  'Ebb': 'D',
  'Fbb': 'Eb',
  'Gbb': 'F',
  'Abb': 'G',
  'Bbb': 'A',
};

/**
 * Nota adını SHARPS dizisindeki indeksine dönüştürür.
 * Önce ENHARMONIC haritasında normalize eder.
 */
export function noteToIndex(note: string): number {
  const normalized = ENHARMONIC[note] ?? note;
  const idx = SHARPS.indexOf(normalized);
  if (idx === -1) {
    throw new Error(`Bilinmeyen nota: "${note}" (normalize: "${normalized}")`);
  }
  return idx;
}

/** İndeksi nota adına çevirir. Adım negatifse bemol tercih edilir. */
export function indexToNote(index: number, preferFlats: boolean): string {
  const i = ((index % 12) + 12) % 12;
  return preferFlats ? FLATS[i] : SHARPS[i];
}

/** Gitar akor diyagramları (genişletilmiş — ~48 akor) */
export const GUITAR_CHORDS: Record<string, {
  fingers: Array<[fret: number, string: number]>; // [perde, tel]
  barre?: { fret: number; from: number; to: number };
  openStrings: number[];  // açık teller (0 = E2, 1 = A, 2 = D, 3 = G, 4 = B, 5 = e)
  mutedStrings: number[]; // kapalı teller
  baseFret: number;
}> = {
  // === Majör ===
  'C':  { fingers: [[1,2],[2,4],[3,5]], openStrings:[0,1,2,3], mutedStrings:[5], baseFret:1 },
  'D':  { fingers: [[1,1],[2,3],[3,2]], openStrings:[2,4,5], mutedStrings:[0,1], baseFret:1 },
  'E':  { fingers: [[1,3],[2,5],[3,4]], openStrings:[0,1,2,4,5], mutedStrings:[], baseFret:1 },
  'F':  { fingers: [[1,1],[1,2],[2,3],[3,4],[3,5]], openStrings:[], mutedStrings:[0], baseFret:1, barre:{fret:1,from:1,to:6} },
  'G':  { fingers: [[2,5],[3,1],[4,6]], openStrings:[1,2,3,4], mutedStrings:[], baseFret:1 },
  'A':  { fingers: [[2,2],[2,3],[2,4]], openStrings:[0,1,4], mutedStrings:[5], baseFret:1 },
  'B':  { fingers: [[2,1],[2,2],[2,3],[2,4]], openStrings:[], mutedStrings:[5], baseFret:2, barre:{fret:2,from:1,to:5} },
  // === Minör ===
  'Am': { fingers: [[1,2],[2,4],[3,3]], openStrings:[0,1,4], mutedStrings:[5], baseFret:1 },
  'Bm': { fingers: [[2,1],[2,2],[3,3],[4,4]], openStrings:[], mutedStrings:[5,0], baseFret:2, barre:{fret:2,from:1,to:5} },
  'Cm': { fingers: [[3,1],[3,2],[4,3],[5,4]], openStrings:[], mutedStrings:[5,0], baseFret:3, barre:{fret:3,from:1,to:5} },
  'Dm': { fingers: [[1,1],[2,3],[3,2]], openStrings:[2,4], mutedStrings:[0,1,5], baseFret:1 },
  'Em': { fingers: [[2,5],[3,4]], openStrings:[0,1,2,3,4], mutedStrings:[], baseFret:1 },
  'Fm': { fingers: [[1,1],[1,2],[3,4],[4,5]], openStrings:[], mutedStrings:[0], baseFret:1, barre:{fret:1,from:1,to:6} },
  'Gm': { fingers: [[3,1],[3,2],[5,4],[5,5]], openStrings:[], mutedStrings:[0], baseFret:3, barre:{fret:3,from:1,to:6} },
  // === 7 (dominant) ===
  'C7': { fingers: [[1,2],[2,4],[3,3],[3,5]], openStrings:[0,1,2], mutedStrings:[5], baseFret:1 },
  'D7': { fingers: [[1,1],[2,3],[1,2]], openStrings:[2,4,5], mutedStrings:[0], baseFret:1 },
  'E7': { fingers: [[1,3],[2,5]], openStrings:[0,1,2,4,5], mutedStrings:[], baseFret:1 },
  'G7': { fingers: [[1,1],[2,5],[3,6]], openStrings:[1,2,3,4], mutedStrings:[], baseFret:1 },
  'A7': { fingers: [[2,2],[2,4]], openStrings:[0,1,3,4], mutedStrings:[5], baseFret:1 },
  'B7': { fingers: [[1,4],[2,1],[2,3],[2,5]], openStrings:[0], mutedStrings:[5], baseFret:1 },
  'F7': { fingers: [[1,1],[1,2],[2,3],[3,5]], openStrings:[], mutedStrings:[0], baseFret:1, barre:{fret:1,from:1,to:6} },
  // === Majör 7 ===
  'Cmaj7': { fingers: [[2,4],[3,5]], openStrings:[0,1,2,3], mutedStrings:[5], baseFret:1 },
  'Dmaj7': { fingers: [[1,1],[1,3],[2,2]], openStrings:[2,4,5], mutedStrings:[0], baseFret:1 },
  'Fmaj7': { fingers: [[1,2],[2,3],[3,4]], openStrings:[], mutedStrings:[0,5], baseFret:1 },
  'Gmaj7': { fingers: [[2,5],[3,1],[3,6]], openStrings:[1,2,3,4], mutedStrings:[], baseFret:1 },
  'Amaj7': { fingers: [[1,2],[2,3]], openStrings:[0,1,4], mutedStrings:[5], baseFret:1 },
  // === Minör 7 ===
  'Am7': { fingers: [[1,2],[2,4]], openStrings:[0,1,3,4], mutedStrings:[5], baseFret:1 },
  'Bm7': { fingers: [[2,1],[2,3],[3,4]], openStrings:[], mutedStrings:[0,5], baseFret:2, barre:{fret:2,from:1,to:5} },
  'Dm7': { fingers: [[1,1],[1,2],[2,3]], openStrings:[2,4], mutedStrings:[0,5], baseFret:1 },
  'Em7': { fingers: [[2,5]], openStrings:[0,1,2,3,4], mutedStrings:[], baseFret:1 },
  'Fm7': { fingers: [[1,1],[1,2],[3,5]], openStrings:[], mutedStrings:[0], baseFret:1, barre:{fret:1,from:1,to:6} },
  'Gm7': { fingers: [[3,1],[3,2],[5,5]], openStrings:[], mutedStrings:[0], baseFret:3, barre:{fret:3,from:1,to:6} },
  // === Sus ===
  'Dsus2': { fingers: [[2,3],[3,2]], openStrings:[2,4,5], mutedStrings:[0,1], baseFret:1 },
  'Dsus4': { fingers: [[2,3],[3,2],[3,1]], openStrings:[2,4,5], mutedStrings:[0], baseFret:1 },
  'Asus2': { fingers: [[2,3],[2,4]], openStrings:[0,1,2,4], mutedStrings:[5], baseFret:1 },
  'Asus4': { fingers: [[2,3],[2,4],[3,2]], openStrings:[0,1,4], mutedStrings:[5], baseFret:1 },
  'Esus4': { fingers: [[2,3],[2,5],[3,4]], openStrings:[0,1,2,4,5], mutedStrings:[], baseFret:1 },
  // === Dim & Aug ===
  'Bdim': { fingers: [[1,1],[2,3],[1,5]], openStrings:[], mutedStrings:[0,4,5], baseFret:1 },
  'Cdim': { fingers: [[2,1],[2,3],[2,5]], openStrings:[], mutedStrings:[0,4,5], baseFret:1 },
  'Caug': { fingers: [[1,2],[2,4],[3,5]], openStrings:[1,3], mutedStrings:[5], baseFret:1 },
  // === Diyezli/Bemol ===
  'C#m': { fingers: [[4,1],[4,2],[5,3],[6,4]], openStrings:[], mutedStrings:[5,0], baseFret:4, barre:{fret:4,from:1,to:5} },
  'F#m': { fingers: [[2,1],[2,2],[3,3],[4,4]], openStrings:[], mutedStrings:[5,0], baseFret:2, barre:{fret:2,from:1,to:5} },
  'G#m': { fingers: [[4,1],[4,2],[5,3],[6,4]], openStrings:[], mutedStrings:[5,0], baseFret:4, barre:{fret:4,from:1,to:5} },
  'Bb': { fingers: [[1,1],[1,2],[3,3],[3,4],[3,5]], openStrings:[], mutedStrings:[0], baseFret:1, barre:{fret:1,from:1,to:5} },
  'Eb': { fingers: [[3,1],[3,2],[4,3],[5,4],[5,5]], openStrings:[], mutedStrings:[], baseFret:3, barre:{fret:3,from:1,to:6} },
  'Ab': { fingers: [[4,1],[4,2],[5,3],[6,4],[6,5]], openStrings:[], mutedStrings:[], baseFret:4, barre:{fret:4,from:1,to:6} },
  'F#': { fingers: [[2,1],[2,2],[3,3],[4,4],[4,5]], openStrings:[], mutedStrings:[], baseFret:2, barre:{fret:2,from:1,to:6} },
  'C#': { fingers: [[4,1],[4,2],[5,3],[6,4],[6,5]], openStrings:[], mutedStrings:[], baseFret:4, barre:{fret:4,from:1,to:6} },
};
