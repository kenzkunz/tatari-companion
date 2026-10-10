-- Apply after migrations 001-007. Listings and UID access are authenticated only.
begin;
create table public.event_match_definitions(event_name text primary key,anchor_start timestamptz not null,capacity integer not null check(capacity in (3,4)));
insert into public.event_match_definitions(event_name,anchor_start,capacity) values ('Treasure Hunt','2026-09-24T00:00:00+00:00',4);
insert into public.event_match_definitions(event_name,anchor_start,capacity) values ('Raft Race','2026-09-27T00:00:00+00:00',3);
insert into public.event_match_definitions(event_name,anchor_start,capacity) values ('Zobo Shooter','2026-09-30T00:00:00+00:00',3);
insert into public.event_match_definitions(event_name,anchor_start,capacity) values ('Cozy Farm','2026-10-03T00:00:00+00:00',3);
insert into public.event_match_definitions(event_name,anchor_start,capacity) values ('Fishing Contest','2026-10-06T00:00:00+00:00',3);
alter table public.event_match_definitions enable row level security;
revoke all on public.event_match_definitions from public,anon,authenticated;
create table public.event_match_plans(
 user_id uuid not null references public.profiles(user_id) on delete cascade,
 event_name text not null references public.event_match_definitions(event_name),event_start timestamptz not null,
 budget_min integer not null check(budget_min between 0 and 1000000),budget_max integer not null check(budget_max between budget_min and 1000000),
 playing_style text not null check(playing_style in ('casual','competitive','glitter')),open_slots integer not null check(open_slots between 1 and 4),
 min_keys integer not null check(min_keys between 1 and 8),uid_consent boolean not null check(uid_consent),updated_at timestamptz not null default now(),
 primary key(user_id,event_name,event_start));
create index event_match_active_idx on public.event_match_plans(event_name,event_start,updated_at desc);
alter table public.event_match_plans enable row level security;
revoke all on public.event_match_plans from public,anon,authenticated;
create function public.expire_event_match_plans() returns void language sql security definer set search_path=pg_catalog as $$delete from public.event_match_plans where event_start<=now();$$;
revoke all on function public.expire_event_match_plans() from public,anon,authenticated;grant execute on function public.expire_event_match_plans() to service_role;
create function public.my_event_match_plans() returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare result jsonb;begin
 if auth.uid() is null then raise exception 'Login required';end if;perform public.expire_event_match_plans();
 select coalesce(jsonb_agg(jsonb_build_object('event',event_name,'start',extract(epoch from event_start)*1000,'min',budget_min,'max',budget_max,'goal',playing_style,'slots',open_slots,'keys',min_keys)),'[]'::jsonb) into result from public.event_match_plans where user_id=auth.uid() and event_start>now();return result;end $$;
create function public.save_event_match_plan(p_event text,p_start timestamptz,p_min integer,p_max integer,p_style text,p_slots integer,p_keys integer,p_consent boolean) returns void language plpgsql security definer set search_path=pg_catalog as $$
declare def public.event_match_definitions;next_start timestamptz;begin
 if auth.uid() is null then raise exception 'Login required';end if;
 if p_consent is distinct from true then raise exception 'UID sharing consent required';end if;
 if not exists(select 1 from public.profiles where user_id=auth.uid() and game_id<>'') then raise exception 'Set your game UID in Account before listing';end if;
 select * into def from public.event_match_definitions where event_name=p_event;if not found then raise exception 'Unknown event';end if;
 next_start:=def.anchor_start+(floor(extract(epoch from (now()-def.anchor_start))/1296000)+1)*interval '15 days';
 if p_start is distinct from next_start or p_start<=now() then raise exception 'Event dates changed. Refresh and retry';end if;
 if p_slots is null or p_slots<1 or p_slots>def.capacity then raise exception 'Invalid open slots';end if;
 if p_event<>'Treasure Hunt' then p_keys:=1;end if;
 perform public.expire_event_match_plans();
 insert into public.event_match_plans values(auth.uid(),p_event,p_start,p_min,p_max,p_style,p_slots,p_keys,true,now())
 on conflict(user_id,event_name,event_start) do update set budget_min=excluded.budget_min,budget_max=excluded.budget_max,playing_style=excluded.playing_style,open_slots=excluded.open_slots,min_keys=excluded.min_keys,uid_consent=true,updated_at=now();end $$;
create function public.delist_event_match_plan(p_event text,p_start timestamptz) returns void language plpgsql security definer set search_path=pg_catalog as $$begin
 if auth.uid() is null then raise exception 'Login required';end if;delete from public.event_match_plans where user_id=auth.uid() and event_name=p_event and event_start=p_start;end $$;
create function public.find_event_matches(p_event text default null,p_styles text[] default array['casual','competitive','glitter'],p_offset integer default 0) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare result jsonb;begin
 if auth.uid() is null then raise exception 'Login required';end if;perform public.expire_event_match_plans();
 select coalesce(jsonb_agg(to_jsonb(t)),'[]'::jsonb) into result from (
 select other.user_id as id,other.event_name as event,extract(epoch from other.event_start)*1000 as start,p.display_name as name,other.budget_min as min,other.budget_max as max,other.playing_style as goal,other.open_slots as slots,other.min_keys as keys
 from public.event_match_plans mine join public.event_match_plans other on mine.event_name=other.event_name and mine.event_start=other.event_start join public.profiles p on p.user_id=other.user_id
 where mine.user_id=auth.uid() and other.user_id<>auth.uid() and mine.event_start>now() and other.uid_consent and p.game_id<>''
 and (p_event is null or mine.event_name=p_event) and other.playing_style=any(p_styles)
 and other.budget_max>=mine.budget_min and other.budget_min<=mine.budget_max
 and (mine.event_name<>'Treasure Hunt' or other.min_keys>=mine.min_keys)
 order by mine.event_start,abs((other.budget_min::bigint+other.budget_max)-(mine.budget_min::bigint+mine.budget_max)),other.updated_at desc,other.user_id
 limit 100 offset greatest(0,least(coalesce(p_offset,0),10000))) t;return result;end $$;
create function public.event_match_contact(p_partner uuid,p_event text,p_start timestamptz) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$declare result jsonb;begin
 if auth.uid() is null then raise exception 'Login required';end if;
 select jsonb_build_object('name',p.display_name,'uid',p.game_id,'min',other.budget_min,'max',other.budget_max,'goal',other.playing_style) into result
 from public.event_match_plans mine join public.event_match_plans other on mine.event_name=other.event_name and mine.event_start=other.event_start join public.profiles p on p.user_id=other.user_id
 where mine.user_id=auth.uid() and other.user_id=p_partner and other.user_id<>auth.uid() and mine.event_name=p_event and mine.event_start=p_start and p_start>now() and other.uid_consent and p.game_id<>''
 and other.budget_max>=mine.budget_min and other.budget_min<=mine.budget_max and (mine.event_name<>'Treasure Hunt' or other.min_keys>=mine.min_keys);
 if result is null then raise exception 'Listing is no longer available or compatible';end if;return result;end $$;
revoke all on function public.my_event_match_plans(),public.save_event_match_plan(text,timestamptz,integer,integer,text,integer,integer,boolean),public.delist_event_match_plan(text,timestamptz),public.find_event_matches(text,text[],integer),public.event_match_contact(uuid,text,timestamptz) from public,anon;
grant execute on function public.my_event_match_plans(),public.save_event_match_plan(text,timestamptz,integer,integer,text,integer,integer,boolean),public.delist_event_match_plan(text,timestamptz),public.find_event_matches(text,text[],integer),public.event_match_contact(uuid,text,timestamptz) to authenticated;
-- Physical deletion even without visitors. Supabase supports pg_cron; enable it in Database > Extensions first.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('expire-event-match-plans','* * * * *','select public.expire_event_match_plans();');
commit;
