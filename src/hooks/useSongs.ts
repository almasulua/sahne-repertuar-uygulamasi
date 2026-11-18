import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { songsApi, type AddToPersonalParams, type CreateSongParams } from '../api/songs';
import { useAuth } from './useAuth';
import { track } from '../lib/analytics';

export const QUERY_KEYS = {
  personalSongs: (userId: string) => ['personal_songs', userId] as const,
  song: (id: string) => ['song', id] as const,
  groupSongs: (groupId: string) => ['group_songs', groupId] as const,
  categories: (userId: string) => ['user_categories', userId] as const,
};

/** Kullanıcının kişisel şarkı listesi */
export function usePersonalSongs() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.personalSongs(user?.id ?? ''),
    queryFn: () => songsApi.getPersonalSongs(user!.id),
    enabled: !!user,
  });
}

/** Tek şarkı detayı */
export function useSong(id: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.song(id ?? ''),
    queryFn: () => songsApi.getById(id!),
    enabled: !!id,
  });
}

/** Şarkı oluştur + kişisel repertuara ekle */
export function useCreateSong() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: async (params: Omit<CreateSongParams, 'created_by'> & {
      personalNotes?: string;
      personalTags?: string[];
      personalStatus?: string;
    }) => {
      const { personalNotes, personalTags, personalStatus, ...songParams } = params;
      const song = await songsApi.create({ ...songParams, created_by: session!.user.id });
      await songsApi.addToPersonal({
        user_id: session!.user.id,
        song_id: song.id,
        notes: personalNotes,
        tags: personalTags,
        status: personalStatus ?? 'learning',
      });
      return song;
    },
    onSuccess: (song) => {
      track('song_added', { song_id: song.id, source: 'manual' });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personalSongs(user?.id ?? '') });
    },
  });
}

/** Şarkı oluştur (sadece songs tablosuna — kişisel repertuara eklemez) */
export function useCreateSongOnly() {
  const { session } = useAuth();

  return useMutation({
    mutationFn: async (params: Omit<CreateSongParams, 'created_by'>) => {
      const song = await songsApi.create({ ...params, created_by: session!.user.id });
      return song;
    },
  });
}

/** Şarkı güncelle */
export function useUpdateSong() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Parameters<typeof songsApi.update>[1]) =>
      songsApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.song(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personalSongs(user?.id ?? '') });
    },
  });
}

/** Kişisel şarkı sil */
export function useRemovePersonalSong() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (personalSongId: string) => songsApi.removeFromPersonal(personalSongId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personalSongs(user?.id ?? '') });
    },
  });
}

/** Favori durumu değiştir (optimistic update) */
export function useToggleFavorite() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const qKey = QUERY_KEYS.personalSongs(user?.id ?? '');

  return useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite: boolean }) =>
      songsApi.toggleFavorite(id, isFavorite),
    onMutate: async ({ id, isFavorite }) => {
      await queryClient.cancelQueries({ queryKey: qKey });
      const prev = queryClient.getQueryData(qKey);
      queryClient.setQueryData(qKey, (old: ReturnType<typeof usePersonalSongs>['data']) => {
        if (!old) return old;
        return old.map((ps) => ps.id === id ? { ...ps, is_favorite: isFavorite } : ps);
      });
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(qKey, ctx.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: qKey });
    },
  });
}

/** Grup şarkı listesi */
export function useGroupSongs(groupId: string | null) {
  return useQuery({
    queryKey: QUERY_KEYS.groupSongs(groupId ?? ''),
    queryFn: () => songsApi.getGroupSongs(groupId!),
    enabled: !!groupId,
  });
}

/** Gruba şarkı ekle */
export function useAddSongToGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ groupId, songId }: { groupId: string; songId: string }) =>
      songsApi.addToGroup(groupId, songId, user!.id),
    onSuccess: (_, variables) => {
      track('group_song_added', { group_id: variables.groupId, song_id: variables.songId });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupSongs(variables.groupId) });
    },
  });
}

/** Grup şarkısının status'unu güncelle (learning/ready/setlist/archived) */
export function useUpdateGroupSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      groupId: _groupId,
      ...updates
    }: {
      id: string;
      groupId: string;
      status?: 'learning' | 'ready' | 'setlist' | 'archived';
      notes?: string | null;
    }) => songsApi.updateGroupSong(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupSongs(variables.groupId) });
    },
  });
}

/** Gruptan şarkı çıkar */
export function useRemoveSongFromGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, groupId: _groupId }: { id: string; groupId: string }) =>
      songsApi.removeFromGroup(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.groupSongs(variables.groupId) });
    },
  });
}

/** Kişisel şarkı durumunu güncelle */
export function useUpdatePersonalSong() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<{ status: string; notes: string; tags: string[] }>) =>
      songsApi.updatePersonal(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.personalSongs(user?.id ?? '') });
    },
  });
}

// ---- Kullanıcı Kategorileri ----

/** Kullanıcının kategorilerini çek */
export function useCategories() {
  const { user } = useAuth();
  return useQuery({
    queryKey: QUERY_KEYS.categories(user?.id ?? ''),
    queryFn: () => songsApi.getCategories(user!.id),
    enabled: !!user,
  });
}

/** Kategori oluştur */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (params: { name: string; label: string; color?: string }) =>
      songsApi.createCategory({ ...params, user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories(user?.id ?? '') });
    },
  });
}

/** Kategori güncelle */
export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; label?: string; color?: string; position?: number }) =>
      songsApi.updateCategory(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories(user?.id ?? '') });
    },
  });
}

/** Kategori sil */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (id: string) => songsApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.categories(user?.id ?? '') });
    },
  });
}
