-- =============================================
-- 003: Polls / Oylama Sistemi
-- =============================================

CREATE TABLE IF NOT EXISTS public.polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  question TEXT NOT NULL,
  poll_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (poll_type IN ('multiple_choice', 'yes_no')),
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ,
  is_anonymous BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.poll_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  option_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- İndeksler
CREATE INDEX idx_polls_group_id ON public.polls(group_id);
CREATE INDEX idx_polls_status ON public.polls(status);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);

-- RLS
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- Polls: grup üyeleri okur
CREATE POLICY "Grup üyeleri poll okur"
  ON public.polls FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Polls: grup üyeleri oluşturur
CREATE POLICY "Grup üyeleri poll oluşturur"
  ON public.polls FOR INSERT
  WITH CHECK (is_group_member(group_id, auth.uid()));

-- Polls: creator/admin kapatır (update)
CREATE POLICY "Creator/admin poll günceller"
  ON public.polls FOR UPDATE
  USING (
    created_by = auth.uid()
    OR get_group_role(group_id, auth.uid()) IN ('admin', 'owner')
  );

-- Polls: creator/admin siler
CREATE POLICY "Creator/admin poll siler"
  ON public.polls FOR DELETE
  USING (
    created_by = auth.uid()
    OR get_group_role(group_id, auth.uid()) IN ('admin', 'owner')
  );

-- Poll votes: grup üyeleri okur
CREATE POLICY "Grup üyeleri oy okur"
  ON public.poll_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_id AND is_group_member(p.group_id, auth.uid())
    )
  );

-- Poll votes: grup üyeleri oy verir
CREATE POLICY "Grup üyeleri oy verir"
  ON public.poll_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.polls p
      WHERE p.id = poll_id
      AND p.status = 'active'
      AND is_group_member(p.group_id, auth.uid())
    )
  );

-- Poll votes: kendi oyunu siler
CREATE POLICY "Kullanıcı kendi oyunu siler"
  ON public.poll_votes FOR DELETE
  USING (user_id = auth.uid());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.poll_votes;
