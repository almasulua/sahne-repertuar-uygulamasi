import type { Setlist } from './setlist';

export type EventStatus = 'upcoming' | 'cancelled' | 'completed';
export type RsvpStatus = 'attending' | 'not_attending' | 'maybe' | 'pending';

export interface Event {
  id: string;
  group_id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  venue: string | null;
  venue_address: string | null;
  setlist_id: string | null;
  status: EventStatus;
  created_at: string;
  updated_at: string;
  setlist?: Setlist | null;
}

export interface EventRsvp {
  id: string;
  event_id: string;
  user_id: string;
  status: RsvpStatus;
  created_at: string;
  updated_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface EventWithRsvps extends Event {
  rsvps: EventRsvp[];
  my_rsvp?: EventRsvp | null;
  rsvp_counts: {
    attending: number;
    not_attending: number;
    maybe: number;
    pending: number;
  };
}
