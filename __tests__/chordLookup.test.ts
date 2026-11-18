import { lookupChord, isKnownChord } from '../src/lib/chordpro/chordLookup';
import { parseChordForPiano, getPianoKeys, INTERVALS, ROOT_NAMES } from '../src/lib/chordpro/pianoChordData';
import { GUITAR_CHORDS } from '../src/lib/chordpro/chordData';

// ----------------------------------------------------------------
// parseChordForPiano — kök ayrıştırma
// ----------------------------------------------------------------
describe('parseChordForPiano — kök ayrıştırma', () => {
  test('basit majör (C) → root=C, quality=major, rootIndex=0', () => {
    const parsed = parseChordForPiano('C');
    expect(parsed).toEqual({ root: 'C', quality: 'major', rootIndex: 0 });
  });

  test('basit minör (Am) → quality=minor', () => {
    const parsed = parseChordForPiano('Am');
    expect(parsed?.quality).toBe('minor');
    expect(parsed?.rootIndex).toBe(9);
  });

  test('diyez kök (F#) → rootIndex=6', () => {
    expect(parseChordForPiano('F#')?.rootIndex).toBe(6);
  });

  test('bemol kök (Bb) → enharmonik → A#', () => {
    const parsed = parseChordForPiano('Bb');
    expect(parsed?.root).toBe('Bb');
    expect(parsed?.rootIndex).toBe(10); // A# index
  });

  test('slash chord (C/G) → bas kısmı atılır, kök=C', () => {
    const parsed = parseChordForPiano('C/G');
    expect(parsed?.root).toBe('C');
    expect(parsed?.rootIndex).toBe(0);
  });

  test('geçersiz girdi → null', () => {
    expect(parseChordForPiano('XYZ')).toBeNull();
    expect(parseChordForPiano('')).toBeNull();
    expect(parseChordForPiano('123')).toBeNull();
  });
});

// ----------------------------------------------------------------
// parseChordForPiano — quality mapping
// ----------------------------------------------------------------
describe('parseChordForPiano — kalite eşleme', () => {
  const cases: Array<[string, string]> = [
    ['C',        'major'],
    ['Cm',       'minor'],
    ['Cmin',     'minor'],
    ['C7',       '7'],
    ['Cmaj7',    'maj7'],
    ['CM7',      'maj7'],
    ['Cm7',      'm7'],
    ['Cmin7',    'm7'],
    ['Cdim',     'dim'],
    ['Co',       'dim'],
    ['Cdim7',    'dim7'],
    ['Co7',      'dim7'],
    ['Caug',     'aug'],
    ['C+',       'aug'],
    ['Csus2',    'sus2'],
    ['Csus4',    'sus4'],
    ['Csus',     'sus4'],
    ['C6',       '6'],
    ['Cm6',      'm6'],
    ['C9',       '9'],
    ['Cm9',      'm9'],
    ['Cadd9',    'add9'],
    ['C7sus4',   '7sus4'],
    ['C7b5',     '7b5'],
    ['Cm7b5',    'm7b5'],
  ];

  test.each(cases)('%s → %s', (input, expectedQuality) => {
    expect(parseChordForPiano(input)?.quality).toBe(expectedQuality);
  });

  test('bilinmeyen suffix → major fallback', () => {
    expect(parseChordForPiano('Cxyz')?.quality).toBe('major');
  });
});

// ----------------------------------------------------------------
// getPianoKeys
// ----------------------------------------------------------------
describe('getPianoKeys', () => {
  test('C major → [0, 4, 7]', () => {
    expect(getPianoKeys('C')).toEqual([0, 4, 7]);
  });

  test('A minor → [9, 12, 16]', () => {
    expect(getPianoKeys('Am')).toEqual([9, 12, 16]);
  });

  test('C maj7 → 4 tuş', () => {
    const keys = getPianoKeys('Cmaj7');
    expect(keys).toEqual([0, 4, 7, 11]);
  });

  test('G7 → kök 7 + dominant 7', () => {
    const keys = getPianoKeys('G7');
    expect(keys).toEqual([7, 11, 14 % 24, 17]);
  });

  test('C9 → 5 nota (genişletilmiş akor)', () => {
    const keys = getPianoKeys('C9');
    expect(keys).toHaveLength(5);
  });

  test('geçersiz akor → null', () => {
    expect(getPianoKeys('XYZ')).toBeNull();
  });

  test('Bb (enharmonik) → A# tuşlarıyla eşit', () => {
    expect(getPianoKeys('Bb')).toEqual(getPianoKeys('A#'));
  });
});

// ----------------------------------------------------------------
// lookupChord — gitar + piyano birleşik
// ----------------------------------------------------------------
describe('lookupChord', () => {
  test('bilinen gitar akoru (C) → guitar dolu, piano dolu', () => {
    const data = lookupChord('C');
    expect(data.name).toBe('C');
    expect(data.guitar).not.toBeNull();
    expect(data.piano).toEqual([0, 4, 7]);
  });

  test('bilinmeyen gitar akoru (Cxyz) → guitar=null ama piano hesaplanır', () => {
    const data = lookupChord('Cxyz');
    expect(data.guitar).toBeNull();
    expect(data.piano).toEqual([0, 4, 7]); // major fallback
  });

  test('tamamen geçersiz akor → guitar=null, piano=null', () => {
    const data = lookupChord('XYZ');
    expect(data.guitar).toBeNull();
    expect(data.piano).toBeNull();
  });

  test('Am → bilinen gitar diyagramı', () => {
    const data = lookupChord('Am');
    expect(data.guitar).toBe(GUITAR_CHORDS['Am']);
  });
});

// ----------------------------------------------------------------
// isKnownChord
// ----------------------------------------------------------------
describe('isKnownChord', () => {
  test('C → true', () => expect(isKnownChord('C')).toBe(true));
  test('Am → true', () => expect(isKnownChord('Am')).toBe(true));
  test('F#m7 → true', () => expect(isKnownChord('F#m7')).toBe(true));
  test('Bbmaj7 → true', () => expect(isKnownChord('Bbmaj7')).toBe(true));
  test('XYZ → false', () => expect(isKnownChord('XYZ')).toBe(false));
  test('boş string → false', () => expect(isKnownChord('')).toBe(false));
  test('123 → false', () => expect(isKnownChord('123')).toBe(false));
});

// ----------------------------------------------------------------
// INTERVALS / ROOT_NAMES — veri bütünlüğü
// ----------------------------------------------------------------
describe('pianoChordData — sabit veri', () => {
  test('ROOT_NAMES 12 elemanlı', () => {
    expect(ROOT_NAMES).toHaveLength(12);
  });

  test('tüm INTERVALS kök 0 ile başlar', () => {
    Object.values(INTERVALS).forEach((arr) => {
      expect(arr[0]).toBe(0);
    });
  });

  test('major triad 3 nota', () => {
    expect(INTERVALS.major).toHaveLength(3);
  });

  test('dim7 4 nota', () => {
    expect(INTERVALS.dim7).toHaveLength(4);
  });
});
