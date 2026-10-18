begin;
create table public.site_community_entries(
 id uuid primary key default gen_random_uuid(),kind text not null check(kind in('code','patch','creator')),
 draft jsonb not null,published jsonb,revision integer not null default 0,published_at timestamptz,
 updated_at timestamptz not null default now(),updated_by uuid references auth.users(id) on delete set null
);
create unique index community_code_draft_unique on public.site_community_entries((draft->>'code')) where kind='code' and coalesce(draft->>'code','')<>'';
create unique index community_code_published_unique on public.site_community_entries((published->>'code')) where kind='code' and published is not null;
create table public.site_community_versions(id bigint generated always as identity primary key,entry_id uuid not null references public.site_community_entries(id),action text not null,snapshot jsonb not null,actor uuid references auth.users(id) on delete set null,created_at timestamptz not null default now());
alter table public.site_community_entries enable row level security;alter table public.site_community_versions enable row level security;
revoke all on public.site_community_entries,public.site_community_versions from public,anon,authenticated;
revoke all on sequence public.site_community_versions_id_seq from public,anon,authenticated;
create function public.validate_community_entry(k text,v jsonb,publishing boolean default false) returns void language plpgsql set search_path=pg_catalog as $$
declare allowed text[]; item record;video jsonb;field text;value text;
begin
 if k not in('code','patch','creator') or k is null or jsonb_typeof(v) is distinct from 'object' or length(v::text)>50000 then raise exception 'Invalid community entry.';end if;
 allowed:=case k when 'code' then array['code','rewards','status','expires_on','checked_on','source_url','note','status_override','dislike_threshold'] when 'patch' then array['title','version','released_on','source_url','summary','source_verified'] else array['name','description','channel_url','avatar_url','creator_code','featured','videos'] end;
 for item in select * from jsonb_each(v) loop
  if not(item.key=any(allowed)) then raise exception 'Unknown entry field.';end if;
  if item.key in('featured','source_verified') then
   if jsonb_typeof(item.value) is distinct from 'boolean' then raise exception 'Invalid checkbox value.';end if;
  elsif item.key='videos' then
   if jsonb_typeof(item.value) is distinct from 'array' or jsonb_array_length(item.value)>12 then raise exception 'Use up to 12 selected videos.';end if;
  elsif jsonb_typeof(item.value) is distinct from 'string' or char_length(item.value#>>'{}')>(case when item.key in('description','summary','note') then 5000 else 1000 end) then raise exception 'Invalid or overly long field.';end if;
 end loop;
 foreach field in array array['expires_on','checked_on','released_on'] loop
  value:=v->>field;if coalesce(value,'')<>'' then if value !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'Enter a valid date.';end if;perform value::date;end if;
 end loop;
 foreach field in array array['source_url','channel_url'] loop
  value:=v->>field;if coalesce(value,'')<>'' and value !~ '^https://[^/@?#[:space:]]+([/?#][^[:space:]]*)?$' then raise exception 'Use a secure https:// link.';end if;
 end loop;
 if k='code' then
  if coalesce(v->>'code','')<>'' and v->>'code' !~ '^[A-Za-z0-9_-]{1,80}$' then raise exception 'Invalid code format.';end if;
  if v ? 'status' and v->>'status' not in('Active','Unverified','Expired') then raise exception 'Invalid code status.';end if;
  if publishing and (btrim(coalesce(v->>'code',''))='' or btrim(coalesce(v->>'rewards',''))='' or coalesce(v->>'status','') not in('Active','Unverified','Expired')) then raise exception 'Add a code, rewards and status before publishing.';end if;
  if coalesce(v->>'status_override','Auto') not in('Auto','Working','Not working') then raise exception 'Invalid status override.';end if;
  if coalesce(v->>'dislike_threshold','10') !~ '^[0-9]{1,6}$' then raise exception 'Invalid dislike threshold.';end if;
  if coalesce(v->>'dislike_threshold','10')::integer>100000 then raise exception 'Invalid dislike threshold.';end if;
 elsif k='patch' then
  if publishing and (btrim(coalesce(v->>'title',''))='' or coalesce(v->>'released_on','')='' or coalesce(v->>'source_url','')='' or v->'source_verified' is distinct from 'true'::jsonb) then raise exception 'Add the title, release date, source and official-announcement confirmation.';end if;
 else
  if coalesce(v->>'channel_url','')<>'' and v->>'channel_url' !~ '^https://(www\.)?youtube\.com/' then raise exception 'Use a YouTube channel link.';end if;
  value:=v->>'avatar_url';if coalesce(value,'')<>'' and value !~ '^assets/creators/[A-Za-z0-9_.-]+$' and value !~ '^https://(yt3\.googleusercontent\.com|yt3\.ggpht\.com|i\.ytimg\.com)/[^[:space:]]+$' then raise exception 'Use a YouTube profile image or local creator image.';end if;
  for video in select * from jsonb_array_elements(coalesce(v->'videos','[]'::jsonb)) loop
   if jsonb_typeof(video) is distinct from 'object' or exists(select 1 from jsonb_object_keys(video) key where key not in('title','url','topic','thumbnail')) then raise exception 'Invalid video.';end if;
   if coalesce(video->>'title','')='' or length(video->>'title')>250 or coalesce(video->>'url','') !~ '^https://((www\.)?youtube\.com/|youtu\.be/)[^[:space:]@]+$' then raise exception 'Add a valid YouTube video title and link.';end if;
   foreach field in array array['title','url','topic','thumbnail'] loop if video ? field and jsonb_typeof(video->field) is distinct from 'string' then raise exception 'Invalid video field.';end if;end loop;
   if length(coalesce(video->>'topic',''))>80 or length(video->>'url')>1000 or length(coalesce(video->>'thumbnail',''))>1000 then raise exception 'Video field is too long.';end if;
   value:=video->>'thumbnail';if coalesce(value,'')<>'' and value !~ '^assets/creators/[A-Za-z0-9_.-]+$' and value !~ '^https://(yt3\.googleusercontent\.com|yt3\.ggpht\.com|i\.ytimg\.com)/[^[:space:]]+$' then raise exception 'Invalid video thumbnail.';end if;
  end loop;
  if publishing and (btrim(coalesce(v->>'name',''))='' or btrim(coalesce(v->>'description',''))='' or coalesce(v->>'channel_url','')='' or coalesce(v->>'avatar_url','')='') then raise exception 'Complete the creator profile before publishing.';end if;
 end if;
end $$;
revoke all on function public.validate_community_entry(text,jsonb,boolean) from public,anon,authenticated;
create function public.public_community_entries() returns jsonb language sql stable security definer set search_path=pg_catalog as $$
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'kind',kind,'content',published,'published_at',published_at) order by published_at desc),'[]'::jsonb) from public.site_community_entries where published is not null
$$;
revoke all on function public.public_community_entries() from public;grant execute on function public.public_community_entries() to anon,authenticated;
create function public.community_workspace(p_action text,p_payload jsonb default '{}'::jsonb) returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare actor uuid:=auth.uid();entry public.site_community_entries;content jsonb;result jsonb;
begin
 if actor is null or not public.is_site_admin() or not exists(select 1 from auth.users where id=actor) then raise exception 'Administrator access required.' using errcode='42501';end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or p_payload->>'expected_actor' is distinct from actor::text then raise exception 'Your account changed. Reload the dashboard.' using errcode='42501';end if;
 if p_action='list' then select coalesce(jsonb_agg(to_jsonb(e) order by updated_at desc),'[]'::jsonb) into result from public.site_community_entries e;return result;end if;
 if p_action='create' then
  content:=p_payload->'content';perform public.validate_community_entry(p_payload->>'kind',content);
  insert into public.site_community_entries(kind,draft,updated_by) values(p_payload->>'kind',content,actor) returning * into entry;
 else
  select * into entry from public.site_community_entries where id=(p_payload->>'id')::uuid for update;if not found then raise exception 'This entry no longer exists.';end if;
  if p_action='get' then return to_jsonb(entry);end if;
  if p_action='history' then select coalesce(jsonb_agg(jsonb_build_object('id',id,'action',action,'snapshot',snapshot,'created_at',created_at) order by id desc),'[]'::jsonb) into result from public.site_community_versions where entry_id=entry.id;return result;end if;
  if entry.revision is distinct from (p_payload->>'revision')::integer then raise exception 'This entry changed. Reload it before saving.';end if;
  if p_action='save' then content:=p_payload->'content';perform public.validate_community_entry(entry.kind,content);update public.site_community_entries set draft=content where id=entry.id;
  elsif p_action='publish' then perform public.validate_community_entry(entry.kind,entry.draft,true);update public.site_community_entries set published=draft,published_at=clock_timestamp() where id=entry.id;
  elsif p_action='unpublish' then update public.site_community_entries set published=null,published_at=null where id=entry.id;
  else raise exception 'Unknown community action.';end if;
  update public.site_community_entries set revision=revision+1,updated_at=clock_timestamp(),updated_by=actor where id=entry.id returning * into entry;
 end if;
 insert into public.site_community_versions(entry_id,action,snapshot,actor) values(entry.id,p_action,to_jsonb(entry),actor);
 insert into public.site_admin_audit(actor,action,target,details) values(actor,'community.'||p_action,entry.id::text,jsonb_build_object('kind',entry.kind,'revision',entry.revision));
 return to_jsonb(entry);
exception when unique_violation then raise exception 'A code with that value already exists.';
end $$;
revoke all on function public.community_workspace(text,jsonb) from public,anon;grant execute on function public.community_workspace(text,jsonb) to authenticated;
-- Artiar is prepared as a draft; an administrator chooses when to publish it.
insert into public.site_community_entries(id,kind,draft) values('95bc3aa5-8fef-4644-a746-a95121fd0930','creator','{"name": "Artiar", "creator_code": "ARTIARYT", "description": "Clash of Critters guides, evolution priorities, Horde Invasion strategies and game updates.", "channel_url": "https://www.youtube.com/@artiar-dislyte4093", "avatar_url": "assets/creators/artiar.jpg", "featured": true, "videos": [{"title": "UPDATED Evolution Priority Guide (T1 → T3) | What To Evolve FIRST October | Clash Of Critters", "url": "https://www.youtube.com/watch?v=6jEz3pvPZqg", "topic": "Evolution", "thumbnail": "assets/creators/artiar-6jEz3pvPZqg.jpg"}, {"title": "Horde Invasion S3: NEW Bosses, Attack Mechanics & Wave Order + Butterfly Lv7 Dmg | Clash Of Critters", "url": "https://www.youtube.com/watch?v=k6Qdc16tnqE", "topic": "Horde Invasion", "thumbnail": "assets/creators/artiar-k6Qdc16tnqE.jpg"}, {"title": "Sparkle Skin PERMANENT ? How To Farm Glitter Fruit With This Spa System ? | Clash Of Critters", "url": "https://www.youtube.com/watch?v=xAUCG9JAjGY", "topic": "Sparkly Spa", "thumbnail": "assets/creators/artiar-xAUCG9JAjGY.jpg"}]}'::jsonb);
notify pgrst,'reload schema';
commit;
