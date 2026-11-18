import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi, type CreateEventParams } from '../api/events';
import { useAuth } from './useAuth';
import type { RsvpStatus } from '../types/event';

export const EVENT_KEYS = {
  byGroup: (groupId: string) => ['events', groupId] as const,
  detail: (id: string) => ['event', id] as const,
};

/** Grubun etkinlikleri */
export function useEvents(groupId: string | null) {
  return useQuery({
    queryKey: EVENT_KEYS.byGroup(groupId ?? ''),
    queryFn: () => eventsApi.getByGroup(groupId!),
    enabled: !!groupId,
  });
}

/** Tek etkinlik detay */
export function useEvent(id: string | null) {
  return useQuery({
    queryKey: EVENT_KEYS.detail(id ?? ''),
    queryFn: () => eventsApi.getById(id!),
    enabled: !!id,
  });
}

/** Etkinlik oluştur */
export function useCreateEvent() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: (params: Omit<CreateEventParams, 'created_by'>) =>
      eventsApi.create({ ...params, created_by: session!.user.id }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.byGroup(variables.group_id) });
    },
  });
}

/** Etkinlik güncelle */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, groupId, ...updates }: { id: string; groupId: string } & Parameters<typeof eventsApi.update>[1]) =>
      eventsApi.update(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.byGroup(variables.groupId) });
    },
  });
}

/** Etkinlik sil */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, groupId }: { id: string; groupId: string }) => eventsApi.delete(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.byGroup(variables.groupId) });
    },
  });
}

/** RSVP güncelle */
export function useUpdateRsvp() {
  const queryClient = useQueryClient();
  const { session } = useAuth();

  return useMutation({
    mutationFn: ({ eventId, status, groupId }: { eventId: string; status: RsvpStatus; groupId: string }) =>
      eventsApi.upsertRsvp(eventId, session!.user.id, status),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.detail(variables.eventId) });
      queryClient.invalidateQueries({ queryKey: EVENT_KEYS.byGroup(variables.groupId) });
    },
  });
}
