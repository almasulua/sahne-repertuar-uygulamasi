import { supabase } from './supabase';
import type { GroupActivity } from '../types/activity';

// database.types.ts'de henüz group_activities tanımı yok (stub)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;

export const activitiesApi = {
  /** Grup için son N aktivite (en yeni → en eski) */
  getByGroup: async (groupId: string, limit: number = 50): Promise<GroupActivity[]> => {
    const { data, error } = await sb
      .from('group_activities')
      .select(
        `
          *,
          actor:users!group_activities_actor_id_fkey (
            id, username, display_name, avatar_url
          )
        `,
      )
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as GroupActivity[];
  },
};
