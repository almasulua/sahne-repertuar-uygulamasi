export type MessageType = 'text' | 'song_card' | 'image' | 'system' | 'poll';

export interface Message {
  id: string;
  group_id: string;
  sender_id: string | null;
  content: string;
  type: MessageType;
  reply_to_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  sender?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  reply_to?: Message;
}
