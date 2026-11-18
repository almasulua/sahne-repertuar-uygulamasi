import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Avatar } from '../ui/Avatar';
import { RatingStars } from './RatingStars';
import { useAuth } from '../../hooks/useAuth';
import {
  useSongComments,
  useAddSongComment,
  useDeleteSongComment,
  useMyRating,
  useRatingSummary,
  useSetRating,
  useClearRating,
} from '../../hooks/useSongFeedback';
import type { SongComment } from '../../api/songFeedback';

interface SongFeedbackPanelProps {
  songId: string;
}

function formatRelative(iso: string, t: TFunction): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const min = Math.round(diffMs / 60000);
  if (min < 1) return t('common.now', 'şimdi');
  if (min < 60) return `${min} ${t('common.minAbbr', 'dk')} ${t('common.ago', 'önce')}`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ${t('common.hourAbbr', 'sa')} ${t('common.ago', 'önce')}`;
  const d = Math.round(h / 24);
  if (d < 7) return `${d} ${t('common.dayAbbr', 'gün')} ${t('common.ago', 'önce')}`;
  return new Date(iso).toLocaleDateString();
}

export function SongFeedbackPanel({ songId }: SongFeedbackPanelProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [draft, setDraft] = useState('');

  const { data: comments = [], isLoading: commentsLoading } = useSongComments(songId);
  const { data: myRating } = useMyRating(songId);
  const { data: summary } = useRatingSummary(songId);

  const addComment = useAddSongComment(songId);
  const deleteComment = useDeleteSongComment(songId);
  const setRating = useSetRating(songId);
  const clearRating = useClearRating(songId);

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    try {
      await addComment.mutateAsync(trimmed);
      setDraft('');
    } catch (e) {
      Alert.alert(t('common.error', 'Hata'), (e as Error).message);
    }
  };

  const handleRatingChange = async (rating: number) => {
    try {
      if (rating === 0) {
        await clearRating.mutateAsync();
      } else {
        await setRating.mutateAsync(rating);
      }
    } catch (e) {
      Alert.alert(t('common.error', 'Hata'), (e as Error).message);
    }
  };

  const handleDelete = (comment: SongComment) => {
    Alert.alert(
      t('songFeedback.deleteCommentTitle', 'Yorumu sil'),
      t('songFeedback.deleteCommentConfirm', 'Bu yorum silinecek. Emin misiniz?'),
      [
        { text: t('common.cancel', 'İptal'), style: 'cancel' },
        {
          text: t('common.delete', 'Sil'),
          style: 'destructive',
          onPress: () => deleteComment.mutate(comment.id),
        },
      ],
    );
  };

  return (
    <View className="px-4 py-4">
      {/* ---- Puanlama ---- */}
      <View className="mb-6 p-4 rounded-2xl bg-light-surface-1 dark:bg-surface-1 border border-light-border-light dark:border-border-light">
        <Text className="text-light-text-secondary dark:text-text-secondary text-sm mb-2">
          {t('songFeedback.yourRating', 'Senin puanın')}
        </Text>
        <View className="flex-row items-center justify-between">
          <RatingStars
            value={myRating?.rating ?? 0}
            size={32}
            onChange={handleRatingChange}
          />
          <View className="items-end">
            <Text className="text-light-text-primary dark:text-text-primary font-semibold text-lg">
              {summary?.average ? summary.average.toFixed(1) : '—'}
            </Text>
            <Text className="text-light-text-secondary dark:text-text-secondary text-xs">
              {summary?.count ?? 0} {t('songFeedback.ratings', 'puan')}
            </Text>
          </View>
        </View>
      </View>

      {/* ---- Yorum girişi ---- */}
      <View className="mb-4">
        <Text className="text-light-text-primary dark:text-text-primary text-base font-semibold mb-2">
          {t('songFeedback.comments', 'Yorumlar')}
        </Text>
        <View className="flex-row items-end">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder={t('songFeedback.commentPlaceholder', 'Yorum yaz...')}
            placeholderTextColor="#9E9E9E"
            multiline
            maxLength={2000}
            className="flex-1 bg-light-surface-1 dark:bg-surface-1 border border-light-border-light dark:border-border-light rounded-2xl px-4 py-3 text-light-text-primary dark:text-text-primary mr-2"
            style={{ minHeight: 44, maxHeight: 120 }}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!draft.trim() || addComment.isPending}
            className={`rounded-2xl px-4 py-3 ${draft.trim() ? 'bg-primary' : 'bg-light-surface-2 dark:bg-surface-2'}`}
            accessibilityRole="button"
          >
            {addComment.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text className="text-white font-semibold">
                {t('common.send', 'Gönder')}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ---- Yorum listesi ---- */}
      {commentsLoading ? (
        <View className="py-6 items-center">
          <ActivityIndicator color="#a78bfa" />
        </View>
      ) : comments.length === 0 ? (
        <Text className="text-light-text-secondary dark:text-text-secondary text-center py-6">
          {t('songFeedback.noComments', 'Henüz yorum yok')}
        </Text>
      ) : (
        comments.map((c) => (
          <View key={c.id} className="flex-row items-start py-3 border-b border-light-border-light dark:border-border-light">
            <Avatar
              uri={c.author?.avatar_url}
              name={c.author?.display_name ?? c.author?.username}
              size="sm"
            />
            <View className="flex-1 ml-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-light-text-primary dark:text-text-primary font-semibold text-sm">
                  {c.author?.display_name ?? c.author?.username ?? t('common.user', 'Kullanıcı')}
                </Text>
                <Text className="text-light-text-secondary dark:text-text-secondary text-xs">
                  {formatRelative(c.created_at, t)}
                </Text>
              </View>
              <Text className="text-light-text-primary dark:text-text-primary text-sm mt-1">{c.body}</Text>
              {user?.id === c.user_id && (
                <TouchableOpacity
                  onPress={() => handleDelete(c)}
                  className="mt-1 self-start"
                  hitSlop={8}
                >
                  <Text className="text-error text-xs">{t('common.delete', 'Sil')}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </View>
  );
}
