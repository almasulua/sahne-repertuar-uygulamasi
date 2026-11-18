import { convertToChordPro, stripHtml } from '../src/lib/scraper/htmlToChordPro';

// ----------------------------------------------------------------
// stripHtml
// ----------------------------------------------------------------
describe('stripHtml', () => {
  test('boş string → boş', () => {
    expect(stripHtml('')).toBe('');
  });

  test('HTML tag\'leri kaldırılır', () => {
    expect(stripHtml('<p>Hello</p>')).toBe('Hello\n');
    expect(stripHtml('<div>Test</div>')).toBe('Test\n');
  });

  test('<br> → satır sonu', () => {
    expect(stripHtml('a<br>b')).toBe('a\nb');
    expect(stripHtml('a<br/>b')).toBe('a\nb');
    expect(stripHtml('a<br />b')).toBe('a\nb');
    expect(stripHtml('a<BR>b')).toBe('a\nb'); // case-insensitive
  });

  test('HTML entity\'leri çözer', () => {
    expect(stripHtml('Tom &amp; Jerry')).toBe('Tom & Jerry');
    expect(stripHtml('&lt;tag&gt;')).toBe('<tag>');
    expect(stripHtml('a&nbsp;b')).toBe('a b');
    expect(stripHtml('don&#39;t')).toBe("don't");
    expect(stripHtml('say &quot;hi&quot;')).toBe('say "hi"');
  });

  test('iç içe tag\'leri temizler', () => {
    expect(stripHtml('<div><p><strong>x</strong></p></div>')).toContain('x');
  });

  test('attribute\'lu tag\'ler', () => {
    expect(stripHtml('<a href="foo">link</a>')).toBe('link');
  });
});

// ----------------------------------------------------------------
// convertToChordPro
// ----------------------------------------------------------------
describe('convertToChordPro', () => {
  test('boş girdi → boş çıktı', () => {
    expect(convertToChordPro('')).toBe('');
  });

  test('sadece söz → değişmez', () => {
    const input = 'Bu bir söz satırı\nİkinci satır';
    expect(convertToChordPro(input)).toBe('Bu bir söz satırı\nİkinci satır');
  });

  test('akor satırı + söz satırı → birleşir', () => {
    const input = 'Am      C\nYağmur yağıyor';
    const result = convertToChordPro(input);
    expect(result).toContain('[Am]');
    expect(result).toContain('[C]');
    expect(result).toContain('Yağmur');
  });

  test('yalnız akor satırı → bracket\'li yazılır', () => {
    const input = 'Am C G F';
    const result = convertToChordPro(input);
    expect(result).toBe('[Am] [C] [G] [F]');
  });

  test('akor satır pozisyonları korunur', () => {
    // "Am" 0. pozisyonda, "C" 8. pozisyonda
    const input = 'Am      C\nabcdefghij';
    const result = convertToChordPro(input);
    // [Am] kelimenin başına, [C] 8. pozisyona yerleşmeli
    expect(result.startsWith('[Am]')).toBe(true);
    expect(result).toContain('[C]');
  });

  test('boş satırlar korunur', () => {
    const input = 'Am\nsöz\n\nC\nbaşka söz';
    const result = convertToChordPro(input);
    const lines = result.split('\n');
    expect(lines).toContain('');
  });

  test('birden fazla akor+söz çifti', () => {
    const input = 'Am C\nbir iki\nG F\nüç dört';
    const result = convertToChordPro(input);
    expect(result).toContain('[Am]');
    expect(result).toContain('[C]');
    expect(result).toContain('[G]');
    expect(result).toContain('[F]');
  });

  test('akor satırı pozisyon söz uzunluğunu aşarsa sona eklenir', () => {
    // Akor pozisyonu 20'de ama söz sadece 5 karakter
    const input = '                    Am\nkısa';
    const result = convertToChordPro(input);
    expect(result).toContain('[Am]');
    // 'kısa' içerikte korunmalı
    expect(result).toContain('kısa');
  });

  test('son satır akor satırıysa bracket\'li yazılır (sonrası söz yok)', () => {
    const input = 'söz satırı\nAm C';
    const result = convertToChordPro(input);
    expect(result).toContain('[Am] [C]');
  });
});
