-- =============================================
-- 005: Push Notifications & In-App Notifications
-- =============================================

-- users tablosuna push token ve bildirim tercihleri ekle
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS push_token TEXT,
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB NOT NULL DEFAULT '{
    "chat_messages": true,
    "poll_created": true,
    "event_created": true,
    "event_reminder": true,
    "setlist_updated": true
  }'::jsonb;

-- Bildirim merkezi tablosu
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- İndeksler
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Bildirimler: sadece kendi bildirimlerini okur
CREATE POLICY "Kullanıcı kendi bildirimlerini okur"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

-- Bildirimler: sistem oluşturur (service_role key ile)
CREATE POLICY "Sistem bildirim oluşturur"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Bildirimler: kullanıcı kendi bildirimini okundu işaretler
CREATE POLICY "Kullanıcı bildirim günceller"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Bildirimler: kullanıcı kendi bildirimini siler
CREATE POLICY "Kullanıcı bildirim siler"
  ON public.notifications FOR DELETE
  USING (user_id = auth.uid());
