import { supabase } from './supabase';

// Tablolar yeni eklendi; database.types.ts stub'ında yok → typed-any kullan.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;

export interface SongCommentAuthor {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface SongComment {
  id: string;
  song_id: string;
  user_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: SongCommentAuthor | null;
}

export interface SongRating {
  id: string;
  song_id: string;
  user_id: string;
  rating: number;
  created_at: string;
  updated_at: string;
}

export interface SongRatingSummary {
  song_id: string;
  count: number;
  average: number;
}

export const songFeedbackApi = {
  // ---- Yorumlar ----

  listComments: async (songId: string): Promise<SongComment[]> => {
    const { data, error } = await sb
      .from('song_comments')
      .select('id, song_id, user_id, body, created_at, updated_at, author:users!song_comments_user_id_fkey(id, username, display_name, avatar_url)')
      .eq('song_id', songId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as SongComment[];
  },

  addComment: async (songId: string, userId: string, body: string): Promise<SongComment> => {
    const trimmed = body.trim();
    if (!trimmed) throw new Error('Yorum boş olamaz');
    const { data, error } = await sb
      .from('song_comments')
      .insert({ song_id: songId, user_id: userId, body: trimmed })
      .select('id, song_id, user_id, body, created_at, updated_at, author:users!song_comments_user_id_fkey(id, username, display_name, avatar_url)')
      .single();
    if (error) throw error;
    return data as SongComment;
  },

  updateComment: async (commentId: string, body: string): Promise<SongComment> => {
    const trimmed = body.trim();
    if (!trimmed) throw new Error('Yorum boş olamaz');
    const { data, error } = await sb
      .from('song_comments')
      .update({ body: trimmed })
      .eq('id', commentId)
      .select('id, song_id, user_id, body, created_at, updated_at, author:users!song_comments_user_id_fkey(id, username, display_name, avatar_url)')
      .single();
    if (error) throw error;
    return data as SongComment;
  },

  deleteComment: async (commentId: string): Promise<void> => {
    const { error } = await sb.from('song_comments').delete().eq('id', commentId);
    if (error) throw error;
  },

  // ---- Puanlama ----

  /** Şarkının kullanıcı tarafından verilmiş mevcut puanı (yoksa null) */
  getMyRating: async (songId: string, userId: string): Promise<SongRating | null> => {
    const { data, error } = await sb
      .from('song_ratings')
      .select('*')
      .eq('song_id', songId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data ?? null) as SongRating | null;
  },

  /** Puan ver veya güncelle (upsert UNIQUE(song_id, user_id) sayesinde) */
  setRating: async (songId: string, userId: string, rating: number): Promise<SongRating> => {
    if (rating < 1 || rating > 5) throw new Error('Puan 1-5 aralığında olmalı');
    const { data, error } = await sb
      .from('song_ratings')
      .upsert(
        { song_id: songId, user_id: userId, rating },
        { onConflict: 'song_id,user_id' },
      )
      .select()
      .single();
    if (error) throw error;
    return data as SongRating;
  },

  /** Kullanıcının puanını sil */
  clearRating: async (songId: string, userId: string): Promise<void> => {
    const { error } = await sb
      .from('song_ratings')
      .delete()
      .eq('song_id', songId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  /** Şarkı için toplam puan ve ortalama */
  getRatingSummary: async (songId: string): Promise<SongRatingSummary> => {
    const { data, error } = await sb
      .from('song_rating_summary')
      .select('*')
      .eq('song_id', songId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return { song_id: songId, count: 0, average: 0 };
    return data as SongRatingSummary;
  },
};
