import { supabase } from './supabase';
import type { Message } from '../types/message';
import type { Json } from '../types/database.types';
import { Config } from '../constants/config';

export interface SendMessageParams {
  group_id: string;
  sender_id: string;
  content: string;
  type?: Message['type'];
  reply_to_id?: string;
  metadata?: Record<string, unknown>;
}

const MESSAGE_SELECT = `
  *,
  sender:users(id, username, display_name, avatar_url),
  reply_to:messages!reply_to_id(
    id, content, type,
    sender:users(id, username, display_name, avatar_url)
  )
`.trim();

export const messagesApi = {
  /** Grup mesajlarını sayfalı çek (en yeniden en eskiye) */
  getMessages: async (groupId: string, cursor?: string): Promise<Message[]> => {
    let query = supabase
      .from('messages')
      .select(MESSAGE_SELECT)
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(Config.chat.messagePageSize);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;
    if (error) {
      if (__DEV__) console.warn('[Messages] getMessages error:', error.message);
      throw error;
    }
    return (data ?? []) as unknown as Message[];
  },

  /** Mesaj gönder */
  send: async (params: SendMessageParams): Promise<Message> => {
    // Önce insert et (basit select ile — join hatasından bağımsız)
    const { data: inserted, error: insertErr } = await supabase
      .from('messages')
      .insert({
        group_id: params.group_id,
        sender_id: params.sender_id,
        content: params.content,
        type: params.type ?? 'text',
        reply_to_id: params.reply_to_id,
        metadata: (params.metadata ?? {}) as Json,
      })
      .select('*')
      .single();
    if (insertErr) throw insertErr;

    // Tam mesajı sender bilgisiyle çek (başarısız olursa basit veriyi döndür)
    try {
      const { data } = await supabase
        .from('messages')
        .select(MESSAGE_SELECT)
        .eq('id', inserted.id)
        .single();
      if (data) return data as unknown as Message;
    } catch {
      // Join sorgusu başarısız — basit veriyi döndür
    }
    return inserted as unknown as Message;
  },

  /** Mesajı sil */
  delete: async (messageId: string): Promise<void> => {
    const { error } = await supabase.from('messages').delete().eq('id', messageId);
    if (error) throw error;
  },

  /** Realtime aboneliği — yeni mesajlar */
  subscribeToGroup: (
    groupId: string,
    onInsert: (msg: Message) => void,
    onDelete?: (msgId: string) => void
  ) => {
    const channel = supabase
      .channel(`chat:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Tam mesajı sender bilgisiyle yeniden çek
          const { data } = await supabase
            .from('messages')
            .select(MESSAGE_SELECT)
            .eq('id', payload.new.id)
            .single();
          if (data) onInsert(data as unknown as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
          filter: `group_id=eq.${groupId}`,
        },
        (payload) => {
          if (onDelete) onDelete(payload.old.id as string);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
};
