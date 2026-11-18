export type PollType = 'multiple_choice' | 'yes_no';
export type PollStatus = 'active' | 'closed';

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  id: string;
  group_id: string;
  created_by: string;
  question: string;
  poll_type: PollType;
  options: PollOption[];
  expires_at: string | null;
  is_anonymous: boolean;
  status: PollStatus;
  created_at: string;
}

export interface PollVote {
  id: string;
  poll_id: string;
  user_id: string;
  option_id: string;
  created_at: string;
}

export interface PollWithVotes extends Poll {
  votes: PollVote[];
  my_vote?: PollVote | null;
  vote_counts: Record<string, number>;
  total_votes: number;
}
