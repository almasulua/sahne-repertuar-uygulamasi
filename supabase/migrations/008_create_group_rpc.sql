-- =============================================
-- 008: Grup oluşturma RPC fonksiyonu
-- =============================================
-- Sorun: INSERT policy auth.uid() = owner_id kontrolü yapıyor ama
-- Supabase JS client bazen JWT'yi düzgün gönderemiyor veya
-- auth.uid() NULL dönüyor. Ayrıca multi-step işlem (grup oluştur + üye ekle)
-- race condition yaratıyor.
-- Çözüm: SECURITY DEFINER RPC fonksiyonu ile atomik grup oluşturma.

CREATE OR REPLACE FUNCTION public.create_group_with_owner(
  p_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_genre TEXT DEFAULT NULL,
  p_owner_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id UUID;
  v_group_id UUID;
  v_invite_token TEXT;
  v_result JSONB;
BEGIN
  -- Owner ID: parametre verilmişse onu kullan, yoksa auth.uid()
  v_owner_id := COALESCE(p_owner_id, auth.uid());

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Oturum bulunamadı (auth.uid() is NULL)';
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

-- RPC'ye authenticated kullanıcılar erişebilir
GRANT EXECUTE ON FUNCTION public.create_group_with_owner(TEXT, TEXT, TEXT, UUID) TO authenticated;
