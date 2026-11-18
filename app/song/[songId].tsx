import React from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSong } from '../../src/hooks/useSongs';
import { useRatingSummary } from '../../src/hooks/useSongFeedback';
import { usePlayerStore } from '../../src/stores/playerStore';
import { ChordProRenderer } from '../../src/components/song/ChordProRenderer';
import { SongFeedbackPanel } from '../../src/components/song/SongFeedbackPanel';
import { RatingStars } from '../../src/components/song/RatingStars';
import { LoadingSpinner } from '../../src/components/ui/LoadingSpinner';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Universal modal şarkı görünümü.
 * Grup sohbetinden paylaşılan şarkı kartına tıklandığında açılır.
 */
export default function UniversalSongView() {
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const { data: song, isLoading } = useSong(songId ?? null);
  const { data: ratingSummary } = useRatingSummary(songId ?? null);
  const { transposeSteps, fontSize } = usePlayerStore();

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (!song) return null;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="px-4 pt-2">
          <Text className="text-light-text-primary dark:text-text-primary text-xl font-semibold">{song.title}</Text>
          {song.artist ? (
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm mt-1">{song.artist}</Text>
          ) : null}
          {ratingSummary && ratingSummary.count > 0 ? (
            <View className="flex-row items-center mt-2">
              <RatingStars value={Math.round(ratingSummary.average)} size={16} readonly />
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs ml-2">
                {ratingSummary.average.toFixed(1)} ({ratingSummary.count})
              </Text>
            </View>
          ) : null}
        </View>

        <View className="px-4 mt-3">
          {song.lyrics ? (
            <ChordProRenderer
              source={song.lyrics}
              transposeSteps={transposeSteps}
              fontSize={fontSize}
            />
          ) : null}
        </View>

        {songId ? <SongFeedbackPanel songId={songId} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
