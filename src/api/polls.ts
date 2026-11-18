import { supabase } from './supabase';
import type { Poll, PollVote, PollWithVotes, PollOption } from '../types/poll';
import type { Json } from '../types/database.types';

export interface CreatePollParams {
  group_id: string;
  created_by: string;
  question: string;
  poll_type?: 'multiple_choice' | 'yes_no';
  options: PollOption[];
  expires_at?: string;
  is_anonymous?: boolean;
}

export const pollsApi = {
  /** Grubun oylamalarını getir */
  getByGroup: async (groupId: string): Promise<PollWithVotes[]> => {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const polls = (data ?? []) as unknown as Poll[];
    if (polls.length === 0) return [];

    // Tüm oyları getir
    const pollIds = polls.map((p) => p.id);
    const { data: votes, error: votesErr } = await supabase
      .from('poll_votes')
      .select('*')
      .in('poll_id', pollIds);
    if (votesErr) throw votesErr;

    const allVotes = (votes ?? []) as PollVote[];

    return polls.map((poll) => {
      const pollVotes = allVotes.filter((v) => v.poll_id === poll.id);
      const voteCounts: Record<string, number> = {};
      for (const opt of poll.options) {
        voteCounts[opt.id] = pollVotes.filter((v) => v.option_id === opt.id).length;
      }
      return {
        ...poll,
        votes: pollVotes,
        vote_counts: voteCounts,
        total_votes: pollVotes.length,
      };
    });
  },

  /** Tek oylama getir */
  getById: async (id: string, userId?: string): Promise<PollWithVotes | null> => {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('id', id)
      .single();
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    const poll = data as unknown as Poll;
    const { data: votes, error: votesErr } = await supabase
      .from('poll_votes')
      .select('*')
      .eq('poll_id', id);
    if (votesErr) throw votesErr;

    const allVotes = (votes ?? []) as PollVote[];
    const voteCounts: Record<string, number> = {};
    for (const opt of poll.options) {
      voteCounts[opt.id] = allVotes.filter((v) => v.option_id === opt.id).length;
    }

    return {
      ...poll,
      votes: allVotes,
      my_vote: userId ? allVotes.find((v) => v.user_id === userId) ?? null : null,
      vote_counts: voteCounts,
      total_votes: allVotes.length,
    };
  },

  /** Oylama oluştur */
  create: async (params: CreatePollParams): Promise<Poll> => {
    const { data, error } = await supabase
      .from('polls')
      .insert({ ...params, options: params.options as unknown as Json })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Poll;
  },

  /** Oy ver (mevcut oy varsa önce sil, sonra yenisini ekle) */
  vote: async (pollId: string, userId: string, optionId: string): Promise<PollVote> => {
    // Mevcut oyu sil (yoksa hata vermez)
    await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId);

    // Yeni oy ekle
    const { data, error } = await supabase
      .from('poll_votes')
      .insert({ poll_id: pollId, user_id: userId, option_id: optionId })
      .select()
      .single();
    if (error) throw error;
    return data as PollVote;
  },

  /** Oyunu geri al */
  removeVote: async (pollId: string, userId: string): Promise<void> => {
    const { error } = await supabase
      .from('poll_votes')
      .delete()
      .eq('poll_id', pollId)
      .eq('user_id', userId);
    if (error) throw error;
  },

  /** Oylamayı kapat */
  close: async (id: string): Promise<Poll> => {
    const { data, error } = await supabase
      .from('polls')
      .update({ status: 'closed' })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as Poll;
  },

  /** Oylamayı sil */
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('polls').delete().eq('id', id);
    if (error) throw error;
  },
};
