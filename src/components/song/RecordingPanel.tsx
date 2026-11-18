import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Constants from 'expo-constants';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import { useRecordingsStore, type SongRecording } from '../../stores/recordingsStore';

// Expo Go'da expo-audio (SDK 53+) native modül içermez.
// Native init crash'ini önlemek için require'ı **çağırmadan önce** Expo Go kontrolü yap.
function isExpoGo(): boolean {
  return Constants.appOwnership === 'expo';
}

type ExpoAudioModule = typeof import('expo-audio');
let ExpoAudio: ExpoAudioModule | null = null;
if (!isExpoGo()) {
  try {
    ExpoAudio = require('expo-audio') as ExpoAudioModule;
  } catch {
    // Modül yüklenemedi — UnsupportedPanel düşecek
  }
}

interface RecordingPanelProps {
  visible: boolean;
  songId: string;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

export function RecordingPanel({ visible, songId, onClose }: RecordingPanelProps) {
  const supportsAudio = !!ExpoAudio && !isExpoGo();

  if (!supportsAudio) {
    return (
      <UnsupportedPanel visible={visible} onClose={onClose} />
    );
  }

  return <ActiveRecordingPanel visible={visible} songId={songId} onClose={onClose} />;
}

function UnsupportedPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-light-surface dark:bg-surface rounded-t-3xl p-6">
          <View className="flex-row items-center mb-4">
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold flex-1">
              {t('recordings.title', 'Kayıtlar')}
            </Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1.5">
              <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('common.done')}</Text>
            </TouchableOpacity>
          </View>
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm leading-5 mb-3">
            {t(
              'recordings.devBuildRequired',
              'Ses kaydı Expo Go\'da desteklenmiyor. Bu özelliği kullanmak için development build oluştur.'
            )}
          </Text>
          <Text className="text-light-text-muted dark:text-text-muted text-xs">
            {t(
              'recordings.devBuildHint',
              'eas build --profile development --platform android komutuyla bir geliştirme yapısı oluşturabilirsin.'
            )}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

function ActiveRecordingPanel({
  visible,
  songId,
  onClose,
}: {
  visible: boolean;
  songId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const audio = ExpoAudio!;
  const recorder = audio.useAudioRecorder(audio.RecordingPresets.HIGH_QUALITY);
  const recorderState = audio.useAudioRecorderState(recorder, 250);
  const recordings = useRecordingsStore((s) => s.recordings[songId] ?? []);
  const addRecording = useRecordingsStore((s) => s.add);
  const removeRecording = useRecordingsStore((s) => s.remove);

  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeRecording = recordings.find((r) => r.id === activeId) ?? null;
  const player = audio.useAudioPlayer(activeRecording ? { uri: activeRecording.uri } : null);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const status = await audio.requestRecordingPermissionsAsync();
      setPermissionGranted(status.granted);
      if (status.granted) {
        await audio.setAudioModeAsync({
          allowsRecording: true,
          playsInSilentMode: true,
        });
      }
    })().catch((e) => {
      if (__DEV__) console.warn('[RecordingPanel] permission error', e);
      setPermissionGranted(false);
    });
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      try {
        player.pause();
      } catch {
        // ignore
      }
      setActiveId(null);
    }
  }, [visible]);

  const startRecording = async () => {
    if (!permissionGranted) {
      Alert.alert(
        t('common.error'),
        t('recordings.permissionDenied', 'Mikrofon izni reddedildi.')
      );
      return;
    }
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch (e) {
      if (__DEV__) console.error('[startRecording]', e);
      Alert.alert(t('common.error'), String(e));
    }
  };

  const stopRecording = async () => {
    try {
      const durationSec = recorderState.durationMillis
        ? recorderState.durationMillis / 1000
        : recorder.currentTime ?? 0;
      await recorder.stop();
      const uri = recorder.uri;
      if (!uri) return;
      addRecording(songId, {
        uri,
        durationMs: Math.round(durationSec * 1000),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch (e) {
      if (__DEV__) console.error('[stopRecording]', e);
      Alert.alert(t('common.error'), String(e));
    }
  };

  const togglePlay = (rec: SongRecording) => {
    if (activeId === rec.id) {
      try {
        if (player.playing) player.pause();
        else player.play();
      } catch {
        // ignore
      }
    } else {
      setActiveId(rec.id);
      setTimeout(() => {
        try {
          player.play();
        } catch {
          // ignore
        }
      }, 50);
    }
  };

  const shareRecording = async (rec: SongRecording) => {
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        Alert.alert(t('common.error'), t('recordings.shareUnavailable', 'Paylaşım bu cihazda kullanılamıyor.'));
        return;
      }
      await Sharing.shareAsync(rec.uri, {
        mimeType: 'audio/m4a',
        dialogTitle: rec.label ?? t('recordings.title', 'Kayıtlar'),
      });
    } catch (e) {
      if (__DEV__) console.warn('[shareRecording]', e);
    }
  };

  const confirmRemove = (rec: SongRecording) => {
    Alert.alert(
      t('recordings.delete', 'Kaydı sil'),
      t('recordings.deleteConfirm', 'Bu kaydı silmek istediğinden emin misin?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            if (activeId === rec.id) {
              try {
                player.pause();
              } catch {
                // ignore
              }
              setActiveId(null);
            }
            removeRecording(songId, rec.id);
          },
        },
      ]
    );
  };

  const isRecording = recorderState.isRecording;
  const liveDuration = recorderState.durationMillis ?? 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-light-surface dark:bg-surface rounded-t-3xl max-h-[80%]">
          <View className="flex-row items-center px-5 py-4 border-b border-light-border dark:border-border">
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold flex-1">
              {t('recordings.title', 'Kayıtlar')}
            </Text>
            <TouchableOpacity onPress={onClose} className="px-3 py-1.5">
              <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('common.done')}</Text>
            </TouchableOpacity>
          </View>

          <View className="items-center py-6 border-b border-light-border dark:border-border">
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              disabled={permissionGranted === false}
              className={`w-20 h-20 rounded-full items-center justify-center ${
                isRecording ? 'bg-error' : 'bg-primary'
              } ${permissionGranted === false ? 'opacity-50' : ''}`}
            >
              <Text className="text-white text-2xl">{isRecording ? '■' : '●'}</Text>
            </TouchableOpacity>
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-mono mt-3">
              {formatDuration(liveDuration)}
            </Text>
            {permissionGranted === false && (
              <Text className="text-error text-xs mt-2 px-6 text-center">
                {t('recordings.permissionRequired', 'Mikrofon izni gerekli')}
              </Text>
            )}
            {Platform.OS === 'web' && (
              <Text className="text-light-text-muted dark:text-text-muted text-xs mt-2 px-6 text-center">
                {t(
                  'recordings.webNotice',
                  'Web ortamında ses kaydı sınırlıdır; en iyi deneyim için cihazda kullan.'
                )}
              </Text>
            )}
          </View>

          <ScrollView className="px-4 py-3">
            {recordings.length === 0 ? (
              <Text className="text-light-text-muted dark:text-text-muted text-center py-8 text-sm">
                {t('recordings.empty', 'Henüz kayıt yok. Yukarıdaki butonla başlat.')}
              </Text>
            ) : (
              recordings.map((rec) => {
                const isActive = activeId === rec.id;
                const isPlaying = isActive && player.playing;
                return (
                  <View
                    key={rec.id}
                    className="flex-row items-center bg-light-surface-2 dark:bg-surface-2 rounded-xl px-3 py-3 mb-2 border border-light-border dark:border-border"
                  >
                    <TouchableOpacity
                      onPress={() => togglePlay(rec)}
                      className="w-10 h-10 rounded-full bg-primary items-center justify-center mr-3"
                    >
                      <Text className="text-white text-base">{isPlaying ? '⏸' : '▶'}</Text>
                    </TouchableOpacity>
                    <View className="flex-1">
                      <Text className="text-light-text-primary dark:text-text-primary text-sm font-medium">
                        {rec.label ?? formatDate(rec.createdAt)}
                      </Text>
                      <Text className="text-light-text-muted dark:text-text-muted text-xs">
                        {formatDuration(rec.durationMs)}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => shareRecording(rec)} className="px-2 py-1">
                      <Text className="text-primary text-sm">{t('common.share', 'Paylaş')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => confirmRemove(rec)} className="px-2 py-1">
                      <Text className="text-error text-sm">{t('common.delete')}</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
