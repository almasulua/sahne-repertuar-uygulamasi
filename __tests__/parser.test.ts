import { tokenize, buildLines, parseChordPro, extractChords, getDirective } from '../src/lib/chordpro/parser';

// ----------------------------------------------------------------
// Tokenizer
// ----------------------------------------------------------------
describe('tokenize', () => {
  test('boş string → boş dizi', () => {
    expect(tokenize('')).toEqual([]);
  });

  test('sadece metin', () => {
    const tokens = tokenize('Merhaba dünya');
    expect(tokens).toEqual([{ type: 'text', value: 'Merhaba dünya' }]);
  });

  test('tek akor', () => {
    const tokens = tokenize('[Am]');
    expect(tokens).toEqual([{ type: 'chord', value: 'Am' }]);
  });

  test('akor + metin', () => {
    const tokens = tokenize('[Am]hello');
    expect(tokens).toEqual([
      { type: 'chord', value: 'Am' },
      { type: 'text',  value: 'hello' },
    ]);
  });

  test('direktif', () => {
    const tokens = tokenize('{title: Test Song}');
    expect(tokens).toEqual([{ type: 'directive', value: 'title: Test Song' }]);
  });

  test('satır sonu', () => {
    const tokens = tokenize('a\nb');
    expect(tokens).toEqual([
      { type: 'text',    value: 'a' },
      { type: 'newline', value: '\n' },
      { type: 'text',    value: 'b' },
    ]);
  });

  test('karmaşık satır', () => {
    const tokens = tokenize('[Am]Yağmur yağ[C]ıyor');
    expect(tokens).toHaveLength(4);
    expect(tokens[0]).toEqual({ type: 'chord', value: 'Am' });
    expect(tokens[1]).toEqual({ type: 'text',  value: 'Yağmur yağ' });
    expect(tokens[2]).toEqual({ type: 'chord', value: 'C' });
    expect(tokens[3]).toEqual({ type: 'text',  value: 'ıyor' });
  });
});

// ----------------------------------------------------------------
// buildLines
// ----------------------------------------------------------------
describe('buildLines', () => {
  test('basit satır', () => {
    const tokens = tokenize('[Am]hello');
    const lines = buildLines(tokens);
    expect(lines).toHaveLength(1);
    expect(lines[0].pairs[0]).toEqual({ chord: 'Am', text: 'hello' });
  });

  test('iki satır', () => {
    const tokens = tokenize('[C]do\n[G]sol');
    const lines = buildLines(tokens);
    expect(lines).toHaveLength(2);
    expect(lines[0].pairs[0].chord).toBe('C');
    expect(lines[1].pairs[0].chord).toBe('G');
  });

  test('direktif satırı', () => {
    const tokens = tokenize('{title: My Song}');
    const lines = buildLines(tokens);
    expect(lines[0].isDirective).toBe(true);
    expect(lines[0].directiveKey).toBe('title');
    expect(lines[0].directiveValue).toBe('My Song');
  });

  test('akor satır sonunda bekleyebilir', () => {
    const tokens = tokenize('[Am]');
    const lines = buildLines(tokens);
    expect(lines[0].pairs[0]).toEqual({ chord: 'Am', text: '' });
  });
});

// ----------------------------------------------------------------
// parseChordPro
// ----------------------------------------------------------------
describe('parseChordPro', () => {
  test('boş/null → boş dizi', () => {
    expect(parseChordPro('')).toEqual([]);
    expect(parseChordPro('   ')).toEqual([]);
  });

  test('tam şarkı parçası', () => {
    const source = '{title: Test}\n[Am]Bir satır\n[C]İki satır';
    const lines = parseChordPro(source);
    expect(lines).toHaveLength(3);
    expect(lines[0].isDirective).toBe(true);
    expect(lines[1].pairs[0].chord).toBe('Am');
    expect(lines[2].pairs[0].chord).toBe('C');
  });
});

// ----------------------------------------------------------------
// extractChords
// ----------------------------------------------------------------
describe('extractChords', () => {
  test('benzersiz akorları döndürür', () => {
    const source = '[Am]do[C]re[Am]mi[G7]fa';
    const chords = extractChords(source);
    expect(chords).toContain('Am');
    expect(chords).toContain('C');
    expect(chords).toContain('G7');
    expect(chords.filter(c => c === 'Am').length).toBe(1); // benzersiz
  });
});

// ----------------------------------------------------------------
// getDirective
// ----------------------------------------------------------------
describe('getDirective', () => {
  const lines = parseChordPro('{title: My Song}\n{key: Am}\n[C]text');

  test('mevcut direktif', () => {
    expect(getDirective(lines, 'title')).toBe('My Song');
    expect(getDirective(lines, 'key')).toBe('Am');
  });

  test('büyük/küçük harf duyarsız', () => {
    expect(getDirective(lines, 'TITLE')).toBe('My Song');
  });

  test('yok → null', () => {
    expect(getDirective(lines, 'nonexistent')).toBeNull();
  });
});
