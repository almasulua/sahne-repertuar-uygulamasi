import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { songFeedbackApi, type SongComment } from '../api/songFeedback';
import { useAuth } from './useAuth';

const QK = {
  comments: (songId: string) => ['song_comments', songId] as const,
  myRating: (songId: string, userId: string) => ['song_my_rating', songId, userId] as const,
  ratingSummary: (songId: string) => ['song_rating_summary', songId] as const,
};

// ---- Yorumlar ----

export function useSongComments(songId: string | null) {
  return useQuery({
    queryKey: QK.comments(songId ?? ''),
    queryFn: () => songFeedbackApi.listComments(songId!),
    enabled: !!songId,
  });
}

export function useAddSongComment(songId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (body: string) => songFeedbackApi.addComment(songId, user!.id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.comments(songId) });
    },
  });
}

export function useUpdateSongComment(songId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) =>
      songFeedbackApi.updateComment(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.comments(songId) });
    },
  });
}

export function useDeleteSongComment(songId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => songFeedbackApi.deleteComment(id),
    onMutate: async (id: string) => {
      const qKey = QK.comments(songId);
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData<SongComment[]>(qKey);
      queryClient.setQueryData<SongComment[]>(qKey, (old) =>
        (old ?? []).filter((c) => c.id !== id),
      );
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(QK.comments(songId), ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QK.comments(songId) });
    },
  });
}

// ---- Puanlama ----

export function useMyRating(songId: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: QK.myRating(songId ?? '', user?.id ?? ''),
    queryFn: () => songFeedbackApi.getMyRating(songId!, user!.id),
    enabled: !!songId && !!user,
  });
}

export function useRatingSummary(songId: string | null) {
  return useQuery({
    queryKey: QK.ratingSummary(songId ?? ''),
    queryFn: () => songFeedbackApi.getRatingSummary(songId!),
    enabled: !!songId,
  });
}

export function useSetRating(songId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (rating: number) => songFeedbackApi.setRating(songId, user!.id, rating),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.myRating(songId, user?.id ?? '') });
      queryClient.invalidateQueries({ queryKey: QK.ratingSummary(songId) });
    },
  });
}

export function useClearRating(songId: string) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => songFeedbackApi.clearRating(songId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.myRating(songId, user?.id ?? '') });
      queryClient.invalidateQueries({ queryKey: QK.ratingSummary(songId) });
    },
  });
}
