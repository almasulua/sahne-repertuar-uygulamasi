export type NotificationType =
  | 'chat_message'
  | 'poll_created'
  | 'event_created'
  | 'event_reminder'
  | 'setlist_updated'
  | 'group_invite';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  chat_messages: boolean;
  poll_created: boolean;
  event_created: boolean;
  event_reminder: boolean;
  setlist_updated: boolean;
}
