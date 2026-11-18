import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { usePedalStore } from '../src/stores/pedalStore';
import { ACTION_LABELS, ALL_ACTIONS } from '../src/lib/pedal/mapping';
import {
  COMMON_PEDAL_KEYS,
  PEDAL_PRESETS,
  type PedalAction,
} from '../src/lib/pedal/types';
import { dispatchPedalKey } from '../src/lib/pedal/dispatch';
import { safeBack } from '../src/lib/navigation';

export default function PedalSettingsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const {
    enabled,
    presetId,
    customMapping,
    setEnabled,
    setPreset,
    setKeyMapping,
    clearKeyMapping,
    resetToPreset,
  } = usePedalStore();

  const currentPreset = PEDAL_PRESETS.find((p) => p.id === presetId) ?? PEDAL_PRESETS[0];

  const cycleAction = (keyCode: string, current: PedalAction): void => {
    const idx = ALL_ACTIONS.indexOf(current);
    const next = ALL_ACTIONS[(idx + 1) % ALL_ACTIONS.length];
    setKeyMapping(keyCode, next);
  };

  const handleTest = (keyCode: string): void => {
    const action = dispatchPedalKey(keyCode);
    if (action === 'noop') {
      Alert.alert(
        t('pedal.testTitle', 'Pedal testi'),
        t(
          'pedal.testNoop',
          'Bu tuş hiçbir aksiyona eşlenmedi (veya pedal kapalı). Pedal\'ı açıp aksiyon atayın.',
        ),
      );
      return;
    }
    Alert.alert(
      t('pedal.testTitle', 'Pedal testi'),
      `${keyCode} → ${ACTION_LABELS[action]}`,
    );
  };

  const handleReset = (): void => {
    Alert.alert(
      t('pedal.resetTitle', 'Preset\'e geri dön'),
      t('pedal.resetConfirm', 'Tüm özel eşlemeleriniz silinecek. Devam edilsin mi?'),
      [
        { text: t('common.cancel', 'İptal'), style: 'cancel' },
        { text: t('common.confirm', 'Onayla'), onPress: resetToPreset },
      ],
    );
  };

  // Tüm bilinen key'ler için resolved action'ı hesapla (custom > preset > noop)
  const allKeys = Object.keys(COMMON_PEDAL_KEYS);
  const resolveCurrent = (keyCode: string): PedalAction => {
    if (customMapping[keyCode]) return customMapping[keyCode];
    if (currentPreset.mapping[keyCode]) return currentPreset.mapping[keyCode];
    return 'noop';
  };
  const isCustomized = (keyCode: string): boolean => customMapping[keyCode] !== undefined;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => safeBack('/(tabs)/profile')} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('pedal.title', 'Bluetooth Pedal')}
        </Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Aktiflik */}
        <View className="mx-4 mt-2 mb-4 bg-light-surface-1 dark:bg-surface-1 rounded-xl border border-light-border dark:border-border p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-light-text-primary dark:text-text-primary font-semibold">
                {t('pedal.enable', 'Pedal entegrasyonu')}
              </Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs mt-0.5">
                {t(
                  'pedal.enableDesc',
                  'Bluetooth pedal\'ınızın tuşları sahne modunda aksiyon tetikler.',
                )}
              </Text>
            </View>
            <Switch value={enabled} onValueChange={setEnabled} />
          </View>
          {enabled ? (
            <Text className="text-light-text-muted dark:text-text-muted text-xs mt-3">
              ⚠️ {t(
                'pedal.nativeHint',
                'Tuş yakalama için native key event modülü gerekli; mevcut build\'de manuel test edilebilir.',
              )}
            </Text>
          ) : null}
        </View>

        {/* Preset seçimi */}
        <Text className="text-light-text-muted dark:text-text-muted text-xs uppercase tracking-wider px-4 mb-2">
          {t('pedal.preset', 'Pedal türü')}
        </Text>
        <View className="mx-4 mb-4 bg-light-surface-1 dark:bg-surface-1 rounded-xl border border-light-border dark:border-border overflow-hidden">
          {PEDAL_PRESETS.map((p, i) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setPreset(p.id)}
              className={`flex-row items-start p-4 ${i > 0 ? 'border-t border-light-border dark:border-border' : ''}`}
            >
              <View className="flex-1 mr-3">
                <Text className="text-light-text-primary dark:text-text-primary font-semibold">{p.name}</Text>
                <Text className="text-light-text-secondary dark:text-text-secondary text-xs mt-0.5">{p.description}</Text>
              </View>
              {presetId === p.id ? <Text className="text-primary text-lg">✓</Text> : null}
            </TouchableOpacity>
          ))}
        </View>

        {/* Key mappings */}
        <View className="flex-row items-center justify-between px-4 mb-2">
          <Text className="text-light-text-muted dark:text-text-muted text-xs uppercase tracking-wider">
            {t('pedal.mappings', 'Tuş eşlemeleri')}
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text className="text-primary text-xs">{t('common.reset', 'Sıfırla')}</Text>
          </TouchableOpacity>
        </View>
        <View className="mx-4 mb-4 bg-light-surface-1 dark:bg-surface-1 rounded-xl border border-light-border dark:border-border overflow-hidden">
          {allKeys.map((keyCode, i) => {
            const action = resolveCurrent(keyCode);
            const customized = isCustomized(keyCode);
            return (
              <View
                key={keyCode}
                className={`flex-row items-center p-3 ${i > 0 ? 'border-t border-light-border dark:border-border' : ''}`}
              >
                <View className="w-24">
                  <Text className="text-light-text-primary dark:text-text-primary font-mono text-sm">{keyCode}</Text>
                  <Text className="text-light-text-muted dark:text-text-muted text-[10px]">{COMMON_PEDAL_KEYS[keyCode]}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => cycleAction(keyCode, action)}
                  className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-lg px-3 py-2 mr-2 border border-light-border dark:border-border"
                >
                  <Text className="text-light-text-primary dark:text-text-primary text-xs">{ACTION_LABELS[action]}</Text>
                </TouchableOpacity>
                {customized ? (
                  <TouchableOpacity onPress={() => clearKeyMapping(keyCode)} className="mr-2">
                    <Text className="text-light-text-muted dark:text-text-muted text-sm">↺</Text>
                  </TouchableOpacity>
                ) : null}
                <TouchableOpacity
                  onPress={() => handleTest(keyCode)}
                  className="bg-primary px-3 py-1.5 rounded-lg"
                >
                  <Text className="text-white text-xs">{t('pedal.test', 'Test')}</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        <Text className="text-light-text-muted dark:text-text-muted text-xs px-4">
          {t(
            'pedal.tip',
            '💡 Eşlemeye dokunarak action\'ı değiştir. ↺ ile preset\'e geri dön. Test düğmesi tuşu simüle eder.',
          )}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
