import { supabase } from './supabase';
import type { Song, PersonalSong, GroupSong, SongAttachment, UserCategory } from '../types/song';

export interface CreateSongParams {
  title: string;
  artist?: string;
  genre?: string[];
  key?: string;
  bpm?: number;
  duration?: number;
  difficulty?: string;
  lyrics?: string;
  chords?: string[];
  source_url?: string;
  created_by: string;
}

export interface AddToPersonalParams {
  user_id: string;
  song_id: string;
  notes?: string;
  tags?: string[];
  status?: string;
  is_favorite?: boolean;
}

export const songsApi = {
  /** Şarkı oluştur */
  create: async (params: CreateSongParams): Promise<Song> => {
    const { data, error } = await supabase
      .from('songs')
      .insert(params)
      .select()
      .single();
    if (error) throw error;
    return data as Song;
  },

  /** Şarkı güncelle */
  update: async (id: string, updates: Partial<Song>): Promise<Song> => {
    const { data, error } = await supabase
      .from('songs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Song;
  },

  /** Şarkı sil (sadece oluşturan silebilir — RLS) */
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('songs').delete().eq('id', id);
    if (error) throw error;
  },

  /** Tek şarkı çek */
  getById: async (id: string): Promise<Song | null> => {
    const { data, error } = await supabase
      .from('songs')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Song;
  },

  // ---- Kişisel Repertuar ----

  /** Kullanıcının kişisel şarkı listesi */
  getPersonalSongs: async (userId: string): Promise<PersonalSong[]> => {
    const { data, error } = await supabase
      .from('personal_songs')
      .select('*, song:songs(*)')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as PersonalSong[];
  },

  /** Şarkıyı kişisel repertuara ekle */
  addToPersonal: async (params: AddToPersonalParams): Promise<PersonalSong> => {
    const { data, error } = await supabase
      .from('personal_songs')
      .insert(params)
      .select('*, song:songs(*)')
      .single();
    if (error) throw error;
    return data as PersonalSong;
  },

  /** Kişisel şarkı güncelle */
  updatePersonal: async (id: string, updates: Partial<PersonalSong>): Promise<PersonalSong> => {
    const { data, error } = await supabase
      .from('personal_songs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*, song:songs(*)')
      .single();
    if (error) throw error;
    return data as PersonalSong;
  },

  /** Kişisel şarkıyı kaldır */
  removeFromPersonal: async (id: string): Promise<void> => {
    const { error } = await supabase.from('personal_songs').delete().eq('id', id);
    if (error) throw error;
  },

  /** Favori durumunu değiştir */
  toggleFavorite: async (id: string, isFavorite: boolean): Promise<void> => {
    const { error } = await supabase
      .from('personal_songs')
      .update({ is_favorite: isFavorite, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw error;
  },

  // ---- Grup Repertuarı ----

  /** Grubun şarkı listesi */
  getGroupSongs: async (groupId: string): Promise<GroupSong[]> => {
    const { data, error } = await supabase
      .from('group_songs')
      .select('*, song:songs(*)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as GroupSong[];
  },

  /** Gruba şarkı ekle */
  addToGroup: async (groupId: string, songId: string, addedBy: string): Promise<GroupSong> => {
    const { data, error } = await supabase
      .from('group_songs')
      .insert({ group_id: groupId, song_id: songId, added_by: addedBy })
      .select('*, song:songs(*)')
      .single();
    if (error) throw error;
    return data as GroupSong;
  },

  /** Grup şarkısı güncelle */
  updateGroupSong: async (id: string, updates: Partial<GroupSong>): Promise<GroupSong> => {
    const { data, error } = await supabase
      .from('group_songs')
      .update(updates)
      .eq('id', id)
      .select('*, song:songs(*)')
      .single();
    if (error) throw error;
    return data as GroupSong;
  },

  /** Grup şarkısını kaldır */
  removeFromGroup: async (id: string): Promise<void> => {
    const { error } = await supabase.from('group_songs').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- Ekler ----

  /** Şarkı eklerini listele */
  getAttachments: async (songId: string): Promise<SongAttachment[]> => {
    const { data, error } = await supabase
      .from('song_attachments')
      .select('*')
      .eq('song_id', songId);
    if (error) throw error;
    return (data ?? []) as SongAttachment[];
  },

  /** Ek sil */
  deleteAttachment: async (id: string): Promise<void> => {
    const { error } = await supabase.from('song_attachments').delete().eq('id', id);
    if (error) throw error;
  },

  // ---- Kullanıcı Kategorileri ----

  /** Kategorileri getir */
  getCategories: async (userId: string): Promise<UserCategory[]> => {
    const { data, error } = await supabase
      .from('user_categories')
      .select('*')
      .eq('user_id', userId)
      .order('position', { ascending: true });
    if (error) throw error;
    return (data ?? []) as UserCategory[];
  },

  /** Kategori ekle */
  createCategory: async (params: { user_id: string; name: string; label: string; color?: string }): Promise<UserCategory> => {
    // Sıradaki pozisyonu bul
    const { data: existing } = await supabase
      .from('user_categories')
      .select('position')
      .eq('user_id', params.user_id)
      .order('position', { ascending: false })
      .limit(1);
    const nextPos = ((existing?.[0] as { position: number } | undefined)?.position ?? -1) + 1;

    const { data, error } = await supabase
      .from('user_categories')
      .insert({ ...params, position: nextPos })
      .select()
      .single();
    if (error) throw error;
    return data as UserCategory;
  },

  /** Kategori güncelle */
  updateCategory: async (id: string, updates: Partial<Pick<UserCategory, 'label' | 'color' | 'position'>>): Promise<UserCategory> => {
    const { data, error } = await supabase
      .from('user_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as UserCategory;
  },

  /** Kategori sil */
  deleteCategory: async (id: string): Promise<void> => {
    const { error } = await supabase.from('user_categories').delete().eq('id', id);
    if (error) throw error;
  },

  /** Kategorileri yeniden sırala */
  reorderCategories: async (userId: string, orderedIds: string[]): Promise<void> => {
    const updates = orderedIds.map((id, i) =>
      supabase.from('user_categories').update({ position: i }).eq('id', id).eq('user_id', userId)
    );
    await Promise.all(updates);
  },
};
