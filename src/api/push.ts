import { supabase } from './supabase';

export interface SendPushParams {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  /** false ise sadece push gönderilir; notifications tablosuna kayıt atılmaz. Varsayılan: true */
  persist?: boolean;
}

export interface SendPushResult {
  requested: number;
  eligible: number;
  pushed: number;
  chunks: number;
  failed_chunks: number;
  error?: string;
}

/**
 * Supabase Edge Function (`send-notification`) çağrısı.
 * Edge function deploy edilmiş ve kullanıcı authed olmalı.
 */
export const pushApi = {
  send: async (params: SendPushParams): Promise<SendPushResult> => {
    const { data, error } = await supabase.functions.invoke<SendPushResult>('send-notification', {
      body: params,
    });
    if (error) throw error;
    if (!data) throw new Error('Edge function boş yanıt döndü');
    return data;
  },
};
