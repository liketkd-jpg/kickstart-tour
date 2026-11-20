// KICKSTART UP 원정 — 휴대폰 알림 보내기 (Supabase Edge Function 이름: tour-push)
// 지도자가 공지·인원 점검·해설을 올릴 때 앱이 이 함수를 부르면, 그 원정 단원 휴대폰 전체에 알림을 보냅니다.
// 필요한 비밀 값(Secrets): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY  (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 는 자동으로 들어 있음)
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import webpush from 'npm:web-push@3.6.7';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { tour_id, title, body, url } = await req.json();
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 보내는 사람이 이 원정의 지도자인지 확인
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: who } = await admin.auth.getUser(jwt);
    if (!who?.user) return json({ error: 'not_signed_in' }, 401);
    const { data: tour } = await admin.from('tour_tours').select('id').eq('id', tour_id).eq('owner_id', who.user.id).maybeSingle();
    if (!tour) return json({ error: 'not_owner' }, 403);

    const { data: subs } = await admin.from('tour_push_subs').select('id, endpoint, p256dh, auth').eq('tour_id', tour_id);
    webpush.setVapidDetails('mailto:noreply@kickstartup.app', Deno.env.get('VAPID_PUBLIC_KEY')!, Deno.env.get('VAPID_PRIVATE_KEY')!);
    const payload = JSON.stringify({
      title: String(title || 'KICKSTART UP').slice(0, 80),
      body: String(body || '').slice(0, 200),
      url: typeof url === 'string' ? url : './',
    });
    let sent = 0;
    const gone: string[] = [];
    await Promise.all((subs || []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 3600, urgency: 'high' });
        sent++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) gone.push(s.id); // 알림을 끈 휴대폰은 목록에서 정리
      }
    }));
    if (gone.length) await admin.from('tour_push_subs').delete().in('id', gone);
    return json({ sent, total: (subs || []).length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
