import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '../../../../../src/components/ui/Input';
import { Button } from '../../../../../src/components/ui/Button';
import { songSchema, type SongFormValues, type SongFormInput } from '../../../../../src/lib/validators/songSchema';
import { useCreateSongOnly, useAddSongToGroup } from '../../../../../src/hooks/useSongs';
import { useUIStore } from '../../../../../src/stores/uiStore';

const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;

export default function AddGroupSongScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const createSong = useCreateSongOnly();
  const addToGroup = useAddSongToGroup();
  const showToast = useUIStore((s) => s.showToast);

  const { control, handleSubmit, formState: { errors } } = useForm<SongFormInput, unknown, SongFormValues>({
    resolver: zodResolver(songSchema),
    defaultValues: {
      title: '',
      artist: '',
      key: '',
      lyrics: '',
      genre: [],
    },
  });

  const onSubmit = async (data: SongFormValues) => {
    if (!groupId) return;
    try {
      const song = await createSong.mutateAsync({
        title: data.title,
        artist: data.artist,
        key: data.key,
        bpm: data.bpm,
        difficulty: data.difficulty,
        lyrics: data.lyrics,
        genre: data.genre,
        source_url: data.source_url,
      });
      await addToGroup.mutateAsync({ groupId, songId: song.id });
      showToast({ message: t('groups.songAddedToGroup'), type: 'success' });
      router.back();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? t('errors.generic');
      Alert.alert(t('common.error'), msg);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View className="px-4 pt-4 pb-8">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity onPress={() => router.back()} className="mr-3">
              <Text className="text-primary text-base">← {t('common.back')}</Text>
            </TouchableOpacity>
            <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
              {t('groups.addNewSong')}
            </Text>
          </View>

          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, value } }) => (
              <Input
                label={t('repertoire.songTitle')}
                placeholder={t('repertoire.songTitle')}
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
                placeholder={t('repertoire.artist')}
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
                  />
                )}
              />
            </View>
          </View>

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
                placeholder="{title: Song Name}&#10;[Am]Hello [C]World"
                multiline
                numberOfLines={8}
                value={value ?? ''}
                onChangeText={onChange}
                style={{ height: 160, textAlignVertical: 'top' }}
              />
            )}
          />

          <Button
            label={t('groups.addToGroup')}
            variant="primary"
            size="lg"
            fullWidth
            loading={createSong.isPending || addToGroup.isPending}
            onPress={handleSubmit(onSubmit)}
            className="mt-2"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
