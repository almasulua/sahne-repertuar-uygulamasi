import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupsApi, type CreateGroupParams } from '../api/groups';
import { supabase } from '../api/supabase';
import { useAuth } from './useAuth';
import { track } from '../lib/analytics';

export const GROUP_QUERY_KEYS = {
  myGroups: (userId: string) => ['groups', userId] as const,
  group: (id: string) => ['group', id] as const,
};

/** Kullanıcının grup listesi */
export function useMyGroups() {
  const { user } = useAuth();
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.myGroups(user?.id ?? ''),
    queryFn: () => groupsApi.getMyGroups(user!.id),
    enabled: !!user,
  });
}

/** Tek grup (üyelerle) */
export function useGroup(groupId: string | null) {
  return useQuery({
    queryKey: GROUP_QUERY_KEYS.group(groupId ?? ''),
    queryFn: () => groupsApi.getById(groupId!),
    enabled: !!groupId,
  });
}

/** Grup oluştur */
export function useCreateGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: Omit<CreateGroupParams, 'owner_id'>) => {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('[createGroup] session:', session?.user?.id ?? 'NULL');
      if (!session) throw new Error('Oturum bulunamadı');
      return groupsApi.create({ ...params, owner_id: session.user.id });
    },
    onSuccess: (group) => {
      track('group_created', { group_id: group.id });
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.myGroups(user?.id ?? '') });
    },
  });
}

/** Davet linki ile gruba katıl */
export function useJoinGroup() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: (token: string) => groupsApi.joinByToken(token, session!.user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.myGroups(user?.id ?? '') });
    },
  });
}

/** Gruptan ayrıl */
export function useLeaveGroup() {
  const queryClient = useQueryClient();
  const { user, session } = useAuth();

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.removeMember(groupId, session!.user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.myGroups(user?.id ?? '') });
    },
  });
}

/** Grubu sil */
export function useDeleteGroup() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.delete(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.myGroups(user?.id ?? '') });
    },
  });
}

/** Üye rolünü güncelle (sadece admin/owner çağırmalı) */
export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      userId,
      role,
    }: {
      groupId: string;
      userId: string;
      role: 'owner' | 'admin' | 'member';
    }) => groupsApi.updateMemberRole(groupId, userId, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.group(variables.groupId) });
    },
  });
}

/** Bir üyeyi gruptan çıkar (admin/owner çağırır) */
export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsApi.removeMember(groupId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.group(variables.groupId) });
    },
  });
}

/** Grup güncelle */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Parameters<typeof groupsApi.update>[1]) =>
      groupsApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: GROUP_QUERY_KEYS.group(variables.id) });
    },
  });
}
