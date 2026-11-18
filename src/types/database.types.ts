// Supabase v2.99.1 uyumlu tip tanımları
// Gerçek tiplerle değiştirmek için: supabase gen types typescript --local > src/types/database.types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          instruments: string[];
          genres: string[];
          level: string | null;
          push_token: string | null;
          notification_preferences: Json;
          muted_group_ids: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          instruments?: string[];
          genres?: string[];
          level?: string | null;
          push_token?: string | null;
          notification_preferences?: Json;
          muted_group_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          instruments?: string[];
          genres?: string[];
          level?: string | null;
          push_token?: string | null;
          notification_preferences?: Json;
          muted_group_ids?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          avatar_url: string | null;
          genre: string | null;
          owner_id: string;
          invite_token: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          avatar_url?: string | null;
          genre?: string | null;
          owner_id: string;
          invite_token?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          avatar_url?: string | null;
          genre?: string | null;
          owner_id?: string;
          invite_token?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      group_members: {
        Row: {
          id: string;
          group_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      songs: {
        Row: {
          id: string;
          title: string;
          artist: string | null;
          genre: string[];
          key: string | null;
          bpm: number | null;
          duration: number | null;
          difficulty: string | null;
          lyrics: string | null;
          chords: string[];
          source_url: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          artist?: string | null;
          genre?: string[];
          key?: string | null;
          bpm?: number | null;
          duration?: number | null;
          difficulty?: string | null;
          lyrics?: string | null;
          chords?: string[];
          source_url?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          artist?: string | null;
          genre?: string[];
          key?: string | null;
          bpm?: number | null;
          duration?: number | null;
          difficulty?: string | null;
          lyrics?: string | null;
          chords?: string[];
          source_url?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'songs_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      personal_songs: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          notes: string | null;
          tags: string[];
          status: string;
          is_favorite: boolean;
          last_played_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          notes?: string | null;
          tags?: string[];
          status?: string;
          is_favorite?: boolean;
          last_played_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          song_id?: string;
          notes?: string | null;
          tags?: string[];
          status?: string;
          is_favorite?: boolean;
          last_played_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'personal_songs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_songs_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      song_attachments: {
        Row: {
          id: string;
          song_id: string;
          user_id: string | null;
          type: string;
          url: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          song_id: string;
          user_id?: string | null;
          type: string;
          url: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          song_id?: string;
          user_id?: string | null;
          type?: string;
          url?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'song_attachments_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'song_attachments_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      group_songs: {
        Row: {
          id: string;
          group_id: string;
          song_id: string;
          status: string;
          notes: string | null;
          part_assignments: Json;
          added_by: string | null;
          approved: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          song_id: string;
          status?: string;
          notes?: string | null;
          part_assignments?: Json;
          added_by?: string | null;
          approved?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          song_id?: string;
          status?: string;
          notes?: string | null;
          part_assignments?: Json;
          added_by?: string | null;
          approved?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_songs_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_songs_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_songs_added_by_fkey';
            columns: ['added_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      messages: {
        Row: {
          id: string;
          group_id: string;
          sender_id: string | null;
          content: string;
          type: string;
          reply_to_id: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          sender_id?: string | null;
          content: string;
          type?: string;
          reply_to_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          sender_id?: string | null;
          content?: string;
          type?: string;
          reply_to_id?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'messages_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_sender_id_fkey';
            columns: ['sender_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'messages_reply_to_id_fkey';
            columns: ['reply_to_id'];
            isOneToOne: false;
            referencedRelation: 'messages';
            referencedColumns: ['id'];
          },
        ];
      };
      setlists: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          description: string | null;
          event_date: string | null;
          venue: string | null;
          status: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          description?: string | null;
          event_date?: string | null;
          venue?: string | null;
          status?: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          description?: string | null;
          event_date?: string | null;
          venue?: string | null;
          status?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'setlists_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
        ];
      };
      setlist_items: {
        Row: {
          id: string;
          setlist_id: string;
          song_id: string | null;
          item_type: string;
          position: number;
          notes: string | null;
          custom_key: string | null;
          custom_bpm: number | null;
          break_duration: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          setlist_id: string;
          song_id?: string | null;
          item_type?: string;
          position?: number;
          notes?: string | null;
          custom_key?: string | null;
          custom_bpm?: number | null;
          break_duration?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          setlist_id?: string;
          song_id?: string | null;
          item_type?: string;
          position?: number;
          notes?: string | null;
          custom_key?: string | null;
          custom_bpm?: number | null;
          break_duration?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'setlist_items_setlist_id_fkey';
            columns: ['setlist_id'];
            isOneToOne: false;
            referencedRelation: 'setlists';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'setlist_items_song_id_fkey';
            columns: ['song_id'];
            isOneToOne: false;
            referencedRelation: 'songs';
            referencedColumns: ['id'];
          },
        ];
      };
      polls: {
        Row: {
          id: string;
          group_id: string;
          created_by: string;
          question: string;
          poll_type: string;
          options: Json;
          expires_at: string | null;
          is_anonymous: boolean;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          created_by: string;
          question: string;
          poll_type?: string;
          options?: Json;
          expires_at?: string | null;
          is_anonymous?: boolean;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          created_by?: string;
          question?: string;
          poll_type?: string;
          options?: Json;
          expires_at?: string | null;
          is_anonymous?: boolean;
          status?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'polls_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'polls_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      poll_votes: {
        Row: {
          id: string;
          poll_id: string;
          user_id: string;
          option_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          poll_id: string;
          user_id: string;
          option_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          poll_id?: string;
          user_id?: string;
          option_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'poll_votes_poll_id_fkey';
            columns: ['poll_id'];
            isOneToOne: false;
            referencedRelation: 'polls';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'poll_votes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
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
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          group_id: string;
          created_by: string;
          title: string;
          description?: string | null;
          event_date: string;
          end_date?: string | null;
          venue?: string | null;
          venue_address?: string | null;
          setlist_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          group_id?: string;
          created_by?: string;
          title?: string;
          description?: string | null;
          event_date?: string;
          end_date?: string | null;
          venue?: string | null;
          venue_address?: string | null;
          setlist_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'events_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_setlist_id_fkey';
            columns: ['setlist_id'];
            isOneToOne: false;
            referencedRelation: 'setlists';
            referencedColumns: ['id'];
          },
        ];
      };
      event_rsvps: {
        Row: {
          id: string;
          event_id: string;
          user_id: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
          user_id: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          user_id?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'event_rsvps_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'event_rsvps_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          body?: string;
          data?: Json;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      user_categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          label: string;
          color: string;
          position: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          label: string;
          color?: string;
          position?: number;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          label?: string;
          color?: string;
          position?: number;
          is_default?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_categories_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_group_member: {
        Args: { gid: string; uid: string };
        Returns: boolean;
      };
      get_group_role: {
        Args: { gid: string; uid: string };
        Returns: string | null;
      };
      create_group_with_owner: {
        Args: {
          p_name: string;
          p_description?: string | null;
          p_genre?: string | null;
          p_owner_id?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
