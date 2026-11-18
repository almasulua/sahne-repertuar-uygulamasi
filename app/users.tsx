import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserSearch } from '../src/hooks/useProfile';
import { Avatar } from '../src/components/ui/Avatar';
import { Badge } from '../src/components/ui/Badge';
import { EmptyState } from '../src/components/ui/EmptyState';
import { SkeletonList, ActivityRowSkeleton } from '../src/components/ui/Skeleton';
import { listPerfProps } from '../src/lib/listPerf';

export default function UserSearchScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');

  // 300ms debounce
  useEffect(() => {
    const id = setTimeout(() => setQuery(input), 300);
    return () => clearTimeout(id);
  }, [input]);

  const { data: results, isLoading, isFetching } = useUserSearch(query);
  const showLoader = (isLoading || isFetching) && query.trim().length >= 2;

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Text className="text-primary text-xl">←</Text>
        </TouchableOpacity>
        <Text className="text-light-text-primary dark:text-text-primary text-xl font-bold flex-1">
          {t('userSearch.title', 'Kullanıcı Ara')}
        </Text>
      </View>

      <View className="mx-4 mb-3">
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-2.5 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border"
          placeholder={t('userSearch.placeholder', 'İsim veya kullanıcı adı...')}
          placeholderTextColor="#9E9E9E"
          value={input}
          onChangeText={setInput}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus
        />
      </View>

      {query.trim().length < 2 ? (
        <EmptyState
          title={t('userSearch.minChars', 'En az 2 karakter yaz')}
          subtitle={t('userSearch.minCharsHint', 'İsim veya @kullanıcıadı ile arayabilirsin.')}
          icon="🔍"
        />
      ) : showLoader ? (
        <View className="px-4">
          <SkeletonList count={5} Item={ActivityRowSkeleton} />
        </View>
      ) : (
        <FlatList
          {...listPerfProps}
          data={results ?? []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
          ListEmptyComponent={
            <EmptyState
              title={t('userSearch.empty', 'Kullanıcı bulunamadı')}
              subtitle={t('userSearch.emptyHint', 'Farklı bir kelime deneyin.')}
              icon="👤"
            />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/user/${item.id}` as never)}
              className="flex-row items-center bg-light-surface-2 dark:bg-surface-2 rounded-xl px-3 py-3 mb-2 border border-light-border dark:border-border"
              activeOpacity={0.7}
            >
              <Avatar
                uri={item.avatar_url}
                name={item.display_name ?? item.username}
                size="md"
              />
              <View className="flex-1 ml-3">
                <Text className="text-light-text-primary dark:text-text-primary font-semibold" numberOfLines={1}>
                  {item.display_name ?? item.username}
                </Text>
                <Text className="text-light-text-muted dark:text-text-muted text-xs">@{item.username}</Text>
              </View>
              {item.level && (
                <Badge label={t(`profile.${item.level}`, item.level)} variant="primary" />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}
