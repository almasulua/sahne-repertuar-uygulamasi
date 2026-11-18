import { Platform } from 'react-native';

/**
 * Büyük FlatList'ler için varsayılan performans propları.
 * `<FlatList {...listPerfProps} ... />` şeklinde spread'leyin.
 *
 * Ölçütler:
 * - `removeClippedSubviews`: sadece Android'de %15-30 bellek kazancı; iOS'ta sorun çıkarabilir.
 * - `windowSize=11`: varsayılan 21'den düşürdük (görünür alan + 5 ekran yukarı/aşağı).
 * - `initialNumToRender=10`: ilk paint hızını korur, sonra batch'le doldurur.
 * - `maxToRenderPerBatch=10`: batch başına yeni eklenen item sayısı.
 * - `updateCellsBatchingPeriod=50ms`: batch render arası bekleme; UI thread'i serbest tutar.
 */
export const listPerfProps = {
  removeClippedSubviews: Platform.OS === 'android',
  windowSize: 11,
  initialNumToRender: 10,
  maxToRenderPerBatch: 10,
  updateCellsBatchingPeriod: 50,
} as const;

/**
 * Sabit yükseklikli item'lar için getItemLayout factory.
 * Item başına gerçek ölçülmüş yükseklik (mb/padding dahil) verin.
 */
export function fixedItemLayout(itemHeight: number) {
  return (_: ArrayLike<unknown> | null | undefined, index: number) => ({
    length: itemHeight,
    offset: itemHeight * index,
    index,
  });
}
