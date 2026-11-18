import { supabase } from './supabase';
import type { Event, EventRsvp, EventWithRsvps, RsvpStatus } from '../types/event';

export interface CreateEventParams {
  group_id: string;
  created_by: string;
  title: string;
  description?: string;
  event_date: string;
  end_date?: string;
  venue?: string;
  venue_address?: string;
  setlist_id?: string;
}

export const eventsApi = {
  /** Grubun etkinliklerini getir */
  getByGroup: async (groupId: string): Promise<EventWithRsvps[]> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('group_id', groupId)
      .order('event_date', { ascending: true });
    if (error) throw error;

    const events = (data ?? []) as Event[];
    if (events.length === 0) return [];

    const eventIds = events.map((e) => e.id);
    // RSVP'leri çek (başarısız olursa boş devam et)
    let allRsvps: EventRsvp[] = [];
    try {
      const { data: rsvps, error: rErr } = await supabase
        .from('event_rsvps')
        .select('*')
        .in('event_id', eventIds);
      if (!rErr) allRsvps = (rsvps ?? []) as EventRsvp[];
    } catch {
      // RSVP çekme hatası — boş devam et
    }

    return events.map((event) => {
      const eventRsvps = allRsvps.filter((r) => r.event_id === event.id);
      return {
        ...event,
        rsvps: eventRsvps,
        rsvp_counts: {
          attending: eventRsvps.filter((r) => r.status === 'attending').length,
          not_attending: eventRsvps.filter((r) => r.status === 'not_attending').length,
          maybe: eventRsvps.filter((r) => r.status === 'maybe').length,
          pending: eventRsvps.filter((r) => r.status === 'pending').length,
        },
      };
    });
  },

  /** Tek etkinlik getir */
  getById: async (id: string): Promise<EventWithRsvps | null> => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const event = data as Event;
    const { data: rsvps, error: rErr } = await supabase
      .from('event_rsvps')
      .select('*, user:users(id, username, display_name, avatar_url)')
      .eq('event_id', id);
    if (rErr) throw rErr;

    const eventRsvps = (rsvps ?? []) as EventRsvp[];
    return {
      ...event,
      rsvps: eventRsvps,
      rsvp_counts: {
        attending: eventRsvps.filter((r) => r.status === 'attending').length,
        not_attending: eventRsvps.filter((r) => r.status === 'not_attending').length,
        maybe: eventRsvps.filter((r) => r.status === 'maybe').length,
        pending: eventRsvps.filter((r) => r.status === 'pending').length,
      },
    };
  },

  /** Etkinlik oluştur */
  create: async (params: CreateEventParams): Promise<Event> => {
    const { data, error } = await supabase
      .from('events')
      .insert(params)
      .select()
      .single();
    if (error) {
      if (__DEV__) console.error('[Events] create error:', error.message, error.code);
      throw error;
    }
    return data as Event;
  },

  /** Etkinlik güncelle */
  update: async (id: string, updates: Partial<Event>): Promise<Event> => {
    const { setlist, ...rest } = updates;
    const { data, error } = await supabase
      .from('events')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Event;
  },

  /** Etkinlik sil */
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  /** RSVP güncelle/oluştur */
  upsertRsvp: async (eventId: string, userId: string, status: RsvpStatus): Promise<EventRsvp> => {
    const { data, error } = await supabase
      .from('event_rsvps')
      .upsert(
        { event_id: eventId, user_id: userId, status, updated_at: new Date().toISOString() },
        { onConflict: 'event_id,user_id' }
      )
      .select('*, user:users(id, username, display_name, avatar_url)')
      .single();
    if (error) throw error;
    return data as EventRsvp;
  },
};
