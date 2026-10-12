begin;
create table if not exists public.site_page_banners(page_key text primary key,draft_path text,published_path text,revision integer not null default 0,updated_at timestamptz not null default now());
create table if not exists public.site_box_settings(page_key text not null,block_key text not null,kind text not null check(kind in ('info','disclaimer')),revision integer not null default 0,primary key(page_key,block_key),foreign key(page_key,block_key) references public.site_content_blocks(page_key,block_key));
create table if not exists public.site_banner_versions(id bigint generated always as identity primary key,page_key text not null,path text,actor uuid not null references auth.users(id),created_at timestamptz not null default now());
alter table public.site_page_banners enable row level security;
alter table public.site_box_settings enable row level security;
alter table public.site_banner_versions enable row level security;
revoke all on public.site_page_banners,public.site_box_settings,public.site_banner_versions from public,anon,authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('guide-banners','guide-banners',true,5242880,array['image/png','image/jpeg','image/webp']) on conflict(id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/png','image/jpeg','image/webp'];
drop policy if exists guide_banner_admin_insert on storage.objects;
create policy guide_banner_admin_insert on storage.objects for insert to authenticated with check(bucket_id='guide-banners' and public.is_site_admin());
drop policy if exists guide_banner_admin_update on storage.objects;
create policy guide_banner_admin_update on storage.objects for update to authenticated using(bucket_id='guide-banners' and public.is_site_admin()) with check(bucket_id='guide-banners' and public.is_site_admin());
drop policy if exists guide_banner_admin_select on storage.objects;
create policy guide_banner_admin_select on storage.objects for select to authenticated using(bucket_id='guide-banners' and public.is_site_admin());
-- Keep published image versions: no client delete policy.
create or replace function public.public_guide_media(p_page text) returns jsonb language sql stable security definer set search_path=pg_catalog as $$select jsonb_build_object('banner',(select published_path from public.site_page_banners where page_key=p_page),'boxes',(select coalesce(jsonb_object_agg(block_key,kind),'{}') from public.site_box_settings where page_key=p_page))$$;
revoke all on function public.public_guide_media(text) from public;grant execute on function public.public_guide_media(text) to anon,authenticated;
create or replace function public.admin_guide_media(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare b public.site_page_banners;x public.site_box_settings;v public.site_banner_versions;pg text:=p_payload->>'page';path text:=p_payload->>'path';begin
 if not public.is_site_admin() then raise exception 'Administrator access required' using errcode='42501';end if;
 if p_action in ('load','export') then
  return jsonb_build_object('formatVersion',1,'exportedAt',now(),'blocks',(select coalesce(jsonb_agg(jsonb_build_object('page',page_key,'block',block_key,'text',published_text,'revision',revision)),'[]') from public.site_content_blocks where published_text is not null),'banners',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.site_page_banners t),'boxes',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.site_box_settings t));
 end if;
 if not exists(select 1 from public.site_content_blocks where page_key=pg) then raise exception 'Unknown page';end if;
 if p_action in ('draft_banner','publish_banner','reset_banner','restore_banner','banner_history') then
  if p_action='banner_history' then return (select coalesce(jsonb_agg(to_jsonb(v)),'[]') from (select * from public.site_banner_versions where page_key=pg order by id desc limit 30) v);end if;
  perform pg_advisory_xact_lock(hashtextextended(pg,12));
  insert into public.site_page_banners(page_key) values(pg) on conflict do nothing;
  select * into b from public.site_page_banners where page_key=pg for update;
  if b.revision is distinct from coalesce((p_payload->>'revision')::integer,0) then raise exception 'Banner changed. Refresh and retry.' using errcode='40001';end if;
  if p_action='draft_banner' then
   if path is null or path!~'^[a-z0-9/_-]+\.(png|jpg|webp)$' or not exists(select 1 from storage.objects where bucket_id='guide-banners' and name=path) then raise exception 'Upload a valid banner first';end if;
   update public.site_page_banners set draft_path=path,revision=revision+1,updated_at=now() where page_key=pg;
  else
   if p_action='restore_banner' then select * into v from public.site_banner_versions where id=(p_payload->>'version')::bigint and page_key=pg;if not found then raise exception 'Unknown banner version';end if;b.draft_path:=v.path;
   elsif p_action='reset_banner' then b.draft_path:=null;
   elsif b.draft_path is null then raise exception 'Upload a banner draft first';end if;
   insert into public.site_banner_versions(page_key,path,actor) values(pg,b.published_path,auth.uid());
   update public.site_page_banners set published_path=b.draft_path,draft_path=b.draft_path,revision=revision+1,updated_at=now() where page_key=pg;
  end if;
 elsif p_action in ('set_box','reset_box') then
  if not exists(select 1 from public.site_content_blocks where page_key=pg and block_key=p_payload->>'block' and block_key like 'note-%') then raise exception 'Choose an info box or disclaimer';end if;
  perform pg_advisory_xact_lock(hashtextextended(pg||'#'||(p_payload->>'block'),12));
  select * into x from public.site_box_settings where page_key=pg and block_key=p_payload->>'block' for update;
  if coalesce(x.revision,0) is distinct from coalesce((p_payload->>'revision')::integer,0) then raise exception 'Box changed. Refresh and retry.' using errcode='40001';end if;
  if p_action='reset_box' then delete from public.site_box_settings where page_key=pg and block_key=p_payload->>'block';
  else
   if p_payload->>'kind' is null or p_payload->>'kind' not in ('info','disclaimer') then raise exception 'Invalid box style';end if;
   insert into public.site_box_settings(page_key,block_key,kind,revision) values(pg,p_payload->>'block',p_payload->>'kind',1) on conflict(page_key,block_key) do update set kind=excluded.kind,revision=public.site_box_settings.revision+1;
  end if;
 else raise exception 'Unknown media action';end if;
 insert into public.site_admin_audit(actor,action,target,details) values(auth.uid(),p_action,pg,p_payload-'path');
 return jsonb_build_object('ok',true);
end$$;
revoke all on function public.admin_guide_media(text,jsonb) from public,anon;grant execute on function public.admin_guide_media(text,jsonb) to authenticated;
commit;
