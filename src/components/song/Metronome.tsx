import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Vibration, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

interface MetronomeProps {
  visible: boolean;
  initialBpm?: number | null;
  onClose: () => void;
}

const MIN_BPM = 40;
const MAX_BPM = 240;

/**
 * Görsel + dokunsal metronom. Ses paketi gerektirmez:
 *  - iOS/Android: her vuruşta `Haptics.impactAsync` (medium)
 *  - Android ek: kısa Vibration darbesi
 *  - Görsel: yanıp sönen daire + sayım göstergesi (1-2-3-4)
 */
export function Metronome({ visible, initialBpm, onClose }: MetronomeProps) {
  const { t } = useTranslation();
  const [bpm, setBpm] = useState(clampBpm(initialBpm ?? 100));
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(0);
  const beatsPerBar = 4;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (visible) setBpm(clampBpm(initialBpm ?? 100));
  }, [visible, initialBpm]);

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
      return;
    }
    const intervalMs = 60000 / bpm;
    let count = 0;
    const tick = () => {
      const isDownbeat = count % beatsPerBar === 0;
      setBeat(count % beatsPerBar);
      Haptics.impactAsync(
        isDownbeat ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light
      ).catch(() => {});
      if (Platform.OS === 'android') {
        Vibration.vibrate(isDownbeat ? 60 : 30);
      }
      count++;
    };
    tick();
    intervalRef.current = setInterval(tick, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, bpm]);

  useEffect(() => {
    if (!visible && running) setRunning(false);
  }, [visible]);

  const adjustBpm = (delta: number) => setBpm((b) => clampBpm(b + delta));

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-light-surface dark:bg-surface rounded-t-3xl p-6">
          <View className="flex-row items-center mb-4">
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold flex-1">
              {t('metronome.title', 'Metronom')}
            </Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1.5">
              <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('common.done')}</Text>
            </TouchableOpacity>
          </View>

          {/* Görsel beat indicator */}
          <View className="items-center mb-6">
            <View className="flex-row gap-2 mb-4">
              {Array.from({ length: beatsPerBar }).map((_, i) => (
                <View
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    running && i === beat
                      ? i === 0
                        ? 'bg-primary'
                        : 'bg-accent'
                      : 'bg-light-surface-3 dark:bg-surface-3'
                  }`}
                />
              ))}
            </View>
            <View
              className={`w-28 h-28 rounded-full items-center justify-center ${
                running && beat === 0
                  ? 'bg-primary'
                  : running
                  ? 'bg-accent/40'
                  : 'bg-light-surface-2 dark:bg-surface-2'
              }`}
            >
              <Text
                className={`text-4xl font-bold ${
                  running && beat === 0 ? 'text-white' : 'text-light-text-primary dark:text-text-primary'
                }`}
              >
                {bpm}
              </Text>
              <Text
                className={`text-xs ${
                  running && beat === 0 ? 'text-white/80' : 'text-light-text-muted dark:text-text-muted'
                }`}
              >
                BPM
              </Text>
            </View>
          </View>

          {/* BPM kontrolleri */}
          <View className="flex-row items-center justify-center gap-2 mb-4">
            <BpmButton label="-10" onPress={() => adjustBpm(-10)} />
            <BpmButton label="-1" onPress={() => adjustBpm(-1)} />
            <TouchableOpacity
              onPress={() => setRunning((r) => !r)}
              className={`px-6 py-3 rounded-xl ${running ? 'bg-error' : 'bg-primary'}`}
            >
              <Text className="text-white font-semibold">
                {running ? t('metronome.stop', 'Dur') : t('metronome.start', 'Başlat')}
              </Text>
            </TouchableOpacity>
            <BpmButton label="+1" onPress={() => adjustBpm(1)} />
            <BpmButton label="+10" onPress={() => adjustBpm(10)} />
          </View>

          <Text className="text-light-text-muted dark:text-text-muted text-xs text-center">
            {t('metronome.hint', 'Cihazın titreşim ve haptic geri bildirimini kullanır.')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function BpmButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-light-surface-2 dark:bg-surface-2 px-3 py-2 rounded-lg border border-light-border dark:border-border min-w-[44px] items-center"
    >
      <Text className="text-light-text-primary dark:text-text-primary text-sm font-medium">{label}</Text>
    </TouchableOpacity>
  );
}

function clampBpm(v: number): number {
  if (!Number.isFinite(v)) return 100;
  return Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(v)));
}
