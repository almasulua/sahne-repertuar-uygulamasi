-- =============================================
-- 011: Setlist item başına üye part/enstrüman ataması
-- =============================================

-- setlist_items'a part_assignments alanı ekle
-- Format: { "<user_id>": "Gitar", "<user_id_2>": "Vokal", ... }
ALTER TABLE public.setlist_items
  ADD COLUMN IF NOT EXISTS part_assignments JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Hızlı sorgu için (kim hangi setlist item'da görevli)
CREATE INDEX IF NOT EXISTS idx_setlist_items_parts
  ON public.setlist_items USING GIN (part_assignments);

COMMENT ON COLUMN public.setlist_items.part_assignments IS
  'JSON map: user_id → part adı (örn. "Gitar", "Davul", "Vokal"). RLS koruması parent setlist üzerinden uygulanır.';
