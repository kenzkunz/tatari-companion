begin;
create table public.site_data_records(key text primary key,title text not null,source text not null,baseline text not null,schema jsonb not null,default_values jsonb not null,draft_values jsonb,published_values jsonb,revision integer not null default 0,updated_at timestamptz not null default now());
create table public.site_data_versions(id bigint generated always as identity primary key,key text not null references public.site_data_records(key),data_values jsonb,action text not null,reason text not null default '',actor uuid not null references auth.users(id),created_at timestamptz not null default now());
alter table public.site_data_records enable row level security;alter table public.site_data_versions enable row level security;
revoke all on public.site_data_records,public.site_data_versions from public,anon,authenticated;
alter table public.event_match_definitions add column if not exists cycle_days integer not null default 15;
create function public.site_schedule_document(v jsonb) returns jsonb language sql immutable set search_path=pg_catalog as $$select jsonb_build_object('events',jsonb_build_object('game',jsonb_build_object('reset_timezone','UTC','reset_hour',0),'regular',jsonb_build_object('duration_days',v->'events.regular.duration_days','events',jsonb_build_array(v->'events.regular.events.0',v->'events.regular.events.1',v->'events.regular.events.2',v->'events.regular.events.3',v->'events.regular.events.4'),'anchor',jsonb_build_object('date',v->'events.regular.anchor.date','event',v->'events.regular.anchor.event')),'pvp',jsonb_build_object('duration_days',v->'events.pvp.duration_days','registration_days',v->'events.pvp.registration_days','events',jsonb_build_array(v->'events.pvp.events.0',v->'events.pvp.events.1',v->'events.pvp.events.2',v->'events.pvp.events.3'),'anchor',jsonb_build_object('date',v->'events.pvp.anchor.date','event',v->'events.pvp.anchor.event','type','registration'))),'horde',jsonb_build_object('cycle_seconds',v->'horde.cycle_seconds','rest_seconds',v->'horde.rest_seconds'))$$;
create function public.site_value_path_allowed(k text,p text) returns boolean language sql immutable set search_path=pg_catalog as $$select case
 when k='footer' then p=any(array['title','disclaimer','credits','thanks','privacyLabel','privacyUrl','termsLabel','termsUrl','contactLabel','contactUrl','extraLabel','extraUrl','lastUpdate'])
 when k='schedule' then p ~ '^events\.(regular|pvp)\.(anchor\.(date|event)|duration_days)$' or p='events.pvp.registration_days' or p ~ '^events\.regular\.events\.[0-4]$' or p ~ '^events\.pvp\.events\.[0-3]$' or p in ('horde.cycle_seconds','horde.rest_seconds')
 when k in ('guide:cozy-farm','guide:fishing','guide:treasure-hunt','guide:raft-race','guide:zobo-shooter','guide:goldrush') then p ~ '^(rewards|chests)\.[0-9]+\.(threshold|items\.[0-9]+\.amount)$' or (k='guide:fishing' and p ~ '^fish\.[0-9]+\.price$') or (k='guide:zobo-shooter' and p ~ '^bosses\.[0-9]+\.score$') or (k='guide:goldrush' and (p ~ '^tiles\.[0-9]+\.(defenders|perMinute)$' or p ~ '^(attackRewards|leagueDaily|teamDaily|teamFinal|leagueFinal|teamMilestones|mvp)\.[0-9]+\.(reward|rally_reward|rewards)\.[0-9]+\.amount$' or p ~ '^teamMilestones\.[0-9]+\.points$'))
 else false end$$;
create function public.validate_site_values(k text,s jsonb,v jsonb) returns void language plpgsql set search_path=pg_catalog as $$
declare f record;spec jsonb;n numeric;t text;d jsonb;names jsonb;expected jsonb;prefix text;prev numeric;begin
 if jsonb_typeof(v) is distinct from 'object' or jsonb_typeof(s) is distinct from 'object' or (select count(*) from jsonb_object_keys(v))<>(select count(*) from jsonb_object_keys(s)) then raise exception 'Data fields do not match the approved schema';end if;
 for f in select * from jsonb_each(s) loop
  if not public.site_value_path_allowed(k,f.key) or not v?f.key then raise exception 'This source field is locked: %',f.key;end if;spec:=f.value;
  if k like 'guide:%' or spec->>'type'='number' then
   if jsonb_typeof(v->f.key)<>'number' then raise exception 'Enter a number for %',spec->>'label';end if;n:=(v->>f.key)::numeric;
   if n<0 or n>1000000000 or trunc(n)<>n or (spec?'min' and n<(spec->>'min')::numeric) or (spec?'max' and n>(spec->>'max')::numeric) then raise exception 'Value outside the allowed range for %',spec->>'label';end if;
  else
   if jsonb_typeof(v->f.key)<>'string' then raise exception 'Enter text for %',spec->>'label';end if;t:=v->>f.key;
   if length(t)>(case when f.key='disclaimer' then 2000 else 500 end) then raise exception 'Text is too long for %',spec->>'label';end if;
   if spec?'options' and not (spec->'options')?t then raise exception 'Choose a supported value for %',spec->>'label';end if;
   if spec->>'format'='date' then if t !~ '^(20[2-9][0-9]|2100)-[0-9]{2}-[0-9]{2}$' or to_char(t::date,'YYYY-MM-DD')<>t then raise exception 'Enter a valid UTC date';end if;end if;
   if spec->>'format'='url' and not (f.key='extraUrl' and t='') and (t !~ '^https://[A-Za-z0-9][^[:space:][:cntrl:]]*$' or length(t)>500) then raise exception 'Use a complete HTTPS link';end if;
  end if;
 end loop;
 if k='footer' and ((v->>'extraLabel'='') is distinct from (v->>'extraUrl'='')) then raise exception 'Optional link needs both a label and a URL';end if;
 if k='schedule' then
  d:=public.site_schedule_document(v);
  names:=d#>'{events,regular,events}';expected:='["Treasure Hunt","Raft Race","Zobo Shooter","Cozy Farm","Fishing Contest"]';
  if not (names @> expected and expected @> names) or (select count(distinct value) from jsonb_array_elements_text(names))<>5 or not names?(v->>'events.regular.anchor.event') then raise exception 'Regular rotation must contain each supported event exactly once';end if;
  names:=d#>'{events,pvp,events}';expected:='["Gold Rush #1","Gold Rush #2","Gold Rush #3","Dune Rush"]';
  if not(names @> expected and expected @> names) or (select count(distinct value) from jsonb_array_elements_text(names))<>4 or not names?(v->>'events.pvp.anchor.event') then raise exception 'PvP rotation must contain each supported event exactly once';end if;
  if (v->>'horde.rest_seconds')::numeric >= (v->>'horde.cycle_seconds')::numeric then raise exception 'Horde rest must be shorter than the full cycle';end if;
 end if;
 for prefix in select distinct split_part(key,'.',1) from jsonb_object_keys(v) key where key ~ '^(rewards|chests)\.[0-9]+\.threshold$' or key ~ '^teamMilestones\.[0-9]+\.points$' loop
  prev:=null;for f in select key,value from jsonb_each(v) where split_part(key,'.',1)=prefix and (key ~ '\.threshold$' or key ~ '\.points$') order by split_part(key,'.',2)::integer loop
   n:=f.value::text::numeric;if prev is not null and n<=prev then raise exception 'Milestone thresholds must increase in row order';end if;prev:=n;
  end loop;
 end loop;
end$$;
create function public.publish_match_schedule(v jsonb) returns void language plpgsql set search_path=pg_catalog as $$
declare doc jsonb:=public.site_schedule_document(v);item record;anchor_index integer;duration integer;cycle integer;start_at timestamptz;begin
 duration:=(v->>'events.regular.duration_days')::integer;cycle:=5*duration;
 select ordinality::integer-1 into anchor_index from jsonb_array_elements_text(doc#>'{events,regular,events}') with ordinality where value=v->>'events.regular.anchor.event';
 -- Preserve existing plans and reject a schedule that would silently orphan them.
 for item in select value,ordinality::integer-1 as position from jsonb_array_elements_text(doc#>'{events,regular,events}') with ordinality loop
  start_at:=((v->>'events.regular.anchor.date')::date::timestamp at time zone 'UTC')+(((item.position-anchor_index+5)%5)*duration)*interval '1 day';
  if exists(select 1 from public.event_match_plans p where p.event_name=item.value and p.event_start>now() and mod(extract(epoch from (p.event_start-start_at))::numeric,(cycle*86400)::numeric)<>0) then raise exception 'Future matchmaking plans use existing dates. Resolve or migrate those plans before publishing a different rotation.';end if;
  update public.event_match_definitions set anchor_start=start_at,cycle_days=cycle where event_name=item.value;
 end loop;
end$$;
create function public.published_site_data(p_key text) returns jsonb language sql stable security definer set search_path=pg_catalog as $$select case when published_values is null then null else jsonb_build_object('baseline',baseline,'values',published_values,'revision',revision) end from public.site_data_records where key=p_key$$;
revoke all on function public.published_site_data(text) from public;grant execute on function public.published_site_data(text) to anon,authenticated;
create function public.admin_site_data(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.site_data_records;x jsonb;v jsonb;next_values jsonb;reason text;ver public.site_data_versions;begin
 if not public.is_site_admin() then raise exception 'Administrator access required' using errcode='42501';end if;
 if octet_length(p_payload::text)>6000000 then raise exception 'Dataset too large';end if;
 if p_action='initialize' then
  for x in select * from jsonb_array_elements(p_payload->'records') loop
   if x->>'key' not in ('schedule','footer','guide:cozy-farm','guide:fishing','guide:treasure-hunt','guide:raft-race','guide:zobo-shooter','guide:goldrush','guide:horde','guide:spa-audit') or (x->>'baseline') !~ '^[a-f0-9]{64}$' then raise exception 'Unknown dataset';end if;
   if exists(select 1 from public.site_data_records where key=x->>'key' and baseline<>x->>'baseline') then raise exception 'A source dataset has changed. Review its baseline migration before editing.';end if;
   perform public.validate_site_values(x->>'key',x->'schema',x->'defaults');
   insert into public.site_data_records(key,title,source,baseline,schema,default_values) values(x->>'key',x->>'title',x->>'source',x->>'baseline',x->'schema',x->'defaults') on conflict(key) do nothing;
  end loop;return '{}'::jsonb;
 end if;
 if p_action='load' then return (select coalesce(jsonb_agg(to_jsonb(d) order by key),'[]') from public.site_data_records d);end if;
 if p_action='history' then return (select coalesce(jsonb_agg(to_jsonb(h) order by id desc),'[]') from(select * from public.site_data_versions where key=p_payload->>'key' order by id desc limit 30)h);end if;
 select * into r from public.site_data_records where key=p_payload->>'key' for update;if not found then raise exception 'Dataset unavailable';end if;
 if (p_payload->>'revision')::integer is distinct from r.revision then raise exception 'This dataset changed. Reload before saving.' using errcode='40001';end if;
 reason:=trim(coalesce(p_payload->>'reason',''));if length(reason)>1000 then raise exception 'Reason is too long';end if;
 if p_action='save' then next_values:=p_payload->'values';perform public.validate_site_values(r.key,r.schema,next_values);update public.site_data_records set draft_values=next_values,revision=revision+1,updated_at=now() where key=r.key;
 elsif p_action='publish' then
  if r.draft_values is null then raise exception 'Save a draft before publishing';end if;if length(reason)<3 then raise exception 'Add a short reason or evidence before publishing';end if;
  next_values:=r.draft_values;perform public.validate_site_values(r.key,r.schema,next_values);if r.key='schedule' then perform public.publish_match_schedule(next_values);end if;
  update public.site_data_records set published_values=next_values,draft_values=null,revision=revision+1,updated_at=now() where key=r.key;
 elsif p_action='reset' then
  if length(reason)<3 then raise exception 'Add a reason before restoring original data';end if;next_values:=r.default_values;if r.key='schedule' then perform public.publish_match_schedule(next_values);end if;
  update public.site_data_records set published_values=null,draft_values=null,revision=revision+1,updated_at=now() where key=r.key;
 elsif p_action='restore_draft' then
  select * into ver from public.site_data_versions where id=(p_payload->>'version')::bigint and key=r.key;if not found then raise exception 'Version unavailable';end if;next_values:=coalesce(ver.data_values,r.default_values);perform public.validate_site_values(r.key,r.schema,next_values);
  update public.site_data_records set draft_values=next_values,revision=revision+1,updated_at=now() where key=r.key;
 else raise exception 'Unknown dataset action';end if;
 insert into public.site_data_versions(key,data_values,action,reason,actor) values(r.key,next_values,p_action,reason,auth.uid());
 insert into public.site_admin_audit(actor,action,target,details) values(auth.uid(),'site_data_'||p_action,r.key,jsonb_build_object('revision',r.revision+1,'reason',reason));
 return (select to_jsonb(d) from public.site_data_records d where key=r.key);
end$$;
revoke all on function public.admin_site_data(text,jsonb) from public,anon;grant execute on function public.admin_site_data(text,jsonb) to authenticated;
-- Internal helpers must not be callable as elevated entry points.
revoke all on function public.publish_match_schedule(jsonb) from public,anon,authenticated;
do $patch$ declare body text;begin
 body:=pg_get_functiondef('public.save_event_match_plan(text,timestamptz,integer,integer,text,integer,integer,boolean)'::regprocedure);
 if position($old$/1296000)+1)*interval '15 days'$old$ in body)=0 then raise exception 'Matchmaking function changed; review migration';end if;
 body:=replace(body,$old$/1296000)+1)*interval '15 days'$old$,$new$/(def.cycle_days*86400))+1)*def.cycle_days*interval '1 day'$new$);execute body;
end $patch$;
notify pgrst,'reload schema';commit;
