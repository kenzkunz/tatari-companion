-- Tierlists: independent private drafts, published snapshots and likes. Requires 014.
begin;
create table if not exists public.user_tierlists(
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(char_length(name) between 1 and 80),draft_payload jsonb not null,
 published_name text,published_payload jsonb,published_at timestamptz,
 revision integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check((published_payload is null and published_name is null and published_at is null) or (published_payload is not null and published_name is not null and published_at is not null))
);
alter table public.user_tierlists enable row level security;
revoke all on public.user_tierlists from public,anon,authenticated;
create index if not exists user_tierlists_owner_idx on public.user_tierlists(owner_id,updated_at desc);
create index if not exists user_tierlists_published_idx on public.user_tierlists(published_at desc) where published_payload is not null;

create or replace function public.tierlist_validate_v1(p jsonb) returns void language plpgsql set search_path=public,pg_temp as $$
declare r jsonb; u jsonb; seen text[]='{}'; uid integer; tid integer; marker text; pt jsonb; key text;
begin
 if jsonb_typeof(p) is distinct from 'object' or octet_length(p::text)>60000 or coalesce(p->>'schema','')<>'1' then raise exception 'Invalid tierlist payload';end if;
 if coalesce(p->>'gameMode','') not in ('Horde','Arena','Boss','Custom') or coalesce(p->>'tier','')!~'^[0-4]$' then raise exception 'Invalid tierlist mode';end if;
 if jsonb_typeof(p->'title') is distinct from 'string' or char_length(p->>'title') not between 1 and 80 or char_length(coalesce(p->>'notes',''))>500 then raise exception 'Invalid tierlist text';end if;
 if jsonb_typeof(p->'rows') is distinct from 'array' then raise exception 'Invalid tierlist rows';end if;
 if jsonb_array_length(p->'rows') not between 1 and 20 then raise exception 'Tierlist requires 1–20 rows';end if;
 for r in select value from jsonb_array_elements(p->'rows') loop
  if jsonb_typeof(r) is distinct from 'object' or jsonb_typeof(r->'label') is distinct from 'string' or char_length(r->>'label') not between 1 and 16 or coalesce(r->>'color','')!~'^#[0-9a-fA-F]{6}$' or jsonb_typeof(r->'units') is distinct from 'array' then raise exception 'Invalid ranking row';end if;
  if jsonb_array_length(r->'units')>248 then raise exception 'Too many Tatari';end if;
  for u in select value from jsonb_array_elements(r->'units') loop
   if jsonb_typeof(u)='number' and u::text~'^[0-9]{1,2}$' then
    uid=(u::text)::integer;tid=greatest(1,(p->>'tier')::integer);marker=uid::text||'-'||tid::text;
   elsif jsonb_typeof(u)='string' and (u#>>'{}')~'^[0-9]{1,2}-[1-4]$' then
    marker=u#>>'{}';uid=split_part(marker,'-',1)::integer;tid=split_part(marker,'-',2)::integer;
   else raise exception 'Invalid Tatari';end if;
   if not exists(select 1 from public.formation_tatari_catalog where unit_id=uid and tier=tid) or marker=any(seen) then raise exception 'Unknown or duplicate Tatari';end if;
   seen=array_append(seen,marker);
  end loop;
 end loop;
 if p ? 'background' and coalesce(p->>'background','')!~'^#[0-9a-fA-F]{6}$' then raise exception 'Invalid background color';end if;
 if p ? 'view' and coalesce(p->>'view','') not in ('list','chart') then raise exception 'Invalid tierlist view';end if;
 if p ? 'chart' then
  if jsonb_typeof(p->'chart') is distinct from 'object' or jsonb_typeof(p->'chart'->'positions') is distinct from 'object' then raise exception 'Invalid chart';end if;
  foreach key in array array['left','right','top','bottom'] loop
   if jsonb_typeof(p->'chart'->key) is distinct from 'string' or char_length(p->'chart'->>key)>40 then raise exception 'Invalid axis label';end if;
  end loop;
  for key,pt in select * from jsonb_each(p->'chart'->'positions') loop
   if key!~'^[0-9]{1,2}-[1-4]$' then raise exception 'Invalid chart Tatari';end if;
   if not exists(select 1 from public.formation_tatari_catalog where unit_id=split_part(key,'-',1)::integer and tier=split_part(key,'-',2)::integer) then raise exception 'Unknown chart Tatari';end if;
   if jsonb_typeof(pt) is distinct from 'object' or jsonb_typeof(pt->'x') is distinct from 'number' or jsonb_typeof(pt->'y') is distinct from 'number' then raise exception 'Invalid coordinates';end if;
   if (pt->>'x')::numeric not between 0 and 100 or (pt->>'y')::numeric not between 0 and 100 then raise exception 'Invalid chart position';end if;
  end loop;
 end if;
end;$$;
revoke all on function public.tierlist_validate_v1(jsonb) from public,anon,authenticated;

create or replace function public.tierlist_save_v1(p_id uuid,p_revision integer,p_name text,p_payload jsonb,p_publish boolean default false) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid=auth.uid();r public.user_tierlists; title text=btrim(p_name);
begin
 if u is null then raise exception 'Sign in to save tierlists';end if;
 if title is null or char_length(title) not between 1 and 80 then raise exception 'Tierlist name must be 1-80 characters';end if;
 perform public.tierlist_validate_v1(p_payload);
 p_payload=jsonb_set(p_payload,'{shareAuthor}',to_jsonb(coalesce((select display_name from public.profiles where user_id=u),'Player')));
 perform pg_advisory_xact_lock(hashtextextended(u::text,0));
 if p_id is null then
  if (select count(*) from public.user_tierlists where owner_id=u)>=100 then raise exception 'Account tierlist limit reached';end if;
  insert into public.user_tierlists(owner_id,name,draft_payload,published_name,published_payload,published_at)
  values(u,title,p_payload,case when p_publish then title end,case when p_publish then p_payload end,case when p_publish then now() end) returning * into r;
 else
  update public.user_tierlists set name=title,draft_payload=p_payload,revision=revision+1,updated_at=now(),
   published_name=case when p_publish then title else published_name end,published_payload=case when p_publish then p_payload else published_payload end,published_at=case when p_publish then now() else published_at end
  where id=p_id and owner_id=u and revision=p_revision returning * into r;
  if not found then raise exception 'Tierlist changed or is unavailable. Reload before saving';end if;
 end if;
 return jsonb_build_object('id',r.id,'revision',r.revision,'published',r.published_payload is not null);
end;$$;

create or replace function public.tierlist_list_mine_v1() returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in to view saved tierlists';end if;
 return coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'payload',draft_payload,'revision',revision,'published',published_payload is not null,'updated_at',updated_at) order by updated_at desc) from public.user_tierlists where owner_id=auth.uid()),'[]'::jsonb);
end;$$;

create or replace function public.tierlist_list_public_v1() returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'name',published_name,'payload',published_payload,'published_at',published_at) order by published_at desc),'[]'::jsonb)
 from (select id,published_name,published_payload,published_at from public.user_tierlists where published_payload is not null order by published_at desc limit 100) f;
$$;

create or replace function public.tierlist_read_v1(p_id uuid,p_private boolean default false) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r public.user_tierlists;
begin
 if p_private then
  if auth.uid() is null then raise exception 'Sign in to open a saved draft';end if;
  select * into r from public.user_tierlists where id=p_id and owner_id=auth.uid();
 else select * into r from public.user_tierlists where id=p_id and published_payload is not null;end if;
 if not found then raise exception 'Tierlist unavailable';end if;
 return jsonb_build_object('id',r.id,'name',case when p_private then r.name else r.published_name end,'payload',case when p_private then r.draft_payload else r.published_payload end,'revision',case when p_private then r.revision else null end,'published',r.published_payload is not null);
end;$$;

create or replace function public.tierlist_manage_v1(p_id uuid,p_revision integer,p_action text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise exception 'Sign in to manage tierlists';end if;
 if p_action='unpublish' then
  update public.user_tierlists set published_name=null,published_payload=null,published_at=null,revision=revision+1,updated_at=now() where id=p_id and owner_id=auth.uid() and revision=p_revision;
 elsif p_action='delete' then delete from public.user_tierlists where id=p_id and owner_id=auth.uid() and revision=p_revision;
 else raise exception 'Unknown tierlist action';end if;
 if not found then raise exception 'Tierlist changed or is unavailable';end if;
 return jsonb_build_object('ok',true);
end;$$;
revoke all on function public.tierlist_save_v1(uuid,integer,text,jsonb,boolean),public.tierlist_list_mine_v1(),public.tierlist_list_public_v1(),public.tierlist_read_v1(uuid,boolean),public.tierlist_manage_v1(uuid,integer,text) from public,anon,authenticated;
grant execute on function public.tierlist_save_v1(uuid,integer,text,jsonb,boolean),public.tierlist_list_mine_v1(),public.tierlist_manage_v1(uuid,integer,text) to authenticated;
grant execute on function public.tierlist_list_public_v1(),public.tierlist_read_v1(uuid,boolean) to anon,authenticated;



create table if not exists public.tierlist_likes(tierlist_id uuid not null references public.user_tierlists(id) on delete cascade,user_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now(),primary key(tierlist_id,user_id));
alter table public.tierlist_likes enable row level security;
revoke all on public.tierlist_likes from public,anon,authenticated;
create or replace function public.tierlist_like_v1(p_id uuid) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid=auth.uid(); liked boolean;
begin
 if u is null then raise exception 'Sign in to like tierlists';end if;
 perform 1 from public.user_tierlists where id=p_id and published_payload is not null for update;
 if not found then raise exception 'Published tierlist unavailable';end if;
 delete from public.tierlist_likes where tierlist_id=p_id and user_id=u;
 liked=not found;
 if liked then insert into public.tierlist_likes(tierlist_id,user_id) values(p_id,u);end if;
 return jsonb_build_object('liked',liked,'likes',(select count(*) from public.tierlist_likes where tierlist_id=p_id));
end;$$;
revoke all on function public.tierlist_like_v1(uuid) from public,anon;
grant execute on function public.tierlist_like_v1(uuid) to authenticated;
create or replace function public.tierlist_list_public_v1() returns jsonb language sql security definer set search_path=public,pg_temp as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',f.id,'name',f.published_name,'payload',f.published_payload,'published_at',f.published_at,'likes',(select count(*) from public.tierlist_likes l where l.tierlist_id=f.id),'liked',exists(select 1 from public.tierlist_likes l where l.tierlist_id=f.id and l.user_id=auth.uid())) order by f.published_at desc),'[]'::jsonb)
 from (select id,published_name,published_payload,published_at from public.user_tierlists where published_payload is not null order by published_at desc limit 100) f;
$$;
revoke all on function public.tierlist_list_public_v1() from public;
grant execute on function public.tierlist_list_public_v1() to anon,authenticated;
notify pgrst,'reload schema';


commit;
