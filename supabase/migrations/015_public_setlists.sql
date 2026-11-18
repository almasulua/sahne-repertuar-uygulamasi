-- =============================================
-- 015: Public (Herkese Açık) Setlist Paylaşımı
-- =============================================
-- Setlist sahibi/admin'i bir setlist'i "public" işaretleyebilir → linkle herkes
-- (giriş yapmamış kullanıcılar dahil) read-only görür.
--
-- Güvenlik:
--   * is_public toggle'ı SADECE setlist'in mevcut UPDATE policy'lerine tabi
--     (creator veya admin/owner). Yeni policy gerekmiyor.
--   * Anonim okuma için RLS SELECT policy'sine yeni bir OR koşulu eklenir:
--       OR (is_public = true)
--     Bu sayede authenticated grup üyesi olmayanlar bile is_public=true setlist'i okuyabilir.
--   * setlist_items için de aynı pattern.
--   * Joined `songs` ve `users` (created_by) için public okuma — yeni policy eklenir.

-- ----------------------------------------
-- Şema
-- ----------------------------------------
ALTER TABLE public.setlists
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS public_slug TEXT UNIQUE;

-- public_slug otomatik üretici (8 karakterlik base32 random)
CREATE OR REPLACE FUNCTION public.gen_public_slug()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT lower(substring(replace(encode(gen_random_bytes(8), 'base64'), '/', '_'), 1, 10));
$$;

-- is_public=true yapıldığında public_slug otomatik atansın (boşsa)
CREATE OR REPLACE FUNCTION public.ensure_public_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public = true AND (NEW.public_slug IS NULL OR NEW.public_slug = '') THEN
    -- Çakışma olursa yeniden üret (UNIQUE constraint'i koruma)
    LOOP
      NEW.public_slug := public.gen_public_slug();
      EXIT WHEN NOT EXISTS (
        SELECT 1 FROM public.setlists WHERE public_slug = NEW.public_slug AND id != NEW.id
      );
    END LOOP;
  ELSIF NEW.is_public = false THEN
    NEW.public_slug := NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS setlists_ensure_public_slug ON public.setlists;
CREATE TRIGGER setlists_ensure_public_slug
  BEFORE INSERT OR UPDATE OF is_public ON public.setlists
  FOR EACH ROW EXECUTE FUNCTION public.ensure_public_slug();

CREATE INDEX IF NOT EXISTS idx_setlists_public_slug
  ON public.setlists(public_slug) WHERE is_public = true;


-- ----------------------------------------
-- RLS: anonim/herkese açık okuma
-- ----------------------------------------

-- setlists: public okuma policy'si (üye policy'sine ek)
DROP POLICY IF EXISTS "Public setlist herkes okur" ON public.setlists;
CREATE POLICY "Public setlist herkes okur"
  ON public.setlists FOR SELECT
  TO anon, authenticated
  USING (is_public = true);

-- setlist_items: parent setlist public ise herkes okur
DROP POLICY IF EXISTS "Public setlist item herkes okur" ON public.setlist_items;
CREATE POLICY "Public setlist item herkes okur"
  ON public.setlist_items FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists s
      WHERE s.id = setlist_id AND s.is_public = true
    )
  );

-- songs: public setlist'te referans edilen şarkıyı herkes okur
-- (yeni policy — songs zaten authenticated için open ama anon yok)
DROP POLICY IF EXISTS "Public setlist şarkıları herkes okur" ON public.songs;
CREATE POLICY "Public setlist şarkıları herkes okur"
  ON public.songs FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.setlist_items si
      JOIN public.setlists s ON s.id = si.setlist_id
      WHERE si.song_id = songs.id AND s.is_public = true
    )
  );

-- groups: public setlist'in grubunun adı/avatarı herkes okur (header için)
DROP POLICY IF EXISTS "Public setlist grubu herkes okur" ON public.groups;
CREATE POLICY "Public setlist grubu herkes okur"
  ON public.groups FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.setlists s
      WHERE s.group_id = groups.id AND s.is_public = true
    )
  );
