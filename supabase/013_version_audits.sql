begin;
create table if not exists public.site_version_audits(report_id text primary key,report jsonb not null,actor uuid not null references auth.users(id),created_at timestamptz not null default now());
create table if not exists public.site_version_findings(report_id text not null references public.site_version_audits(report_id),finding_id text not null,status text not null check(status in ('needs_review','verified','needs_update','unknown','not_applicable')),note text not null,revision integer not null default 1,actor uuid not null references auth.users(id),reviewed_at timestamptz not null default now(),primary key(report_id,finding_id));
create table if not exists public.site_guide_reviews(id bigint generated always as identity primary key,guide_key text not null,section_key text not null,game_version text not null,status text not null check(status in ('verified','needs_update','unknown')),note text not null,actor uuid not null references auth.users(id),reviewed_at timestamptz not null default now());
alter table public.site_version_audits enable row level security;
alter table public.site_version_findings enable row level security;
alter table public.site_guide_reviews enable row level security;
revoke all on public.site_version_audits,public.site_version_findings,public.site_guide_reviews from public,anon,authenticated;
create or replace function public.admin_version_audit(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r jsonb;reportid text;f public.site_version_findings;note text;begin
 if not public.is_site_admin() then raise exception 'Administrator access required' using errcode='42501';end if;
 if p_action='load' then return jsonb_build_object('reports',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select * from public.site_version_audits order by created_at desc limit 50)t),'findings',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from public.site_version_findings t where report_id in (select report_id from public.site_version_audits order by created_at desc limit 50)),'reviews',(select coalesce(jsonb_agg(to_jsonb(t)),'[]') from (select * from public.site_guide_reviews order by reviewed_at desc limit 500)t));
 elsif p_action='import' then
  r:=p_payload->'report';reportid:=r->>'reportId';
  if r is null or reportid is null or reportid!~'^[a-f0-9]{64}$' or r->>'formatVersion' is distinct from '1' or jsonb_typeof(r->'findings') is distinct from 'array' or octet_length(r::text)>1000000 then raise exception 'Invalid report';end if;
  if r->>'fromVersion' is null or r->>'toVersion' is null or r->>'fromVersion'!~'^[a-zA-Z0-9._-]{1,40}$' or r->>'toVersion'!~'^[a-zA-Z0-9._-]{1,40}$' or jsonb_typeof(r->'coverage') is distinct from 'array' then raise exception 'Invalid versions or coverage';end if;
  if jsonb_array_length(r->'findings')>1000 then raise exception 'Report has too many findings';end if;
  if exists(select 1 from jsonb_array_elements(r->'findings') x where x->>'id' is null or x->>'id'!~'^[a-f0-9]{64}$' or not exists(select 1 from public.site_content_blocks where page_key='events/'||(x->>'guideKey')||'.html')) then raise exception 'Unknown guide or finding';end if;
  if (select count(*) from jsonb_array_elements(r->'findings'))<>(select count(distinct x->>'id') from jsonb_array_elements(r->'findings') x) then raise exception 'Duplicate finding IDs';end if;
  insert into public.site_version_audits(report_id,report,actor) values(reportid,r,auth.uid()) on conflict do nothing;
 elsif p_action='review_finding' then
  reportid:=p_payload->>'report';select report into r from public.site_version_audits where report_id=reportid;
  if not found or not exists(select 1 from jsonb_array_elements(r->'findings') x where x->>'id'=p_payload->>'finding') then raise exception 'Finding not found';end if;
  if p_payload->>'status' is null or p_payload->>'status' not in ('needs_review','verified','needs_update','unknown','not_applicable') then raise exception 'Invalid status';end if;
  note:=trim(coalesce(p_payload->>'note',''));if length(note)=0 or length(note)>3000 then raise exception 'Enter a review note (up to 3000 characters)';end if;
  perform pg_advisory_xact_lock(hashtextextended(reportid||'#'||(p_payload->>'finding'),13));
  select * into f from public.site_version_findings where report_id=reportid and finding_id=p_payload->>'finding' for update;
  if coalesce(f.revision,0) is distinct from coalesce((p_payload->>'revision')::integer,0) then raise exception 'Review changed. Refresh and retry.' using errcode='40001';end if;
  insert into public.site_version_findings(report_id,finding_id,status,note,actor) values(reportid,p_payload->>'finding',p_payload->>'status',note,auth.uid()) on conflict(report_id,finding_id) do update set status=excluded.status,note=excluded.note,revision=public.site_version_findings.revision+1,actor=auth.uid(),reviewed_at=now();
 elsif p_action='guide_review' then
  if not exists(select 1 from public.site_content_blocks where page_key='events/'||(p_payload->>'guide')||'.html') then raise exception 'Unknown guide';end if;
  if p_payload->>'version' is null or p_payload->>'version'!~'^[a-zA-Z0-9._-]{1,40}$' or p_payload->>'status' is null or p_payload->>'status' not in ('verified','needs_update','unknown') then raise exception 'Invalid review';end if;
  note:=trim(coalesce(p_payload->>'note',''));if length(note)=0 or length(note)>3000 then raise exception 'Enter verification evidence';end if;
  insert into public.site_guide_reviews(guide_key,section_key,game_version,status,note,actor) values(p_payload->>'guide',left(coalesce(p_payload->>'section','whole-guide'),100),p_payload->>'version',p_payload->>'status',note,auth.uid());
 else raise exception 'Unknown audit action';end if;
 insert into public.site_admin_audit(actor,action,target,details) values(auth.uid(),'version_'||p_action,coalesce(reportid,p_payload->>'guide','audit'),'{}');return jsonb_build_object('ok',true);
end$$;
revoke all on function public.admin_version_audit(text,jsonb) from public,anon;grant execute on function public.admin_version_audit(text,jsonb) to authenticated;
commit;
