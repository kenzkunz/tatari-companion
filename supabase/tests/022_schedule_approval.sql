-- Requires the admin catalog to be initialized. No test changes commit.
begin;
do $$begin perform set_config('request.jwt.claim.sub',(select user_id::text from public.site_admins limit 1),true);end$$;
set local role authenticated;
do $$declare r jsonb;begin
 r:=public.admin_farm_listings('create','{"uid":"99999999999999999993","crop":2,"bonus":263,"note":"Rollback approval fixture"}');
 perform set_config('test.listing_id',r->>'id',true);
 perform public.admin_farm_listings('delete',jsonb_build_object('id',r->>'id','revision',0));
end$$;
reset role;
do $$declare request_id uuid;begin
 insert into public.farm_support_requests(submitted_by,game_uid,crop_id,bonus,permission,note) values(current_setting('request.jwt.claim.sub')::uuid,'99999999999999999993',2,250,true,'Rollback approval fixture') returning id into request_id;
 perform set_config('test.request_id',request_id::text,true);
end$$;
set local role authenticated;
do $$declare r jsonb;values_doc jsonb;begin
 perform public.admin_workspace('review',jsonb_build_object('id',current_setting('test.request_id'),'revision',0,'decision','approved','note','Rollback re-approval'));
 select x into r from jsonb_array_elements(public.admin_farm_listings('load'))x where x->>'id'=current_setting('test.listing_id');
 assert r->>'enabled'='true' and r->>'deleted_at' is null,'Approval did not restore consistently';
 select x into r from jsonb_array_elements(public.admin_site_data('load'))x where x->>'key'='schedule';assert r is not null,'Initialize catalog first';
 values_doc:=r->'default_values';r:=public.admin_site_data('save',jsonb_build_object('key','schedule','revision',r->'revision','values',values_doc));
 r:=public.admin_site_data('publish',jsonb_build_object('key','schedule','revision',r->'revision','reason','Rollback schedule synchronization'));
 assert public.published_site_data('schedule')->'values'=values_doc,'Schedule publication failed';
 select x into r from jsonb_array_elements(public.admin_site_data('load'))x where x->>'key'='footer';values_doc:=(r->'default_values')||'{"contactUrl":"javascript:alert(1)"}'::jsonb;
 begin perform public.admin_site_data('save',jsonb_build_object('key','footer','revision',r->'revision','values',values_doc));raise exception 'Unsafe URL accepted';exception when raise_exception then if sqlerrm='Unsafe URL accepted' then raise;end if;end;
end$$;
reset role;
do $$declare expected_cycle integer;begin
 select (default_values->>'events.regular.duration_days')::integer*5 into expected_cycle from public.site_data_records where key='schedule';
 assert not exists(select 1 from public.event_match_definitions where cycle_days<>expected_cycle),'Matchmaking cycle differs from published schedule';
 assert position('def.cycle_days' in pg_get_functiondef('public.save_event_match_plan(text,timestamptz,integer,integer,text,integer,integer,boolean)'::regprocedure))>0,'Matchmaking uses fixed recurrence';
end$$;
rollback;
select 'Re-approval, schedule synchronization and URL rejection passed; all test values rolled back' as result;
