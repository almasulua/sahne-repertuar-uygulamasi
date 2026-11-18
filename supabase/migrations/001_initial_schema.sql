-- ============================================================
-- Müzik App – İlk Şema Migrasyonu
-- ============================================================

-- ----------------------------------------------------------------
-- 1. UZANTILAR
-- ----------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------
-- 2. TABLOLAR
-- ----------------------------------------------------------------

-- 2a. Kullanıcılar (auth.users ile 1:1)
CREATE TABLE public.users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  instruments   TEXT[]  DEFAULT '{}',
  genres        TEXT[]  DEFAULT '{}',
  level         TEXT    CHECK (level IN ('beginner','intermediate','advanced','professional')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2b. Gruplar
CREATE TABLE public.groups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  avatar_url    TEXT,
  genre         TEXT,
  owner_id      UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invite_token  TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2c. Grup Üyeleri
CREATE TABLE public.group_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','admin','member')),
  joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- 2d. Şarkılar (paylaşımlı katalog)
CREATE TABLE public.songs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  artist      TEXT,
  genre       TEXT[] DEFAULT '{}',
  key         TEXT,
  bpm         INTEGER CHECK (bpm > 0 AND bpm < 500),
  duration    INTEGER, -- saniye
  difficulty  TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  lyrics      TEXT,    -- ChordPro formatında
  chords      TEXT[],  -- kullanılan akorlar
  source_url  TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived','draft')),
  created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2e. Kişisel Şarkı Koleksiyonu
CREATE TABLE public.personal_songs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  song_id         UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  notes           TEXT,
  tags            TEXT[] DEFAULT '{}',
  status          TEXT DEFAULT 'learning' CHECK (status IN ('learning','ready','archived')),
  is_favorite     BOOLEAN NOT NULL DEFAULT FALSE,
  last_played_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, song_id)
);

-- 2f. Şarkı Ekleri
CREATE TABLE public.song_attachments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id     UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type        TEXT NOT NULL CHECK (type IN ('pdf','audio','image')),
  url         TEXT NOT NULL,
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2g. Grup Repertuarı
CREATE TABLE public.group_songs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id         UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  song_id          UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  status           TEXT DEFAULT 'learning' CHECK (status IN ('learning','ready','setlist','archived')),
  notes            TEXT,
  part_assignments JSONB DEFAULT '{}',
  added_by         UUID REFERENCES public.users(id) ON DELETE SET NULL,
  approved         BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, song_id)
);

-- 2h. Mesajlar (Grup Sohbeti)
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  content     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text','song_card','image','system')),
  reply_to_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------
-- 3. İNDEKSLER
-- ----------------------------------------------------------------
CREATE INDEX idx_songs_title ON public.songs(title);
CREATE INDEX idx_songs_artist ON public.songs(artist);
CREATE INDEX idx_songs_created_by ON public.songs(created_by);
CREATE INDEX idx_personal_songs_user_id ON public.personal_songs(user_id);
CREATE INDEX idx_personal_songs_song_id ON public.personal_songs(song_id);
CREATE INDEX idx_personal_songs_is_favorite ON public.personal_songs(user_id, is_favorite);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_songs_group_id ON public.group_songs(group_id);
CREATE INDEX idx_messages_group_id ON public.messages(group_id);
CREATE INDEX idx_messages_created_at ON public.messages(group_id, created_at DESC);

-- ----------------------------------------------------------------
-- 4. YARDIMCI FONKSİYONLAR
-- ----------------------------------------------------------------

-- Kullanıcının gruba üye olup olmadığını kontrol eder
CREATE OR REPLACE FUNCTION public.is_group_member(gid UUID, uid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = gid AND user_id = uid
  );
$$;

-- Kullanıcının gruptaki rolünü döndürür (üye değilse NULL)
CREATE OR REPLACE FUNCTION public.get_group_role(gid UUID, uid UUID)
RETURNS TEXT
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.group_members
  WHERE group_id = gid AND user_id = uid
  LIMIT 1;
$$;

-- ----------------------------------------------------------------
-- 5. TETİKLEYİCİLER
-- ----------------------------------------------------------------

-- Yeni auth kullanıcısı oluşturulduğunda public.users kaydı açar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- email'den kullanıcı adı üret (özel karakterleri temizle)
  base_username := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9_]', '', 'g'));
  IF LENGTH(base_username) < 3 THEN
    base_username := 'user' || base_username;
  END IF;
  final_username := base_username;

  -- Benzersiz kullanıcı adı bul
  WHILE EXISTS (SELECT 1 FROM public.users WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := base_username || counter::TEXT;
  END LOOP;

  INSERT INTO public.users (id, email, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', final_username),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- updated_at otomatik güncelleme
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER personal_songs_updated_at
  BEFORE UPDATE ON public.personal_songs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ----------------------------------------------------------------
-- 6. SATIR DÜZEYİ GÜVENLİK (RLS)
-- ----------------------------------------------------------------

-- Tüm tablolarda RLS'i etkinleştir
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.song_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- USERS: Kendi kaydını oku/güncelle; diğerleri yalnızca temel profili görebilir
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_select_others" ON public.users
  FOR SELECT USING (TRUE); -- profiller herkese görünür (username/display_name)

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- GROUPS: Üyeler görür; herkes yeni grup oluşturabilir; sahip günceller/siler
CREATE POLICY "groups_select_member" ON public.groups
  FOR SELECT USING (public.is_group_member(id, auth.uid()));

CREATE POLICY "groups_insert_authenticated" ON public.groups
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "groups_update_owner" ON public.groups
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "groups_delete_owner" ON public.groups
  FOR DELETE USING (auth.uid() = owner_id);

-- GROUP_MEMBERS: Grup üyeleri görür; sahip/admin ekleyip çıkarır
CREATE POLICY "group_members_select_member" ON public.group_members
  FOR SELECT USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "group_members_insert_admin" ON public.group_members
  FOR INSERT WITH CHECK (
    public.get_group_role(group_id, auth.uid()) IN ('owner', 'admin')
    OR auth.uid() = user_id -- kendini ekleyebilir (davet linki)
  );

CREATE POLICY "group_members_delete_admin" ON public.group_members
  FOR DELETE USING (
    public.get_group_role(group_id, auth.uid()) IN ('owner', 'admin')
    OR auth.uid() = user_id -- kendisi ayrılabilir
  );

CREATE POLICY "group_members_update_admin" ON public.group_members
  FOR UPDATE USING (
    public.get_group_role(group_id, auth.uid()) IN ('owner', 'admin')
  );

-- SONGS: Herkes görebilir; oluşturan günceller/siler
CREATE POLICY "songs_select_all" ON public.songs
  FOR SELECT USING (TRUE);

CREATE POLICY "songs_insert_authenticated" ON public.songs
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "songs_update_creator" ON public.songs
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "songs_delete_creator" ON public.songs
  FOR DELETE USING (auth.uid() = created_by);

-- PERSONAL_SONGS: Yalnızca kendi koleksiyonu
CREATE POLICY "personal_songs_own" ON public.personal_songs
  FOR ALL USING (auth.uid() = user_id);

-- SONG_ATTACHMENTS: Şarkıya erişimi olan herkes görebilir; oluşturan yönetir
CREATE POLICY "song_attachments_select_all" ON public.song_attachments
  FOR SELECT USING (TRUE);

CREATE POLICY "song_attachments_insert_authenticated" ON public.song_attachments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "song_attachments_delete_creator" ON public.song_attachments
  FOR DELETE USING (auth.uid() = user_id);

-- GROUP_SONGS: Grup üyeleri görür; admin/owner yönetir
CREATE POLICY "group_songs_select_member" ON public.group_songs
  FOR SELECT USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "group_songs_insert_member" ON public.group_songs
  FOR INSERT WITH CHECK (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "group_songs_update_admin" ON public.group_songs
  FOR UPDATE USING (
    public.get_group_role(group_id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY "group_songs_delete_admin" ON public.group_songs
  FOR DELETE USING (
    public.get_group_role(group_id, auth.uid()) IN ('owner', 'admin')
  );

-- MESSAGES: Grup üyeleri görür ve gönderir; kendi mesajını günceller/siler
CREATE POLICY "messages_select_member" ON public.messages
  FOR SELECT USING (public.is_group_member(group_id, auth.uid()));

CREATE POLICY "messages_insert_member" ON public.messages
  FOR INSERT WITH CHECK (
    public.is_group_member(group_id, auth.uid())
    AND auth.uid() = sender_id
  );

CREATE POLICY "messages_update_sender" ON public.messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "messages_delete_sender" ON public.messages
  FOR DELETE USING (
    auth.uid() = sender_id
    OR public.get_group_role(group_id, auth.uid()) IN ('owner', 'admin')
  );

-- ----------------------------------------------------------------
-- 7. REALTIME YAYINLARI
-- ----------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
