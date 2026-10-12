-- Staging-only checks after migration 013. All changes roll back.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000013') on conflict(id) do nothing;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000013',true);
set local role authenticated;
do $$begin
 begin perform public.admin_version_audit('load');raise exception 'Non-admin read bypass';exception when insufficient_privilege then null;end;
 begin perform 1 from public.site_version_audits;raise exception 'Private audit table readable';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub','f95bfea9-d7d3-49f5-827a-646c11f32ffb',true);
set local role authenticated;
do $$declare report jsonb;rid text:=repeat('a',64);fid text:=repeat('b',64);begin
 report:=jsonb_build_object('formatVersion',1,'reportId',rid,'fromVersion','0.49.1','toVersion','audit-test','coverage','[]'::jsonb,'totalChanges',1,'findings',jsonb_build_array(jsonb_build_object('id',fid,'guideKey','sparkly-spa','source','guide-data/spa-audit.json','path','$.test','sections',jsonb_build_array('buffs'),'before','1','after','2','kind','data_changed')));
 perform public.admin_version_audit('import',jsonb_build_object('report',report));
 perform public.admin_version_audit('review_finding',jsonb_build_object('report',rid,'finding',fid,'revision',0,'status','unknown','note','Staging evidence check'));
 begin perform public.admin_version_audit('review_finding',jsonb_build_object('report',rid,'finding',fid,'revision',0,'status','verified','note','Stale review'));raise exception 'Stale revision accepted';exception when serialization_failure then null;end;
 perform public.admin_version_audit('import',jsonb_build_object('report',report));
 if not exists(select 1 from jsonb_array_elements(public.admin_version_audit('load')->'findings') x where x->>'report_id'=rid and x->>'status'='unknown') then raise exception 'Reimport erased review';end if;
end$$;
reset role;
rollback;
