-- Private drafts and explicit public snapshots. Run in Supabase SQL editor.
begin;
create table if not exists public.formation_tatari_catalog(unit_id integer not null,tier integer not null check(tier between 1 and 4),primary key(unit_id,tier));
alter table public.formation_tatari_catalog enable row level security;
revoke all on public.formation_tatari_catalog from public,anon,authenticated;
insert into public.formation_tatari_catalog(unit_id,tier) values (1,1),(1,2),(2,1),(2,2),(3,1),(3,2),(4,1),(4,2),(5,1),(5,2),(6,1),(6,2),(7,1),(7,2),(8,1),(8,2),(9,1),(9,2),(10,1),(10,2),(11,1),(11,2),(11,3),(11,4),(12,1),(12,2),(12,3),(12,4),(13,1),(13,2),(13,3),(13,4),(14,1),(14,2),(14,3),(14,4),(15,1),(15,2),(15,3),(15,4),(16,1),(16,2),(16,3),(16,4),(17,1),(17,2),(17,3),(17,4),(18,1),(18,2),(18,3),(18,4),(19,1),(19,2),(19,3),(19,4),(20,1),(20,2),(20,3),(20,4),(21,1),(21,2),(21,3),(21,4),(22,1),(22,2),(22,3),(22,4),(23,1),(23,2),(23,3),(23,4),(24,1),(24,2),(24,3),(24,4),(25,1),(25,2),(25,3),(25,4),(26,1),(26,2),(26,3),(26,4),(27,1),(27,2),(27,3),(27,4),(28,1),(28,2),(28,3),(28,4),(29,1),(29,2),(29,3),(29,4),(30,1),(30,2),(30,3),(30,4),(31,1),(31,2),(31,3),(31,4),(32,1),(32,2),(32,3),(32,4),(33,1),(33,2),(33,3),(33,4),(34,1),(34,2),(34,3),(34,4),(35,1),(35,2),(35,3),(35,4),(36,1),(36,2),(36,3),(36,4),(37,1),(37,2),(37,3),(37,4),(38,1),(38,2),(38,3),(38,4),(39,1),(39,2),(39,3),(39,4),(40,1),(40,2),(40,3),(40,4),(41,1),(41,2),(41,3),(41,4),(42,1),(42,2),(42,3),(42,4),(43,1),(43,2),(43,3),(43,4),(44,1),(44,2),(44,3),(44,4),(45,1),(45,2),(45,3),(45,4),(46,1),(46,2),(46,3),(46,4),(47,1),(47,2),(47,3),(47,4),(48,1),(48,2),(48,3),(48,4),(49,1),(49,2),(49,3),(49,4),(50,1),(50,2),(50,3),(50,4),(51,1),(51,2),(51,3),(51,4),(52,1),(52,2),(52,3),(52,4),(53,1),(53,2),(53,3),(53,4),(54,1),(54,2),(54,3),(54,4),(55,1),(55,2),(55,3),(55,4),(56,1),(56,2),(56,3),(56,4),(57,1),(57,2),(57,3),(57,4),(58,1),(58,2),(58,3),(58,4),(59,1),(59,2),(59,3),(59,4),(60,1),(60,2),(60,3),(60,4),(61,1),(61,2),(61,3),(61,4),(62,1),(62,2),(62,3),(62,4),(63,1),(63,2),(63,3),(63,4),(64,1),(64,2),(64,3),(64,4),(65,1),(65,2),(65,3),(65,4),(66,1),(66,2),(66,3),(66,4),(69,1),(69,2),(69,3),(69,4) on conflict do nothing;
create table if not exists public.user_formations(
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 80),draft_payload jsonb not null,
 published_name text,published_payload jsonb,published_at timestamptz,
 revision integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((published_payload is null and published_name is null and published_at is null) or (published_payload is not null and published_name is not null and published_at is not null))
);
alter table public.user_formations enable row level security;
revoke all on public.user_formations from public,anon,authenticated;
create index if not exists user_formations_owner_idx on public.user_formations(owner_id,updated_at desc);
create index if not exists user_formations_published_idx on public.user_formations(published_at desc) where published_payload is not null;

create or replace function public.formation_validate_v1(p jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
declare gm text; mode text; area integer; cap integer; c jsonb; s jsonb; k text; uid integer; form_tier integer; lev integer; player integer; seen text[]='{}'; count1 integer=0; count2 integer=0; marker text;
begin
 if jsonb_typeof(p)<>'object' or octet_length(p::text)>40000 or coalesce(p->>'schema','')<>'1' then raise exception 'Invalid formation payload';end if;
 gm=p->>'gameMode';mode=p->>'mode';
 if gm not in ('stage','boss','horde','dojo','goldrush','other') or mode not in ('solo','duo') or gm is null or mode is null or (mode='duo' and gm<>'horde') then raise exception 'Invalid formation mode';end if;
 area=case gm when 'horde' then 36 when 'dojo' then 12 else 25 end;cap=case gm when 'horde' then 10 when 'dojo' then 5 else 15 end;
 if jsonb_typeof(p->'cells') is distinct from 'array' or jsonb_array_length(p->'cells')<>area then raise exception 'Invalid board size';end if;
 for c in select value from jsonb_array_elements(p->'cells') loop
  if c='null'::jsonb then continue;end if;
  if jsonb_typeof(c)<>'object' or coalesce(c->>'key','')!~'^\d+-[1-4]$' or coalesce(c->>'level','')!~'^[1-7]$' or coalesce(c->>'player','')!~'^[12]$' then raise exception 'Invalid unit entry';end if;
  k=c->>'key';uid=split_part(k,'-',1)::integer;form_tier=split_part(k,'-',2)::integer;player=(c->>'player')::integer;
  if not exists(select 1 from public.formation_tatari_catalog t where t.unit_id=uid and t.tier=form_tier) or (mode='solo' and player<>1) then raise exception 'Unavailable Tatari or player';end if;
  marker=player::text||':'||uid::text;if marker=any(seen) then raise exception 'Evolution line duplicated for this player';end if;seen=array_append(seen,marker);
  if player=1 then count1=count1+1;else count2=count2+1;end if;
  if count1>cap or count2>cap then raise exception 'Formation limit exceeded';end if;
 end loop;
 if p ? 'context' and jsonb_typeof(p->'context') is distinct from 'object' then raise exception 'Invalid mode context';end if;
 if p->'context' ? 'difficulty' and coalesce(p->'context'->>'difficulty','')!~'^[1-4]$' then raise exception 'Horde difficulty must be 1-4';end if;
 if jsonb_typeof(p->'steps') is distinct from 'array' or jsonb_array_length(p->'steps')>100 then raise exception 'Invalid priority plan';end if;
 for s in select value from jsonb_array_elements(p->'steps') loop
  if jsonb_typeof(s)<>'object' or coalesce(s->>'player','')!~'^[12]$' or (mode='solo' and s->>'player'<>'1') or coalesce(s->>'target','')!~'^[0-7]$' or char_length(coalesce(s->>'note',''))>180 then raise exception 'Invalid priority step';end if;
  if jsonb_typeof(s->'keys') is distinct from 'array' or jsonb_array_length(s->'keys') not between 1 and 10 then raise exception 'Invalid priority units';end if;
  for k in select jsonb_array_elements_text(s->'keys') loop
   if k!~'^\d+-[1-4]$' then raise exception 'Invalid priority key';end if;
   if not exists(select 1 from public.formation_tatari_catalog t where t.unit_id=split_part(k,'-',1)::integer and t.tier=split_part(k,'-',2)::integer) then raise exception 'Unavailable priority unit';end if;
  end loop;
 end loop;
 if char_length(coalesce(p->>'shareAuthor',''))>80 or char_length(coalesce(p->>'shareNotes',''))>500 then raise exception 'Share text too long';end if;
 if p ? 'chips' then
  if jsonb_typeof(p->'chips')<>'array' or jsonb_array_length(p->'chips')>6 then raise exception 'Invalid chips';end if;
  for c in select value from jsonb_array_elements(p->'chips') loop
   if coalesce(c->>'id','')!~'^[0-9]{1,2}$' or (c->>'id')::integer not between 1 and 49 or coalesce(c->>'player','')!~'^[12]$' or (mode='solo' and c->>'player'<>'1') then raise exception 'Invalid chip';end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(p->'chips') as entries(value) group by value->>'player' having count(*)>3) or exists(select 1 from jsonb_array_elements(p->'chips') as entries(value) group by value->>'player',value->>'id' having count(*)>1) then raise exception 'Select up to three distinct chips per player';end if;
 end if;
 if p ? 'zobos' then
  if jsonb_typeof(p->'zobos')<>'array' or jsonb_array_length(p->'zobos')>area*2 then raise exception 'Invalid Zobo field';end if;
  for c in select value from jsonb_array_elements(p->'zobos') loop
   if coalesce(c->>'zone','') not in ('grey','green') or coalesce(c->>'index','')!~'^[0-9]{1,2}$' or (c->>'index')::integer>=area or coalesce(c->>'id','')!~'^[12][0-9]{3}$' then raise exception 'Invalid Zobo';end if;
   if c->>'zone'='green' and p->'cells'->((c->>'index')::integer)<>'null'::jsonb then raise exception 'Zobo tile occupied';end if;
  end loop;
  if exists(select 1 from jsonb_array_elements(p->'zobos') as entries(value) group by value->>'id' having count(*)>1) or exists(select 1 from jsonb_array_elements(p->'zobos') as entries(value) group by value->>'zone',value->>'index' having count(*)>1) then raise exception 'Duplicate Zobo placement';end if;
 end if;
end;$$;
revoke all on function public.formation_validate_v1(jsonb) from public,anon,authenticated;

create or replace function public.formation_save_v1(p_id uuid,p_revision integer,p_name text,p_payload jsonb,p_publish boolean default false) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid=auth.uid();r public.user_formations; title text=btrim(p_name);
begin
 if u is null then raise exception 'Sign in to save formations';end if;
 if title is null or char_length(title) not between 1 and 80 then raise exception 'Formation name must be 1-80 characters';end if;
 perform public.formation_validate_v1(p_payload);
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 if p_id is null then
  if (select count(*) from public.user_formations where owner_id=u)>=100 then raise exception 'Account formation limit reached';end if;
  insert into public.user_formations(owner_id,name,draft_payload,published_name,published_payload,published_at)
  values(u,title,p_payload,case when p_publish then title end,case when p_publish then p_payload end,case when p_publish then now() end) returning * into r;
 else
  update public.user_formations set name=title,draft_payload=p_payload,revision=revision+1,updated_at=now(),
   published_name=case when p_publish then title else published_name end,published_payload=case when p_publish then p_payload else published_payload end,published_at=case when p_publish then now() else published_at end
  where id=p_id and owner_id=u and revision=p_revision returning * into r;
  if not found then raise exception 'Formation changed or is unavailable. Reload before saving';end if;
 end if;
 return jsonb_build_object('id',r.id,'revision',r.revision,'published',r.published_payload is not null);
end;$$;

create or replace function public.formation_list_mine_v1() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in to view saved formations';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'payload',draft_payload,'revision',revision,'published',published_payload is not null,'updated_at',updated_at) order by updated_at desc) from public.user_formations where owner_id=auth.uid()),'[]'::jsonb);
end;$$;

create or replace function public.formation_list_public_v1() returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',published_name,'payload',published_payload,'published_at',published_at) order by published_at desc),'[]'::jsonb)
 from (select id,published_name,published_payload,published_at from public.user_formations where published_payload is not null order by published_at desc limit 100) f;
$$;

create or replace function public.formation_read_v1(p_id uuid,p_private boolean default false) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.user_formations;
begin
 if p_private then
  if auth.uid() is null then raise exception 'Sign in to open a saved draft';end if;
  select * into r from public.user_formations where id=p_id and owner_id=auth.uid();
 else select * into r from public.user_formations where id=p_id and published_payload is not null;end if;
 if not found then raise exception 'Formation unavailable';end if;
 return jsonb_build_object('id',r.id,'name',case when p_private then r.name else r.published_name end,'payload',case when p_private then r.draft_payload else r.published_payload end,'revision',case when p_private then r.revision else null end,'published',r.published_payload is not null);
end;$$;

create or replace function public.formation_manage_v1(p_id uuid,p_revision integer,p_action text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in to manage formations';end if;
 if p_action='unpublish' then
  update public.user_formations set published_name=null,published_payload=null,published_at=null,revision=revision+1,updated_at=now() where id=p_id and owner_id=auth.uid() and revision=p_revision;
 elsif p_action='delete' then delete from public.user_formations where id=p_id and owner_id=auth.uid() and revision=p_revision;
 else raise exception 'Unknown formation action';end if;
 if not found then raise exception 'Formation changed or is unavailable';end if;
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.formation_save_v1(uuid,integer,text,jsonb,boolean),public.formation_list_mine_v1(),public.formation_list_public_v1(),public.formation_read_v1(uuid,boolean),public.formation_manage_v1(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.formation_save_v1(uuid,integer,text,jsonb,boolean),public.formation_list_mine_v1(),public.formation_manage_v1(uuid,integer,text) to authenticated;
grant execute on function public.formation_list_public_v1(),public.formation_read_v1(uuid,boolean) to anon,authenticated;
commit;
