import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { pollsApi, type CreatePollParams } from '../api/polls';
import { useAuth } from './useAuth';

export const POLL_KEYS = {
  byGroup: (groupId: string) => ['polls', groupId] as const,
  detail: (id: string) => ['poll', id] as const,
};

/** Grubun oylamaları */
export function usePolls(groupId: string | null) {
  return useQuery({
    queryKey: POLL_KEYS.byGroup(groupId ?? ''),
    queryFn: () => pollsApi.getByGroup(groupId!),
    enabled: !!groupId,
  });
}

/** Tek oylama detay */
export function usePoll(id: string | null) {
  const { user } = useAuth();
  return useQuery({
    queryKey: POLL_KEYS.detail(id ?? ''),
    queryFn: () => pollsApi.getById(id!, user?.id),
    enabled: !!id,
  });
}

/** Oylama oluştur */
export function useCreatePoll() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: (params: Omit<CreatePollParams, 'created_by'>) =>
      pollsApi.create({ ...params, created_by: session!.user.id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: POLL_KEYS.byGroup(variables.group_id) });
    },
  });
}

/** Oy ver */
export function useVotePoll() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: ({ pollId, optionId, groupId }: { pollId: string; optionId: string; groupId: string }) =>
      pollsApi.vote(pollId, session!.user.id, optionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: POLL_KEYS.detail(variables.pollId) });
      queryClient.invalidateQueries({ queryKey: POLL_KEYS.byGroup(variables.groupId) });
    },
  });
}

/** Oylamayı kapat */
export function useClosePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, groupId }: { id: string; groupId: string }) => pollsApi.close(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: POLL_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: POLL_KEYS.byGroup(variables.groupId) });
    },
  });
}

/** Oylamayı sil */
export function useDeletePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, groupId }: { id: string; groupId: string }) => pollsApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: POLL_KEYS.byGroup(variables.groupId) });
    },
  });
}
