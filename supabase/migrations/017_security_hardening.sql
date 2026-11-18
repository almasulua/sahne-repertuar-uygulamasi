-- =============================================
-- 017: Güvenlik Sertleştirme
-- =============================================
-- Bu migration dört güvenlik bulgusunu kapatır:
--   K2: public.users.email kolonu tüm authenticated kullanıcılara açıktı (PII/KVKK sızıntısı).
--   K3: 3 SECURITY DEFINER fonksiyonunda SET search_path eksikti (privilege-escalation vektörü).
--   K4: create_group_with_owner başkası adına grup oluşturmaya izin veriyordu (p_owner_id spoofing).
--   K5: find_musician_matches başka kullanıcının eşleşme listesini sorgulamaya izin veriyordu.
--
-- NOT: Mevcut migration'lar (001/008/014/016) zaten uygulandığı için onları düzenlemek
-- yerine burada CREATE OR REPLACE / REVOKE ile düzeltiyoruz (idempotent, ileri-yönlü).

-- ----------------------------------------------------------------
-- K2: users tablosunda kolon-düzeyi erişim kontrolü
-- ----------------------------------------------------------------
-- RLS satır düzeyindedir, KOLON gizleyemez ("users_select_others USING (TRUE)"
-- her authenticated/anon kullanıcının tüm satırları okumasına izin verir).
--
-- ÖNEMLİ: Tek başına `REVOKE SELECT (email)` ETKİSİZDİR. Çünkü Supabase varsayılan
-- olarak public şemadaki tablolara tablo-düzeyi GRANT verir (anon + authenticated →
-- GRANT ALL). Tablo-düzeyi "SELECT" izni tüm kolonları kapsar ve kolon-düzeyi
-- REVOKE'u maskeler. Bu yüzden önce tablo-düzeyi SELECT'i tamamen geri alıp,
-- ardından YALNIZCA güvenli (public profil) kolonlarına SELECT veriyoruz.
--
-- Bu yaklaşım ileri-yönlü güvenlidir: GRANT listesinde olmayan her kolon —
-- email, push_token, notification_preferences, muted_group_ids ve gelecekte
-- eklenecek HER yeni kolon — otomatik olarak private kalır.
--
-- service_role ve postgres dokunulmaz; edge function (service_role) tüm kolonları
-- okumaya devam eder. Kendi e-postası public.users'tan değil auth session'dan gelir.
REVOKE SELECT ON public.users FROM anon, authenticated;

GRANT SELECT (
  id, username, display_name, avatar_url, instruments, genres, level, created_at, updated_at
) ON public.users TO anon, authenticated;

-- ----------------------------------------------------------------
-- K3: SECURITY DEFINER fonksiyonlarına SET search_path ekle
-- ----------------------------------------------------------------

-- is_group_member: gruba üyelik kontrolü (RLS politikaları buna bağlı)
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = uid
  );
$$;

-- get_group_role: gruptaki rolü döndürür
CREATE OR REPLACE FUNCTION public.get_group_role(gid UUID, uid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT role FROM public.group_members
  WHERE group_id = gid AND user_id = uid
  LIMIT 1;
$$;

-- dispatch_push_on_notification: notifications INSERT'inde edge function'ı tetikler
CREATE OR REPLACE FUNCTION public.dispatch_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_url TEXT;
  v_key TEXT;
  v_payload JSONB;
BEGIN
  -- _skip_push damgası varsa atla (edge function kendi yazdığı satırı yakalamasın)
  IF (NEW.data ? '_skip_push') AND (NEW.data->>'_skip_push')::BOOLEAN = true THEN
    RETURN NEW;
  END IF;

  -- Ayarlardan URL/key çek (yoksa sessizce çık)
  BEGIN
    v_url := current_setting('app.edge_function_url', true);
    v_key := current_setting('app.service_role_key',  true);
  EXCEPTION WHEN OTHERS THEN
    RETURN NEW;
  END;

  IF v_url IS NULL OR v_url = '' OR v_key IS NULL OR v_key = '' THEN
    RETURN NEW;
  END IF;

  -- _skip_push damgalı payload (edge function'ın bu trigger'ı tekrar tetiklememesi için)
  v_payload := jsonb_build_object(
    'user_ids', jsonb_build_array(NEW.user_id),
    'title',    NEW.title,
    'body',     NEW.body,
    'data',     COALESCE(NEW.data, '{}'::jsonb) || jsonb_build_object('_skip_push', true),
    'persist',  false
  );

  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body    := v_payload
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- pg_net çağrısı patlarsa INSERT'in başarısız olmasın
  RAISE WARNING 'dispatch_push_on_notification başarısız: %', SQLERRM;
  RETURN NEW;
END;
$$;
-- Trigger fonksiyon adına bağlıdır; CREATE OR REPLACE ile yeniden oluşturmaya gerek yok.

-- ----------------------------------------------------------------
-- K4: create_group_with_owner — başkası adına grup oluşturmayı engelle
-- ----------------------------------------------------------------
-- Owner artık DAİMA auth.uid()'dir. p_owner_id parametresi geriye uyumluluk için
-- korunur ama yalnızca doğrulama amacıyla kullanılır: verilmişse auth.uid() ile
-- eşleşmek ZORUNDADIR. Eşleşmezse hata. Böylece SECURITY DEFINER üzerinden
-- başka kullanıcı adına grup açma kapatılır.
CREATE OR REPLACE FUNCTION public.create_group_with_owner(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_genre TEXT DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner_id UUID;
  v_group_id UUID;
  v_invite_token TEXT;
  v_result JSONB;
BEGIN
  -- Owner DAİMA oturum sahibidir (spoofing engeli)
  v_owner_id := auth.uid();

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Oturum bulunamadı (auth.uid() is NULL)';
  END IF;

  -- p_owner_id verilmişse kendi kimliğiyle eşleşmek zorunda
  IF p_owner_id IS NOT NULL AND p_owner_id <> v_owner_id THEN
    RAISE EXCEPTION 'Yetkisiz: başka kullanıcı adına grup oluşturulamaz';
  END IF;

  -- Kullanıcının var olduğunu kontrol et
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_owner_id) THEN
    RAISE EXCEPTION 'Kullanıcı bulunamadı: %', v_owner_id;
  END IF;

  -- Grubu oluştur
  INSERT INTO public.groups (name, description, genre, owner_id)
  VALUES (p_name, p_description, p_genre, v_owner_id)
  RETURNING id, invite_token INTO v_group_id, v_invite_token;

  -- Sahibi owner olarak ekle
  INSERT INTO public.group_members (group_id, user_id, role)
  VALUES (v_group_id, v_owner_id, 'owner');

  -- Sonucu döndür
  SELECT jsonb_build_object(
    'id', g.id,
    'name', g.name,
    'description', g.description,
    'avatar_url', g.avatar_url,
    'genre', g.genre,
    'owner_id', g.owner_id,
    'invite_token', g.invite_token,
    'created_at', g.created_at
  ) INTO v_result
  FROM public.groups g
  WHERE g.id = v_group_id;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_group_with_owner(TEXT, TEXT, TEXT, UUID) TO authenticated;

-- ----------------------------------------------------------------
-- K5: find_musician_matches — yalnızca kendi eşleşmeleri sorgulanabilir
-- ----------------------------------------------------------------
-- p_user_id artık auth.uid() ile eşleşmek zorunda; aksi halde başkasının profil/eşleşme
-- listesi enumerate edilebiliyordu.
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
SET search_path = public, pg_temp
AS $$
DECLARE
  v_me_instruments TEXT[];
  v_me_genres TEXT[];
  v_me_level TEXT;
BEGIN
  -- Yetki: yalnızca kendi eşleşmelerini sorgulayabilir
  IF auth.uid() IS NULL OR p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Yetkisiz: yalnızca kendi eşleşmelerinizi sorgulayabilirsiniz';
  END IF;

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
