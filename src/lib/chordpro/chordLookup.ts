import { GUITAR_CHORDS } from './chordData';
import { getPianoKeys, parseChordForPiano } from './pianoChordData';
import { SHARPS, ENHARMONIC } from './chordData';

export interface ChordDiagramData {
  name: string;
  guitar: typeof GUITAR_CHORDS[string] | null;
  piano: number[] | null;
}

/**
 * Akor adından gitar + piyano diyagram verisini döner.
 * Gitar: tam akor adıyla GUITAR_CHORDS'ta aranır, bulunamazsa transpoze edilmiş karşılığı denenir.
 * Piyano: her zaman hesaplanır (interval bazlı).
 */
export function lookupChord(chordName: string): ChordDiagramData {
  // Gitar diyagramı
  const guitarData = GUITAR_CHORDS[chordName] ?? null;

  // Piyano tuşları
  const pianoKeys = getPianoKeys(chordName);

  return {
    name: chordName,
    guitar: guitarData,
    piano: pianoKeys,
  };
}

/** Akorun tanınıp tanınmadığını kontrol eder */
export function isKnownChord(chordName: string): boolean {
  const parsed = parseChordForPiano(chordName);
  return parsed !== null;
}
