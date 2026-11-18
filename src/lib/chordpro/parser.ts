import { Token, TokenType, ChordTextPair, ChordProLine } from '../../types/song';

// ----------------------------------------------------------------
// Tokenizer
// ----------------------------------------------------------------

/**
 * ChordPro metnini token'lara ayırır.
 *
 * Desteklenen token türleri:
 *  - chord:     [Am], [C#maj7], [G/B] gibi köşeli parantez içi
 *  - directive: {title: My Song} gibi süslü parantez içi
 *  - newline:   \n
 *  - text:      diğer her şey
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let textBuf = '';

  const flushText = () => {
    if (textBuf) {
      tokens.push({ type: 'text', value: textBuf });
      textBuf = '';
    }
  };

  while (i < source.length) {
    const ch = source[i];

    if (ch === '\n') {
      flushText();
      tokens.push({ type: 'newline', value: '\n' });
      i++;
    } else if (ch === '[') {
      // Akor: [...]
      const end = source.indexOf(']', i);
      if (end === -1) {
        // Kapanmamış parantez → metin olarak al
        textBuf += ch;
        i++;
      } else {
        flushText();
        tokens.push({ type: 'chord', value: source.slice(i + 1, end) });
        i = end + 1;
      }
    } else if (ch === '{') {
      // Direktif: {...}
      const end = source.indexOf('}', i);
      if (end === -1) {
        textBuf += ch;
        i++;
      } else {
        flushText();
        tokens.push({ type: 'directive', value: source.slice(i + 1, end) });
        i = end + 1;
      }
    } else {
      textBuf += ch;
      i++;
    }
  }

  flushText();
  return tokens;
}

// ----------------------------------------------------------------
// AST Builder: Token[] → ChordProLine[]
// ----------------------------------------------------------------

/**
 * Token listesini satır tabanlı AST'ye dönüştürür.
 *
 * Her satır ya:
 *  - normal lyric satırı: chord-text çiftlerinden oluşur
 *  - direktif satırı: {key: value} biçiminde meta bilgi
 */
export function buildLines(tokens: Token[]): ChordProLine[] {
  const lines: ChordProLine[] = [];
  let currentPairs: ChordTextPair[] = [];
  let pendingChord: string | null = null;

  const commitLine = () => {
    // Bekleyen akor varsa boş text ile ekle
    if (pendingChord !== null) {
      currentPairs.push({ chord: pendingChord, text: '' });
      pendingChord = null;
    }
    if (currentPairs.length > 0) {
      lines.push({ pairs: currentPairs });
      currentPairs = [];
    }
  };

  for (const token of tokens) {
    switch (token.type as TokenType) {
      case 'newline':
        commitLine();
        break;

      case 'chord':
        // Önceki bekleyen akor varsa boş text ile kaydet
        if (pendingChord !== null) {
          currentPairs.push({ chord: pendingChord, text: '' });
        }
        pendingChord = token.value;
        break;

      case 'text':
        currentPairs.push({
          chord: pendingChord,
          text: token.value,
        });
        pendingChord = null;
        break;

      case 'directive': {
        // Direktif kendi satırını oluşturur
        commitLine();
        const colonIdx = token.value.indexOf(':');
        const key = colonIdx >= 0 ? token.value.slice(0, colonIdx).trim() : token.value.trim();
        const value = colonIdx >= 0 ? token.value.slice(colonIdx + 1).trim() : '';
        lines.push({
          pairs: [],
          isDirective: true,
          directiveKey: key,
          directiveValue: value,
        });
        break;
      }
    }
  }

  // Son satırı kapat
  commitLine();
  return lines;
}

// ----------------------------------------------------------------
// Ana Fonksiyon
// ----------------------------------------------------------------

/**
 * ChordPro kaynak metnini ayrıştırarak render edilebilir satır dizisine dönüştürür.
 *
 * Kullanım:
 * ```ts
 * const lines = parseChordPro(song.lyrics ?? '');
 * // → ChordProLine[]
 * ```
 */
export function parseChordPro(source: string): ChordProLine[] {
  if (!source || source.trim() === '') return [];
  const tokens = tokenize(source);
  return buildLines(tokens);
}

// ----------------------------------------------------------------
// Yardımcı: ChordPro metnindeki akorları çıkar
// ----------------------------------------------------------------

/** Verilen ChordPro metnindeki tüm benzersiz akorları döndürür. */
export function extractChords(source: string): string[] {
  const tokens = tokenize(source);
  const seen = new Set<string>();
  for (const t of tokens) {
    if (t.type === 'chord') seen.add(t.value);
  }
  return Array.from(seen);
}

/** Direktif değerini döndürür. Bulamazsa null. */
export function getDirective(lines: ChordProLine[], key: string): string | null {
  const line = lines.find(
    (l) => l.isDirective && l.directiveKey?.toLowerCase() === key.toLowerCase()
  );
  return line?.directiveValue ?? null;
}
