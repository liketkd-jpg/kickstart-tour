// KICKSTART UP 원정 — AI 관광 해설 만들기 (Supabase Edge Function 이름: tour-guide-ai)
// 지도자가 구글 지도 링크(또는 장소 이름)를 넣고 「AI 해설 만들기」를 누르면,
// 구글 제미나이(Gemini)가 학생용 이어폰 해설 글을 써서 돌려줍니다. 저장은 지도자가 읽어 본 뒤 직접 합니다.
// 필요한 비밀 값(Secrets): GEMINI_API_KEY  (선택: GEMINI_MODEL — 비워 두면 gemini-2.5-flash)
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (obj: unknown, status = 200) =>
  new Response(JSON.stringify(obj), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const dec = (s: string) => { try { return decodeURIComponent(s.replace(/\+/g, ' ')); } catch { return s; } };

// 구글 지도 주소에서 장소 이름·좌표 꺼내기
function parseMaps(u: string): { name: string; lat?: string; lng?: string } {
  let url: URL;
  try { url = new URL(u); } catch { return { name: '' }; }
  // 동의 화면으로 돌려보내진 경우 원래 주소로
  const cont = url.searchParams.get('continue');
  if (/consent\.google/.test(url.hostname) && cont) return parseMaps(cont);
  let name = '';
  const m = url.pathname.match(/\/place\/([^/]+)/) || url.pathname.match(/\/search\/([^/]+)/);
  if (m) name = dec(m[1]);
  if (!name) name = dec(url.searchParams.get('q') || url.searchParams.get('query') || url.searchParams.get('destination') || '');
  const at = u.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || u.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(name)) { const [a, b] = name.split(','); return { name: '', lat: a.trim(), lng: b.trim() }; }
  return { name: name.trim(), lat: at?.[1], lng: at?.[2] };
}

// 짧은 공유 링크(maps.app.goo.gl, goo.gl/maps)는 실제 주소로 풀기
async function expand(u: string): Promise<string> {
  let cur = u;
  for (let i = 0; i < 6; i++) {
    const r = await fetch(cur, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' } });
    const loc = r.headers.get('location');
    if (!loc || r.status < 300 || r.status >= 400) break;
    cur = new URL(loc, cur).toString();
    if (/\/maps\/(place|search)\//.test(cur) || /[?&](q|query)=/.test(cur)) break;
  }
  return cur;
}

const PROMPT = (place: string, lang: string) => lang === 'en'
  ? `Write an audio-guide script about "${place}" for middle/high-school members of a Korean taekwondo demonstration team, to be read aloud through earphones. About 2-3 minutes (around 350 words), friendly and polite, short sentences that are easy to read aloud. Include one or two pieces of history, must-see spots, one fun story, and good photo spots. Only state facts you are sure of. No headings, no bullet points, no emoji. Also give the place's common English name as title.`
  : `태권도 시범단 중고등학생 단원들에게 이어폰으로 들려줄 「${place}」 관광 해설을 써 줘. 2~3분 분량(700자 안팎), 쉬운 존댓말, 소리 내어 읽기 좋게 짧은 문장으로. 역사 한두 가지, 꼭 볼 것, 재미있는 이야기 하나, 사진 찍기 좋은 곳을 넣어 줘. 확실히 아는 사실만 쓰고, 제목·번호·기호·이모지 없이 해설 글만 써 줘. title에는 그 장소의 한국어 이름을 넣어 줘.`;

async function gemini(place: string, lang: string) {
  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return { error: 'no_key' };
  const models = [Deno.env.get('GEMINI_MODEL'), 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'].filter(Boolean) as string[];
  let last = '';
  for (const model of [...new Set(models)]) {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: PROMPT(place, lang) }] }],
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 4096,
          responseMimeType: 'application/json',
          responseSchema: { type: 'OBJECT', properties: { title: { type: 'STRING' }, script: { type: 'STRING' } }, required: ['title', 'script'] },
        },
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      last = d?.error?.status || String(r.status);
      if (r.status === 404 || r.status === 400 && /model/i.test(d?.error?.message || '')) continue; // 그 모델이 없으면 다음 모델로
      if (r.status === 429) return { error: 'quota' };
      if (r.status === 400 || r.status === 403) return { error: 'bad_key', detail: d?.error?.message };
      continue;
    }
    const text = (d?.candidates?.[0]?.content?.parts || []).map((p: { text?: string }) => p.text || '').join('');
    try {
      const o = JSON.parse(text);
      if (o?.script) return { title: String(o.title || place).slice(0, 60), script: String(o.script).trim().slice(0, 6000), model };
    } catch { if (text.trim()) return { title: place, script: text.trim().slice(0, 6000), model }; }
    last = 'empty';
  }
  return { error: 'ai_failed', detail: last };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { tour_id, input, lang } = await req.json();
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 이 원정의 지도자만 쓸 수 있음 (사용량 보호)
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: who } = await admin.auth.getUser(jwt);
    if (!who?.user) return json({ error: 'not_signed_in' });
    const { data: tour } = await admin.from('tour_tours').select('id').eq('id', tour_id).eq('owner_id', who.user.id).maybeSingle();
    if (!tour) return json({ error: 'not_owner' });

    const raw = String(input || '').trim().slice(0, 2000);
    if (!raw) return json({ error: 'empty' });
    let place = raw;
    const link = raw.match(/https?:\/\/\S+/)?.[0];
    if (link) {
      let full = link;
      if (/goo\.gl|g\.co|app\.goo/.test(link)) full = await expand(link).catch(() => link);
      const p = parseMaps(full);
      const rest = raw.replace(link, '').trim();
      place = p.name || rest || (p.lat ? `위도 ${p.lat}, 경도 ${p.lng} 에 있는 관광 명소` : '');
      if (!place) return json({ error: 'no_place' });
      if (p.name && p.lat) place = `${p.name} (위도 ${p.lat}, 경도 ${p.lng})`;
    }
    const out = await gemini(place, lang === 'en' ? 'en' : 'ko');
    return json({ place, ...out });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
