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

type Task = { prompt: string; plainHint: string; schema: unknown; fromJson: (o: any) => Record<string, unknown> | null; fromText: (t: string) => Record<string, unknown> | null };

function guideTask(place: string, lang: string): Task {
  return {
    prompt: PROMPT(place, lang),
    plainHint: lang === 'en' ? ' Put only the title on the first line, then the script.' : ' 첫 줄에는 장소 이름만 쓰고, 다음 줄부터 해설을 써 줘.',
    schema: { type: 'OBJECT', properties: { title: { type: 'STRING' }, script: { type: 'STRING' } }, required: ['title', 'script'] },
    fromJson: (o) => o?.script ? { title: String(o.title || place).slice(0, 60), script: String(o.script).trim().slice(0, 6000) } : null,
    fromText: (text) => {
      const lines = text.replace(/^[#*\s]+/, '').split('\n');
      const title = lines[0].replace(/[#*「」"]/g, '').trim();
      const script = lines.slice(1).join('\n').replace(/[#*]/g, '').trim();
      return { title: (script ? title : place).slice(0, 60), script: (script || text).slice(0, 6000) };
    },
  };
}

// 관광 명소 / 가성비 식당 다섯 곳 추천
const FOOD: Record<string, string> = { local: '그 지역 전통·현지 음식', korean: '한식', chinese: '중식', asian: '아시아 음식(일식·베트남·태국 등)', quick: '빠르고 싼 한 끼(빵집·푸드코트·패스트푸드 등)', any: '종류 상관없이' };
function placesTask(city: string, kind: string, food: string, lang: string): Task {
  const en = lang === 'en';
  const what = kind === 'food'
    ? (en ? `5 good-value restaurants (${food}) that a group of 15 Korean students and leaders could visit, cheap to mid-price, well reviewed, near central/tourist areas`
          : `${FOOD[food] || FOOD.any} 식당 가운데 학생·지도자 15명 단체가 가기 좋은 가성비 좋은 곳 5곳 (싸거나 보통 가격, 평이 좋은 곳, 시내·관광지 가까운 곳)`)
    : (en ? '5 must-see tourist attractions for a Korean youth taekwondo demonstration team' : '중고등학생 태권도 시범단이 꼭 가 볼 만한 대표 관광 명소 5곳');
  const prompt = en
    ? `City: ${city}. Recommend ${what}. Use only real places you are confident still exist; prefer long-established, well-known places. For each give: name (common English name), local (name in local language as on Google Maps), area (district), address (street address if confident, else empty), desc (one or two short sentences: what it is / what to order or see), price (e.g. "€", "€€", "free", or entry fee), tip (one short practical tip). Answer in English.`
    : `도시: ${city}. ${what}을 추천해 줘. 지금도 있다고 확신하는 실제 장소만, 오래되고 잘 알려진 곳 위주로. 각 곳마다 name(한국어 이름), local(구글 지도에 나오는 현지어/영어 이름), area(동네·구역), address(확실하면 거리 주소, 모르면 빈칸), desc(무엇인지·무엇을 먹거나 볼지 한두 문장), price(예: "€", "€€", "무료", 입장료), tip(짧은 실용 팁 하나)을 한국어로 써 줘.`;
  const item = { type: 'OBJECT', properties: { name: { type: 'STRING' }, local: { type: 'STRING' }, area: { type: 'STRING' }, address: { type: 'STRING' }, desc: { type: 'STRING' }, price: { type: 'STRING' }, tip: { type: 'STRING' } }, required: ['name', 'local', 'desc'] };
  const clean = (arr: any[]) => {
    const list = (Array.isArray(arr) ? arr : []).filter((x) => x && x.name).slice(0, 5).map((x) => {
      const o: Record<string, string> = {};
      for (const k of ['name', 'local', 'area', 'address', 'desc', 'price', 'tip']) o[k] = String(x[k] || '').slice(0, 300);
      return o;
    });
    return list.length ? { places: list } : null;
  };
  return {
    prompt,
    plainHint: en ? ' Reply with only a JSON array of 5 objects with those keys.' : ' 그 열쇠 이름을 가진 객체 5개짜리 JSON 배열만 답해 줘.',
    schema: { type: 'OBJECT', properties: { places: { type: 'ARRAY', items: item } }, required: ['places'] },
    fromJson: (o) => clean(Array.isArray(o) ? o : o?.places),
    fromText: (t) => { const m = t.match(/\[[\s\S]*\]/); if (!m) return null; try { return clean(JSON.parse(m[0])); } catch { return null; } },
  };
}

// 견학 일기 영어 번역 (책자용)
function translateTask(items: { id: string; cap?: string; seen?: string; felt?: string }[]): Task {
  const src = items.map((x) => ({ id: String(x.id), cap: String(x.cap || '').slice(0, 200), seen: String(x.seen || '').slice(0, 1000), felt: String(x.felt || '').slice(0, 2000) }));
  const ids = new Set(src.map((x) => x.id));
  const clean = (arr: any[]) => {
    const out = (Array.isArray(arr) ? arr : []).filter((x) => x && ids.has(String(x.id))).map((x) => ({ id: String(x.id), cap: String(x.cap || '').slice(0, 300), seen: String(x.seen || '').slice(0, 1500), felt: String(x.felt || '').slice(0, 3000) }));
    return out.length ? { items: out } : null;
  };
  return {
    prompt: 'Translate these travel-diary entries written in Korean by middle/high-school members of a Korean taekwondo demonstration team on a tour in Europe into natural, warm English for a printed photo book. Keep the student\'s voice and meaning; do not add facts. Keep proper nouns (places, Korean taekwondo terms) recognizable. Empty fields stay empty. Return the same ids.\n' + JSON.stringify(src),
    plainHint: ' Reply with only a JSON array of objects {id, cap, seen, felt}.',
    schema: { type: 'OBJECT', properties: { items: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, cap: { type: 'STRING' }, seen: { type: 'STRING' }, felt: { type: 'STRING' } }, required: ['id'] } } }, required: ['items'] },
    fromJson: (o) => clean(Array.isArray(o) ? o : o?.items),
    fromText: (t) => { const m = t.match(/\[[\s\S]*\]/); if (!m) return null; try { return clean(JSON.parse(m[0])); } catch { return null; } },
  };
}

async function gemini(task: Task) {
  const key = (Deno.env.get('GEMINI_API_KEY') || '').trim();
  if (!key) return { error: 'no_key' };
  const { models, err } = await pickModels(key);
  if (!models.length) {
    if (/^(400|401|403)/.test(err || '')) return { error: 'bad_key', detail: err };
    return { error: 'ai_failed', detail: err };
  }
  const notes: string[] = err ? [err] : [];
  let quota = false;
  const deadline = Date.now() + 110000; // 서버 시간 제한(150초) 안에 꼭 답하도록
  for (const model of models.slice(0, 3)) {
    for (const jsonMode of [true, false]) {
      const left = deadline - Date.now();
      if (left < 8000) { notes.push('timeout'); return { error: 'ai_failed', detail: notes.slice(-4).join(' | ').slice(0, 400) }; }
      const cfg: Record<string, unknown> = { temperature: 0.6, maxOutputTokens: 8192 };
      // 생각(thinking)을 짧게 해서 빨리 쓰게 함. 맞지 않는 모델이면 400 → 일반 방식으로 다시
      if (jsonMode) cfg.thinkingConfig = /gemini-[3-9]|latest/.test(model) ? { thinkingLevel: 'low' } : /2\.5/.test(model) ? { thinkingBudget: 0 } : undefined;
      if (!cfg.thinkingConfig) delete cfg.thinkingConfig;
      if (jsonMode) {
        cfg.responseMimeType = 'application/json';
        cfg.responseSchema = task.schema;
      }
      const prompt = task.prompt + (jsonMode ? '' : task.plainHint);
      let r: Response;
      try {
        r = await fetch(`${API}/models/${model}:generateContent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
          body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: cfg }),
          signal: AbortSignal.timeout(Math.min(45000, left - 3000)),
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
          const got = task.fromJson(JSON.parse(text));
          if (got) return { ...got, model };
        } catch { /* 일반 글 방식으로 다시 */ }
        notes.push(`${model}: bad json ${c?.finishReason || ''}`);
        continue;
      }
      const got = task.fromText(text);
      if (got) return { ...got, model };
      notes.push(`${model}: bad text`);
      break;
    }
  }
  return { error: quota ? 'quota' : 'ai_failed', detail: notes.slice(-4).join(' | ').slice(0, 400) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  try {
    const { tour_id, input, lang, mode, city, kind, food, items } = await req.json();
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // 이 원정의 지도자만 쓸 수 있음 (사용량 보호)
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: who } = await admin.auth.getUser(jwt);
    if (!who?.user) return json({ error: 'not_signed_in' });
    const { data: tour } = await admin.from('tour_tours').select('id').eq('id', tour_id).eq('owner_id', who.user.id).maybeSingle();
    if (!tour) return json({ error: 'not_owner' });

    if (mode === 'translate') {
      const list = Array.isArray(items) ? items.slice(0, 25) : [];
      if (!list.length) return json({ error: 'empty' });
      return json(await gemini(translateTask(list)));
    }
    if (mode === 'places') {
      const c = String(city || '').trim().slice(0, 80);
      if (!c) return json({ error: 'empty' });
      const out = await gemini(placesTask(c, kind === 'food' ? 'food' : 'sight', String(food || 'any'), lang === 'en' ? 'en' : 'ko'));
      return json({ city: c, ...out });
    }

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
    const out = await gemini(guideTask(place, lang === 'en' ? 'en' : 'ko'));
    return json({ place, ...out });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
