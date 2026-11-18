-- =============================================
-- 012: Grup Aktivite Log'u
-- =============================================
-- Kim ne yaptı: şarkı eklendi/çıkarıldı, setlist oluşturuldu, oylama açıldı,
-- etkinlik eklendi, üye katıldı/ayrıldı/rol değişti, vs.

-- Aktivite tablosu
CREATE TABLE IF NOT EXISTS public.group_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_group_activities_group_id_created_at
  ON public.group_activities(group_id, created_at DESC);

-- RLS
ALTER TABLE public.group_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Grup üyeleri aktivite okur" ON public.group_activities;
CREATE POLICY "Grup üyeleri aktivite okur"
  ON public.group_activities FOR SELECT
  USING (is_group_member(group_id, auth.uid()));

-- INSERT/UPDATE/DELETE policy yok — sadece SECURITY DEFINER trigger'lar yazabilir.

-- ----------------------------------------
-- Trigger Fonksiyonları
-- ----------------------------------------

-- group_songs tablosu için trigger
CREATE OR REPLACE FUNCTION log_group_song_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_song_title TEXT;
  v_song_artist TEXT;
  v_actor UUID;
BEGIN
  v_actor := COALESCE(auth.uid(), CASE WHEN TG_OP = 'INSERT' THEN NEW.added_by ELSE NULL END);

  IF TG_OP = 'INSERT' THEN
    SELECT title, artist INTO v_song_title, v_song_artist FROM public.songs WHERE id = NEW.song_id;
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (NEW.group_id, v_actor, 'song_added', 'song', NEW.song_id,
      jsonb_build_object('title', v_song_title, 'artist', v_song_artist));
  ELSIF TG_OP = 'DELETE' THEN
    SELECT title, artist INTO v_song_title, v_song_artist FROM public.songs WHERE id = OLD.song_id;
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (OLD.group_id, v_actor, 'song_removed', 'song', OLD.song_id,
      jsonb_build_object('title', v_song_title, 'artist', v_song_artist));
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title INTO v_song_title FROM public.songs WHERE id = NEW.song_id;
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (NEW.group_id, v_actor, 'song_status_changed', 'song', NEW.song_id,
      jsonb_build_object('title', v_song_title, 'old_status', OLD.status, 'new_status', NEW.status));
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS group_songs_activity ON public.group_songs;
CREATE TRIGGER group_songs_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.group_songs
  FOR EACH ROW EXECUTE FUNCTION log_group_song_activity();

-- setlists tablosu için trigger
CREATE OR REPLACE FUNCTION log_setlist_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (NEW.group_id, COALESCE(auth.uid(), NEW.created_by), 'setlist_created', 'setlist', NEW.id,
      jsonb_build_object('name', NEW.name));
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (OLD.group_id, auth.uid(), 'setlist_deleted', 'setlist', OLD.id,
      jsonb_build_object('name', OLD.name));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS setlists_activity ON public.setlists;
CREATE TRIGGER setlists_activity
  AFTER INSERT OR DELETE ON public.setlists
  FOR EACH ROW EXECUTE FUNCTION log_setlist_activity();

-- polls tablosu için trigger
CREATE OR REPLACE FUNCTION log_poll_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (NEW.group_id, COALESCE(auth.uid(), NEW.created_by), 'poll_created', 'poll', NEW.id,
      jsonb_build_object('question', NEW.question));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS polls_activity ON public.polls;
CREATE TRIGGER polls_activity
  AFTER INSERT ON public.polls
  FOR EACH ROW EXECUTE FUNCTION log_poll_activity();

-- events tablosu için trigger
CREATE OR REPLACE FUNCTION log_event_activity()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (NEW.group_id, COALESCE(auth.uid(), NEW.created_by), 'event_created', 'event', NEW.id,
      jsonb_build_object('title', NEW.title, 'event_date', NEW.event_date));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS events_activity ON public.events;
CREATE TRIGGER events_activity
  AFTER INSERT ON public.events
  FOR EACH ROW EXECUTE FUNCTION log_event_activity();

-- group_members tablosu için trigger
CREATE OR REPLACE FUNCTION log_member_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_username TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT username INTO v_username FROM public.users WHERE id = NEW.user_id;
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (NEW.group_id, NEW.user_id, 'member_joined', 'user', NEW.user_id,
      jsonb_build_object('username', v_username, 'role', NEW.role));
  ELSIF TG_OP = 'DELETE' THEN
    SELECT username INTO v_username FROM public.users WHERE id = OLD.user_id;
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (OLD.group_id, COALESCE(auth.uid(), OLD.user_id), 'member_left', 'user', OLD.user_id,
      jsonb_build_object('username', v_username, 'role', OLD.role));
  ELSIF TG_OP = 'UPDATE' AND NEW.role IS DISTINCT FROM OLD.role THEN
    SELECT username INTO v_username FROM public.users WHERE id = NEW.user_id;
    INSERT INTO public.group_activities (group_id, actor_id, action_type, target_type, target_id, metadata)
    VALUES (NEW.group_id, auth.uid(), 'member_role_changed', 'user', NEW.user_id,
      jsonb_build_object('username', v_username, 'old_role', OLD.role, 'new_role', NEW.role));
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS group_members_activity ON public.group_members;
CREATE TRIGGER group_members_activity
  AFTER INSERT OR UPDATE OR DELETE ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION log_member_activity();

COMMENT ON TABLE public.group_activities IS
  'Grup içi aktivite log''u — DB trigger''larıyla otomatik doldurulur. Sadece SELECT izni var.';
