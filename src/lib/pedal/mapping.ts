import {
  PEDAL_PRESETS,
  type PedalAction,
  type PedalKeyMapping,
  type PedalPreset,
} from './types';

/**
 * Saf mapping fonksiyonları. Store / dispatch'ten bağımsız test edilebilir.
 */

/** Preset ID'den preset nesnesini getir; bulunamazsa null. */
export function getPresetById(id: string): PedalPreset | null {
  return PEDAL_PRESETS.find((p) => p.id === id) ?? null;
}

/**
 * Key code'u action'a çevir.
 * - Custom mapping varsa onu kullan.
 * - Yoksa preset mapping'ine düş.
 * - O da yoksa 'noop'.
 */
export function resolveAction(
  keyCode: string,
  customMapping: PedalKeyMapping | null,
  presetId: string,
): PedalAction {
  if (customMapping && customMapping[keyCode]) {
    return customMapping[keyCode];
  }
  const preset = getPresetById(presetId);
  if (preset && preset.mapping[keyCode]) {
    return preset.mapping[keyCode];
  }
  return 'noop';
}

/** İki mapping'i birleştir (custom override eder). */
export function mergeMappings(
  base: PedalKeyMapping,
  override: PedalKeyMapping | null,
): PedalKeyMapping {
  if (!override) return { ...base };
  return { ...base, ...override };
}

/**
 * Action'lar arasında ilgili StageView aksiyon callback'lerini eşler.
 * Settings UI'da kullanıcıya gösterilecek label'lar.
 */
export const ACTION_LABELS: Record<PedalAction, string> = {
  next_song: 'Sonraki şarkı',
  prev_song: 'Önceki şarkı',
  scroll_up: 'Yukarı kaydır',
  scroll_down: 'Aşağı kaydır',
  toggle_play: 'Çal/Duraklat',
  transpose_up: 'Yarım ton yükselt',
  transpose_down: 'Yarım ton düşür',
  noop: 'Atla',
};

export const ALL_ACTIONS: PedalAction[] = [
  'next_song',
  'prev_song',
  'scroll_up',
  'scroll_down',
  'toggle_play',
  'transpose_up',
  'transpose_down',
  'noop',
];
