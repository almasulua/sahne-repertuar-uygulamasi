import type { SetlistItem } from '../../types/setlist';

/** Toplam tahmini süreyi dakika olarak hesaplar */
export function calculateTotalDuration(items: SetlistItem[]): number {
  let total = 0;
  for (const item of items) {
    if (item.item_type === 'break') {
      total += item.break_duration ?? 0;
    } else if (item.song?.duration) {
      total += Math.ceil(item.song.duration / 60); // saniyeden dakikaya
    }
  }
  return total;
}

/** Dakikayı "1s 30dk" formatına çevirir */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}dk`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}s ${m}dk` : `${h}s`;
}

/** Setlist item sayısını (sadece şarkılar) döner */
export function getSongCount(items: SetlistItem[]): number {
  return items.filter((i) => i.item_type === 'song').length;
}
