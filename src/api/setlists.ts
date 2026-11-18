import { supabase } from './supabase';
import type { Setlist, SetlistItem, SetlistWithItems } from '../types/setlist';

export interface CreateSetlistParams {
  group_id: string;
  name: string;
  description?: string;
  event_date?: string;
  venue?: string;
  created_by: string;
}

export interface AddSetlistItemParams {
  setlist_id: string;
  song_id?: string | null;
  item_type?: 'song' | 'break';
  position: number;
  notes?: string;
  custom_key?: string;
  custom_bpm?: number;
  break_duration?: number;
}

export const setlistsApi = {
  /** Grubun setlistlerini getir */
  getByGroup: async (groupId: string): Promise<Setlist[]> => {
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .eq('group_id', groupId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Setlist[];
  },

  /** Tek setlist + items */
  getById: async (id: string): Promise<SetlistWithItems | null> => {
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const { data: items, error: itemsError } = await supabase
      .from('setlist_items')
      .select('*, song:songs(*)')
      .eq('setlist_id', id)
      .order('position', { ascending: true });
    if (itemsError) throw itemsError;

    return { ...(data as Setlist), items: (items ?? []) as SetlistItem[] };
  },

  /** Setlist oluştur */
  create: async (params: CreateSetlistParams): Promise<Setlist> => {
    const { data, error } = await supabase
      .from('setlists')
      .insert(params)
      .select()
      .single();
    if (error) throw error;
    return data as Setlist;
  },

  /** Setlist güncelle */
  update: async (id: string, updates: Partial<Setlist>): Promise<Setlist> => {
    const { data, error } = await supabase
      .from('setlists')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Setlist;
  },

  /** Setlist sil */
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('setlists').delete().eq('id', id);
    if (error) throw error;
  },

  /** Setlist'e item ekle */
  addItem: async (params: AddSetlistItemParams): Promise<SetlistItem> => {
    const { data, error } = await supabase
      .from('setlist_items')
      .insert(params)
      .select('*, song:songs(*)')
      .single();
    if (error) throw error;
    return data as SetlistItem;
  },

  /** Setlist item sil */
  removeItem: async (itemId: string): Promise<void> => {
    const { error } = await supabase.from('setlist_items').delete().eq('id', itemId);
    if (error) throw error;
  },

  /** Setlist item'ları yeniden sırala */
  reorderItems: async (items: { id: string; position: number }[]): Promise<void> => {
    // Batch update: her item'ın pozisyonunu güncelle
    const promises = items.map(({ id, position }) =>
      supabase.from('setlist_items').update({ position }).eq('id', id)
    );
    const results = await Promise.all(promises);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw failed.error;
  },

  /**
   * Setlist'i public/private yap. Trigger public_slug'ı otomatik üretir/temizler.
   * Server'dan dönen güncel kayıt (slug dahil) döner.
   */
  togglePublic: async (id: string, isPublic: boolean): Promise<Setlist> => {
    const { data, error } = await supabase
      .from('setlists')
      .update({ is_public: isPublic, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Setlist;
  },

  /**
   * Public slug ile setlist çek (anon erişim — RLS public okuma policy'si).
   * Items ve şarkı join'i dahil; grup adı/avatarı için ayrı çağrı yapın.
   */
  getByPublicSlug: async (slug: string): Promise<SetlistWithItems | null> => {
    const { data, error } = await supabase
      .from('setlists')
      .select('*')
      .eq('public_slug', slug)
      .eq('is_public', true)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const { data: items, error: itemsError } = await supabase
      .from('setlist_items')
      .select('*, song:songs(*)')
      .eq('setlist_id', (data as Setlist).id)
      .order('position', { ascending: true });
    if (itemsError) throw itemsError;

    return { ...(data as Setlist), items: (items ?? []) as SetlistItem[] };
  },

  /** Setlist item güncelle */
  updateItem: async (itemId: string, updates: Partial<SetlistItem>): Promise<SetlistItem> => {
    const { song, ...rest } = updates;
    const { data, error } = await supabase
      .from('setlist_items')
      .update(rest)
      .eq('id', itemId)
      .select('*, song:songs(*)')
      .single();
    if (error) throw error;
    return data as SetlistItem;
  },
};
