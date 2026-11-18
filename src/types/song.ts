export type SongDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type SongStatus = 'active' | 'archived' | 'draft';
export type PersonalSongStatus = string; // Artık dinamik — kullanıcı kategorileri
export type AttachmentType = 'pdf' | 'audio' | 'image';

export interface UserCategory {
  id: string;
  user_id: string;
  name: string;
  label: string;
  color: string;
  position: number;
  is_default: boolean;
  created_at: string;
}

export interface Song {
  id: string;
  title: string;
  artist: string | null;
  genre: string[];
  key: string | null;
  bpm: number | null;
  duration: number | null; // seconds
  difficulty: SongDifficulty | null;
  lyrics: string | null; // ChordPro format
  chords: string[];
  source_url: string | null;
  status: SongStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersonalSong {
  id: string;
  user_id: string;
  song_id: string;
  notes: string | null;
  tags: string[];
  status: PersonalSongStatus;
  is_favorite: boolean;
  last_played_at: string | null;
  created_at: string;
  updated_at: string;
  song?: Song; // joined
}

export interface SongAttachment {
  id: string;
  song_id: string;
  user_id: string | null;
  type: AttachmentType;
  url: string;
  name: string;
  created_at: string;
}

export type GroupSongStatus = 'learning' | 'ready' | 'setlist' | 'archived';

export interface GroupSong {
  id: string;
  group_id: string;
  song_id: string;
  status: GroupSongStatus;
  notes: string | null;
  part_assignments: Record<string, string>; // userId → part
  added_by: string | null;
  approved: boolean;
  created_at: string;
  song?: Song; // joined
}

// ChordPro token types
export type TokenType = 'text' | 'chord' | 'directive' | 'newline';

export interface Token {
  type: TokenType;
  value: string;
}

export interface ChordTextPair {
  chord: string | null;
  text: string;
}

export interface ChordProLine {
  pairs: ChordTextPair[];
  isDirective?: boolean;
  directiveKey?: string;
  directiveValue?: string;
}
