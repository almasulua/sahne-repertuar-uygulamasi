-- =============================================
-- 006: Grup oluşturma RLS düzeltmesi
-- =============================================
-- Sorun: groups SELECT policy sadece is_group_member() kontrolü yapıyor.
-- Grup INSERT sonrası .select() çağrıldığında henüz group_members'da
-- kayıt olmadığı için SELECT başarısız oluyor.
-- Çözüm: owner_id eşleşmesini de SELECT policy'ye ekle.

-- Mevcut policy'yi kaldır
DROP POLICY IF EXISTS "groups_select_member" ON public.groups;

-- Yeni policy: üyeler VEYA sahip görebilir
CREATE POLICY "groups_select_member_or_owner" ON public.groups
  FOR SELECT USING (
    auth.uid() = owner_id
    OR public.is_group_member(id, auth.uid())
  );
