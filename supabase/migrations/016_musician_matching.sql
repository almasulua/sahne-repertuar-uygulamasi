-- =============================================
-- 016: Müzisyen Eşleştirme
-- =============================================
-- Kullanıcının profili (instruments, genres, level) ile diğer kullanıcılar arasında
-- bir uyum skoru hesaplar ve sıralı liste döner.
--
-- Skor formülü (0–100):
--   * Ortak enstrüman sayısı  × 25 (cap 50)
--   * Ortak tür sayısı        × 15 (cap 30)
--   * Level uyumu             0/10/20 (aynı=20, ±1=10, diğer=0)
-- Sonuç MIN(100, toplam).
--
-- Filtreler:
--   * Kendisi hariç
--   * En az 1 ortak enstrüman OLMALI (random spam'i önler)
--   * Skor > 0
--
-- RLS: RPC SECURITY DEFINER ile çalışır; user'ın kendisi dahil tüm public profilleri okuyabilmesi gerekir.

CREATE OR REPLACE FUNCTION public.find_musician_matches(
  p_user_id UUID,
  p_limit INT DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  instruments TEXT[],
  genres TEXT[],
  level TEXT,
  score INT,
  shared_instruments TEXT[],
  shared_genres TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_me_instruments TEXT[];
  v_me_genres TEXT[];
  v_me_level TEXT;
BEGIN
  SELECT u.instruments, u.genres, u.level
    INTO v_me_instruments, v_me_genres, v_me_level
    FROM public.users u
    WHERE u.id = p_user_id;

  IF v_me_instruments IS NULL OR array_length(v_me_instruments, 1) IS NULL THEN
    -- Kullanıcının enstrümanı yoksa eşleştirme yapma
    RETURN;
  END IF;

  RETURN QUERY
  WITH scored AS (
    SELECT
      u.id,
      u.username,
      u.display_name,
      u.avatar_url,
      u.instruments,
      u.genres,
      u.level,
      -- Ortak enstrümanlar
      ARRAY(SELECT UNNEST(u.instruments) INTERSECT SELECT UNNEST(v_me_instruments)) AS si,
      -- Ortak türler
      ARRAY(SELECT UNNEST(u.genres) INTERSECT SELECT UNNEST(v_me_genres)) AS sg,
      -- Level uyumu
      CASE
        WHEN u.level IS NULL OR v_me_level IS NULL THEN 0
        WHEN u.level = v_me_level THEN 20
        WHEN (v_me_level = 'beginner' AND u.level = 'intermediate')
          OR (v_me_level = 'intermediate' AND u.level IN ('beginner','advanced'))
          OR (v_me_level = 'advanced' AND u.level IN ('intermediate','professional'))
          OR (v_me_level = 'professional' AND u.level = 'advanced')
          THEN 10
        ELSE 0
      END AS level_score
    FROM public.users u
    WHERE u.id <> p_user_id
  )
  SELECT
    s.id,
    s.username,
    s.display_name,
    s.avatar_url,
    s.instruments,
    s.genres,
    s.level,
    LEAST(
      100,
      LEAST(COALESCE(array_length(s.si, 1), 0) * 25, 50)
        + LEAST(COALESCE(array_length(s.sg, 1), 0) * 15, 30)
        + s.level_score
    )::INT AS score,
    s.si AS shared_instruments,
    s.sg AS shared_genres
  FROM scored s
  WHERE COALESCE(array_length(s.si, 1), 0) >= 1
  ORDER BY score DESC, s.username ASC
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION public.find_musician_matches(UUID, INT) TO authenticated;
