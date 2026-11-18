-- =============================================
-- 004: Events / Takvim & Etkinlik Planlama
-- =============================================

CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  venue TEXT,
  venue_address TEXT,
  setlist_id UUID REFERENCES public.setlists(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('attending', 'not_attending', 'maybe', 'pending')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- İndeksler
CREATE INDEX idx_events_group_id ON public.events(group_id);
CREATE INDEX idx_events_event_date ON public.events(event_date);
CREATE INDEX idx_events_status ON public.events(status);
CREATE INDEX idx_event_rsvps_event_id ON public.event_rsvps(event_id);

-- updated_at triggers
CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER event_rsvps_updated_at
  BEFORE UPDATE ON public.event_rsvps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;

-- Events: üyeler okur
CREATE POLICY "Grup üyeleri event okur"
  ON public.events FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- Events: admin/owner oluşturur
CREATE POLICY "Admin/owner event oluşturur"
  ON public.events FOR INSERT
  WITH CHECK (
    get_group_role(group_id, auth.uid()) IN ('admin', 'owner')
  );

-- Events: admin/owner düzenler
CREATE POLICY "Admin/owner event düzenler"
  ON public.events FOR UPDATE
  USING (
    get_group_role(group_id, auth.uid()) IN ('admin', 'owner')
  );

-- Events: admin/owner siler
CREATE POLICY "Admin/owner event siler"
  ON public.events FOR DELETE
  USING (
    get_group_role(group_id, auth.uid()) IN ('admin', 'owner')
  );

-- Event RSVPs: üyeler okur
CREATE POLICY "Grup üyeleri RSVP okur"
  ON public.event_rsvps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND is_group_member(e.group_id, auth.uid())
    )
  );

-- Event RSVPs: kendi RSVP'sini yönetir (insert)
CREATE POLICY "Kullanıcı kendi RSVP ekler"
  ON public.event_rsvps FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND is_group_member(e.group_id, auth.uid())
    )
  );

-- Event RSVPs: kendi RSVP'sini günceller
CREATE POLICY "Kullanıcı kendi RSVP günceller"
  ON public.event_rsvps FOR UPDATE
  USING (user_id = auth.uid());

-- Event RSVPs: kendi RSVP'sini siler
CREATE POLICY "Kullanıcı kendi RSVP siler"
  ON public.event_rsvps FOR DELETE
  USING (user_id = auth.uid());
