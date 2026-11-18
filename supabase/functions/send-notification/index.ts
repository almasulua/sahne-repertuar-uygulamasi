// Supabase Edge Function: Expo Push API gönderimi
// Deploy:  supabase functions deploy send-notification
// Invoke:  POST /functions/v1/send-notification
//
// Payload:
//   {
//     "user_ids": ["uuid", ...],
//     "title": "...",
//     "body":  "...",
//     "data":  { type?: string, group_id?: string, ... }   // opsiyonel
//     "persist": true                                       // varsayılan: true; false ise notifications tablosuna yazılmaz
//   }
//
// Davranış:
//   1. user_ids içindeki kullanıcıların push_token'larını ve notification_preferences'larını çeker.
//   2. data.type varsa, preferences[type] === false olan kullanıcıları eler.
//   3. data.group_id varsa, kullanıcının muted_group_ids'inde varsa eler.
//   4. Geriye kalan token'ları 100'lük chunk'lar halinde Expo Push API'ye gönderir.
//   5. persist != false ise her hedef kullanıcı için notifications tablosuna kayıt atar.
//
// Notlar:
//   - SUPABASE_SERVICE_ROLE_KEY env'iyle çalışır (RLS bypass).
//   - Expo Push API rate-limit / error response'larını döndürür ama döküm tutmaz.
//   - Receipt polling şu an kapsam dışı; ileride DeviceNotRegistered tokenları temizlemek için ayrı bir fonksiyon eklenebilir.
//
// Yetkilendirme (KRİTİK):
//   Bu fonksiyon service_role ile çalıştığı için RLS'i bypass eder. Yetki kontrolü
//   olmazsa herhangi bir authed kullanıcı rastgele user_ids'e push/phishing gönderebilir.
//   Bu yüzden çağıran iki sınıfa ayrılır:
//     1. Service-role çağrısı (DB trigger / sunucu): Authorization bearer == SERVICE_ROLE_KEY
//        → tam yetki, user_ids olduğu gibi işlenir.
//     2. Authenticated kullanıcı çağrısı: hedef user_ids yalnızca çağıranla EN AZ BİR
//        ORTAK GRUBU olan kullanıcılarla (+ çağıranın kendisi) sınırlanır. Kalan hedef
//        yoksa 403 döner.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handlePreflight } from '../_shared/cors.ts';

interface PushPayload {
  user_ids: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
  persist?: boolean;
}

interface UserRow {
  id: string;
  push_token: string | null;
  notification_preferences: Record<string, boolean> | null;
  muted_group_ids: string[] | null;
}

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound: 'default';
  priority: 'default' | 'normal' | 'high';
  channelId?: string;
}

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const CHUNK_SIZE = 100; // Expo limit

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function isExpoToken(token: string | null | undefined): boolean {
  return !!token && (token.startsWith('ExponentPushToken[') || token.startsWith('ExpoPushToken['));
}

function shouldDeliver(user: UserRow, payload: PushPayload): boolean {
  const type = payload.data?.type as string | undefined;
  const groupId = payload.data?.group_id as string | undefined;

  // Kullanıcı bu türü kapatmış mı?
  if (type && user.notification_preferences && user.notification_preferences[type] === false) {
    return false;
  }
  // Kullanıcı bu grubu susturmuş mu?
  if (groupId && user.muted_group_ids?.includes(groupId)) {
    return false;
  }
  return true;
}

async function sendChunk(messages: ExpoMessage[]): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      return { ok: false, status: res.status, error: txt.slice(0, 500) };
    }
    return { ok: true, status: res.status };
  } catch (err) {
    return { ok: false, status: 0, error: (err as Error).message };
  }
}

async function persistInApp(
  supabase: SupabaseClient,
  userIds: string[],
  payload: PushPayload,
): Promise<void> {
  if (userIds.length === 0) return;
  const rows = userIds.map((uid) => ({
    user_id: uid,
    type: (payload.data?.type as string | undefined) ?? 'general',
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
  }));
  const { error } = await supabase.from('notifications').insert(rows);
  if (error) {
    // Push yine de gönderildi — sadece logla, throw etme
    console.error('[send-notification] persist hata:', error.message);
  }
}

/** Authorization header'ından "Bearer <token>" değerini çıkarır. */
function extractBearer(req: Request): string | null {
  const h = req.headers.get('Authorization') ?? req.headers.get('authorization');
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

/**
 * Authed kullanıcı çağrısında: istenen user_ids'i, çağıranla en az bir ortak grubu
 * olan kullanıcılarla (+ çağıranın kendisi) sınırlar. RLS bypass eden service client
 * ile group_members üzerinden hesaplanır.
 */
async function authorizeTargets(
  supabase: SupabaseClient,
  callerId: string,
  requestedIds: string[],
): Promise<string[]> {
  const requested = new Set(requestedIds);
  const allowed = new Set<string>();

  // Çağıran kendine her zaman gönderebilir
  if (requested.has(callerId)) allowed.add(callerId);

  // Çağıranın üye olduğu gruplar
  const { data: myGroups, error: gErr } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('user_id', callerId);
  if (gErr || !myGroups || myGroups.length === 0) {
    return [...allowed];
  }
  const groupIds = myGroups.map((g: { group_id: string }) => g.group_id);

  // Bu gruplardaki tüm üyeler = çağıranın "ortak grup" havuzu
  const { data: coMembers, error: mErr } = await supabase
    .from('group_members')
    .select('user_id')
    .in('group_id', groupIds);
  if (mErr || !coMembers) {
    return [...allowed];
  }
  for (const row of coMembers as { user_id: string }[]) {
    if (requested.has(row.user_id)) allowed.add(row.user_id);
  }

  return [...allowed];
}

serve(async (req) => {
  const pre = handlePreflight(req);
  if (pre) return pre;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let payload: PushPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!Array.isArray(payload.user_ids) || payload.user_ids.length === 0) {
    return new Response(JSON.stringify({ error: 'user_ids gerekli' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  if (!payload.title || !payload.body) {
    return new Response(JSON.stringify({ error: 'title ve body gerekli' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'SUPABASE env eksik' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);

  // ---- YETKİLENDİRME ----
  const bearer = extractBearer(req);
  if (!bearer) {
    return new Response(JSON.stringify({ error: 'Authorization gerekli' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const isServiceCaller = bearer === serviceKey;

  if (!isServiceCaller) {
    // Kullanıcı çağrısı: JWT'yi doğrula
    const { data: authData, error: authErr } = await supabase.auth.getUser(bearer);
    if (authErr || !authData?.user) {
      return new Response(JSON.stringify({ error: 'Geçersiz oturum' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    // Hedefleri ortak-grup havuzuyla sınırla
    const allowedIds = await authorizeTargets(supabase, authData.user.id, payload.user_ids);
    if (allowedIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Bu kullanıcılara bildirim gönderme yetkiniz yok' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    payload.user_ids = allowedIds;
  }
  // ------------------------

  // Hedef kullanıcıları çek
  const { data: users, error } = await supabase
    .from('users')
    .select('id, push_token, notification_preferences, muted_group_ids')
    .in('id', payload.user_ids);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const allUsers = (users ?? []) as UserRow[];

  // Filtreleme: tercih + mute
  const eligibleUsers = allUsers.filter((u) => shouldDeliver(u, payload));
  const eligibleIds = eligibleUsers.map((u) => u.id);

  // Push gönder (sadece geçerli Expo token sahipleri)
  const messages: ExpoMessage[] = eligibleUsers
    .filter((u) => isExpoToken(u.push_token))
    .map((u) => ({
      to: u.push_token!,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
      sound: 'default',
      priority: 'high',
      channelId: 'default',
    }));

  let attemptedChunks = 0;
  let failedChunks = 0;
  let firstError: string | undefined;

  for (const c of chunk(messages, CHUNK_SIZE)) {
    attemptedChunks++;
    const result = await sendChunk(c);
    if (!result.ok) {
      failedChunks++;
      if (!firstError) firstError = `HTTP ${result.status}: ${result.error ?? 'unknown'}`;
    }
  }

  // In-app bildirim kaydet (push hatasından bağımsız)
  if (payload.persist !== false) {
    await persistInApp(supabase, eligibleIds, payload);
  }

  return new Response(
    JSON.stringify({
      requested: payload.user_ids.length,
      eligible: eligibleIds.length,
      pushed: messages.length,
      chunks: attemptedChunks,
      failed_chunks: failedChunks,
      error: firstError,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    },
  );
});
