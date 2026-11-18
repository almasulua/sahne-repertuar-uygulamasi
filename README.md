# Müzik App

Müzik repertuar yönetimi ve grup işbirliği uygulaması.
React Native + Expo + Supabase.

---

## Mevcut Durum

### Faz 1 (MVP) — Tamamlandı
- [x] Auth (email/password, profil yönetimi)
- [x] Kişisel repertuar CRUD (şarkı ekleme, düzenleme, silme)
- [x] ChordPro parsing, rendering, transpozisyon
- [x] Grup sistemi (oluşturma, davet, üye yönetimi)
- [x] Grup sohbeti (realtime mesajlaşma)
- [x] Otomatik kaydırma (auto-scroll)
- [x] Offline destek (TanStack Query persistence)
- [x] i18n (Türkçe/İngilizce)

### Faz 2A — Tamamlandı (kod yazıldı, migration gerekli)
- [x] **Setlist + Sahne Modu** — Setlist CRUD, drag-to-reorder, sahne modu (tam ekran, swipe), PDF export
- [x] **Piyano Akor Diyagramları** — SVG piyano/gitar diyagramları, akor tıklama ile modal

### Faz 2B — Tamamlandı (kod yazıldı, migration gerekli)
- [x] **Oylama/Poll Sistemi** — Anket oluşturma, oy verme, chat entegrasyonu
- [x] **Takvim/Etkinlik Planlama** — Etkinlik CRUD, RSVP, takvim görünümü, datetime picker

### Faz 2C — Tamamlandı (kod yazıldı, migration gerekli)
- [x] **Push Notifications** — expo-notifications (dev build gerekli, Expo Go'da devre dışı)

### Faz 2D — Tamamlandı (kod yazıldı)
- [x] **Web Tarayıcı + Akor Çekme** — In-app browser, akor algılama, repertuara kaydetme

### Faz 2 Ek — Tamamlandı
- [x] **Dinamik Kategori Yönetimi** — Kullanıcı kendi kategorilerini ekleyebilir/düzenleyebilir
- [x] **Şarkı Kategori Değiştirme** — Şarkı detayında kategoriyi tek tıkla değiştirme
- [x] **Grup Oluşturma RLS Fix** — SECURITY DEFINER RPC ile atomik grup oluşturma
- [x] **Setlist'e Şarkı Ekleme Bug Fix** — Bozuk inline akış kaldırıldı, ayrı `add-song` ekranına yönlendirildi
- [x] **Pull-to-Refresh** — Repertuar, gruplar, setlistler, anketler, etkinlikler

### Faz 3A — UI / Kullanıcı Deneyimi (Tamamlandı)
- [x] **Onboarding wizard** — 4 slaytlı yatay swipe, "Atla/Devam/Başla", profil'den tekrar oynat
- [x] **Tema altyapısı** — `theme: system | light | dark` state'i + uiStore persist (renk paletinin canlı değişmesi RN üzerinde stabil çalışmadığından şimdilik sabit dark; toggle ileride aktif edilecek)
- [x] **Haptic feedback** — Buton tıklamalarında `expo-haptics`

### Faz 3B — Şarkı / Repertuar Geliştirmeleri (Tamamlandı)
- [x] **Capo desteği** — 0–11 perde, gösterilen akorlar `transposeSteps − capo` ile kayar; "F3 → G" göstergesi
- [x] **ChordPro içe/dışa aktarma** — Şarkı detayında "Dışa Aktar" (clipboard); Add ekranında "İçe Aktar" modalı (panodan otomatik dolum)
- [x] **Akor kütüphanesi sayfası** — 49 gitar akoru, arama + tip filtresi (Major/Minor/7/m7/maj7/sus/dim), tıklayınca diyagram modal
- [x] **Metronom** — `expo-haptics` + `Vibration` tabanlı (paket gerekmez), 4'lük beat indikatörü, 40–240 BPM
- [x] **Ses kaydı** — `expo-audio` ile kayıt/oynat/sil, MMKV'de saklanır (dev build gerekli)
- [x] **Şarkı geçmişi/istatistikler** — Yerel MMKV; toplam çalma, en çok / son çalınan, profil'den `/stats` sayfasına bağlı

### Faz 3 Ek — Altyapı (Tamamlandı)
- [x] **Expo SDK 55 paket hizalaması** — `npx expo install --fix` ile tüm `expo-*` versiyonları stabil
- [x] **babel.config.js düzeltmesi** — Eski `expo/node_modules/babel-preset-expo` yolu yerine doğrudan `babel-preset-expo`
- [x] **Expo Go uyumluluğu** — `expo-audio`, `react-native-mmkv`, `expo-notifications` Expo Go'da `Constants.appOwnership` kontrolüyle güvenli `require`
- [x] **safeBack() helper** — Stack boşken `router.back()` uyarısı engellenir, fallback rotaya yönlendirir
- [x] **i18n çevirileri** — `onboarding`, `metronome`, `recordings`, `stats`, `chordLibrary`, `stage` bölümleri tam TR/EN

### Faz 4.1 — UI/UX (Kısmen Tamamlandı)
- [x] **Tema toggle (canlı, tüm uygulama)** — NativeWind v4 `dark:` variant bridge'i: [tailwind.config.js](tailwind.config.js)'e `darkMode: 'class'` + 10 light token (mevcut dark token'lara dokunulmadı, sıfır kırılma). [ThemeSync.tsx](src/components/ThemeSync.tsx) `setColorScheme(theme)` çağırıyor; profile ekranındaki tema toggle UI (system/light/dark) tüm uygulamayı canlı değiştiriyor. **Tüm ekranlar ve bileşenler migrate edildi** (`bg-light-* dark:bg-*` + `text-light-* dark:text-*` deseni): auth akışı, 3 ana tab, profil bölgesi (matches/pedal/users/user/stats), şarkı detay + yorum/puanlama, public setlist, **tüm grup detay alanı** (özet/ayarlar/sohbet/üyeler/aktivite/setlist liste+detay/poll/event liste+detay+oluşturma), repertuar add/edit/detay, group repertoire add/from-personal, chord-library, browser, onboarding, invite, tüm paylaşılan bileşenler (Card/Button/Input/Badge/Skeleton/EmptyState/LoadingSpinner/Header/Avatar + tüm kart ve modal bileşenleri). **Tab bar** `useColorScheme` ile koşullu renkli (inline style olduğu için). `placeholderTextColor` değerleri açık temada okunabilir griye (#9E9E9E) çekildi. **İstisna (kasıtlı):** Sahne Modu ([StageView](src/components/setlist/StageView.tsx), StageSongView, NextSongPreview) sabit `#0a0a0a` koyu zeminde kalır — performans/sahne kullanımı için tema-bağımsız tasarlandı. Bulk migration için negatif-lookbehind güvenli tek-geçiş Python migrator kullanıldı
- [x] **Skeleton loader'lar** — `Skeleton`, `SkeletonList`, `SongRowSkeleton`, `GroupCardSkeleton`, `ActivityRowSkeleton` bileşenleri (`react-native-reanimated` shimmer); repertuar, gruplar, grup aktivite ve kullanıcı arama ekranlarında entegre
- [x] **Animated transitions** — Stack varsayılan `slide_from_right` (220ms); `(auth)` ve `invite/[token]` fade; `(tabs)` none; `song/[songId]` modal/`slide_from_bottom`

### Faz 4.8 — Sosyal Giriş (Kod tamamlandı, Supabase ayarı gerekli)
- [x] **Google / Apple ile giriş** — [authApi.signInWithOAuth](src/api/auth.ts): Supabase OAuth + PKCE (`flowType: 'pkce'`), `expo-web-browser` `openAuthSessionAsync` ile sistem tarayıcısında giriş, dönüşte `?code=` → `exchangeCodeForSession`. Vazgeçilirse sessizce `null`. [SocialAuthButtons](src/components/auth/SocialAuthButtons.tsx) Welcome / Giriş / Kayıt ekranlarında; Apple butonu yalnızca iOS'ta. [app/auth/callback.tsx](app/auth/callback.tsx) deep link'in router'a düştüğü Android cihazlarda ana akışa döndürür. Kurulum adımları: aşağıda "Google / Apple Girişi Kurulumu"

### Faz 4.6 — Teknik Altyapı (Kısmen Tamamlandı)
- [x] **Unit test kapsamı genişletildi** — `chordLookup.test.ts` (50 test: parseChordForPiano kalite mapping, getPianoKeys, lookupChord, isKnownChord, INTERVALS/ROOT_NAMES veri bütünlüğü), `chordDetector.test.ts` (18 test: isChordLine, detectChords benzersizleştirme, classifyLines), `htmlToChordPro.test.ts` (18 test: stripHtml entity/tag/case-insensitive, convertToChordPro birleştirme/pozisyon koruma); **toplam 181 test geçiyor** (95'ten 181'e)
- [x] **Error Boundary + global JS error handler** — [ErrorBoundary.tsx](src/components/ErrorBoundary.tsx) sınıf bileşeni: render hatasını yakalar, Sentry'ye `componentStack` ile bildirir, friendly "Yeniden Dene" ekranı (dev'de stack preview, production'da minimal mesaj); root layout `<ErrorBoundary>` ile sarıldı. [errorHandler.ts](src/lib/errorHandler.ts) `installGlobalErrorHandler` — `ErrorUtils.setGlobalHandler` ile RN JS engine global hatalarını + `addEventListener('unhandledrejection', …)` ile yakalanmamış promise reject'lerini Sentry'ye iletir; orijinal handler'ı koruyarak dev RedBox bozulmaz
- [x] **Sentry hazır altyapı** — `@sentry/react-native` paketi + [sentry.ts](src/lib/sentry.ts) wrapper; `EXPO_PUBLIC_SENTRY_DSN` env'i set ise init olur, yoksa noop; Expo Go'da `Constants.appOwnership` guard'lı; auth state değişiminde `setSentryUser` otomatik; manual `captureException` API'si
- [x] **EAS Build profilleri** — `base` extends pattern; `development` (APK + iOS simulator), `preview` (internal APK), `production` (Android App Bundle + autoIncrement); channels ile `eas update` hazır; `submit` Play Store internal track ön ayarlı
- [x] **Deep linking (custom scheme)** — `muzikapp://invite/<token>` zaten çalışıyor; [invite/[token].tsx](app/invite/[token].tsx) ekranı `useJoinGroup` ile otomatik katılım; QR davet modalı bu URL'i üretir

### Faz 4.5 — Sosyal (Kısmen Tamamlandı)
- [x] **Kullanıcı arama** — `/users` sayfası: 300ms debounce'lı arama, en az 2 karakter; username/display_name'e ILIKE; skeleton loader; profile ekranından erişim
- [x] **Public profil görüntüleme** — `/user/[userId]` sayfası: avatar, isim, @username, seviye, enstrümanlar, türler, üyelik tarihi; grup üyeleri listesinden tıklayınca açılır; `usePublicUser` + `authApi.getPublicProfile`/`searchUsers`
- [x] **Müzisyen eşleştirme** — Migration 016: `find_musician_matches(user_id, limit)` `SECURITY DEFINER` RPC; ortak enstrüman (×25, cap 50) + ortak tür (×15, cap 30) + level uyumu (aynı=20, ±1=10) skorlanır, 100 ile cap'lenir; en az 1 ortak enstrüman zorunlu (random spam koruması). [authApi.findMusicianMatches](src/api/auth.ts) + [useMusicianMatches](src/hooks/useProfile.ts) (1dk staleTime). `/matches` ekranı: skor badge'i (yeşil ≥70 / sarı ≥40 / gri), avatar + ortak enstrüman/tür chip'leri, pull-to-refresh, EmptyState (enstrüman/tür eksikse rehberlik). Profil ekranından "Müzisyen Önerileri" linki
- [x] **Public setlist paylaşımı** — Migration 015: `setlists.is_public BOOLEAN` + `setlists.public_slug TEXT UNIQUE` (10 karakterlik base32 random, `is_public=true` olunca trigger ile otomatik atanır; `false`'a çekilince null'lanır). RLS: anon ve authenticated rolüne `is_public=true` setlist'ler için SELECT açıldı; setlist_items, songs ve groups için EXISTS join'li public okuma policy'leri. [setlists.ts](src/api/setlists.ts) `togglePublic` + `getByPublicSlug`. [useSetlists.ts](src/hooks/useSetlists.ts) `useToggleSetlistPublic` + `usePublicSetlist`. Setlist detayında toggle + `muzikapp://public/setlist/<slug>` URL + kopyala/paylaş aksiyonu. Read-only public route [app/public/setlist/[slug].tsx](app/public/setlist/[slug].tsx) — auth gerektirmez, FlatList virtualization'lı liste, EmptyState 404 koruması
- [x] **Şarkı yorumları + puanlama** — Migration 013: `song_comments` (CHECK 1-2000 char, updated_at trigger, RLS owner-only) + `song_ratings` (UNIQUE(song_id,user_id), CHECK 1-5) + `song_rating_summary` view. [songFeedback.ts](src/api/songFeedback.ts) API + [useSongFeedback.ts](src/hooks/useSongFeedback.ts) hooks (TanStack: useSongComments, useAddSongComment, useDeleteSongComment optimistic, useMyRating, useRatingSummary, useSetRating, useClearRating). [RatingStars.tsx](src/components/song/RatingStars.tsx) interaktif yıldız (haptik, aynı yıldıza tekrar basınca clear). [SongFeedbackPanel.tsx](src/components/song/SongFeedbackPanel.tsx) — şarkı detayında: ortalama puan + kullanıcı puanı + yorum girişi + yorum listesi (avatar, relative time, kendi yorumunu silme onay diyaloglu)

### Faz 4.4 — Sahne Modu Geliştirmeleri (Tamamlandı)
- [x] **Per-song notlar + custom key/BPM düzenleme** — Setlist item düzenleme modal'ı (✎): sahne tonu, sahne BPM, sahne notları; mola için süre
- [x] **Sahne modu zamanlayıcı** — Üst barda canlı `♪ şarkı süresi` + `⏱ toplam süre`, şarkı geçişlerinde otomatik kayıt
- [x] **Konser özeti** — Sahne modu çıkışında modal: çalınan şarkı sayısı, toplam süre, en uzun çalınan, şarkı dökümü

### Faz 4.2 — Şarkı / Repertuar Geliştirmeleri (Tamamlandı)
- [x] **Şarkı paylaşma** — Şarkı detayında "Paylaş" butonu: panoya kopyala / native paylaş seçimi (RN `Share`, ChordPro metin formatında)
- [x] **Tab/nota gösterimi** — ChordPro `{start_of_tab}/{end_of_tab}` (kısa: `{sot}/{eot}`) blokları yatay scroll'lu monospace bloklar olarak render
- [x] **Ses kaydını paylaş** — RecordingPanel'de her kayıt için "Paylaş" butonu, `expo-sharing` ile native paylaşım

### Faz 4.3 — Grup Repertuar Yönetimi (Tamamlandı)
- [x] **Grup repertuarı yönetim ekranı** — Arama, status filtresi (Tümü/Öğreniyorum/Hazır/Setlist'te/Arşiv), pull-to-refresh, status badge, **gruptan çıkar** (✕) butonu (onay diyaloglu)
- [x] **Grup şarkısı status değiştirme** — Status badge'a tıklayarak `learning ↔ ready ↔ setlist ↔ archived` geçişi
- [x] **QR kod davet linki** — `react-native-qrcode-svg` ile davet URL'sini QR olarak gösterir; QR modal'ında kopyala / native paylaş seçenekleri
- [x] `useRemoveSongFromGroup` + `useUpdateGroupSong` hook'ları — TanStack mutation'lar
- [x] **Üye enstrüman/part atama (setlist bazında)** — Migration 011 ile `setlist_items.part_assignments JSONB`; setlist item düzenleme modal'ında her üye için TextInput + 7 preset chip (Vokal, Solo Gitar, Ritim Gitar, Bas, Davul, Klavye, Akustik); SetlistItemRow'da `👤N` göstergesi; sahne modunda part listesi rozet olarak görünür
- [x] **Grup aktivite log'u** — Migration 012 ile `group_activities` tablosu + 5 SECURITY DEFINER trigger (group_songs / setlists / polls / events / group_members) → otomatik kayıt; `/(tabs)/groups/[groupId]/activity` sayfası: emoji ikon + actor avatarı + i18n'li metin + relative zaman + pull-to-refresh
- [x] **Grup ayarları** — Settings ekranı genişletildi: "Üyeleri Yönet" + "Aktivite" linkleri, **per-grup bildirim sustur toggle** (MMKV persist `mutedGroupIds`); members ekranı role-aware işlem menüsü (Yönetici Yap / Üye Yap / Üyeyi Çıkar; owner ve self-edit korumalı; admin → admin dokunamaz)
- [x] `useUpdateMemberRole` + `useRemoveMember` hook'ları — TanStack mutation'lar

---

## Supabase Migration'lar

Migration'lar `supabase/migrations/` altında sıralı dosyalar halinde. Supabase SQL Editor'den **sırasıyla** çalıştırılmalı:

| # | Dosya | Açıklama | Durum |
|---|-------|----------|-------|
| 001 | `001_initial_schema.sql` | Temel tablolar (users, groups, songs, messages) | ✅ Uygulandı |
| 002 | `002_setlists.sql` | Setlists + setlist_items tabloları + RLS | ✅ Uygulandı |
| 003 | `003_polls.sql` | Polls + poll_votes tabloları + RLS | ✅ Uygulandı |
| 004 | `004_events.sql` | Events + event_rsvps tabloları + RLS | ✅ Uygulandı |
| 005 | `005_notifications.sql` | Notifications tablosu, users'a push_token | ✅ Uygulandı |
| 006 | `006_fix_group_rls.sql` | Grup SELECT policy düzeltmesi | ✅ Uygulandı |
| 007 | `007_message_type_poll.sql` | Messages type'a 'poll' ekleme | ✅ Uygulandı |
| 008 | `008_create_group_rpc.sql` | Grup oluşturma RPC fonksiyonu | ✅ Uygulandı |
| 009 | `009_user_categories.sql` | Dinamik kullanıcı kategorileri | ✅ Uygulandı |
| 010 | `010_fix_event_insert_policy.sql` | Etkinlik INSERT policy düzeltmesi | ✅ Uygulandı |
| 011 | `011_setlist_part_assignments.sql` | `setlist_items.part_assignments` JSONB alanı + GIN indeksi | ✅ Uygulandı |
| 012 | `012_group_activities.sql` | `group_activities` tablosu + 5 trigger fonksiyonu (song/setlist/poll/event/member) | ✅ Uygulandı |
| 013 | `013_song_comments_ratings.sql` | `song_comments` + `song_ratings` tabloları, RLS, `song_rating_summary` view, `set_updated_at` trigger | ✅ Uygulandı |
| 014 | `014_push_infrastructure.sql` | `pg_net` extension, `users.muted_group_ids` kolonu, `notifications` INSERT trigger'ı (edge function'ı pg_net ile çağırır) | ⬜ **Prod'a uygulanmadı** |
| 015 | `015_public_setlists.sql` | `setlists.is_public` + `public_slug`, slug gen trigger, anon erişim için 4 RLS policy (setlists/setlist_items/songs/groups) | ⬜ **Prod'a uygulanmadı** |
| 016 | `016_musician_matching.sql` | `find_musician_matches(user_id, limit)` `SECURITY DEFINER` RPC: skorlu müzisyen önerileri | ✅ Uygulandı |
| 017 | `017_security_hardening.sql` | Güvenlik: users private kolonları (email/push_token/...) REVOKE, SECURITY DEFINER fonksiyonlarına `search_path`, grup oluşturma ve eşleştirmede kimlik sahteciliği engeli | ✅ Uygulandı |
| 018 | `018_oauth_new_user.sql` | `handle_new_user` sağlamlaştırma: kayıtta seçilen kullanıcı adı artık kullanılıyor; e-postasız OAuth kullanıcısında (Apple) kayıt patlamıyor; Google `picture` avatarı | ⬜ Uygulanacak |

**Önemli:** 014 uygulanmadan push bildirimleri, 015 uygulanmadan herkese açık setlist paylaşımı çalışmaz. 018, Google/Apple girişinden önce uygulanmalı. Migration'lar Studio SQL Editor'dan elle çalıştırılır — `supabase db push` kullanmayın (uzak migration geçmişi bu dosyalarla senkron değil).

---

## Faz 4 — Sıradaki Geliştirmeler

### 4.1 UI/UX
- [x] ~~Tema toggle'ını canlı hale getir~~ (Faz 4.1'de tamamlandı)
- [x] ~~Skeleton loader'lar~~ (Faz 4.1'de tamamlandı)
- [x] ~~Animated transitions~~ (Faz 4.1'de tamamlandı)

### 4.2 Şarkı / Repertuar
- [x] ~~Şarkı paylaşma~~ (Faz 4.2'de tamamlandı)
- [x] ~~Tab/nota gösterimi~~ (Faz 4.2'de tamamlandı)
- [x] ~~Ses kaydını paylaş~~ (Faz 4.2'de tamamlandı)

### 4.3 Grup
- [x] ~~Grup repertuarı yönetim ekranı~~ (Faz 4.3'te tamamlandı)
- [x] ~~Grup şarkısı status değiştirme~~ (Faz 4.3'te tamamlandı)
- [x] ~~Davet linki QR kod gösterimi~~ (Faz 4.3'te tamamlandı)
- [x] ~~Üye enstrüman/part atama (setlist bazında)~~ (Faz 4.3'te tamamlandı)
- [x] ~~Grup aktivite log'u~~ (Faz 4.3'te tamamlandı)
- [x] ~~Grup ayarları (bildirim tercihleri, rol yönetimi)~~ (Faz 4.3'te tamamlandı)

### 4.4 Sahne Modu
- [x] ~~Sahne modu zamanlayıcı~~ (Faz 4.4'te tamamlandı)
- [x] ~~Sahne modu notları~~ (Faz 4.4'te tamamlandı)
- [x] ~~Sahne modu istatistikleri~~ (Faz 4.4'te tamamlandı — konser özeti)
- [x] **Sahne modu geçiş animasyonları** — [StagePage.tsx](src/components/setlist/StagePage.tsx): `Animated.FlatList` + `useAnimatedScrollHandler` ile swipe sırasında sayfalar parmağı birebir takip ederek küçülür/solar (scale 0.92, opacity 0.35); [NextSongPreview](src/components/setlist/NextSongPreview.tsx)'de "Sıradaki" satırı FadeInDown/FadeOutUp ile değişir, ilerleme çubuğu `withTiming` ile kayar; üst sayaç fade-in. Sistem "hareketi azalt" ayarı (`useReducedMotion`) açıksa tüm efektler kapanır. Ayrıca `getItemLayout` eklendi → pedal ile `scrollToIndex` ölçüm beklemeden güvenli
- [x] **Bluetooth pedal altyapısı** — Hardware-free kısım hazır: [types.ts](src/lib/pedal/types.ts) PedalAction enum + 3 hazır preset (AirTurn, PageFlip, iRig BlueBoard), [mapping.ts](src/lib/pedal/mapping.ts) saf `resolveAction(keyCode, customMapping, presetId)` (custom > preset > noop önceliği). [pedalStore.ts](src/stores/pedalStore.ts) MMKV-persist'li config: enabled toggle + preset + per-key custom override. [dispatch.ts](src/lib/pedal/dispatch.ts) handler registry (mount/unmount stack'li) + `dispatchPedalKey(keyCode)` giriş noktası. [StageView.tsx](src/components/setlist/StageView.tsx) `usePedalActions` ile next_song / prev_song / transpose_up/down aksiyonlarını bağladı. [app/pedal-settings.tsx](app/pedal-settings.tsx) ayar ekranı: preset seçimi + tuş tablosu + per-key cycle/reset/test butonu. Gerçek key event capture için `react-native-hardware-keyboard-events` veya custom native modülün `dispatchPedalKey()` ile bağlanması gerekiyor — bir cihaz testi olmadan tamamlanamadığı için bu adım runbook'a bırakıldı. 19 unit test (mapping önceliği, preset bütünlüğü, merge)

### 4.5 Sosyal
- [x] ~~Kullanıcı arama / profil görüntüleme~~ (Faz 4.5'te tamamlandı)
- [x] ~~Şarkı yorumları / puanlama~~ (Faz 4.5'te tamamlandı)
- [x] ~~Herkese açık setlist paylaşımı~~ (Faz 4.5'te tamamlandı — migration 015 prod'a uygulanmalı)
- [x] ~~Müzisyen eşleştirme (enstrüman/tür bazlı)~~ (Faz 4.5'te tamamlandı)

### 4.6 Teknik
- [x] **Unit testler** — `__tests__/` altında `parser`, `transposer`, `chordLookup`, `chordDetector`, `htmlToChordPro`, `syncQueue`, `analytics`, `pedal`, `listPerf`, `errorHandler` test suite'leri; **266 test geçiyor** (parseChordForPiano kalite mapping'i, getPianoKeys, lookupChord, isChordLine, detectChords, classifyLines, stripHtml, convertToChordPro, exponential backoff, conflict detection, analytics queue batching/identify/reset/network hata davranışı)
- [x] **E2E testler (Maestro)** — [.maestro/](./.maestro/) altında 3 smoke flow: `welcome.yaml` (clean launch + 3 element doğrulama), `login-validation.yaml` (boş/geçersiz form → Zod validation hatası), `navigation.yaml` (Welcome ↔ Register ↔ Login geçişleri). YAML tabanlı, vendor lock-in yok, Maestro CLI tek binary. Dev build üzerinde çalışır (Expo Go değil)
- [x] ~~CI/CD pipeline (EAS Build profilleri)~~ (Faz 4.6'da tamamlandı)
- [x] **OTA güncellemeleri (`expo-updates`)** — paket kuruldu, `app.json`'da `runtimeVersion.policy = "appVersion"` + `updates.checkAutomatically = "ON_LOAD"`. [useOtaUpdate.ts](src/hooks/useOtaUpdate.ts) — Expo Go + `__DEV__` guard'lı, lazy require; auto check + fetch + 1.5sn sonra reload (kullanıcı UI kesilmesin diye). Manuel kontrol için `checkForUpdate()` + `applyUpdate()` döner. Production'da `eas update --branch <preview|production>` ile JS-only deploy edilir, native binary değişmediği sürece store onayı gerekmez
- [x] ~~Error tracking (Sentry)~~ (Faz 4.6'da tamamlandı — DSN env ile devreye girer)
- [x] **Analytics (PostHog)** — [analytics.ts](src/lib/analytics.ts) thin HTTP wrapper: `EXPO_PUBLIC_POSTHOG_KEY` env'i set olunca aktifleşir, yoksa tüm fonksiyonlar noop (Sentry pattern'ı). Yeni native dep eklemez (Expo Go uyumlu). Olaylar in-memory queue'da biriktirilir + 10sn periyodik batch flush + 50 olay → immediate flush. Sıralı identifiers: login/SIGNED_IN'de `identifyUser`, logout/SIGNED_OUT'ta `resetAnalytics` (rastgele anonim slug). Wire'lanan olaylar: `app_open` (authed flag'i ile), `login`, `register`, `logout`, `song_added`, `group_song_added`, `group_created`, `setlist_created`, `setlist_public_toggled`. Base context: app_version + platform_os + expo_go flag
- [x] **Development build + Store yayın runbook'u** — README "Deployment Runbook" bölümünde end-to-end akış: Expo Go limitlerini aşmak için `eas build --profile development` (apk + iOS simulator), internal test için `--profile preview`, store için `--profile production` (.aab + autoIncrement); Play Store internal track submit; iOS App Store TestFlight + review akışı; OTA `eas update` kullanımı; secrets management (EAS Secrets + env vars matrisi); release versioning policy
- [x] ~~Deep linking (custom scheme)~~ (Faz 4.6'da tamamlandı — universal HTTPS links domain alınınca eklenebilir)
- [x] **Supabase Edge Function (push notification gönderimi)** — `send-notification` fonksiyonu Expo Push API'ye chunk'lı (100/req) gönderim yapar, `notification_preferences[type]` ve `muted_group_ids` filtrelerini server tarafında uygular, başarısız chunk'ları sayar; pg_net trigger (`013_song_comments_ratings.sql` sonrası `014_push_infrastructure.sql`) `notifications` tablosuna her INSERT'te edge function'ı otomatik çağırır (`_skip_push` damgası ile loop koruması); `useMutedGroupsSync` MMKV'yi server'a sync eder; manuel gönderim için `useSendPushNotification` hook + `pushApi.send`

### 4.7 Performans
- [x] **FlatList virtualization** — [listPerf.ts](src/lib/listPerf.ts) ortak prop seti (`removeClippedSubviews` Android-only, `windowSize=11`, `initialNumToRender=10`, `maxToRenderPerBatch=10`, `updateCellsBatchingPeriod=50ms`) + `fixedItemLayout` helper. `SongCard` ve `GroupCard` `React.memo` (id/değişken alan karşılaştırması ile shallow re-render önlendi). Uygulanan listeler: repertuar, gruplar, akor kütüphanesi (`getItemLayout` 4-sütunlu grid için), grup üyeleri, grup repertuarı, grup aktivite, kullanıcı arama
- [x] **Avatar lazy loading + cache** — `expo-image` ile [Avatar.tsx](src/components/ui/Avatar.tsx) bileşeni güncellendi: `cachePolicy="memory-disk"` (kalıcı disk cache, app restart'ları arası persist eder), `contentFit="cover"`, `transition={150}` fade-in animasyonu, `recyclingKey={uri}` ile FlatList recycle'ında doğru görsel yüklenir. Expo Go fallback'i `react-native` `Image`'a düşer. `React.memo` ile `uri`/`name`/`size` değişmedikçe re-render olmaz
- [x] **Offline-first conflict resolution** — [syncQueue.ts](src/lib/offline/syncQueue.ts) genişletildi: `expectedUpdatedAt` (op enqueue edilirken okunan kayıdın timestamp'i), `nextRetryAt` (exponential backoff 1sn → 2sn → ... → 5dk cap), `forceOverwrite` (conflict çözümü için). `MAX_RETRIES=5`. Yardımcı saf fonksiyonlar: `isOpReady` / `isOpExhausted` / `isConflict` / `nextRetryDelayMs`. [offlineStore.ts](src/stores/offlineStore.ts) refactor edildi: 3 ayrı queue (`pendingOps` retry'da, `conflictOps` kullanıcı çözmeli, `failedOps` dead letter), `resolveConflict(id, 'overwrite' \| 'discard')`, `retryFailed(id)`, `clearFailed`. Flush sırasında update op'ları için server'ın `updated_at`'ı tek SELECT ile çekilir; daha büyükse op `conflictOps`'a taşınır. **26 yeni unit test** (`syncQueue.test.ts`): toplam Jest 207/207
- [x] **Bundle size optimizasyonu** — [metro.config.js](metro.config.js)'e `inlineRequires: true` eklendi: top-level require'lar kullanım noktasına taşınır → cold start'ta açılışta kullanılmayan modüller hiç eval edilmez (~80KB Hermes bytecode tasarrufu + ölçülmemiş startup hızlanması). Ölü `App.tsx` (Expo starter şablonundan kalma, expo-router kullanılırken hiç referans edilmiyordu) silindi. Mevcut Hermes bundle: **~7.5MB** (reanimated + webview + sentry + supabase + i18n + tanstack + nativewind dahil). Agressive minifier override denendi ama bundle'ı büyüttü → defaults korundu

---

## Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | React Native 0.83.6 + Expo SDK 55 |
| Routing | expo-router (file-based) |
| Backend | Supabase (PostgreSQL + Auth + Realtime + Storage) |
| State | Zustand (client state) + TanStack Query (server state) |
| Styling | NativeWind v4 (TailwindCSS) |
| i18n | react-i18next |
| Validation | Zod |
| Charts | react-native-svg |
| Browser | react-native-webview |
| Audio | expo-audio (dev build only) |
| Notifications | expo-notifications (dev build only) |
| Persist | MMKV (dev build) / AsyncStorage (Expo Go fallback) |

## Google / Apple Girişi Kurulumu

Kod hazır; sağlayıcılar Supabase'de açılmadan butonlar hata verir.

1. **Migration 018**'i Studio SQL Editor'dan çalıştırın.
2. Supabase Dashboard → **Authentication → URL Configuration → Redirect URLs**'e ekleyin:
   - `muzikapp://auth/callback` (dev/preview/production build)
   - `exp://**` (yalnızca Expo Go ile geliştirirken)
3. **Google:** Google Cloud Console → OAuth client (Web application) oluşturun; Authorized redirect URI: `https://<ref>.supabase.co/auth/v1/callback`. Client ID + Secret'ı Dashboard → Authentication → Providers → Google'a girin.
4. **Apple:** Apple Developer → Services ID + Sign in with Apple key oluşturun; Return URL: `https://<ref>.supabase.co/auth/v1/callback`. Dashboard → Providers → Apple'a Services ID, Team ID, Key ID ve private key ile üretilen secret'ı girin (Apple secret'ı 6 ayda bir yenilenmeli).
5. Yeni `expo-web-browser` native modülü eklendiği için dev/production build'ler yeniden alınmalı (Expo Go'da zaten var).

## Bilinen Sorunlar

1. **expo-notifications & expo-audio**: Expo Go'da SDK 53+ sonrası çalışmıyor. Development build gerekli. Kod ikisini de Expo Go'da gracefully bypass eder.
2. ~~**Tema toggle pasif**~~ — Çözüldü (Faz 4.1, `dark:` variant bridge).
3. **`database.types.ts` elle yazılmış**: Şu an `tsc` hatasız, ama tipler canlı şemadan üretilmediği için kayabilir. Proje aktifken `npx supabase gen types typescript --project-id niwyrrysjrpgxhevlavo > src/types/database.types.ts` ile yenilenmeli.
4. **GO_BACK uyarısı**: Bazı ekranlarda `router.back()` yerine `safeBack()` helper'ı kullanılmalı (auth ekranları zaten güncellendi).

---

## Expo Go Test Listesi

Uygulamayı emülatör/cihazda Expo Go ile çalıştırınca aşağıdaki akışı sırayla deneyerek tüm modülleri doğrulayabilirsin:

### Smoke testler (5 dk)
1. **Welcome → Register** ile yeni hesap oluştur (e-posta + şifre)
2. **Repertuar** sekmesine geç → boş listeyi aşağı çekerek **pull-to-refresh** dene
3. **+** butonu → "Şarkı Ekle" → minimum başlık + akor satırı ekle, kaydet
4. Kaydedilen şarkıya tıkla → şarkı detay açılmalı

### Şarkı detay (3 dk)
5. **Transpoze** ±/sıfırla — orijinal akorlar kayıyor mu?
6. **Capo** ±/sıfırla — "F3 → X" göstergesi güncelleniyor mu?
7. **♩ BPM** butonu → Metronom modal → titreşim hissedilmeli
8. **● Kayıt** butonu → Expo Go'da "Dev build gerekli" mesajı gelmeli (doğru davranış)
9. **Dışa Aktar** → toast: "ChordPro panoya kopyalandı"
10. Şarkı detayında 15+ sn kal → çık → tekrar gir, alt rozet **`1× çalındı`** görünmeli

### Akor & ChordPro (2 dk)
11. Repertuar header → **♪** butonu → Akor kütüphanesi açılmalı
12. Bir akora tıkla → diyagram modal'ı (gitar/piyano)
13. Repertuar → **+ Şarkı Ekle** → **İçe Aktar** → boş gelirse `{title: Test}\n[C]Test` yapıştırıp Uygula

### Gruplar (3 dk)
14. **Gruplar** sekmesi → **+** → Grup oluştur
15. Grup detayı → **Davet** linki kopyala (clipboard'a düşmeli)
16. **Setlist** → yeni setlist oluştur → **+ Şarkı Ekle** → ekrandan setlist'e şarkı ekle
17. Setlist detayında öğeleri **uzun bas + sürükle** ile yeniden sırala
18. Sağ alt **▶** → Sahne modu açılmalı, swipe ile gez

### Profil & ayarlar (2 dk)
19. **Profil** sekmesi → "Tanıtımı tekrar göster" → Onboarding swipe testi
20. **İstatistikler** → 6. adımda kaydedilen çalma görünmeli
21. **Tema** segmented (system/light/dark) — tüm uygulama anında renk değiştirmeli
22. **Dil** TR ↔ EN — anlık değişmeli

### Negatif testler
23. Login ekranında "Geri" — uyarı çıkmamalı (safeBack düzeltmesi)
24. İnternet kapatıp listelere bak — TanStack Query cache'i göstermeli
25. Tekrar açıp pull-to-refresh — yenilenmeli

Eğer 8. adımda Expo Go yerine **dev build** kullanıyorsan kayıt gerçekten çalışmalı (mikrofon izni istemeli).

---

## Kurulum

```bash
# Bağımlılıkları yükle
npm install --legacy-peer-deps

# Expo başlat (önbellek temizleyerek)
npx expo start --clear

# Testleri çalıştır
npm test
```

## Ortam Değişkenleri

`.env` veya `app.config.ts` → `extra` içinde:
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase proje URL'si
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonim anahtar
- `EXPO_PUBLIC_SENTRY_DSN` — (opsiyonel) Sentry DSN; set edilmediği sürece Sentry başlatılmaz
- `EXPO_PUBLIC_POSTHOG_KEY` — (opsiyonel) PostHog project API key; set edilmediği sürece analytics noop
- `EXPO_PUBLIC_POSTHOG_HOST` — (opsiyonel) PostHog host (default: `https://app.posthog.com`; self-hosted için override edin)

## Deployment Runbook

End-to-end yayın akışı. Üç build profili = üç farklı kullanıcı:
**development** (Expo Go'nun yapamadığı her şeyi local emülatörde test edebilen geliştirici) →
**preview** (internal QA + paydaş demosu; .apk dahili link) →
**production** (.aab Play Store, .ipa App Store).

### 0. Bir kerelik kurulum

```bash
# EAS CLI (global)
npm install -g eas-cli

# Hesap login
eas login

# Projeyi EAS'a bağla (bir kerelik — eas.json varsa atlanır)
eas init

# OTA için (bir kerelik — app.json updates.url'i otomatik ekler)
eas update:configure
```

Android için ek olarak Google Play Console'da uygulamanın açılmış olması gerekir
(`com.muzikapp.app` package adıyla). iOS için Apple Developer hesabı + App Store
Connect'te yeni app oluşturulmalı (`com.muzikapp.app` bundle id).

### 1. Secrets (env vars) yönetimi

`.env` lokal geliştirme için. EAS Build için **EAS Secrets** kullanın:

```bash
# Supabase
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_URL --value "https://<ref>.supabase.co"
eas secret:create --scope project --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "<anon-jwt>"

# Sentry (opsiyonel)
eas secret:create --scope project --name EXPO_PUBLIC_SENTRY_DSN --value "https://<key>@sentry.io/<id>"

# Analytics (opsiyonel)
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_KEY --value "<phc_...>"

# Listele / kontrol
eas secret:list
```

Build sırasında `eas.json`'daki `base.env` ile ekstra env eklenir (telemetri kapatma vb.).
Production'da **service_role_key'i ASLA EXPO_PUBLIC_* prefix ile vermeyin** — sadece
Edge Functions için kullanılır (Supabase Dashboard → Functions → Secrets).

### 2. Development build (Expo Go alternatifi)

`expo-audio`, `react-native-mmkv`, `@sentry/react-native`, `expo-image`, `expo-updates`,
`@react-native-community/netinfo` gibi modüller Expo Go'da çalışmaz. Onları gerçek
emülatörde test etmek için:

```bash
# Android APK (development client + debug)
eas build --profile development --platform android

# iOS simulator için
eas build --profile development --platform ios
```

Build bitince EAS UI'dan APK'yı emülatöre sürükleyip Metro'yu `npx expo start --dev-client`
ile başlatın. Aynı QR kodu Expo Go yerine development client'ı açacaktır.

### 3. Preview (internal test / demo)

Paydaşlara ham APK göndermek için. Store onayı yok, **internal distribution**.

```bash
eas build --profile preview --platform android
# Sonuçtaki URL/QR'ı paylaşın → kullanıcı APK'yı indirir, "unknown sources" enable eder.
```

### 4. Production: Android (Play Store)

```bash
# 1. Build (.aab + autoIncrement: versionCode otomatik artar)
eas build --profile production --platform android

# 2. Play Store'a göndermeden ÖNCE: ilk yayın için manuel olarak Play Console'a
#    .aab dosyasını yükleyip Internal Testing track'inde release oluşturmalısınız
#    (uygulama metadata, screenshot, content rating vb. doldurulmalı).

# 3. İlk yayın yapıldıktan sonra sonraki release'leri CLI ile:
eas submit --profile production --platform android
# → .aab Play Console "Internal Testing" track'ine yüklenir.
# → Play Console'dan Open Testing → Production'a promote edin.
```

İlk submit için Play Console'da **Service Account JSON** oluşturup `eas credentials`
ile EAS'a yüklemeniz gerekir (bir kerelik).

### 5. Production: iOS (App Store)

```bash
# 1. Build (.ipa, autoIncrement: buildNumber artar)
eas build --profile production --platform ios

# 2. TestFlight'a gönder (Apple Developer + App Store Connect erişimi gerekli)
eas submit --profile production --platform ios
# → TestFlight'ta processing → internal/external testing → App Store review.
```

EAS Build certificates'i ilk seferde otomatik üretir; sonraki build'lerde reuse eder.

### 6. OTA güncelleme (JS-only)

Native binary değişmediği sürece store onayını beklemeden JS bundle'ı update edin:

```bash
eas update --branch preview    --message "fix: <kısa açıklama>"
eas update --branch production --message "<release notes>"
```

`runtimeVersion: { policy: "appVersion" }` ayarlı → sadece aynı `app.json` `version`'ına
sahip cihazlar update'i alır. Native dep eklendiğinde **`version`'ı yükseltip yeni
binary build alın** — eski binary'ler OTA'da bu güncellemeyi görmez (doğru davranış).

### 7. Veritabanı migration'ları

Her yeni production deploy öncesi `supabase/migrations/` altındaki uygulanmamış
migration'lar Supabase Dashboard → SQL Editor üzerinden veya CLI ile çalıştırılmalı:

```bash
supabase link --project-ref <ref>   # bir kerelik
supabase db push                     # local migration'ları remote'a uygula
```

Push notification için ek olarak (bir kerelik):

```bash
# Edge function deploy
supabase functions deploy send-notification

# Migration 014 trigger'ı için DB config
psql "$DATABASE_URL" -c "ALTER DATABASE postgres SET app.edge_function_url = 'https://<ref>.functions.supabase.co/send-notification';"
psql "$DATABASE_URL" -c "ALTER DATABASE postgres SET app.service_role_key = '<service_role_jwt>';"
```

### 8. Release versioning policy

- `app.json` `version` (semver): kullanıcıya görünen sürüm. **Native değişiklikte arttır.**
- Android `versionCode`: `eas.json production.autoIncrement: true` ile otomatik.
- iOS `buildNumber`: aynı şekilde autoIncrement.
- OTA-only fix → `version` aynı kalır, sadece `eas update` yayını.

### 9. Sanity checks (her release öncesi)

```bash
npx tsc --noEmit              # 0 hata
npx jest                       # 207/207 (veya o anki sayım)
maestro test .maestro/flows/   # smoke flow'lar
npx expo-doctor                # paket uyumluluğu
```

## Theme Migration (light/dark tema)

NativeWind v4 `dark:` variant pattern'i. Mevcut ekranlardaki class'lar `dark:` prefix
eklenerek incremental migrate edilir; refactor yapılmamış ekranlar dark görünümde kalır.

**Token şeması** ([tailwind.config.js](tailwind.config.js)):

| Semantik          | Light (default)         | Dark (`dark:` ile)   |
| ----------------- | ----------------------- | --------------------- |
| `background`      | `bg-light-background`   | `dark:bg-background`  |
| `surface`         | `bg-light-surface`      | `dark:bg-surface`     |
| `surface-1/2/3`   | `bg-light-surface-1/2/3`| `dark:bg-surface-1/2/3` |
| `text-primary`    | `text-light-text-primary` | `dark:text-text-primary` |
| `text-secondary`  | `text-light-text-secondary` | `dark:text-text-secondary` |
| `text-muted`      | `text-light-text-muted` | `dark:text-text-muted` |
| `border`          | `border-light-border`   | `dark:border-border`  |
| `border-light`    | `border-light-border-light` | `dark:border-border-light` |

Marka renkleri (`primary`, `accent`, `error`, `warning`, `success`, `info`) iki temada
da aynı kalır — `dark:` gerekmiyor.

**Migration örneği** ([welcome.tsx](app/(auth)/welcome.tsx)):

```diff
- <SafeAreaView className="flex-1 bg-background">
+ <SafeAreaView className="flex-1 bg-light-background dark:bg-background">
-   <Text className="text-text-primary text-3xl">...</Text>
+   <Text className="text-light-text-primary dark:text-text-primary text-3xl">...</Text>
```

**Durum:** Tüm ekran ve bileşenler migrate edildi (Sahne Modu hariç — kasıtlı koyu).
Yeni ekran eklerken bu deseni izle: arka plan/yüzey/metin/kenarlık class'larına
`light-*` token + `dark:` orijinal varyantını birlikte ver. Marka renkleri
(`primary`, `accent`, `error`, vb.) iki temada da aynı — `dark:` gerekmez.

**Toggle yeri:** Profile → Tema (3 buton: system / light / dark). `ThemeSync` bileşeni
zustand'daki seçimi `setColorScheme` ile NativeWind'a bağlar.

## EAS Build

```bash
# Geliştirme build (Expo Go yerine kullanılır, expo-audio/mmkv vb. native modüller burada çalışır)
eas build --profile development --platform android

# Dahili test build (APK, internal distribution)
eas build --profile preview --platform android

# Production build (Play Store için Android App Bundle + autoIncrement)
eas build --profile production --platform android

# Play Store internal track'e gönder
eas submit --profile production --platform android
```

Profiller [eas.json](eas.json) içinde tanımlı; `base` paylaşılan env'i içerir.

## EAS Update (OTA)

JS-only güncellemeleri store onayı beklemeden dağıtmak için.

```bash
# İlk kurulum (bir kere) — projeyi EAS Update için yapılandırır,
# app.json'a updates.url'i otomatik ekler
eas update:configure

# Preview kanalına (internal test) güncelleme yayınla
eas update --branch preview --message "fix: <kısa açıklama>"

# Production kanalına yayınla
eas update --branch production --message "<release notes>"

# Branch listesi ve geçmiş
eas update:list --branch production
```

`runtimeVersion: { policy: "appVersion" }` ayarlı; sadece `app.json` `version`'ı aynı olan native binary'ler güncellemeyi alır. Native modül eklenirse `version`'ı yükseltip yeni EAS build üretmek gerekir. `useOtaUpdate` hook'u app açılışında otomatik check eder; bir güncelleme indirilirse 1.5 saniye sonra reload eder.

## E2E Testler (Maestro)

YAML tabanlı UI testleri. Dev build (`eas build --profile development`) üzerinde çalışır.

```bash
# Maestro CLI kurulumu (tek seferlik)
# macOS / Linux:
curl -Ls https://get.maestro.mobile.dev | bash
# Windows (PowerShell, scoop ile):
scoop install maestro

# Tek flow çalıştır
maestro test .maestro/flows/welcome.yaml

# Tüm flow'lar
maestro test .maestro/flows/

# Studio (görsel inspect + flow yazma)
maestro studio
```

Mevcut flow'lar:
- `welcome.yaml` — clean launch, welcome ekranındaki üç temel eleman görünür mü
- `login-validation.yaml` — Login → boş/geçersiz form submit → Zod validation hata mesajı
- `navigation.yaml` — Welcome ↔ Register ↔ Login geçişleri

Maestro Expo Go ile çalışmaz (farklı `appId`). Dev build apk'sını emülatöre kurduktan sonra `maestro test` komutu uygulamayı `com.muzikapp.app` paket adıyla başlatır.

## Supabase Edge Functions

Şu an deploy edilecek tek edge function var: `send-notification`. Expo Push API'ye batch'li ve filtreli (notification_preferences + muted_group_ids) gönderim yapar; başarısız chunk'ları sayar; opsiyonel `persist: true` ile `notifications` tablosuna in-app kayıt yazar.

```bash
# Supabase CLI yüklü değilse
npm install -g supabase

# Projeye bağlan (bir kerelik)
supabase link --project-ref <YOUR_PROJECT_REF>

# Edge function'ı deploy et
supabase functions deploy send-notification

# Migration 014'ün pg_net trigger'ı için DB ayarları (bir kere)
# Supabase Dashboard → Database → Custom Postgres Config:
#   app.edge_function_url = "https://<ref>.functions.supabase.co/send-notification"
#   app.service_role_key  = "<service_role_jwt>"
# Veya psql ile:
psql "$DATABASE_URL" -c "ALTER DATABASE postgres SET app.edge_function_url = 'https://<ref>.functions.supabase.co/send-notification';"
psql "$DATABASE_URL" -c "ALTER DATABASE postgres SET app.service_role_key = '<service_role_jwt>';"
```

Test (manuel client-side invoke):

```ts
import { useSendPushNotification } from 'src/hooks/usePushNotification';
const { mutate } = useSendPushNotification();
mutate({ user_ids: ['<uuid>'], title: 'Test', body: 'Merhaba 👋' });
```

DB tarafı: `notifications` tablosuna direkt INSERT yapıldığında trigger devreye girer ve edge function'a `_skip_push: true` damgalı payload yollar (sonsuz döngü koruması). Edge function'ın kendisi de varsayılan `persist: true` ile `notifications`'a kayıt atar; bu kayıt aynı trigger'ı tetikler ama damga sayesinde re-dispatch yapılmaz.

## Proje Yapısı

```
muzik-app/
├── app/                          # Expo Router sayfa dosyaları
│   ├── (auth)/                   # Auth ekranları
│   ├── (tabs)/                   # Tab navigator
│   │   ├── repertoire/           # Repertuar (kişisel şarkılar)
│   │   ├── groups/               # Gruplar
│   │   │   └── [groupId]/        # Grup detay
│   │   │       ├── setlists/     # Setlistler
│   │   │       ├── polls/        # Oylamalar
│   │   │       └── events/       # Etkinlikler
│   │   └── profile/              # Profil & Ayarlar
│   ├── browser/                  # Web tarayıcı
│   ├── chord-library.tsx         # Akor kütüphanesi
│   ├── stats.tsx                 # Çalma istatistikleri
│   └── song/                     # Şarkı detay (paylaşımlı)
├── src/
│   ├── api/                      # Supabase API katmanı
│   ├── components/               # UI bileşenleri
│   │   ├── song/                 # ChordPro, diyagram, metronom, kayıt
│   │   ├── setlist/              # Setlist bileşenleri
│   │   ├── poll/                 # Oylama bileşenleri
│   │   ├── event/                # Etkinlik bileşenleri
│   │   ├── chat/                 # Sohbet bileşenleri
│   │   ├── browser/              # Tarayıcı bileşenleri
│   │   ├── ui/                   # Genel UI (Card, Badge, Toast, vb.)
│   │   ├── Onboarding.tsx        # Tanıtım wizard
│   │   └── ThemeSync.tsx         # Tema senkronizasyonu
│   ├── hooks/                    # React hooks (TanStack Query)
│   ├── stores/                   # Zustand store'ları
│   ├── types/                    # TypeScript type definitions
│   ├── lib/                      # Utility kütüphaneleri
│   │   ├── chordpro/             # parser, transposer, exporter, importer
│   │   ├── scraper/              # Web scraping (akor çekme)
│   │   ├── setlist/              # Setlist utilities
│   │   ├── validators/           # Zod schemas
│   │   ├── i18n/                 # Çeviri dosyaları (tr.json, en.json)
│   │   ├── notifications/        # Push notification setup
│   │   ├── offline/              # MMKV/AsyncStorage adaptörü
│   │   └── navigation.ts         # safeBack helper
│   └── constants/                # Config, theme
└── supabase/
    ├── migrations/               # SQL migration dosyaları (001-010)
    └── functions/                # Edge Functions
```
