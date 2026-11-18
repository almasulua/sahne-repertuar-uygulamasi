-- =============================================
-- 014: Push Notification Altyapısı
-- =============================================
-- Server tarafı: mute listesi sunucuda da tutulur (push edge function bunu okur),
-- ve notifications tablosuna INSERT olduğunda otomatik Expo Push gönderimi için
-- pg_net üzerinden edge function çağrısı.
--
-- Edge function: send-notification (supabase/functions/send-notification/index.ts)
--
-- Notlar:
--   * pg_net Supabase'te varsayılan yüklü — tek satırlık `CREATE EXTENSION` yeterli.
--   * Edge function URL'i `EDGE_FUNCTION_BASE_URL` ayarı üzerinden okunur. Eğer ayar
--     boşsa trigger sessizce noop olur (lokal dev'de hata vermez).
--   * Trigger sadece `notifications` tablosuna direkt INSERT yapanları yakalar.
--     Edge function'ın kendisi de `persist: true` ile notifications'a yazar, bu da
--     trigger'ı tetikler → fakat edge function payload'a `_skip_push: true` damgası
--     koyarak döngüyü kırar.

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ----------------------------------------
-- users.muted_group_ids
-- ----------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS muted_group_ids UUID[] NOT NULL DEFAULT ARRAY[]::UUID[];

CREATE INDEX IF NOT EXISTS idx_users_muted_group_ids
  ON public.users USING GIN (muted_group_ids);

-- ----------------------------------------
-- Ayar tablosu (edge function URL + service key)
-- ----------------------------------------
-- Bu değerleri Supabase dashboard üzerinden bir kerelik set etmek için:
--   ALTER DATABASE postgres SET app.edge_function_url = 'https://<ref>.functions.supabase.co/send-notification';
--   ALTER DATABASE postgres SET app.service_role_key = '<service_role_jwt>';
-- (Veya bu migration'ı çalıştırmadan önce UI üzerinden Database Settings → Custom Postgres Config)

-- ----------------------------------------
-- Trigger fonksiyonu
-- ----------------------------------------
CREATE OR REPLACE FUNCTION public.dispatch_push_on_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
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

DROP TRIGGER IF EXISTS trg_dispatch_push_on_notification ON public.notifications;
CREATE TRIGGER trg_dispatch_push_on_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.dispatch_push_on_notification();
