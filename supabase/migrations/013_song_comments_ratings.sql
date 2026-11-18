-- =============================================
-- 013: Şarkı Yorumları ve Puanlama
-- =============================================
-- Kullanıcılar şarkılara yorum yapabilir ve 1–5 yıldız puan verebilir.
-- Yorumlar herkese açık (giriş yapmış kullanıcılar okuyabilir).
-- Her kullanıcı bir şarkıya tek bir puan verebilir (UNIQUE).

-- ----------------------------------------
-- Yorumlar tablosu
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.song_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_song_comments_song_id_created_at
  ON public.song_comments(song_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_song_comments_user_id
  ON public.song_comments(user_id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS song_comments_set_updated_at ON public.song_comments;
CREATE TRIGGER song_comments_set_updated_at
  BEFORE UPDATE ON public.song_comments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.song_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Giriş yapmış kullanıcı yorum okur" ON public.song_comments;
CREATE POLICY "Giriş yapmış kullanıcı yorum okur"
  ON public.song_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Kullanıcı kendi yorumunu ekler" ON public.song_comments;
CREATE POLICY "Kullanıcı kendi yorumunu ekler"
  ON public.song_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi yorumunu günceller" ON public.song_comments;
CREATE POLICY "Kullanıcı kendi yorumunu günceller"
  ON public.song_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi yorumunu siler" ON public.song_comments;
CREATE POLICY "Kullanıcı kendi yorumunu siler"
  ON public.song_comments FOR DELETE
  USING (auth.uid() = user_id);


-- ----------------------------------------
-- Puanlama tablosu
-- ----------------------------------------
CREATE TABLE IF NOT EXISTS public.song_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (song_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_song_ratings_song_id
  ON public.song_ratings(song_id);

DROP TRIGGER IF EXISTS song_ratings_set_updated_at ON public.song_ratings;
CREATE TRIGGER song_ratings_set_updated_at
  BEFORE UPDATE ON public.song_ratings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.song_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Giriş yapmış kullanıcı puan okur" ON public.song_ratings;
CREATE POLICY "Giriş yapmış kullanıcı puan okur"
  ON public.song_ratings FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Kullanıcı kendi puanını ekler" ON public.song_ratings;
CREATE POLICY "Kullanıcı kendi puanını ekler"
  ON public.song_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi puanını günceller" ON public.song_ratings;
CREATE POLICY "Kullanıcı kendi puanını günceller"
  ON public.song_ratings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Kullanıcı kendi puanını siler" ON public.song_ratings;
CREATE POLICY "Kullanıcı kendi puanını siler"
  ON public.song_ratings FOR DELETE
  USING (auth.uid() = user_id);


-- ----------------------------------------
-- Toplu puan istatistik view'ı
-- ----------------------------------------
CREATE OR REPLACE VIEW public.song_rating_summary AS
SELECT
  song_id,
  COUNT(*)::INT AS count,
  ROUND(AVG(rating)::NUMERIC, 2)::FLOAT AS average
FROM public.song_ratings
GROUP BY song_id;

-- View'a okuma yetkisi (RLS view'a inherit eder; alt tablodan gelir)
GRANT SELECT ON public.song_rating_summary TO authenticated;
