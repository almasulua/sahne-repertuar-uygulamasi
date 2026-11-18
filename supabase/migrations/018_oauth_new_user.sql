-- ============================================================
-- 018: OAuth (Google / Apple) kullanıcıları için handle_new_user sağlamlaştırma
-- ============================================================
-- Sorun: 001'deki handle_new_user kullanıcı adını yalnızca e-postadan üretiyordu.
--   E-postasız bir auth.users satırında (ör. Apple'ın e-posta paylaşmadığı nadir
--   durumlar, telefonla giriş) SPLIT_PART(NULL) → NULL → username NOT NULL ihlali
--   → kayıt tamamen başarısız olurdu.
-- Çözüm: Önce sağlayıcının verdiği ad (user_name / preferred_username / name),
--   sonra e-posta, en sonda 'user' tabanına düş. Avatar için Google'ın 'picture'
--   alanı da okunur.
-- İdempotent: CREATE OR REPLACE. Studio SQL Editor'dan çalıştırın (db push değil).
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  meta           JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::jsonb);
  source_name    TEXT;
  base_username  TEXT;
  final_username TEXT;
  counter        INTEGER := 0;
BEGIN
  source_name := COALESCE(
    NULLIF(meta->>'username', ''),
    NULLIF(meta->>'user_name', ''),
    NULLIF(meta->>'preferred_username', ''),
    NULLIF(SPLIT_PART(COALESCE(NEW.email, ''), '@', 1), ''),
    NULLIF(meta->>'name', ''),
    'user'
  );

  base_username := LOWER(REGEXP_REPLACE(source_name, '[^a-zA-Z0-9_]', '', 'g'));
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user' || base_username;
  END IF;
  base_username := LEFT(base_username, 24);
  final_username := base_username;

  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.users (id, email, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    COALESCE(
      NULLIF(meta->>'full_name', ''),
      NULLIF(meta->>'name', ''),
      final_username
    ),
    COALESCE(meta->>'avatar_url', meta->>'picture')
  );

  RETURN NEW;
END;
$$;

-- 017 ile aynı hardening: trigger fonksiyonu doğrudan çağrılamasın
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
