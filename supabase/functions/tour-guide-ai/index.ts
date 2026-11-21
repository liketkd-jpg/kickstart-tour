// KICKSTART UP 원정 — AI 관광 해설 만들기 (Supabase Edge Function 이름: tour-guide-ai)
// 지도자가 구글 지도 링크(또는 장소 이름)를 넣고 「AI 해설 만들기」를 누르면,
// 구글 제미나이(Gemini)가 학생용 이어폰 해설 글을 써서 돌려줍니다. 저장은 지도자가 읽어 본 뒤 직접 합니다.
// 필요한 비밀 값(Secrets): GEMINI_API_KEY  (선택: GEMINI_MODEL — 비워 두면 쓸 수 있는 flash 모델을 자동으로 고름)
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

const API = 'https://generativelanguage.googleapis.com/v1beta';

// 이 열쇠로 쓸 수 있는 제미나이 모델 목록에서 글쓰기용 flash 모델을 골라 냄 (모델 이름이 바뀌어도 자동으로 따라감)
async function pickModels(key: string): Promise<{ models: string[]; err?: string }> {
  const fixed = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-3-flash-preview', 'gemini-2.0-flash'];
  const want = Deno.env.get('GEMINI_MODEL');
  try {
    const r = await fetch(`${API}/models?pageSize=200`, { headers: { 'x-goog-api-key': key }, signal: AbortSignal.timeout(15000) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { models: [], err: `${r.status} ${d?.error?.status || ''} ${(d?.error?.message || '').slice(0, 120)}` };
    const names: string[] = (d.models || [])
      .filter((m: { supportedGenerationMethods?: string[] }) => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map((m: { name: string }) => m.name.replace(/^models\//, ''))
      .filter((n: string) => /flash/.test(n) && !/lite|image|tts|audio|live|embed|vision|thinking-exp|native|8b/.test(n));
    const score = (n: string) => {
      const v = parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/) || [])[1] || '0');
      const stable = /preview|exp/.test(n) ? 0 : 1;
      const latest = n === 'gemini-flash-latest' ? 1 : 0;
      return latest * 1000 + stable * 100 + v;
    };
    names.sort((x, y) => score(y) - score(x));
    return { models: [...new Set([want, ...names, ...fixed].filter(Boolean) as string[])] };
  } catch (e) {
    return { models: [...new Set([want, ...fixed].filter(Boolean) as string[])], err: 'list ' + String(e).slice(0, 80) };
  }
}

async function gemini(place: string, lang: string) {
  const key = (Deno.env.get('GEMINI_API_KEY') || '').trim();
  if (!key) return { error: 'no_key' };
  const { models, err } = await pickModels(key);
  if (!models.length) {
    if (/^(400|401|403)/.test(err || '')) return { error: 'bad_key', detail: err };
    return { error: 'ai_failed', detail: err };
  }
  const notes: string[] = err ? [err] : [];
  let quota = false;
  for (const model of models.slice(0, 5)) {
    for (const jsonMode of [true, false]) {
      const cfg: Record<string, unknown> = { temperature: 0.6, maxOutputTokens: 16384 };
      if (jsonMode) {
        cfg.responseMimeType = 'application/json';
        cfg.responseSchema = { type: 'OBJECT', properties: { title: { type: 'STRING' }, script: { type: 'STRING' } }, required: ['title', 'script'] };
      }
      const prompt = PROMPT(place, lang) + (jsonMode ? '' : (lang === 'en' ? ' Put only the title on the first line, then the script.' : ' 첫 줄에는 장소 이름만 쓰고, 다음 줄부터 해설을 써 줘.'));
      let r: Response;
      try {
        r = await fetch(`${API}/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: cfg }),
          signal: AbortSignal.timeout(50000),
        });
      } catch (e) { notes.push(`${model}: ${String(e).slice(0, 60)}`); break; }
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        const msg = `${model}: ${r.status} ${(d?.error?.message || '').slice(0, 100)}`;
        notes.push(msg);
        if (r.status === 401 || (r.status === 400 && /api key|API_KEY/i.test(d?.error?.message || '')) || (r.status === 403 && /key|permission|denied/i.test(d?.error?.message || ''))) return { error: 'bad_key', detail: msg };
        if (r.status === 429) { quota = true; break; }           // 이 모델 사용량 끝 → 다음 모델
        if (r.status === 400 && jsonMode) continue;                // 설정이 안 맞으면 일반 글 방식으로 다시
        break;                                                      // 404·500·503 → 다음 모델
      }
      const c = d?.candidates?.[0];
      const text = (c?.content?.parts || []).filter((p: { thought?: boolean }) => !p.thought).map((p: { text?: string }) => p.text || '').join('').trim();
      if (!text) { notes.push(`${model}: empty ${c?.finishReason || d?.promptFeedback?.blockReason || ''}`); if (jsonMode) continue; break; }
      if (jsonMode) {
        try {
          const o = JSON.parse(text);
          if (o?.script) return { title: String(o.title || place).slice(0, 60), script: String(o.script).trim().slice(0, 6000), model };
        } catch { /* 일반 글 방식으로 다시 */ }
        notes.push(`${model}: bad json ${c?.finishReason || ''}`);
        continue;
      }
      const lines = text.replace(/^[#*\s]+/, '').split('\n');
      const title = lines[0].replace(/[#*「」"]/g, '').trim();
      const script = lines.slice(1).join('\n').replace(/[#*]/g, '').trim();
      return { title: (script ? title : place).slice(0, 60), script: (script || text).slice(0, 6000), model };
    }
  }
  return { error: quota ? 'quota' : 'ai_failed', detail: notes.slice(-4).join(' | ').slice(0, 400) };
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
