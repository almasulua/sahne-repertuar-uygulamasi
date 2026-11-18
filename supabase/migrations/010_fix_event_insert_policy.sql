-- =============================================
-- 010: Event INSERT policy - tüm üyelere aç
-- =============================================
-- Eski policy: sadece admin/owner etkinlik oluşturabilir
-- Yeni policy: tüm grup üyeleri etkinlik oluşturabilir

DROP POLICY IF EXISTS "Admin/owner event oluşturur" ON public.events;

CREATE POLICY "Grup üyeleri event oluşturur"
  ON public.events FOR INSERT
  WITH CHECK (is_group_member(group_id, auth.uid()));
