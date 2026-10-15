begin;
alter table public.farm_support_listings add column if not exists revision integer not null default 0;
update public.farm_support_listings set enabled=false where deleted_at is not null and enabled;
alter table public.farm_support_listings add constraint farm_deleted_not_public check(deleted_at is null or not enabled);
create function public.farm_listing_revision() returns trigger language plpgsql set search_path=pg_catalog as $$begin new.revision:=old.revision+1;return new;end$$;
create trigger farm_listing_revision before update on public.farm_support_listings for each row execute function public.farm_listing_revision();
-- Keep the legacy approval and visibility routes consistent with the new state model.
do $patch$ declare body text;begin
 body:=pg_get_functiondef('public.admin_workspace(text,jsonb)'::regprocedure);
 if position('enabled=true,verified_at=now()' in body)=0 then raise exception 'Approval function changed; review migration before applying';end if;
 body:=replace(body,'enabled=true,verified_at=now()','enabled=true,deleted_at=null,verified_at=now()');
 body:=replace(body,'set enabled=(p_payload->>''enabled'')::boolean where id=', 'set enabled=(p_payload->>''enabled'')::boolean,deleted_at=case when (p_payload->>''enabled'')::boolean then null else deleted_at end where id=');
 execute body;
end $patch$;
create or replace function public.admin_farm_listings(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.farm_support_listings; after_row public.farm_support_listings;uid text;crop integer;v_bonus integer;note text;target uuid;before_value jsonb;begin
 if not public.is_site_admin() then raise exception 'Administrator access required' using errcode='42501';end if;
 if p_action='load' then return (select coalesce(jsonb_agg(to_jsonb(l) order by verified_at desc),'[]') from public.farm_support_listings l);end if;
 if p_action='history' then return (select coalesce(jsonb_agg(to_jsonb(a) order by id desc),'[]') from (select * from public.site_admin_audit where action like 'uid_listing_%' and (site_admin_audit.target=p_payload->>'id' or details->>'replacement_id'=p_payload->>'id') order by id desc limit 50)a);end if;
 if p_action in ('create','edit','notes') then note:=coalesce(p_payload->>'note','');if length(note)>1000 then raise exception 'Notes must be 1000 characters or fewer';end if;end if;
 if p_action in ('create','edit') then
 uid:=trim(p_payload->>'uid');crop:=(p_payload->>'crop')::integer;v_bonus:=(p_payload->>'bonus')::integer;
 if uid is null or uid !~ '^[1-9][0-9]{0,19}$' or crop is null or crop not between 2 and 7 or v_bonus is null or v_bonus not between 0 and 263 then raise exception 'Enter a valid UID, fruit and bonus (0–263)';end if;end if;
 if p_action='create' then insert into public.farm_support_listings(game_uid,crop_id,bonus,admin_note) values(uid,crop,v_bonus,note) returning * into after_row;target:=after_row.id;
 else
 target:=(p_payload->>'id')::uuid;select * into r from public.farm_support_listings where id=target for update;if not found then raise exception 'Listing no longer exists';end if;
 if (p_payload->>'revision')::integer is distinct from r.revision then raise exception 'Listing changed. Refresh and reopen it before saving.' using errcode='40001';end if;before_value:=to_jsonb(r);
 case p_action
 when 'edit' then
  if uid<>r.game_uid or crop<>r.crop_id then
   insert into public.farm_support_listings(game_uid,crop_id,bonus,admin_note,enabled,deleted_at) values(uid,crop,v_bonus,note,r.enabled,r.deleted_at) returning * into after_row;
   update public.farm_support_listings set enabled=false,deleted_at=coalesce(deleted_at,now()) where id=target;
  else update public.farm_support_listings set bonus=v_bonus,admin_note=note,verified_at=now() where id=target returning farm_support_listings.* into after_row;end if;
 when 'notes' then update public.farm_support_listings set admin_note=note where id=target returning * into after_row;
 when 'hide' then update public.farm_support_listings set enabled=false where id=target returning * into after_row;
 when 'show' then update public.farm_support_listings set enabled=true where id=target and deleted_at is null returning * into after_row;
 when 'restore' then update public.farm_support_listings set enabled=true,deleted_at=null where id=target returning * into after_row;
 when 'delete' then update public.farm_support_listings set enabled=false,deleted_at=now() where id=target returning * into after_row;
 when 'purge' then if r.deleted_at is null then raise exception 'Move the listing to Deleted first';end if;delete from public.farm_support_listings where id=target;
 else raise exception 'Unknown listing action';end case;end if;
 insert into public.site_admin_audit(actor,action,target,details) values(auth.uid(),'uid_listing_'||p_action,target::text,jsonb_build_object('before',before_value,'after',case when after_row.id is null then null else to_jsonb(after_row) end,'replacement_id',case when after_row.id<>target then after_row.id end));
 return jsonb_build_object('id',coalesce(after_row.id,target));
exception when unique_violation then raise exception 'That UID and fruit already exist. Edit or restore the existing listing instead.';end$$;
-- Every public reader now excludes deleted rows, independently of enabled.
do $patch$ declare signature text;body text;begin
 foreach signature in array array['public.farm_support_directory()','public.reveal_farm_support(uuid)','public.report_farm_support(uuid,text)'] loop
 body:=pg_get_functiondef(signature::regprocedure);
 body:=replace(body,'where l.enabled group','where l.enabled and l.deleted_at is null group');
 body:=replace(body,'where id=p_id and enabled','where id=p_id and deleted_at is null and enabled');execute body;end loop;
end $patch$;
notify pgrst,'reload schema';commit;
