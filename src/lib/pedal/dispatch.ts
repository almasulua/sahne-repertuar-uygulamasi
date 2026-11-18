import { usePedalStore } from '../../stores/pedalStore';
import { resolveAction } from './mapping';
import type { PedalAction } from './types';
import { useEffect } from 'react';

/**
 * Pedal aksiyonu için callback registry.
 * StageView ve diğer ekranlar burada handler kaydeder; bir tuş geldiğinde
 * sadece aktif (en son register edilen) handler çağrılır.
 */
type PedalHandler = (action: PedalAction) => void;

let activeHandler: PedalHandler | null = null;

/**
 * Bir ekran/component mount olduğunda kendi aksiyonlarını kayıt eder.
 * Unmount'ta otomatik temizlenir.
 *
 * Aynı anda birden fazla ekran register olursa son register olan kazanır
 * (modal vs. arka ekran senaryosu).
 */
export function usePedalActions(handler: PedalHandler): void {
  useEffect(() => {
    const prev = activeHandler;
    activeHandler = handler;
    return () => {
      if (activeHandler === handler) {
        activeHandler = prev;
      }
    };
  }, [handler]);
}

/**
 * Native key event modülü tarafından çağrılır.
 *
 * Entegrasyon (gelecek):
 *   `react-native-hardware-keyboard-events` veya benzer bir modül
 *   eklendiğinde root layout'ta:
 *
 *     import { dispatchPedalKey } from '@/lib/pedal/dispatch';
 *     KeyEvent.onKeyDownListener((e) => dispatchPedalKey(e.keyCode));
 *
 * Native modül eklenene kadar bu fonksiyon test/manuel tetikleme için
 * de export edilir (`window.dispatchPedalKey('ArrowRight')` ile dev'de denenebilir).
 */
export function dispatchPedalKey(keyCode: string): PedalAction {
  const { enabled, presetId, customMapping } = usePedalStore.getState();
  if (!enabled) return 'noop';
  const action = resolveAction(keyCode, customMapping, presetId);
  if (action !== 'noop' && activeHandler) {
    activeHandler(action);
  }
  return action;
}

/** Test ve manuel temizleme için. */
export function _resetPedalHandler(): void {
  activeHandler = null;
}
