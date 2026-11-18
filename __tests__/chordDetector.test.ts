import { isChordLine, detectChords, classifyLines } from '../src/lib/scraper/chordDetector';

// ----------------------------------------------------------------
// isChordLine
// ----------------------------------------------------------------
describe('isChordLine', () => {
  test('boş satır → false', () => {
    expect(isChordLine('')).toBe(false);
    expect(isChordLine('   ')).toBe(false);
  });

  test('saf akor satırı → true', () => {
    expect(isChordLine('Am C G F')).toBe(true);
    expect(isChordLine('C  G  Am  F')).toBe(true);
  });

  test('akor + diyez/bemol → true', () => {
    expect(isChordLine('F#m C#m G#')).toBe(true);
    expect(isChordLine('Bb Eb Ab')).toBe(true);
  });

  test('genişletilmiş akorlar → true', () => {
    expect(isChordLine('Cmaj7 Dm7 G7')).toBe(true);
    expect(isChordLine('Gsus4 Am7 Dmaj7')).toBe(true);
  });

  test('slash akor → true', () => {
    expect(isChordLine('C/G G/B Am/E')).toBe(true);
  });

  test('söz satırı → false', () => {
    expect(isChordLine('Yağmur yağıyor bugün')).toBe(false);
    expect(isChordLine('Bu bir şarkı sözüdür')).toBe(false);
  });

  test('tek akor satırı → true', () => {
    expect(isChordLine('Am')).toBe(true);
  });
});

// ----------------------------------------------------------------
// detectChords
// ----------------------------------------------------------------
describe('detectChords', () => {
  test('boş metinden boş dizi', () => {
    expect(detectChords('')).toEqual([]);
  });

  test('temel akorları bulur', () => {
    const chords = detectChords('Am C G F');
    expect(chords).toContain('Am');
    expect(chords).toContain('C');
    expect(chords).toContain('G');
    expect(chords).toContain('F');
  });

  test('tekrarlananları benzersizleştirir', () => {
    const chords = detectChords('Am C Am G Am C');
    expect(chords.filter((c) => c === 'Am')).toHaveLength(1);
    expect(chords.filter((c) => c === 'C')).toHaveLength(1);
  });

  test('genişletilmiş akorları bulur', () => {
    const chords = detectChords('Cmaj7 Dm7 G7');
    expect(chords).toContain('Cmaj7');
    expect(chords).toContain('Dm7');
    expect(chords).toContain('G7');
  });

  test('söz arasındaki akorları bulur', () => {
    const chords = detectChords('Verse 1 starts with Am then goes to C');
    expect(chords).toContain('Am');
    expect(chords).toContain('C');
  });

  test('slash chord algılar', () => {
    const chords = detectChords('C/G G/B');
    // Regex bass için /X yakalar; slash dahil mi kontrol
    expect(chords.some((c) => c.startsWith('C'))).toBe(true);
  });
});

// ----------------------------------------------------------------
// classifyLines
// ----------------------------------------------------------------
describe('classifyLines', () => {
  test('boş satır → empty', () => {
    const result = classifyLines('\n\n');
    expect(result.every((r) => r.type === 'empty')).toBe(true);
  });

  test('akor + söz + boş satır karışımı', () => {
    const text = 'Am C G\nYağmur yağıyor\n\nDm F';
    const result = classifyLines(text);
    expect(result).toHaveLength(4);
    expect(result[0].type).toBe('chord');
    expect(result[1].type).toBe('lyric');
    expect(result[2].type).toBe('empty');
    expect(result[3].type).toBe('chord');
  });

  test('sadece sözler', () => {
    const result = classifyLines('Bir satır söz\nİkinci satır söz');
    expect(result[0].type).toBe('lyric');
    expect(result[1].type).toBe('lyric');
  });

  test('text alanı trim edilmiş', () => {
    const result = classifyLines('  Am C  ');
    expect(result[0].text).toBe('Am C');
  });
});
