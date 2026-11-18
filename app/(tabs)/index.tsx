import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { usePersonalSongs } from '../../src/hooks/useSongs';
import { useMyGroups } from '../../src/hooks/useGroups';
import { SongCard } from '../../src/components/song/SongCard';
import { GroupCard } from '../../src/components/group/GroupCard';
import { ToastContainer } from '../../src/components/ui/Toast';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  const { data: songs } = usePersonalSongs();
  const { data: groups } = useMyGroups();

  const recentSongs = songs?.slice(0, 3) ?? [];
  const recentGroups = groups?.slice(0, 3) ?? [];

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 pt-4 pb-2">
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm">Hoş geldin,</Text>
          <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold">
            {user?.display_name ?? user?.username ?? 'Müzisyen'} 🎵
          </Text>
        </View>

        {/* Son Şarkılar */}
        <View className="mt-6 px-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-semibold">
              {t('home.recentSongs')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/repertoire')}>
              <Text className="text-primary text-sm">{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {recentSongs.length === 0 ? (
            <TouchableOpacity
              className="bg-light-surface-2 dark:bg-surface-2 border border-light-border dark:border-border rounded-2xl p-6 items-center"
              onPress={() => router.push('/(tabs)/repertoire/add')}
            >
              <Text className="text-3xl mb-2">🎵</Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-sm text-center">
                {t('home.addFirstSong')}
              </Text>
            </TouchableOpacity>
          ) : (
            recentSongs.map((ps) => (
              <SongCard
                key={ps.id}
                personalSong={ps}
                compact
                onPress={() => router.push(`/(tabs)/repertoire/${ps.song_id}`)}
              />
            ))
          )}
        </View>

        {/* Gruplarım */}
        <View className="mt-6 px-4 pb-8">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-semibold">
              {t('home.myGroups')}
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/groups')}>
              <Text className="text-primary text-sm">{t('home.viewAll')}</Text>
            </TouchableOpacity>
          </View>

          {recentGroups.length === 0 ? (
            <TouchableOpacity
              className="bg-light-surface-2 dark:bg-surface-2 border border-light-border dark:border-border rounded-2xl p-6 items-center"
              onPress={() => router.push('/(tabs)/groups/create')}
            >
              <Text className="text-3xl mb-2">👥</Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-sm text-center">
                {t('home.joinOrCreate')}
              </Text>
            </TouchableOpacity>
          ) : (
            recentGroups.map((g) => (
              <GroupCard
                key={g.id}
                group={g}
                onPress={() => router.push(`/(tabs)/groups/${g.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>
      <ToastContainer />
    </SafeAreaView>
  );
}
