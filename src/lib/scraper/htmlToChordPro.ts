import { classifyLines } from './chordDetector';

/**
 * Düz metin (akor satırları + söz satırları) → ChordPro formatına dönüştürür.
 *
 * Algoritma:
 * 1. Satırları sınıflandır (chord/lyric/empty)
 * 2. Akor satırı + hemen altındaki söz satırı → akorları sözlerin üstüne yerleştir
 * 3. Yalnız akor satırı → akor directivesi
 * 4. Yalnız söz satırı → olduğu gibi
 */
export function convertToChordPro(plainText: string): string {
  const lines = classifyLines(plainText);
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const current = lines[i];

    if (current.type === 'empty') {
      result.push('');
      i++;
      continue;
    }

    if (current.type === 'chord') {
      const next = lines[i + 1];

      if (next && next.type === 'lyric') {
        // Akor satırını söz satırına birleştir
        result.push(mergeChordAndLyric(current.text, next.text));
        i += 2;
      } else {
        // Yalnız akor satırı — akorları bracket'li olarak yaz
        const chords = current.text.split(/\s+/).filter(Boolean);
        result.push(chords.map((c) => `[${c}]`).join(' '));
        i++;
      }
      continue;
    }

    // Sade söz satırı
    result.push(current.text);
    i++;
  }

  return result.join('\n');
}

/**
 * Akor satırındaki pozisyonları kullanarak sözlerin arasına [Chord] ekler.
 */
function mergeChordAndLyric(chordLine: string, lyricLine: string): string {
  // Akorların pozisyonlarını bul
  const chordPositions: { chord: string; pos: number }[] = [];
  const regex = /\S+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(chordLine)) !== null) {
    chordPositions.push({ chord: match[0], pos: match.index });
  }

  if (chordPositions.length === 0) return lyricLine;

  // Sözlere akorları yerleştir (sondan başa, pozisyon kaymaması için)
  let result = lyricLine;
  for (let j = chordPositions.length - 1; j >= 0; j--) {
    const { chord, pos } = chordPositions[j];
    const insertPos = Math.min(pos, result.length);
    result = result.slice(0, insertPos) + `[${chord}]` + result.slice(insertPos);
  }

  return result;
}

/** HTML'den düz metin çıkar (basit strip) */
export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}
