/**
 * Bluetooth pedal entegrasyon tipleri.
 *
 * BT pedalları (AirTurn, PageFlip, iRig BlueBoard, vs.) Bluetooth HID üzerinden
 * standart klavye tuş kodları yollar. Bu modül kod ↔ action eşlemesini ve
 * action dispatch'ini yönetir.
 *
 * Gerçek key event capture şu an Expo SDK'da first-class değil; bir native modül
 * (örn. `react-native-hardware-keyboard-events` veya custom modül) ile EAS build'e
 * eklenmesi gerekir. Bu modülün giriş noktası `dispatchPedalKey(keyCode)` —
 * native modül bu fonksiyonu çağırır, geri kalanı pure JS olarak çalışır.
 */

/** Pedalın tetikleyebileceği uygulama action'ları. StageView/Player ile koordine olur. */
export type PedalAction =
  | 'next_song'
  | 'prev_song'
  | 'scroll_up'
  | 'scroll_down'
  | 'toggle_play'
  | 'transpose_up'
  | 'transpose_down'
  | 'noop';

/** Standart BT pedal'ların yolladığı yaygın HID key code'ları (USB HID Usage IDs). */
export const COMMON_PEDAL_KEYS: Record<string, string> = {
  // AirTurn varsayılan
  ArrowLeft:  'Sol ok (←)',
  ArrowRight: 'Sağ ok (→)',
  ArrowUp:    'Yukarı ok (↑)',
  ArrowDown:  'Aşağı ok (↓)',
  PageUp:     'Page Up',
  PageDown:   'Page Down',
  // iRig BlueBoard
  A:          'Harf A',
  B:          'Harf B',
  C:          'Harf C',
  D:          'Harf D',
  // Diğer
  Space:      'Boşluk',
  Enter:      'Enter',
};

/** Kullanıcının özelleştirebileceği eşleme. */
export type PedalKeyMapping = Record<string, PedalAction>;

/** Sahnede yaygın pedal preset'leri. */
export interface PedalPreset {
  id: string;
  name: string;
  description: string;
  mapping: PedalKeyMapping;
}

/**
 * Yaygın pedal preset'leri.
 * Kullanıcı kendi pedalına göre seçer veya manuel custom mapping yapar.
 */
export const PEDAL_PRESETS: PedalPreset[] = [
  {
    id: 'airturn_default',
    name: 'AirTurn (varsayılan)',
    description: 'Sol/Sağ ok tuşlarıyla önceki/sonraki şarkı',
    mapping: {
      ArrowLeft: 'prev_song',
      ArrowRight: 'next_song',
      ArrowUp: 'scroll_up',
      ArrowDown: 'scroll_down',
    },
  },
  {
    id: 'pageflip',
    name: 'PageFlip (Page Up/Down)',
    description: 'Page Up/Down ile gezinme, boşluk play/pause',
    mapping: {
      PageUp: 'prev_song',
      PageDown: 'next_song',
      Space: 'toggle_play',
    },
  },
  {
    id: 'irig_blueboard',
    name: 'iRig BlueBoard (A/B/C/D)',
    description: '4 pedal: A=geri, B=ileri, C=transpose-, D=transpose+',
    mapping: {
      A: 'prev_song',
      B: 'next_song',
      C: 'transpose_down',
      D: 'transpose_up',
    },
  },
];

export const DEFAULT_PRESET_ID = 'airturn_default';
