import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  usePersonalSongs,
  useToggleFavorite,
  useCategories,
  useCreateCategory,
  useDeleteCategory,
  useUpdateCategory,
} from '../../../src/hooks/useSongs';
import { SongCard } from '../../../src/components/song/SongCard';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { SkeletonList, SongRowSkeleton } from '../../../src/components/ui/Skeleton';
import { ToastContainer } from '../../../src/components/ui/Toast';
import { useUIStore } from '../../../src/stores/uiStore';
import type { PersonalSong, UserCategory } from '../../../src/types/song';
import { listPerfProps } from '../../../src/lib/listPerf';

type FilterKey = 'all' | 'favorites' | string;
type SortKey = 'title' | 'date' | 'artist';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6b7280', '#14b8a6'];

export default function RepertoireScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const { data: songs, isLoading, refetch, isRefetching } = usePersonalSongs();
  const { data: categories } = useCategories();
  const toggleFavorite = useToggleFavorite();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();
  const updateCategory = useUpdateCategory();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterKey>('all');
  const [sort, setSort] = useState<SortKey>('date');
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null);

  const filterTabs = useMemo(() => {
    const tabs: { key: FilterKey; label: string; color?: string }[] = [
      { key: 'all', label: t('repertoire.all', 'Tümü') },
      { key: 'favorites', label: '♥ ' + t('repertoire.favorites', 'Favoriler') },
    ];
    if (categories) {
      for (const cat of categories) {
        tabs.push({ key: cat.name, label: cat.label, color: cat.color });
      }
    }
    return tabs;
  }, [categories, t]);

  const filtered = useMemo(() => {
    if (!songs) return [];
    let list = [...songs];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (ps) =>
          ps.song?.title.toLowerCase().includes(q) ||
          ps.song?.artist?.toLowerCase().includes(q) ||
          ps.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (filterStatus === 'favorites') {
      list = list.filter((ps) => ps.is_favorite);
    } else if (filterStatus !== 'all') {
      list = list.filter((ps) => ps.status === filterStatus);
    }

    list.sort((a, b) => {
      if (sort === 'title') return (a.song?.title ?? '').localeCompare(b.song?.title ?? '');
      if (sort === 'artist') return (a.song?.artist ?? '').localeCompare(b.song?.artist ?? '');
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });

    return list;
  }, [songs, search, filterStatus, sort]);

  const handleAddCategory = useCallback(async () => {
    const label = newCategoryLabel.trim();
    if (!label) return;
    const name = 'custom_' + label.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
    try {
      await createCategory.mutateAsync({ name, label, color: selectedColor });
      setNewCategoryLabel('');
      showToast({ message: t('categories.addedSuccess', 'Kategori eklendi'), type: 'success' });
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  }, [newCategoryLabel, selectedColor, createCategory, showToast, t]);

  const handleDeleteCategory = useCallback((cat: UserCategory) => {
    if (cat.is_default) {
      Alert.alert(t('common.error'), t('categories.cannotDeleteDefault', 'Varsayılan kategoriler silinemez'));
      return;
    }
    Alert.alert(
      t('categories.deleteCategory', 'Kategori Sil'),
      t('categories.deleteConfirm', 'Bu kategoriyi silmek istediğinizden emin misiniz?'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => deleteCategory.mutate(cat.id),
        },
      ]
    );
  }, [deleteCategory, t]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingCategory) return;
    const label = newCategoryLabel.trim();
    if (!label) return;
    try {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        label,
        color: selectedColor,
      });
      setEditingCategory(null);
      setNewCategoryLabel('');
      showToast({ message: t('categories.updatedSuccess', 'Kategori güncellendi'), type: 'success' });
    } catch {
      Alert.alert(t('common.error'), t('errors.generic'));
    }
  }, [editingCategory, newCategoryLabel, selectedColor, updateCategory, showToast, t]);

  const renderItem = useCallback(
    ({ item }: { item: PersonalSong }) => (
      <SongCard
        personalSong={item}
        onPress={() => router.push(`/(tabs)/repertoire/${item.song_id}`)}
        onFavoriteToggle={() =>
          toggleFavorite.mutate({ id: item.id, isFavorite: !item.is_favorite })
        }
      />
    ),
    [router, toggleFavorite],
  );

  return (
    <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 pt-4 pb-2">
        <Text className="text-light-text-primary dark:text-text-primary text-2xl font-bold flex-1">
          {t('repertoire.title')}
        </Text>
        <TouchableOpacity
          onPress={() => router.push('/chord-library' as never)}
          className="bg-light-surface-2 dark:bg-surface-2 w-9 h-9 rounded-lg items-center justify-center mr-2 border border-light-border dark:border-border"
        >
          <Text className="text-light-text-secondary dark:text-text-secondary text-base">♪</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/browser')}
          className="bg-light-surface-2 dark:bg-surface-2 px-3 py-1.5 rounded-lg mr-2 border border-light-border dark:border-border"
        >
          <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('browser.import')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => router.push('/(tabs)/repertoire/add')}
          className="bg-primary w-9 h-9 rounded-full items-center justify-center"
        >
          <Text className="text-white text-xl font-bold">+</Text>
        </TouchableOpacity>
      </View>

      {/* Arama */}
      <View className="mx-4 mb-3">
        <TextInput
          className="bg-light-surface-2 dark:bg-surface-2 rounded-xl px-4 py-2.5 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border"
          placeholder={t('repertoire.searchPlaceholder')}
          placeholderTextColor="#9E9E9E"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filtre Sekmeleri */}
      <View className="mb-3">
        <FlatList
          horizontal
          data={filterTabs}
          keyExtractor={(o) => o.key}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setFilterStatus(item.key)}
              className={[
                'px-3 py-1.5 rounded-full border',
                filterStatus === item.key
                  ? 'border-primary'
                  : 'border-light-border-light dark:border-border-light bg-light-surface-2 dark:bg-surface-2',
              ].join(' ')}
              style={filterStatus === item.key && item.color ? { backgroundColor: item.color, borderColor: item.color } : undefined}
            >
              <Text
                className={`text-sm ${
                  filterStatus === item.key ? 'text-white font-semibold' : 'text-light-text-secondary dark:text-text-secondary'
                }`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          ListFooterComponent={
            <TouchableOpacity
              onPress={() => {
                setEditingCategory(null);
                setNewCategoryLabel('');
                setSelectedColor(COLORS[0]);
                setShowCategoryManager(true);
              }}
              className="px-3 py-1.5 rounded-full border border-dashed border-light-border-light dark:border-border-light"
            >
              <Text className="text-light-text-muted dark:text-text-muted text-sm">+</Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Liste */}
      {isLoading ? (
        <View className="px-4">
          <SkeletonList count={6} Item={SongRowSkeleton} />
        </View>
      ) : (
        <FlatList
          {...listPerfProps}
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6C63FF" />
          }
          ListEmptyComponent={
            <EmptyState
              title={t('repertoire.noSongs')}
              subtitle={t('repertoire.addFirstSong')}
              actionLabel={t('repertoire.addSong')}
              onAction={() => router.push('/(tabs)/repertoire/add')}
              icon="🎼"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Kategori Yönetim Modalı */}
      <Modal
        visible={showCategoryManager}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryManager(false)}
      >
        <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
          <View className="flex-row items-center px-4 py-3 border-b border-light-border dark:border-border">
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold flex-1">
              {t('categories.manage', 'Kategorileri Yönet')}
            </Text>
            <TouchableOpacity onPress={() => setShowCategoryManager(false)}>
              <Text className="text-primary text-base">{t('common.done')}</Text>
            </TouchableOpacity>
          </View>

          {/* Mevcut Kategoriler */}
          <FlatList
            data={categories ?? []}
            keyExtractor={(cat) => cat.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item: cat }) => (
              <View className="flex-row items-center bg-light-surface dark:bg-surface rounded-xl px-4 py-3 mb-2 border border-light-border dark:border-border">
                <View
                  style={{ backgroundColor: cat.color, width: 16, height: 16, borderRadius: 8 }}
                />
                <Text className="text-light-text-primary dark:text-text-primary flex-1 ml-3 text-base">{cat.label}</Text>
                {cat.is_default ? (
                  <Text className="text-light-text-muted dark:text-text-muted text-xs mr-2">{t('categories.default', 'Varsayılan')}</Text>
                ) : null}
                <TouchableOpacity
                  onPress={() => {
                    setEditingCategory(cat);
                    setNewCategoryLabel(cat.label);
                    setSelectedColor(cat.color);
                  }}
                  className="px-2 py-1"
                >
                  <Text className="text-primary text-sm">{t('common.edit')}</Text>
                </TouchableOpacity>
                {!cat.is_default && (
                  <TouchableOpacity
                    onPress={() => handleDeleteCategory(cat)}
                    className="px-2 py-1"
                  >
                    <Text className="text-error text-sm">{t('common.delete')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
            ListHeaderComponent={
              <Text className="text-light-text-muted dark:text-text-muted text-xs mb-3">
                {t('categories.description', 'Şarkılarınızı organize etmek için kategoriler ekleyin, düzenleyin veya silin.')}
              </Text>
            }
            ListFooterComponent={
              <View className="mt-4 bg-light-surface dark:bg-surface rounded-xl p-4 border border-light-border dark:border-border">
                <Text className="text-light-text-primary dark:text-text-primary font-semibold mb-3">
                  {editingCategory
                    ? t('categories.editCategory', 'Kategori Düzenle')
                    : t('categories.addCategory', 'Yeni Kategori')}
                </Text>
                <TextInput
                  className="bg-light-surface-2 dark:bg-surface-2 rounded-lg px-3 py-2.5 text-light-text-primary dark:text-text-primary border border-light-border dark:border-border mb-3"
                  placeholder={t('categories.labelPlaceholder', 'Kategori adı...')}
                  placeholderTextColor="#9E9E9E"
                  value={newCategoryLabel}
                  onChangeText={setNewCategoryLabel}
                />
                <View className="flex-row flex-wrap gap-2 mb-3">
                  {COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={{
                        backgroundColor: color,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        borderWidth: selectedColor === color ? 3 : 0,
                        borderColor: '#fff',
                      }}
                    />
                  ))}
                </View>
                <TouchableOpacity
                  onPress={editingCategory ? handleSaveEdit : handleAddCategory}
                  disabled={!newCategoryLabel.trim()}
                  className={`py-2.5 rounded-lg items-center ${
                    newCategoryLabel.trim() ? 'bg-primary' : 'bg-light-surface-2 dark:bg-surface-2'
                  }`}
                >
                  <Text className={`font-semibold ${newCategoryLabel.trim() ? 'text-white' : 'text-light-text-muted dark:text-text-muted'}`}>
                    {editingCategory ? t('common.save') : t('common.add')}
                  </Text>
                </TouchableOpacity>
                {editingCategory && (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingCategory(null);
                      setNewCategoryLabel('');
                      setSelectedColor(COLORS[0]);
                    }}
                    className="py-2 items-center mt-2"
                  >
                    <Text className="text-light-text-muted dark:text-text-muted text-sm">{t('common.cancel')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </SafeAreaView>
      </Modal>

      <ToastContainer />
    </SafeAreaView>
  );
}
