import {
  transposeChord,
  transposeNote,
  transposeChordPro,
  getTransposedKey,
} from '../src/lib/chordpro/transposer';
import { SHARPS, FLATS } from '../src/lib/chordpro/chordData';

// ----------------------------------------------------------------
// 1. Temel transpozisyon — 12 kök × +1 adım
// ----------------------------------------------------------------
describe('transposeNote — +1 yarım ton', () => {
  const cases: [string, string][] = [
    ['C',  'C#'],
    ['C#', 'D'],
    ['D',  'D#'],
    ['D#', 'E'],
    ['E',  'F'],
    ['F',  'F#'],
    ['F#', 'G'],
    ['G',  'G#'],
    ['G#', 'A'],
    ['A',  'A#'],
    ['A#', 'B'],
    ['B',  'C'],
  ];
  test.each(cases)('%s + 1 → %s', (input, expected) => {
    expect(transposeNote(input, 1)).toBe(expected);
  });
});

// ----------------------------------------------------------------
// 2. Enharmonik normalizasyon
// ----------------------------------------------------------------
describe('transposeNote — enharmonik girdi', () => {
  test('Db + 1 → D  (Db == C#)', () => expect(transposeNote('Db', 1)).toBe('D'));
  test('Eb + 1 → E  (Eb == D#)', () => expect(transposeNote('Eb', 1)).toBe('E'));
  test('Gb + 1 → G  (Gb == F#)', () => expect(transposeNote('Gb', 1)).toBe('G'));
  test('Ab + 1 → A  (Ab == G#)', () => expect(transposeNote('Ab', 1)).toBe('A'));
  test('Bb + 1 → B  (Bb == A#)', () => expect(transposeNote('Bb', 1)).toBe('B'));
  test('Cb + 1 → C  (Cb == B)',  () => expect(transposeNote('Cb', 1)).toBe('C'));
  test('E# + 1 → F# (E# == F)',  () => expect(transposeNote('E#', 1)).toBe('F#'));
  test('B# + 1 → C# (B# == C)',  () => expect(transposeNote('B#', 1)).toBe('C#'));
});

// ----------------------------------------------------------------
// 3. Negatif adımlar — bemol tercihi
// ----------------------------------------------------------------
describe('transposeNote — negatif adım', () => {
  test('D - 1 → Db',  () => expect(transposeNote('D', -1)).toBe('Db'));
  test('E - 1 → Eb',  () => expect(transposeNote('E', -1)).toBe('Eb'));
  test('G - 1 → Gb',  () => expect(transposeNote('G', -1)).toBe('Gb'));
  test('A - 1 → Ab',  () => expect(transposeNote('A', -1)).toBe('Ab'));
  test('B - 1 → Bb',  () => expect(transposeNote('B', -1)).toBe('Bb'));
  test('C - 1 → B',   () => expect(transposeNote('C', -1)).toBe('B'));
});

// ----------------------------------------------------------------
// 4. Oktav döngüsü (12 adım = aynı nota)
// ----------------------------------------------------------------
describe('transposeNote — 12 adım', () => {
  const roots = SHARPS;
  test.each(roots)('%s + 12 == %s', (note) => {
    expect(transposeNote(note, 12)).toBe(note);
  });
  test.each(roots)('%s - 12 == %s', (note) => {
    expect(transposeNote(note, -12)).toBe(note);
  });
});

// ----------------------------------------------------------------
// 5. Akor kaliteleri korunur
// ----------------------------------------------------------------
describe('transposeChord — kalite koruma', () => {
  test('Am + 2 → Bm',       () => expect(transposeChord('Am', 2)).toBe('Bm'));
  test('Cmaj7 + 4 → Emaj7', () => expect(transposeChord('Cmaj7', 4)).toBe('Emaj7'));
  test('G7 + 1 → G#7',      () => expect(transposeChord('G7', 1)).toBe('G#7'));
  test('Dsus4 - 2 → Csus4', () => expect(transposeChord('Dsus4', -2)).toBe('Csus4'));
  test('F#m7 + 1 → Gm7',    () => expect(transposeChord('F#m7', 1)).toBe('Gm7'));
  test('Bbmaj7 + 2 → Cmaj7',() => expect(transposeChord('Bbmaj7', 2)).toBe('Cmaj7'));
  test('Edim7 + 3 → Gdim7', () => expect(transposeChord('Edim7', 3)).toBe('Gdim7'));
  test('Caug + 1 → C#aug',  () => expect(transposeChord('Caug', 1)).toBe('C#aug'));
});

// ----------------------------------------------------------------
// 6. Slash akorları (bas nota ayrıştırma)
// ----------------------------------------------------------------
describe('transposeChord — slash notation', () => {
  test('C/G + 2 → D/A',     () => expect(transposeChord('C/G', 2)).toBe('D/A'));
  test('G/B + 1 → G#/C',   () => expect(transposeChord('G/B', 1)).toBe('G#/C'));
  test('Am/E + 3 → Cm/G',   () => expect(transposeChord('Am/E', 3)).toBe('Cm/G'));
  test('Dm/F - 1 → C#m/E',  () => expect(transposeChord('Dm/F', -1)).toBe('Dbm/E'));
});

// ----------------------------------------------------------------
// 7. 0 adım — değişiklik yok
// ----------------------------------------------------------------
describe('transposeChord — 0 adım', () => {
  const chords = ['Am', 'C', 'G7', 'F#m7b5', 'Bbmaj9'];
  test.each(chords)('%s + 0 == %s', (chord) => {
    expect(transposeChord(chord, 0)).toBe(chord);
  });
});

// ----------------------------------------------------------------
// 8. ChordPro satırı transpozisyonu
// ----------------------------------------------------------------
describe('transposeChordPro', () => {
  test('tek satır', () => {
    const input = '[Am]Yağmur yağ[C]ıyor';
    expect(transposeChordPro(input, 2)).toBe('[Bm]Yağmur yağ[D]ıyor');
  });

  test('direktif satırları değiştirilmez', () => {
    const input = '{title: My Song}\n[C]Hello [G]world';
    const result = transposeChordPro(input, 2);
    expect(result).toBe('{title: My Song}\n[D]Hello [A]world');
  });

  test('birden fazla satır', () => {
    const input = '[G]Bir[D]in\n[Em]İki[C]\n{comment: bölüm}';
    const result = transposeChordPro(input, -2);
    expect(result).toBe('[F]Bir[C]in\n[Dm]İki[Bb]\n{comment: bölüm}');
  });
});

// ----------------------------------------------------------------
// 9. getTransposedKey
// ----------------------------------------------------------------
describe('getTransposedKey', () => {
  test('Am + 2 → Bm',  () => expect(getTransposedKey('Am', 2)).toBe('Bm'));
  test('C + 4 → E',    () => expect(getTransposedKey('C', 4)).toBe('E'));
  test('F# - 1 → F',   () => expect(getTransposedKey('F#', -1)).toBe('F'));
  test('Bb + 3 → Db',  () => expect(getTransposedKey('Bb', 3)).toBe('Db'));
});

// ----------------------------------------------------------------
// 10. SHARPS/FLATS dizi bütünlüğü
// ----------------------------------------------------------------
describe('chordData — dizi bütünlüğü', () => {
  test('SHARPS 12 elemanlı', () => expect(SHARPS.length).toBe(12));
  test('FLATS  12 elemanlı', () => expect(FLATS.length).toBe(12));
  test('SHARPS benzersiz',   () => expect(new Set(SHARPS).size).toBe(12));
  test('FLATS  benzersiz',   () => expect(new Set(FLATS).size).toBe(12));
});
