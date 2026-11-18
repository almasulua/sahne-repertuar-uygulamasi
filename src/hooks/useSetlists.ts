import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { setlistsApi, type CreateSetlistParams, type AddSetlistItemParams } from '../api/setlists';
import { useAuth } from './useAuth';
import { track } from '../lib/analytics';

export const SETLIST_KEYS = {
  byGroup: (groupId: string) => ['setlists', groupId] as const,
  detail: (id: string) => ['setlist', id] as const,
  publicBySlug: (slug: string) => ['setlist_public', slug] as const,
};

/** Grubun setlistleri */
export function useSetlists(groupId: string | null) {
  return useQuery({
    queryKey: SETLIST_KEYS.byGroup(groupId ?? ''),
    queryFn: () => setlistsApi.getByGroup(groupId!),
    enabled: !!groupId,
  });
}

/** Tek setlist detay + items */
export function useSetlist(id: string | null) {
  return useQuery({
    queryKey: SETLIST_KEYS.detail(id ?? ''),
    queryFn: () => setlistsApi.getById(id!),
    enabled: !!id,
  });
}

/** Setlist oluştur */
export function useCreateSetlist() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: (params: Omit<CreateSetlistParams, 'created_by'>) =>
      setlistsApi.create({ ...params, created_by: session!.user.id }),
    onSuccess: (setlist, variables) => {
      track('setlist_created', { setlist_id: setlist.id, group_id: variables.group_id });
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.byGroup(variables.group_id) });
    },
  });
}

/** Setlist güncelle */
export function useUpdateSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string; group_id: string } & Parameters<typeof setlistsApi.update>[1]) =>
      setlistsApi.update(id, updates),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.byGroup(variables.group_id) });
    },
  });
}

/** Setlist'i public/private yap */
export function useToggleSetlistPublic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; groupId: string; isPublic: boolean }) =>
      setlistsApi.togglePublic(id, isPublic),
    onSuccess: (_, variables) => {
      track('setlist_public_toggled', { setlist_id: variables.id, public: variables.isPublic });
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.byGroup(variables.groupId) });
    },
  });
}

/** Public slug ile setlist (anon kullanım — useAuth gerekmez) */
export function usePublicSetlist(slug: string | null) {
  return useQuery({
    queryKey: SETLIST_KEYS.publicBySlug(slug ?? ''),
    queryFn: () => setlistsApi.getByPublicSlug(slug!),
    enabled: !!slug,
  });
}

/** Setlist sil */
export function useDeleteSetlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, groupId }: { id: string; groupId: string }) => setlistsApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.byGroup(variables.groupId) });
    },
  });
}

/** Setlist'e item ekle */
export function useAddSetlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: AddSetlistItemParams) => setlistsApi.addItem(params),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.detail(variables.setlist_id) });
    },
  });
}

/** Setlist item güncelle (notlar, custom_key, custom_bpm, break_duration) */
export function useUpdateSetlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      setlistId: _setlistId,
      ...updates
    }: {
      itemId: string;
      setlistId: string;
      notes?: string | null;
      custom_key?: string | null;
      custom_bpm?: number | null;
      break_duration?: number | null;
      part_assignments?: Record<string, string>;
    }) => setlistsApi.updateItem(itemId, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.detail(variables.setlistId) });
    },
  });
}

/** Setlist item sil */
export function useRemoveSetlistItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, setlistId }: { itemId: string; setlistId: string }) =>
      setlistsApi.removeItem(itemId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.detail(variables.setlistId) });
    },
  });
}

/** Setlist item'ları yeniden sırala */
export function useReorderSetlistItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ items, setlistId }: { items: { id: string; position: number }[]; setlistId: string }) =>
      setlistsApi.reorderItems(items),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: SETLIST_KEYS.detail(variables.setlistId) });
    },
  });
}
