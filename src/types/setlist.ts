import type { Song } from './song';

export type SetlistStatus = 'draft' | 'active' | 'archived';
export type SetlistItemType = 'song' | 'break';

export interface Setlist {
  id: string;
  group_id: string;
  name: string;
  description: string | null;
  event_date: string | null;
  venue: string | null;
  status: SetlistStatus;
  created_by: string;
  is_public: boolean;
  public_slug: string | null;
  created_at: string;
  updated_at: string;
}

export interface SetlistItem {
  id: string;
  setlist_id: string;
  song_id: string | null;
  item_type: SetlistItemType;
  position: number;
  notes: string | null;
  custom_key: string | null;
  custom_bpm: number | null;
  break_duration: number | null;
  /** Bu setlist item için üye → part adı (örn. {userId: "Gitar"}) */
  part_assignments: Record<string, string>;
  created_at: string;
  song?: Song | null;
}

export interface SetlistWithItems extends Setlist {
  items: SetlistItem[];
}
