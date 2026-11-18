/**
 * Metin satırlarında akor pattern'larını tespit eder.
 * Regex: A-G kök + opsiyonel # veya b + opsiyonel kalite + opsiyonel /bass
 */
const CHORD_REGEX = /\b([A-G][#b]?)(m|min|maj|dim|aug|sus[24]?|add)?(\d+)?(\/[A-G][#b]?)?\b/g;

/** Bir satırın akor satırı olup olmadığını tespit eder */
export function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  // Akor eşleşmeleri bul
  const matches = trimmed.match(CHORD_REGEX);
  if (!matches) return false;

  // Satırın çoğunluğu akor + boşluk ise akor satırı
  const chordChars = matches.join('').length;
  const nonSpaceChars = trimmed.replace(/\s/g, '').length;

  return chordChars / nonSpaceChars > 0.7;
}

/** Metinden akorları çıkarır */
export function detectChords(text: string): string[] {
  const matches = text.match(CHORD_REGEX);
  if (!matches) return [];
  return [...new Set(matches)];
}

/** Satırları sınıflandırır: chord, lyric veya empty */
export function classifyLines(text: string): Array<{ type: 'chord' | 'lyric' | 'empty'; text: string }> {
  return text.split('\n').map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return { type: 'empty', text: '' };
    if (isChordLine(trimmed)) return { type: 'chord', text: trimmed };
    return { type: 'lyric', text: trimmed };
  });
}
