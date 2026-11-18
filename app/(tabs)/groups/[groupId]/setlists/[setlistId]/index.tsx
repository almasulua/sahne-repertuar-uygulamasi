import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Share, Switch } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useSetlist,
  useRemoveSetlistItem,
  useDeleteSetlist,
  useAddSetlistItem,
  useReorderSetlistItems,
  useToggleSetlistPublic,
} from '../../../../../../src/hooks/useSetlists';
import { useUIStore } from '../../../../../../src/stores/uiStore';
import { SetlistItemRow } from '../../../../../../src/components/setlist/SetlistItemRow';
import { SetlistItemEditModal } from '../../../../../../src/components/setlist/SetlistItemEditModal';
import { LoadingSpinner } from '../../../../../../src/components/ui/LoadingSpinner';
import { Badge } from '../../../../../../src/components/ui/Badge';
import { calculateTotalDuration, formatDuration, getSongCount } from '../../../../../../src/lib/setlist/utils';
import { exportSetlistPdf } from '../../../../../../src/lib/setlist/pdfExport';
import type { SetlistItem } from '../../../../../../src/types/setlist';

export default function SetlistDetailScreen() {
  const { groupId, setlistId } = useLocalSearchParams<{ groupId: string; setlistId: string }>();
  const { t } = useTranslation();
  const router = useRouter();
  const { data: setlist, isLoading } = useSetlist(setlistId ?? null);
  const removeItem = useRemoveSetlistItem();
  const addItem = useAddSetlistItem();
  const deleteSetlist = useDeleteSetlist();
  const reorderItems = useReorderSetlistItems();
  const togglePublic = useToggleSetlistPublic();
  const showToast = useUIStore((s) => s.showToast);
  const [editingItem, setEditingItem] = useState<SetlistItem | null>(null);

  const publicUrl = setlist?.public_slug
    ? `muzikapp://public/setlist/${setlist.public_slug}`
    : null;

  const handleTogglePublic = (value: boolean) => {
    if (!setlist || !groupId) return;
    togglePublic.mutate(
      { id: setlist.id, groupId, isPublic: value },
      {
        onError: (e) =>
          Alert.alert(t('common.error', 'Hata'), (e as Error).message),
      },
    );
  };

  const handleShareLink = async () => {
    if (!publicUrl) return;
    try {
      await Share.share({ message: publicUrl, url: publicUrl });
    } catch {
      // İptal edildi
    }
  };

  const handleCopyLink = async () => {
    if (!publicUrl) return;
    await Clipboard.setStringAsync(publicUrl);
    showToast({ message: t('common.copied', 'Kopyalandı!'), type: 'success' });
  };

  const handleDragEnd = useCallback(
    ({ data }: { data: SetlistItem[] }) => {
      if (!setlist) return;
      const reordered = data.map((item, index) => ({
        id: item.id,
        position: index,
      }));
      reorderItems.mutate({ items: reordered, setlistId: setlist.id });
    },
    [setlist, reorderItems]
  );

  const renderItem = useCallback(
    ({ item, getIndex, drag, isActive }: RenderItemParams<SetlistItem>) => (
      <SetlistItemRow
        item={item}
        index={getIndex() ?? 0}
        drag={drag}
        isActive={isActive}
        onEdit={() => setEditingItem(item)}
        onRemove={() =>
          removeItem.mutate({ itemId: item.id, setlistId: setlist!.id })
        }
      />
    ),
    [removeItem, setlist]
  );

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (!setlist) return null;

  const totalDuration = calculateTotalDuration(setlist.items);
  const songCount = getSongCount(setlist.items);

  const handleAddSong = () => {
    if (!groupId || !setlistId) return;
    router.push(`/(tabs)/groups/${groupId}/setlists/${setlistId}/add-song` as never);
  };

  const handleAddBreak = () => {
    addItem.mutate({
      setlist_id: setlist.id,
      item_type: 'break',
      position: setlist.items.length,
      break_duration: 15,
    });
  };

  const handleDelete = () => {
    Alert.alert(t('setlist.delete'), t('setlist.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteSetlist.mutateAsync({ id: setlist.id, groupId: groupId! });
          router.back();
        },
      },
    ]);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
        {/* Header */}
        <View className="flex-row items-center px-4 pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Text className="text-primary text-xl">←</Text>
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-light-text-primary dark:text-text-primary text-lg font-bold" numberOfLines={1}>
              {setlist.name}
            </Text>
          </View>
          <TouchableOpacity onPress={handleDelete} className="ml-2 p-1">
            <Text className="text-error text-sm">{t('common.delete')}</Text>
          </TouchableOpacity>
        </View>

        {/* Meta */}
        <View className="flex-row flex-wrap gap-2 px-4 mb-3">
          <Badge label={`${songCount} ${t('setlist.songs')}`} variant="primary" />
          <Badge label={formatDuration(totalDuration)} variant="neutral" />
          <Badge label={t(`setlist.${setlist.status}`)} variant="neutral" />
        </View>

        {/* Actions */}
        <View className="flex-row gap-2 px-4 mb-3">
          <TouchableOpacity onPress={handleAddSong} className="flex-1 bg-primary py-2.5 rounded-xl items-center">
            <Text className="text-white text-sm font-medium">+ {t('setlist.addSong')}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddBreak} className="bg-light-surface-2 dark:bg-surface-2 py-2.5 px-4 rounded-xl border border-light-border dark:border-border">
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm">{t('setlist.addBreak')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => exportSetlistPdf(setlist)}
            className="bg-light-surface-2 dark:bg-surface-2 py-2.5 px-3 rounded-xl border border-light-border dark:border-border"
          >
            <Text className="text-light-text-secondary dark:text-text-secondary text-sm">PDF</Text>
          </TouchableOpacity>
        </View>

        {/* Public paylaşım */}
        <View className="mx-4 mb-3 bg-light-surface-1 dark:bg-surface-1 rounded-xl border border-light-border dark:border-border p-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 mr-3">
              <Text className="text-light-text-primary dark:text-text-primary text-sm font-semibold">
                {t('setlist.publicShare', 'Herkese açık paylaşım')}
              </Text>
              <Text className="text-light-text-secondary dark:text-text-secondary text-xs mt-0.5">
                {setlist.is_public
                  ? t('setlist.publicOnDesc', 'Linke sahip herkes setlist\'i görebilir')
                  : t('setlist.publicOffDesc', 'Sadece grup üyeleri görür')}
              </Text>
            </View>
            <Switch
              value={setlist.is_public}
              onValueChange={handleTogglePublic}
              disabled={togglePublic.isPending}
            />
          </View>
          {setlist.is_public && publicUrl ? (
            <View className="flex-row gap-2 mt-3">
              <View className="flex-1 bg-light-surface-2 dark:bg-surface-2 rounded-lg px-3 py-2 border border-light-border dark:border-border">
                <Text className="text-light-text-secondary dark:text-text-secondary text-xs" numberOfLines={1}>
                  {publicUrl}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCopyLink}
                className="bg-light-surface-2 dark:bg-surface-2 px-3 py-2 rounded-lg border border-light-border dark:border-border"
              >
                <Text className="text-light-text-primary dark:text-text-primary text-xs">{t('common.copy', 'Kopyala')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShareLink}
                className="bg-primary px-3 py-2 rounded-lg"
              >
                <Text className="text-white text-xs">{t('common.share', 'Paylaş')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Draggable Items */}
        <DraggableFlatList
          data={setlist.items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          onDragEnd={handleDragEnd}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListEmptyComponent={
            <View className="py-12 items-center">
              <Text className="text-light-text-muted dark:text-text-muted">{t('setlist.noItems')}</Text>
            </View>
          }
        />

        {/* Item düzenleme modalı */}
        <SetlistItemEditModal
          visible={editingItem !== null}
          item={editingItem}
          setlistId={setlist.id}
          groupId={groupId!}
          onClose={() => setEditingItem(null)}
        />

        {/* Stage Mode FAB */}
        {setlist.items.some((i) => i.item_type === 'song') && (
          <TouchableOpacity
            onPress={() => router.push(`/(tabs)/groups/${groupId}/setlists/${setlistId}/stage`)}
            className="absolute bottom-6 right-4 bg-accent w-14 h-14 rounded-full items-center justify-center shadow-lg"
          >
            <Text className="text-white text-xl">▶</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
