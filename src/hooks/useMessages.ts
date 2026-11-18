import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { messagesApi, type SendMessageParams } from '../api/messages';
import { useAuth } from './useAuth';
import type { Message } from '../types/message';

export const MESSAGE_QUERY_KEYS = {
  messages: (groupId: string) => ['messages', groupId] as const,
};

/** Sayfalı mesaj listesi (infinite scroll) */
export function useMessages(groupId: string | null) {
  const queryClient = useQueryClient();

  const query = useInfiniteQuery({
    queryKey: MESSAGE_QUERY_KEYS.messages(groupId ?? ''),
    queryFn: ({ pageParam }) =>
      messagesApi.getMessages(groupId!, pageParam as string | undefined),
    enabled: !!groupId,
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      if (!lastPage || lastPage.length === 0) return undefined;
      return lastPage[lastPage.length - 1].created_at;
    },
  });

  // Realtime aboneliği
  useEffect(() => {
    if (!groupId) return;
    const unsubscribe = messagesApi.subscribeToGroup(
      groupId,
      (newMsg) => {
        queryClient.setQueryData(
          MESSAGE_QUERY_KEYS.messages(groupId),
          (old: { pages: Message[][]; pageParams: unknown[] } | undefined) => {
            if (!old) return { pages: [[newMsg]], pageParams: [undefined] };
            // Duplicate kontrolü (onSuccess zaten eklemiş olabilir)
            const allIds = old.pages.flat().map((m) => m.id);
            if (allIds.includes(newMsg.id)) return old;
            return {
              ...old,
              pages: [[newMsg, ...(old.pages[0] ?? [])], ...old.pages.slice(1)],
            };
          }
        );
      },
      (deletedId) => {
        queryClient.setQueryData(
          MESSAGE_QUERY_KEYS.messages(groupId),
          (old: { pages: Message[][] } | undefined) => {
            if (!old) return old;
            return {
              ...old,
              pages: old.pages.map((page) => page.filter((m) => m.id !== deletedId)),
            };
          }
        );
      }
    );
    return unsubscribe;
  }, [groupId, queryClient]);

  return query;
}

/** Mesaj gönder */
export function useSendMessage(groupId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Omit<SendMessageParams, 'sender_id' | 'group_id'>) =>
      messagesApi.send({
        ...params,
        group_id: groupId,
        sender_id: user!.id,
      }),
    onSuccess: (newMessage) => {
      // Mesajı cache'e ekle — realtime de ekleyebilir ama bu garantili
      queryClient.setQueryData(
        MESSAGE_QUERY_KEYS.messages(groupId),
        (old: { pages: Message[][]; pageParams: unknown[] } | undefined) => {
          if (!old) return { pages: [[newMessage]], pageParams: [undefined] };
          // Duplicate kontrolü (realtime zaten eklemiş olabilir)
          const allIds = old.pages.flat().map((m) => m.id);
          if (allIds.includes(newMessage.id)) return old;
          return {
            ...old,
            pages: [[newMessage, ...(old.pages[0] ?? [])], ...old.pages.slice(1)],
          };
        }
      );
    },
  });
}

/** Mesaj sil */
export function useDeleteMessage(groupId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (messageId: string) => messagesApi.delete(messageId),
    onSuccess: (_, messageId) => {
      queryClient.setQueryData(
        MESSAGE_QUERY_KEYS.messages(groupId),
        (old: { pages: Message[][] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => page.filter((m) => m.id !== messageId)),
          };
        }
      );
    },
  });
}
