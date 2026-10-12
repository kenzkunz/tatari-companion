-- Run in staging after migration 012. No actual images are uploaded here.
begin;
insert into auth.users(id) values('00000000-0000-4000-8000-000000000012') on conflict(id) do nothing;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000012',true);
set local role authenticated;
do $$begin
 begin perform public.admin_guide_media('export');raise exception 'Export access bypass';exception when insufficient_privilege then null;end;
 begin perform public.admin_guide_media('set_box','{"page":"events/sparkly-spa.html","block":"note-2","revision":0,"kind":"info"}');raise exception 'Box access bypass';exception when insufficient_privilege then null;end;
 begin perform 1 from public.site_page_banners;raise exception 'Private banner table readable';exception when insufficient_privilege then null;end;
end$$;
reset role;
select set_config('request.jwt.claim.sub','f95bfea9-d7d3-49f5-827a-646c11f32ffb',true);
set local role authenticated;
do $$declare pg text;blk text;rev integer;begin
 select t->>'page_key',t->>'block_key' into pg,blk from jsonb_array_elements(public.admin_workspace('load')->'blocks') t where t->>'block_key' like 'note-%' limit 1;
 if pg is null then raise exception 'Apply migration 010 first';end if;
 select coalesce((t->>'revision')::integer,0) into rev from jsonb_array_elements(public.admin_guide_media('load')->'boxes') t where t->>'page_key'=pg and t->>'block_key'=blk;rev:=coalesce(rev,0);
 perform public.admin_guide_media('set_box',jsonb_build_object('page',pg,'block',blk,'revision',rev,'kind','disclaimer'));
 if public.public_guide_media(pg)->'boxes'->>blk is distinct from 'disclaimer' then raise exception 'Box publish failed';end if;
 begin perform public.admin_guide_media('set_box',jsonb_build_object('page',pg,'block',blk,'revision',rev,'kind','info'));raise exception 'Stale box revision accepted';exception when serialization_failure then null;end;
 begin perform public.admin_guide_media('draft_banner',jsonb_build_object('page',pg,'revision',0,'path','../../outside.svg'));raise exception 'Invalid banner path accepted';exception when raise_exception then if sqlerrm='Invalid banner path accepted' then raise;end if;end;
end$$;
reset role;
rollback;
