-- Run after migration 009 in a staging Supabase database. All changes roll back.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000009') on conflict(id) do nothing;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000009',true);
set local role authenticated;
do $$begin
 if public.is_site_admin() then raise exception 'Non-admin authorized';end if;
 begin perform public.admin_workspace('load');raise exception 'Non-admin loaded workspace';exception when insufficient_privilege then null;end;
 begin perform 1 from public.site_admins;raise exception 'Role table readable';exception when insufficient_privilege then null;end;
 begin perform public.submit_farm_support('123456789',2,263,false,'test');raise exception 'Consent bypass';exception when raise_exception then if sqlerrm='Consent bypass' then raise;end if;end;
 perform set_config('test.farm_request',public.submit_farm_support('12345678901234567890',2,263,true,'staging test')::text,true);
end$$;
reset role;
select set_config('request.jwt.claim.sub','f95bfea9-d7d3-49f5-827a-646c11f32ffb',true);
set local role authenticated;
do $$declare b jsonb;rev integer;page text;block text;begin
 if not public.is_site_admin() then raise exception 'Owner role missing';end if;
 b:=public.admin_workspace('load')->'blocks'->0;page:=b->>'page_key';block:=b->>'block_key';rev:=(b->>'revision')::integer;
 perform public.admin_workspace('save',jsonb_build_object('page',page,'block',block,'revision',rev,'text','Staging draft'));
 if public.published_site_content(page)->>block='Staging draft' then raise exception 'Draft leaked publicly';end if;
 begin perform public.admin_workspace('publish',jsonb_build_object('page',page,'block',block,'revision',rev));raise exception 'Stale revision accepted';exception when serialization_failure then null;end;
 perform public.admin_workspace('publish',jsonb_build_object('page',page,'block',block,'revision',rev+1));
 if public.published_site_content(page)->>block is distinct from 'Staging draft' then raise exception 'Publish failed';end if;
 perform public.admin_workspace('unpublish',jsonb_build_object('page',page,'block',block,'revision',rev+2));
 if public.published_site_content(page)?block then raise exception 'Original reset failed';end if;
 perform public.admin_workspace('review',jsonb_build_object('id',current_setting('test.farm_request'),'revision',0,'decision','approved','note','staging test'));
end$$;
reset role;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000009',true);
set local role authenticated;
do $$declare row jsonb;begin
 for row in select value from jsonb_array_elements(public.farm_support_directory()) loop
  if row?'game_uid' then raise exception 'Directory exposed UID';end if;
 end loop;
end$$;
reset role;
rollback;
