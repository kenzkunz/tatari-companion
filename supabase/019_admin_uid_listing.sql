begin;
alter table public.farm_support_listings add column if not exists admin_note text not null default '';
alter table public.farm_support_listings add column if not exists deleted_at timestamptz;
create or replace function public.admin_farm_listings(p_action text,p_payload jsonb default '{}') returns jsonb language plpgsql security definer set search_path=pg_catalog as $$
declare r public.farm_support_listings; uid text; crop integer; bonus integer; note text; target uuid;
begin
 if not public.is_site_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
 if p_action='load' then return (select coalesce(jsonb_agg(to_jsonb(l) order by verified_at desc),'[]') from public.farm_support_listings l); end if;
 if p_action in ('create','edit','notes') then
  note:=coalesce(p_payload->>'note',''); if length(note)>1000 then raise exception 'Notes must be 1000 characters or fewer'; end if;
 end if;
 if p_action in ('create','edit') then
  uid:=trim(p_payload->>'uid');crop:=(p_payload->>'crop')::integer;bonus:=(p_payload->>'bonus')::integer;
  if uid is null or uid !~ '^[1-9][0-9]{0,19}$' or crop is null or crop not between 2 and 7 or bonus is null or bonus not between 0 and 263 then raise exception 'Enter a valid UID, fruit and bonus (0–263)'; end if;
 end if;
 if p_action='create' then
  insert into public.farm_support_listings(game_uid,crop_id,bonus,admin_note) values(uid,crop,bonus,note) returning id into target;
 else
  target:=(p_payload->>'id')::uuid;select * into r from public.farm_support_listings where id=target for update;
  if not found then raise exception 'Listing no longer exists';end if;
  case p_action
   when 'edit' then update public.farm_support_listings set game_uid=uid,crop_id=crop,bonus=bonus,admin_note=note,verified_at=now() where id=target;
   when 'notes' then update public.farm_support_listings set admin_note=note where id=target;
   when 'hide' then update public.farm_support_listings set enabled=false where id=target;
   when 'show' then update public.farm_support_listings set enabled=true where id=target and deleted_at is null;
   when 'restore' then update public.farm_support_listings set enabled=true,deleted_at=null where id=target;
   when 'delete' then update public.farm_support_listings set enabled=false,deleted_at=now() where id=target;
   when 'purge' then
    if r.deleted_at is null then raise exception 'Move the listing to Deleted first';end if;
    delete from public.farm_support_listings where id=target;
   else raise exception 'Unknown listing action';
  end case;
 end if;
 insert into public.site_admin_audit(actor,action,target,details) values(auth.uid(),'uid_listing_'||p_action,target::text,jsonb_build_object('source','admin'));
 return jsonb_build_object('id',target);
end $$;
revoke all on function public.admin_farm_listings(text,jsonb) from public,anon;
grant execute on function public.admin_farm_listings(text,jsonb) to authenticated;
notify pgrst,'reload schema';
commit;
