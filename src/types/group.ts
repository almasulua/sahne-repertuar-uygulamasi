export type GroupRole = 'owner' | 'admin' | 'member';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  genre: string | null;
  owner_id: string;
  invite_token: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupRole;
  joined_at: string;
  user?: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
  member_count: number;
  my_role?: GroupRole;
}
