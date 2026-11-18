import { supabase } from './supabase';
import type { Group, GroupMember, GroupWithMembers, GroupRole } from '../types/group';

export interface CreateGroupParams {
  name: string;
  description?: string;
  genre?: string;
  owner_id: string;
}

export const groupsApi = {
  /** Kullanıcının üye olduğu grupları çek */
  getMyGroups: async (userId: string): Promise<GroupWithMembers[]> => {
    const { data, error } = await supabase
      .from('group_members')
      .select('role, group:groups(*)')
      .eq('user_id', userId);
    if (error) throw error;

    return ((data ?? []) as unknown as Array<{ role: GroupRole; group: Group }>)
      .filter((row) => row.group)
      .map((row) => ({
        ...row.group,
        members: [],
        member_count: 0,
        my_role: row.role,
      }));
  },

  /** Tek grup çek (üyelerle birlikte) */
  getById: async (groupId: string): Promise<GroupWithMembers | null> => {
    const { data: group, error: gErr } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();
    if (gErr) {
      if (gErr.code === 'PGRST116') return null;
      throw gErr;
    }

    const { data: members, error: mErr } = await supabase
      .from('group_members')
      .select('*, user:users(id, username, display_name, avatar_url)')
      .eq('group_id', groupId);
    if (mErr) throw mErr;

    return {
      ...(group as Group),
      members: (members ?? []) as GroupMember[],
      member_count: members?.length ?? 0,
    };
  },

  /** Grup oluştur + sahibi üye olarak ekle (RPC ile atomik) */
  create: async (params: CreateGroupParams): Promise<Group> => {
    const { data, error } = await supabase.rpc('create_group_with_owner', {
      p_name: params.name,
      p_description: params.description ?? null,
      p_genre: params.genre ?? null,
      p_owner_id: params.owner_id,
    });
    if (error) throw error;

    // RPC JSONB döndürüyor
    const group = data as unknown as Group;
    if (!group?.id) throw new Error('Grup oluşturulamadı');
    return group;
  },

  /** Grup güncelle */
  update: async (groupId: string, updates: Partial<Group>): Promise<Group> => {
    const { data, error } = await supabase
      .from('groups')
      .update(updates)
      .eq('id', groupId)
      .select()
      .single();
    if (error) throw error;
    return data as Group;
  },

  /** Grubu sil */
  delete: async (groupId: string): Promise<void> => {
    const { error } = await supabase.from('groups').delete().eq('id', groupId);
    if (error) throw error;
  },

  /** Davet token'ına göre grubu bul */
  findByInviteToken: async (token: string): Promise<Group | null> => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .eq('invite_token', token)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Group;
  },

  /** Gruba katıl (davet tokenı ile) */
  joinByToken: async (token: string, userId: string): Promise<Group> => {
    const group = await groupsApi.findByInviteToken(token);
    if (!group) throw new Error('invalid_invite');

    // Zaten üye mi?
    const { data: existing } = await supabase
      .from('group_members')
      .select('id')
      .eq('group_id', group.id)
      .eq('user_id', userId)
      .single();

    if (existing) throw new Error('already_member');

    const { error } = await supabase.from('group_members').insert({
      group_id: group.id,
      user_id: userId,
      role: 'member',
    });
    if (error) throw error;

    return group;
  },

  /** Üye rolünü güncelle */
  updateMemberRole: async (groupId: string, userId: string, role: GroupRole): Promise<void> => {
    const { error } = await supabase
      .from('group_members')
      .update({ role })
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  /** Üyeyi gruptan çıkar */
  removeMember: async (groupId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', groupId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  /** Yeni davet token'ı üret */
  regenerateInviteToken: async (groupId: string): Promise<string> => {
    const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const { data, error } = await supabase
      .from('groups')
      .update({ invite_token: newToken })
      .eq('id', groupId)
      .select('invite_token')
      .single();
    if (error) throw error;
    return (data as { invite_token: string }).invite_token;
  },
};
