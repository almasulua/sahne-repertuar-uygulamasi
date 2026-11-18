import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Input } from '../../../src/components/ui/Input';
import { Button } from '../../../src/components/ui/Button';
import { createSongSchema, type CreateSongFormValues, type CreateSongFormInput } from '../../../src/lib/validators/songSchema';
import { useCreateSong } from '../../../src/hooks/useSongs';
import { useUIStore } from '../../../src/stores/uiStore';
import { importFromChordPro } from '../../../src/lib/chordpro/importer';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export default function AddSongScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const createSong = useCreateSong();
  const showToast = useUIStore((s) => s.showToast);

  const [importVisible, setImportVisible] = useState(false);
  const [importText, setImportText] = useState('');

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<CreateSongFormInput, unknown, CreateSongFormValues>({
    resolver: zodResolver(createSongSchema),
    defaultValues: {
      title: '',
      artist: '',
      key: '',
      lyrics: '',
      genre: [],
      status: 'learning',
      is_favorite: false,
    },
  });

  const openImport = async () => {
    setImportText('');
    setImportVisible(true);
    try {
      const fromClipboard = await Clipboard.getStringAsync();
      if (fromClipboard) setImportText(fromClipboard);
    } catch {
      // ignore
    }
  };

  const applyImport = () => {
    if (!importText.trim()) {
      setImportVisible(false);
      return;
    }
    const parsed = importFromChordPro(importText);
    setValue('title', parsed.title, { shouldValidate: true });
    if (parsed.artist) setValue('artist', parsed.artist);
    if (parsed.key) setValue('key', parsed.key);
    if (parsed.bpm != null) setValue('bpm', parsed.bpm);
    setValue('lyrics', parsed.lyrics);
    setImportVisible(false);
    showToast({
      message: t('repertoire.importedFromChordPro', 'ChordPro içe aktarıldı'),
      type: 'success',
    });
  };

  const onSubmit = async (data: CreateSongFormValues) => {
    try {
      await createSong.mutateAsync({
        title: data.title,
        artist: data.artist,
        key: data.key,
        bpm: data.bpm,
        difficulty: data.difficulty,
        lyrics: data.lyrics,
        genre: data.genre,
        source_url: data.source_url,
        personalStatus: data.status,
        personalNotes: data.notes,
        personalTags: data.tags,
      });
      showToast({ message: t('repertoire.addedSuccess'), type: 'success' });
      router.back();
    } catch (e: unknown) {
      const msg = (e as any)?.message ?? JSON.stringify(e);
      Alert.alert(t('common.error'), msg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-4 pb-8">
          {/* Header */}
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary text-base">← {t('common.back')}</Text>
            </TouchableOpacity>
            <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
              {t('repertoire.addSong')}
            </Text>
            <TouchableOpacity
              onPress={openImport}
              className="px-3 py-1.5 bg-light-surface-2 dark:bg-surface-2 rounded-lg border border-light-border dark:border-border"
            >
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs">
                {t('repertoire.importChordPro', 'İçe Aktar')}
              </Text>
            </TouchableOpacity>
          </View>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('repertoire.songTitle')}
                placeholder="Şarkı adı"
                value={value}
                onChangeText={onChange}
                error={errors.title?.message}
                required
              />
            )}
          />

          <Controller
            control={control}
            name="artist"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('repertoire.artist')}
                placeholder="Sanatçı / Grup"
                value={value ?? ''}
                onChangeText={onChange}
                error={errors.artist?.message}
              />
            )}
          />

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="key"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('repertoire.key')}
                    placeholder="Am, C, G..."
                    value={value ?? ''}
                    onChangeText={onChange}
                    error={errors.key?.message}
                  />
                )}
              />
            </View>
            <View className="flex-1">
              <Controller
                control={control}
                name="bpm"
                render={({ field: { onChange, value } }) => (
                  <Input
                    label={t('repertoire.bpm')}
                    placeholder="120"
                    keyboardType="numeric"
                    value={value?.toString() ?? ''}
                    onChangeText={(v) => onChange(v ? parseInt(v) : undefined)}
                    error={errors.bpm?.message}
                  />
                )}
              />
            </View>
          </View>

          {/* Zorluk */}
          <View className="mb-4">
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm font-medium mb-2">
              {t('repertoire.difficulty')}
            </Text>
            <Controller
              control={control}
              name="difficulty"
              render={({ field: { onChange, value } }) => (
                <View className="flex-row gap-2">
                  {DIFFICULTIES.map((d) => (
                    <TouchableOpacity
                      key={d}
                      onPress={() => onChange(d)}
                      className={[
                        'flex-1 py-2 rounded-xl border items-center',
                        value === d ? 'bg-primary border-primary' : 'border-light-border-light dark:border-border-light bg-light-surface-2 dark:bg-surface-2',
                      ].join(' ')}
                    >
                      <Text className={`text-sm ${value === d ? 'text-white font-semibold' : 'text-light-text-secondary dark:text-text-secondary'}`}>
                        {t(`repertoire.${d}`)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          <Controller
            control={control}
            name="lyrics"
            render={({ field: { onChange, value } }) => (
              <Input
                label={`${t('repertoire.lyrics')} (ChordPro)`}
                placeholder="{title: Şarkı Adı}&#10;[Am]Merhaba [C]dünya"
                multiline
                numberOfLines={8}
                value={value ?? ''}
                onChangeText={onChange}
                error={errors.lyrics?.message}
                style={{ height: 160, textAlignVertical: 'top' }}
              />
            )}
          />

          <Controller
            control={control}
            name="notes"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('repertoire.notes')}
                placeholder="Kişisel notlarınız..."
                multiline
                numberOfLines={3}
                value={value ?? ''}
                onChangeText={onChange}
                style={{ height: 80, textAlignVertical: 'top' }}
              />
            )}
          />

          <Button
            label={t('common.save')}
            variant="primary"
            size="lg"
            fullWidth
            loading={createSong.isPending}
            onPress={handleSubmit(onSubmit)}
            className="mt-2"
          />
        </View>
      </ScrollView>

      {/* ChordPro İçe Aktar Modalı */}
      <Modal
        visible={importVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setImportVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-light-border dark:border-border">
            <TouchableOpacity onPress={() => setImportVisible(false)} className="mr-3">
              <Text className="text-light-text-secondary dark:text-text-secondary text-base">{t('common.cancel')}</Text>
            </TouchableOpacity>
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold flex-1">
              {t('repertoire.importChordPro', 'İçe Aktar')}
            </Text>
            <TouchableOpacity
              onPress={applyImport}
              disabled={!importText.trim()}
              className={`px-3 py-1.5 rounded-lg ${importText.trim() ? 'bg-primary' : 'bg-light-surface-2 dark:bg-surface-2'}`}
            >
              <Text className={`text-sm font-semibold ${importText.trim() ? 'text-white' : 'text-light-text-muted dark:text-text-muted'}`}>
                {t('common.apply', 'Uygula')}
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-1 px-4 py-3">
            <Text className="text-light-text-muted dark:text-text-muted text-xs mb-2">
              {t(
                'repertoire.importHint',
                'ChordPro metnini yapıştır. {title}, {artist}, {key}, {tempo} direktifleri otomatik tanınır.'
              )}
            </Text>
            <TextInput
              className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-3 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border"
              multiline
              value={importText}
              onChangeText={setImportText}
              placeholder={'{title: ...}\n{artist: ...}\n[Am]Yağmur [C]yağıyor'}
              placeholderTextColor="#9E9E9E"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
