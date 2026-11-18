-- =============================================
-- 002: Setlists & Stage Mode
-- =============================================

-- Setlists tablosu
CREATE TABLE IF NOT EXISTS public.setlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ,
  venue TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Setlist items tablosu
CREATE TABLE IF NOT EXISTS public.setlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setlist_id UUID NOT NULL REFERENCES public.setlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES public.songs(id) ON DELETE SET NULL,
  item_type TEXT NOT NULL DEFAULT 'song' CHECK (item_type IN ('song', 'break')),
  position INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  custom_key TEXT,
  custom_bpm INTEGER,
  break_duration INTEGER, -- dakika cinsinden
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- İndeksler
CREATE INDEX idx_setlists_group_id ON public.setlists(group_id);
CREATE INDEX idx_setlists_status ON public.setlists(status);
CREATE INDEX idx_setlist_items_setlist_id ON public.setlist_items(setlist_id);
CREATE INDEX idx_setlist_items_position ON public.setlist_items(setlist_id, position);

-- updated_at trigger
CREATE TRIGGER setlists_updated_at
  BEFORE UPDATE ON public.setlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.setlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.setlist_items ENABLE ROW LEVEL SECURITY;

-- Setlists: grup üyeleri okur
CREATE POLICY "Grup üyeleri setlist okur"
  ON public.setlists FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Setlists: grup üyeleri oluşturur
CREATE POLICY "Grup üyeleri setlist oluşturur"
  ON public.setlists FOR INSERT
  WITH CHECK (is_group_member(group_id, auth.uid()));

-- Setlists: admin/owner/creator düzenler
CREATE POLICY "Admin/owner/creator setlist düzenler"
  ON public.setlists FOR UPDATE
  USING (
    created_by = auth.uid()
    OR get_group_role(group_id, auth.uid()) IN ('admin', 'owner')
  );

-- Setlists: admin/owner/creator siler
CREATE POLICY "Admin/owner/creator setlist siler"
  ON public.setlists FOR DELETE
  USING (
    created_by = auth.uid()
    OR get_group_role(group_id, auth.uid()) IN ('admin', 'owner')
  );

-- Setlist items: setlist'in grubundaki üyeler okur
CREATE POLICY "Grup üyeleri setlist item okur"
  ON public.setlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists s
      WHERE s.id = setlist_id AND is_group_member(s.group_id, auth.uid())
    )
  );

-- Setlist items: grup üyeleri ekler
CREATE POLICY "Grup üyeleri setlist item ekler"
  ON public.setlist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.setlists s
      WHERE s.id = setlist_id AND is_group_member(s.group_id, auth.uid())
    )
  );

-- Setlist items: admin/owner/creator düzenler
CREATE POLICY "Admin/owner/creator setlist item düzenler"
  ON public.setlist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists s
      WHERE s.id = setlist_id
      AND (
        s.created_by = auth.uid()
        OR get_group_role(s.group_id, auth.uid()) IN ('admin', 'owner')
      )
    )
  );

-- Setlist items: admin/owner/creator siler
CREATE POLICY "Admin/owner/creator setlist item siler"
  ON public.setlist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists s
      WHERE s.id = setlist_id
      AND (
        s.created_by = auth.uid()
        OR get_group_role(s.group_id, auth.uid()) IN ('admin', 'owner')
      )
    )
  );

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.setlist_items;
