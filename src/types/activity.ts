export type ActivityActionType =
  | 'song_added'
  | 'song_removed'
  | 'song_status_changed'
  | 'setlist_created'
  | 'setlist_deleted'
  | 'poll_created'
  | 'event_created'
  | 'member_joined'
  | 'member_left'
  | 'member_role_changed';

export type ActivityTargetType = 'song' | 'setlist' | 'poll' | 'event' | 'user' | null;

export interface GroupActivity {
  id: string;
  group_id: string;
  actor_id: string | null;
  action_type: ActivityActionType;
  target_type: ActivityTargetType;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}
