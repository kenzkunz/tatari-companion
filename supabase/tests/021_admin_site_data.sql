-- Run in SQL Editor after 020-022. All fixtures and changes roll back.
begin;
do $$begin perform set_config('test.admin_actor',(select user_id::text from public.site_admins limit 1),true);perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000099',true);end$$;
set local role authenticated;
do $$begin
 begin perform public.admin_site_data('load');raise exception 'Non-admin read allowed';exception when insufficient_privilege then null;end;
 begin perform public.admin_farm_listings('load');raise exception 'Non-admin UID read allowed';exception when insufficient_privilege then null;end;
 begin perform 1 from public.site_data_records;raise exception 'Direct settings read allowed';exception when insufficient_privilege then null;end;
 perform set_config('request.jwt.claim.sub',current_setting('test.admin_actor'),true);
end$$;
do $$declare r jsonb;fresh jsonb;item jsonb;values_doc jsonb;original jsonb;rec public.site_data_records;rev integer;begin
 r:=public.admin_farm_listings('create','{"uid":"99999999999999999991","crop":2,"bonus":263,"note":"Rollback test"}');
 select x into item from jsonb_array_elements(public.admin_farm_listings('load'))x where x->>'id'=r->>'id';
 perform public.reveal_farm_support((r->>'id')::uuid);perform public.report_farm_support((r->>'id')::uuid,'worked');
 fresh:=public.admin_farm_listings('edit',jsonb_build_object('id',r->>'id','revision',(item->>'revision')::integer,'uid','99999999999999999992','crop',3,'bonus',260,'note','Replacement fixture'));
 assert fresh->>'id'<>r->>'id','Identity retained old listing ID';
 select x into item from jsonb_array_elements(public.admin_farm_listings('load'))x where x->>'id'=r->>'id';assert item->>'deleted_at' is not null and item->>'enabled'='false','Previous identity not retired';
 select x into item from jsonb_array_elements(public.farm_support_directory())x where x->>'id'=fresh->>'id';assert (item->>'worked')::integer=0,'Replacement inherited reports';
 begin perform public.admin_farm_listings('notes',jsonb_build_object('id',r->>'id','revision',0,'note','Stale'));raise exception 'Stale write allowed';exception when serialization_failure then null;end;
 assert jsonb_array_length(public.admin_farm_listings('history',jsonb_build_object('id',fresh->>'id')))>0,'UID history missing';
 -- Initialize a minimal approved guide fixture only if this deployment has not seeded its full catalog yet.
 if not exists(select 1 from jsonb_array_elements(public.admin_site_data('load'))x where x->>'key'='guide:cozy-farm') then
 perform public.admin_site_data('initialize',jsonb_build_object('records',jsonb_build_array(jsonb_build_object('key','guide:cozy-farm','title','Fixture','source','guide-data/cozy-farm.json','baseline',repeat('a',64),'schema','{"rewards.0.threshold":{"type":"number","label":"Threshold","min":1,"max":1000},"rewards.1.threshold":{"type":"number","label":"Threshold 2","min":1,"max":1000}}'::jsonb,'defaults','{"rewards.0.threshold":100,"rewards.1.threshold":200}'::jsonb))));end if;
 select x into r from jsonb_array_elements(public.admin_site_data('load'))x where x->>'key'='guide:cozy-farm';values_doc:=r->'default_values';original:=public.published_site_data('guide:cozy-farm');rev:=(r->>'revision')::integer;
 values_doc:=jsonb_set(values_doc,'{rewards.0.threshold}',to_jsonb((values_doc->>'rewards.0.threshold')::integer+1));
 r:=public.admin_site_data('save',jsonb_build_object('key','guide:cozy-farm','revision',rev,'values',values_doc));assert public.published_site_data('guide:cozy-farm') is not distinct from original,'Draft leaked';
 begin perform public.admin_site_data('publish',jsonb_build_object('key','guide:cozy-farm','revision',rev,'reason','Stale'));raise exception 'Stale publish allowed';exception when serialization_failure then null;end;
 r:=public.admin_site_data('publish',jsonb_build_object('key','guide:cozy-farm','revision',r->'revision','reason','Rollback verification'));assert public.published_site_data('guide:cozy-farm')->'values'=values_doc,'Published values incorrect';
 begin perform public.admin_site_data('save',jsonb_build_object('key','guide:cozy-farm','revision',r->'revision','values',values_doc||'{"rewards.0.items.0.id":1}'::jsonb));raise exception 'Locked field accepted';exception when raise_exception then if sqlerrm='Locked field accepted' then raise;end if;end;
 assert jsonb_array_length(public.admin_site_data('history','{"key":"guide:cozy-farm"}'))>0,'Settings history missing';
end$$;
rollback;
select 'UID identity/history/revision and source draft/publish/privacy tests passed; all fixtures rolled back' as result;
