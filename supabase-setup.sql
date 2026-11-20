-- KICKSTART UP 원정 앱 · Supabase 설정 (기존 대회 접수 프로젝트에 함께 넣는 판)
-- 대회 접수 자료와 섞이지 않게 모든 표·기능 이름이 tour_ 로 시작합니다.
-- 기존 표·로그인 설정은 건드리지 않습니다. 여러 번 실행해도 괜찮습니다.
-- 사용법: Supabase 왼쪽 메뉴 SQL Editor → New query → 이 글 전체를 붙여 넣고 Run.

create extension if not exists pgcrypto;

-- ───────── 표 ─────────
create table if not exists public.tour_tours (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  code text not null unique,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.tour_members (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_tours(id) on delete cascade,
  token uuid unique default gen_random_uuid(),   -- 단원 휴대폰 열쇠 (없으면 휴대폰 없이 추가한 단원)
  name text not null,
  grp text not null default '단원',
  last_lat double precision,
  last_lng double precision,
  last_loc_at timestamptz,
  joined_at timestamptz not null default now()
);

create table if not exists public.tour_stops (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_tours(id) on delete cascade,
  date date not null,
  time text not null default '',
  type text not null default '기타',
  title text not null,
  place text not null default '',
  city text not null default '',
  contact text not null default '',
  memo text not null default '',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tour_notices (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_tours(id) on delete cascade,
  date date not null default current_date,
  time text not null default '',
  place text not null default '',
  link text not null default '',
  message text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.tour_acks (
  notice_id uuid not null references public.tour_notices(id) on delete cascade,
  member_id uuid not null references public.tour_members(id) on delete cascade,
  tour_id uuid not null references public.tour_tours(id) on delete cascade,
  seen_at timestamptz not null default now(),
  primary key (notice_id, member_id)
);

create table if not exists public.tour_checks (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_tours(id) on delete cascade,
  title text not null,
  closed boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.tour_check_marks (
  check_id uuid not null references public.tour_checks(id) on delete cascade,
  member_id uuid not null references public.tour_members(id) on delete cascade,
  tour_id uuid not null references public.tour_tours(id) on delete cascade,
  by_leader boolean not null default false,
  marked_at timestamptz not null default now(),
  primary key (check_id, member_id)
);

create table if not exists public.tour_guides (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_tours(id) on delete cascade,
  stop_id uuid references public.tour_stops(id) on delete set null,
  title text not null,
  script text not null default '',
  source_url text not null default '',
  live_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists tour_guides_tour on public.tour_guides(tour_id);

create table if not exists public.tour_journal (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_tours(id) on delete cascade,
  date date not null,
  memo text not null default '',
  photos text[] not null default '{}',
  updated_at timestamptz not null default now(),
  unique (tour_id, date)
);
create index if not exists tour_members_tour on public.tour_members(tour_id);
create index if not exists tour_stops_tour on public.tour_stops(tour_id, date);
create index if not exists tour_notices_tour on public.tour_notices(tour_id, created_at desc);
create index if not exists tour_acks_tour on public.tour_acks(tour_id);
create index if not exists tour_checks_tour on public.tour_checks(tour_id, created_at desc);
create index if not exists tour_marks_tour on public.tour_check_marks(tour_id);

-- ───────── 지도자 확인 도우미 ─────────
create or replace function public.tour_is_owner(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from tour_tours where id = t and owner_id = auth.uid());
$$;

-- ───────── 보안 규칙: 표는 지도자(원정 주인)만 직접 읽고 씁니다 ─────────
alter table public.tour_tours enable row level security;
alter table public.tour_members enable row level security;
alter table public.tour_stops enable row level security;
alter table public.tour_notices enable row level security;
alter table public.tour_acks enable row level security;
alter table public.tour_checks enable row level security;
alter table public.tour_check_marks enable row level security;
alter table public.tour_guides enable row level security;
alter table public.tour_journal enable row level security;

drop policy if exists tour_tours_owner on public.tour_tours;
create policy tour_tours_owner on public.tour_tours for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());

drop policy if exists tour_members_owner on public.tour_members;
create policy tour_members_owner on public.tour_members for all to authenticated
  using (public.tour_is_owner(tour_id)) with check (public.tour_is_owner(tour_id));

drop policy if exists tour_stops_owner on public.tour_stops;
create policy tour_stops_owner on public.tour_stops for all to authenticated
  using (public.tour_is_owner(tour_id)) with check (public.tour_is_owner(tour_id));

drop policy if exists tour_notices_owner on public.tour_notices;
create policy tour_notices_owner on public.tour_notices for all to authenticated
  using (public.tour_is_owner(tour_id)) with check (public.tour_is_owner(tour_id));

drop policy if exists tour_acks_owner on public.tour_acks;
create policy tour_acks_owner on public.tour_acks for all to authenticated
  using (public.tour_is_owner(tour_id)) with check (public.tour_is_owner(tour_id));

drop policy if exists tour_checks_owner on public.tour_checks;
create policy tour_checks_owner on public.tour_checks for all to authenticated
  using (public.tour_is_owner(tour_id)) with check (public.tour_is_owner(tour_id));

drop policy if exists tour_journal_owner on public.tour_journal;
create policy tour_journal_owner on public.tour_journal for all to authenticated
  using (public.tour_is_owner(tour_id)) with check (public.tour_is_owner(tour_id));

drop policy if exists tour_guides_owner on public.tour_guides;
create policy tour_guides_owner on public.tour_guides for all to authenticated
  using (public.tour_is_owner(tour_id)) with check (public.tour_is_owner(tour_id));

drop policy if exists tour_marks_owner on public.tour_check_marks;
create policy tour_marks_owner on public.tour_check_marks for all to authenticated
  using (public.tour_is_owner(tour_id)) with check (public.tour_is_owner(tour_id));

-- ───────── 단원 기능: 로그인 없이 초대 번호로 받은 열쇠(token)로만 씁니다 ─────────
create or replace function public.tour_join(p_code text, p_name text, p_grp text)
returns json language plpgsql security definer set search_path = public as $$
declare t uuid; m tour_members;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'name_required'; end if;
  select id into t from tour_tours where code = upper(trim(p_code));
  if t is null then raise exception 'wrong_code'; end if;
  insert into tour_members (tour_id, name, grp)
  values (t, left(trim(p_name), 30), left(coalesce(nullif(trim(p_grp), ''), '단원'), 20))
  returning * into m;
  return json_build_object('token', m.token, 'tour_id', t);
end; $$;

create or replace function public.tour_student_state(p_token uuid)
returns json language plpgsql stable security definer set search_path = public as $$
declare m tour_members; t tour_tours;
begin
  select * into m from tour_members where token = p_token;
  if m.id is null then raise exception 'bad_token'; end if;
  select * into t from tour_tours where id = m.tour_id;
  return json_build_object(
    'tour', json_build_object('id', t.id, 'name', t.name, 'code', t.code, 'start_date', t.start_date, 'end_date', t.end_date),
    'me', json_build_object('id', m.id, 'name', m.name, 'grp', m.grp),
    'stops', coalesce((select json_agg(s order by s.date, s.time) from (select id, date, time, type, title, place, city, contact, memo, done from tour_stops where tour_id = t.id) s), '[]'::json),
    'notices', coalesce((select json_agg(n order by n.created_at desc) from (select id, date, time, place, link, message, created_at from tour_notices where tour_id = t.id order by created_at desc limit 60) n), '[]'::json),
    'acks', coalesce((select json_agg(a) from (select notice_id, member_id, seen_at from tour_acks where member_id = m.id) a), '[]'::json),
    'checks', coalesce((select json_agg(c order by c.created_at desc) from (select id, title, closed, created_at from tour_checks where tour_id = t.id order by created_at desc limit 20) c), '[]'::json),
    'marks', coalesce((select json_agg(k) from (select check_id, member_id, marked_at from tour_check_marks where member_id = m.id) k), '[]'::json),
    'guides', coalesce((select json_agg(g order by g.created_at desc) from (select id, stop_id, title, script, source_url, live_at, created_at from tour_guides where tour_id = t.id order by created_at desc limit 50) g), '[]'::json),
    'journal', coalesce((select json_agg(j order by j.date) from (select id, date, memo, photos from tour_journal where tour_id = t.id) j), '[]'::json)
  );
end; $$;

create or replace function public.tour_ack(p_token uuid, p_notice uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into tour_acks (notice_id, member_id, tour_id)
  select n.id, m.id, n.tour_id from tour_notices n
  join tour_members m on m.tour_id = n.tour_id and m.token = p_token
  where n.id = p_notice
  on conflict do nothing;
end; $$;

create or replace function public.tour_check_in(p_token uuid, p_check uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  insert into tour_check_marks (check_id, member_id, tour_id, by_leader)
  select c.id, m.id, c.tour_id, false from tour_checks c
  join tour_members m on m.tour_id = c.tour_id and m.token = p_token
  where c.id = p_check and not c.closed
  on conflict do nothing;
end; $$;

create or replace function public.tour_share_location(p_token uuid, p_lat double precision, p_lng double precision)
returns void language plpgsql security definer set search_path = public as $$
begin
  update tour_members set last_lat = p_lat, last_lng = p_lng, last_loc_at = now() where token = p_token;
end; $$;

revoke all on function public.tour_join(text, text, text) from public;
revoke all on function public.tour_student_state(uuid) from public;
revoke all on function public.tour_ack(uuid, uuid) from public;
revoke all on function public.tour_check_in(uuid, uuid) from public;
revoke all on function public.tour_share_location(uuid, double precision, double precision) from public;
grant execute on function public.tour_join(text, text, text) to anon, authenticated;
grant execute on function public.tour_student_state(uuid) to anon, authenticated;
grant execute on function public.tour_ack(uuid, uuid) to anon, authenticated;
grant execute on function public.tour_check_in(uuid, uuid) to anon, authenticated;
grant execute on function public.tour_share_location(uuid, double precision, double precision) to anon, authenticated;

-- ───────── 지도자 화면 실시간 반영 ─────────
do $$
declare t text;
begin
  foreach t in array array['tour_members','tour_stops','tour_notices','tour_acks','tour_checks','tour_check_marks','tour_guides','tour_journal'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ───────── 활동 일지 사진 저장 공간 ─────────
-- 사진 주소는 아무도 짐작할 수 없는 긴 이름으로 만들어집니다. 올리기·지우기는 그 원정의 지도자만 할 수 있습니다.
insert into storage.buckets (id, name, public) values ('tour-photos', 'tour-photos', true)
on conflict (id) do nothing;

create or replace function public.tour_path_owner(p text) returns boolean
language plpgsql stable security definer set search_path = public as $$
declare t uuid;
begin
  begin t := split_part(p, '/', 1)::uuid; exception when others then return false; end;
  return exists (select 1 from tour_tours where id = t and owner_id = auth.uid());
end; $$;

drop policy if exists tour_photos_insert on storage.objects;
create policy tour_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'tour-photos' and public.tour_path_owner(name));
drop policy if exists tour_photos_delete on storage.objects;
create policy tour_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'tour-photos' and public.tour_path_owner(name));
