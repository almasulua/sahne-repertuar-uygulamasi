// Edge function'lar için ortak CORS başlıkları.
//
// Bu fonksiyonlar mobil (React Native) istemci tarafından çağrılır; RN CORS uygulamaz,
// dolayısıyla mobil çağrılar bu başlıklardan etkilenmez.
//
// Güvenlik (K7): Önceden 'Access-Control-Allow-Origin: *' wildcard'ı kullanılıyordu.
// Bu, herhangi bir web sayfasının kullanıcının oturumuyla edge function'ı tarayıcıdan
// çağırmasına (CSRF benzeri) kapı aralıyordu. Artık wildcard YOK: izinli origin yalnızca
// `ALLOWED_ORIGIN` env'i ile açıkça verilir (web client gerekiyorsa). Verilmezse tarayıcı
// cross-origin çağrıları reddedilir ('null' ile eşleşen origin olmaz).
const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN')?.trim() || '';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN || 'null',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  Vary: 'Origin',
};

/** OPTIONS preflight isteğine 204 ile cevap verir. */
export function handlePreflight(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}
