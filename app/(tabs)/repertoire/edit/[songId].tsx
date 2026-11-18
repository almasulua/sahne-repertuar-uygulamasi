import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../../../src/components/ui/Input';
import { Button } from '../../../../src/components/ui/Button';
import { LoadingSpinner } from '../../../../src/components/ui/LoadingSpinner';
import { songSchema, type SongFormValues, type SongFormInput } from '../../../../src/lib/validators/songSchema';
import { useSong, useUpdateSong } from '../../../../src/hooks/useSongs';
import { useUIStore } from '../../../../src/stores/uiStore';

export default function EditSongScreen() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: song, isLoading } = useSong(songId ?? null);
  const updateSong = useUpdateSong();
  const showToast = useUIStore((s) => s.showToast);

  const { control, handleSubmit, formState: { errors } } = useForm<SongFormInput, unknown, SongFormValues>({
    resolver: zodResolver(songSchema),
    values: song
      ? {
          title: song.title,
          artist: song.artist ?? '',
          key: song.key ?? '',
          bpm: song.bpm ?? undefined,
          difficulty: song.difficulty ?? undefined,
          lyrics: song.lyrics ?? '',
          source_url: song.source_url ?? '',
          genre: song.genre ?? [],
        }
      : undefined,
  });

  const onSubmit = async (data: SongFormValues) => {
    if (!songId) return;
    try {
      await updateSong.mutateAsync({ id: songId, ...data });
      showToast({ message: t('repertoire.updatedSuccess'), type: 'success' });
      router.back();
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="px-4 pt-4 pb-8">
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary text-base">← {t('common.back')}</Text>
            </TouchableOpacity>
            <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
              {t('repertoire.editSong')}
            </Text>
          </View>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('repertoire.songTitle')}
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
                value={value ?? ''}
                onChangeText={onChange}
              />
            )}
          />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Controller
                control={control}
                name="key"
                render={({ field: { onChange, value } }) => (
                  <Input label={t('repertoire.key')} value={value ?? ''} onChangeText={onChange} />
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
                    keyboardType="numeric"
                    value={value?.toString() ?? ''}
                    onChangeText={(v) => onChange(v ? parseInt(v) : undefined)}
                  />
                )}
              />
            </View>
          </View>

          <Controller
            control={control}
            name="lyrics"
            render={({ field: { onChange, value } }) => (
              <Input
                label={`${t('repertoire.lyrics')} (ChordPro)`}
                multiline
                numberOfLines={10}
                value={value ?? ''}
                onChangeText={onChange}
                style={{ height: 200, textAlignVertical: 'top' }}
              />
            )}
          />

          <Button
            label={t('common.save')}
            variant="primary"
            size="lg"
            fullWidth
            loading={updateSong.isPending}
            onPress={handleSubmit(onSubmit)}
            className="mt-2"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
