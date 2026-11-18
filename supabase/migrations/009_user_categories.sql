-- =============================================
-- 009: Dinamik kullanıcı kategorileri
-- =============================================

-- 1) user_categories tablosu
CREATE TABLE public.user_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,         -- internal key: 'learning', 'ready', 'custom_xyz'
  label       TEXT NOT NULL,         -- display name: 'Öğreniyorum', 'Hazır'
  color       TEXT DEFAULT '#6366f1', -- hex renk
  position    INTEGER NOT NULL DEFAULT 0,
  is_default  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, name)
);

-- RLS
ALTER TABLE public.user_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_categories_own" ON public.user_categories
  FOR ALL USING (auth.uid() = user_id);

-- 2) personal_songs.status CHECK constraint'ini kaldır (artık dinamik)
ALTER TABLE public.personal_songs DROP CONSTRAINT IF EXISTS personal_songs_status_check;

-- 3) Mevcut kullanıcılar için varsayılan kategorileri oluştur
INSERT INTO public.user_categories (user_id, name, label, color, position, is_default)
SELECT u.id, cat.name, cat.label, cat.color, cat.position, TRUE
FROM public.users u
CROSS JOIN (VALUES
  ('learning', 'Öğreniyorum', '#3b82f6', 0),
  ('ready',    'Hazır',       '#22c55e', 1),
  ('archived', 'Arşiv',       '#6b7280', 2)
) AS cat(name, label, color, position)
ON CONFLICT (user_id, name) DO NOTHING;

-- 4) Yeni kullanıcılar için otomatik kategori oluşturma trigger'ı
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_categories (user_id, name, label, color, position, is_default) VALUES
    (NEW.id, 'learning', 'Öğreniyorum', '#3b82f6', 0, TRUE),
    (NEW.id, 'ready',    'Hazır',       '#22c55e', 1, TRUE),
    (NEW.id, 'archived', 'Arşiv',       '#6b7280', 2, TRUE);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_user_created_categories
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_categories();

-- Index
CREATE INDEX idx_user_categories_user_id ON public.user_categories(user_id, position);
